import { existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';

import { Injectable, NotFoundException } from '@nestjs/common';

import { LOGGER_FILE } from '../../common/utils/logger/logger-factory';

@Injectable()
export class LogsService {
  /**
   * Returns current application log file content.
   */
  async getLog(): Promise<string> {
    /**
     * Ensures log file exists before reading.
     */
    if (!existsSync(LOGGER_FILE)) {
      throw new NotFoundException('Log file not found');
    }

    return fs.readFile(LOGGER_FILE, 'utf8');
  }

  /**
   * Clears current application log file content.
   */
  async clearLog(): Promise<void> {
    /**
     * Ensures log file exists before clearing.
     */
    if (!existsSync(LOGGER_FILE)) {
      throw new NotFoundException('Log file not found');
    }

    await fs.writeFile(LOGGER_FILE, '');
  }
}
