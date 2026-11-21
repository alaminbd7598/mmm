import { cookies } from 'next/headers';
import { z } from 'zod';
import { normalizeAdminRole } from '@/src/utils/cmsLogic';
import type { LoginResponse } from '@/src/server/contracts';
import { getStore } from '@/src/server/db/store';
import { HttpError, assertSameOrigin, handleError, json, readJson } from '@/src/server/http';
import { UNKNOWN_CLIENT, clientIp, consume, isLimited, rateLimit, resetLimit } from '@/src/server/rate-limit';
import { demoAdminEnabled } from '@/src/server/auth/jwt';
import { isSuperAdmin } from '@/src/server/state/permissions';
import { verifyPassword } from '@/src/server/auth/password';
import { findProfile, toSafeUser } from '@/src/server/auth/safe-user';
import { createStaffSession, getJwtSecret } from '@/src/server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_MS = 15 * 60 * 1000;
/** Failed attempts per username, from any address (brute-force lockout that ignores the IP). */
const PER_USER_FAILURE_LIMIT = 10;
const PER_IP_LIMIT = 50;

const loginSchema = z.object({
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(256),
  expectedRole: z.string().trim().max(100).optional(),
});

const invalidCredentials = () => new HttpError(401, 'Invalid username or password.', 'INVALID_CREDENTIALS');

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const parsed = loginSchema.safeParse(await readJson(req, 4 * 1024));
    if (!parsed.success) throw new HttpError(400, 'Username and password are required.', 'BAD_REQUEST');
    const { username, password, expectedRole } = parsed.data;

    const ip = clientIp(req);
    const userKey = `auth-login-user:${username.toLowerCase()}`;
    // Requests without a trustworthy address are only limited per username (no shared IP bucket).
    const ipAllowed = ip === UNKNOWN_CLIENT || rateLimit(`auth-login-ip:${ip}`, PER_IP_LIMIT, WINDOW_MS);
    if (!ipAllowed || isLimited(userKey, PER_USER_FAILURE_LIMIT)) {
      throw new HttpError(429, 'Too many sign-in attempts. Please try again later.', 'RATE_LIMITED');
    }

    const store = await getStore();
    if (store.mode === 'demo' && !demoAdminEnabled()) {
      throw new HttpError(
        503,
        'Sign-in is disabled: this server has no database configured (set DATABASE_URL, or DEMO_MODE=1 for a demo).',
        'NOT_CONFIGURED'
      );
    }
    getJwtSecret(store.mode); // fail fast with NOT_CONFIGURED before touching credentials

    const auth = await store.getUserAuthByUsername(username);
    if (auth && !auth.passwordHash && !auth.disabled && isSuperAdmin(auth.role)) {
      // Fresh database without ADMIN_BOOTSTRAP_PASSWORD: there is no password to check yet.
      throw new HttpError(
        503,
        'No administrator password has been set. Set ADMIN_BOOTSTRAP_PASSWORD on the server and restart it.',
        'NOT_CONFIGURED'
      );
    }
    const passwordOk = await verifyPassword(password, auth?.passwordHash);
    if (!auth || auth.disabled || !passwordOk) {
      consume(userKey, PER_USER_FAILURE_LIMIT, WINDOW_MS);
      throw invalidCredentials();
    }
    resetLimit(userKey);

    const role = normalizeAdminRole(auth.role);
    if (expectedRole && normalizeAdminRole(expectedRole) !== role) {
      throw new HttpError(403, 'This account does not have the selected role.', 'ROLE_MISMATCH');
    }

    await createStaffSession(await cookies(), {
      kind: 'staff',
      userId: auth.id,
      username: auth.username,
      role,
      mustChangePassword: auth.mustChangePassword,
      sv: auth.sessionVersion,
    });

    const snapshot = await store.getSnapshot();
    const body: LoginResponse = {
      ok: true,
      user: toSafeUser(findProfile(snapshot.state.users, auth.id), auth),
      mustChangePassword: auth.mustChangePassword,
    };
    return json(body);
  } catch (err) {
    return handleError(err);
  }
}
