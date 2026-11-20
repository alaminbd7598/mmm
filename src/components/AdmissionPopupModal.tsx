import React, { useEffect, useState } from 'react';
import { ArrowRight, Clock, X } from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { PopupNoticeConfig } from '../types/cms';
import { localizeDigits, localizeDynamicText } from '../utils/i18nContent';

interface AdmissionPopupModalProps {
  config?: PopupNoticeConfig;
  isOpen: boolean;
  onClose: () => void;
  onApplyNow: () => void;
}

export const AdmissionPopupModal: React.FC<AdmissionPopupModalProps> = ({
  config: propConfig,
  isOpen,
  onClose,
  onApplyNow,
}) => {
  const { state, language, t } = useCMS();
  const config = propConfig || state.popupConfig;

  const daysInit = config?.countdownDays ?? 3;
  const hoursInit = config?.countdownHours ?? 13;
  const minutesInit = config?.countdownMinutes ?? 30;
  const secondsInit = config?.countdownSeconds ?? 10;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    daysInit * 86400 + hoursInit * 3600 + minutesInit * 60 + secondsInit
  );

  useEffect(() => {
    setRemainingSeconds(
      daysInit * 86400 + hoursInit * 3600 + minutesInit * 60 + secondsInit
    );
  }, [daysInit, hoursInit, minutesInit, secondsInit]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !config) return null;

  const days = Math.floor(remainingSeconds / 86400);
  const hours = Math.floor((remainingSeconds % 86400) / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const pad2 = (n: number) => localizeDigits(String(n).padStart(2, '0'), language);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admission-promo-popup-title"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[460px] rounded-3xl bg-white dark:bg-[#08132e] bg-gradient-to-b from-white via-[#f5f9fc] to-[#eef6f8] dark:from-[#192f64] dark:via-[#0d2247] dark:to-[#07152e] border border-[#005a6e]/25 dark:border-[#f0c95e]/35 p-7 sm:p-8 text-center text-slate-900 dark:text-white shadow-[0_28px_75px_rgba(10,23,56,0.35)] dark:shadow-[0_28px_75px_rgba(4,10,26,0.85)] transition-colors"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          data-testid="button-close-promo-popup"
          aria-label="Close popup"
          className="absolute top-4 right-4 rtl:right-auto rtl:left-4 w-9 h-9 rounded-full bg-[#192f64]/10 hover:bg-[#192f64]/20 dark:bg-black/35 dark:hover:bg-black/55 border border-[#192f64]/20 dark:border-white/15 flex items-center justify-center text-[#192f64] dark:text-sky-100 hover:text-[#0a1738] dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#005a6e]/10 dark:bg-white/10 border border-[#005a6e]/25 dark:border-[#f0c95e]/35 text-xs font-bold text-[#005a6e] dark:text-[#f0c95e] mb-4">
          <Clock className="w-3.5 h-3.5 text-[#005a6e] dark:text-[#f0c95e]" />
          <span>{localizeDynamicText(config.badgeText, language)}</span>
        </div>

        {/* Main Headline */}
        <h2
          id="admission-promo-popup-title"
          className="text-2xl sm:text-[27px] font-extrabold leading-snug tracking-tight text-[#0a1738] dark:text-white"
        >
          {localizeDynamicText(config.headline, language)}
        </h2>

        {/* Discount Highlight */}
        <div className="text-lg sm:text-xl font-extrabold text-[#9c7a32] dark:text-[#f0c95e] mt-1.5">
          {localizeDynamicText(config.discountText, language)}
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-sky-100/90 mt-2.5 leading-relaxed max-w-sm mx-auto">
          {localizeDynamicText(config.description, language)}
        </p>

        {/* 4 Countdown Boxes */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3 my-6">
          <div className="rounded-2xl bg-white dark:bg-[#071129]/90 border border-[#192f64]/15 dark:border-[#f0c95e]/25 py-3.5 px-2 flex flex-col items-center justify-center shadow-sm dark:shadow-inner">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#192f64] dark:text-[#f0c95e] tracking-tight tabular-nums">
              {pad2(days)}
            </span>
            <span className="text-[11px] text-slate-600 dark:text-sky-200 mt-1 font-semibold">
              {t.days}
            </span>
          </div>
          <div className="rounded-2xl bg-white dark:bg-[#071129]/90 border border-[#192f64]/15 dark:border-[#f0c95e]/25 py-3.5 px-2 flex flex-col items-center justify-center shadow-sm dark:shadow-inner">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#192f64] dark:text-[#f0c95e] tracking-tight tabular-nums">
              {pad2(hours)}
            </span>
            <span className="text-[11px] text-slate-600 dark:text-sky-200 mt-1 font-semibold">
              {t.hours}
            </span>
          </div>
          <div className="rounded-2xl bg-white dark:bg-[#071129]/90 border border-[#192f64]/15 dark:border-[#f0c95e]/25 py-3.5 px-2 flex flex-col items-center justify-center shadow-sm dark:shadow-inner">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#192f64] dark:text-[#f0c95e] tracking-tight tabular-nums">
              {pad2(minutes)}
            </span>
            <span className="text-[11px] text-slate-600 dark:text-sky-200 mt-1 font-semibold">
              {t.minutes}
            </span>
          </div>
          <div className="rounded-2xl bg-white dark:bg-[#071129]/90 border border-[#192f64]/15 dark:border-[#f0c95e]/25 py-3.5 px-2 flex flex-col items-center justify-center shadow-sm dark:shadow-inner">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#192f64] dark:text-[#f0c95e] tracking-tight tabular-nums">
              {pad2(seconds)}
            </span>
            <span className="text-[11px] text-slate-600 dark:text-sky-200 mt-1 font-semibold">
              {t.seconds}
            </span>
          </div>
        </div>

        {/* Full-Width CTA Button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            onApplyNow();
          }}
          className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#192f64] via-[#005a6e] to-[#007c91] hover:from-[#10234d] hover:to-[#006b7d] text-white font-extrabold text-sm sm:text-base shadow-[0_12px_28px_-6px_rgba(0,90,110,0.45)] border border-[#f0c95e]/35 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <span>{localizeDynamicText(config.ctaText, language)}</span>
          <ArrowRight className="w-4 h-4 rtl:rotate-180 text-[#f0c95e]" />
        </button>
      </div>
    </div>
  );
};
