import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import {
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  FilePlus2,
  KeyRound,
  Newspaper,
  Pencil,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  Webhook,
  X,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import type { BlogAutomationConfig, BlogPostItem, BlogPostStatus } from '../types/cms';
import { hasRolePermission } from '../utils/cmsLogic';

type EditorLang = 'bn' | 'en' | 'ar';
type StatusFilter = 'all' | BlogPostStatus;

interface BlogDraft {
  id: string | null;
  slug: string;
  titleBn: string;
  titleEn: string;
  titleAr: string;
  excerptBn: string;
  excerptEn: string;
  excerptAr: string;
  bodyMarkdownBn: string;
  bodyMarkdownEn: string;
  bodyMarkdownAr: string;
  category: string;
  tagsText: string;
  coverImageUrl: string;
  authorName: string;
  publishedAt: string;
  status: BlogPostStatus;
  source: BlogPostItem['source'];
}

const DEFAULT_AUTOMATION: BlogAutomationConfig = {
  enabled: true,
  apiKey: 'mmm-blog-live-key-2027',
  defaultAuthorName: 'Maharat Editorial Desk',
  defaultCategory: 'Education & Tarbiyah',
};

const STATUSES: BlogPostStatus[] = ['Published', 'Scheduled', 'Draft'];

const STATUS_BADGE: Record<BlogPostStatus, string> = {
  Published: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  Scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  Draft: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

const CARD =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';
const INPUT =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#005a6e] focus:ring-2 focus:ring-[#005a6e]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100';
const LABEL = 'mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300';
const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#192f64] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#12234d] disabled:cursor-not-allowed disabled:opacity-50';
const BTN_GHOST =
  'inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700';

const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mb-3 mt-4 text-xl font-bold text-[#192f64] dark:text-[#f0c95e]">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2 mt-4 text-lg font-bold text-[#192f64] dark:text-[#f0c95e]">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-3 text-base font-semibold text-[#005a6e] dark:text-teal-300">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc space-y-1 ps-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal space-y-1 ps-5">{children}</ol>,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-s-4 border-[#c4962c] bg-amber-50/60 px-3 py-2 italic dark:bg-amber-900/10">
      {children}
    </blockquote>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[#005a6e] underline dark:text-teal-300"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 text-[0.85em] dark:bg-slate-800">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl bg-slate-100 p-3 text-xs dark:bg-slate-800">
      {children}
    </pre>
  ),
  img: ({ src, alt }) => (
    <img src={src} alt={alt || ''} loading="lazy" className="my-3 max-h-72 rounded-xl" />
  ),
  hr: () => <hr className="my-4 border-slate-200 dark:border-slate-700" />,
};

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Only same-site paths, http(s) and inline raster images may be used as a cover image. */
const safeImageUrl = (value: string | undefined | null): string => {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(url)) return url;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  return '';
};

/** Plain-text excerpt from a markdown body (used when no excerpt was typed). */
const excerptFrom = (markdown: string) =>
  markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, '')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);

/** Quote a value for use inside a single-quoted POSIX shell string. */
const shellQuote = (value: string) => value.replace(/'/g, `'\\''`);

const KEY_MASK = '••••••••••••';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '');

const generateApiKey = () => {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return `mmm-blog-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
};

