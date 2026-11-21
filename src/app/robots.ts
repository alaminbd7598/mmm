import type { MetadataRoute } from 'next';
import { siteUrl } from './seo';

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl()?.origin;
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] }],
    sitemap: base ? `${base}/sitemap.xml` : undefined,
  };
}
