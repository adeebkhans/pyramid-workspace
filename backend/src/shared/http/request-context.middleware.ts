import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Stamps every request with a correlation id (honouring one supplied upstream
 * by a proxy) and echoes it back on the response. Log lines and error bodies
 * carry the same id, which is what makes a production incident traceable.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const inbound = request.headers[REQUEST_ID_HEADER];
    const requestId = (Array.isArray(inbound) ? inbound[0] : inbound) || randomUUID();

    request.headers[REQUEST_ID_HEADER] = requestId;
    response.setHeader(REQUEST_ID_HEADER, requestId);

    next();
  }
}
