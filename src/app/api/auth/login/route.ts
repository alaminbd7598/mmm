import { cookies } from 'next/headers';
import { z } from 'zod';
import { normalizeAdminRole } from '@/src/utils/cmsLogic';
import type { LoginResponse } from '@/src/server/contracts';
import { getStore } from '@/src/server/db/store';
import { HttpError, assertSameOrigin, clientIp, handleError, json, rateLimit, readJson } from '@/src/server/http';
import { verifyPassword } from '@/src/server/auth/password';
import { findProfile, toSafeUser } from '@/src/server/auth/safe-user';
import { createStaffSession, getJwtSecret } from '@/src/server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_MS = 15 * 60 * 1000;
const PER_USER_LIMIT = 10;
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
    const allowed =
      rateLimit(`auth-login-ip:${ip}`, PER_IP_LIMIT, WINDOW_MS) &&
      rateLimit(`auth-login:${ip}:${username.toLowerCase()}`, PER_USER_LIMIT, WINDOW_MS);
    if (!allowed) throw new HttpError(429, 'Too many sign-in attempts. Please try again later.', 'RATE_LIMITED');

    const store = await getStore();
    getJwtSecret(store.mode); // fail fast with NOT_CONFIGURED before touching credentials

    const auth = await store.getUserAuthByUsername(username);
    const passwordOk = await verifyPassword(password, auth?.passwordHash);
    if (!auth || auth.disabled || !passwordOk) throw invalidCredentials();

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
