import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as http from 'http';
import * as httpProxy from 'http-proxy';
import * as NodeCache from 'node-cache';
import * as net from 'net';
import { Observable, fromEvent, firstValueFrom } from 'rxjs';

interface CacheEntry {
  headers: http.IncomingHttpHeaders;
  body: Buffer;
  statusCode?: number;
}
@Injectable()
export class ProxyService implements OnModuleDestroy {
  private readonly proxy: httpProxy;
  private readonly cache: NodeCache;
  private readonly logger = new Logger(ProxyService.name);
  private server: http.Server;
  private requestCount = 0;
  private cacheHits = 0;

  constructor() {
    this.proxy = httpProxy.createProxyServer({
      xfwd: true, // Add x-forwarded headers
      secure: false, // For demo purposes only
    });

    this.cache = new NodeCache({
      stdTTL: 60, // Default cache TTL (60 seconds)
      checkperiod: 120, // Automatic cache pruning
      useClones: false, // Better performance for buffers
    });

    this.setupProxyEvents();
  }

  onModuleDestroy() {
    this.server?.close();
    this.proxy.close();
  }

  createProxyServer(port: number, options?: { enableStatsEndpoint?: boolean }) {
    this.server = http.createServer((req, res) => {
      this.requestCount++;
      // Handle stats endpoint
      if (options?.enableStatsEndpoint && req.url === '/_proxy_stats') {
        this.handleStatsRequest(res);
        return;
      }
      this.handleRequest(req, res);
    });

    this.server.listen(port, () => {
      this.logger.log(`Proxy server running at http://localhost:${port}`);
    });
    return this.server;
  }

