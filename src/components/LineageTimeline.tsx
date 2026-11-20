import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  Copy,
  Download,
  FileBadge2,
  GraduationCap,
  Info,
  MapPin,
  Maximize2,
  Share2,
  X,
} from 'lucide-react';
import { HafizGraduateItem } from '../types/cms';
import { buildHafizSocialShareLinks, toBengaliDigits } from '../utils/cmsLogic';
import { localizeDigits, localizeDynamicText } from '../utils/i18nContent';
import { buildHafizBiography, buildHafizCertificateCode } from '../utils/portalAndHifzLogic';

type SupportedLanguage = 'bn' | 'en' | 'ar';

export interface LineageTimelineProps {
  graduates: HafizGraduateItem[];
  language: SupportedLanguage;
  selectedHafez: HafizGraduateItem | null;
  copiedId: string | null;
  onSelectHafez: (grad: HafizGraduateItem | null) => void;
  onDownloadCertificate: (grad: HafizGraduateItem) => void;
  onCopyShareLink: (grad: HafizGraduateItem) => void;
  onOpenZoomPhoto?: (grad: HafizGraduateItem) => void;
  onOpenAdmission?: () => void;
  /** When true (default), renders the slide-over Info drawer internally. */
  showDrawer?: boolean;
}

export interface HafezInfoDrawerProps {
  selectedHafez: HafizGraduateItem | null;
  language: SupportedLanguage;
  copiedId: string | null;
  onClose: () => void;
  onDownloadCertificate: (grad: HafizGraduateItem) => void;
  onCopyShareLink: (grad: HafizGraduateItem) => void;
  onOpenAdmission?: () => void;
}

/**
 * Modern Vertical Alternating CSS Grid Timeline (1st to 30th Hafez)
 * with an interactive slide-over 'Info' drawer showing full biography & certificate download.
 */
