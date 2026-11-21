import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_DEFAULT_BLOG_API_KEY,
  blogWebhookSchema,
  buildBlogSlug,
  buildWebhookBlogPost,
  extractBearerToken,
  resolveBlogApiKey,
  safeKeyEquals,
} from './webhook';

test('resolveBlogApiKey prefers env and refuses empty or legacy keys', () => {
  assert.equal(resolveBlogApiKey(' env-key-123456 ', { apiKey: 'cfg-key-123456' }), 'env-key-123456');
  assert.equal(resolveBlogApiKey(undefined, { apiKey: ' cfg-key-123456 ' }), 'cfg-key-123456');
  assert.equal(resolveBlogApiKey('', { apiKey: '' }), null);
  assert.equal(resolveBlogApiKey(undefined, { apiKey: LEGACY_DEFAULT_BLOG_API_KEY }), null);
  assert.equal(resolveBlogApiKey(LEGACY_DEFAULT_BLOG_API_KEY, undefined), null);
});

test('bearer extraction and constant-time comparison', () => {
  assert.equal(extractBearerToken('Bearer  abc '), 'abc');
  assert.equal(extractBearerToken('bearer abc'), 'abc');
  assert.equal(extractBearerToken('Basic abc'), '');
  assert.equal(extractBearerToken(null), '');
  assert.equal(safeKeyEquals('secret-key', 'secret-key'), true);
  assert.equal(safeKeyEquals('secret-kez', 'secret-key'), false);
  assert.equal(safeKeyEquals('short', 'a-much-longer-key'), false);
  assert.equal(safeKeyEquals('', ''), false);
});

test('slug: ascii from title, 60-char cap, suffix, uniqueness, fallback', () => {
  const now = 1_700_000_001_234;
  assert.equal(buildBlogSlug('Hello, World!  Again', new Set(), now), 'hello-world-again-1234');
  assert.equal(buildBlogSlug('শুধু বাংলা', new Set(), now), 'maharat-post-1234');
  const long = buildBlogSlug('a'.repeat(100), new Set(), now);
  assert.equal(long, `${'a'.repeat(60)}-1234`);
  const taken = buildBlogSlug('Hello', new Set(['hello-1234']), now);
  assert.match(taken, /^hello-[0-9a-f]{6}$/);
});

test('webhook schema: aliases, required fields, url and tag validation', () => {
  const ok = blogWebhookSchema.parse({ title: 'T', content: 'C', tags: ['a'] });
  assert.equal(ok.titleBn, 'T');
  assert.equal(ok.bodyMarkdownBn, 'C');
  assert.equal(blogWebhookSchema.safeParse({ title: 'T' }).success, false);
  assert.equal(blogWebhookSchema.safeParse({ title: 'T', content: 'C', coverImageUrl: 'javascript:alert(1)' }).success, false);
  assert.equal(blogWebhookSchema.safeParse({ title: 'T', content: 'C', coverImageUrl: '//evil.test/x.png' }).success, false);
  assert.equal(blogWebhookSchema.safeParse({ title: 'T', content: 'C', coverImageUrl: '/assets/a.jpg' }).success, true);
  assert.equal(blogWebhookSchema.safeParse({ title: 'T', content: 'C', coverImageUrl: 'https://x.test/a.jpg' }).success, true);
  assert.equal(blogWebhookSchema.safeParse({ title: 'T', content: 'C', tags: 'a' }).success, false);
  assert.equal(blogWebhookSchema.safeParse({ title: 'x'.repeat(301), content: 'C' }).success, false);
});

test('buildWebhookBlogPost applies defaults like the legacy webhook', () => {
  const input = blogWebhookSchema.parse({ titleBn: 'শিরোনাম', titleEn: 'My Post', bodyMarkdownBn: 'বডি', status: 'Draft' });
  const post = buildWebhookBlogPost(
    input,
    { defaultAuthorName: 'Desk', defaultCategory: 'Cat' },
    new Set(),
    new Date('2026-11-21T10:00:00Z')
  );
  assert.match(post.id, /^blog-api-\d+-[0-9a-f]{6}$/);
  assert.match(post.slug, /^my-post-\d{4}$/);
  assert.equal(post.bodyMarkdownEn, 'বডি');
  assert.equal(post.authorName, 'Desk');
  assert.equal(post.category, 'Cat');
  assert.deepEqual(post.tags, ['Maharat', 'Webhook']);
  assert.equal(post.publishedAt, '2026-11-21');
  assert.equal(post.status, 'Draft');
  assert.equal(post.source, 'api');
  assert.equal('titleAr' in post, false);
});
