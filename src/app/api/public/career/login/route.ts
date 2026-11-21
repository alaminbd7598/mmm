import { HttpError, assertSameOrigin, clientIp, handleError, json, rateLimit, readJson } from '@/src/server/http';
import { loginCandidate } from '@/src/server/state/career-service';
import { candidateLoginSchema } from '@/src/server/state/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const WINDOW_MS = 15 * 60 * 1000;
const PER_ACCOUNT_LIMIT = 10;
const PER_IP_LIMIT = 30;

/** Sign a career candidate in; returns their profile and applications. */
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const parsed = candidateLoginSchema.safeParse(await readJson(req, 4 * 1024));
    if (!parsed.success) throw new HttpError(400, 'Email and password are required.', 'BAD_REQUEST');
    const { email, password } = parsed.data;

    const ip = clientIp(req);
    const allowed =
      rateLimit(`career-login-ip:${ip}`, PER_IP_LIMIT, WINDOW_MS) &&
      rateLimit(`career-login:${ip}:${email}`, PER_ACCOUNT_LIMIT, WINDOW_MS);
    if (!allowed) throw new HttpError(429, 'Too many sign-in attempts. Please try again later.', 'RATE_LIMITED');

    return json(await loginCandidate(email, password));
  } catch (err) {
    return handleError(err);
  }
}
