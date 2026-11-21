/** Pure cookie-option helpers shared by the staff and candidate session modules. */

export interface SessionCookieOptions {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: '/';
  maxAge: number;
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/** Hostname of a Host header value ("example.com:3000" -> "example.com", "[::1]:3000" -> "[::1]"). */
export function hostnameOf(host: string | null | undefined): string {
  const h = (host || '').split(',')[0].trim().toLowerCase();
  if (h.startsWith('[')) return h.slice(0, h.indexOf(']') + 1);
  return h.split(':')[0];
}

/**
 * Cookies are Secure in production, except when the app is served to localhost over plain HTTP
 * (e.g. `next start` on a developer machine), where browsers would otherwise drop them.
 */
export function shouldUseSecureCookie(nodeEnv: string | undefined, host: string | null | undefined): boolean {
  if (nodeEnv !== 'production') return false;
  const name = hostnameOf(host);
  return !(LOCAL_HOSTNAMES.has(name) || name.endsWith('.localhost'));
}

export function sessionCookieOptions(maxAgeSeconds: number, secure: boolean): SessionCookieOptions {
  return { httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: maxAgeSeconds };
}
