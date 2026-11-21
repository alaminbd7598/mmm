import { HttpError, assertRateLimit, assertSameOrigin, handleError, json, readJson } from '@/src/server/http';
import { registerCandidate } from '@/src/server/state/career-service';
import { candidateRegisterSchema, describeZodError } from '@/src/server/state/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 10;

/** Create a career candidate account and sign it in. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    assertRateLimit(req, 'career-register', LIMIT, WINDOW_MS);
    const parsed = candidateRegisterSchema.safeParse(await readJson(req, 8 * 1024));
    if (!parsed.success) throw new HttpError(400, describeZodError(parsed.error), 'BAD_REQUEST');
    return json(await registerCandidate(parsed.data));
  } catch (err) {
    return handleError(err);
  }
}
