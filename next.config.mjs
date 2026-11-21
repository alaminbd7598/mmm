const isProduction = process.env.NODE_ENV === 'production';

/**
 * Content-Security-Policy. Next.js injects inline bootstrap scripts and the UI uses inline
 * styles, so 'unsafe-inline' is required for both; the policy still blocks foreign scripts,
 * plugins, <base> hijacking, form posts to other sites and framing of anything but the embed
 * providers the site uses (keep `frame-src` in step with src/utils/safeUrl.ts).
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https: http:",
  "media-src 'self' data: blob: https: http:",
  "connect-src 'self' https:",
  "frame-src 'self' blob: https://www.youtube.com https://www.youtube-nocookie.com https://www.facebook.com https://web.facebook.com https://www.google.com https://maps.google.com https://player.vimeo.com https://drive.google.com https://*.firebaseapp.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()' },
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  // Browsers ignore HSTS on plain HTTP (local `npm start`), so it is safe to send in every production build.
  ...(isProduction ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }] : []),
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker / Google Cloud Run builds set NEXT_OUTPUT=standalone for a minimal server bundle.
  // Vercel and Hostinger (`next start`) use the default output.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  reactStrictMode: false,
  poweredByHeader: false,
  images: { unoptimized: true },
  // The type check needs about 2 GB of RAM. Hosts with less can set SKIP_BUILD_TYPECHECK=1
  // (run `npm run lint` before pushing instead).
  typescript: { ignoreBuildErrors: process.env.SKIP_BUILD_TYPECHECK === '1' },
  // Bodies of routes matched by src/proxy.ts (/api/admin/*) are buffered; allow the sync limit.
  experimental: { proxyClientMaxBodySize: '12mb' },
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      {
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },
};

export default nextConfig;
