// Shared react-query retry helpers. Treat client errors (4xx) as terminal — a 404
// "no data" or a 400 bad request will never succeed on retry — and only retry on
// 5xx (server) or networkish errors (no status).

export class HttpError extends Error {
  status: number;

  constructor(status: number, message?: string) {
    super(message ?? `Request failed with status ${status}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

/**
 * react-query `retry` predicate: retry up to `maxRetries` times, but never for a
 * 4xx response (those are deterministic and won't change on retry).
 */
export function retryOn5xx(maxRetries = 1) {
  return (failureCount: number, error: unknown): boolean => {
    const status = error instanceof HttpError ? error.status : undefined;
    if (status !== undefined && status >= 400 && status < 500) return false;
    return failureCount < maxRetries;
  };
}
