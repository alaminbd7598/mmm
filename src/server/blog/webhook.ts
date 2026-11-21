import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import type { BlogAutomationConfig, BlogPostItem } from '../../types/cms';

/** The key shipped in the seed data; publicly known, so it never authorises webhook calls. */
export const LEGACY_DEFAULT_BLOG_API_KEY = 'mmm-blog-live-key-2027';

const DEFAULT_AUTHOR = 'Maharat Editorial Desk';
const DEFAULT_CATEGORY = 'Education & Tarbiyah';
const DEFAULT_COVER = '/assets/maharat/fb/fb-media-3.jpg';

/** BLOG_API_KEY env wins over the admin-set key; null when neither is usable. */
export function resolveBlogApiKey(
  envKey: string | undefined,
  config: Partial<BlogAutomationConfig> | undefined
): string | null {
  const key = envKey?.trim() || (typeof config?.apiKey === 'string' ? config.apiKey.trim() : '');
  if (!key || key === LEGACY_DEFAULT_BLOG_API_KEY) return null;
  return key;
}

export function extractBearerToken(header: string | null): string {
  const match = /^Bearer\s+(.+)$/i.exec(header?.trim() || '');
  return match ? match[1].trim() : '';
}

/** Constant-time comparison (hashing first makes the lengths equal and hides the key length). */
export function safeKeyEquals(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided, 'utf8').digest();
  const b = createHash('sha256').update(expected, 'utf8').digest();
  return timingSafeEqual(a, b) && provided.length > 0;
}

const text = (max: number) => z.string().trim().max(max);

const coverImageUrl = text(2_000).refine((v) => {
  if (v === '') return true;
  if (v.startsWith('/')) return !v.startsWith('//');
  try {
    const url = new URL(v);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}, 'coverImageUrl must be an http(s) URL or a site path starting with /');

export const blogWebhookSchema = z
  .object({
    title: text(300).optional(),
    titleBn: text(300).optional(),
    titleEn: text(300).optional(),
    titleAr: text(300).optional(),
    content: text(150_000).optional(),
    body: text(150_000).optional(),
    bodyMarkdownBn: text(150_000).optional(),
    bodyMarkdownEn: text(150_000).optional(),
    excerptBn: text(1_000).optional(),
    excerptEn: text(1_000).optional(),
    category: text(120).optional(),
    tags: z.array(text(60).min(1)).max(20).optional(),
    coverImageUrl: coverImageUrl.optional(),
    authorName: text(120).optional(),
    status: z.enum(['Published', 'Draft', 'Scheduled']).optional(),
  })
  .transform((b) => ({
    ...b,
    titleBn: b.titleBn || b.title || '',
    bodyMarkdownBn: b.bodyMarkdownBn || b.content || b.body || '',
  }))
  .refine((b) => b.titleBn && b.bodyMarkdownBn, {
    message: 'Both title (titleBn/title) and content (bodyMarkdownBn/content) are required.',
  });

export type BlogWebhookInput = z.output<typeof blogWebhookSchema>;

/** URL slug from the (English, else Bangla) title: ASCII only, max 60 chars, plus a 4-digit suffix. */
export function buildBlogSlug(title: string, existingSlugs: ReadonlySet<string>, now: number): string {
  const base =
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60)
      .replace(/^-+|-+$/g, '') || 'maharat-post';
  let slug = `${base}-${String(now).slice(-4)}`;
  while (existingSlugs.has(slug)) slug = `${base}-${randomBytes(3).toString('hex')}`;
  return slug;
}

export function buildWebhookBlogPost(
  input: BlogWebhookInput,
  config: Partial<BlogAutomationConfig> | undefined,
  existingSlugs: ReadonlySet<string>,
  now: Date
): BlogPostItem {
  const titleBn = input.titleBn;
  const titleEn = input.titleEn || input.title || titleBn;
  const bodyMarkdownBn = input.bodyMarkdownBn;
  const bodyMarkdownEn = input.bodyMarkdownEn || bodyMarkdownBn;
  const ms = now.getTime();
  return {
    id: `blog-api-${ms}-${randomBytes(3).toString('hex')}`,
    slug: buildBlogSlug(titleEn || titleBn, existingSlugs, ms),
    titleBn,
    titleEn,
    ...(input.titleAr ? { titleAr: input.titleAr } : {}),
    excerptBn: input.excerptBn || bodyMarkdownBn.slice(0, 160),
    excerptEn: input.excerptEn || bodyMarkdownEn.slice(0, 160),
    bodyMarkdownBn,
    bodyMarkdownEn,
    category: input.category || config?.defaultCategory || DEFAULT_CATEGORY,
    tags: input.tags ?? ['Maharat', 'Webhook'],
    coverImageUrl: input.coverImageUrl || DEFAULT_COVER,
    authorName: input.authorName || config?.defaultAuthorName || DEFAULT_AUTHOR,
    publishedAt: now.toISOString().slice(0, 10),
    status: input.status === 'Draft' || input.status === 'Scheduled' ? input.status : 'Published',
    source: 'api',
  };
}
