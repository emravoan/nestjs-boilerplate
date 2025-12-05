import { Controller, Get } from '@nestjs/common';

import { Public } from './common/decorators/public.decorator';
import { ResponseMessage } from './common/decorators/response-message.decorator';

@Controller()
export class AppController {
  /**
   * Returns a lightweight health payload for uptime checks.
   */
  @Public()
  @ResponseMessage('Health check successful')
  @Get('health')
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
