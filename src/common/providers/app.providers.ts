import { Provider } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { IsAutoIncrementalConstraint } from '../constraints/is-auto-incremental.constraint';
import { IsExistingIdsConstraint } from '../constraints/is-existing-ids.constraint';
import { IsUniqueConstraint } from '../constraints/is-unique.constraint';
import { AppExceptionFilter } from '../filters/app-exception.filter';
import { AppAuthGuard } from '../guards/app-auth.guard';
import { TransformInterceptor } from '../interceptors/transform.interceptor';
import { ValidationPipeFactory } from '../utils/pipes/validation-pipe-factory';

/**
 * Global providers applied across all modules.
 */
export const AppProviders: Provider[] = [
  /**
   * Applies route throttling globally.
   */
  {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
  /**
   * Applies public/API-key/JWT auth policy globally.
   */
  {
    provide: APP_GUARD,
    useClass: AppAuthGuard,
  },
  /**
   * Standardizes successful response payload shape.
   */
  {
    provide: APP_INTERCEPTOR,
    useClass: TransformInterceptor,
  },
  /**
   * Standardizes exception response payload shape.
   */
  {
    provide: APP_FILTER,
    useClass: AppExceptionFilter,
  },
  /**
   * Enforces global DTO validation and sanitization.
   */
  {
    provide: APP_PIPE,
    useFactory: ValidationPipeFactory,
  },
  IsAutoIncrementalConstraint,
  IsExistingIdsConstraint,
  IsUniqueConstraint,
];
