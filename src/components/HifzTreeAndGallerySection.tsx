import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  ArrowDownUp,
  Award,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Eye,
  FileBadge2,
  FileText,
  Filter,
  GitBranch,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  LayoutGrid,
  ListOrdered,
  MapPin,
  Maximize2,
  Monitor,
  Plane,
  Play,
  Search,
  Share2,
  Sparkles,
  Trophy,
  User,
  Users,
  Video,
  X,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { HafizGraduateItem, PhotoGalleryCategory, PhotoGalleryItem } from '../types/cms';
import {
  buildHafizSocialShareLinks,
  buildUnifiedMediaHubItems,
  DEFAULT_EXAM_SCHEDULES,
  ExamScheduleItem,
  filterExamSchedules,
  filterHifzGraduates,
  filterPhotoGallery,
  filterUnifiedMediaItems,
  toBengaliDigits,
  UnifiedMediaHubItem,
} from '../utils/cmsLogic';
import { localizeDigits, localizeDynamicText } from '../utils/i18nContent';
import {
  buildHafizBiography,
  buildHafizCertificateCode,
  sortHifzLineage,
} from '../utils/portalAndHifzLogic';
import { generateHafizCertificatePdf } from '../utils/certificatePdf';
import { HafezInfoDrawer, LineageTimeline } from './LineageTimeline';

export interface FramedPhotoModalData {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  badgeText?: string;
  dateText?: string;
  imageUrl: string;
  facebookPostUrl?: string;
  shareUrl?: string;
  shareText?: string;
  categoryLabel?: string;
}

interface HifzQuranTreeSectionProps {
  previewMode?: boolean;
  onNavigateToFullTree?: () => void;
  onOpenFramedPhoto: (photo: FramedPhotoModalData, allPhotos?: FramedPhotoModalData[]) => void;
  onOpenAdmission?: () => void;
}

