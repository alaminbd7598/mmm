import { getStore } from '@/src/server/db/store';
import { handleError, json, jsonError } from '@/src/server/http';
import { findProfile, toSafeUser } from '@/src/server/auth/safe-user';
import { getStaffSession } from '@/src/server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getStaffSession();
    if (!session) return jsonError(401, 'Sign-in required.', 'UNAUTHENTICATED');
    const store = await getStore();
    const [auth, snapshot] = await Promise.all([store.getUserAuthById(session.userId), store.getSnapshot()]);
    if (!auth) return jsonError(401, 'Sign-in required.', 'UNAUTHENTICATED');
    return json({
      ok: true,
      user: toSafeUser(findProfile(snapshot.state.users, auth.id), auth),
      mustChangePassword: auth.mustChangePassword,
    });
  } catch (err) {
    return handleError(err);
  }
}
