import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Error as MongooseError } from 'mongoose';

import {
  ConflictingStateError,
  DomainError,
  InvalidIdentifierError,
  ResourceNotFoundError,
  UnprocessableRequestError,
} from '../errors/domain.errors';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    path: string;
    method: string;
    timestamp: string;
    requestId?: string;
  };
}

/**
 * The one place in the service that knows how a failure becomes an HTTP
 * response. Domain errors, Mongoose errors and stray exceptions all funnel
 * through here and leave in exactly the same envelope, so clients only have to
 * learn a single error shape.
 */
@Catch()
export class ErrorResponseFilter implements ExceptionFilter {
  private readonly logger = new Logger(ErrorResponseFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const { status, code, message, details } = this.translate(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.originalUrl} → ${status} ${code}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.debug(`${request.method} ${request.originalUrl} → ${status} ${code}: ${message}`);
    }

    const body: ApiErrorBody = {
      error: { code, message, ...(details === undefined ? {} : { details }) },
      meta: {
        path: request.originalUrl,
        method: request.method,
        timestamp: new Date().toISOString(),
        requestId: response.getHeader('x-request-id')?.toString(),
      },
    };

    response.status(status).json(body);
  }

  private translate(exception: unknown): {
    status: number;
    code: string;
    message: string;
    details?: unknown;
  } {
    if (exception instanceof ResourceNotFoundError) {
      return { status: HttpStatus.NOT_FOUND, code: exception.code, message: exception.message, details: exception.details };
    }

    if (exception instanceof InvalidIdentifierError) {
      return { status: HttpStatus.BAD_REQUEST, code: exception.code, message: exception.message, details: exception.details };
    }

    if (exception instanceof ConflictingStateError) {
      return { status: HttpStatus.CONFLICT, code: exception.code, message: exception.message, details: exception.details };
    }

    if (exception instanceof UnprocessableRequestError) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: exception.code,
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof DomainError) {
      return { status: HttpStatus.BAD_REQUEST, code: exception.code, message: exception.message, details: exception.details };
    }

    if (exception instanceof MongooseError.ValidationError) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        code: 'SCHEMA_VALIDATION_FAILED',
        message: 'The document failed schema validation',
        details: Object.fromEntries(Object.entries(exception.errors).map(([field, err]) => [field, err.message])),
      };
    }

    if (exception instanceof MongooseError.CastError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        code: 'INVALID_IDENTIFIER',
        message: `"${String(exception.value)}" is not a valid ${exception.kind}`,
      };
    }

    if (this.isDuplicateKeyError(exception)) {
      return {
        status: HttpStatus.CONFLICT,
        code: 'DUPLICATE_KEY',
        message: 'A record with those unique values already exists',
        details: exception.keyValue,
      };
    }

    if (exception instanceof HttpException) {
      const payload = exception.getResponse();
      const isObject = typeof payload === 'object' && payload !== null;
      const rawMessage = isObject ? (payload as Record<string, unknown>).message : payload;

      return {
        status: exception.getStatus(),
        code: this.codeForStatus(exception.getStatus()),
        message: Array.isArray(rawMessage) ? 'Request validation failed' : String(rawMessage ?? exception.message),
        details: Array.isArray(rawMessage) ? rawMessage : undefined,
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong while processing the request',
    };
  }

  private isDuplicateKeyError(exception: unknown): exception is { code: number; keyValue: Record<string, unknown> } {
    return typeof exception === 'object' && exception !== null && (exception as { code?: number }).code === 11_000;
  }

  private codeForStatus(status: number): string {
    const table: Record<number, string> = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICTING_STATE',
      [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_REQUEST',
      [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
    };
    return table[status] ?? 'REQUEST_FAILED';
  }
}
