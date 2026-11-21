import { NextResponse, type NextRequest } from 'next/server';
import { STAFF_SESSION_COOKIE } from './server/contracts';
import { hasConfiguredJwtSecret, modeFromEnv, resolveJwtSecret, verifyStaffToken } from './server/auth/jwt';

/**
 * First line of defence for /api/admin/*: rejects requests without a validly signed, unexpired
 * staff JWT. No database access here; route handlers re-check the account, its session version
 * and RBAC themselves.
 */
export async function proxy(request: NextRequest) {
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
  matcher: '/api/admin/:path*',
};
