import { NextResponse, type NextRequest } from 'next/server';
import { STAFF_SESSION_COOKIE } from './server/contracts';
import { contentSecurityPolicy } from './csp.mjs';
import { hasConfiguredJwtSecret, modeFromEnv, resolveJwtSecret, verifyStaffToken } from './server/auth/jwt';

/** Request header through which the layout learns the nonce of the page being rendered. */
const NONCE_HEADER = 'x-nonce';

/**
 * Pages: a fresh script nonce per request. Next.js reads it from the Content-Security-Policy
 * request header and puts it on every script it emits; the layout adds it to its own inline
 * script. The response carries the same policy, replacing the static one from next.config.mjs.
 */
function pageWithNonce(request: NextRequest): NextResponse {
  const nonce = btoa(crypto.randomUUID());
  const policy = contentSecurityPolicy({ nonce, dev: process.env.NODE_ENV !== 'production' });
  const headers = new Headers(request.headers);
  headers.set(NONCE_HEADER, nonce);
  headers.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
}

/**
 * /api/admin/*: first line of defence, rejects requests without a validly signed, unexpired
 * staff JWT. No database access here; route handlers re-check the account, its session version
 * and RBAC themselves. Every other matched path is a page and gets its CSP nonce.
 */
export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/admin/')) return pageWithNonce(request);
  const mode = modeFromEnv();
  // Demo mode without JWT_SECRET signs with a per-process key that this proxy may not share on
  // every platform; the route handlers do the full check there.
  if (mode === 'demo' && !hasConfiguredJwtSecret()) return NextResponse.next();
  const secret = resolveJwtSecret(mode);
  if (!secret.ok) {
    return NextResponse.json(
      { ok: false, error: 'Authentication is not configured on this server.', code: 'NOT_CONFIGURED' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  const session = await verifyStaffToken(request.cookies.get(STAFF_SESSION_COOKIE)?.value, secret.secret);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Sign-in required.', code: 'UNAUTHENTICATED' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/admin/:path*',
    // Pages only: no API routes, nothing under /_next (build output, the dev server's own
    // endpoints), static assets or metadata files.
    '/((?!api/|_next/|assets/|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};
