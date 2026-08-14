/**
 * Domain-level failures, expressed without any HTTP vocabulary.
 *
 * Services throw these; a single exception filter is responsible for deciding
 * what status code each one deserves. That keeps the domain layer portable —
 * the same service could sit behind a queue consumer or a GraphQL resolver
 * without dragging `NotFoundException` along with it.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  protected constructor(
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class ResourceNotFoundError extends DomainError {
  readonly code = 'RESOURCE_NOT_FOUND';

  constructor(resource: string, identifier: string) {
    super(`${resource} "${identifier}" does not exist`, { resource, identifier });
  }
}

export class InvalidIdentifierError extends DomainError {
  readonly code = 'INVALID_IDENTIFIER';

  constructor(value: string, field = 'id') {
    super(`"${value}" is not a valid identifier`, { field, value });
  }
}

export class ConflictingStateError extends DomainError {
  readonly code = 'CONFLICTING_STATE';

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class UnprocessableRequestError extends DomainError {
  readonly code = 'UNPROCESSABLE_REQUEST';

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}