export const LineageTimeline: React.FC<LineageTimelineProps> = ({
  graduates,
  language,
  selectedHafez,
  copiedId,
  onSelectHafez,
  onDownloadCertificate,
  onCopyShareLink,
  onOpenZoomPhoto,
  onOpenAdmission,
  showDrawer = true,
}) => {
  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  // Close drawer with Escape key and lock background scroll while open
  useEffect(() => {
    if (!selectedHafez) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onSelectHafez(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedHafez, onSelectHafez]);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://maharatmadrasah.edu.bd';

  if (graduates.length === 0) {
    return (
      <div
        data-testid="lineage-timeline-empty"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f2047] p-10 text-center space-y-2"
      >
        <p className="text-base font-bold text-[#0a1738] dark:text-white">
          {tr(
            'এই ফিল্টারে কোনো হাফেজ পাওয়া যায়নি',
            'No Hafez matched your current filter',
            'لم يتم العثور على حفاظ لهذا البحث'
          )}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {tr(
            'অনুগ্রহ করে সকল হাফেজ ট্যাব বা অন্য সেশন নির্বাচন করুন।',
            'Try selecting All Huffaz or clearing the search input.',
            'يرجى اختيار جميع الحفاظ أو مسح البحث.'
          )}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Vertical Modern CSS Grid Timeline (1st -> 30th Alternating Layout) */}
      <div
        data-testid="lineage-timeline"
        className="relative"
        aria-label={tr(
          '১ম থেকে ৩০তম হাফেজ ধারাবাহিক টাইমলাইন',
          '1st to 30th Hafez Lineage Timeline',
          'الجدول الزمني لحفاظ القرآن من الأول إلى الثلاثين'
        )}
      >
        {/* Continuous Vertical Spine anchored to the CSS Grid center rail on lg+ and left rail on mobile */}
        <div
          aria-hidden="true"
          className="absolute top-6 bottom-6 left-[1.125rem] lg:left-1/2 lg:-translate-x-1/2 w-[3px] rounded-full bg-gradient-to-b from-[#d4a843] via-[#007c91] to-[#192f64] opacity-80 pointer-events-none"
        />

        <ol className="space-y-6 lg:space-y-9 relative z-10">
          {graduates.map((grad, idx) => {
            const isLeftColumn = idx % 2 === 0;
            const certCode = buildHafizCertificateCode(grad);
            const biography = buildHafizBiography(grad);
            const shareLinks = buildHafizSocialShareLinks(grad, origin);
            const serialShort =
              language === 'en'
                ? `#${grad.serialNumber}`
                : `${toBengaliDigits(grad.serialNumber)}তম`;
            const isSelected = selectedHafez?.id === grad.id;

            return (
              <li
                key={grad.id}
                className="grid grid-cols-[2.25rem_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_4.5rem_minmax(0,1fr)] items-center gap-x-3 lg:gap-x-0"
              >
                {/* Central Spine Rail Node (Col 1 on Mobile, Col 2 on Desktop) */}
                <div className="col-start-1 row-start-1 lg:col-start-2 relative flex items-center justify-center self-stretch">
                  {/* Horizontal Connector Arm on Desktop */}
                  <span
                    aria-hidden="true"
                    className={`hidden lg:block absolute top-1/2 -translate-y-1/2 h-[2px] w-7 bg-gradient-to-r from-[#d4a843]/80 to-[#007c91]/70 ${
                      isLeftColumn ? 'left-0' : 'right-0'
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() => onSelectHafez(grad)}
                    aria-label={`${tr('জীবনী খুলুন:', 'Inspect Hafez', 'عرض ملف')} ${grad.serialLabelBn} ${grad.nameBn}`}
                    title={`${grad.serialLabelBn} — ${grad.nameBn}`}
                    className={`relative z-10 w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-full border-[3px] border-white dark:border-[#071129] flex items-center justify-center font-black text-[10px] sm:text-xs tabular-nums cursor-pointer transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005a6e] ${
                      isSelected
                        ? 'bg-gradient-to-br from-[#192f64] to-[#005a6e] text-[#f0c95e] shadow-lg scale-110'
                        : 'bg-gradient-to-br from-[#f0c95e] via-[#d4a843] to-[#9c7a32] text-[#071129] shadow-md'
                    }`}
                  >
                    {serialShort}
                  </button>
                </div>

                {/* Single Hafez Card positioned via CSS Grid (Col 2 on Mobile; Alternating Col 1 / Col 3 on Desktop) */}
                <div
                  className={`min-w-0 col-start-2 row-start-1 ${
                    isLeftColumn
                      ? 'lg:col-start-1 lg:pr-5'
                      : 'lg:col-start-3 lg:pl-5'
                  }`}
                >
                  <article
                    data-testid={`lineage-card-${grad.serialNumber}`}
                    data-side={isLeftColumn ? 'left' : 'right'}
                    className={`group rounded-2xl bg-white dark:bg-[#0f2047] border transition-all duration-200 overflow-hidden ${
                      isSelected
                        ? 'border-[#c4962c] ring-2 ring-[#f0c95e]/45 shadow-lg'
                        : grad.featured
                          ? 'border-[#d4a843]/75 dark:border-[#d4a843]/55 shadow-md hover:shadow-xl'
                          : 'border-slate-200 dark:border-[#005a6e]/50 shadow-sm hover:border-[#007c91] hover:shadow-lg'
                    }`}
                  >
                    {/* Card Body: Portrait + Clean Typographic Identity */}
                    <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenZoomPhoto ? onOpenZoomPhoto(grad) : onSelectHafez(grad)
                        }
                        aria-label={`${tr('ছবি বড় করে দেখুন:', 'Inspect portrait of', 'تكبير صورة')} ${grad.nameBn}`}
                        className="relative w-full sm:w-28 h-44 sm:h-32 rounded-xl overflow-hidden border border-[#d4a843]/50 bg-slate-900 shrink-0 cursor-pointer group/img focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4962c]"
                      >
                        <img
                          src={grad.photoUrl}
                          alt={grad.nameBn}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/maharat/fb/fb-media-21.jpg';
                          }}
                          className="w-full h-full object-cover object-top group-hover/img:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-950/80 text-[10px] font-bold text-[#f0c95e] inline-flex items-center gap-1">
                          <Maximize2 className="w-2.5 h-2.5" />
                          <span>{tr('জুম', 'Zoom', 'تكبير')}</span>
                        </span>
                      </button>

                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Clean Unboxed Metadata Line with typographic separators */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold text-[#005a6e] dark:text-[#5eead4]">
                          <span className="text-[#9c7a32] dark:text-[#f0c95e] font-extrabold tabular-nums">
                            {language === 'en'
                              ? `Hafez #${grad.serialNumber}`
                              : localizeDynamicText(grad.serialLabelBn, language)}
                          </span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                            ·
                          </span>
                          <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                            {localizeDigits(grad.completionYear, language)}
                          </span>
                          {grad.certificateUrl && (
                            <>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                                ·
                              </span>
                              <span className="text-emerald-700 dark:text-emerald-300">
                                {tr('সার্টিফিকেট সংযুক্ত', 'Certificate Verified', 'شهادة موثقة')}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base sm:text-xl font-extrabold text-[#0a1738] dark:text-white leading-snug break-words">
                          <button
                            type="button"
                            onClick={() => onSelectHafez(grad)}
                            className="text-left rtl:text-right hover:text-[#005a6e] dark:hover:text-[#f0c95e] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                          >
                            {language === 'en'
                              ? grad.nameEn
                              : localizeDynamicText(grad.nameBn, language)}
                          </button>
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-slate-600 dark:text-slate-300">
                          <span>{localizeDynamicText(grad.classNameBn, language)}</span>
                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
                            ·
                          </span>
                          <span>{localizeDynamicText(grad.completionDate, language)}</span>
                        </div>

                        <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                          {localizeDynamicText(biography, language)}
                        </p>
                      </div>
                    </div>

                    {/* Card Action Bar: Info Drawer Trigger + Download Certificate + Quiet Share */}
                    <div className="px-4 sm:px-5 py-3.5 bg-slate-50/90 dark:bg-[#091533]/85 border-t border-slate-200/80 dark:border-white/10 space-y-2.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          data-testid={`button-info-drawer-${grad.serialNumber}`}
                          onClick={() => onSelectHafez(grad)}
                          aria-label={`${tr('জীবনী ও তথ্য দেখুন:', 'Open Info drawer for', 'عرض السيرة لـ')} ${grad.nameBn}`}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#192f64] to-[#005a6e] hover:from-[#12244f] hover:to-[#004554] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c4962c]"
                        >
                          <Info className="w-3.5 h-3.5 text-[#f0c95e] shrink-0" />
                          <span>{tr('তথ্য ও জীবনী', 'Info & Bio', 'السيرة والمعلومات')}</span>
                        </button>

                        <button
                          type="button"
                          data-testid={`button-download-cert-${grad.serialNumber}`}
                          onClick={() => onDownloadCertificate(grad)}
                          aria-label={`${tr('সার্টিফিকেট ডাউনলোড:', 'Download Certificate for', 'تحميل شهادة')} ${grad.nameBn}`}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#d4a843] to-[#f0c95e] hover:from-[#c4962c] hover:to-[#e5b94c] text-[#071129] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#192f64]"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {tr('সার্টিফিকেট ডাউনলোড', 'Download Certificate', 'تحميل الشهادة')}
                          </span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px]">
                        <span className="font-mono font-bold text-slate-500 dark:text-slate-400 tabular-nums truncate">
                          {certCode}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={shareLinks.facebookShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-md bg-[#1877F2]/12 hover:bg-[#1877F2] text-[#1877F2] hover:text-white font-bold transition-colors whitespace-nowrap"
                          >
                            FB
                          </a>
                          <a
                            href={shareLinks.whatsappShareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded-md bg-[#25D366]/15 hover:bg-[#25D366] text-emerald-700 dark:text-emerald-300 hover:text-slate-950 font-bold transition-colors whitespace-nowrap"
                          >
                            WhatsApp
                          </a>
                          <button
                            type="button"
                            onClick={() => onCopyShareLink(grad)}
                            className="px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-800 hover:bg-[#f0c95e] text-slate-700 dark:text-slate-200 hover:text-[#071129] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                          >
                            {copiedId === grad.id ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>{tr('কপিড', 'Copied', 'تم النسخ')}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>{tr('কপি', 'Copy', 'نسخ')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>

                {/* Desktop Opposite Column Milestone Year & Completion Date Marker */}
                <div
                  className={`hidden lg:block row-start-1 ${
                    isLeftColumn
                      ? 'lg:col-start-3 lg:pl-6 text-left'
                      : 'lg:col-start-1 lg:pr-6 text-right'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-mono font-bold text-[#9c7a32] dark:text-[#f0c95e] tabular-nums">
                      {localizeDigits(grad.completionYear, language)}
                    </div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {localizeDynamicText(grad.completionDate, language)}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Slide-over Info Drawer (self-contained by default) */}
      {showDrawer && (
        <HafezInfoDrawer
          selectedHafez={selectedHafez}
          language={language}
          copiedId={copiedId}
          onClose={() => onSelectHafez(null)}
          onDownloadCertificate={onDownloadCertificate}
          onCopyShareLink={onCopyShareLink}
          onOpenAdmission={onOpenAdmission}
        />
      )}
    </>
  );
};

export const HafezInfoDrawer: React.FC<HafezInfoDrawerProps> = ({
  selectedHafez,
  language,
  copiedId,
  onClose,
  onDownloadCertificate,
  onCopyShareLink,
  onOpenAdmission,
}) => {
  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  useEffect(() => {
    if (!selectedHafez) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedHafez, onClose]);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://maharatmadrasah.edu.bd';

  return (
    <AnimatePresence>
      {selectedHafez && (
        <div
          className="fixed inset-0 z-[90] flex justify-end"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hafez-info-drawer-title"
          data-testid="hafez-info-drawer"
        >
          {/* Backdrop Scrim */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg h-full bg-white dark:bg-[#0b1836] border-l border-slate-200 dark:border-[#005a6e]/50 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Drawer Header */}
            <div className="bg-gradient-to-r from-[#071129] via-[#192f64] to-[#005a6e] text-white px-6 py-5 flex items-center justify-between gap-4 border-b border-[#e5b94c]/30 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#f0c95e] to-[#c4962c] text-[#071129] flex items-center justify-center font-black text-xs tabular-nums shrink-0 shadow-md">
                  {language === 'en'
                    ? `#${selectedHafez.serialNumber}`
                    : `${toBengaliDigits(selectedHafez.serialNumber)}তম`}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#f0c95e]">
                    {tr(
                      'হাফেজ প্রোফাইল · জীবনী ও সম্মাননা সনদ',
                      'Hafez Info · Biography & Certificate',
                      'ملف الحافظ · السيرة والشهادة'
                    )}
                  </div>
                  <h3
                    id="hafez-info-drawer-title"
                    className="text-lg font-extrabold truncate leading-snug"
                  >
                    {language === 'en'
                      ? selectedHafez.nameEn
                      : localizeDynamicText(selectedHafez.nameBn, language)}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                data-testid="button-close-info-drawer"
                onClick={onClose}
                aria-label="Close Info Drawer"
                className="w-10 h-10 rounded-full bg-white/12 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c95e]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

              {/* Scrollable Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Portrait + Key Identity */}
                <div className="flex items-start gap-4">
                  <div className="w-28 h-34 rounded-2xl overflow-hidden border-2 border-[#d4a843]/70 bg-slate-900 shrink-0 shadow-sm">
                    <img
                      src={selectedHafez.photoUrl}
                      alt={selectedHafez.nameBn}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/maharat/fb/fb-media-21.jpg';
                      }}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="text-xs font-extrabold text-[#9c7a32] dark:text-[#f0c95e]">
                      {language === 'en'
                        ? `Serial #${selectedHafez.serialNumber} Hafez · Session ${selectedHafez.completionYear}`
                        : `${localizeDynamicText(selectedHafez.serialLabelBn, language)} · ${localizeDigits(selectedHafez.completionYear, language)}`}
                    </div>
                    <div className="text-sm font-bold text-[#0a1738] dark:text-white flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#005a6e] dark:text-[#5eead4] shrink-0" />
                      <span>{localizeDynamicText(selectedHafez.classNameBn, language)}</span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#c4962c] shrink-0" />
                      <span>{localizeDynamicText(selectedHafez.completionDate, language)}</span>
                    </div>
                    <div className="pt-1 font-mono text-[11px] font-bold text-[#005a6e] dark:text-[#5eead4] tabular-nums">
                      ID: {buildHafizCertificateCode(selectedHafez)}
                    </div>
                  </div>
                </div>

                {/* Structured Academic & Personal Metadata */}
                <dl className="grid grid-cols-2 gap-3 text-xs border-y border-slate-200 dark:border-slate-800 py-4">
                  {selectedHafez.durationNoteBn && (
                    <div className="col-span-2">
                      <dt className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-[#c4962c]" />
                        <span>{tr('হিফজ মেয়াদ ও বিশেষ অর্জন', 'Hifz Duration & Distinction', 'مدة الحفظ')}</span>
                      </dt>
                      <dd className="font-bold text-[#0a1738] dark:text-white mt-0.5">
                        {localizeDynamicText(selectedHafez.durationNoteBn, language)}
                      </dd>
                    </div>
                  )}
                  {selectedHafez.fatherNameBn && (
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400 font-semibold">
                        {tr('পিতার নাম', 'Father’s Name', 'اسم الأب')}
                      </dt>
                      <dd className="font-bold text-[#0a1738] dark:text-white mt-0.5">
                        {selectedHafez.fatherNameBn}
                      </dd>
                    </div>
                  )}
                  {selectedHafez.teacherNameBn && (
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400 font-semibold">
                        {tr('তত্ত্বাবধায়ক উস্তাদ', 'Hifz Ustad', 'المعلم المشرف')}
                      </dt>
                      <dd className="font-bold text-[#0a1738] dark:text-white mt-0.5">
                        {selectedHafez.teacherNameBn}
                      </dd>
                    </div>
                  )}
                  {selectedHafez.hometownBn && (
                    <div className="col-span-2">
                      <dt className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#005a6e]" />
                        <span>{tr('নিজ এলাকা / জেলা', 'Hometown', 'المدينة')}</span>
                      </dt>
                      <dd className="font-bold text-[#0a1738] dark:text-white mt-0.5">
                        {selectedHafez.hometownBn}
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Student Biography Section */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold text-[#005a6e] dark:text-[#f0c95e] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4" />
                    <span>
                      {tr('শিক্ষার্থীর পূর্ণাঙ্গ জীবনী', 'Student Biography', 'السيرة الذاتية للطالب')}
                    </span>
                  </h4>
                  <p
                    data-testid="hafez-drawer-biography"
                    className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed"
                  >
                    {localizeDynamicText(buildHafizBiography(selectedHafez), language)}
                  </p>
                </div>

                {/* Official Certificate Action Panel */}
                <div className="rounded-2xl border border-[#d4a843]/60 bg-amber-50/55 dark:bg-[#192f64]/35 p-4 space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a843] to-[#f0c95e] text-[#071129] flex items-center justify-center shrink-0">
                      <FileBadge2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-[#0a1738] dark:text-white">
                        {selectedHafez.certificateUrl
                          ? tr(
                              'অ্যাডমিন সংযুক্ত মূল সার্টিফিকেট',
                              'Attached Official Certificate',
                              'الشهادة الرسمية المرفقة'
                            )
                          : tr(
                              'অফিশিয়াল হিফজুল কুরআন সম্মাননা সার্টিফিকেট',
                              'Official Hifzul Quran Honor Certificate',
                              'شهادة شرف حفظ القرآن الرسمية'
                            )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 tabular-nums">
                        EIIN: 140630 · Code: 21023 · {buildHafizCertificateCode(selectedHafez)}
                      </p>
                    </div>
                  </div>

                  {selectedHafez.certificateUrl &&
                    !selectedHafez.certificateUrl.toLowerCase().endsWith('.pdf') && (
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white">
                        <img
                          src={selectedHafez.certificateUrl}
                          alt={`${selectedHafez.nameBn} Certificate`}
                          referrerPolicy="no-referrer"
                          className="w-full max-h-52 object-contain"
                        />
                      </div>
                    )}

                  <button
                    type="button"
                    data-testid="button-drawer-download-cert"
                    onClick={() => onDownloadCertificate(selectedHafez)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#192f64] via-[#005a6e] to-[#007c91] hover:from-[#12244f] hover:to-[#006475] text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                  >
                    <Download className="w-4 h-4 text-[#f0c95e]" />
                    <span>
                      {tr(
                        'সার্টিফিকেট ডাউনলোড করুন (PDF)',
                        'Download Certificate (PDF)',
                        'تحميل الشهادة (PDF)'
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* Drawer Sticky Footer: Guardian Sharing */}
              <div className="px-6 py-4 bg-slate-50 dark:bg-[#08122b] border-t border-slate-200 dark:border-white/10 space-y-3 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-[#005a6e] dark:text-[#f0c95e]" />
                    <span>{tr('পরিবারের সাথে শেয়ার করুন', 'Share with family', 'شارك مع العائلة')}</span>
                  </span>

                  {(() => {
                    const share = buildHafizSocialShareLinks(selectedHafez, origin);
                    return (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={share.facebookShareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold transition-colors whitespace-nowrap"
                        >
                          Facebook
                        </a>
                        <a
                          href={share.whatsappShareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 text-xs font-bold transition-colors whitespace-nowrap"
                        >
                          WhatsApp
                        </a>
                        <button
                          type="button"
                          onClick={() => onCopyShareLink(selectedHafez)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          {copiedId === selectedHafez.id
                            ? tr('কপিড ✓', 'Copied ✓', 'تم النسخ ✓')
                            : tr('লিংক কপি', 'Copy Link', 'نسخ')}
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {onOpenAdmission && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdmission();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-[#192f64]/25 dark:border-[#f0c95e]/35 text-[#192f64] dark:text-[#f0c95e] hover:bg-[#192f64]/5 dark:hover:bg-white/5 text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    {tr(
                      'হিফজ বিভাগে ভর্তির আবেদন করুন →',
                      'Apply for Tahfizul Quran Admission →',
                      'تقديم طلب القبول لقسم التحفيظ ←'
                    )}
                  </button>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
  );
};
