import { cookies } from 'next/headers';
import { assertSameOrigin, handleError, json } from '@/src/server/http';
import { getStore } from '@/src/server/db/store';
import { clearStaffSession, getStaffSession } from '@/src/server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    // Void the token itself (on every device), not just this browser's cookie.
    try {
      const session = await getStaffSession();
      if (session) await (await getStore()).bumpUserSessionVersion(session.userId);
    } catch (err) {
      // Revocation is recorded in the store. When the store cannot be reached, this browser is
      // still signed out below; a copy of the token stays usable until it expires (8 h at most).
      console.warn('[auth] logout could not revoke the session on the server:', err instanceof Error ? err.name : 'unknown');
    }
    await clearStaffSession(await cookies());
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
