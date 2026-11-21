/** @type {import('next').NextConfig} */
const nextConfig = {
  // Docker / Google Cloud Run builds set NEXT_OUTPUT=standalone for a minimal server bundle.
  // Vercel and Hostinger (`next start`) use the default output.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  reactStrictMode: false,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
