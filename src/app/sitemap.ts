import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { PUBLIC_PAGES, requestOrigin } from './seo';

// Rendered per request so the URLs are absolute even when the site URL is only known at runtime.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = requestOrigin(await headers());
  return Object.keys(PUBLIC_PAGES).map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === '/' || path === '/notices' || path === '/blog' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/admission' || path === '/fees' ? 0.9 : 0.7,
  }));
}
