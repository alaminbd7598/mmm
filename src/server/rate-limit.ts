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
 * hosting platform's own proxy: Hostinger, Cloud Run). Set TRUSTED_PROXY_HOPS=2 when a CDN or load
 * balancer sits in front of that proxy, or 0 when the app is reached directly and the header must
 * be ignored. Vercel is detected automatically and needs no setting.
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

/** Upper bound on tracked counters, so the map cannot grow without limit under a flood of keys. */
export const MAX_BUCKETS = 20_000;
/** Prefix of site-wide budgets (daily caps); these counters are never evicted. */
export const GLOBAL_PREFIX = 'global:';

/**
 * Make room for one more counter: drop expired ones and, if the map is still full, the oldest
 * per-client counters (insertion order) until a tenth of the map is free.
 */
function makeRoom(now: number): void {
  for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  if (buckets.size < MAX_BUCKETS) return;
  const target = Math.floor(MAX_BUCKETS * 0.9);
  for (const key of buckets.keys()) {
    if (buckets.size <= target) break;
    if (!key.startsWith(GLOBAL_PREFIX)) buckets.delete(key);
  }
}

/**
 * Add `amount` to the window's counter and report whether the total stays within `limit`.
 * With `amount` 1 this is a fixed-window request limiter; larger amounts make it a budget
 * (e.g. uploaded bytes per day).
 */
export function consume(key: string, limit: number, windowMs: number, amount = 1, now = Date.now()): boolean {
  const bucket = liveBucket(key, now);
  if (!bucket) {
    if (buckets.size >= MAX_BUCKETS) makeRoom(now);
    buckets.set(key, { count: amount, resetAt: now + windowMs });
    return amount <= limit;
  }
  bucket.count += amount;
  return bucket.count <= limit;
}

/** Number of live counters (monitoring and tests). */
export const bucketCount = (): number => buckets.size;

/**
 * Requests without a trustworthy address all share one counter per scope. That counter gets this
 * multiple of the per-client limit, so a host that sends no X-Forwarded-For does not lock real
 * visitors out while the total stays bounded.
 */
export const UNKNOWN_CLIENT_FACTOR = 10;

/** Per-client fixed-window limiter keyed by scope and address: true when the request is allowed. */
export function rateLimitClient(scope: string, ip: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const effective = ip === UNKNOWN_CLIENT ? limit * UNKNOWN_CLIENT_FACTOR : limit;
  return consume(`${scope}:${ip}`, effective, windowMs, 1, now);
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
