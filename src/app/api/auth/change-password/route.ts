import { cookies } from 'next/headers';
import { z } from 'zod';
import { getStore } from '@/src/server/db/store';
import { HttpError, assertSameOrigin, handleError, json, rateLimit, readJson } from '@/src/server/http';
import { hashPassword, validateNewPassword, verifyPassword } from '@/src/server/auth/password';
import { createStaffSession, requireStaff } from '@/src/server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_MS = 15 * 60 * 1000;
const ATTEMPT_LIMIT = 10;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(1).max(256),
});

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const session = await requireStaff({ allowPendingPasswordChange: true });
    const parsed = changePasswordSchema.safeParse(await readJson(req, 4 * 1024));
    if (!parsed.success) throw new HttpError(400, 'Current and new password are required.', 'BAD_REQUEST');
    const { currentPassword, newPassword } = parsed.data;

    if (!rateLimit(`auth-change-password:${session.userId}`, ATTEMPT_LIMIT, WINDOW_MS)) {
      throw new HttpError(429, 'Too many attempts. Please try again later.', 'RATE_LIMITED');
    }

    const store = await getStore();
    const auth = await store.getUserAuthById(session.userId);
    if (!auth || auth.disabled) throw new HttpError(401, 'Sign-in required.', 'UNAUTHENTICATED');
    if (!(await verifyPassword(currentPassword, auth.passwordHash))) {
      throw new HttpError(403, 'The current password is incorrect.', 'INVALID_CREDENTIALS');
    }

    const policy = validateNewPassword(newPassword, auth.username);
    if (!policy.ok) throw new HttpError(400, policy.error, policy.code);
    if (newPassword === currentPassword) {
      throw new HttpError(400, 'The new password must differ from the current one.', 'SAME_AS_CURRENT');
    }

    await store.setUserPassword(auth.id, await hashPassword(newPassword), false);
    await createStaffSession(await cookies(), { ...session, mustChangePassword: false });
    return json({ ok: true, mustChangePassword: false });
  } catch (err) {
    return handleError(err);
  }
}
