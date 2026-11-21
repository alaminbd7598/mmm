/**
 * In-memory request throttling: trusted client address, fixed-window limiters and budgets.
 * State lives on globalThis, so it is per server process: effective for one Node process
 * (Hostinger, one Cloud Run instance) and only best-effort on serverless platforms, where each
 * instance counts separately. Pure apart from that shared map; no Next.js imports.
 */

export type HeaderSource = { get(name: string): string | null };
export type EnvLike = Readonly<Record<string, string | undefined>>;

/** Bucket key used when no trustworthy client address is available. */
export const UNKNOWN_CLIENT = 'unknown';

const firstOf = (value: string | null): string => (value || '').split(',')[0].trim();

/**
 * Number of reverse proxies in front of the app that append to X-Forwarded-For (default 1: the
 * hosting platform's own proxy). Set TRUSTED_PROXY_HOPS=2 when a CDN sits in front of that proxy,
 * or 0 when the app is reached directly and the header must be ignored.
 */
export function trustedProxyHops(env: EnvLike = process.env): number {
  const raw = Number.parseInt(env.TRUSTED_PROXY_HOPS ?? '', 10);
  return Number.isInteger(raw) && raw >= 0 && raw <= 10 ? raw : 1;
}

/**
 * Client address as reported by the trusted proxy chain. X-Forwarded-For is client-controlled
 * except for the entries appended by our own proxies, so the address is read from the right:
 * the entry `hops` positions from the end. Left-most values are never trusted.
 */
export function clientIp(req: { headers: HeaderSource }, env: EnvLike = process.env): string {
  if (env.VERCEL) {
    // Set by Vercel's edge and not forwardable by clients.
    const vercel = firstOf(req.headers.get('x-vercel-forwarded-for')) || firstOf(req.headers.get('x-real-ip'));
    if (vercel) return vercel;
  }
  const hops = trustedProxyHops(env);
  if (hops === 0) return UNKNOWN_CLIENT;
  const chain = (req.headers.get('x-forwarded-for') || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return chain.length >= hops ? chain[chain.length - hops] : UNKNOWN_CLIENT;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const GLOBAL_KEY = '__mmmRateBuckets';
const buckets: Map<string, Bucket> =
  ((globalThis as Record<string, unknown>)[GLOBAL_KEY] as Map<string, Bucket> | undefined) ??
  ((globalThis as Record<string, unknown>)[GLOBAL_KEY] = new Map<string, Bucket>());

function liveBucket(key: string, now: number): Bucket | undefined {
  const bucket = buckets.get(key);
  if (bucket && bucket.resetAt <= now) {
    buckets.delete(key);
    return undefined;
  }
  return bucket;
}

/**
 * Add `amount` to the window's counter and report whether the total stays within `limit`.
 * With `amount` 1 this is a fixed-window request limiter; larger amounts make it a budget
 * (e.g. uploaded bytes per day).
 */
export function consume(key: string, limit: number, windowMs: number, amount = 1, now = Date.now()): boolean {
  if (buckets.size > 10_000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }
  const bucket = liveBucket(key, now);
  if (!bucket) {
    buckets.set(key, { count: amount, resetAt: now + windowMs });
    return amount <= limit;
  }
  bucket.count += amount;
  return bucket.count <= limit;
}

/** Fixed-window limiter: true when this request is allowed. */
export const rateLimit = (key: string, limit: number, windowMs: number, now = Date.now()): boolean =>
  consume(key, limit, windowMs, 1, now);

/** True when the counter has already reached `limit` (does not count the current request). */
export function isLimited(key: string, limit: number, now = Date.now()): boolean {
  const bucket = liveBucket(key, now);
  return Boolean(bucket && bucket.count >= limit);
}

/** Forget a counter (e.g. failed-login count after a successful sign-in). */
export function resetLimit(key: string): void {
  buckets.delete(key);
}
