import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { requestOrigin } from './seo';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = requestOrigin(await headers());
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
