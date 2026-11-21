/**
 * Content-Security-Policy, shared by next.config.mjs (static answers: API, assets) and
 * src/proxy.ts (pages, with a per-request nonce). Plain ESM so the config file can import it.
 *
 * The policy blocks foreign scripts, plugins, <base> hijacking, form posts to other sites and
 * framing of anything but the embed providers the site uses (keep `frame-src` in step with
 * src/utils/safeUrl.ts). The UI uses inline styles, so `style-src` keeps 'unsafe-inline'.
 *
 * @param {{ nonce?: string, dev?: boolean }} [options]
 *   nonce: pages only. Scripts then run only with this nonce (or when loaded by such a script:
 *     'strict-dynamic'), so markup injected into a page cannot execute; 'unsafe-inline' stays in
 *     the list only as the fallback browsers without nonce support use, and is ignored by all
 *     others. Without a nonce (responses that are not HTML documents) inline scripts are allowed
 *     as before.
 *   dev: `next dev` needs eval for React's development tooling.
 * @returns {string}
 */
export function contentSecurityPolicy({ nonce, dev = false } = {}) {
  const script = nonce
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`
    : `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ''}`;
  return [
    "default-src 'self'",
    script,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' data: blob: https: http:",
    "connect-src 'self' https:",
    "frame-src 'self' blob: https://www.youtube.com https://www.youtube-nocookie.com https://www.facebook.com https://web.facebook.com https://www.google.com https://maps.google.com https://player.vimeo.com https://drive.google.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; ');
}
