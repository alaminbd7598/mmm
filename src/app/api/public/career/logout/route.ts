import { cookies } from 'next/headers';
import { clearCandidateSession } from '@/src/server/auth/candidate-session';
import { assertSameOrigin, handleError, json } from '@/src/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    await clearCandidateSession(await cookies());
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
