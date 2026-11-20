import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  EyeOff,
  GitBranch,
  History,
  Plus,
  RotateCcw,
  ShieldCheck,
  Tag,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import {
  SemverBumpType,
  bumpSemver,
  resolveVersionManagerConfig,
  shouldShowAdminVersion,
  shouldShowPublicVersion,
} from '../utils/versionLogic';
import type { AppReleaseEntry } from '../types/cms';

interface AdminVersionManagerTabProps {
  canEdit: boolean;
  canDelete: boolean;
}

export const AdminVersionManagerTab: React.FC<AdminVersionManagerTabProps> = ({
  canEdit,
  canDelete,
}) => {
  const {
    state,
    language,
    updateVersionVisibility,
    createVersionRelease,
    rollbackToVersion,
    deleteVersionRelease,
    importVersionReleaseJson,
  } = useCMS();

  const tr = (bn: string, en: string, ar: string) =>
    language === 'en' ? en : language === 'ar' ? ar : bn;

  const versionConfig = resolveVersionManagerConfig(state.versionManager);
  const publicVisible = shouldShowPublicVersion(versionConfig);
  const adminVisible = shouldShowAdminVersion(versionConfig);

  const [bumpType, setBumpType] = useState<SemverBumpType>('minor');
  const [customVersion, setCustomVersion] = useState('');
  const [releaseTitle, setReleaseTitle] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [addedText, setAddedText] = useState('');
  const [improvedText, setImprovedText] = useState('');
  const [removedText, setRemovedText] = useState('');
  const [confirmRollbackId, setConfirmRollbackId] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const suggestedNextVersion = bumpSemver(versionConfig.activeVersion, bumpType);

  const parseLines = (text: string) =>
    text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSaveRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    const added = parseLines(addedText);
    const improved = parseLines(improvedText);
    const removed = parseLines(removedText);
    createVersionRelease({
      bumpType,
      customVersion: customVersion.trim() || undefined,
      title: releaseTitle.trim() || `Client Update v${customVersion.trim() || suggestedNextVersion}`,
      notes: releaseNotes.trim() || 'Saved configuration and content snapshot for release archive.',
      added: added.length ? added : undefined,
      improved: improved.length ? improved : undefined,
      removed: removed.length ? removed : undefined,
    });
    setCustomVersion('');
    setReleaseTitle('');
    setReleaseNotes('');
    setAddedText('');
    setImprovedText('');
    setRemovedText('');
  };

  const handleExportRelease = (release: AppReleaseEntry) => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        app: 'Maharat Model Madrasah CMS',
        release,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maharat-release-${release.tag}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const res = importVersionReleaseJson(content);
      if (res.success && res.entry) {
        setImportFeedback({
          type: 'ok',
          msg: tr(
            `${res.entry.tag} স্ন্যাপশট সফলভাবে ইম্পোর্ট হয়েছে।`,
            `Imported release snapshot ${res.entry.tag}.`,
            `تم استيراد لقطة الإصدار ${res.entry.tag}.`
          ),
        });
      } else {
        setImportFeedback({
          type: 'err',
          msg: res.error || tr('স্ন্যাপশট ইম্পোর্ট ব্যর্থ হয়েছে।', 'Import failed.', 'فشل الاستيراد.'),
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return Number.isNaN(d.getTime())
        ? iso
        : d.toLocaleString(language === 'en' ? 'en-US' : 'bn-BD', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
            <GitBranch className="w-4 h-4" />
            <span>
              {tr(
                'অ্যাপ ভার্সন কন্ট্রোল, রিলিজ হিস্ট্রি ও রোলব্যাক',
                'App Versioning, Release History & Rollback',
                'التحكم في الإصدار وسجل التحديثات والاسترجاع'
              )}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            {tr(
              'ভার্সন ও রিলিজ ম্যানেজার',
              'Version & Release Manager',
              'مدير الإصدارات واللقطات'
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {tr(
              'ওয়েবসাইটের ফুটার ও অ্যাডমিন ড্যাশবোর্ডে ভার্সন নম্বর দেখানো নিয়ন্ত্রণ করুন এবং যেকোনো আপডেটের স্ন্যাপশট সেভ ও ১ ক্লিকে রোলব্যাক করুন।',
              'Control where the app version badge appears, save versioned configuration snapshots, and roll back cleanly to any previous client-approved version.',
              'تحكم في إظهار رقم الإصدار في الموقع ولوحة التحكم، واحفظ لقطات الإصدارات مع إمكانية الاسترجاع بنقرة واحدة.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              {tr('সক্রিয় ভার্সন', 'Active Version', 'الإصدار النشط')}
            </div>
            <div
              data-testid="active-version-display"
              className="text-lg font-extrabold font-mono text-purple-900 dark:text-white"
            >
              v{versionConfig.activeVersion}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Visibility Toggles (Master + Granular Placement) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              {versionConfig.enabled ? (
                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {tr(
                  'ভার্সন নম্বর প্রদর্শন নিয়ন্ত্রণ (Visibility Controls)',
                  'Version Badge Visibility Controls',
                  'التحكم في إظهار رقم الإصدار'
                )}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {tr(
                'ওয়েবসাইট লাইভ হয়ে গেলে মাস্টার সুইচ বন্ধ করে রাখলে ফ্রন্টএন্ড বা ড্যাশবোর্ড কোথাও ভার্সন দেখা যাবে না।',
                'Turn off the master switch once the site is live to hide the version label everywhere, or toggle each location independently.',
                'أوقف المفتاح الرئيسي لإخفاء رقم الإصدار في كل مكان عند التشغيل الكامل.'
              )}
            </p>
          </div>
          <span
            className={`text-[11px] font-bold px-3 py-1 rounded-full self-start sm:self-center ${
              versionConfig.enabled
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
            }`}
          >
            {versionConfig.enabled
              ? tr('প্রদর্শন সক্রিয়', 'Display Enabled', 'العرض مفعل')
              : tr('সব জায়গায় লুকানো', 'Hidden Everywhere', 'مخفي في كل مكان')}
          </span>
        </div>

        {/* Master Toggle Row */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {tr(
                'মাস্টার সুইচ — ভার্সন প্রদর্শন চালু/বন্ধ করুন',
                'Master Switch — Enable Version Display',
                'المفتاح الرئيسي — تفعيل عرض الإصدار'
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {tr(
                'বন্ধ করলে ওয়েবসাইটের ফুটার এবং অ্যাডমিন ড্যাশবোর্ড—উভয় জায়গা থেকেই ভার্সন সম্পূর্ণ লুকিয়ে যাবে।',
                'When turned OFF, the version number is completely hidden across both the public website and the admin dashboard.',
                'عند الإيقاف، يختفي رقم الإصدار تماماً من الموقع ولوحة التحكم.'
              )}
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={versionConfig.enabled}
            aria-label="Master switch for version display"
            data-testid="toggle-version-master"
            disabled={!canEdit}
            onClick={() => updateVersionVisibility({ enabled: !versionConfig.enabled })}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer disabled:opacity-50 ${
              versionConfig.enabled ? 'bg-purple-700' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-1 ${
                versionConfig.enabled
                  ? 'right-1 rtl:right-auto rtl:left-1'
                  : 'left-1 rtl:left-auto rtl:right-1'
              }`}
            />
          </button>
        </div>

        {/* Independent Placement Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Toggle 1: Public Website Footer */}
          <div
            className={`p-4 rounded-xl border transition-opacity flex items-center justify-between gap-4 ${
              versionConfig.enabled
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="space-y-0.5">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>
                  {tr(
                    'পাবলিক ওয়েবসাইট ফুটার',
                    'Public Website Footer',
                    'تذييل الموقع العام'
                  )}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {publicVisible ? `v${versionConfig.activeVersion}` : tr('বন্ধ', 'Hidden', 'مخفي')}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {tr(
                  'ওয়েবসাইটের নিচে কপিরাইট লেখার পাশে সূক্ষ্মভাবে ভার্সন দেখায়।',
                  'Shows a subtle version label beside the footer copyright notice.',
                  'يعرض رقم الإصدار بشكل أنيق بجانب حقوق النشر في التذييل.'
                )}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={versionConfig.showInPublicFooter}
              aria-label="Show version in public website footer"
              data-testid="toggle-version-public-footer"
              disabled={!canEdit || !versionConfig.enabled}
              onClick={() =>
                updateVersionVisibility({ showInPublicFooter: !versionConfig.showInPublicFooter })
              }
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer disabled:opacity-50 ${
                publicVisible ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-1 ${
                  versionConfig.showInPublicFooter
                    ? 'right-1 rtl:right-auto rtl:left-1'
                    : 'left-1 rtl:left-auto rtl:right-1'
                }`}
              />
            </button>
          </div>

          {/* Toggle 2: Admin Dashboard */}
          <div
            className={`p-4 rounded-xl border transition-opacity flex items-center justify-between gap-4 ${
              versionConfig.enabled
                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800 opacity-60'
            }`}
          >
            <div className="space-y-0.5">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>
                  {tr(
                    'অ্যাডমিন ড্যাশবোর্ড সাইডবার',
                    'Admin Dashboard Sidebar',
                    'الشريط الجانبي للوحة التحكم'
                  )}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {adminVisible ? `v${versionConfig.activeVersion}` : tr('বন্ধ', 'Hidden', 'مخفي')}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {tr(
                  'ড্যাশবোর্ডের নিচে ভার্সন লেবেল ও রিলিজ নোট পপওভার দেখায়।',
                  'Shows the version label with a clickable release notes popover in the dashboard.',
                  'يعرض رقم الإصدار مع نافذة ملاحظات التحديث في لوحة التحكم.'
                )}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={versionConfig.showInAdminDashboard}
              aria-label="Show version in admin dashboard"
              data-testid="toggle-version-admin-dashboard"
              disabled={!canEdit || !versionConfig.enabled}
              onClick={() =>
                updateVersionVisibility({
                  showInAdminDashboard: !versionConfig.showInAdminDashboard,
                })
              }
              className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer disabled:opacity-50 ${
                adminVisible ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform absolute top-1 ${
                  versionConfig.showInAdminDashboard
                    ? 'right-1 rtl:right-auto rtl:left-1'
                    : 'left-1 rtl:left-auto rtl:right-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Save New Release Snapshot + Section 3: Release History & Rollback */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Create New Release Snapshot */}
        <form
          onSubmit={handleSaveRelease}
          className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 self-start"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Tag className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
              {tr(
                'নতুন ভার্সন স্ন্যাপশট সংরক্ষণ করুন',
                'Save New Release Snapshot',
                'حفظ لقطة إصدار جديدة'
              )}
            </h3>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {tr('ভার্সন ইনক্রিমেন্ট নির্বাচন করুন', 'Semantic Version Increment', 'زيادة الإصدار')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['patch', 'minor', 'major'] as SemverBumpType[]).map((type) => {
                const preview = bumpSemver(versionConfig.activeVersion, type);
                const selected = bumpType === type && !customVersion.trim();
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      setBumpType(type);
                      setCustomVersion('');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer ${
                      selected
                        ? 'bg-purple-700 border-purple-700 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-400'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {type}
                    </div>
                    <div className="text-xs font-mono font-extrabold mt-0.5">v{preview}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {tr(
                'কাস্টম ভার্সন নম্বর (ঐচ্ছিক)',
                'Custom Version Override (Optional)',
                'رقم إصدار مخصص (اختياري)'
              )}
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={customVersion}
              onChange={(e) => setCustomVersion(e.target.value)}
              placeholder={`e.g. ${suggestedNextVersion}`}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {tr('রিলিজের শিরোনাম', 'Release Title', 'عنوان الإصدار')}
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={releaseTitle}
              onChange={(e) => setReleaseTitle(e.target.value)}
              data-testid="release-title-input"
              placeholder={tr(
                'যেমন: ভর্তি ব্যানার ও ফি কাঠামো আপডেট',
                'e.g. Updated Admission Banner & Fee Schedule',
                'مثال: تحديث بانر القبول وجدول الرسوم'
              )}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {tr('পরিবর্তনের বিবরণ / ক্লায়েন্ট নোট', 'Client Change Notes', 'ملاحظات التحديث')}
            </label>
            <textarea
              rows={2}
              disabled={!canEdit}
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              data-testid="release-notes-input"
              placeholder={tr(
                'এই ভার্সনে কী কী পরিবর্তন করা হয়েছে তা সংক্ষেপে লিখুন...',
                'Summarize what changed in this release for easy reference...',
                'لخّص التغييرات التي تمت في هذا الإصدار...'
              )}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                {tr('নতুন ফিচার (Added — প্রতি লাইনে একটি)', 'Added Features (1 per line)', 'الميزات المضافة')}
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={addedText}
                onChange={(e) => setAddedText(e.target.value)}
                placeholder={tr('যেমন: ভার্চুয়াল অফিস লাইভ ডেস্ক যুক্ত করা হয়েছে', 'e.g. Added Virtual Office Live Desk', 'مثال: إضافة المكتب الافتراضي')}
                className="w-full rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-sky-700 dark:text-sky-400">
                {tr('উন্নয়ন (Improved — প্রতি লাইনে একটি)', 'Improved (1 per line)', 'التحسينات')}
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={improvedText}
                onChange={(e) => setImprovedText(e.target.value)}
                placeholder={tr('যেমন: মোবাইল ও ডেস্কটপ ফন্ট সাইজ অপ্টিমাইজেশন', 'e.g. Optimized mobile & desktop typography', 'مثال: تحسين الخطوط')}
                className="w-full rounded-xl border border-sky-200 dark:border-sky-900/60 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-rose-700 dark:text-rose-400">
                {tr('বাদ দেওয়া হয়েছে (Removed — প্রতি লাইনে একটি)', 'Removed (1 per line)', 'المحذوفات')}
              </label>
              <textarea
                rows={2}
                disabled={!canEdit}
                value={removedText}
                onChange={(e) => setRemovedText(e.target.value)}
                placeholder={tr('যেমন: ফুটার থেকে পুরনো অ্যাডমিন লগইন বাটন সরানো হয়েছে', 'e.g. Removed legacy footer Admin button', 'مثال: إزالة الزر القديم')}
                className="w-full rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!canEdit}
            data-testid="save-release-snapshot-btn"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-700 hover:from-purple-800 hover:to-fuchsia-800 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>
              {tr(
                `v${customVersion.trim() || suggestedNextVersion} স্ন্যাপশট সেভ করুন`,
                `Save Snapshot as v${customVersion.trim() || suggestedNextVersion}`,
                `حفظ اللقطة كـ v${customVersion.trim() || suggestedNextVersion}`
              )}
            </span>
          </button>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              {tr(
                'স্ন্যাপশটে সাইট সেটিংস, ব্র্যান্ডিং, কনটেন্ট, কোর্স, নোটিশ ও মিডিয়া সংরক্ষিত হয়। রোলব্যাক করলে ভর্তি লিডস ও অ্যাডমিন অ্যাকাউন্ট নিরাপদ থাকে।',
                'Snapshots store site settings, branding, content, courses, notices, and media. Student leads and admin accounts are safely preserved during rollbacks.',
                'تحفظ اللقطات إعدادات الموقع والمحتوى، بينما تبقى طلبات الطلاب وحسابات المشرفين آمنة عند الاسترجاع.'
              )}
            </span>
          </p>
        </form>

        {/* Right: Release History, JSON Import/Export & One-Click Rollback */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {tr(
                  `রিলিজ হিস্ট্রি ও রোলব্যাক (${versionConfig.releases.length})`,
                  `Release History & Rollback (${versionConfig.releases.length})`,
                  `سجل الإصدارات والاسترجاع (${versionConfig.releases.length})`
                )}
              </h3>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>
                  {tr('স্ন্যাপশট JSON ইম্পোর্ট', 'Import Snapshot JSON', 'استيراد JSON')}
                </span>
              </button>
            </div>
          </div>

          {importFeedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold border ${
                importFeedback.type === 'ok'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'
              }`}
            >
              {importFeedback.msg}
            </div>
          )}

          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {versionConfig.releases.map((rel) => {
              const isActive =
                rel.version === versionConfig.activeVersion && !rel.isAutoBackup;
              const isConfirming = confirmRollbackId === rel.id;
              const hasSnapshot = Boolean(rel.snapshot);

              return (
                <div
                  key={rel.id}
                  data-testid={`release-item-${rel.tag}`}
                  className={`p-4 rounded-xl border transition-colors space-y-2.5 ${
                    isActive
                      ? 'bg-purple-50/60 dark:bg-purple-950/30 border-purple-300 dark:border-purple-700'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-lg bg-slate-900 dark:bg-slate-700 text-white">
                          {rel.tag}
                        </span>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{tr('সক্রিয়', 'Active', 'نشط')}</span>
                          </span>
                        )}
                        {rel.isAutoBackup && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                            {tr('অটো ব্যাকআপ', 'Safety Backup', 'نسخة أمان')}
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {rel.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rel.notes}
                      </p>
                      {(rel.added?.length || rel.improved?.length || rel.removed?.length) ? (
                        <div className="pt-1.5 space-y-1.5 text-[11px]">
                          {rel.added && rel.added.length > 0 && (
                            <div className="rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60 px-2.5 py-1.5">
                              <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                                + {tr('নতুন যুক্ত হয়েছে (Added)', 'Added', 'مضاف')}
                              </span>
                              <ul className="list-disc pl-4 space-y-0.5 text-slate-700 dark:text-slate-300">
                                {rel.added.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {rel.improved && rel.improved.length > 0 && (
                            <div className="rounded-lg bg-sky-50/80 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/60 px-2.5 py-1.5">
                              <span className="font-extrabold text-sky-800 dark:text-sky-300 block mb-0.5">
                                ↑ {tr('উন্নয়ন করা হয়েছে (Improved)', 'Improved', 'محسّن')}
                              </span>
                              <ul className="list-disc pl-4 space-y-0.5 text-slate-700 dark:text-slate-300">
                                {rel.improved.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {rel.removed && rel.removed.length > 0 && (
                            <div className="rounded-lg bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/60 px-2.5 py-1.5">
                              <span className="font-extrabold text-rose-800 dark:text-rose-300 block mb-0.5">
                                − {tr('বাদ দেওয়া হয়েছে (Removed)', 'Removed', 'محذوف')}
                              </span>
                              <ul className="list-disc pl-4 space-y-0.5 text-slate-700 dark:text-slate-300">
                                {rel.removed.map((item, idx) => (
                                  <li key={idx}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(rel.createdAt)}
                        </span>
                        <span>· {rel.createdBy}</span>
                        <span>
                          ·{' '}
                          {hasSnapshot
                            ? tr('স্ন্যাপশট সংরক্ষিত', 'Snapshot Ready', 'اللقطة جاهزة')
                            : tr('বেসলাইন লগ', 'Baseline Log', 'سجل أساسي')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasSnapshot && (
                        <button
                          type="button"
                          disabled={!canEdit}
                          data-testid={`rollback-trigger-${rel.tag}`}
                          onClick={() =>
                            setConfirmRollbackId(isConfirming ? null : rel.id)
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{tr('রোলব্যাক', 'Rollback', 'استرجاع')}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleExportRelease(rel)}
                        title={tr('JSON এক্সপোর্ট করুন', 'Export Snapshot JSON', 'تصدير JSON')}
                        className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-700 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {canDelete && !isActive && versionConfig.releases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteVersionRelease(rel.id)}
                          title={tr('মুছে ফেলুন', 'Delete Entry', 'حذف')}
                          className="p-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 hover:bg-red-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Rollback Confirmation */}
                  {isConfirming && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <p className="text-xs text-amber-900 dark:text-amber-200 font-semibold">
                        {tr(
                          `আপনি কি নিশ্চিতভাবে ${rel.tag} ভার্সনে ফিরে যেতে চান? বর্তমান অবস্থার একটি অটো-সেফটি ব্যাকআপ স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।`,
                          `Restore configuration & content to ${rel.tag}? An automatic safety backup of the current state will be saved first.`,
                          `هل تريد استعادة الإعدادات إلى ${rel.tag}؟ سيتم حفظ نسخة أمان تلقائياً أولاً.`
                        )}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          data-testid={`confirm-rollback-${rel.tag}`}
                          onClick={() => {
                            rollbackToVersion(rel.id);
                            setConfirmRollbackId(null);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                        >
                          {tr('হ্যাঁ, রোলব্যাক করুন', 'Confirm Rollback', 'تأكيد الاسترجاع')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRollbackId(null)}
                          className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                        >
                          {tr('বাতিল', 'Cancel', 'إلغاء')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