export const HifzQuranTreeSection: React.FC<HifzQuranTreeSectionProps> = ({
  previewMode = false,
  onNavigateToFullTree,
  onOpenFramedPhoto,
  onOpenAdmission,
}) => {
  const { state, language, pushToast } = useCMS();
  const hifzTree = state.hifzTreeConfig;

  const [sessionFilter, setSessionFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(previewMode ? 'desc' : 'asc');
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [selectedBioHafez, setSelectedBioHafez] = useState<HafizGraduateItem | null>(null);

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  // Deep-link support (?hafiz=30 opens that Hafez Biography & Certificate modal)
  useEffect(() => {
    if (previewMode || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const hafizSerial = Number(params.get('hafiz'));
    if (hafizSerial && hifzTree?.graduates) {
      const target = hifzTree.graduates.find((g) => g.serialNumber === hafizSerial);
      if (target) {
        setSelectedBioHafez(target);
      }
    }
  }, [previewMode, hifzTree?.graduates]);

  if (!hifzTree) return null;

  const totalHuffaz = Math.max(hifzTree.totalHuffazCount || 0, (hifzTree.graduates || []).length || 30);

  const filteredGraduates = sortHifzLineage(
    filterHifzGraduates(hifzTree.graduates || [], sessionFilter, searchQuery),
    sortOrder
  );

  // In preview mode on Home Page, show 6 key milestone Huffaz (latest 5 + 1st Founding Hafez)
  const displayedGraduates = previewMode
    ? (() => {
        const sortedDesc = sortHifzLineage(hifzTree.graduates || [], 'desc');
        const latestFive = sortedDesc.slice(0, 5);
        const firstHafez = (hifzTree.graduates || []).find((g) => g.serialNumber === 1);
        const combined = [...latestFive];
        if (firstHafez && !combined.some((g) => g.id === firstHafez.id)) {
          combined.push(firstHafez);
        }
        return sortHifzLineage(combined, sortOrder);
      })()
    : filteredGraduates;

  const toModalItem = (item: HafizGraduateItem): FramedPhotoModalData => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://maharatmadrasah.edu.bd';
    const shareInfo = buildHafizSocialShareLinks(item, origin);
    const serialText =
      language === 'en'
        ? `#${item.serialNumber} Hafez`
        : localizeDynamicText(item.serialLabelBn, language);
    return {
      id: item.id,
      title:
        language === 'en'
          ? `${serialText} — ${item.nameEn}`
          : `${serialText} — ${localizeDynamicText(item.nameBn, language)}`,
      subtitle: `${localizeDynamicText(item.classNameBn, language)} • ${localizeDynamicText(item.completionDate, language)}`,
      description: localizeDynamicText(buildHafizBiography(item), language),
      badgeText: serialText,
      dateText: localizeDynamicText(item.completionDate, language),
      imageUrl: item.photoUrl,
      facebookPostUrl: item.facebookPostUrl,
      shareUrl: shareInfo.shareUrl,
      shareText: shareInfo.shareText,
      categoryLabel: localizeDynamicText(item.durationNoteBn || 'হিফজুল কুরআন সম্পন্ন', language),
    };
  };

  const allModalItems = displayedGraduates.map(toModalItem);

  const handleDownloadCertificate = async (grad: HafizGraduateItem) => {
    const certCode = buildHafizCertificateCode(grad);

    // If Admin attached a custom certificate image or PDF, trigger direct download/open
    if (grad.certificateUrl && grad.certificateUrl.trim().length > 0) {
      const link = document.createElement('a');
      link.href = grad.certificateUrl.trim();
      link.download = `Maharat-Hifz-Certificate-${grad.serialNumber}-${certCode}`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
      pushToast(
        tr('সার্টিফিকেট ডাউনলোড শুরু হয়েছে!', 'Certificate Download Started!', 'بدأ تحميل الشهادة!'),
        `${grad.serialLabelBn} — ${grad.nameBn} (${certCode})`,
        'success'
      );
      return;
    }

    // Generate Official QR-Verified Maharat Hifzul Quran Honor Certificate PDF with auto-embedded staff signatures
    try {
      await generateHafizCertificatePdf({
        grad,
        totalHuffaz,
        users: state.users || [],
        origin:
          typeof window !== 'undefined' ? window.location.origin : 'https://maharatmadrasah.edu.bd',
      });
      pushToast(
        tr(
          'QR ভেরিফায়েড অফিসিয়াল সার্টিফিকেট PDF ডাউনলোড সম্পন্ন!',
          'QR-Verified Official Certificate PDF Downloaded!',
          'تم تحميل الشهادة الرسمية الموثقة برمز QR!'
        ),
        `${grad.serialLabelBn} — ${grad.nameBn} (${certCode})`,
        'success'
      );
    } catch {
      pushToast(
        tr('সার্টিফিকেট তৈরি করা যায়নি', 'Certificate Export Failed', 'تعذر إنشاء الشهادة'),
        tr('আবার চেষ্টা করুন।', 'Please try again.', 'يرجى المحاولة مجدداً.'),
        'info'
      );
    }
  };

  const handleCopyShareLink = (item: HafizGraduateItem) => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://maharatmadrasah.edu.bd';
    const shareInfo = buildHafizSocialShareLinks(item, origin);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(`${shareInfo.shareText}\n${shareInfo.shareUrl}`);
    }
    setCopiedId(item.id);
    pushToast(
      tr('শেয়ার লিংক কপি হয়েছে!', 'Share Link Copied!', 'تم نسخ رابط المشاركة!'),
      tr(
        `${item.serialLabelBn} ${item.nameBn}-এর জীবনী ও সার্টিফিকেট লিংক কপি হয়েছে।`,
        `Copied direct link for #${item.serialNumber} ${item.nameEn}.`,
        'تم نسخ الرابط المباشر للمشاركة.'
      ),
      'info'
    );
    window.setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareFullTree = (platform: 'facebook' | 'whatsapp' | 'copy') => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://maharatmadrasah.edu.bd';
    const treeUrl = `${origin}/hifz-tree`;
    const treeText = `আলহামদুলিল্লাহ! মাহারাত মডেল মাদ্রাসার হিফজুল কুরআন বংশবৃক্ষ — ১ম হাফেজ থেকে ${toBengaliDigits(totalHuffaz)}তম হাফেজ পর্যন্ত সকল হাফেজের জীবনী ও সম্মাননা সার্টিফিকেট দেখুন:`;

    if (platform === 'copy') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(`${treeText}\n${treeUrl}`);
      }
      setCopiedId('full-tree');
      pushToast(
        tr('হিফজ ট্রির লিংক কপি হয়েছে!', 'Hifz Tree Link Copied!', 'تم نسخ رابط شجرة الحفاظ!'),
        treeUrl,
        'info'
      );
      window.setTimeout(() => setCopiedId(null), 2500);
      return;
    }

    const shareTargetUrl =
      platform === 'facebook'
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(treeUrl)}&quote=${encodeURIComponent(treeText)}`
        : `https://wa.me/?text=${encodeURIComponent(`${treeText} ${treeUrl}`)}`;

    const a = document.createElement('a');
    a.href = shareTargetUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const sessionTabs = [
    {
      id: 'All',
      label: tr(
        `সকল হাফেজ (${toBengaliDigits(hifzTree.graduates.length)})`,
        `All Huffaz (${hifzTree.graduates.length})`,
        'جميع الحفاظ'
      ),
    },
    { id: '2026', label: tr('২০২৬ সেশন', '2026 Session', 'دفعة ٢٠٢٦') },
    { id: '2025', label: tr('২০২৫ সেশন', '2025 Session', 'دفعة ٢٠٢٥') },
    { id: '2024', label: tr('২০২৪ সেশন', '2024 Session', 'دفعة ٢٠٢٤') },
    { id: '2023', label: tr('২০২৩ সেশন', '2023 Session', 'دفعة ٢٠٢٣') },
    { id: '2022', label: tr('২০২২ সেশন (সূচনা)', '2022 Founding Batch', 'دفعة ٢٠٢٢') },
  ];

  return (
    <section
      id="hifz-tree"
      className="py-16 lg:py-22 bg-gradient-to-b from-[#f3f7fa] via-white to-[#eef5f7] dark:from-[#071129] dark:via-[#0c1c3d] dark:to-[#071129] text-slate-900 dark:text-white border-b border-slate-200/80 dark:border-[#005a6e]/35 transition-colors"
    >
      <div className="cii-container-section space-y-10">
        {/* Top Executive Header & Guardian Social Share Bar */}
        <div className="rounded-3xl bg-gradient-to-r from-[#071129] via-[#192f64] to-[#005a6e] text-white p-7 sm:p-9 lg:p-11 shadow-2xl border border-[#e5b94c]/35 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-72 h-72 rounded-full bg-[#e5b94c]/15 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-72 h-72 rounded-full bg-[#0ea5b7]/20 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-7">
            <div className="space-y-3.5 max-w-3xl">
              <div className="inline-flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#d4a843] to-[#f0c95e] text-[#071129] text-xs font-extrabold uppercase tracking-wider shadow-sm">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>
                    {language === 'en'
                      ? `Hifzul Quran Lineage (1st – ${totalHuffaz}th Hafez)`
                      : tr(
                          `হিফজুল কুরআন সিলসিলা (১ম – ${toBengaliDigits(totalHuffaz)}তম হাফেজ)`,
                          `Hifzul Quran Lineage (1st – ${totalHuffaz}th Hafez)`,
                          `سلسلة حفاظ القرآن (١ – ${totalHuffaz})`
                        )}
                  </span>
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-white/12 border border-[#e5b94c]/35 text-[#f7dc84] text-xs font-extrabold">
                  {tr(
                    `টাইমলাইন · জীবনী · অফিশিয়াল সার্টিফিকেট ডাউনলোড`,
                    `Timeline · Biography · Official Certificate Download`,
                    `الجدول الزمني · السيرة · تحميل الشهادة`
                  )}
                </span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                {language === 'en'
                  ? `Hifzul Quran Honor Lineage (1st to ${totalHuffaz}th Hafez)`
                  : localizeDynamicText(hifzTree.titleBn, language)}
              </h2>

              <p className="text-sm sm:text-base text-teal-50/90 leading-relaxed">
                {localizeDynamicText(hifzTree.subtitleBn, language)}
              </p>
            </div>

            {/* Share Entire Hifz Lineage Box */}
            <div className="bg-white/10 backdrop-blur-md border border-[#e5b94c]/30 rounded-2xl p-4 sm:p-5 space-y-3 shrink-0 lg:w-84">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-[#f0c95e] flex items-center gap-1.5">
                  <Share2 className="w-4 h-4" />
                  <span>
                    {tr(
                      'অভিভাবক ও আত্মীয়দের সাথে শেয়ার করুন',
                      'Share Hifz Lineage',
                      'شارك سلسلة حفاظ القرآن'
                    )}
                  </span>
                </span>
                <span className="text-[11px] font-mono bg-emerald-500/25 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  {tr(
                    `${toBengaliDigits(totalHuffaz)} জন হাফেজ`,
                    `${totalHuffaz} Huffaz`,
                    `${totalHuffaz} حافظاً`
                  )}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleShareFullTree('facebook')}
                  className="py-2.5 px-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <span>Facebook</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShareFullTree('whatsapp')}
                  className="py-2.5 px-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <span>WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleShareFullTree('copy')}
                  className="py-2.5 px-2.5 rounded-xl bg-[#f0c95e] hover:bg-[#fde68a] text-[#071129] text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  {copiedId === 'full-tree' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{tr('কপি হয়েছে', 'Copied', 'نسخ')}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>{tr('লিংক কপি', 'Copy', 'نسخ')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2 Featured Spotlight Banners: (1) Cox's Bazar Air Tour Reward + (2) 7th Sabak Ceremony */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spotlight 1: 2.5 Years Hifz Completion Cox's Bazar Air Tour */}
          <div
            onClick={() =>
              onOpenFramedPhoto({
                id: 'cox-bazar-reward',
                title: hifzTree.airTourRewardTitleBn,
                subtitle: 'বিমানে কক্সবাজার ভ্রমণ পুরস্কার — মাহারাত হিফজুল কুরআন বিভাগ',
                description: hifzTree.airTourRewardDescBn,
                badgeText: 'বিশেষ সম্মাননা ও বিমান ভ্রমণ পুরস্কার',
                dateText: '২০২৬ শিক্ষাবর্ষ',
                imageUrl: hifzTree.airTourRewardImageUrl,
                facebookPostUrl: hifzTree.airTourRewardPostUrl,
                categoryLabel: 'Hifz Excellence Reward',
              })
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenFramedPhoto({
                  id: 'cox-bazar-reward',
                  title: hifzTree.airTourRewardTitleBn,
                  subtitle: 'বিমানে কক্সবাজার ভ্রমণ পুরস্কার — মাহারাত হিফজুল কুরআন বিভাগ',
                  description: hifzTree.airTourRewardDescBn,
                  badgeText: 'বিশেষ সম্মাননা ও বিমান ভ্রমণ পুরস্কার',
                  dateText: '২০২৬ শিক্ষাবর্ষ',
                  imageUrl: hifzTree.airTourRewardImageUrl,
                  facebookPostUrl: hifzTree.airTourRewardPostUrl,
                  categoryLabel: 'Hifz Excellence Reward',
                });
              }
            }}
            className="group rounded-3xl bg-white dark:bg-[#0f2047]/95 border-2 border-[#d4a843]/70 dark:border-[#d4a843]/50 overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer grid grid-cols-1 sm:grid-cols-12"
          >
            <div className="sm:col-span-5 relative aspect-[4/3] sm:aspect-auto bg-slate-950 overflow-hidden">
              <img
                src={hifzTree.airTourRewardImageUrl}
                alt={hifzTree.airTourRewardTitleBn}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent flex items-end p-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#f0c95e] text-[#071129] text-[11px] font-extrabold shadow-xs">
                  <Maximize2 className="w-3 h-3" />
                  <span>{tr('ফ্রেমে বড় করে দেখুন', 'Open in Frame', 'عرض في إطار')}</span>
                </span>
              </div>
            </div>
            <div className="sm:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-400/20 text-amber-900 dark:text-[#f0c95e] text-[11px] font-extrabold">
                  <Plane className="w-3.5 h-3.5" />
                  <span>
                    {tr(
                      'বিমানে কক্সবাজার ভ্রমণ পুরস্কার!',
                      'Cox’s Bazar Air Tour Reward!',
                      'جائزة رحلة جوية إلى كوكس بازار!'
                    )}
                  </span>
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#0a1738] dark:text-white group-hover:text-[#005a6e] dark:group-hover:text-[#f0c95e] transition-colors leading-snug">
                  {localizeDynamicText(hifzTree.airTourRewardTitleBn, language)}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {localizeDynamicText(hifzTree.airTourRewardDescBn, language)}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-extrabold text-[#005a6e] dark:text-[#f0c95e]">
                <span>
                  {tr(
                    'পপআপ ফ্রেমে ছবি ও বিস্তারিত দেখুন →',
                    'View Framed Photo & Details →',
                    'عرض الصورة والتفاصيل →'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Spotlight 2: 7th Sabak Giving Ceremony (96 Students) */}
          <div
            onClick={() =>
              onOpenFramedPhoto({
                id: 'sabak-ceremony-7',
                title: hifzTree.sabakCeremonyTitleBn,
                subtitle: 'হিফজুল কুরআন বিভাগ — পবিত্র কুরআনের নূরানী, নাজেরা ও হিফজ সবক',
                description: hifzTree.sabakCeremonyDescBn,
                badgeText: '৭ম সবক প্রদান অনুষ্ঠান ২০২৬',
                dateText: '২০২৬ শিক্ষাবর্ষ (৯৬ জন শিক্ষার্থী)',
                imageUrl: hifzTree.sabakCeremonyImageUrl,
                facebookPostUrl: hifzTree.sabakCeremonyPostUrl,
                categoryLabel: 'Sabak Ceremony',
              })
            }
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenFramedPhoto({
                  id: 'sabak-ceremony-7',
                  title: hifzTree.sabakCeremonyTitleBn,
                  subtitle: 'হিফজুল কুরআন বিভাগ — পবিত্র কুরআনের নূরানী, নাজেরা ও হিফজ সবক',
                  description: hifzTree.sabakCeremonyDescBn,
                  badgeText: '৭ম সবক প্রদান অনুষ্ঠান ২০২৬',
                  dateText: '২০২৬ শিক্ষাবর্ষ (৯৬ জন শিক্ষার্থী)',
                  imageUrl: hifzTree.sabakCeremonyImageUrl,
                  facebookPostUrl: hifzTree.sabakCeremonyPostUrl,
                  categoryLabel: 'Sabak Ceremony',
                });
              }
            }}
            className="group rounded-3xl bg-white dark:bg-[#0f2047]/95 border-2 border-[#005a6e]/40 dark:border-[#0ea5b7]/40 overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer grid grid-cols-1 sm:grid-cols-12"
          >
            <div className="sm:col-span-5 relative aspect-[4/3] sm:aspect-auto bg-slate-950 overflow-hidden">
              <img
                src={hifzTree.sabakCeremonyImageUrl}
                alt={hifzTree.sabakCeremonyTitleBn}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent flex items-end p-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#005a6e] text-white text-[11px] font-extrabold shadow-xs">
                  <Maximize2 className="w-3 h-3" />
                  <span>{tr('ফ্রেমে বড় করে দেখুন', 'Open in Frame', 'عرض في إطار')}</span>
                </span>
              </div>
            </div>
            <div className="sm:col-span-7 p-5 sm:p-6 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-[#005a6e]/50 text-[#005a6e] dark:text-[#5eead4] text-[11px] font-extrabold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {tr(
                      '৭ম সবক প্রদান অনুষ্ঠান — ৯৬ জন শিক্ষার্থী',
                      '7th Sabak Giving Ceremony — 96 Students',
                      'حفل السبق السابع — ٩٦ طالباً'
                    )}
                  </span>
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#0a1738] dark:text-white group-hover:text-[#005a6e] dark:group-hover:text-[#f0c95e] transition-colors leading-snug">
                  {localizeDynamicText(hifzTree.sabakCeremonyTitleBn, language)}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {localizeDynamicText(hifzTree.sabakCeremonyDescBn, language)}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex items-center justify-between text-xs font-extrabold text-[#005a6e] dark:text-[#f0c95e]">
                <span>
                  {tr(
                    'পপআপ ফ্রেমে ছবি ও বিস্তারিত দেখুন →',
                    'View Framed Photo & Details →',
                    'عرض الصورة والتفاصيل →'
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Controls Bar: View Switcher (Timeline vs Grid), Order Switcher (1st->30th vs 30th->1st), Session Filter & Search */}
        <div className="bg-white dark:bg-[#0f2047] rounded-2xl border border-slate-200 dark:border-[#005a6e]/50 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Session Filter Tabs (full page) or Heading Pill (preview mode) */}
            {!previewMode ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {sessionTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSessionFilter(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      sessionFilter === tab.id
                        ? 'bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-teal-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm font-extrabold text-[#0a1738] dark:text-[#f0c95e]">
                <ListOrdered className="w-4 h-4 text-[#005a6e] dark:text-[#5eead4]" />
                <span>
                  {tr(
                    `ধারাবাহিক হাফেজ টাইমলাইন প্রিভিউ (১ম – ${toBengaliDigits(totalHuffaz)}তম হাফেজ)`,
                    `Sequential Hafez Lineage Preview (1st – ${totalHuffaz}th Hafez)`,
                    `معاينة سلسلة الحفاظ (${totalHuffaz} حافظاً)`
                  )}
                </span>
              </div>
            )}

            {/* Right: Search + View Mode Toggle (Timeline / Grid) + Direction Toggle */}
            <div className="flex flex-wrap items-center gap-2.5">
              {!previewMode && (
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-[#005a6e] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={tr(
                      `হাফেজের নাম বা ক্রমিক খুঁজুন (যেমন: ${toBengaliDigits(totalHuffaz)} বা আহসানুদ্দিন)...`,
                      `Search Hafez by name or serial (e.g. ${totalHuffaz})...`,
                      'ابحث عن اسم الحافظ أو الرقم...'
                    )}
                    aria-label="Search Hifz Graduates"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#005a6e]"
                  />
                </div>
              )}

              {/* Timeline vs Grid View Switcher */}
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    viewMode === 'timeline'
                      ? 'bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                  <span>{tr('টাইমলাইন ভিউ', 'Timeline', 'الجدول الزمني')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{tr('কার্ড গ্যালারি', 'Grid', 'الشبكة')}</span>
                </button>
              </div>

              {/* Direction Toggle: 1st -> 30th vs 30th -> 1st */}
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#e5b94c]/20 dark:bg-[#e5b94c]/15 border border-[#c4962c]/50 text-[#0a1738] dark:text-[#f0c95e] text-xs font-extrabold cursor-pointer whitespace-nowrap hover:bg-[#e5b94c]/30 transition-colors"
              >
                <ArrowDownUp className="w-3.5 h-3.5" />
                <span>
                  {sortOrder === 'asc'
                    ? tr(
                        `ক্রম: ১ম → ${toBengaliDigits(totalHuffaz)}তম (উপর থেকে নিচে)`,
                        `Order: 1st → ${totalHuffaz}th`,
                        `الترتيب: ١ ← ${totalHuffaz}`
                      )
                    : tr(
                        `ক্রম: ${toBengaliDigits(totalHuffaz)}তম → ১ম (নতুন আগে)`,
                        `Order: ${totalHuffaz}th → 1st`,
                        `الترتيب: ${totalHuffaz} ← ١`
                      )}
                </span>
              </button>
            </div>
          </div>

          {/* Interactive Lineage Jump Strip (1st to 30th Hafez Quick-Jump Medallions) */}
          {!previewMode && (
            <div className="pt-3 border-t border-slate-100 dark:border-white/10">
              <div className="text-xs font-bold text-[#005a6e] dark:text-[#5eead4] mb-2 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5" />
                <span>
                  {tr(
                    `হাফেজদের ধারাবাহিক সিলসিলা (যেকোনো ক্রমিকে ক্লিক করে সরাসরি জীবনী ও সার্টিফিকেট দেখুন):`,
                    `Continuous Hifz Lineage (Click any serial badge to inspect Biography & Certificate):`,
                    `سلسلة حفاظ القرآن الكريم (اضغط على أي رقم لعرض السيرة والشهادة):`
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                {sortHifzLineage(hifzTree.graduates || [], 'asc').map((g) => (
                  <button
                    key={`node-${g.id}`}
                    type="button"
                    onClick={() => setSelectedBioHafez(g)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold shrink-0 transition-all cursor-pointer border ${
                      g.featured
                        ? 'bg-gradient-to-r from-[#d4a843] to-[#f0c95e] text-[#071129] border-[#c4962c] shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900 text-[#0a1738] dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-[#005a6e] hover:bg-teal-50 dark:hover:bg-[#005a6e]/30'
                    }`}
                    title={`${g.serialLabelBn} — ${g.nameBn}`}
                  >
                    {language === 'en' ? `#${g.serialNumber}` : `${toBengaliDigits(g.serialNumber)}তম`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================
            VIEW 1: MODERN VERTICAL ALTERNATING CSS GRID LINEAGE TIMELINE
           ================================================================ */}
        {viewMode === 'timeline' ? (
          <LineageTimeline
            graduates={displayedGraduates}
            language={language}
            selectedHafez={selectedBioHafez}
            copiedId={copiedId}
            onSelectHafez={setSelectedBioHafez}
            onDownloadCertificate={handleDownloadCertificate}
            onCopyShareLink={handleCopyShareLink}
            onOpenZoomPhoto={(grad) => onOpenFramedPhoto(toModalItem(grad), allModalItems)}
            onOpenAdmission={onOpenAdmission}
            showDrawer={false}
          />
        ) : (
          /* ================================================================
             VIEW 2: CLASSIC CARD GALLERY GRID VIEW
             ================================================================ */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {displayedGraduates.map((grad) => {
              const origin =
                typeof window !== 'undefined'
                  ? window.location.origin
                  : 'https://maharatmadrasah.edu.bd';
              const shareLinks = buildHafizSocialShareLinks(grad, origin);
              const modalData = toModalItem(grad);

              return (
                <div
                  key={grad.id}
                  className={`group rounded-3xl bg-white dark:bg-[#0f2047]/95 border-2 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-md hover:shadow-2xl ${
                    grad.featured
                      ? 'border-[#d4a843]/80 dark:border-[#d4a843]/60 ring-2 ring-[#e5b94c]/20'
                      : 'border-slate-200 dark:border-[#005a6e]/40 hover:border-[#007c91]'
                  }`}
                >
                  <div>
                    <div
                      onClick={() => onOpenFramedPhoto(modalData, allModalItems)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onOpenFramedPhoto(modalData, allModalItems);
                        }
                      }}
                      className="relative aspect-[4/3] bg-slate-950 overflow-hidden cursor-pointer p-2.5 bg-gradient-to-b from-[#192f64] to-[#071129]"
                    >
                      <div className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-[#d4a843]/55 shadow-inner">
                        <img
                          src={grad.photoUrl}
                          alt={grad.nameBn}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = '/assets/maharat/fb/fb-media-21.jpg';
                          }}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#d4a843] to-[#f0c95e] text-[#071129] text-xs font-black shadow-md flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5" />
                            <span>
                              {language === 'en'
                                ? `#${grad.serialNumber} Hafez`
                                : localizeDynamicText(grad.serialLabelBn, language)}
                            </span>
                          </span>
                        </div>

                        <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur-xs border border-white/20 text-[11px] font-mono font-bold text-[#f0c95e]">
                          {localizeDigits(grad.completionYear, language)}
                        </span>

                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-white">
                          <div>
                            <span className="text-[11px] font-bold text-[#f0c95e] block">
                              {localizeDynamicText(grad.classNameBn, language)}
                            </span>
                            <h3 className="text-base sm:text-lg font-extrabold leading-tight drop-shadow">
                              {language === 'en'
                                ? grad.nameEn
                                : localizeDynamicText(grad.nameBn, language)}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold">
                        <span className="inline-flex items-center gap-1 text-[#005a6e] dark:text-[#5eead4] bg-teal-50 dark:bg-[#005a6e]/40 px-2.5 py-1 rounded-md">
                          <Calendar className="w-3 h-3" />
                          <span>{localizeDynamicText(grad.completionDate, language)}</span>
                        </span>
                        {grad.durationNoteBn && (
                          <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-1 rounded-md">
                            <Award className="w-3 h-3" />
                            <span>{localizeDynamicText(grad.durationNoteBn, language)}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {localizeDynamicText(buildHafizBiography(grad), language)}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-white/10 space-y-2.5 bg-slate-50/70 dark:bg-[#091533]/60">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedBioHafez(grad)}
                        className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <User className="w-3.5 h-3.5 text-[#f0c95e]" />
                        <span>{tr('জীবনী দেখুন', 'Biography', 'السيرة')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadCertificate(grad)}
                        className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#d4a843] to-[#f0c95e] text-[#071129] text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{tr('সার্টিফিকেট', 'Certificate', 'الشهادة')}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Share2 className="w-3 h-3 text-[#005a6e] dark:text-[#f0c95e]" />
                        <span>{tr('শেয়ার:', 'Share:', 'مشاركة:')}</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <a
                          href={shareLinks.facebookShareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-[#1877F2]/15 hover:bg-[#1877F2] text-[#1877F2] hover:text-white text-[11px] font-extrabold transition-colors"
                        >
                          FB
                        </a>
                        <a
                          href={shareLinks.whatsappShareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-emerald-700 dark:text-emerald-300 hover:text-slate-950 text-[11px] font-extrabold transition-colors"
                        >
                          WA
                        </a>
                        <button
                          type="button"
                          onClick={() => handleCopyShareLink(grad)}
                          className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-[#f0c95e] text-slate-700 dark:text-slate-200 hover:text-[#071129] text-[11px] font-extrabold cursor-pointer transition-colors"
                        >
                          {copiedId === grad.id ? tr('কপিড', 'Copied', 'نسخ') : tr('লিংক', 'Copy', 'نسخ')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA / View All 30 Huffaz Button when in Preview Mode */}
        {previewMode && onNavigateToFullTree && (
          <div className="text-center pt-4">
            <button
              type="button"
              onClick={onNavigateToFullTree}
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] hover:from-[#132654] hover:to-[#007c91] text-white font-extrabold text-sm sm:text-base shadow-xl border border-[#e5b94c]/40 cursor-pointer transition-all hover:scale-[1.01]"
            >
              <GitBranch className="w-5 h-5 text-[#f0c95e]" />
              <span>
                {tr(
                  `পূর্ণাঙ্গ হিফজুল কুরআন টাইমলাইন দেখুন (১ম – ${toBengaliDigits(totalHuffaz)}তম হাফেজ · জীবনী ও সার্টিফিকেটসহ) →`,
                  `Explore Complete Hifzul Quran Timeline (1st – ${totalHuffaz}th Hafez · Bio & Certificates) →`,
                  `استكشف سلسلة حفاظ القرآن الكاملة (١ – ${totalHuffaz}) ←`
                )}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Slide-Over Hafez 'Info' Drawer shared by Timeline, Grid & Quick-Jump Medallions */}
      <HafezInfoDrawer
        selectedHafez={selectedBioHafez}
        language={language}
        copiedId={copiedId}
        onClose={() => setSelectedBioHafez(null)}
        onDownloadCertificate={handleDownloadCertificate}
        onCopyShareLink={handleCopyShareLink}
        onOpenAdmission={onOpenAdmission}
      />
    </section>
  );
};

/* ============================================================================
   UNIFIED CATEGORIZED PHOTO & VIDEO MEDIA HUB (17 PHOTOS + 10 VIDEOS IN 16:9 STUDIO FRAMES)
   ============================================================================ */

interface CategorizedPhotoGallerySectionProps {
  previewMode?: boolean;
  onNavigateToFullGallery?: () => void;
  onOpenFramedPhoto: (photo: FramedPhotoModalData, allPhotos?: FramedPhotoModalData[]) => void;
  onOpenVideoModal?: (video: {
    title: string;
    videoUrl: string;
    subtitle?: string;
    isVertical?: boolean;
  }) => void;
}

const PHOTO_CATEGORIES: {
  id: 'All' | PhotoGalleryCategory;
  labelBn: string;
  labelEn: string;
  labelAr: string;
}[] = [
  {
    id: 'All',
    labelBn: 'সকল মিডিয়া (ছবি ও ভিডিও)',
    labelEn: 'All Media (Photos & Videos)',
    labelAr: 'جميع الوسائط (صور وفيديو)',
  },
  {
    id: 'Hifz & Sabak',
    labelBn: 'হিফজ ও সবক অনুষ্ঠান',
    labelEn: 'Hifz & Sabak Ceremony',
    labelAr: 'التحفيظ وحفل السبق',
  },
  {
    id: 'Board & Exam Results',
    labelBn: 'বোর্ড ফলাফল ও মেধা বৃত্তি',
    labelEn: 'Board Results & Scholarships',
    labelAr: 'نتائج الامتحانات والمنح',
  },
  {
    id: 'Study Tour & Events',
    labelBn: 'শিক্ষাসফর ও ক্রীড়া ইভেন্ট',
    labelEn: 'Study Tour & Annual Events',
    labelAr: 'الرحلات العلمية والفعاليات',
  },
  {
    id: 'Seerah & Publications',
    labelBn: 'সীরাত ও মাহারাত পত্রিকা',
    labelEn: 'Seerah & Publications',
    labelAr: 'السيرة ومجلة المهارات',
  },
  {
    id: 'Teacher Training & Campus',
    labelBn: 'শিক্ষক প্রশিক্ষণ ও ক্যাম্পাস',
    labelEn: 'Teacher Training & Campus',
    labelAr: 'تدريب المعلمين والحرم',
  },
];

export const CategorizedPhotoGallerySection: React.FC<CategorizedPhotoGallerySectionProps> = ({
  previewMode = false,
  onNavigateToFullGallery,
  onOpenFramedPhoto,
  onOpenVideoModal,
}) => {
  const { state, language } = useCMS();
  const unifiedItems = buildUnifiedMediaHubItems(state);

  const [selectedCategory, setSelectedCategory] = useState<'All' | PhotoGalleryCategory>('All');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'video' | 'photo'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const filteredItems = filterUnifiedMediaItems(
    unifiedItems,
    selectedCategory,
    mediaTypeFilter,
    searchQuery
  );
  const displayedItems = previewMode ? filteredItems.slice(0, 6) : filteredItems;

  const getCategoryLabel = (catId: PhotoGalleryCategory | string) => {
    const found = PHOTO_CATEGORIES.find((c) => c.id === catId);
    if (!found) return localizeDynamicText(catId, language);
    return language === 'en' ? found.labelEn : language === 'ar' ? found.labelAr : found.labelBn;
  };

  const toModalItem = (item: UnifiedMediaHubItem): FramedPhotoModalData => {
    const localizedCategory = getCategoryLabel(item.category);
    const localizedBadge =
      item.badgeTextBn && item.badgeTextBn !== item.category
        ? localizeDynamicText(item.badgeTextBn, language)
        : localizedCategory;
    return {
      id: item.id,
      title:
        language === 'en' && item.titleEn
          ? item.titleEn
          : localizeDynamicText(item.titleBn, language),
      subtitle: `${localizedCategory} · ${localizeDynamicText(item.dateBn, language)}`,
      description: localizeDynamicText(item.descriptionBn, language),
      badgeText: localizedBadge,
      dateText: localizeDynamicText(item.dateBn, language),
      imageUrl: item.thumbnailUrl,
      facebookPostUrl: item.facebookPostUrl,
      categoryLabel: localizedCategory,
    };
  };

  const allPhotoModalItems = displayedItems
    .filter((i) => i.mediaType === 'photo')
    .map(toModalItem);

  const handleCardClick = (item: UnifiedMediaHubItem) => {
    if (item.mediaType === 'video' && item.videoUrl && onOpenVideoModal) {
      onOpenVideoModal({
        title:
          language === 'en' && item.titleEn
            ? item.titleEn
            : localizeDynamicText(item.titleBn, language),
        videoUrl: item.videoUrl,
        subtitle: `${localizeDynamicText(item.badgeTextBn, language)} · ${localizeDynamicText(item.dateBn, language)}`,
        isVertical: false,
      });
    } else {
      onOpenFramedPhoto(toModalItem(item), allPhotoModalItems);
    }
  };

  return (
    <section
      id="photo-gallery"
      className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-t border-slate-200/70 dark:border-slate-800/80 transition-colors"
    >
      <div className="cii-container-section space-y-10">
        {/* Clean Editorial Section Header & Media Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <p
              className={`text-xs sm:text-sm font-bold text-purple-700 dark:text-amber-300 ${
                language === 'en' ? 'uppercase tracking-[0.16em]' : 'tracking-normal'
              }`}
            >
              {tr(
                `মাহারাত মিডিয়া আর্কাইভ · ${toBengaliDigits(unifiedItems.length)}টি ফটো ও ভিডিও`,
                `Maharat Media Archive · ${unifiedItems.length} Photos & Videos`,
                `الأرشيف الإعلامي · ${unifiedItems.length} صورة وفيديو`
              )}
            </p>
            <h2 className="cii-section-title font-extrabold tracking-tight text-slate-900 dark:text-white">
              {tr(
                'মাহারাত মাল্টিমিডিয়া গ্যালারি',
                'Maharat Multimedia Gallery',
                'معرض الوسائط المتعددة'
              )}
            </h2>
            <p className="text-base sm:text-[17px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {tr(
                'বোর্ড ফলাফল, সীরাত প্রতিযোগিতা, শিক্ষাসফর ও ক্যাম্পাস জীবনের বাছাইকৃত মুহূর্ত। যেকোনো ছবি বা ভিডিওতে ক্লিক করে সিনেমা ভিউতে দেখুন।',
                'Curated moments from board achievements, Seerah competitions, study tours, and campus life. Select any frame for full-screen cinema view.',
                'لحظات مختارة من نتائج الامتحانات والمسابقات والرحلات العلمية والحياة المدرسية.'
              )}
            </p>
          </div>

          {/* Clean Apple-style Segmented Filter + Optional Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="inline-flex rounded-full bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200/80 dark:border-slate-800">
              {[
                {
                  id: 'all' as const,
                  label: tr(
                    `সকল (${toBengaliDigits(unifiedItems.length)})`,
                    `All (${unifiedItems.length})`,
                    'الكل'
                  ),
                },
                {
                  id: 'video' as const,
                  label: tr(
                    `ভিডিও (${toBengaliDigits(unifiedItems.filter((i) => i.mediaType === 'video').length)})`,
                    `Videos (${unifiedItems.filter((i) => i.mediaType === 'video').length})`,
                    'فيديو'
                  ),
                },
                {
                  id: 'photo' as const,
                  label: tr(
                    `ছবি (${toBengaliDigits(unifiedItems.filter((i) => i.mediaType === 'photo').length)})`,
                    `Photos (${unifiedItems.filter((i) => i.mediaType === 'photo').length})`,
                    'صور'
                  ),
                },
              ].map((tTab) => (
                <button
                  key={tTab.id}
                  type="button"
                  onClick={() => setMediaTypeFilter(tTab.id)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    mediaTypeFilter === tTab.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tTab.label}
                </button>
              ))}
            </div>

            {!previewMode && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tr(
                    'ছবি বা ভিডিও খুঁজুন...',
                    'Search photos or videos...',
                    'ابحث في الصور والفيديو...'
                  )}
                  aria-label="Search Multimedia Gallery"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-600"
                />
              </div>
            )}
          </div>
        </div>

        {/* Clean Horizontal Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200/80 dark:border-slate-800">
          {PHOTO_CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            const count = filterUnifiedMediaItems(
              unifiedItems,
              cat.id,
              mediaTypeFilter,
              ''
            ).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`relative pb-3 px-3.5 text-sm sm:text-[15px] font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-2 ${
                  active
                    ? 'text-purple-800 dark:text-amber-300'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>
                  {language === 'en' ? cat.labelEn : language === 'ar' ? cat.labelAr : cat.labelBn}
                </span>
                <span className="text-xs font-mono opacity-70 tabular-nums">
                  ({localizeDigits(count, language)})
                </span>
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-700 dark:bg-amber-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Apple-Grade Edge-to-Edge Editorial Media Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {displayedItems.map((item) => {
            const isVideo = item.mediaType === 'video';
            return (
              <article
                key={item.id}
                onClick={() => handleCardClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(item);
                  }
                }}
                className="group cursor-pointer flex flex-col gap-4 focus:outline-none"
              >
                {/* Pure Edge-to-Edge 16:9 Cinema Frame */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 ring-1 ring-slate-900/10 dark:ring-white/10 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.2)] group-hover:shadow-[0_24px_48px_-16px_rgba(46,2,73,0.3)] transition-all duration-300">
                  <img
                    src={item.thumbnailUrl}
                    alt={item.titleBn}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/maharat/maharat-campus.jpg';
                    }}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Subtle Frosted Glass Center Play Control for Videos */}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/35 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-white group-hover:text-slate-950 transition-all duration-300">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}

                  {/* Minimal Bottom-Right Action Cue */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs font-medium text-white/90">
                    <span className="inline-flex items-center gap-1.5 backdrop-blur-md bg-black/45 px-2.5 py-1 rounded-full border border-white/15">
                      {isVideo ? (
                        <Video className="w-3.5 h-3.5 text-amber-300" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-white/80" />
                      )}
                      <span>{isVideo ? tr('ভিডিও', 'Video', 'فيديو') : tr('ফটো', 'Photo', 'صورة')}</span>
                    </span>

                    <span className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1 backdrop-blur-md bg-black/50 px-2.5 py-1 rounded-full border border-white/15">
                      <Maximize2 className="w-3 h-3" />
                      <span>{isVideo ? tr('প্লে করুন', 'Play', 'تشغيل') : tr('দেখুন', 'View', 'عرض')}</span>
                    </span>
                  </div>
                </div>

                {/* Clean Unboxed Editorial Metadata & Typography */}
                <div className="space-y-1.5 px-0.5">
                  <div className="flex items-center gap-2 text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400">
                    <span className="text-purple-700 dark:text-amber-300 font-semibold">
                      {item.badgeTextBn && item.badgeTextBn !== item.category
                        ? localizeDynamicText(item.badgeTextBn, language)
                        : getCategoryLabel(item.category)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{localizeDynamicText(item.dateBn, language)}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-800 dark:group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                    {language === 'en' && item.titleEn
                      ? item.titleEn
                      : localizeDynamicText(item.titleBn, language)}
                  </h3>
                  <p className="text-sm sm:text-[15px] text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                    {localizeDynamicText(item.descriptionBn, language)}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Clean View All CTA in Preview Mode */}
        {previewMode && onNavigateToFullGallery && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onNavigateToFullGallery}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-slate-900 dark:bg-white hover:bg-purple-900 dark:hover:bg-slate-100 text-white dark:text-slate-950 font-semibold text-sm sm:text-base shadow-sm cursor-pointer transition-colors"
            >
              <span>
                {tr(
                  `সকল ${toBengaliDigits(unifiedItems.length)}টি ফটো ও ভিডিও দেখুন`,
                  `Explore All ${unifiedItems.length} Photos & Videos`,
                  `استعرض جميع الصور والفيديو (${unifiedItems.length})`
                )}
              </span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

/* ============================================================================
   MODERN SMART EDUCATIONAL ENVIRONMENT & DOWNLOADABLE EXAM SCHEDULE PORTAL
   ============================================================================ */

interface ExamScheduleAndSmartCampusSectionProps {
  onOpenAdmission?: () => void;
}

export const ExamScheduleAndSmartCampusSection: React.FC<
  ExamScheduleAndSmartCampusSectionProps
> = ({ onOpenAdmission }) => {
  const { state, language, pushToast } = useCMS();
  const [selectedClassGroup, setSelectedClassGroup] = useState<string>('All');
  const [selectedSessionTerm, setSelectedSessionTerm] = useState<string>('2026-annual');

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const filteredExams = filterExamSchedules(
    DEFAULT_EXAM_SCHEDULES,
    selectedClassGroup,
    selectedSessionTerm
  );

  const classGroupTabs = [
    {
      id: 'All',
      label: tr('সকল শ্রেণি ও বিভাগ', 'All Classes & Depts', 'جميع الصفوف والأقسام'),
    },
    {
      id: 'play-2',
      label: tr('প্রি-প্লে – ২য় শ্রেণি', 'Pre-Play – Grade 2', 'التمهيدي – الصف ٢'),
    },
    {
      id: 'class-3-5',
      label: tr('৩য় – ৫ম শ্রেণি', 'Grade 3 – Grade 5', 'الصف ٣ – ٥'),
    },
    {
      id: 'class-6-8',
      label: tr('৬ষ্ঠ – ৮ম শ্রেণি', 'Grade 6 – Grade 8', 'الصف ٦ – ٨'),
    },
    {
      id: 'class-9-dakhil',
      label: tr('৯ম ও দাখিল বিভাগ', 'Grade 9 & Dakhil', 'الصف ٩ والداخل'),
    },
    {
      id: 'hifz-noorani',
      label: tr('তাহফিজুল কুরআন ও নূরানী', 'Tahfizul Quran & Noorani', 'تحفيظ القرآن والنورانية'),
    },
  ];

  const sessionTermTabs = [
    {
      id: '2026-annual',
      label: tr(
        '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
        '2026 — Annual Examination',
        '٢٠٢٦ — الامتحان السنوي'
      ),
    },
    {
      id: '2026-second-term',
      label: tr(
        '২০২৬ — ২য় সাময়িক / বিশেষ মূল্যায়ন',
        '2026 — 2nd Term / Evaluation',
        '٢٠٢٦ — امتحان الفصل الثاني'
      ),
    },
    {
      id: '2027-first-term',
      label: tr(
        '২০২৭ — ১ম সাময়িক পরীক্ষা (নতুন সেশন)',
        '2027 — 1st Term Exam (New Session)',
        '٢٠٢٧ — امتحان الفصل الأول'
      ),
    },
  ];

  const handleDownloadExamRoutinePDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const termTitle =
      sessionTermTabs.find((t) => t.id === selectedSessionTerm)?.label ||
      '2026 Annual Examination';

    // Header Banner
    doc.setFillColor(46, 2, 73);
    doc.rect(0, 0, 210, 38, 'F');
    doc.setTextColor(251, 191, 36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MAHARAT MODEL MADRASAH (EIIN: 140630)', 105, 14, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(
      'House 62/A, Road 14, Sector 13 & Sector 12, Uttara, Dhaka-1230 | Phone: 01886-340308',
      105,
      21,
      { align: 'center' }
    );
    doc.setFontSize(12);
    doc.setTextColor(251, 191, 36);
    doc.text('OFFICIAL EXAMINATION SCHEDULE & ACADEMIC ROUTINE', 105, 30, {
      align: 'center',
    });

    // Meta Bar
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.text(`Exam Session / Term: ${ selectedSessionTerm.toUpperCase() }`, 14, 47);
    doc.text(
      `Class / Department Filter: ${selectedClassGroup === 'All' ? 'All Classes & Departments' : selectedClassGroup.toUpperCase()}`,
      14,
      53
    );
    doc.text(`Total Scheduled Papers: ${filteredExams.length}`, 150, 47);

    // Table Header
    let y = 62;
    doc.setFillColor(76, 5, 117);
    doc.rect(12, y, 186, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.text('Date & Day', 15, y + 6);
    doc.text('Class / Department', 52, y + 6);
    doc.text('Code & Subject (English)', 100, y + 6);
    doc.text('Exam Time', 162, y + 6);
    y += 12;

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    filteredExams.forEach((item, index) => {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }
      if (index % 2 === 0) {
        doc.setFillColor(248, 244, 255);
        doc.rect(12, y - 4, 186, 10, 'F');
      }
      doc.setFontSize(8.5);
      doc.text(`${item.examDateIso} (${item.dayNameEn})`, 15, y + 2);
      doc.text(item.classGroupLabelEn.slice(0, 26), 52, y + 2);
      doc.text(`${item.subjectCode}: ${item.subjectEn.slice(0, 32)}`, 100, y + 2);
      doc.text(item.timeSlotEn, 162, y + 2);
      y += 10;
    });

    // Footer Note
    doc.setDrawColor(147, 51, 234);
    doc.line(12, 276, 198, 276);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Instructions: Students must bring their Official Admit Card and arrive in full Madrasah Uniform 20 minutes before the exam starts.',
      105,
      282,
      { align: 'center' }
    );
    doc.text(
      `Generated from Maharat Model Madrasah Smart Academic Portal • ${termTitle}`,
      105,
      287,
      { align: 'center' }
    );

    doc.save(`Maharat-Exam-Routine-${selectedSessionTerm}-${selectedClassGroup}.pdf`);

    pushToast(
      tr(
        'পরীক্ষার রুটিন ডাউনলোড সম্পন্ন!',
        'Official Exam Routine PDF Downloaded!',
        'تم تحميل جدول الامتحانات بصيغة PDF!'
      ),
      tr(
        'অফিসিয়াল A4 পরীক্ষার সময়সূচি (PDF) আপনার ডিভাইসে ডাউনলোড হয়েছে।',
        `Saved Maharat-Exam-Routine-${selectedSessionTerm}-${selectedClassGroup}.pdf`,
        'تم حفظ ملف جدول الامتحانات الرسمي بنجاح.'
      ),
      'success'
    );
  };

  const smartEnvironmentPillars = [
    {
      icon: <Monitor className="w-5 h-5 text-amber-300" />,
      badge: tr('স্মার্ট অডিও-ভিজ্যুয়াল ক্লাসরুম', 'Smart Projector Classrooms', 'فصول ذكية تفاعلية'),
      title: tr(
        'মাল্টিমিডিয়া প্রজেক্টর ও ১৬:৯ ডিজিটাল লার্নিং ডিসপ্লে',
        '16:9 Widescreen Interactive Digital Classrooms',
        'شاشات تعليمية ذكية وأجهزة عرض تفاعلية'
      ),
      desc: tr(
        'শিশুদের পাঠদানকে আনন্দময় ও দীর্ঘস্থায়ী করতে প্রজেক্টর, অ্যানিমেটেড তাজবীদ মাশক এবং সায়েন্স ভিজ্যুয়ালাইজেশন ব্যবহৃত হয়।',
        'Visual Quranic Tajweed, animated science labs, and interactive lessons on widescreen classroom displays.',
        'تعليم التجويد والعلوم عبر العروض المرئية التفاعلية الحديثة.'
      ),
    },
    {
      icon: <FileText className="w-5 h-5 text-amber-300" />,
      badge: tr('ডিজিটাল গার্ডিয়ান ডায়েরি', 'Digital Guardian Progress Diary', 'المتابعة اليومية الرقمية'),
      title: tr(
        'দৈনিক সবক, উপস্থিতি ও হোমওয়ার্ক ট্র্যাকিং সিস্টেম',
        'Daily Sabaq, Attendance & Exam Analytics',
        'متابعة يومية للحفظ والحضور والواجبات'
      ),
      desc: tr(
        'প্রতিদিনের হিফজ সবক, সাতসবক, আমুখতা ও একাডেমিক ক্লাস পারফরম্যান্স অভিভাবকদের কাছে নিয়মিত রিপোর্ট আকারে পৌঁছে দেওয়া হয়।',
        'Structured daily tracking of Hifz Sabaq, academic homework, and monthly tarbiyah checklists for parents.',
        'تقارير دورية لأولياء الأمور حول مستوى الحفظ والتحصيل الدراسي.'
      ),
    },
    {
      icon: <Globe className="w-5 h-5 text-amber-300" />,
      badge: tr('ত্রিভাষিক স্পোকেন ও ক্বিরাত ল্যাব', 'Trilingual & Qirat Studio', 'مختبر اللغات والقراءات'),
      title: tr(
        'আরবি, ইংরেজি ও বাংলা স্পোকেন এবং আন্তর্জাতিক লাহজা মাশক',
        'Spoken Arabic, English & International Qirat Lab',
        'إتقان المحادثة بالعربية والإنجليزية والتلاوة'
      ),
      desc: tr(
        'পবিত্র কুরআনের বিশুদ্ধ মাখরাজের পাশাপাশি আরবি ও ইংরেজি ভাষায় সাবলীল কথোপকথন ও প্রেজেন্টেশন দক্ষতা গড়ে তোলা হয়।',
        'Dedicated language immersion sessions for fluent Arabic & English conversation alongside Husn-e-Saut Qirat.',
        'تدريب عملي على التحدث باللغتين العربية والإنجليزية بطلاقة.'
      ),
    },
    {
      icon: <Cpu className="w-5 h-5 text-amber-300" />,
      badge: tr('আইটি, রোবটিক্স ও সীরাত ক্লাব', 'IT, Coding & Seerah Club', 'نادي التقنية والسيرة'),
      title: tr(
        'কম্পিউটার ল্যাব, বিজ্ঞান মেলা ও দ্বিমাসিক মাহারাত পত্রিকা',
        'Practical IT Lab, Science Fair & Maharat Magazine',
        'مختبر الحاسوب ومعرض العلوم ومجلة المهارات'
      ),
      desc: tr(
        'পড়াশোনার পাশাপাশি গ্রাফিক ডিজাইন, কোডিং, ক্যালিগ্রাফি ও সীরাত দেয়ালিকা প্রকাশের মাধ্যমে সৃজনশীল প্রতিভার বিকাশ।',
        'Hands-on training in coding, graphic design, Islamic calligraphy, and student research publications.',
        'تنمية المهارات الإبداعية في البرمجة والتصميم والخط العربي.'
      ),
    },
  ];

  return (
    <section
      id="exam-schedule"
      className="py-14 lg:py-20 bg-gradient-to-b from-[#faf6ff] via-white to-[#f5edff] dark:from-[#0f011d] dark:via-[#17022b] dark:to-[#110120] text-slate-900 dark:text-white border-b border-purple-200/70 dark:border-purple-900/50 transition-colors"
    >
      <div className="cii-container-section space-y-12">
        {/* Part 1: 4 Modern Educational Environment Systems */}
        <div className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2.5">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-extrabold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {tr(
                  'আধুনিক ও বিজ্ঞানসম্মত দ্বীনি শিক্ষার পরিবেশ',
                  'Modern Smart Islamic & Academic Environment',
                  'بيئة تعليمية حديثة ومتكاملة'
                )}
              </span>
            </span>
            <h2 className="cii-section-title font-extrabold tracking-tight text-[#2e0249] dark:text-white">
              {tr(
                'আধুনিক শিক্ষা প্রতিষ্ঠানের স্মার্ট লার্নিং ইকোসিস্টেম ও পরীক্ষার রুটিন পোর্টাল',
                'Smart Learning Ecosystem & Downloadable Exam Schedule Portal',
                'منظومة التعليم الذكي وبوابة تحميل جداول الامتحانات'
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200 leading-relaxed">
              {tr(
                'মাহারাত মডেল মাদ্রাসায় (EIIN: 140630) শিক্ষার্থীদের জন্য রয়েছে মাল্টিমিডিয়া স্মার্ট ক্লাসরুম, ডিজিটাল প্রোগ্রেস ট্র্যাকার এবং শ্রেণি ও সেশন অনুযায়ী এক ক্লিকে ডাউনলোডযোগ্য পরীক্ষার সময়সূচি।',
                'Explore our four modern campus pillars and filter or download official class-wise examination schedules in A4 PDF format.',
                'تعرف على أركان البيئة التعليمية الحديثة وحمّل جدول الامتحانات الرسمي حسب الصف والفصل الدراسي.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {smartEnvironmentPillars.map((pillar, idx) => (
              <div
                key={idx}
                className="rounded-3xl bg-white dark:bg-[#1e0338]/95 border border-purple-200/90 dark:border-purple-500/40 p-5 sm:p-6 shadow-md hover:shadow-xl transition-all flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2e0249] to-fuchsia-700 flex items-center justify-center shadow-md">
                      {pillar.icon}
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/90 text-purple-900 dark:text-amber-300 border border-purple-200 dark:border-purple-700">
                      {pillar.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[#2e0249] dark:text-white leading-snug">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-purple-200 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
                <div className="pt-2 border-t border-purple-100 dark:border-purple-800/40 flex items-center justify-between text-[11px] font-mono font-bold text-fuchsia-700 dark:text-amber-300">
                  <span>EIIN: {state.settings.eiinNumber || '140630'}</span>
                  <span>Smart Campus 0{idx + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Part 2: Interactive Filterable & Downloadable Exam Schedule Box */}
        <div className="rounded-3xl bg-white dark:bg-[#1a0330] border-2 border-purple-300/80 dark:border-amber-400/50 shadow-2xl overflow-hidden">
          {/* Top Royal Header Bar with 1-Click PDF Download */}
          <div className="bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#6b21a8] p-6 sm:p-8 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  {tr(
                    'পরীক্ষার সময়সূচি ও রুটিন ডাউনলোড (Exam Routine Portal)',
                    'Downloadable Exam Schedule & Routine Portal',
                    'بوابة جدول الامتحانات والتحميل المباشر'
                  )}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white">
                {tr(
                  'শ্রেণি ও সেশন ভিত্তিক পরীক্ষার রুটিন দেখুন এবং A4 PDF ডাউনলোড করুন',
                  'Filter Exam Schedule by Class & Session and Download Official A4 PDF',
                  'اختر الصف والفصل الدراسي وحمّل جدول الامتحانات الرسمي بصيغة PDF'
                )}
              </h3>
              <p className="text-xs sm:text-sm text-purple-100/90">
                {tr(
                  'নিচের বাটন থেকে আপনার সন্তানের শ্রেণি/বিভাগ এবং পরীক্ষার সেশন নির্বাচন করে রুটিন দেখুন ও প্রিন্টেবল পিডিএফ সংরক্ষণ করুন।',
                  'Select your child’s class group and exam session below to view the schedule and download the printable PDF.',
                  'حدد القسم والفصل الدراسي أدناه لعرض الجدول وتحميل نسخة PDF للطباعة.'
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleDownloadExamRoutinePDF}
                className="px-5 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xl cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Download className="w-4 h-4" />
                <span>
                  {tr(
                    'পরীক্ষার রুটিন ডাউনলোড করুন (A4 PDF)',
                    'Download Exam Schedule (A4 PDF)',
                    'تحميل جدول الامتحانات (PDF)'
                  )}
                </span>
              </button>
              {onOpenAdmission && (
                <button
                  type="button"
                  onClick={onOpenAdmission}
                  className="px-4 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                >
                  {tr('ভর্তি আবেদন →', 'Apply Now →', 'قدم الآن ←')}
                </button>
              )}
            </div>
          </div>

          {/* Filter Controls Bar: Session/Term + Class/Department */}
          <div className="p-5 sm:p-6 bg-purple-50/70 dark:bg-[#22043d] border-b border-purple-200 dark:border-purple-800/60 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Session / Exam Term Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-purple-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {tr(
                      '১. পরীক্ষার সেশন ও টার্ম নির্বাচন করুন:',
                      '1. Select Academic Session & Exam Term:',
                      '١. اختر الفصل الدراسي والامتحان:'
                    )}
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {sessionTermTabs.map((term) => (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => setSelectedSessionTerm(term.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        selectedSessionTerm === term.id
                          ? 'bg-gradient-to-r from-fuchsia-600 to-purple-800 text-white shadow-sm ring-2 ring-amber-400/50'
                          : 'bg-white dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-700 hover:border-fuchsia-400'
                      }`}
                    >
                      {term.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class / Department Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-purple-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  <span>
                    {tr(
                      '২. শ্রেণি বা বিভাগ অনুযায়ী ফিল্টার করুন:',
                      '2. Filter by Class / Department:',
                      '٢. تصفية حسب الصف أو القسم:'
                    )}
                  </span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {classGroupTabs.map((cg) => (
                    <button
                      key={cg.id}
                      type="button"
                      onClick={() => setSelectedClassGroup(cg.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        selectedClassGroup === cg.id
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'bg-white dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-700 hover:border-amber-400'
                      }`}
                    >
                      {cg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Exam Schedule Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead>
                <tr className="bg-purple-100/90 dark:bg-purple-950 text-[#2e0249] dark:text-amber-300 text-xs font-extrabold border-b border-purple-200 dark:border-purple-800">
                  <th className="py-3.5 px-4 sm:px-6">{tr('তারিখ ও বার', 'Exam Date & Day', 'التاريخ واليوم')}</th>
                  <th className="py-3.5 px-4">{tr('শ্রেণি / বিভাগ', 'Class / Department', 'الصف / القسم')}</th>
                  <th className="py-3.5 px-4">{tr('বিষয় ও কোড', 'Subject & Paper Code', 'المادة والرمز')}</th>
                  <th className="py-3.5 px-4">{tr('পরীক্ষার সময়', 'Time Slot', 'وقت الامتحان')}</th>
                  <th className="py-3.5 px-4 sm:px-6">{tr('শিফট ও পরীক্ষার হল', 'Shift & Hall', 'القاعة والفترة')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100 dark:divide-purple-800/50 text-xs sm:text-sm">
                {filteredExams.map((row: ExamScheduleItem) => (
                  <tr
                    key={row.id}
                    className="hover:bg-purple-50/70 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-bold text-[#2e0249] dark:text-white whitespace-nowrap">
                      <div>{language === 'en' ? row.examDateIso : row.examDateBn}</div>
                      <span className="text-[11px] font-semibold text-fuchsia-700 dark:text-amber-300">
                        {language === 'en' ? row.dayNameEn : row.dayNameBn}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/70 text-purple-900 dark:text-purple-100 text-xs font-bold">
                        {language === 'en' ? row.classGroupLabelEn : row.classGroupLabelBn}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-400/25 border border-amber-400/50 text-purple-950 dark:text-amber-300 font-mono text-[11px] font-extrabold">
                          {row.subjectCode}
                        </span>
                        <span>{language === 'en' ? row.subjectEn : row.subjectBn}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                      {language === 'en' ? row.timeSlotEn : row.timeSlotBn}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-xs text-slate-600 dark:text-purple-200">
                      {row.shiftAndHallBn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Routine Footer Summary */}
          <div className="px-6 py-4 bg-purple-50/90 dark:bg-[#150226] border-t border-purple-200 dark:border-purple-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-purple-900 dark:text-purple-200">
              {tr(
                `মোট প্রদর্শিত পরীক্ষার বিষয়: ${toBengaliDigits(filteredExams.length)}টি • পরীক্ষা শুরুর ২০ মিনিট পূর্বে প্রবেশপত্রসহ উপস্থিত হতে হবে।`,
                `Showing ${filteredExams.length} scheduled exam papers • Arrive 20 minutes early with official Admit Card.`,
                `إجمالي المواد المعروضة: ${filteredExams.length} • يرجى الحضور قبل ٢٠ دقيقة من بدء الامتحان.`
              )}
            </span>
            <button
              type="button"
              onClick={handleDownloadExamRoutinePDF}
              className="inline-flex items-center gap-1.5 font-extrabold text-fuchsia-700 dark:text-amber-300 hover:underline cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {tr(
                  'এই রুটিনটি পিডিএফ (PDF) হিসেবে সংরক্ষণ করুন →',
                  'Save Current Filtered Routine as PDF →',
                  'حفظ الجدول الحالي بصيغة PDF ←'
                )}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

