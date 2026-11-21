import 'server-only';
import { headers } from 'next/headers';
import { HttpError } from '../http';
import type { StorageMode } from '../contracts';
import { resolveJwtSecret } from './jwt';
import { sessionCookieOptions, shouldUseSecureCookie, type SessionCookieOptions } from './cookies';

/** Anything that can set an outgoing cookie: the `cookies()` store or a NextResponse. */
export interface CookieWriter {
  set(name: string, value: string, options: SessionCookieOptions): unknown;
}
export type CookieTarget = CookieWriter | { cookies: CookieWriter };

const writerOf = (target: CookieTarget): CookieWriter => ('cookies' in target ? target.cookies : target);

/** Signing key for the given storage mode; throws HttpError(500, NOT_CONFIGURED) when missing. */
export function getJwtSecret(mode: StorageMode): Uint8Array {
  const result = resolveJwtSecret(mode);
  if (!result.ok) throw new HttpError(500, result.error, 'NOT_CONFIGURED');
  return result.secret;
}

async function currentOptions(maxAgeSeconds: number): Promise<SessionCookieOptions> {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host');
  return sessionCookieOptions(maxAgeSeconds, shouldUseSecureCookie(process.env.NODE_ENV, host));
}

export async function writeSessionCookie(
  target: CookieTarget,
  name: string,
  token: string,
  maxAgeSeconds: number
): Promise<void> {
  writerOf(target).set(name, token, await currentOptions(maxAgeSeconds));
}

/** Expire the cookie with the same attributes it was set with (browsers match on name+path). */
export async function expireSessionCookie(target: CookieTarget, name: string): Promise<void> {
  writerOf(target).set(name, '', await currentOptions(0));
}
