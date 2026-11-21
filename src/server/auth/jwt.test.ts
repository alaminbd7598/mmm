import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CandidateSession, StaffSession } from '../contracts';
import {
  demoAdminEnabled,
  demoJwtSecret,
  STAFF_SESSION_TTL_SECONDS,
  modeFromEnv,
  resolveJwtSecret,
  signCandidateToken,
  signStaffToken,
  verifyCandidateToken,
  verifyStaffToken,
} from './jwt';

const secret = new TextEncoder().encode('x'.repeat(40));
const otherSecret = new TextEncoder().encode('y'.repeat(40));
const staff: StaffSession = {
  kind: 'staff',
  userId: 'u1',
  username: 'admin',
  role: 'Super Admin',
  mustChangePassword: true,
  sv: 3,
};
const candidate: CandidateSession = { kind: 'candidate', candidateId: 'c1', email: 'a@example.com', sv: 0 };

test('staff token round trip', async () => {
  const token = await signStaffToken(staff, secret);
  assert.deepEqual(await verifyStaffToken(token, secret), staff);
});

test('staff token is rejected with the wrong secret', async () => {
  const token = await signStaffToken(staff, secret);
  assert.equal(await verifyStaffToken(token, otherSecret), null);
});

test('staff token expires after its TTL', async () => {
  const issued = new Date('2026-01-01T00:00:00Z');
  const token = await signStaffToken(staff, secret, { now: issued });
  const justBefore = new Date(issued.getTime() + (STAFF_SESSION_TTL_SECONDS - 60) * 1000);
  const after = new Date(issued.getTime() + (STAFF_SESSION_TTL_SECONDS + 60) * 1000);
  assert.deepEqual(await verifyStaffToken(token, secret, justBefore), staff);
  assert.equal(await verifyStaffToken(token, secret, after), null);
});

test('tampered payload is rejected', async () => {
  const token = await signStaffToken({ ...staff, role: 'Content Managers' }, secret);
  const [h, p, s] = token.split('.');
  const claims = JSON.parse(Buffer.from(p, 'base64url').toString());
  claims.role = 'Super Admin';
  const forged = [h, Buffer.from(JSON.stringify(claims)).toString('base64url'), s].join('.');
  assert.equal(await verifyStaffToken(forged, secret), null);
});

test('alg=none and garbage tokens are rejected', async () => {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...staff, sub: 'u1', exp: 9999999999 })).toString('base64url');
  assert.equal(await verifyStaffToken(`${header}.${body}.`, secret), null);
  assert.equal(await verifyStaffToken('not.a.jwt', secret), null);
  assert.equal(await verifyStaffToken('', secret), null);
  assert.equal(await verifyStaffToken(undefined, secret), null);
});

test('candidate and staff tokens are not interchangeable', async () => {
  const c = await signCandidateToken(candidate, secret);
  const s = await signStaffToken(staff, secret);
  assert.deepEqual(await verifyCandidateToken(c, secret), candidate);
  assert.equal(await verifyStaffToken(c, secret), null);
  assert.equal(await verifyCandidateToken(s, secret), null);
});

test('signing rejects an invalid role', async () => {
  await assert.rejects(signStaffToken({ ...staff, role: 'Root' as StaffSession['role'] }, secret));
});

test('resolveJwtSecret requires a long JWT_SECRET in database mode', () => {
  assert.equal(resolveJwtSecret('database', {}).ok, false);
  assert.equal(resolveJwtSecret('database', { JWT_SECRET: 'short' }).ok, false);
  const r = resolveJwtSecret('database', { JWT_SECRET: 'z'.repeat(32) });
  assert.ok(r.ok);
  assert.equal(new TextDecoder().decode(r.secret), 'z'.repeat(32));
});

test('resolveJwtSecret falls back to the demo secret only in demo mode', () => {
  const r = resolveJwtSecret('demo', {});
  assert.ok(r.ok);
  assert.equal(r.secret, demoJwtSecret(), 'demo mode uses the per-process random key');
  assert.ok(r.secret.byteLength >= 32);
  const configured = resolveJwtSecret('demo', { JWT_SECRET: 'k'.repeat(40) });
  assert.ok(configured.ok);
  assert.equal(new TextDecoder().decode(configured.secret), 'k'.repeat(40));
});

test('modeFromEnv follows DATABASE_URL', () => {
  assert.equal(modeFromEnv({}), 'demo');
  assert.equal(modeFromEnv({ DATABASE_URL: '  ' }), 'demo');
  assert.equal(modeFromEnv({ DATABASE_URL: 'mysql://u:p@h/db' }), 'database');
});

test('a token without a session version is rejected', async () => {
  const { SignJWT } = await import('jose');
  const iat = Math.floor(Date.now() / 1000);
  const legacy = await new SignJWT({ kind: 'staff', userId: 'u1', username: 'admin', role: 'Super Admin', mustChangePassword: false })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('mmm')
    .setAudience('mmm:staff')
    .setSubject('u1')
    .setIssuedAt(iat)
    .setExpirationTime(iat + 600)
    .sign(secret);
  assert.equal(await verifyStaffToken(legacy, secret), null);
});

test('the demo admin is closed in production unless DEMO_MODE=1', () => {
  assert.equal(demoAdminEnabled({ NODE_ENV: 'production' }), false);
  assert.equal(demoAdminEnabled({ NODE_ENV: 'production', DEMO_MODE: '1' }), true);
  assert.equal(demoAdminEnabled({ NODE_ENV: 'development' }), true);
  assert.equal(demoAdminEnabled({}), true);
});
