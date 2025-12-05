import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';

import { CsrfService } from '../services/csrf.service';

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: PinoLogger,
    private readonly csrfService: CsrfService,
  ) {
    /**
     * Sets logger context for easier filtering in log files.
     */
    this.logger.setContext(AppExceptionFilter.name);
  }

  /**
   * Maps exceptions to a stable error payload used by client forms.
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<{ method?: string; url?: string; headers?: Record<string, unknown> }>();

    /**
     * Handles CSRF-like errors when middleware throws code EBADCSRFTOKEN.
     */
    if (
      exception === this.csrfService.invalidCsrfTokenError ||
      (exception &&
        typeof exception === 'object' &&
        'code' in exception &&
        (exception as { code?: string }).code === 'EBADCSRFTOKEN')
    ) {
      return res.status(HttpStatus.FORBIDDEN).json({
        code: 'EBADCSRFTOKEN',
        message: 'CSRF token invalid or expired',
        success: false,
        statusCode: HttpStatus.FORBIDDEN,
      });
    }

    /**
     * Handles HttpException while preserving custom payload (including errors array).
     */
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const message = exception.getResponse();
      const payload = (typeof message === 'string' ? { message } : { ...message }) as Record<string, unknown>;
      delete payload.error;

      /**
       * Persists server-side errors with stack and request metadata.
       */
      if (status >= Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
        this.logger.error(
          {
            statusCode: status,
            method: req.method,
            url: req.url,
            exception,
          },
          'An unexpected error occurred',
        );
      }

      return res.status(status).json({
        ...payload,
        success: false,
        statusCode: status,
      });
    }

    /**
     * Fallback for unknown exceptions.
     */
    this.logger.error(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        method: req.method,
        url: req.url,
        exception,
      },
      'Internal server error',
    );

    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      success: false,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
