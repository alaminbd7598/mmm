import test from 'node:test';
import assert from 'node:assert/strict';
import {
  beginAttempt,
  GLOBAL_PREFIX,
  MAX_BUCKETS,
  UNKNOWN_CLIENT,
  UNKNOWN_CLIENT_FACTOR,
  bucketCount,
  clientIp,
  consume,
  isLimited,
  rateLimit,
  rateLimitClient,
  resetLimit,
  trustedProxyHops,
} from './rate-limit';

const req = (headers: Record<string, string>) => ({
  headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
});
let seq = 0;
const key = (name: string) => `test-${name}-${++seq}`;

test('clientIp reads the entry appended by the trusted proxy, never the client-supplied left side', () => {
  assert.equal(clientIp(req({ 'x-forwarded-for': '203.0.113.9' }), {}), '203.0.113.9');
  assert.equal(clientIp(req({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 203.0.113.9' }), {}), '203.0.113.9');
  assert.equal(clientIp(req({ 'x-forwarded-for': 'spoofed, 203.0.113.9' }), {}), '203.0.113.9');
});

test('TRUSTED_PROXY_HOPS selects the entry from the right; too short a chain is not trusted', () => {
  const chain = req({ 'x-forwarded-for': 'spoofed, 198.51.100.7, 10.0.0.1' });
  assert.equal(clientIp(chain, { TRUSTED_PROXY_HOPS: '2' }), '198.51.100.7');
  assert.equal(clientIp(req({ 'x-forwarded-for': '198.51.100.7' }), { TRUSTED_PROXY_HOPS: '2' }), UNKNOWN_CLIENT);
  assert.equal(clientIp(chain, { TRUSTED_PROXY_HOPS: '0' }), UNKNOWN_CLIENT);
  assert.equal(trustedProxyHops({ TRUSTED_PROXY_HOPS: 'abc' }), 1);
  assert.equal(trustedProxyHops({ TRUSTED_PROXY_HOPS: '-1' }), 1);
});

test('without a proxy header every client shares the unknown bucket', () => {
  assert.equal(clientIp(req({}), {}), UNKNOWN_CLIENT);
  assert.equal(clientIp(req({ 'x-real-ip': '9.9.9.9' }), {}), UNKNOWN_CLIENT);
});

test('on Vercel the platform headers win over X-Forwarded-For', () => {
  const headers = req({ 'x-vercel-forwarded-for': '203.0.113.50', 'x-forwarded-for': 'spoofed' });
  assert.equal(clientIp(headers, { VERCEL: '1' }), '203.0.113.50');
  assert.equal(clientIp(req({ 'x-real-ip': '203.0.113.51' }), { VERCEL: '1' }), '203.0.113.51');
  // Off Vercel the same header is client-controlled and ignored.
  assert.equal(clientIp(req({ 'x-vercel-forwarded-for': '6.6.6.6', 'x-forwarded-for': '203.0.113.9' }), {}), '203.0.113.9');
});

test('fixed window: allows up to the limit, then refuses until the window ends', () => {
  const k = key('window');
  for (let i = 0; i < 3; i += 1) assert.equal(rateLimit(k, 3, 1000, 5000), true);
  assert.equal(rateLimit(k, 3, 1000, 5500), false);
  assert.equal(isLimited(k, 3, 5500), true);
  assert.equal(rateLimit(k, 3, 1000, 6000), true);
  resetLimit(k);
  assert.equal(isLimited(k, 1, 6000), false);
});

test('budgets count amounts', () => {
  const k = key('budget');
  assert.equal(consume(k, 100, 1000, 60, 0), true);
  assert.equal(consume(k, 100, 1000, 60, 1), false);
});

test('the shared unknown bucket gets a larger, still finite, limit', () => {
  const scope = key('scope');
  for (let i = 0; i < 2 * UNKNOWN_CLIENT_FACTOR; i += 1) {
    assert.equal(rateLimitClient(scope, UNKNOWN_CLIENT, 2, 1000, 0), true);
  }
  assert.equal(rateLimitClient(scope, UNKNOWN_CLIENT, 2, 1000, 0), false);
  assert.equal(rateLimitClient(scope, '203.0.113.1', 2, 1000, 0), true);
  assert.equal(rateLimitClient(scope, '203.0.113.1', 2, 1000, 0), true);
  assert.equal(rateLimitClient(scope, '203.0.113.1', 2, 1000, 0), false);
});

test('the bucket map is capped; site-wide budgets survive eviction', () => {
  const now = 10_000_000;
  const globalKey = `${GLOBAL_PREFIX}${key('daily')}`;
  consume(globalKey, 5, 60_000, 5, now);
  for (let i = 0; i < MAX_BUCKETS + 500; i += 1) consume(`flood:${i}`, 1, 60_000, 1, now);
  assert.ok(bucketCount() <= MAX_BUCKETS, `map holds ${bucketCount()} counters`);
  // The daily budget is still exhausted after the flood.
  assert.equal(consume(globalKey, 5, 60_000, 1, now), false);
  // Expired counters are dropped first.
  consume(key('late'), 1, 1000, 1, now + 120_000);
  for (let i = 0; i < 10; i += 1) consume(`late-flood:${i}`, 1, 1000, 1, now + 120_000);
  assert.ok(bucketCount() <= MAX_BUCKETS);
});

test('sign-in lockout: a parallel burst cannot exceed the limit, only a full success clears it', () => {
  const key = `login-burst-${Math.random()}`;
  const now = 5_000_000;
  // Fifty guesses start at the same moment: each is counted before its password check runs.
  const started = Array.from({ length: 50 }, () => beginAttempt(key, 10, 60_000, now)).filter(Boolean).length;
  assert.equal(started, 10);
  assert.equal(isLimited(key, 10, now), true);
  assert.equal(beginAttempt(key, 10, 60_000, now + 60_001), true, 'a new window starts after the old one ends');

  // Nine wrong passwords, then a correct password with the wrong role: nothing is cleared,
  // so the tenth failure still locks the account.
  const account = `login-role-${Math.random()}`;
  for (let i = 0; i < 9; i += 1) assert.equal(beginAttempt(account, 10, 60_000, now), true);
  assert.equal(beginAttempt(account, 10, 60_000, now), true); // correct password, role mismatch: no reset
  assert.equal(beginAttempt(account, 10, 60_000, now), false);
  // A complete sign-in clears the counter.
  resetLimit(account);
  assert.equal(isLimited(account, 10, now), false);
  assert.equal(beginAttempt(account, 10, 60_000, now), true);
});
