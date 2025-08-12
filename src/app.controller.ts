import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  @Get('/api/cache')
  getCache() {
    return;
  }

  @Get('/_proxy_stats')
  getStats() {
    return;
  }

  @Get('/_proxy_purge/*key')
  purgeCache() {
    return;
  }
}
