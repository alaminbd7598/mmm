import type { MetadataRoute } from 'next';
import { PUBLIC_PAGES, siteUrl } from './seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()?.origin ?? '';
  return Object.keys(PUBLIC_PAGES).map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === '/' || path === '/notices' || path === '/blog' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/admission' || path === '/fees' ? 0.9 : 0.7,
  }));
}
