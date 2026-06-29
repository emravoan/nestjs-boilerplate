import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions, TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Builds TypeORM connection settings from centralized config.
 */
function buildTypeOrmOptions(configService: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    username: configService.get<string>('database.username'),
    password: configService.get<string>('database.password'),
    database: configService.get<string>('database.name'),
    autoLoadEntities: true,
    synchronize: false,
  };
}

/**
 * Async factory used by TypeOrmModule.forRootAsync.
 */
export const TypeOrmFactory: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => buildTypeOrmOptions(configService),
};
