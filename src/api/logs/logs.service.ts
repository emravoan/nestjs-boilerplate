import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { Injectable, NotFoundException } from '@nestjs/common';

import { LOGGER_FILE } from '../../common/utils/logger/logger-factory';

@Injectable()
export class LogsService {
  /**
   * Returns current application log file content.
   */
  getLog(): string {
    /**
     * Ensures log file exists before reading.
     */
    if (!existsSync(LOGGER_FILE)) {
      throw new NotFoundException('Log file not found');
    }

    return readFileSync(LOGGER_FILE, 'utf8');
  }

  /**
   * Clears current application log file content.
   */
  clearLog(): void {
    /**
     * Ensures log file exists before clearing.
     */
    if (!existsSync(LOGGER_FILE)) {
      throw new NotFoundException('Log file not found');
    }

    writeFileSync(LOGGER_FILE, '');
  }
}
