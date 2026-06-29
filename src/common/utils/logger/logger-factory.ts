import * as fs from 'node:fs';
import * as path from 'node:path';

import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModuleAsyncParams } from 'nestjs-pino';
import pino from 'pino';
import * as rfs from 'rotating-file-stream';

export const LOGGER_DIR: string = path.resolve(process.cwd(), 'logs');
export const LOGGER_FILE: string = `${LOGGER_DIR}/app.log`;

/**
 * Async logger factory that persists HTTP logs to rotating files.
 */
export const LoggerFactory: LoggerModuleAsyncParams = {
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const isProd = config.get<string>('app.env') === 'production';

    if (!fs.existsSync(LOGGER_DIR)) {
      fs.mkdirSync(LOGGER_DIR, { recursive: true });
    }

    const stream = rfs.createStream(
      (time) => {
        if (!time) return 'app.log';
        const date = new Date(time);
        return `app-${date.toISOString().slice(0, 10)}.log.gz`;
      },
      {
        path: LOGGER_DIR,
        maxFiles: 30,
        interval: '1d',
        compress: 'gzip',
      },
    );

    return {
      pinoHttp: {
        /**
         * Suppresses noisy info/debug logs; keeps warn/error for special/error cases.
         */
        level: 'warn',
        autoLogging: false,
        timestamp: pino.stdTimeFunctions.isoTime,
        customProps: () => ({}),
        customLogLevel: (req, res, err) => {
          if (res.statusCode >= 500 || err) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
        ...(isProd
          ? { stream }
          : {
              transport: {
                target: 'pino-pretty',
                options: {
                  destination: LOGGER_FILE,
                  mkdir: true,
                  sync: false,
                  translateTime: 'yyyy-mm-dd HH:MM:ss',
                  ignore: 'pid,hostname,req,res,responseTime',
                  messageFormat: '{if ip}{method} {url} from {ip} - {end}{msg}',
                  colorize: false,
                  singleLine: true,
                },
              },
            }),
      },
      forRoutes: [{ method: RequestMethod.ALL, path: '*path' }],
      exclude: [],
    };
  },
};
