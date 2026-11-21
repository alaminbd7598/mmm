import { assertRateLimit, assertSameOrigin, clientIp, handleError, json, readJson } from '@/src/server/http';
import { runPublicSubmit } from '@/src/server/state/public-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 6 * 1024 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
/** Guardians often share one address (school Wi-Fi, mobile carrier NAT), so the per-address limit is generous. */
const LIMIT = 30;

/** Anonymous create-only submissions: leads, admin notification logs, complaints, job applications. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    assertRateLimit(req, 'public-submit', LIMIT, WINDOW_MS);
    return json(await runPublicSubmit(await readJson(req, MAX_BODY_BYTES), clientIp(req)));
  } catch (err) {
    return handleError(err);
  }
}
