import { HttpError, assertSameOrigin, handleError, json, readJson } from '@/src/server/http';
import { clientIp, isLimited, rateLimitClient } from '@/src/server/rate-limit';
import { loginCandidate } from '@/src/server/state/career-service';
import { candidateLoginSchema } from '@/src/server/state/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_MS = 15 * 60 * 1000;
/** Failed attempts per account, from any address. */
const CAREER_LOGIN_FAILURE_LIMIT = 10;
const PER_IP_LIMIT = 30;

/** Sign a career candidate in; returns their profile and applications. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const parsed = candidateLoginSchema.safeParse(await readJson(req, 4 * 1024));
    if (!parsed.success) throw new HttpError(400, 'Email and password are required.', 'BAD_REQUEST');
    const { email, password } = parsed.data;

    const accountKey = `career-login-account:${email}`;
    const ipAllowed = rateLimitClient('career-login-ip', clientIp(req), PER_IP_LIMIT, WINDOW_MS);
    if (!ipAllowed || isLimited(accountKey, CAREER_LOGIN_FAILURE_LIMIT)) {
      throw new HttpError(429, 'Too many sign-in attempts. Please try again later.', 'RATE_LIMITED');
    }

    return json(await loginCandidate(email, password, { failureKey: accountKey, limit: CAREER_LOGIN_FAILURE_LIMIT, windowMs: WINDOW_MS }));
  } catch (err) {
    return handleError(err);
  }
}
