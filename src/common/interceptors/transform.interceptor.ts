import { CallHandler, ExecutionContext, Injectable, NestInterceptor, StreamableFile } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RESPONSE_MESSAGE_KEY, SKIP_TRANSFORM_KEY } from '../constants/response.constants';

type RequestLike = {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  statusCode?: number;
  getHeader?: (name: string) => unknown;
};

type PaginatedShape<T> = {
  items: T[];
  pagination: {
    current: number;
    last: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
};

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, unknown> {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Wraps successful responses in a stable envelope unless bypass rules apply.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestLike>();
    const response = context.switchToHttp().getResponse<ResponseLike>();

    const skipTransform = this.reflector.getAllAndOverride<boolean>(SKIP_TRANSFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipTransform || this.isSseRequest(request)) {
      return next.handle();
    }

    const customMessage = this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      map((data) => {
        if (this.shouldBypassTransform(data, response)) {
          return data;
        }

        const statusCode = response.statusCode ?? 200;
        if (statusCode === 204 || statusCode === 304) {
          return data;
        }

        if (this.isAlreadyWrapped(data)) {
          return data;
        }

        const timestamp = new Date().toISOString();
        const path = request.url || '';
        const method = (request.method || 'GET').toUpperCase();
        const message = customMessage || this.defaultMessage(method, statusCode);

        if (this.isPaginated(data)) {
          return {
            success: true,
            statusCode,
            message,
            timestamp,
            path,
            data: Array.isArray(data.items) ? data.items : [],
            meta: data.pagination,
          };
        }

        return {
          success: true,
          statusCode,
          message,
          timestamp,
          path,
          data: this.normalizeData(data),
        };
      }),
    );
  }

  /**
   * Normalizes response data shape for single-item and list responses.
   */
  private normalizeData(data: unknown): unknown {
    /**
     * Preserve explicit null/empty string responses from handlers.
     */
    if (data === null || data === '') {
      return data;
    }

    /**
     * Keep list responses as arrays.
     */
    if (Array.isArray(data)) {
      return data;
    }

    /**
     * Default undefined single-item payloads to empty object.
     */
    if (data === undefined) {
      return {};
    }

    return data;
  }

  /**
   * Derives a default message from HTTP method and status.
   */
  private defaultMessage(method: string, statusCode: number): string {
    if (statusCode >= 200 && statusCode < 300) {
      if (method === 'POST') return 'Created successfully';
      if (method === 'PATCH' || method === 'PUT') return 'Updated successfully';
      if (method === 'DELETE') return 'Deleted successfully';
      return 'Request successful';
    }
    return 'Request processed';
  }

  /**
   * Detects response types that should remain unwrapped.
   */
  private shouldBypassTransform(data: unknown, response: ResponseLike): boolean {
    if (data instanceof StreamableFile) {
      return true;
    }

    if (Buffer.isBuffer(data) || data instanceof Uint8Array) {
      return true;
    }

    if (data && typeof data === 'object' && 'pipe' in data && typeof (data as { pipe: unknown }).pipe === 'function') {
      return true;
    }

    const contentDisposition = this.getHeaderValue(response.getHeader?.('content-disposition'));
    if (contentDisposition.includes('attachment')) {
      return true;
    }

    const contentType = this.getHeaderValue(response.getHeader?.('content-type'));
    if (
      contentType.includes('text/event-stream') ||
      contentType.includes('application/octet-stream') ||
      contentType.startsWith('image/') ||
      contentType.startsWith('video/') ||
      contentType.startsWith('audio/')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Checks whether the request is an SSE stream request.
   */
  private isSseRequest(request: RequestLike): boolean {
    const accept = request.headers?.accept;
    const value = Array.isArray(accept) ? accept.join(',') : accept || '';
    return value.toLowerCase().includes('text/event-stream');
  }

  /**
   * Normalizes response header values into lowercase strings.
   */
  private getHeaderValue(value: unknown): string {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }

    if (Array.isArray(value)) {
      return value.join(',').toLowerCase();
    }

    return '';
  }

  /**
   * Detects payloads already using the standardized response envelope.
   */
  private isAlreadyWrapped(data: unknown): boolean {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return false;
    }

    const value = data as Record<string, unknown>;
    return (
      typeof value.success === 'boolean' &&
      typeof value.statusCode === 'number' &&
      typeof value.timestamp === 'string' &&
      typeof value.path === 'string' &&
      'data' in value
    );
  }

  /**
   * Detects paginated payload structure for data/meta split formatting.
   */
  private isPaginated(data: unknown): data is PaginatedShape<unknown> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return false;
    }

    const value = data as Record<string, unknown>;
    if (!Array.isArray(value.items) || typeof value.pagination !== 'object' || !value.pagination) {
      return false;
    }

    const pagination = value.pagination as Record<string, unknown>;
    return (
      typeof pagination.current === 'number' &&
      typeof pagination.last === 'number' &&
      typeof pagination.limit === 'number' &&
      typeof pagination.total === 'number' &&
      typeof pagination.hasMore === 'boolean'
    );
  }
}
