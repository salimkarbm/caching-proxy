import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ProxyService } from './proxy.service';
import { CliService } from './cli.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const args = process.argv;

  const cliService = app.get(CliService);

  // Set CLI arguments
  cliService.setArgs(args);

  // Get proxy port
  const proxyPort = cliService.getArg('port') as string;

  // Get origin port
  const originPort = cliService.getArg('origin') as string;

  // Start the proxy server
  if (proxyPort) {
    const proxyService = app.get(ProxyService);
    proxyService.createProxyServer(parseInt(proxyPort, 10));
  }

  const PORT = process.env.PORT || originPort?.split(':').pop();
  await app.listen(PORT ?? 3000);
}
bootstrap();
