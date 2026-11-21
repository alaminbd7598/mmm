import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Link2,
  Newspaper,
  Search,
  Share2,
  Sparkles,
  Tag,
  User,
  X,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { BlogPostItem } from '../types/cms';
import { localizeDigits } from '../utils/i18nContent';

type Lang = 'bn' | 'en' | 'ar';

const PAGE_SIZE = 9;
const POST_PARAM = 'post';

/** First non-empty value wins: requested language first, then sensible fallbacks. */
const pickText = (lang: Lang, bn?: string, en?: string, ar?: string): string => {
  const order = lang === 'bn' ? [bn, en, ar] : lang === 'ar' ? [ar, en, bn] : [en, bn, ar];
  return (order.find((v) => typeof v === 'string' && v.trim().length > 0) || '').trim();
};

const postTitle = (p: BlogPostItem, lang: Lang) => pickText(lang, p.titleBn, p.titleEn, p.titleAr);
const postExcerpt = (p: BlogPostItem, lang: Lang) => pickText(lang, p.excerptBn, p.excerptEn, p.excerptAr);
const postBody = (p: BlogPostItem, lang: Lang) =>
  pickText(lang, p.bodyMarkdownBn, p.bodyMarkdownEn, p.bodyMarkdownAr);

const parseDate = (value: string): Date | null => {
  if (!value) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDate = (value: string, lang: Lang): string => {
  const d = parseDate(value);
  if (!d) return value;
  try {
    const locale = lang === 'bn' ? 'bn-BD' : lang === 'ar' ? 'ar-EG' : 'en-GB';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  } catch {
    return value;
  }
};

const readingMinutes = (markdown: string): number => {
  const words = markdown.replace(/[#*_>`\-\[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
};

/** Only http(s), mailto and same-site paths/anchors survive; everything else is dropped. */
const safeLinkUrl = (url: string): string => {
  const u = (url || '').trim();
  if (/^(https?:\/\/|mailto:)/i.test(u)) return u;
  if (/^\/(?!\/)/.test(u) || u.startsWith('#')) return u;
  return '';
};

const safeImageUrl = (url: string): string => {
  const u = (url || '').trim();
  if (/^https?:\/\//i.test(u) || /^\/(?!\/)/.test(u)) return u;
  return '';
};

const isExternalHref = (href: string): boolean => {
  if (!/^https?:\/\//i.test(href)) return false;
  if (typeof window === 'undefined') return true;
  try {
    return new URL(href).host !== window.location.host;
  } catch {
    return true;
  }
};

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h2 className="mt-9 mb-4 text-2xl sm:text-3xl font-extrabold text-[#192f64] dark:text-white leading-snug">{children}</h2>
  ),
  h2: ({ children }) => (
    <h2 className="mt-9 mb-4 text-xl sm:text-2xl font-extrabold text-[#192f64] dark:text-white leading-snug">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-7 mb-3 text-lg sm:text-xl font-bold text-[#005a6e] dark:text-teal-300 leading-snug">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="mt-6 mb-2 text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="my-4 text-base sm:text-[17px] leading-8 text-slate-700 dark:text-slate-300">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 ps-6 list-disc space-y-2 text-base sm:text-[17px] leading-8 text-slate-700 dark:text-slate-300 marker:text-[#c4962c]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 ps-6 list-decimal space-y-2 text-base sm:text-[17px] leading-8 text-slate-700 dark:text-slate-300 marker:font-bold marker:text-[#005a6e] dark:marker:text-teal-300">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="ps-1">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-s-4 border-[#c4962c] bg-amber-50/70 dark:bg-amber-900/15 rounded-e-2xl px-5 py-2 italic">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-8 border-slate-200 dark:border-slate-800" />,
  code: ({ children }) => (
    <code dir="ltr" className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[0.9em] font-mono text-[#192f64] dark:text-teal-200">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre dir="ltr" className="my-5 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-x-auto text-sm leading-6 [&>code]:p-0 [&>code]:bg-transparent">
      {children}
    </pre>
  ),
  a: ({ href, children }) => {
    if (!href) return <span>{children}</span>;
    const external = isExternalHref(href);
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="font-semibold text-[#005a6e] dark:text-teal-300 underline underline-offset-4 decoration-[#c4962c]/60 hover:decoration-[#c4962c] break-words"
      >
        {children}
      </a>
    );
  },
  img: ({ src, alt }) =>
    typeof src === 'string' && src ? (
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="my-6 w-full max-h-[520px] object-cover rounded-2xl border border-slate-200 dark:border-slate-800"
      />
    ) : null,
};

const readPostParam = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return new URLSearchParams(window.location.search).get(POST_PARAM);
  } catch {
    return null;
  }
};

const buildPostUrl = (slug: string | null): string => {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set(POST_PARAM, slug);
  else url.searchParams.delete(POST_PARAM);
  return url.toString();
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
};

export const BlogPortalPage: React.FC = () => {
  const { state, language } = useCMS();
  const lang = language as Lang;
  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;
  const isRtl = language === 'ar';

  // Only Published posts are ever public; Draft and Scheduled stay hidden.
  const posts = useMemo(
    () =>
      (state.blogPosts || [])
        .filter((p) => p && p.status === 'Published')
        .slice()
        .sort((a, b) => (parseDate(b.publishedAt)?.getTime() || 0) - (parseDate(a.publishedAt)?.getTime() || 0)),
    [state.blogPosts],
  );

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeSlug, setActiveSlug] = useState<string | null>(() => readPostParam());
  const [brokenCovers, setBrokenCovers] = useState<Record<string, boolean>>({});
  const [shareNote, setShareNote] = useState<'copied' | 'failed' | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const articleHeadingRef = useRef<HTMLHeadingElement>(null);
  const hasMountedRef = useRef(false);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((p) => {
      const c = (p.category || '').trim();
      if (c) counts.set(c, (counts.get(c) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [posts]);

  const activePost = useMemo(
    () => (activeSlug ? posts.find((p) => p.slug === activeSlug || p.id === activeSlug) || null : null),
    [posts, activeSlug],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (category !== 'all' && (p.category || '').trim() !== category) return false;
      if (!q) return true;
      const haystack = [
        p.titleBn, p.titleEn, p.titleAr, p.excerptBn, p.excerptEn, p.excerptAr,
        p.category, p.authorName, ...(p.tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [posts, query, category]);

  const isFiltering = query.trim().length > 0 || category !== 'all';
  const featured = !isFiltering && filtered.length > 0 ? filtered[0] : null;
  const gridPosts = featured ? filtered.slice(1) : filtered;
  const shownPosts = gridPosts.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, category]);

  // Keep the reader in sync with the browser back/forward buttons.
  useEffect(() => {
    const onPop = () => setActiveSlug(readPostParam());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Leaving the blog page must not leave a stale ?post= in the address bar.
  useEffect(
    () => () => {
      try {
        if (readPostParam()) window.history.replaceState(window.history.state, '', buildPostUrl(null));
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const scrollToTop = () => {
    const el = topRef.current;
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  };

  const goTo = useCallback((slug: string | null) => {
    setActiveSlug(slug);
    setShareNote(null);
    try {
      window.history.pushState(window.history.state, '', buildPostUrl(slug));
    } catch {
      /* history unavailable (sandboxed preview) - in-memory state still works */
    }
  }, []);

  // Runs only when the reader opens/closes/changes, never on the first mount:
  // the host page already scrolls to the top when /blog is entered.
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    scrollToTop();
    if (activePost) articleHeadingRef.current?.focus({ preventScroll: true });
    else topRef.current?.focus({ preventScroll: true });
  }, [activePost?.id]);

  useEffect(() => {
    if (!shareNote) return;
    const t = window.setTimeout(() => setShareNote(null), 2600);
    return () => window.clearTimeout(t);
  }, [shareNote]);

  const handleCopyLink = async (post: BlogPostItem) => {
    const ok = await copyToClipboard(buildPostUrl(post.slug || post.id));
    setShareNote(ok ? 'copied' : 'failed');
  };

  const handleShare = async (post: BlogPostItem) => {
    const url = buildPostUrl(post.slug || post.id);
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: postTitle(post, lang), text: postExcerpt(post, lang), url });
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return;
      }
    }
    await handleCopyLink(post);
  };

  const minutesLabel = (body: string) => {
    const n = localizeDigits(readingMinutes(body), language);
    return tr(`${n} মিনিটের পাঠ`, `${n} min read`, `مدة القراءة: ${n} د`);
  };

  const renderCover = (post: BlogPostItem, className: string, eager = false) => {
    const src = safeImageUrl(post.coverImageUrl || '');
    if (!src || brokenCovers[post.id]) {
      return (
        <div
          aria-hidden="true"
          className={`${className} flex items-center justify-center bg-gradient-to-br from-[#192f64] via-[#14406b] to-[#005a6e]`}
        >
          <Newspaper className="w-12 h-12 text-[#f0c95e]/80" />
        </div>
      );
    }
    return (
      <img
        src={src}
        alt=""
        loading={eager ? 'eager' : 'lazy'}
        referrerPolicy="no-referrer"
        onError={() => setBrokenCovers((prev) => ({ ...prev, [post.id]: true }))}
        className={`${className} object-cover`}
      />
    );
  };

  const renderMeta = (post: BlogPostItem, tone: 'card' | 'article') => (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm ${
        tone === 'article' ? 'text-teal-50' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        <User className={`w-3.5 h-3.5 ${tone === 'article' ? 'text-[#f0c95e]' : 'text-[#005a6e] dark:text-teal-300'}`} aria-hidden="true" />
        <span dir="auto">{post.authorName || tr('মাহারাত সম্পাদকীয় ডেস্ক', 'Maharat Editorial Desk', 'هيئة تحرير المهارات')}</span>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Calendar className={`w-3.5 h-3.5 ${tone === 'article' ? 'text-[#f0c95e]' : 'text-[#005a6e] dark:text-teal-300'}`} aria-hidden="true" />
        <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, lang)}</time>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className={`w-3.5 h-3.5 ${tone === 'article' ? 'text-[#f0c95e]' : 'text-[#005a6e] dark:text-teal-300'}`} aria-hidden="true" />
        <span>{minutesLabel(postBody(post, lang))}</span>
      </span>
    </div>
  );

  const categoryBadge = (label: string) =>
    label ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#192f64]/8 dark:bg-white/10 border border-[#192f64]/15 dark:border-white/15 text-[#192f64] dark:text-[#f0c95e] text-[11px] sm:text-xs font-bold">
        <Tag className="w-3 h-3" aria-hidden="true" />
        <span dir="auto">{label}</span>
      </span>
    ) : null;

  const renderCard = (post: BlogPostItem) => (
    <article
      key={post.id}
      data-testid={`blog-card-${post.id}`}
      className="group flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition overflow-hidden"
    >
      <div className="relative overflow-hidden">
        {renderCover(post, 'w-full h-48 transition-transform duration-500 group-hover:scale-105')}
      </div>
      <div className="flex flex-col flex-1 p-5 sm:p-6 gap-3">
        <div>{categoryBadge((post.category || '').trim())}</div>
        <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-snug" dir="auto">
          <button
            type="button"
            onClick={() => goTo(post.slug || post.id)}
            className="text-start hover:text-[#005a6e] dark:hover:text-teal-300 focus:outline-none focus-visible:underline"
          >
            {postTitle(post, lang)}
          </button>
        </h3>
        <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 line-clamp-3" dir="auto">
          {postExcerpt(post, lang)}
        </p>
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {renderMeta(post, 'card')}
          <button
            type="button"
            data-testid={`blog-read-${post.id}`}
            onClick={() => goTo(post.slug || post.id)}
            aria-label={`${tr('সম্পূর্ণ পড়ুন', 'Read full article', 'اقرأ المقال كاملاً')}: ${postTitle(post, lang)}`}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#005a6e] dark:text-teal-300 hover:text-[#192f64] dark:hover:text-white"
          >
            <span>{tr('সম্পূর্ণ পড়ুন', 'Read article', 'اقرأ المقال')}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );

  const hero = (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#071129] via-[#192f64] to-[#005a6e] text-white py-16 sm:py-20 border-b border-[#e5b94c]/25">
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(240,201,94,0.55) 1px, transparent 0)',
          backgroundSize: '30px 30px',
        }}
      />
      <div className="cii-container-section relative z-10 text-center max-w-4xl mx-auto space-y-5">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#e5b94c]/45 text-[#f0c95e] text-xs sm:text-sm font-bold">
          <Newspaper className="w-4 h-4" aria-hidden="true" />
          <span>
            {tr(
              'মাহারাত মডেল মাদ্রাসা · অফিসিয়াল ব্লগ ও প্রবন্ধ',
              'Maharat Model Madrasah · Official Blog & Articles',
              'مدرسة المهارات النموذجية · المدونة الرسمية والمقالات',
            )}
          </span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
          {tr('ব্লগ ও প্রবন্ধ', 'Blog & Insights', 'المدونة والمقالات')}
        </h1>
        <p className="text-base sm:text-lg text-teal-50/90 max-w-2xl mx-auto leading-relaxed">
          {tr(
            'হিফজ, তারবিয়াহ, ভর্তি নির্দেশিকা ও ক্যাম্পাস জীবন নিয়ে মাহারাত পরিবারের নির্বাচিত লেখা।',
            'Selected writing from the Maharat family on Hifz, tarbiyah, admission guidance and campus life.',
            'مقالات مختارة من أسرة المهارات حول تحفيظ القرآن والتربية وإرشادات القبول والحياة المدرسية.',
          )}
        </p>
      </div>
    </section>
  );

  /* ------------------------------ ARTICLE READER ------------------------------ */
  if (activePost) {
    const body = postBody(activePost, lang);
    const title = postTitle(activePost, lang);
    const excerpt = postExcerpt(activePost, lang);
    const index = posts.findIndex((p) => p.id === activePost.id);
    const newer = index > 0 ? posts[index - 1] : null;
    const older = index >= 0 && index < posts.length - 1 ? posts[index + 1] : null;
    const related = posts
      .filter((p) => p.id !== activePost.id)
      .sort((a, b) => Number(b.category === activePost.category) - Number(a.category === activePost.category))
      .slice(0, 3);

    return (
      <div ref={topRef} tabIndex={-1} className="bg-slate-50 dark:bg-slate-950 min-h-screen scroll-mt-24 focus:outline-none" dir={isRtl ? 'rtl' : 'ltr'} data-testid="blog-article-view">
        <div className="bg-gradient-to-br from-[#071129] via-[#192f64] to-[#005a6e] text-white border-b border-[#e5b94c]/25">
          <div className="cii-container-section max-w-4xl mx-auto py-8 sm:py-12 space-y-5">
            <button
              type="button"
              data-testid="blog-back-btn"
              onClick={() => goTo(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c95e]"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
              <span>{tr('সকল প্রবন্ধে ফিরে যান', 'Back to all articles', 'العودة إلى جميع المقالات')}</span>
            </button>
            {(activePost.category || '').trim() && (
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#e5b94c]/45 text-[#f0c95e] text-xs font-bold">
                  <Tag className="w-3 h-3" aria-hidden="true" />
                  <span dir="auto">{activePost.category}</span>
                </span>
              </div>
            )}
            <h1
              ref={articleHeadingRef}
              tabIndex={-1}
              dir="auto"
              data-testid="blog-article-title"
              className="text-2xl sm:text-4xl font-extrabold leading-snug tracking-tight focus:outline-none"
            >
              {title}
            </h1>
            {excerpt && (
              <p className="text-base sm:text-lg text-teal-50/90 leading-relaxed" dir="auto">
                {excerpt}
              </p>
            )}
            {renderMeta(activePost, 'article')}
          </div>
        </div>

        <div className="cii-container-section max-w-4xl mx-auto py-8 sm:py-12 space-y-8">
          <article className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {safeImageUrl(activePost.coverImageUrl || '') && !brokenCovers[activePost.id] &&
              renderCover(activePost, 'w-full h-56 sm:h-96', true)}
            <div className="p-6 sm:p-10">
              <div dir="auto" data-testid="blog-article-body" className="break-words [&>*:first-child]:mt-0">
                {body ? (
                  <ReactMarkdown
                    skipHtml
                    components={markdownComponents}
                    urlTransform={(url, key) => (key === 'src' ? safeImageUrl(url) : safeLinkUrl(url))}
                  >
                    {body}
                  </ReactMarkdown>
                ) : (
                  <p className="text-slate-600 dark:text-slate-300">
                    {tr(
                      'এই প্রবন্ধের বিস্তারিত অংশ শীঘ্রই যুক্ত করা হবে।',
                      'The full text of this article will be added soon.',
                      'سيُضاف النص الكامل لهذا المقال قريباً.',
                    )}
                  </p>
                )}
              </div>

              {(activePost.tags || []).length > 0 && (
                <ul
                  className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-2"
                  aria-label={tr('ট্যাগসমূহ', 'Tags', 'الوسوم')}
                >
                  {(activePost.tags || []).map((t, i) => (
                    <li
                      key={`${t}-${i}`}
                      dir="auto"
                      className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                    >
                      #{t}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  data-testid="blog-share-btn"
                  onClick={() => handleShare(activePost)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#192f64] hover:bg-[#005a6e] text-white text-sm font-bold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4962c] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                >
                  <Share2 className="w-4 h-4" aria-hidden="true" />
                  <span>{tr('শেয়ার করুন', 'Share', 'مشاركة')}</span>
                </button>
                <button
                  type="button"
                  data-testid="blog-copy-link-btn"
                  onClick={() => handleCopyLink(activePost)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-[#c4962c] hover:text-[#192f64] dark:hover:text-[#f0c95e] text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4962c]"
                >
                  {shareNote === 'copied' ? (
                    <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Link2 className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>{tr('লিংক কপি করুন', 'Copy link', 'نسخ الرابط')}</span>
                </button>
                <span role="status" aria-live="polite" className="text-sm font-semibold">
                  {shareNote === 'copied' && (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {tr('লিংক কপি হয়েছে', 'Link copied', 'تم نسخ الرابط')}
                    </span>
                  )}
                  {shareNote === 'failed' && (
                    <span className="text-rose-700 dark:text-rose-400">
                      {tr(
                        'লিংক কপি করা যায়নি, ঠিকানা বার থেকে কপি করুন',
                        'Could not copy. Please copy the link from the address bar',
                        'تعذّر النسخ، يرجى نسخ الرابط من شريط العنوان',
                      )}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </article>

          {(newer || older) && (
            <nav
              className="grid sm:grid-cols-2 gap-4"
              aria-label={tr('আগের ও পরের প্রবন্ধ', 'Previous and next articles', 'المقال السابق والتالي')}
            >
              {[
                { post: older, label: tr('আগের প্রবন্ধ', 'Previous article', 'المقال السابق'), end: false },
                { post: newer, label: tr('পরের প্রবন্ধ', 'Next article', 'المقال التالي'), end: true },
              ].map(({ post, label, end }) =>
                post ? (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => goTo(post.slug || post.id)}
                    className={`rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#c4962c] p-5 shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4962c] ${
                      end ? 'text-end sm:col-start-2' : 'text-start'
                    }`}
                  >
                    <span className="block text-xs font-bold text-[#005a6e] dark:text-teal-300">{label}</span>
                    <span className="mt-1 block text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2" dir="auto">
                      {postTitle(post, lang)}
                    </span>
                  </button>
                ) : null,
              )}
            </nav>
          )}

          {related.length > 0 && (
            <section className="space-y-5" aria-labelledby="blog-related-heading">
              <h2 id="blog-related-heading" className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {tr('আরও পড়ুন', 'Keep reading', 'اقرأ أيضاً')}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{related.map(renderCard)}</div>
            </section>
          )}
        </div>
      </div>
    );
  }

  /* --------------------------------- LIST VIEW -------------------------------- */
  const chipClass = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4962c] ${
      active
        ? 'bg-[#192f64] border-[#192f64] text-white shadow-sm'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#c4962c]'
    }`;

  return (
    <div ref={topRef} tabIndex={-1} className="bg-slate-50 dark:bg-slate-950 min-h-screen scroll-mt-24 focus:outline-none" dir={isRtl ? 'rtl' : 'ltr'} data-testid="blog-portal-page">
      {hero}

      <div className="cii-container-section py-12 sm:py-16 space-y-10">
        {activeSlug && (
          <div
            role="status"
            className="rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 px-5 py-4 text-sm font-semibold"
          >
            {tr(
              'অনুরোধকৃত প্রবন্ধটি পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি। নিচে প্রকাশিত সকল প্রবন্ধ দেখুন।',
              'The requested article was not found or is not published yet. Browse all published articles below.',
              'المقال المطلوب غير موجود أو لم يُنشر بعد. تصفّح جميع المقالات المنشورة أدناه.',
            )}
          </div>
        )}

        {posts.length > 0 && (
          <section
            className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4"
            aria-label={tr('প্রবন্ধ খুঁজুন ও ফিল্টার করুন', 'Search and filter articles', 'البحث في المقالات وتصفيتها')}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <label htmlFor="blog-search-input" className="sr-only">
                  {tr('প্রবন্ধ অনুসন্ধান', 'Search articles', 'ابحث في المقالات')}
                </label>
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="blog-search-input"
                  data-testid="blog-search-input"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tr(
                    'শিরোনাম, বিষয় বা ট্যাগ লিখে খুঁজুন',
                    'Search by title, topic or tag',
                    'ابحث بالعنوان أو الموضوع أو الوسم',
                  )}
                  className="w-full ps-11 pe-11 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#005a6e] focus:border-transparent"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label={tr('অনুসন্ধান মুছুন', 'Clear search', 'مسح البحث')}
                    className="absolute end-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 shrink-0" aria-live="polite" data-testid="blog-result-count">
                {tr(
                  `${localizeDigits(filtered.length, language)}টি প্রবন্ধ`,
                  `${filtered.length} ${filtered.length === 1 ? 'article' : 'articles'}`,
                  `عدد المقالات: ${localizeDigits(filtered.length, language)}`,
                )}
              </p>
            </div>

            {categories.length > 0 && (
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={tr('বিষয়শ্রেণি অনুযায়ী ফিল্টার', 'Filter by category', 'تصفية حسب الفئة')}
                data-testid="blog-category-filter"
              >
                <button
                  type="button"
                  aria-pressed={category === 'all'}
                  onClick={() => setCategory('all')}
                  className={chipClass(category === 'all')}
                >
                  <span>{tr('সকল বিষয়', 'All topics', 'جميع المواضيع')}</span>
                  <span className="opacity-70">({localizeDigits(posts.length, language)})</span>
                </button>
                {categories.map(([name, count]) => (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={category === name}
                    onClick={() => setCategory(name)}
                    className={chipClass(category === name)}
                  >
                    <span dir="auto">{name}</span>
                    <span className="opacity-70">({localizeDigits(count, language)})</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {featured && (
          <article
            data-testid="blog-featured-card"
            className="group grid lg:grid-cols-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition overflow-hidden"
          >
            <div className="relative overflow-hidden min-h-[220px]">
              {renderCover(featured, 'w-full h-56 sm:h-72 lg:h-full lg:absolute lg:inset-0 transition-transform duration-500 group-hover:scale-105', true)}
              <span className="absolute top-4 start-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c4962c] text-white text-xs font-extrabold shadow">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{tr('সর্বশেষ প্রবন্ধ', 'Latest article', 'أحدث مقال')}</span>
              </span>
            </div>
            <div className="p-6 sm:p-9 flex flex-col justify-center gap-4">
              <div>{categoryBadge((featured.category || '').trim())}</div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-snug" dir="auto">
                {postTitle(featured, lang)}
              </h2>
              <p className="text-base leading-8 text-slate-600 dark:text-slate-300" dir="auto">
                {postExcerpt(featured, lang)}
              </p>
              {renderMeta(featured, 'card')}
              <div>
                <button
                  type="button"
                  data-testid={`blog-read-${featured.id}`}
                  onClick={() => goTo(featured.slug || featured.id)}
                  aria-label={`${tr('সম্পূর্ণ পড়ুন', 'Read full article', 'اقرأ المقال كاملاً')}: ${postTitle(featured, lang)}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#192f64] hover:bg-[#005a6e] text-white text-sm font-bold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4962c] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  <span>{tr('সম্পূর্ণ প্রবন্ধ পড়ুন', 'Read the full article', 'اقرأ المقال كاملاً')}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        )}

        {filtered.length === 0 ? (
          <section
            data-testid="blog-empty-state"
            className="rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-10 sm:p-14 text-center max-w-3xl mx-auto space-y-4"
          >
            <div className="mx-auto w-16 h-16 rounded-2xl bg-[#192f64]/10 dark:bg-white/10 flex items-center justify-center">
              <Newspaper className="w-8 h-8 text-[#192f64] dark:text-[#f0c95e]" aria-hidden="true" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {posts.length === 0
                ? tr('এখনো কোনো প্রবন্ধ প্রকাশিত হয়নি', 'No articles have been published yet', 'لم تُنشر أي مقالات بعد')
                : tr('কোনো প্রবন্ধ পাওয়া যায়নি', 'No matching articles', 'لا توجد مقالات مطابقة')}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              {posts.length === 0
                ? tr(
                    'শীঘ্রই এখানে মাহারাত পরিবারের নতুন লেখা প্রকাশিত হবে। অনুগ্রহ করে আবার ভিজিট করুন।',
                    'New writing from the Maharat family will appear here soon. Please check back.',
                    'ستُنشر هنا قريباً مقالات جديدة من أسرة المهارات. يرجى العودة لاحقاً.',
                  )
                : tr(
                    'অন্য শব্দ দিয়ে খুঁজুন অথবা ফিল্টার মুছে সকল প্রবন্ধ দেখুন।',
                    'Try a different search term, or clear the filters to see every article.',
                    'جرّب كلمة بحث أخرى أو امسح عوامل التصفية لعرض جميع المقالات.',
                  )}
            </p>
            {isFiltering && (
              <button
                type="button"
                data-testid="blog-clear-filters-btn"
                onClick={() => {
                  setQuery('');
                  setCategory('all');
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#192f64] hover:bg-[#005a6e] text-white text-sm font-bold transition"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>{tr('ফিল্টার মুছুন', 'Clear filters', 'مسح عوامل التصفية')}</span>
              </button>
            )}
          </section>
        ) : (
          shownPosts.length > 0 && (
            <section className="space-y-6" aria-labelledby="blog-list-heading">
              <h2 id="blog-list-heading" className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {isFiltering
                  ? tr('অনুসন্ধানের ফলাফল', 'Search results', 'نتائج البحث')
                  : tr('সাম্প্রতিক প্রবন্ধ', 'Recent articles', 'أحدث المقالات')}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="blog-posts-grid">
                {shownPosts.map(renderCard)}
              </div>
              {gridPosts.length > shownPosts.length && (
                <div className="text-center pt-2">
                  <button
                    type="button"
                    data-testid="blog-load-more-btn"
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#192f64] dark:border-[#f0c95e] text-[#192f64] dark:text-[#f0c95e] hover:bg-[#192f64] hover:text-white dark:hover:bg-[#f0c95e] dark:hover:text-[#071129] text-sm font-bold transition"
                  >
                    {tr('আরও প্রবন্ধ দেখুন', 'Load more articles', 'عرض مقالات أخرى')}
                  </button>
                </div>
              )}
            </section>
          )
        )}
      </div>
    </div>
  );
};
