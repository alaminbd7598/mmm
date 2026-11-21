import { HttpError, assertRateLimit, assertSameOrigin, handleError, json, readJson } from '@/src/server/http';
import { careerApplicationStatus } from '@/src/server/state/career-service';
import { careerStatusSchema, describeZodError } from '@/src/server/state/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 10;

/** `{query}` (phone, WhatsApp, email or application id) -> `{ok, applications}` with status fields only. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    assertRateLimit(req, 'career-status', LIMIT, WINDOW_MS);
    const parsed = careerStatusSchema.safeParse(await readJson(req, 1024));
    if (!parsed.success) throw new HttpError(400, describeZodError(parsed.error), 'BAD_REQUEST');
    return json({ ok: true, applications: await careerApplicationStatus(parsed.data.query) });
  } catch (err) {
    return handleError(err);
  }
}
