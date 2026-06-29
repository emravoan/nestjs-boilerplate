import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import { ApiModule } from './api/api.module';
import { AppController } from './app.controller';
import { StorageModule } from './common/modules/storage.module';
import { AppProviders } from './common/providers/app.providers';
import { LoggerFactory } from './common/utils/logger/logger-factory';
import { ThrottlerFactory } from './common/utils/throttler/throttler-factory';
import { TypeOrmFactory } from './common/utils/typeorm/typeorm-factory';
import appConfig from './config/app.config';
import { validateConfig } from './config/config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateConfig,
    }),
    LoggerModule.forRootAsync(LoggerFactory),
    TypeOrmModule.forRootAsync(TypeOrmFactory),
    ThrottlerModule.forRootAsync(ThrottlerFactory),
    StorageModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [...AppProviders],
})
export class AppModule {}