  private handleStatsRequest(res: http.ServerResponse) {
    const stats = {
      uptime: process.uptime(),
      requests: this.requestCount,
      cacheHits: this.cacheHits,
      cacheHitRate:
        ((this.cacheHits / this.requestCount) * 100).toFixed(2) + '%',
      cacheSize: this.cache.keys().length,
      memoryUsage: process.memoryUsage(),
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats, null, 2));
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) {
    try {
      // Validate URL
      if (!this.isValidUrl(req.url)) {
        res.writeHead(400);
        res.end('Invalid URL');
        return;
      }

      // Check cache
      const cacheKey = this.getCacheKey(req);
      const cachedResponse = this.cache.get(cacheKey) as CacheEntry;

      if (cachedResponse) {
        this.cacheHits++;
        this.logger.debug(`Cache hit for ${cacheKey}`);
        res.writeHead(200, cachedResponse.headers);
        res.end(cachedResponse.body);
        return;
      }

      this.logger.debug(`Cache miss for ${cacheKey}`);

      // Rate limiting check
      if (await this.isRateLimited(req)) {
        res.writeHead(429);
        res.end('Too Many Requests');
        return;
      }

      // Process request
      await this.proxyRequest(req, res, cacheKey);
    } catch (err) {
      this.logger.error('Request handling error', err);
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  }

  private async proxyRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    cacheKey: string,
  ) {
    return new Promise<void>((resolve) => {
      // Set timeout
      req.socket.setTimeout(10000); // 10 seconds timeout

      // Proxy the request
      this.proxy.web(
        req,
        res,
        {
          target: req.url,
          changeOrigin: true,
          timeout: 8000, // 8 seconds proxy timeout
        },
        (err) => {
          this.logger.error(`Proxy error for ${req.url}: ${err.message}`);
          res.writeHead(502);
          res.end('Bad Gateway');
          resolve();
        },
      );

      // Cache response
      this.cacheResponse(req, cacheKey)
        .catch((err) => {
          this.logger.error('Caching error', err);
        })
        .finally(() => resolve());
    });
  }

  private async cacheResponse(req: http.IncomingMessage, cacheKey: string) {
    const proxyRes$ = fromEvent(this.proxy, 'proxyRes') as Observable<
      [http.IncomingMessage, http.IncomingMessage, http.ServerResponse]
    >;

    const [proxyRes, ,] = await firstValueFrom(
      proxyRes$.pipe(filter(([_, req]) => req.url === req.url)),
    );

    const chunks: Buffer[] = [];
    proxyRes.on('data', (chunk) => chunks.push(chunk));

    await new Promise<void>((resolve) => {
      proxyRes.on('end', () => {
        // Only cache successful responses
        if (
          proxyRes.statusCode &&
          proxyRes.statusCode >= 200 &&
          proxyRes.statusCode < 300
        ) {
          const body = Buffer.concat(chunks);
          this.cache.set(cacheKey, {
            headers: proxyRes.headers,
            body: body,
            statusCode: proxyRes.statusCode,
          });
          this.logger.debug(`Cached response for ${cacheKey}`);
        }
        resolve();
      });
    });
  }

  private setupProxyEvents() {
    this.proxy.on(
      'error',
      (
        err: Error,
        req: http.IncomingMessage,
        res: http.ServerResponse | net.Socket,
      ) => {
        this.logger.error(`Proxy Error: ${err.message}`);

        // Type guard for ServerResponse
        if ('headersSent' in res) {
          if (!res.headersSent) {
            res.writeHead(500);
          }
          res.end('Proxy Error');
        } else {
          // Handle Socket case (WebSocket connections)
          this.logger.debug('WebSocket connection error');
          res.destroy();
        }
      },
    );

    this.proxy.on(
      'econnreset',
      (
        err: Error,
        req: http.IncomingMessage,
        res: http.ServerResponse | net.Socket,
      ) => {
        this.logger.error(`Connection Reset: ${err.message}`);
        if ('headersSent' in res) {
          if (!res.headersSent) {
            res.writeHead(502, { Connection: 'close' });
          }
          res.end('Connection Reset');
        } else {
          res.destroy();
        }
      },
    );
  }

  private isValidUrl(url?: string): boolean {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private getCacheKey(req: http.IncomingMessage): string {
    return `${req.method}:${req.url}:${req.headers['accept'] || ''}`;
  }

  private async isRateLimited(req: http.IncomingMessage): Promise<boolean> {
    // Implement your rate limiting logic here
    // Could use Redis or other storage for distributed rate limiting
    await this.cacheResponse(req, this.getCacheKey(req));
    return false;
  }

  //   private readonly proxy = httpProxy.createProxyServer({});
  //   private readonly cache = new NodeCache({ stdTTL: 60 }); // Cache for 60 seconds
  //   private readonly logger = new Logger(ProxyService.name);

  //   createProxyServer(port: number) {
  //     const server = http.createServer((req, res) => {
  //       this.handleRequest(req, res);
  //     });
  //     server.listen(port, () => {
  //       this.logger.log(`

  //         Proxy server running at http://localhost:${port}
  //         `);
  //     });
  //     return server;
  //   }
  //   private handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  //     const cacheKey: string = req.url as string;
  //     const cachedResponse = this.cache.get(cacheKey) as {
  //       headers: http.IncomingHttpHeaders;
  //       body: Buffer;
  //     };
  //     if (cachedResponse) {
  //       this.logger.log(`Cache hit for ${cacheKey}`);
  //       res.writeHead(200, cachedResponse.headers);
  //       res.end(cachedResponse.body);
  //       return;
  //     }
  //     this.logger.log(`Cache miss for ${cacheKey}, fetching...`);
  //     this.proxy.web(req, res, { target: req.url, changeOrigin: true }, (err) => {
  //       this.logger.error('Proxy error', err);
  //       res.writeHead(502);
  //       res.end('Bad Gateway');
  //     });
  //     // Cache response data
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //     this.proxy.once('proxyRes', (proxyRes, req) => {
  //       let body = Buffer.from('');
  //       proxyRes.on('data', (chunk) => (body = Buffer.concat([body, chunk])));
  //       proxyRes.on('end', () => {
  //         this.cache.set(cacheKey, {
  //           headers: proxyRes.headers,
  //           body: body,
  //         });
  //       });
  //     });
  //   }
}
