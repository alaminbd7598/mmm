import 'server-only';
import { NextResponse } from 'next/server';
import { StoreConflictError, StoreNotFoundError, StoreUnavailableError } from './db/errors';

/** JSON response helper with no-store caching (API data is per-request and may be personal). */
export function json<T>(body: T, init?: number | ResponseInit): NextResponse {
  const base: ResponseInit = typeof init === 'number' ? { status: init } : init || {};
  const headers = new Headers(base.headers);
  headers.set('Cache-Control', 'no-store');
  return NextResponse.json(body, { ...base, headers });
}

export function jsonError(status: number, error: string, code?: string): NextResponse {
  return json({ ok: false, error, ...(code ? { code } : {}) }, status);
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

/**
 * Read and parse a JSON body, enforcing a byte limit before parsing.
 * Throws HttpError(413) when too large and HttpError(400) for invalid JSON.
 */
export async function readJson<T = unknown>(req: Request, maxBytes: number): Promise<T> {
  const declared = Number(req.headers.get('content-length') || 0);
  if (declared && declared > maxBytes) throw new HttpError(413, 'Request body is too large.', 'TOO_LARGE');
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, 'A JSON body is required.', 'BAD_REQUEST');
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new HttpError(413, 'Request body is too large.', 'TOO_LARGE');
    }
    chunks.push(value);
  }
  const text = new TextDecoder().decode(
    chunks.length === 1 ? chunks[0] : Buffer.concat(chunks.map((c) => Buffer.from(c)))
  );
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, 'Invalid JSON body.', 'BAD_JSON');
  }
}

/** Convert thrown errors into JSON responses without leaking internals. */
export function handleError(err: unknown): NextResponse {
  if (err instanceof HttpError) return jsonError(err.status, err.message, err.code);
  if (err instanceof StoreConflictError) return jsonError(409, err.message || 'Conflicting change.', err.code);
  if (err instanceof StoreNotFoundError) return jsonError(404, err.message || 'Not found.', err.code);
  if (err instanceof StoreUnavailableError) {
    console.error('[api] data store unavailable:', err.message);
    return jsonError(503, 'The database is temporarily unavailable.', err.code);
  }
  console.error('[api]', err);
  return jsonError(500, 'Internal server error.', 'INTERNAL');
}

/** Best-effort client IP (behind Vercel / Cloud Run / Hostinger proxies). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

type Bucket = { count: number; resetAt: number };
const buckets: Map<string, Bucket> =
  ((globalThis as Record<string, unknown>).__mmmRateBuckets as Map<string, Bucket>) ||
  ((globalThis as Record<string, unknown>).__mmmRateBuckets = new Map<string, Bucket>());

/**
 * Fixed-window in-memory rate limiter. Per server instance (good enough for one Node process on
 * Hostinger / Cloud Run; best-effort on serverless). Returns true when the request is allowed.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export function assertRateLimit(req: Request, scope: string, limit: number, windowMs: number): void {
  if (!rateLimit(`${scope}:${clientIp(req)}`, limit, windowMs)) {
    throw new HttpError(429, 'Too many requests. Please try again shortly.', 'RATE_LIMITED');
  }
}

/** Reject cross-site state-changing requests (CSRF defence in addition to SameSite=Lax cookies). */
export function assertSameOrigin(req: Request): void {
  const origin = req.headers.get('origin');
  if (!origin) return; // non-browser clients (curl, webhooks) send no Origin
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  try {
    if (host && new URL(origin).host === host) return;
  } catch {
    // fall through
  }
  throw new HttpError(403, 'Cross-origin request refused.', 'BAD_ORIGIN');
}
