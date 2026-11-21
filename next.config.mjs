import { contentSecurityPolicy } from './src/csp.mjs';

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Content-Security-Policy for everything the proxy does not answer (API responses, assets and
 * other non-document responses). Pages get the same policy with a per-request script nonce from
 * src/proxy.ts, which replaces this header there.
 */
const CONTENT_SECURITY_POLICY = contentSecurityPolicy({ dev: !isProduction });

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
  // Memory: `npm run build` runs `tsc` on its own before `next build`, so the bundler and the
  // type checker never hold memory at the same time, and build workers are limited to one.
  // Together the build fits in about 1.3 GB of RAM (see docs/ARCHITECTURE.md, "Build").
  typescript: { ignoreBuildErrors: true },
  experimental: {
    cpus: 1,
    // Bodies of routes matched by src/proxy.ts (/api/admin/*) are buffered; allow the sync limit.
    proxyClientMaxBodySize: '12mb',
  },
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
