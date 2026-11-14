import { HttpErrorResponse } from '@angular/common/http';

/**
 * A failed request's HttpErrorResponse.status is 0 specifically when the
 * browser never got a response at all — connection refused, DNS failure, a
 * blocked CORS preflight — as opposed to any real HTTP status the backend
 * itself returned (401, 403, 500, ...). That's the one case worth calling
 * out separately: every other error already has its own accurate message
 * (e.g. "Invalid email or password"), and blaming "the backend is down" for
 * a 401 would be actively misleading.
 */
export function httpErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'Cannot reach the dashboard backend. Please check that it is running and try again.';
  }
  return fallback;
}

/**
 * Like httpErrorMessage, but for actions whose 4xx responses carry a
 * message written for the admin to read (e.g. "This workshop still has
 * 2 open booking(s)…"): shows that message instead of the generic fallback.
 * 5xx responses still get the fallback, since their message is not meant
 * for end users.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse && error.status >= 400 && error.status < 500) {
    const message = error.error?.message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }
  return httpErrorMessage(error, fallback);
}
