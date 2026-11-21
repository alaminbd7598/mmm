/**
 * Minimal browser JSON client for the app's own API routes. Always same-origin with cookies,
 * never cached, and never throws for HTTP error statuses: callers get a typed result instead.
 */

export interface ApiFailure {
  ok: false;
  /** HTTP status, or 0 when the request never reached the server (offline, aborted, DNS...). */
  status: number;
  /** Machine-readable code from the server (e.g. 'INVALID_CREDENTIALS'), or 'NETWORK' / 'BAD_RESPONSE'. */
  code: string;
  /** Server-provided English message, for logs/fallbacks only; UI shows localized text by code. */
  error: string;
}

export type ApiResult<T> = ({ ok: true; status: number } & { data: T }) | ApiFailure;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  signal?: AbortSignal;
}

const failure = (status: number, code: string, error: string): ApiFailure => ({ ok: false, status, code, error });

export async function apiRequest<T>(path: string, opts: ApiRequestOptions = {}): Promise<ApiResult<T>> {
  const method = opts.method || (opts.body === undefined ? 'GET' : 'POST');
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: opts.body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    });
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    return failure(0, aborted ? 'ABORTED' : 'NETWORK', aborted ? 'Request aborted.' : 'Network request failed.');
  }

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    return failure(res.status, 'BAD_RESPONSE', 'The server returned an unreadable response.');
  }

  const record = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  if (!res.ok || record.ok === false) {
    return failure(
      res.status,
      typeof record.code === 'string' ? record.code : res.ok ? 'FAILED' : `HTTP_${res.status}`,
      typeof record.error === 'string' ? record.error : `Request failed with status ${res.status}.`
    );
  }
  return { ok: true, status: res.status, data: payload as T };
}

export const apiGet = <T>(path: string, signal?: AbortSignal) => apiRequest<T>(path, { method: 'GET', signal });
export const apiPost = <T>(path: string, body: unknown = {}, signal?: AbortSignal) =>
  apiRequest<T>(path, { method: 'POST', body, signal });
