import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as http from 'http';
import * as httpProxy from 'http-proxy';
import * as NodeCache from 'node-cache';
import * as net from 'net';
//import { Observable, fromEvent, filter, firstValueFrom } from 'rxjs';

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
  private originBaseUrl: string;

  // Tunables
  private readonly TIMEOUT_MS = 8000;
  private readonly MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5 MB
  private readonly CACHE_TTL = 60; // seconds

  constructor() {
    this.proxy = httpProxy.createProxyServer({
      xfwd: true,
      secure: false,
    });

    this.cache = new NodeCache({
      stdTTL: this.CACHE_TTL,
      checkperiod: 120,
      useClones: false,
    });

    this.setupProxyEvents();
  }

  onModuleDestroy() {
    this.server?.close();
    this.proxy.close();
  }

  createProxyServer(
    port: number,
    origin: string,
    options?: { enableStatsEndpoint?: boolean },
  ) {
    this.originBaseUrl = origin.replace(/\/$/, '');
    this.server = http.createServer((req, res) => {
      this.requestCount++;
      // Stats endpoint (always returns immediately)
      if (options?.enableStatsEndpoint && req.url === '/_proxy_stats') {
        this.handleStatsRequest(res);
        return;
      }

      if (req.url?.startsWith('/_proxy_purge')) {
        this.handlePurgeRequest(req, res);
        return;
      }
      this.handleRequest(req, res);
    });

    this.server.listen(port, () => {
      this.logger.log(`Proxy server running at http://localhost:${port}`);
      this.logger.log(`Forwarding to origin: ${this.originBaseUrl}`);
    });

    return this.server;
  }

  clearCache(): number {
    const count = this.cache.keys().length;
    this.cache.flushAll();
    this.logger.log(`Cleared all ${count} cache entries`);
    return count;
  }

  private handlePurgeRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const cacheKey = url.searchParams.get('key');

    if (!cacheKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing cache key parameter ?key=' }));
      return;
    }

    if (this.cache.del(cacheKey)) {
      this.logger.log(`Purged cache for key: ${cacheKey}`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: `Cache entry deleted: ${cacheKey}` }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Cache entry not found: ${cacheKey}` }));
    }
  }

  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) {
    try {
      res.setHeader('Connection', 'close'); // so curl doesn't hang

      const cacheKey = this.getCacheKey(req);
      const cachedResponse = this.cache.get(cacheKey) as CacheEntry | undefined;

      if (cachedResponse) {
        this.cacheHits++;
        this.logger.debug(`Cache hit for ${cacheKey}`);
        res.writeHead(cachedResponse.statusCode || 200, {
          ...cachedResponse.headers,
          'X-Cache': 'HIT',
        });
        res.end(cachedResponse.body);
        return;
      }

      this.logger.debug(`Cache miss for ${cacheKey}`);
      res.setHeader('X-Cache', 'MISS');

      if (this.isRateLimited(req)) {
        res.writeHead(429, { 'Content-Type': 'text/plain' });
        res.end('Too Many Requests');
        return;
      }

      // Forward request and cache response
      await this.proxyRequestAndCache(req, res, cacheKey);
    } catch (err) {
      this.logger.error('Request handling error', err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
      }
      res.end('Internal Server Error');
    }
  }

  private handleStatsRequest(res: http.ServerResponse) {
    const stats = {
      uptime: process.uptime() + ' seconds',
      requests: this.requestCount,
      cacheHits: this.cacheHits,
      cacheMisses: this.requestCount - this.cacheHits,
      cacheHitRate:
        this.requestCount > 0
          ? ((this.cacheHits / this.requestCount) * 100).toFixed(2) + '%'
          : '0%',
      cacheSize: this.cache.keys().length,
      memoryUsage: {
        rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + ' MB',
        heapUsed:
          (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + ' MB',
      },
      cachedKeys: this.cache.keys(), // so you can see what’s stored
    };

    res.writeHead(200, {
      'Content-Type': 'application/json',
      Connection: 'close',
    });
    res.end(JSON.stringify(stats, null, 2));
  }

  private async proxyRequestAndCache(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    cacheKey: string,
  ) {
    return new Promise<void>((resolve) => {
      req.socket.setTimeout(10000);
      this.proxy.once('proxyRes', (proxyRes) => {
        const chunks: Buffer[] = [];
        proxyRes.on('data', (chunk) => {
          chunks.push(chunk);
          res.write(chunk); // stream chunk to client
        });
        proxyRes.on('end', () => {
          res.end(); // finish client response
          if (
            proxyRes.statusCode &&
            proxyRes.statusCode >= 200 &&
            proxyRes.statusCode < 300
          ) {
            const body = Buffer.concat(chunks);
            this.cache.set(cacheKey, {
              headers: proxyRes.headers,
              body,
              statusCode: proxyRes.statusCode,
            });
            this.logger.debug(`Cached response for ${cacheKey}`);
          }
          resolve();
        });
        // Copy headers from origin
        Object.entries(proxyRes.headers).forEach(([key, value]) => {
          if (value !== undefined) res.setHeader(key, value as string);
        });
        res.writeHead(proxyRes.statusCode || 200);
      });
      this.proxy.web(
        req,
        res,
        {
          target: this.originBaseUrl,
          changeOrigin: true,
          selfHandleResponse: true, // intercept to stream & cache
        },
        (err) => {
          this.logger.error(`Proxy error for ${req.url}: ${err.message}`);
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'text/plain' });
          }
          res.end('Bad Gateway');
          resolve();
        },
      );
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
        if ('headersSent' in res) {
          if (!res.headersSent) {
            (res as http.ServerResponse).writeHead(500);
          }
          (res as http.ServerResponse).end('Proxy Error');
        } else {
          try {
            (res as net.Socket).destroy();
          } catch (e) {
            // ignore
            this.logger.debug('WebSocket connection error', e);
          }
        }
      },
    );
  }

  private getCacheKey(req: http.IncomingMessage): string {
    return `${req.method}:${req.url}:${req.headers['accept'] || ''}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private isRateLimited(_req: http.IncomingMessage): boolean {
    // Add rate limiting logic (Redis, token bucket, etc.)
    return false;
  }
}
