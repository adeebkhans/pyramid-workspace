import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

import { REQUEST_ID_HEADER } from './request-context.middleware';

/**
 * A single structured access log per request — method, path, status, duration
 * and correlation id.
 *
 * Deliberately narrow. Request logging belongs at the edge, in one place, so
 * services never reach for `console.log` and every line has the same shape for
 * a collector to parse.
 */
@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => this.write(request, response.statusCode, startedAt),
        error: () => this.write(request, response.statusCode || 500, startedAt),
      }),
    );
  }

  private write(request: Request, status: number, startedAt: bigint): void {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const requestId = request.headers[REQUEST_ID_HEADER];

    this.logger.log(
      `${request.method} ${request.originalUrl} ${status} ${elapsedMs.toFixed(1)}ms` +
        (requestId ? ` rid=${requestId}` : ''),
    );
  }
}
