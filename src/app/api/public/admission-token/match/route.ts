import { HttpError, assertRateLimit, assertSameOrigin, handleError, json, readJson } from '@/src/server/http';
import { matchAdmissionToken } from '@/src/server/state/public-service';
import { describeZodError, tokenMatchSchema } from '@/src/server/state/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 10;

/** `{phone?, email?}` -> `{ok, token}` with the minimal discount info of the guardian's Active token, or null. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    assertRateLimit(req, 'admission-token-match', LIMIT, WINDOW_MS);
    const parsed = tokenMatchSchema.safeParse(await readJson(req, 4 * 1024));
    if (!parsed.success) throw new HttpError(400, describeZodError(parsed.error), 'BAD_REQUEST');
    return json({ ok: true, token: await matchAdmissionToken(parsed.data) });
  } catch (err) {
    return handleError(err);
  }
}
