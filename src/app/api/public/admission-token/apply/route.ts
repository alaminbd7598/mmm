import { HttpError, assertRateLimit, assertSameOrigin, handleError, json, readJson } from '@/src/server/http';
import { applyAdmissionToken } from '@/src/server/state/public-service';
import { describeZodError, tokenApplySchema } from '@/src/server/state/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 10;

/** `{tokenId, phone?, email?, leadId?}` -> marks the matching Active token as Applied. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    assertRateLimit(req, 'admission-token-apply', LIMIT, WINDOW_MS);
    const parsed = tokenApplySchema.safeParse(await readJson(req, 4 * 1024));
    if (!parsed.success) throw new HttpError(400, describeZodError(parsed.error), 'BAD_REQUEST');
    const result = await applyAdmissionToken(parsed.data);
    return json({ ok: true, ...result });
  } catch (err) {
    return handleError(err);
  }
}