export const AdminBlogTab: React.FC = () => {
  const {
    state,
    currentUser,
    language,
    addBlogPost,
    updateBlogPost,
    deleteBlogPost,
    updateBlogAutomationConfig,
    pushToast,
  } = useCMS();

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const userRole = currentUser?.role || 'Super Admin';
  const canCreate = hasRolePermission(userRole, 'blog', 'create', state.rbacMatrix);
  const canEdit = hasRolePermission(userRole, 'blog', 'edit', state.rbacMatrix);
  const canDelete = hasRolePermission(userRole, 'blog', 'delete', state.rbacMatrix);

  const posts = useMemo(() => state.blogPosts || [], [state.blogPosts]);
  const savedConfig: BlogAutomationConfig = {
    ...DEFAULT_AUTOMATION,
    ...(state.blogAutomationConfig || {}),
  };

  const statusLabel = (s: BlogPostStatus) =>
    s === 'Published'
      ? tr('প্রকাশিত', 'Published', 'منشور')
      : s === 'Scheduled'
        ? tr('নির্ধারিত', 'Scheduled', 'مجدول')
        : tr('খসড়া', 'Draft', 'مسودة');

  const sourceLabel = (src: BlogPostItem['source']) =>
    src === 'api' || src === 'api-webhook'
      ? tr('API ওয়েবহুক', 'API webhook', 'واجهة API')
      : src === 'ai-publisher' || src === 'ai-assistant'
        ? tr('এআই পাবলিশার', 'AI publisher', 'ناشر الذكاء الاصطناعي')
        : tr('ম্যানুয়াল', 'Manual', 'يدوي');

  // ---------- Post list ----------
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      Published: posts.filter((p) => p.status === 'Published').length,
      Scheduled: posts.filter((p) => p.status === 'Scheduled').length,
      Draft: posts.filter((p) => p.status === 'Draft').length,
    }),
    [posts],
  );

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts
      .filter((p) => statusFilter === 'all' || p.status === statusFilter)
      .filter((p) => {
        if (!q) return true;
        return [
          p.titleBn,
          p.titleEn,
          p.titleAr || '',
          p.slug,
          p.category,
          p.authorName,
          ...(p.tags || []),
        ]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  }, [posts, search, statusFilter]);

  // ---------- Editor ----------
  const buildEmptyDraft = (): BlogDraft => ({
    id: null,
    slug: '',
    titleBn: '',
    titleEn: '',
    titleAr: '',
    excerptBn: '',
    excerptEn: '',
    excerptAr: '',
    bodyMarkdownBn: '',
    bodyMarkdownEn: '',
    bodyMarkdownAr: '',
    category: savedConfig.defaultCategory,
    tagsText: '',
    coverImageUrl: '',
    authorName: currentUser?.fullName || savedConfig.defaultAuthorName,
    publishedAt: todayIso(),
    status: 'Draft',
    source: 'manual',
  });

  const [draft, setDraft] = useState<BlogDraft | null>(null);
  const [editorLang, setEditorLang] = useState<EditorLang>('bn');
  const [showPreview, setShowPreview] = useState(true);
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState('');

  const patchDraft = (patch: Partial<BlogDraft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const openNew = () => {
    setDraft(buildEmptyDraft());
    setSlugTouched(false);
    setEditorLang('bn');
    setFormError('');
    setEditorOpenTick((n) => n + 1);
  };

  const openEdit = (post: BlogPostItem) => {
    setDraft({
      id: post.id,
      slug: post.slug || '',
      titleBn: post.titleBn || '',
      titleEn: post.titleEn || '',
      titleAr: post.titleAr || '',
      excerptBn: post.excerptBn || '',
      excerptEn: post.excerptEn || '',
      excerptAr: post.excerptAr || '',
      bodyMarkdownBn: post.bodyMarkdownBn || '',
      bodyMarkdownEn: post.bodyMarkdownEn || '',
      bodyMarkdownAr: post.bodyMarkdownAr || '',
      category: post.category || '',
      tagsText: (post.tags || []).join(', '),
      coverImageUrl: post.coverImageUrl || '',
      authorName: post.authorName || '',
      publishedAt: (post.publishedAt || todayIso()).slice(0, 10),
      status: STATUSES.includes(post.status) ? post.status : 'Draft',
      source: post.source,
    });
    setSlugTouched(true);
    setEditorLang('bn');
    setFormError('');
    setEditorOpenTick((n) => n + 1);
  };

  const closeEditor = () => {
    setDraft(null);
    setFormError('');
  };

  // The editor renders above the list: bring it into view and focus it when it opens.
  const editorRef = useRef<HTMLFormElement>(null);
  const [editorOpenTick, setEditorOpenTick] = useState(0);
  useEffect(() => {
    if (!editorOpenTick) return;
    const form = editorRef.current;
    if (!form) return;
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    form.querySelector<HTMLInputElement>('#blog-title')?.focus({ preventScroll: true });
  }, [editorOpenTick]);

  const editorLocked = draft ? (draft.id ? !canEdit : !canCreate) : true;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || editorLocked) return;
    const titleBn = draft.titleBn.trim();
    const bodyBn = draft.bodyMarkdownBn.trim();
    if (!titleBn || !bodyBn) {
      setEditorLang('bn');
      setFormError(
        tr(
          'বাংলা শিরোনাম ও বাংলা মূল লেখা আবশ্যক।',
          'The Bangla title and Bangla body are required.',
          'العنوان والمحتوى باللغة البنغالية مطلوبان.',
        ),
      );
      return;
    }
    const titleEn = draft.titleEn.trim() || titleBn;
    const bodyEn = draft.bodyMarkdownEn.trim() || bodyBn;
    let slug =
      slugify(draft.slug) || slugify(titleEn) || `maharat-post-${Date.now().toString().slice(-6)}`;
    if (posts.some((p) => p.slug === slug && p.id !== draft.id)) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    const rawCover = draft.coverImageUrl.trim();
    if (rawCover && !safeImageUrl(rawCover)) {
      setFormError(
        tr(
          'কভার ছবির URL অবশ্যই https:// অথবা / দিয়ে শুরু হতে হবে।',
          'The cover image URL must start with https:// or /.',
          'يجب أن يبدأ رابط صورة الغلاف بـ https:// أو /.',
        ),
      );
      return;
    }
    const tags = Array.from(
      new Set(
        draft.tagsText
          .split(/[,،\n]/)
          .map((t) => t.trim())
          .filter(Boolean),
      ),
    );
    const payload: Omit<BlogPostItem, 'id'> = {
      slug,
      titleBn,
      titleEn,
      titleAr: draft.titleAr.trim() || undefined,
      excerptBn: draft.excerptBn.trim() || excerptFrom(bodyBn),
      excerptEn: draft.excerptEn.trim() || excerptFrom(bodyEn),
      excerptAr: draft.excerptAr.trim() || undefined,
      bodyMarkdownBn: bodyBn,
      bodyMarkdownEn: bodyEn,
      bodyMarkdownAr: draft.bodyMarkdownAr.trim() || undefined,
      category: draft.category.trim() || savedConfig.defaultCategory,
      tags,
      coverImageUrl: rawCover || undefined,
      authorName: draft.authorName.trim() || savedConfig.defaultAuthorName,
      publishedAt: draft.publishedAt || todayIso(),
      status: draft.status,
      source: draft.source || 'manual',
    };
    if (draft.id) updateBlogPost({ ...payload, id: draft.id });
    else addBlogPost(payload);
    closeEditor();
  };

  const cycleStatus = (post: BlogPostItem) => {
    if (!canEdit) return;
    updateBlogPost({
      ...post,
      status: post.status === 'Published' ? 'Draft' : 'Published',
    });
  };

  const handleDelete = (id: string) => {
    if (!canDelete) return;
    deleteBlogPost(id);
    setConfirmDeleteId(null);
    if (draft?.id === id) closeEditor();
  };

  // ---------- Automation API ----------
  const [cfg, setCfg] = useState<BlogAutomationConfig>(savedConfig);
  const [showKey, setShowKey] = useState(false);
  const savedSignature = JSON.stringify(savedConfig);
  useEffect(() => {
    setCfg(JSON.parse(savedSignature) as BlogAutomationConfig);
  }, [savedSignature]);
  const cfgDirty = JSON.stringify(cfg) !== savedSignature;

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://maharatmadrasah.edu.bd';
  const endpoint = `${origin}/api/blog/action-publish`;
  const curlFor = (key: string) =>
    [
      `curl -X POST '${shellQuote(endpoint)}' \\`,
      `  -H 'Authorization: Bearer ${shellQuote(key)}' \\`,
      `  -H 'Content-Type: application/json' \\`,
      `  -d '${shellQuote(
        JSON.stringify(
          {
            titleBn: 'নতুন ব্লগ পোস্টের শিরোনাম',
            titleEn: 'New blog post title',
            bodyMarkdownBn: '## শিরোনাম\n\nমূল লেখা (Markdown)।',
            bodyMarkdownEn: '## Heading\n\nBody in Markdown.',
            category: cfg.defaultCategory,
            tags: ['Maharat'],
            authorName: cfg.defaultAuthorName,
            status: 'Draft',
          },
          null,
          2,
        ),
      )}'`,
    ].join('\n');

  const copyText = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      pushToast(tr('কপি হয়েছে', 'Copied', 'تم النسخ'), what, 'success');
    } catch {
      pushToast(
        tr('কপি করা যায়নি', 'Copy failed', 'تعذّر النسخ'),
        tr(
          'ব্রাউজার ক্লিপবোর্ড অনুমতি দেয়নি।',
          'The browser blocked clipboard access.',
          'منع المتصفح الوصول إلى الحافظة.',
        ),
        'info',
      );
    }
  };

  const saveConfig = () => {
    if (!canEdit) return;
    const apiKey = cfg.apiKey.trim();
    if (apiKey.length < 12) {
      pushToast(
        tr('API কী খুব ছোট', 'API key too short', 'مفتاح API قصير جداً'),
        tr(
          'কমপক্ষে ১২ অক্ষরের কী ব্যবহার করুন।',
          'Use a key of at least 12 characters.',
          'استخدم مفتاحاً من 12 حرفاً على الأقل.',
        ),
        'info',
      );
      return;
    }
    updateBlogAutomationConfig({
      enabled: cfg.enabled,
      apiKey,
      defaultAuthorName: cfg.defaultAuthorName.trim() || DEFAULT_AUTOMATION.defaultAuthorName,
      defaultCategory: cfg.defaultCategory.trim() || DEFAULT_AUTOMATION.defaultCategory,
    });
  };

  // ---------- Editor field helpers ----------
  const langField = <K extends 'title' | 'excerpt' | 'bodyMarkdown'>(base: K) =>
    `${base}${editorLang === 'bn' ? 'Bn' : editorLang === 'en' ? 'En' : 'Ar'}` as keyof BlogDraft;
  const langName =
    editorLang === 'bn'
      ? tr('বাংলা', 'Bangla', 'البنغالية')
      : editorLang === 'en'
        ? tr('ইংরেজি', 'English', 'الإنجليزية')
        : tr('আরবি', 'Arabic', 'العربية');
  const fieldDir = editorLang === 'ar' ? 'rtl' : 'ltr';
  const previewBody = draft ? String(draft[langField('bodyMarkdown')] || '') : '';
  const required = editorLang === 'bn';

  return (
    <div className="space-y-6" data-testid="admin-blog-tab">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] p-6 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#f0c95e]">
              <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
              {tr(
                'ব্লগ CMS ও অটোমেশন API',
                'Blog CMS & Automation API',
                'نظام المدونة وواجهة الأتمتة',
              )}
            </div>
            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              {tr(
                'ব্লগ ও আর্টিকেল ম্যানেজার',
                'Blog & Articles Manager',
                'إدارة المدونة والمقالات',
              )}
            </h2>
            <p className="mt-1 max-w-2xl text-xs text-slate-200 sm:text-sm">
              {tr(
                'তিন ভাষায় Markdown আর্টিকেল লিখুন, খসড়া/নির্ধারিত/প্রকাশিত অবস্থা নিয়ন্ত্রণ করুন এবং Bearer-কী সুরক্ষিত ওয়েবহুক দিয়ে স্বয়ংক্রিয়ভাবে পোস্ট প্রকাশ করুন।',
                'Write Markdown articles in three languages, control Draft / Scheduled / Published states, and publish automatically through the Bearer-key protected webhook.',
                'اكتب المقالات بصيغة Markdown بثلاث لغات، وتحكّم في حالات المسودة والمجدول والمنشور، وانشر تلقائياً عبر واجهة محمية بمفتاح Bearer.',
              )}
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {STATUSES.map((s) => (
              <div
                key={s}
                className="rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm"
              >
                <dt className="text-[10px] uppercase tracking-wider text-slate-300">
                  {statusLabel(s)}
                </dt>
                <dd
                  className="text-xl font-extrabold text-[#f0c95e]"
                  data-testid={`blog-count-${s.toLowerCase()}`}
                >
                  {counts[s]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {!canEdit && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-100"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {tr(
            'আপনার রোলে ব্লগ সম্পাদনার অনুমতি নেই; বিদ্যমান পোস্ট শুধু দেখা যাবে।',
            'Your role cannot edit blog content; existing posts are read-only.',
            'دورك لا يملك صلاحية تعديل المدونة؛ المقالات للعرض فقط.',
          )}
        </div>
      )}

      {/* Editor */}
      {draft && (
        <form
          ref={editorRef}
          onSubmit={handleSave}
          className={`${CARD} scroll-mt-24`}
          aria-labelledby="blog-editor-title"
          data-testid="blog-editor-form"
          noValidate
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3
              id="blog-editor-title"
              className="flex items-center gap-2 text-base font-bold text-[#192f64] dark:text-white"
            >
              <Pencil className="h-4 w-4 text-[#c4962c]" aria-hidden="true" />
              {draft.id
                ? tr('পোস্ট সম্পাদনা', 'Edit Post', 'تعديل المقال')
                : tr('নতুন পোস্ট', 'New Post', 'مقال جديد')}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label={tr('কনটেন্টের ভাষা', 'Content language', 'لغة المحتوى')}
                className="inline-flex rounded-xl border border-slate-200 p-0.5 dark:border-slate-700"
              >
                {(['bn', 'en', 'ar'] as EditorLang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={editorLang === l}
                    onClick={() => setEditorLang(l)}
                    className={`rounded-[10px] px-3 py-1.5 text-xs font-semibold transition ${editorLang === l ? 'bg-[#005a6e] text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                    data-testid={`blog-editor-lang-${l}`}
                  >
                    {l === 'bn' ? 'বাংলা' : l === 'en' ? 'English' : 'العربية'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={BTN_GHOST}
                aria-pressed={showPreview}
                onClick={() => setShowPreview((v) => !v)}
              >
                {showPreview ? (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {tr('লাইভ প্রিভিউ', 'Live preview', 'معاينة مباشرة')}
              </button>
            </div>
          </div>

          <fieldset disabled={editorLocked} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label htmlFor="blog-title" className={LABEL}>
                  {tr('শিরোনাম', 'Title', 'العنوان')} ({langName}){required && ' *'}
                </label>
                <input
                  id="blog-title"
                  dir={fieldDir}
                  required={required}
                  className={INPUT}
                  value={String(draft[langField('title')] || '')}
                  onChange={(e) => {
                    const patch: Partial<BlogDraft> = {
                      [langField('title')]: e.target.value,
                    };
                    if (editorLang === 'en' && !slugTouched) patch.slug = slugify(e.target.value);
                    patchDraft(patch);
                  }}
                  data-testid="blog-title-input"
                />
              </div>
              <div>
                <label htmlFor="blog-slug" className={LABEL}>
                  {tr('স্লাগ (URL)', 'Slug (URL)', 'المعرّف (الرابط)')}
                </label>
                <input
                  id="blog-slug"
                  dir="ltr"
                  className={`${INPUT} font-mono`}
                  placeholder={tr(
                    'ইংরেজি শিরোনাম থেকে স্বয়ংক্রিয়',
                    'Auto-generated from the English title',
                    'يُنشأ تلقائياً من العنوان الإنجليزي',
                  )}
                  value={draft.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    patchDraft({ slug: e.target.value });
                  }}
                  onBlur={() => patchDraft({ slug: slugify(draft.slug) })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="blog-excerpt" className={LABEL}>
                {tr('সারসংক্ষেপ', 'Excerpt', 'الملخّص')} ({langName})
              </label>
              <textarea
                id="blog-excerpt"
                dir={fieldDir}
                rows={2}
                className={INPUT}
                value={String(draft[langField('excerpt')] || '')}
                onChange={(e) => patchDraft({ [langField('excerpt')]: e.target.value })}
              />
            </div>

            <div className={`grid grid-cols-1 gap-4 ${showPreview ? 'xl:grid-cols-2' : ''}`}>
              <div>
                <label htmlFor="blog-body" className={LABEL}>
                  {tr('মূল লেখা (Markdown)', 'Body (Markdown)', 'المحتوى (Markdown)')} ({langName})
                  {required && ' *'}
                </label>
                <textarea
                  id="blog-body"
                  dir={fieldDir}
                  rows={14}
                  required={required}
                  className={`${INPUT} font-mono leading-relaxed`}
                  placeholder={'## …\n\n- **…**\n- [link](https://…)'}
                  value={previewBody}
                  onChange={(e) => patchDraft({ [langField('bodyMarkdown')]: e.target.value })}
                  data-testid="blog-body-input"
                />
              </div>
              {showPreview && (
                <div>
                  <div className={LABEL}>{tr('প্রিভিউ', 'Preview', 'المعاينة')}</div>
                  <div
                    dir={fieldDir}
                    className="h-[calc(100%-1.5rem)] max-h-[26rem] min-h-40 overflow-y-auto rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                    data-testid="blog-markdown-preview"
                  >
                    {previewBody.trim() ? (
                      <ReactMarkdown components={MARKDOWN_COMPONENTS}>{previewBody}</ReactMarkdown>
                    ) : (
                      <p className="text-xs text-slate-400">
                        {tr(
                          'লিখতে শুরু করলে এখানে প্রিভিউ দেখা যাবে।',
                          'Start typing to see the rendered preview here.',
                          'ابدأ الكتابة لتظهر المعاينة هنا.',
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label htmlFor="blog-category" className={LABEL}>
                  {tr('ক্যাটাগরি', 'Category', 'التصنيف')}
                </label>
                <input
                  id="blog-category"
                  className={INPUT}
                  value={draft.category}
                  onChange={(e) => patchDraft({ category: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="blog-tags" className={LABEL}>
                  {tr(
                    'ট্যাগ (কমা দিয়ে আলাদা)',
                    'Tags (comma separated)',
                    'الوسوم (مفصولة بفواصل)',
                  )}
                </label>
                <input
                  id="blog-tags"
                  className={INPUT}
                  value={draft.tagsText}
                  onChange={(e) => patchDraft({ tagsText: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="blog-author" className={LABEL}>
                  {tr('লেখক', 'Author', 'الكاتب')}
                </label>
                <input
                  id="blog-author"
                  className={INPUT}
                  value={draft.authorName}
                  onChange={(e) => patchDraft({ authorName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="blog-cover" className={LABEL}>
                  {tr('কভার ছবির URL', 'Cover image URL', 'رابط صورة الغلاف')}
                </label>
                <input
                  id="blog-cover"
                  dir="ltr"
                  inputMode="url"
                  className={INPUT}
                  placeholder="https://… | /assets/…"
                  value={draft.coverImageUrl}
                  onChange={(e) => patchDraft({ coverImageUrl: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="blog-date" className={LABEL}>
                  {tr('প্রকাশের তারিখ', 'Publish date', 'تاريخ النشر')}
                </label>
                <input
                  id="blog-date"
                  type="date"
                  className={INPUT}
                  value={draft.publishedAt}
                  onChange={(e) => patchDraft({ publishedAt: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="blog-status" className={LABEL}>
                  {tr('অবস্থা', 'Status', 'الحالة')}
                </label>
                <select
                  id="blog-status"
                  className={INPUT}
                  value={draft.status}
                  onChange={(e) => patchDraft({ status: e.target.value as BlogPostStatus })}
                  data-testid="blog-status-select"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {safeImageUrl(draft.coverImageUrl) && (
              <img
                src={safeImageUrl(draft.coverImageUrl)}
                alt={tr('কভার প্রিভিউ', 'Cover preview', 'معاينة الغلاف')}
                className="h-32 w-full max-w-xs rounded-xl border border-slate-200 object-cover dark:border-slate-700"
              />
            )}
          </fieldset>

          {formError && (
            <p role="alert" className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400">
              {formError}
            </p>
          )}

          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" className={BTN_GHOST} onClick={closeEditor}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {tr('বাতিল', 'Cancel', 'إلغاء')}
            </button>
            <button
              type="submit"
              className={BTN_PRIMARY}
              disabled={editorLocked}
              data-testid="blog-save-button"
            >
              <Save className="h-4 w-4 text-[#f0c95e]" aria-hidden="true" />
              {draft.id
                ? tr('পরিবর্তন সংরক্ষণ', 'Save changes', 'حفظ التغييرات')
                : tr('পোস্ট সংরক্ষণ', 'Save post', 'حفظ المقال')}
            </button>
          </div>
        </form>
      )}

      {/* Post list */}
      <section className={CARD} aria-labelledby="blog-list-title">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 id="blog-list-title" className="text-base font-bold text-[#192f64] dark:text-white">
            {tr('সকল পোস্ট', 'All Posts', 'جميع المقالات')}{' '}
            <span className="text-xs font-normal text-slate-500">
              ({filteredPosts.length}/{posts.length})
            </span>
          </h3>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            <div className="relative min-w-40 max-w-xs flex-1">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label={tr('পোস্ট খুঁজুন', 'Search posts', 'ابحث في المقالات')}
                placeholder={tr(
                  'শিরোনাম, ট্যাগ, লেখক...',
                  'Title, tag, author...',
                  'العنوان، الوسم، الكاتب...',
                )}
                className={`${INPUT} ps-9`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="blog-search-input"
              />
            </div>
            <select
              aria-label={tr('অবস্থা অনুযায়ী ফিল্টার', 'Filter by status', 'تصفية حسب الحالة')}
              className={`${INPUT} w-auto`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              data-testid="blog-status-filter"
            >
              <option value="all">{tr('সব অবস্থা', 'All statuses', 'كل الحالات')}</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={BTN_PRIMARY}
              onClick={openNew}
              disabled={!canCreate}
              data-testid="blog-new-button"
            >
              <FilePlus2 className="h-4 w-4 text-[#f0c95e]" aria-hidden="true" />
              {tr('নতুন পোস্ট', 'New Post', 'مقال جديد')}
            </button>
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {posts.length === 0
              ? tr(
                  'এখনো কোনো ব্লগ পোস্ট নেই। প্রথম পোস্টটি লিখুন।',
                  'No blog posts yet. Write the first one.',
                  'لا توجد مقالات بعد. اكتب أول مقال.',
                )
              : tr(
                  'এই ফিল্টারে কোনো পোস্ট পাওয়া যায়নি।',
                  'No posts match this filter.',
                  'لا توجد مقالات مطابقة.',
                )}
          </p>
        ) : (
          <ul
            className="divide-y divide-slate-100 dark:divide-slate-800"
            data-testid="blog-post-list"
          >
            {filteredPosts.map((post) => {
              const title =
                language === 'bn'
                  ? post.titleBn
                  : language === 'ar'
                    ? post.titleAr || post.titleEn
                    : post.titleEn;
              return (
                <li
                  key={post.id}
                  className="flex flex-wrap items-center gap-3 py-3"
                  data-testid={`blog-row-${post.id}`}
                >
                  {safeImageUrl(post.coverImageUrl) ? (
                    <img
                      src={safeImageUrl(post.coverImageUrl)}
                      alt=""
                      loading="lazy"
                      className="h-14 w-20 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                      <Newspaper className="h-5 w-5" aria-hidden="true" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 basis-56">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {title || post.titleBn}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_BADGE[post.status] || STATUS_BADGE.Draft}`}
                      >
                        {statusLabel(post.status)}
                      </span>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                        {sourceLabel(post.source)}
                      </span>
                      <span>{post.category}</span>
                      <span aria-hidden="true">•</span>
                      <span>{post.authorName}</span>
                      <span aria-hidden="true">•</span>
                      <time dateTime={post.publishedAt}>{post.publishedAt}</time>
                    </div>
                    <div
                      dir="ltr"
                      className="mt-0.5 truncate text-start font-mono text-[11px] text-slate-400"
                    >
                      /blog/{post.slug}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {confirmDeleteId === post.id ? (
                      <>
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          {tr('মুছে ফেলবেন?', 'Delete?', 'حذف؟')}
                        </span>
                        <button
                          type="button"
                          className={`${BTN_GHOST} border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-300`}
                          onClick={() => handleDelete(post.id)}
                          data-testid={`blog-confirm-delete-${post.id}`}
                        >
                          {tr('হ্যাঁ, মুছুন', 'Yes, delete', 'نعم، احذف')}
                        </button>
                        <button
                          type="button"
                          className={BTN_GHOST}
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          {tr('না', 'No', 'لا')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={BTN_GHOST}
                          disabled={!canEdit}
                          onClick={() => cycleStatus(post)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                          {post.status === 'Published'
                            ? tr('খসড়ায় নিন', 'Unpublish', 'إلغاء النشر')
                            : tr('প্রকাশ করুন', 'Publish', 'نشر')}
                        </button>
                        <button
                          type="button"
                          className={BTN_GHOST}
                          onClick={() => openEdit(post)}
                          aria-label={`${canEdit ? tr('সম্পাদনা', 'Edit', 'تعديل') : tr('দেখুন', 'View', 'عرض')}: ${title || post.titleBn || post.slug}`}
                          data-testid={`blog-edit-${post.id}`}
                        >
                          {canEdit ? (
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          {canEdit ? tr('সম্পাদনা', 'Edit', 'تعديل') : tr('দেখুন', 'View', 'عرض')}
                        </button>
                        <button
                          type="button"
                          className={`${BTN_GHOST} text-rose-600 dark:text-rose-400`}
                          disabled={!canDelete}
                          onClick={() => setConfirmDeleteId(post.id)}
                          aria-label={`${tr('মুছুন', 'Delete', 'حذف')}: ${title || post.titleBn || post.slug}`}
                          data-testid={`blog-delete-${post.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Blog Automation API */}
      <section
        className={CARD}
        aria-labelledby="blog-api-title"
        data-testid="blog-automation-panel"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3
              id="blog-api-title"
              className="flex items-center gap-2 text-base font-bold text-[#192f64] dark:text-white"
            >
              <Webhook className="h-4 w-4 text-[#c4962c]" aria-hidden="true" />
              {tr(
                'ব্লগ অটোমেশন API (ওয়েবহুক)',
                'Blog Automation API (Webhook)',
                'واجهة أتمتة المدونة (Webhook)',
              )}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {tr(
                'n8n, Zapier বা যেকোনো স্ক্রিপ্ট থেকে Bearer কী দিয়ে পোস্ট পাঠান। title ও content আবশ্যক; status না দিলে সরাসরি প্রকাশিত হয়।',
                'Send posts from n8n, Zapier or any script with the Bearer key. Title and content are required; without a status the post is published immediately.',
                'أرسل المقالات من n8n أو Zapier أو أي سكربت باستخدام مفتاح Bearer. العنوان والمحتوى مطلوبان؛ بدون حالة يُنشر المقال فوراً.',
              )}
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              role="switch"
              className="peer sr-only"
              checked={cfg.enabled}
              disabled={!canEdit}
              onChange={(e) => setCfg((c) => ({ ...c, enabled: e.target.checked }))}
              data-testid="blog-api-enabled-toggle"
            />
            <span className="relative h-6 w-11 rounded-full bg-slate-300 transition after:absolute after:start-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:bg-emerald-500 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#005a6e] peer-disabled:opacity-50 rtl:peer-checked:after:-translate-x-5 dark:bg-slate-600" />
            {cfg.enabled ? tr('সক্রিয়', 'Enabled', 'مفعّل') : tr('বন্ধ', 'Paused', 'متوقف')}
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="blog-api-key" className={LABEL}>
                <KeyRound className="me-1 inline h-3.5 w-3.5" aria-hidden="true" />
                {tr('API কী (Bearer)', 'API key (Bearer)', 'مفتاح API (Bearer)')}
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  id="blog-api-key"
                  dir="ltr"
                  type={showKey && canEdit ? 'text' : 'password'}
                  autoComplete="off"
                  spellCheck={false}
                  className={`${INPUT} min-w-40 flex-1 font-mono`}
                  value={canEdit ? cfg.apiKey : KEY_MASK}
                  disabled={!canEdit}
                  onChange={(e) => setCfg((c) => ({ ...c, apiKey: e.target.value }))}
                  data-testid="blog-api-key-input"
                />
                <button
                  type="button"
                  className={BTN_GHOST}
                  disabled={!canEdit}
                  onClick={() => setShowKey((v) => !v)}
                  aria-pressed={showKey}
                  aria-label={
                    showKey
                      ? tr('কী লুকান', 'Hide key', 'إخفاء المفتاح')
                      : tr('কী দেখান', 'Show key', 'إظهار المفتاح')
                  }
                >
                  {showKey ? (
                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  className={BTN_GHOST}
                  disabled={!canEdit}
                  onClick={() =>
                    copyText(
                      cfg.apiKey,
                      tr(
                        'API কী ক্লিপবোর্ডে কপি হয়েছে।',
                        'API key copied to the clipboard.',
                        'تم نسخ مفتاح API.',
                      ),
                    )
                  }
                  aria-label={tr('কী কপি করুন', 'Copy key', 'نسخ المفتاح')}
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className={BTN_GHOST}
                  disabled={!canEdit}
                  onClick={() => {
                    setCfg((c) => ({ ...c, apiKey: generateApiKey() }));
                    setShowKey(true);
                  }}
                  data-testid="blog-api-key-regenerate"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  {tr('নতুন কী', 'Regenerate', 'توليد جديد')}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="blog-api-author" className={LABEL}>
                  {tr('ডিফল্ট লেখক', 'Default author', 'الكاتب الافتراضي')}
                </label>
                <input
                  id="blog-api-author"
                  className={INPUT}
                  value={cfg.defaultAuthorName}
                  disabled={!canEdit}
                  onChange={(e) => setCfg((c) => ({ ...c, defaultAuthorName: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="blog-api-category" className={LABEL}>
                  {tr('ডিফল্ট ক্যাটাগরি', 'Default category', 'التصنيف الافتراضي')}
                </label>
                <input
                  id="blog-api-category"
                  className={INPUT}
                  value={cfg.defaultCategory}
                  disabled={!canEdit}
                  onChange={(e) => setCfg((c) => ({ ...c, defaultCategory: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={BTN_PRIMARY}
                disabled={!canEdit || !cfgDirty}
                onClick={saveConfig}
                data-testid="blog-api-save-button"
              >
                <Save className="h-4 w-4 text-[#f0c95e]" aria-hidden="true" />
                {tr('API সেটিংস সংরক্ষণ', 'Save API settings', 'حفظ إعدادات API')}
              </button>
              {cfgDirty && (
                <span
                  role="status"
                  className="text-xs font-semibold text-amber-700 dark:text-amber-300"
                >
                  {tr(
                    'অসংরক্ষিত পরিবর্তন — সংরক্ষণের পর পুরনো কী আর কাজ করবে না।',
                    'Unsaved changes — after saving, the old key stops working.',
                    'تغييرات غير محفوظة — بعد الحفظ يتوقف المفتاح القديم عن العمل.',
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className={`${LABEL} mb-0`}>
                {tr(
                  'এন্ডপয়েন্ট ও cURL উদাহরণ',
                  'Endpoint & cURL example',
                  'نقطة النهاية ومثال cURL',
                )}
              </span>
              <button
                type="button"
                className={BTN_GHOST}
                onClick={() =>
                  copyText(
                    curlFor(canEdit ? cfg.apiKey : 'YOUR_API_KEY'),
                    tr('cURL কমান্ড কপি হয়েছে।', 'cURL command copied.', 'تم نسخ أمر cURL.'),
                  )
                }
                data-testid="blog-api-copy-curl"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                {tr('cURL কপি', 'Copy cURL', 'نسخ cURL')}
              </button>
            </div>
            <div
              dir="ltr"
              className="mb-2 flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-100"
            >
              <span className="rounded bg-[#005a6e] px-1.5 py-0.5 text-[10px] font-bold text-white">
                POST
              </span>
              <span className="truncate">/api/blog/action-publish</span>
            </div>
            <pre
              dir="ltr"
              tabIndex={0}
              role="region"
              aria-label={tr('cURL উদাহরণ', 'cURL example', 'مثال cURL')}
              className="max-h-72 overflow-auto rounded-xl bg-[#0a1738] p-3 text-start text-[11px] leading-relaxed text-slate-100"
              data-testid="blog-api-curl"
            >
              {curlFor(showKey && canEdit ? cfg.apiKey : KEY_MASK)}
            </pre>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {tr(
                'উত্তর: 201 সফল · 400 শিরোনাম/লেখা নেই · 401 ভুল কী · 403 API বন্ধ। ঐচ্ছিক ফিল্ড: titleAr, excerptBn, excerptEn, coverImageUrl।',
                'Responses: 201 created · 400 missing title/content · 401 wrong key · 403 API paused. Optional fields: titleAr, excerptBn, excerptEn, coverImageUrl.',
                'الردود: 201 تم الإنشاء · 400 عنوان/محتوى مفقود · 401 مفتاح خاطئ · 403 الواجهة متوقفة. حقول اختيارية: titleAr, excerptBn, excerptEn, coverImageUrl.',
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
