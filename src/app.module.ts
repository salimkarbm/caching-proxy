import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProxyService } from './proxy.service';
import { CliService } from './cli.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ProxyService, CliService],
  exports: [ProxyService, CliService],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly cliService: CliService,
  ) {}
  private readonly logger = new Logger(AppModule.name);
  onModuleInit() {
    const PORT = process.env.PORT || 3000;
    const originPort = this.cliService.getArg('origin') as string;
    const port = originPort?.split(':').pop() || PORT;

    this.logger.log(`

    Server is running on http://localhost:${port}
    `);
  }
}
