import { cookies } from 'next/headers';
import { assertSameOrigin, handleError, json } from '@/src/server/http';
import { clearStaffSession } from '@/src/server/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await clearStaffSession(await cookies());
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
