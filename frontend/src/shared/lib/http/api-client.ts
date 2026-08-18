import type { Collection } from '@/shared/domain/models';

/**
 * One place where the app talks to the network.
 *
 * Every request goes through here, which buys uniform error translation, one
 * query-string encoder, one envelope-unwrapping rule, and a single seam for
 * adding auth headers or retries later. No component contains a URL or a bare
 * `fetch`, so a failed save can never be swallowed by an ad-hoc `.catch`.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** True for the failures worth showing the user verbatim. */
  get isClientFault(): boolean {
    return this.status >= 400 && this.status < 500;
  }
}

type QueryValue = string | number | boolean | null | undefined | readonly string[];

function encodeQuery(params?: Record<string, QueryValue>): string {
  if (!params) return '';

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    // Repeated filters travel as a comma list, which is what the DTOs parse.
    search.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }

  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options;

  const response = await fetch(`/api${path}${encodeQuery(query)}`, {
    method,
    signal,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'same-origin',
  });

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const envelope = (payload as { error?: { code?: string; message?: string; details?: unknown } })?.error;
    throw new ApiError(
      response.status,
      envelope?.code ?? 'REQUEST_FAILED',
      envelope?.message ?? `Request to ${path} failed`,
      envelope?.details,
    );
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, query?: Record<string, QueryValue>, signal?: AbortSignal) =>
    request<T>(path, { query, signal }),

  /** Unwraps the `{ data, meta }` envelope for callers that only want the rows. */
  list: async <T>(path: string, query?: Record<string, QueryValue>, signal?: AbortSignal): Promise<T[]> => {
    const collection = await request<Collection<T>>(path, { query, signal });
    return collection?.data ?? [];
  },

  /** Same request, but keeps the paging metadata. */
  page: <T>(path: string, query?: Record<string, QueryValue>, signal?: AbortSignal) =>
    request<Collection<T>>(path, { query, signal }),

  post: <T>(path: string, body?: unknown, query?: Record<string, QueryValue>) =>
    request<T>(path, { method: 'POST', body, query }),

  patch: <T>(path: string, body?: unknown, query?: Record<string, QueryValue>) =>
    request<T>(path, { method: 'PATCH', body, query }),

  put: <T>(path: string, body?: unknown, query?: Record<string, QueryValue>) =>
    request<T>(path, { method: 'PUT', body, query }),

  remove: <T>(path: string, query?: Record<string, QueryValue>) => request<T>(path, { method: 'DELETE', query }),
};

export function describeError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}
