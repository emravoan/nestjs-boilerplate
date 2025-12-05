import { VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { useContainer } from 'class-validator';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from '../../../app.module';
import { CsrfService } from '../../services/csrf.service';
import { CorsFactory } from '../cors/cors-factory';
import { SwaggerFactory } from '../swagger/swagger-factory';

/**
 * Creates and configures the Nest application instance.
 */
export async function AppFactory() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);
  const prefix = configService.get<string>('api.prefix', 'api');
  const apiVersion = configService.get<string>('api.version', 'v1');
  const defaultVersion = apiVersion.replace(/^v/i, '');
  const isProduction = configService.get<string>('app.env', 'development') === 'production';

  app.setGlobalPrefix(prefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion,
  });

  /**
   * Enables dependency injection in class-validator custom constraints.
   */
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  /**
   * Applies production-safe helmet defaults while keeping Swagger/dev assets usable.
   */
  if (isProduction) {
    app.use(helmet());
  } else {
    app.use(
      helmet({
        contentSecurityPolicy: false,
        crossOriginResourcePolicy: false,
      }),
    );
  }

  /**
   * Enables response compression for standard API payloads.
   */
  app.use(compression());

  /**
   * Parses request cookies before CSRF middleware validation.
   */
  app.use(cookieParser());

  /**
   * Enforces CSRF protection globally for unsafe HTTP methods.
   */
  const csrfService = app.get(CsrfService);
  app.use(csrfService.doubleCsrfProtection);

  /**
   * Applies runtime CORS policy (supports multiple origins in production).
   */
  app.enableCors(CorsFactory(configService));

  /**
   * Exposes interactive API docs in non-production environments.
   */
  SwaggerFactory(app, configService);

  return app;
}
