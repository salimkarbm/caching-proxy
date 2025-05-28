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
  private readonly logger = new Logger(AppModule.name);
  onModuleInit() {
    // Log a message when the server has started
    const port = process.env.PORT || 3000;

    this.logger.log(`

    Server is running on http://localhost:${port}
    `);
  }
}
