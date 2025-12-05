import { Controller, Delete, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';

import { LogsService } from './logs.service';

@ApiTags('Logs')
@ApiBearerAuth()
@ApiSecurity('api-secret')
@ApiSecurity('csrf-token')
@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  /**
   * Returns raw application log file text.
   */
  @Get()
  getLog() {
    return this.logsService.getLog();
  }

  /**
   * Clears application log file content.
   */
  @Delete()
  clearLog(): void {
    this.logsService.clearLog();
  }
}
