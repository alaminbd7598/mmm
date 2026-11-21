/**
 * Pure JWT signing/verification for staff and candidate sessions (HS256 via jose).
 * Free of next/headers and server-only so it can run in src/proxy.ts and in unit tests.
 */
import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';
import { ADMIN_ROLES_LIST } from '../../types/cms';
import type { CandidateSession, LoginSetupIssue, StaffSession, StorageMode } from '../contracts';

export const JWT_ISSUER = 'mmm';
const STAFF_AUDIENCE = 'mmm:staff';
const CANDIDATE_AUDIENCE = 'mmm:candidate';

export const STAFF_SESSION_TTL_SECONDS = 8 * 60 * 60;
export const CANDIDATE_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
export const MIN_JWT_SECRET_LENGTH = 32;

const DEMO_SECRET_KEY = Symbol.for('mmm.demoJwtSecret');

/**
 * Signing key for demo mode (no DATABASE_URL) when JWT_SECRET is not set: random per server
 * process, so demo sessions cannot be forged and end when the process restarts.
 */
export function demoJwtSecret(): Uint8Array {
  const holder = globalThis as Record<symbol, unknown>;
  holder[DEMO_SECRET_KEY] ??= crypto.getRandomValues(new Uint8Array(48));
  return holder[DEMO_SECRET_KEY] as Uint8Array;
}

export type EnvLike = Readonly<Record<string, string | undefined>>;

export type JwtSecretResult =
  | { ok: true; secret: Uint8Array }
  | { ok: false; error: string };

/** Storage mode as decided by the environment (mirrors getStore(): DATABASE_URL set => database). */
export function modeFromEnv(env: EnvLike = process.env): StorageMode {
  return env.DATABASE_URL && env.DATABASE_URL.trim() ? 'database' : 'demo';
}

/**
 * Whether staff sign-in is available in demo mode. The sample accounts have public passwords, so
 * a production server without DATABASE_URL (e.g. a mistyped variable on a live domain) keeps the
 * admin panel closed unless DEMO_MODE=1 states that a writable demo is intended.
 */
export function demoAdminEnabled(env: EnvLike = process.env): boolean {
  return env.NODE_ENV !== 'production' || env.DEMO_MODE === '1';
}

/** True when a valid JWT_SECRET is configured (demo mode otherwise uses a per-process key). */
export function hasConfiguredJwtSecret(env: EnvLike = process.env): boolean {
  return (env.JWT_SECRET?.trim() || '').length >= MIN_JWT_SECRET_LENGTH;
}

/**
 * The setting that keeps staff sign-in closed, or null when sign-in works. `adminPasswordPending`
 * is the store's answer to "does no Super Admin have a password yet?" (database mode).
 */
export function loginSetupIssue(
  mode: StorageMode,
  adminPasswordPending: boolean,
  env: EnvLike = process.env
): LoginSetupIssue | null {
  if (mode === 'demo') return demoAdminEnabled(env) ? null : 'DATABASE_URL';
  if (!hasConfiguredJwtSecret(env)) return 'JWT_SECRET';
  return adminPasswordPending ? 'ADMIN_BOOTSTRAP_PASSWORD' : null;
}

/**
 * Resolve the signing key. Database mode requires JWT_SECRET (>= 32 chars). Demo mode prefers a
 * valid JWT_SECRET and otherwise uses the per-process demo key.
 */
export function resolveJwtSecret(mode: StorageMode, env: EnvLike = process.env): JwtSecretResult {
  const configured = env.JWT_SECRET?.trim() || '';
  if (configured.length >= MIN_JWT_SECRET_LENGTH) {
    return { ok: true, secret: new TextEncoder().encode(configured) };
  }
  if (mode === 'demo') return { ok: true, secret: demoJwtSecret() };
  return {
    ok: false,
    error: `JWT_SECRET must be set to at least ${MIN_JWT_SECRET_LENGTH} characters when DATABASE_URL is configured.`,
  };
}

const staffClaimsSchema = z.object({
  kind: z.literal('staff'),
  userId: z.string().min(1),
  username: z.string().min(1),
  role: z.enum(ADMIN_ROLES_LIST as [StaffSession['role'], ...StaffSession['role'][]]),
  mustChangePassword: z.boolean(),
  sv: z.number().int().nonnegative(),
});

const candidateClaimsSchema = z.object({
  kind: z.literal('candidate'),
  candidateId: z.string().min(1),
  email: z.string().min(1),
  sv: z.number().int().nonnegative(),
});

interface SignOptions {
  /** Token lifetime in seconds. */
  ttlSeconds?: number;
  /** Issue time (defaults to now); exposed for tests. */
  now?: Date;
}

async function sign(
  claims: Record<string, unknown>,
  subject: string,
  audience: string,
  secret: Uint8Array,
  ttlSeconds: number,
  now: Date
): Promise<string> {
  const iat = Math.floor(now.getTime() / 1000);
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(JWT_ISSUER)
    .setAudience(audience)
    .setSubject(subject)
    .setIssuedAt(iat)
    .setExpirationTime(iat + ttlSeconds)
    .sign(secret);
}

async function verify(
  token: string,
  audience: string,
  secret: Uint8Array,
  now?: Date
): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience,
      requiredClaims: ['exp', 'iat', 'sub'],
      ...(now ? { currentDate: now } : {}),
    });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function signStaffToken(session: StaffSession, secret: Uint8Array, opts: SignOptions = {}): Promise<string> {
  const claims = staffClaimsSchema.parse(session);
  return sign(
    claims,
    claims.userId,
    STAFF_AUDIENCE,
    secret,
    opts.ttlSeconds ?? STAFF_SESSION_TTL_SECONDS,
    opts.now ?? new Date()
  );
}

/** Returns the session when the signature, issuer, audience and expiry are valid; otherwise null. */
export async function verifyStaffToken(
  token: string | undefined | null,
  secret: Uint8Array,
  now?: Date
): Promise<StaffSession | null> {
  if (!token) return null;
  const payload = await verify(token, STAFF_AUDIENCE, secret, now);
  if (!payload) return null;
  const parsed = staffClaimsSchema.safeParse(payload);
  if (!parsed.success || payload.sub !== parsed.data.userId) return null;
  return parsed.data;
}

export async function signCandidateToken(
  session: CandidateSession,
  secret: Uint8Array,
  opts: SignOptions = {}
): Promise<string> {
  const claims = candidateClaimsSchema.parse(session);
  return sign(
    claims,
    claims.candidateId,
    CANDIDATE_AUDIENCE,
    secret,
    opts.ttlSeconds ?? CANDIDATE_SESSION_TTL_SECONDS,
    opts.now ?? new Date()
  );
}

export async function verifyCandidateToken(
  token: string | undefined | null,
  secret: Uint8Array,
  now?: Date
): Promise<CandidateSession | null> {
  if (!token) return null;
  const payload = await verify(token, CANDIDATE_AUDIENCE, secret, now);
  if (!payload) return null;
  const parsed = candidateClaimsSchema.safeParse(payload);
  if (!parsed.success || payload.sub !== parsed.data.candidateId) return null;
  return parsed.data;
}
