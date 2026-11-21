import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { CMSState } from '@/src/types/cms';
import { getStore } from '@/src/server/db/store';
import { projectPublicState } from '@/src/server/state/project';
import ClientApp from '../ClientApp';
import { SITE_NAME, metadataForPath } from '../seo';

// Rendered per request: the page carries the current public content (and per-post blog metadata).
export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pathFromSlug(slug?: string[]): string {
  return slug && slug.length > 0 ? `/${slug.join('/')}` : '/';
}

/** Missing static files (`/assets/...`, `/something.png`) are real 404s, not the website shell. */
const looksLikeFile = (slug?: string[]): boolean =>
  Boolean(slug?.length) && (slug![0] === 'assets' || /\.[a-z0-9]{2,5}$/i.test(slug![slug!.length - 1]));

/** Larger public states are fetched by the browser instead of being embedded in every page. */
const MAX_EMBEDDED_STATE_CHARS = 1_500_000;

let embeddedCache: { version: number; state: Partial<CMSState> | null } | null = null;

/** The public projection for the first paint, or null when the store is unavailable or too large. */
async function initialPublicState(): Promise<Partial<CMSState> | null> {
  try {
    const snapshot = await (await getStore()).getSnapshot();
    if (embeddedCache?.version !== snapshot.version) {
      const state = projectPublicState(snapshot.state);
      embeddedCache = {
        version: snapshot.version,
        state: JSON.stringify(state).length <= MAX_EMBEDDED_STATE_CHARS ? state : null,
      };
    }
    return embeddedCache.state;
  } catch {
    // The browser falls back to its cached copy / built-in content and keeps retrying.
    return null;
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const path = pathFromSlug(slug);
  const base = metadataForPath(path);
  const postSlug = path === '/blog' && typeof query.post === 'string' ? query.post : '';
  if (!postSlug) return base;
  const post = (await initialPublicState())?.blogPosts?.find((p) => p.slug === postSlug);
  if (!post) return base;
  const title = `${post.titleBn || post.titleEn || postSlug} | ${SITE_NAME}`;
  const description = post.excerptBn || post.excerptEn || undefined;
  const cover = post.coverImageUrl && /^(https?:\/\/|\/(?!\/))/i.test(post.coverImageUrl) ? [post.coverImageUrl] : undefined;
  const url = `/blog?post=${encodeURIComponent(postSlug)}`;
  return {
    ...base,
    title,
    description,
    alternates: { canonical: url },
    openGraph: { ...base.openGraph, title, description, url, type: 'article', ...(cover ? { images: cover } : {}) },
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  if (looksLikeFile(slug)) notFound();
  return <ClientApp initialPublicState={await initialPublicState()} />;
}
