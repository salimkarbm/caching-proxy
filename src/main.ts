import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CliService } from './cli.service';
import { ProxyService } from './proxy.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const proxyService = app.get(ProxyService);
  const args = process.argv;

  const cliService = app.get(CliService);

  // Set CLI arguments
  cliService.setArgs(args);

  // Get proxy port
  const proxyPort = cliService.getArg('port') as string;

  // Get origin
  const originUrl = cliService.getArg('origin') as string;

  const clearCacheFlag = cliService.getArg('clear-cache');
  console.log(clearCacheFlag);
  // If --clear-cache flag is provided
  if (clearCacheFlag !== undefined) {
    const count = proxyService.clearCache();
    console.log(`✅ Cleared ${count} cached entries`);
    await app.close();
    process.exit(0);
  }

  // Start the proxy
  if (proxyPort && originUrl) {
    const proxyServer = proxyService.createProxyServer(
      parseInt(proxyPort, 10),
      originUrl,
      { enableStatsEndpoint: true },
    );
    proxyServer.on('error', (err) => {
      console.error(err);
    });
    proxyServer.on('close', () => {
      app.close();
    });
  }

  const PORT = originUrl?.split(':').pop() || process.env.PORT;
  await app.listen(PORT ?? 3000);
}
bootstrap();
