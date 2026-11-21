import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Film,
  Maximize2,
  MessageCircle,
  Minimize2,
  Play,
  Share2,
  Smartphone,
  X,
} from 'lucide-react';
import { AppLanguage } from '../utils/translations';
import { DIRECT_VIDEO_FILE_RE, getYouTubeEmbedUrl, hasValidVideoUrl } from '../utils/cmsLogic';
import { localizeDigits } from '../utils/i18nContent';
import { FramedPhotoModalData } from './HifzTreeAndGallerySection';

export interface CinemaVideoModalItem {
  title: string;
  videoUrl: string;
  subtitle?: string;
  isVertical?: boolean;
  thumbnailUrl?: string;
}

interface AppleCinemaVideoModalProps {
  video: CinemaVideoModalItem | null;
  language: AppLanguage;
  onClose: () => void;
  onOpenAdmission?: () => void;
}

type CinemaAspectMode = 'cinema' | 'theater' | 'portrait';

export const AppleCinemaVideoModal: React.FC<AppleCinemaVideoModalProps> = ({
  video,
  language,
  onClose,
  onOpenAdmission,
}) => {
  const [aspectMode, setAspectMode] = useState<CinemaAspectMode>('cinema');

  useEffect(() => {
    if (!video) return;
    setAspectMode(video.isVertical ? 'portrait' : 'cinema');
  }, [video]);

  useEffect(() => {
    if (!video) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [video, onClose]);

  const copy = {
    bn: {
      cinema: 'সিনেমা ১৬:৯',
      theater: 'থিয়েটার',
      portrait: 'রিল ৯:১৬',
      close: 'বন্ধ করুন',
      comingSoonTitle: 'ভিডিওটি শীঘ্রই যুক্ত হচ্ছে',
      comingSoonSub:
        'মাহারাত মডেল মাদ্রাসার অফিশিয়াল স্টুডিও ও ইউটিউব চ্যানেলে এই ভিডিওটি প্রসেসিং পর্যায়ে রয়েছে। সরাসরি ক্যাম্পাস ভিজিট বা তথ্যের জন্য যোগাযোগ করুন।',
      applyNow: 'ভর্তি আবেদন করুন',
      watchYoutube: 'ইউটিউব চ্যানেল দেখুন',
    },
    en: {
      cinema: 'Cinema 16:9',
      theater: 'Theater',
      portrait: 'Reel 9:16',
      close: 'Close',
      comingSoonTitle: 'Video Coming Soon',
      comingSoonSub:
        'This video is being prepared for the official Maharat Model Madrasah studio archive. Contact our admission office or explore our YouTube channel.',
      applyNow: 'Apply for Admission',
      watchYoutube: 'Visit YouTube Channel',
    },
    ar: {
      cinema: 'سينما ١٦:٩',
      theater: 'مسرح',
      portrait: 'عمودي ٩:١٦',
      close: 'إغلاق',
      comingSoonTitle: 'الفيديو قريباً',
      comingSoonSub:
        'يجري تجهيز هذا الفيديو للأرشيف الرسمي لمدرسة المهارات النموذجية. يمكنك التواصل معنا أو زيارة قناتنا على يوتيوب.',
      applyNow: 'التقديم للقبول',
      watchYoutube: 'زيارة قناة يوتيوب',
    },
  }[language];

  const hasPlayableUrl = video ? hasValidVideoUrl(video.videoUrl) : false;
  const parsedVideo = video && hasPlayableUrl ? getYouTubeEmbedUrl(video.videoUrl) : null;
  const isDirectVideoFile =
    parsedVideo?.platform === 'direct' && DIRECT_VIDEO_FILE_RE.test(parsedVideo.embedUrl);

  const containerMaxWidth =
    aspectMode === 'portrait'
      ? 'max-w-[430px]'
      : aspectMode === 'theater'
        ? 'max-w-4xl'
        : 'max-w-6xl';

  return (
    <AnimatePresence>
      {video && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[105] bg-slate-950/92 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 md:p-8"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={video.title}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className={`w-full ${containerMaxWidth} transition-all duration-300`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Minimal Apple-grade Floating Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 px-1">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                  Maharat Cinema
                </p>
                <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                  {video.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* Clean Segmented Glass Aspect Switcher */}
                <div className="hidden sm:inline-flex items-center p-1 rounded-full bg-white/[0.08] border border-white/12 backdrop-blur-md">
                  <button
                    type="button"
                    onClick={() => setAspectMode('cinema')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      aspectMode === 'cinema'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span>{copy.cinema}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectMode('theater')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      aspectMode === 'theater'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    <Minimize2 className="w-3 h-3" />
                    <span>{copy.theater}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectMode('portrait')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                      aspectMode === 'portrait'
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-white/75 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>{copy.portrait}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label={copy.close}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-colors backdrop-blur-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Precision Specular Glass Video Canvas (No fake monitor bezel / no emoji chrome) */}
            <div className="rounded-[24px] overflow-hidden bg-black ring-1 ring-white/15 shadow-[0_32px_100px_rgba(0,0,0,0.85)]">
              <div
                className={`relative w-full bg-black ${
                  aspectMode === 'portrait' ? 'aspect-[9/16] max-h-[75vh]' : 'aspect-video max-h-[76vh]'
                }`}
              >
                {hasPlayableUrl && parsedVideo?.embedUrl ? (
                  isDirectVideoFile ? (
                    <video
                      src={parsedVideo.embedUrl}
                      controls
                      autoPlay
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <iframe
                      key={`${aspectMode}-${parsedVideo.embedUrl}`}
                      src={parsedVideo.embedUrl}
                      title={video.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center p-8 text-center">
                    {video.thumbnailUrl && (
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-25 blur-sm scale-105"
                      />
                    )}
                    <div className="relative z-10 max-w-md space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center mx-auto">
                        <Film className="w-7 h-7 text-white/90" />
                      </div>
                      <h4 className="text-xl font-bold text-white">{copy.comingSoonTitle}</h4>
                      <p className="text-sm sm:text-[15px] text-white/75 leading-relaxed">
                        {copy.comingSoonSub}
                      </p>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                        {onOpenAdmission && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenAdmission();
                            }}
                            className="px-5 py-2.5 rounded-full bg-white text-slate-950 text-sm font-semibold hover:bg-slate-100 transition-colors"
                          >
                            {copy.applyNow}
                          </button>
                        )}
                        <a
                          href="https://www.youtube.com/@maharatmodelmadrasa"
                          target="_blank"
                          rel="noreferrer"
                          className="px-5 py-2.5 rounded-full bg-white/12 hover:bg-white/20 border border-white/15 text-white text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{copy.watchYoutube}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subtle Editorial Caption Footer */}
            {(video.subtitle || parsedVideo?.platform === 'facebook') && (
              <div className="mt-3.5 px-1 flex flex-wrap items-center justify-between gap-4 text-sm text-white/65">
                <p className="leading-relaxed line-clamp-2">{video.subtitle || video.title}</p>
                <div className="flex items-center gap-3 shrink-0">
                  {parsedVideo?.platform === 'facebook' && (
                    <a
                      href={video.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80 hover:text-white transition-colors"
                    >
                      <span>Facebook HD</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <span className="hidden md:inline-block text-xs text-white/40">
                    ESC {copy.close}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface AppleStudioPhotoLightboxProps {
  modalData: {
    current: FramedPhotoModalData;
    list: FramedPhotoModalData[];
    index: number;
  } | null;
  language: AppLanguage;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onCopiedToast: () => void;
}

export const AppleStudioPhotoLightbox: React.FC<AppleStudioPhotoLightboxProps> = ({
  modalData,
  language,
  onClose,
  onNavigate,
  onCopiedToast,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!modalData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNavigate('next');
      if (e.key === 'ArrowLeft') onNavigate('prev');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalData, onClose, onNavigate]);

  const copy = {
    bn: {
      close: 'বন্ধ করুন',
      prev: 'পূর্ববর্তী ছবি',
      next: 'পরবর্তী ছবি',
      shareLabel: 'শেয়ার করুন',
      facebook: 'ফেসবুক',
      whatsapp: 'হোয়াটসঅ্যাপ',
      copyLink: 'লিংক কপি',
      copied: 'কপি হয়েছে',
      originalPost: 'মূল পোস্ট',
    },
    en: {
      close: 'Close',
      prev: 'Previous photo',
      next: 'Next photo',
      shareLabel: 'Share',
      facebook: 'Facebook',
      whatsapp: 'WhatsApp',
      copyLink: 'Copy Link',
      copied: 'Copied',
      originalPost: 'Original Post',
    },
    ar: {
      close: 'إغلاق',
      prev: 'الصورة السابقة',
      next: 'الصورة التالية',
      shareLabel: 'مشاركة',
      facebook: 'فيسبوك',
      whatsapp: 'واتساب',
      copyLink: 'نسخ الرابط',
      copied: 'تم النسخ',
      originalPost: 'المنشور الأصلي',
    },
  }[language];

  if (!modalData) return null;

  const { current, list, index } = modalData;
  const shareUrl =
    current.shareUrl ||
    current.facebookPostUrl ||
    (typeof window !== 'undefined' ? window.location.href : 'https://maharatmadrasah.com');
  const shareTitle = current.shareText || `${current.title} — Maharat Model Madrasah`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopied(true);
    onCopiedToast();
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-[106] bg-slate-950/94 backdrop-blur-2xl flex flex-col justify-between p-4 sm:p-6 md:p-8"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={current.title}
      >
        {/* Minimalist Floating Header */}
        <div
          className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 text-white/70 text-xs sm:text-sm font-medium">
            {list.length > 1 && (
              <span className="tabular-nums font-semibold text-white">
                {localizeDigits(String(index + 1), language)} / {localizeDigits(String(list.length), language)}
              </span>
            )}
            {current.categoryLabel && (
              <>
                <span className="text-white/30">·</span>
                <span className="text-white/75">{current.categoryLabel}</span>
              </>
            )}
            {current.dateText && (
              <>
                <span className="hidden sm:inline text-white/30">·</span>
                <span className="hidden sm:inline text-white/60">{current.dateText}</span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Edge-to-Edge Studio Image Stage with Translucent Floating Controls */}
        <div
          className="relative flex-1 min-h-0 w-full max-w-6xl mx-auto my-4 flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {list.length > 1 && (
            <button
              type="button"
              onClick={() => onNavigate('prev')}
              aria-label={copy.prev}
              className="absolute left-0 sm:left-2 z-20 w-11 h-11 rounded-full bg-black/55 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <motion.div
            key={current.imageUrl}
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-h-full max-w-full flex items-center justify-center"
          >
            <img
              src={current.imageUrl}
              alt={current.title}
              className="max-h-[64vh] sm:max-h-[68vh] w-auto max-w-full object-contain rounded-2xl ring-1 ring-white/12 shadow-[0_32px_90px_rgba(0,0,0,0.8)]"
            />
          </motion.div>

          {list.length > 1 && (
            <button
              type="button"
              onClick={() => onNavigate('next')}
              aria-label={copy.next}
              className="absolute right-0 sm:right-2 z-20 w-11 h-11 rounded-full bg-black/55 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center backdrop-blur-md transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Sleek Editorial Metadata & Share Dock */}
        <div
          className="w-full max-w-6xl mx-auto shrink-0 rounded-2xl bg-white/[0.06] border border-white/12 backdrop-blur-xl px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="min-w-0 space-y-1">
            <h3 className="text-base sm:text-lg font-semibold text-white leading-snug">
              {current.title}
            </h3>
            {current.description && (
              <p className="text-sm text-white/70 leading-relaxed line-clamp-2 max-w-3xl">
                {current.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/12 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copy.facebook}</span>
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareTitle} — ${shareUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/12 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{copy.whatsapp}</span>
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/12 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? copy.copied : copy.copyLink}</span>
            </button>
            {current.facebookPostUrl && (
              <a
                href={current.facebookPostUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-full bg-white text-slate-950 hover:bg-slate-100 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{copy.originalPost}</span>
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
