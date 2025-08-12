import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // private handleStatsRequest(res: http.ServerResponse) {
  //   const stats = {
  //     uptime: process.uptime(),
  //     requests: this.requestCount,
  //     cacheHits: this.cacheHits,
  //     cacheHitRate:
  //       this.requestCount === 0
  //         ? '0.00%'
  //         : ((this.cacheHits / this.requestCount) * 100).toFixed(2) + '%',
  //     cacheSize: this.cache.keys().length,
  //     memoryUsage: process.memoryUsage(),
  //   };
  //   res.writeHead(200, { 'Content-Type': 'application/json' });
  //   res.end(JSON.stringify(stats, null, 2));
  // }
  // private async handleRequest(
  //   req: http.IncomingMessage,
  //   res: http.ServerResponse,
  // ) {
  //   try {
  //     // Always set connection close so clients (curl) won't hang waiting for keep-alive
  //     res.setHeader('Connection', 'close');
  //     const cacheKey = this.getCacheKey(req);
  //     const cachedResponse = this.cache.get(cacheKey) as CacheEntry | undefined;
  //     if (cachedResponse) {
  //       this.cacheHits++;
  //       this.logger.debug(`Cache hit for ${cacheKey}`);
  //       res.writeHead(cachedResponse.statusCode || 200, {
  //         ...cachedResponse.headers,
  //         'X-Cache': 'HIT', // ✅ custom header
  //       });
  //       res.end(cachedResponse.body);
  //       return;
  //     }
  //     this.logger.debug(`Cache miss for ${cacheKey}`);
  //     res.setHeader('X-Cache', 'MISS');
  //     // Always set connection close so clients (curl) won't hang waiting for keep-alive
  //     //res.setHeader('Connection', 'close');
  //     // Rate limit hook (non-blocking in this example)
  //     if (this.isRateLimited(req)) {
  //       res.writeHead(429, { 'Content-Type': 'text/plain' });
  //       res.end('Too Many Requests');
  //       return;
  //     }
  //     // Forward and stream
  //     await this.proxyRequestAndCache(req, res, cacheKey);
  //   } catch (err) {
  //     this.logger.error('Request handling error', err);
  //     if (!res.headersSent) {
  //       res.writeHead(500, { 'Content-Type': 'text/plain' });
  //     }
  //     res.end('Internal Server Error');
  //   }
  // }
  //   private proxyRequest(
  //   req: http.IncomingMessage,
  //   res: http.ServerResponse,
  //   cacheKey: string,
  // ): Promise<void> {
  //   return new Promise<void>((resolve) => {
  //     const timeoutMs = this.TIMEOUT_MS;
  //     let timeoutId: NodeJS.Timeout | null = setTimeout(() => {
  //       this.logger.warn(
  //         `Request to ${req.url} timed out after ${timeoutMs}ms`,
  //       );
  //       if (!res.writableEnded) {
  //         res.writeHead(504, { 'Content-Type': 'text/plain' });
  //         res.end('Gateway Timeout');
  //       }
  //       // terminate client socket
  //       try {
  //         req.destroy();
  //       } catch (e) {
  //         /* ignore */
  //         this.logger.debug('WebSocket connection error', e);
  //       }
  //       resolve();
  //     }, timeoutMs);
  //     // Use once so each request sets a single listener
  //     this.proxy.once('proxyRes', (proxyRes: http.IncomingMessage) => {
  //       // Forward headers from origin (allowing client to get correct content-type, etc)
  //       try {
  //         // Remove hop-by-hop headers that could interfere
  //         const headersToRemove = [
  //           'connection',
  //           'keep-alive',
  //           'proxy-authenticate',
  //           'proxy-authorization',
  //           'te',
  //           'trailer',
  //           'transfer-encoding',
  //           'upgrade',
  //         ];
  //         headersToRemove.forEach(
  //           (h) => proxyRes.headers && delete proxyRes.headers[h],
  //         );
  //         // Ensure status and headers are forwarded if not already
  //         if (!res.headersSent) {
  //           res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
  //         }
  //       } catch (e) {
  //         this.logger.debug('Error forwarding headers', e);
  //       }
  //       // Only attempt to cache GET responses and only small ones
  //       const shouldCache = req.method?.toUpperCase() === 'GET';
  //       let chunks: Buffer[] = [];
  //       let totalSize = 0;
  //       const onData = (chunk: Buffer) => {
  //         // stream chunk to client immediately (proxy already pipes, but we ensure piping)
  //         totalSize += chunk.length;
  //         if (shouldCache && totalSize <= this.MAX_CACHE_SIZE) {
  //           chunks.push(chunk);
  //         } else if (shouldCache && totalSize > this.MAX_CACHE_SIZE) {
  //           // stop collecting further for caching to save memory
  //           chunks = [];
  //         }
  //       };
  //       const onEnd = () => {
  //         if (timeoutId) {
  //           clearTimeout(timeoutId);
  //           timeoutId = null;
  //         }
  //         // Cache only if small enough and 2xx
  //         if (
  //           shouldCache &&
  //           totalSize > 0 &&
  //           totalSize <= this.MAX_CACHE_SIZE &&
  //           proxyRes.statusCode &&
  //           proxyRes.statusCode >= 200 &&
  //           proxyRes.statusCode < 300
  //         ) {
  //           console.log(this.MAX_CACHE_SIZE);
  //           const body = Buffer.concat(chunks);
  //           this.cache.set(cacheKey, {
  //             headers: proxyRes.headers,
  //             body,
  //             statusCode: proxyRes.statusCode,
  //           });
  //           this.logger.debug(
  //             `Cached response for ${cacheKey} (${totalSize} bytes)`,
  //           );
  //         } else if (shouldCache && totalSize > this.MAX_CACHE_SIZE) {
  //           this.logger.debug(
  //             `Skipped caching ${cacheKey}, size ${totalSize} bytes`,
  //           );
  //         }
  //         // Ensure client response ended
  //         if (!res.writableEnded) {
  //           res.end();
  //         }
  //         cleanup();
  //         resolve();
  //       };
  //       const onError = (err: Error) => {
  //         this.logger.error(
  //           `Error in proxyRes stream for ${req.url}: ${err.message}`,
  //         );
  //         if (timeoutId) {
  //           clearTimeout(timeoutId);
  //           timeoutId = null;
  //         }
  //         if (!res.headersSent) {
  //           res.writeHead(502, { 'Content-Type': 'text/plain' });
  //         }
  //         if (!res.writableEnded) res.end('Bad Gateway');
  //         cleanup();
  //         resolve();
  //       };
  //       // add events
  //       proxyRes.on('data', onData);
  //       proxyRes.on('end', onEnd);
  //       proxyRes.on('error', onError);
  //       // Pipe proxyRes to client if not automatically piped
  //       // http-proxy usually pipes for you, but ensure it's piped:
  //       try {
  //         // If the proxy hasn't already piped, pipe now:
  //         // (this is safe: pipe will be ignored if already piped)
  //         (proxyRes as any).pipe?.(res);
  //       } catch (e) {
  //         this.logger.debug('Error piping proxyRes to client', e);
  //         // ignore
  //       }
  //       // Cleanup helper
  //       function cleanup() {
  //         proxyRes.removeListener('data', onData);
  //         proxyRes.removeListener('end', onEnd);
  //         proxyRes.removeListener('error', onError);
  //       }
  //     });
  //     // Preserve the original path & query
  //     //const targetUrl = `${this.originBaseUrl}${req.url}`;
  //     // Proxy the web request
  //     this.proxy.web(
  //       req,
  //       res,
  //       {
  //         target: this.originBaseUrl,
  //         changeOrigin: true,
  //         timeout: this.TIMEOUT_MS,
  //       },
  //       (err) => {
  //         // callback called when proxy.web errors out
  //         if (timeoutId) {
  //           clearTimeout(timeoutId);
  //           timeoutId = null;
  //         }
  //         this.logger.error(
  //           `Proxy error for ${req.url}: ${err?.message || err}`,
  //         );
  //         if (!res.headersSent) {
  //           res.writeHead(502, { 'Content-Type': 'text/plain' });
  //         }
  //         if (!res.writableEnded) res.end('Bad Gateway');
  //         resolve();
  //       },
  //     );
  //     // If client closes early, stop waiting/cleanup
  //     const onClose = () => {
  //       if (timeoutId) {
  //         clearTimeout(timeoutId);
  //         timeoutId = null;
  //       }
  //       try {
  //         req.destroy();
  //       } catch (e) {
  //         // ignore
  //         this.logger.debug('WebSocket connection error', e);
  //       }
  //       resolve();
  //     };
  //     res.once('close', onClose);
  //   });
  // }
  // private readonly proxy: httpProxy;
  // private readonly cache: NodeCache;
  // private readonly logger = new Logger(ProxyService.name);
  // private server: http.Server;
  // private requestCount = 0;
  // private cacheHits = 0;
  // private originBaseUrl: string;
  // constructor() {
  //   // this.proxy = httpProxy.createProxyServer({
  //   //   xfwd: true, // Add x-forwarded headers
  //   //   secure: false, // For demo purposes only
  //   // });
  //   // this.cache = new NodeCache({
  //   //   stdTTL: 60, // Default cache TTL (60 seconds)
  //   //   checkperiod: 120, // Automatic cache pruning
  //   //   useClones: false, // Better performance for buffers
  //   // });
  //   //this.setupProxyEvents();
  // }
  // onModuleDestroy() {
  //   this.server?.close();
  //   this.proxy.close();
  // }
  // createProxyServer(
  //   port: number,
  //   origin: string,
  //   options?: { enableStatsEndpoint?: boolean },
  // ) {
  //   this.originBaseUrl = origin.replace(/\/$/, ''); // remove trailing slash
  //   this.server = http.createServer((req, res) => {
  //     this.requestCount++;
  //     if (options?.enableStatsEndpoint && req.url === '/_proxy_stats') {
  //       this.handleStatsRequest(res);
  //       return;
  //     }
  //     this.handleRequest(req, res);
  //   });
  //   this.server.listen(port, () => {
  //     this.logger.log(`Proxy server running at http://localhost:${port}`);
  //   });
  //   return this.server;
  // }
  // private async handleRequest(
  //   req: http.IncomingMessage,
  //   res: http.ServerResponse,
  // ) {
  //   try {
  //     const cacheKey = this.getCacheKey(req);
  //     const cachedResponse = this.cache.get(cacheKey) as CacheEntry;
  //     if (cachedResponse) {
  //       this.cacheHits++;
  //       this.logger.debug(`Cache hit for ${cacheKey}`);
  //       res.writeHead(cachedResponse.statusCode || 200, cachedResponse.headers);
  //       res.end(cachedResponse.body);
  //       return;
  //     }
  //     this.logger.debug(`Cache miss for ${cacheKey}`);
  //     if (await this.isRateLimited(req)) {
  //       res.writeHead(429);
  //       res.end('Too Many Requests');
  //       return;
  //     }
  //     // --- Timeout setup ---
  //     const timeoutMs = 8000; // 8 seconds
  //     const timeoutId = setTimeout(() => {
  //       this.logger.warn(
  //         `Request to ${req.url} timed out after ${timeoutMs}ms`,
  //       );
  //       res.writeHead(504, { 'Content-Type': 'text/plain' });
  //       res.end('Gateway Timeout');
  //       req.destroy(); // abort client request
  //     }, timeoutMs);
  //     // Attach proxy response listener for caching
  //     this.proxy.once('proxyRes', (proxyRes) => {
  //       const chunks: Buffer[] = [];
  //       proxyRes.on('data', (chunk) => chunks.push(chunk));
  //       proxyRes.on('end', () => {
  //         if (
  //           proxyRes.statusCode &&
  //           proxyRes.statusCode >= 200 &&
  //           proxyRes.statusCode < 300
  //         ) {
  //           this.cache.set(cacheKey, {
  //             headers: proxyRes.headers,
  //             body: Buffer.concat(chunks),
  //             statusCode: proxyRes.statusCode,
  //           });
  //           this.logger.debug(`Cached response for ${cacheKey}`);
  //         }
  //       });
  //     });
  //     // Forward request to origin
  //     await this.proxyRequest(req, res, cacheKey);
  //     // this.proxy.web(req, res, {
  //     //   target: this.originBaseUrl, // make sure this is set in createProxyServer
  //     //   changeOrigin: true,
  //     // });
  //     // Clear timeout when the client finishes
  //     res.on('close', () => clearTimeout(timeoutId));
  //   } catch (err) {
  //     this.logger.error('Request handling error', err);
  //     res.writeHead(500);
  //     res.end('Internal Server Error');
  //   }
  // }
  // private handleStatsRequest(res: http.ServerResponse) {
  //   const stats = {
  //     uptime: process.uptime(),
  //     requests: this.requestCount,
  //     cacheHits: this.cacheHits,
  //     cacheHitRate:
  //       ((this.cacheHits / this.requestCount) * 100).toFixed(2) + '%',
  //     cacheSize: this.cache.keys().length,
  //     memoryUsage: process.memoryUsage(),
  //   };
  //   res.writeHead(200, { 'Content-Type': 'application/json' });
  //   res.end(JSON.stringify(stats, null, 2));
  // }
  // private async proxyRequest(
  //   req: http.IncomingMessage,
  //   res: http.ServerResponse,
  //   cacheKey: string,
  // ) {
  //   return new Promise<void>((resolve) => {
  //     req.socket.setTimeout(10000);
  //     this.proxy.web(
  //       req,
  //       res,
  //       {
  //         target: this.originBaseUrl, // Always forward to origin
  //         changeOrigin: true,
  //         timeout: 8000,
  //       },
  //       (err) => {
  //         this.logger.error(`Proxy error for ${req.url}: ${err.message}`);
  //         res.writeHead(502);
  //         res.end('Bad Gateway');
  //         resolve();
  //       },
  //     );
  //     this.cacheResponse(req, cacheKey)
  //       .catch((err) => this.logger.error('Caching error', err))
  //       .finally(() => resolve());
  //   });
  // }
  // private isValidUrl(_url?: string): boolean {
  //   // No need to validate full URLs now
  //   //return true;
  //   if (!_url) return false;
  //   try {
  //     new URL(_url);
  //     return true;
  //   } catch {
  //     return false;
  //   }
  // }
  // private async cacheResponse(req: http.IncomingMessage, cacheKey: string) {
  //   const proxyRes$ = fromEvent(this.proxy, 'proxyRes') as Observable<
  //     [http.IncomingMessage, http.IncomingMessage, http.ServerResponse]
  //   >;
  //   const [proxyRes] = (await firstValueFrom(
  //     // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //     proxyRes$.pipe(filter(([_, request]) => request.url === req.url)),
  //   )) as [http.IncomingMessage, http.IncomingMessage, http.ServerResponse];
  //   const chunks: Buffer[] = [];
  //   proxyRes.on('data', (chunk) => chunks.push(chunk));
  //   await new Promise<void>((resolve) => {
  //     proxyRes.on('end', () => {
  //       if (
  //         proxyRes.statusCode &&
  //         proxyRes.statusCode >= 200 &&
  //         proxyRes.statusCode < 300
  //       ) {
  //         const body = Buffer.concat(chunks);
  //         this.cache.set(cacheKey, {
  //           headers: proxyRes.headers,
  //           body: body,
  //           statusCode: proxyRes.statusCode,
  //         });
  //         this.logger.debug(`Cached response for ${cacheKey}`);
  //       }
  //       resolve();
  //     });
  //   });
  // }
  // private setupProxyEvents() {
  //   this.proxy.on(
  //     'error',
  //     (
  //       err: Error,
  //       req: http.IncomingMessage,
  //       res: http.ServerResponse | net.Socket,
  //     ) => {
  //       this.logger.error(`Proxy Error: ${err.message}`);
  //       // Type guard for ServerResponse
  //       if ('headersSent' in res) {
  //         if (!res.headersSent) {
  //           res.writeHead(500);
  //         }
  //         res.end('Proxy Error');
  //       } else {
  //         // Handle Socket case (WebSocket connections)
  //         this.logger.debug('WebSocket connection error');
  //         res.destroy();
  //       }
  //     },
  //   );
  //   this.proxy.on(
  //     'econnreset',
  //     (
  //       err: Error,
  //       req: http.IncomingMessage,
  //       res: http.ServerResponse | net.Socket,
  //     ) => {
  //       this.logger.error(`Connection Reset: ${err.message}`);
  //       if ('headersSent' in res) {
  //         if (!res.headersSent) {
  //           res.writeHead(502, { Connection: 'close' });
  //         }
  //         res.end('Connection Reset');
  //       } else {
  //         res.destroy();
  //       }
  //     },
  //   );
  // }
  // private getCacheKey(req: http.IncomingMessage): string {
  //   return `${req.method}:${req.url}:${req.headers['accept'] || ''}`;
  // }
  // private async isRateLimited(req: http.IncomingMessage): Promise<boolean> {
  //   // Implement rate limiting logic
  //   // if (this.rateLimiter.isRateLimited(req.socket.remoteAddress)) {
  //   //   return true;
  //   // }
  //   // Could use Redis or other storage for distributed rate limiting
  //   await this.cacheResponse(req, this.getCacheKey(req));
  //   return false;
  // }
  // createProxyServer(port: number, options?: { enableStatsEndpoint?: boolean }) {
  //   this.server = http.createServer((req, res) => {
  //     this.requestCount++;
  //     // Handle stats endpoint
  //     if (options?.enableStatsEndpoint && req.url === '/_proxy_stats') {
  //       this.handleStatsRequest(res);
  //       return;
  //     }
  //     this.handleRequest(req, res);
  //   });
  //   this.server.listen(port, () => {
  //     this.logger.log(`Proxy server running at http://localhost:${port}`);
  //   });
  //   return this.server;
  // }
  // private isValidUrl(url?: string): boolean {
  //   if (!url) return false;
  //   try {
  //     new URL(url);
  //     return true;
  //   } catch {
  //     return false;
  //   }
  // }
  // private async handleRequest(
  //   req: http.IncomingMessage,
  //   res: http.ServerResponse,
  // ) {
  //   try {
  //     const cacheKey = this.getCacheKey(req);
  //     const cachedResponse = this.cache.get(cacheKey) as CacheEntry;
  //     if (cachedResponse) {
  //       this.cacheHits++;
  //       this.logger.debug(`Cache hit for ${cacheKey}`);
  //       res.writeHead(200, cachedResponse.headers);
  //       res.end(cachedResponse.body);
  //       return;
  //     }
  //     this.logger.debug(`Cache miss for ${cacheKey}`);
  //     res.on('finish', () => {
  //       this.cache.set(cacheKey, {
  //         headers: res.getHeaders(),
  //         body: res.getHeaders(),
  //         statusCode: res.statusCode,
  //       });
  //     });
  //     if (await this.isRateLimited(req)) {
  //       res.writeHead(429);
  //       res.end('Too Many Requests');
  //       return;
  //     }
  //     await this.proxyRequest(req, res, cacheKey);
  //   } catch (err) {
  //     this.logger.error('Request handling error', err);
  //     res.writeHead(500);
  //     res.end('Internal Server Error');
  //   }
  // }
  // private async handleRequest(
  //   req: http.IncomingMessage,
  //   res: http.ServerResponse,
  // ) {
  //   try {
  //     // Validate URL
  //     if (!this.isValidUrl(req.url)) {
  //       res.writeHead(400);
  //       res.end('Invalid URL');
  //       return;
  //     }
  //     // Check cache
  //     const cacheKey = this.getCacheKey(req);
  //     const cachedResponse = this.cache.get(cacheKey) as CacheEntry;
  //     if (cachedResponse) {
  //       this.cacheHits++;
  //       this.logger.debug(`Cache hit for ${cacheKey}`);
  //       res.writeHead(200, cachedResponse.headers);
  //       res.end(cachedResponse.body);
  //       return;
  //     }
  //     this.logger.debug(`Cache miss for ${cacheKey}`);
  //     // Rate limiting check
  //     if (await this.isRateLimited(req)) {
  //       res.writeHead(429);
  //       res.end('Too Many Requests');
  //       return;
  //     }
  //     // Process request
  //     await this.proxyRequest(req, res, cacheKey);
  //   } catch (err) {
  //     this.logger.error('Request handling error', err);
  //     res.writeHead(500);
  //     res.end('Internal Server Error');
  //   }
  // }
  // private async proxyRequest(
  //   req: http.IncomingMessage,
  //   res: http.ServerResponse,
  //   cacheKey: string,
  // ) {
  //   return new Promise<void>((resolve) => {
  //     // Set timeout
  //     req.socket.setTimeout(10000); // 10 seconds timeout
  //     // Proxy the request
  //     this.proxy.web(
  //       req,
  //       res,
  //       {
  //         target: req.url,
  //         changeOrigin: true,
  //         timeout: 8000, // 8 seconds proxy timeout
  //       },
  //       (err) => {
  //         this.logger.error(`Proxy error for ${req.url}: ${err.message}`);
  //         res.writeHead(502);
  //         res.end('Bad Gateway');
  //         resolve();
  //       },
  //     );
  //     // Cache response
  //     this.cacheResponse(req, cacheKey)
  //       .catch((err) => {
  //         this.logger.error('Caching error', err);
  //       })
  //       .finally(() => resolve());
  //   });
  // }
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
