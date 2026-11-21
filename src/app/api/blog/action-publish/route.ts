import type { SyncOp } from '@/src/server/contracts';
import { getStore } from '@/src/server/db/store';
import { HttpError, assertRateLimit, handleError, json, readJson } from '@/src/server/http';
import {
  blogWebhookSchema,
  buildWebhookBlogPost,
  extractBearerToken,
  resolveBlogApiKey,
  safeKeyEquals,
} from '@/src/server/blog/webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 256 * 1024;

/** Blog automation webhook (server-to-server; authenticated by Bearer API key, not cookies). */
export async function POST(req: Request) {
  try {
    assertRateLimit(req, 'blog-webhook', 30, 60 * 60 * 1000);
    const store = await getStore();
    const { state } = await store.getSnapshot();
    const config = state.blogAutomationConfig;

    if (config?.enabled === false) {
      throw new HttpError(403, 'Blog Automation API is disabled in Admin.', 'DISABLED');
    }
    const expectedKey = resolveBlogApiKey(process.env.BLOG_API_KEY, config);
    if (!expectedKey) throw new HttpError(503, 'Blog API key not configured', 'NOT_CONFIGURED');
    if (!safeKeyEquals(extractBearerToken(req.headers.get('authorization')), expectedKey)) {
      throw new HttpError(401, 'Invalid or missing Bearer API key.', 'UNAUTHENTICATED');
    }

    const parsed = blogWebhookSchema.safeParse(await readJson(req, MAX_BODY_BYTES));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const where = issue?.path.length ? `${issue.path.join('.')}: ` : '';
      throw new HttpError(400, `${where}${issue?.message || 'Invalid blog post payload.'}`, 'BAD_REQUEST');
    }

    const existingSlugs = new Set((state.blogPosts || []).map((p) => p.slug));
    const post = buildWebhookBlogPost(parsed.data, config, existingSlugs, new Date());
    const ops: SyncOp[] = [
      { op: 'upsert', key: 'blogPosts', item: post as unknown as { id: string } & Record<string, unknown> },
      { op: 'order', key: 'blogPosts', ids: [post.id] },
    ];
    const saved = await store.applyOps(ops);
    return json({ ok: true, post, version: saved.version }, 201);
  } catch (err) {
    return handleError(err);
  }
}
