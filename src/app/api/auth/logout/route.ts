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
    const session = await getStaffSession().catch(() => null);
    if (session) await (await getStore()).bumpUserSessionVersion(session.userId);
    await clearStaffSession(await cookies());
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
