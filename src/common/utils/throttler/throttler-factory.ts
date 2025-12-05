import { ConfigService } from '@nestjs/config';
import { ThrottlerAsyncOptions } from '@nestjs/throttler';

/**
 * Async factory used by ThrottlerModule.forRootAsync.
 */
export const ThrottlerFactory: ThrottlerAsyncOptions = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => [
    {
      ttl: configService.get<number>('throttle.ttl', 60000),
      limit: configService.get<number>('throttle.limit', 60),
    },
  ],
};
