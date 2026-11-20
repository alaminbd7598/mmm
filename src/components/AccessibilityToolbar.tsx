import React from 'react';
import { Languages, Moon, Sun, Type } from 'lucide-react';
import { useTheme } from '../store/ThemeContext';
import { useCMS } from '../store/useCMSStore';
import { FontSizeLevel } from '../utils/translations';
import { getNextLanguage, getShortLanguageCode } from '../utils/admissionToken2027Logic';

interface AccessibilityToolbarProps {
  compact?: boolean;
  className?: string;
  variant?: 'on-dark' | 'auto';
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  className = '',
  variant = 'auto',
}) => {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, fontSize, cycleFontSize, t } = useCMS();

  const isOnDark = variant === 'on-dark';

  const circleBtnClass = isOnDark
    ? 'h-7 w-7 sm:h-8 sm:w-8 p-1 sm:p-1.5 rounded-full bg-[#132654]/90 hover:bg-[#005a6e] text-slate-100 border border-[#c4962c]/30 inline-flex items-center justify-center transition-all cursor-pointer active:scale-95 shrink-0'
    : 'h-7 w-7 sm:h-8 sm:w-8 p-1 sm:p-1.5 rounded-full bg-white hover:bg-[#005a6e]/10 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#192f64] dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 inline-flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0';

  const langPillBtnClass = isOnDark
    ? 'h-7 sm:h-8 px-2 sm:px-2.5 rounded-full bg-[#132654]/90 hover:bg-[#005a6e] text-slate-100 border border-[#c4962c]/35 inline-flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 shrink-0'
    : 'h-7 sm:h-8 px-2 sm:px-2.5 rounded-full bg-white hover:bg-[#005a6e]/10 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#192f64] dark:text-slate-100 border border-slate-200/90 dark:border-slate-700 inline-flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0';

  const fontSizeLabels: Record<FontSizeLevel, string> = {
    normal: 'A',
    large: 'A+',
    larger: 'A++',
  };

  const nextLang = getNextLanguage(language);
  const shortCode = getShortLanguageCode(language);

  return (
    <div
      className={`inline-flex flex-row items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-full ${
        isOnDark
          ? 'bg-[#0a1738]/85 border border-[#007c91]/45'
          : 'bg-slate-100/95 dark:bg-slate-800/90 border border-[#192f64]/15 dark:border-slate-700/80'
      } text-xs shrink-0 ${className}`}
      role="region"
      aria-label="Accessibility & Language Controls"
    >
      {/* 1. One-Click Direct Cycling Language Switcher (bn -> en -> ar -> bn, NO dropdown) */}
      <button
        type="button"
        data-testid="language-cycle-button"
        onClick={() => setLanguage(nextLang)}
        aria-label={`${t.languageSelect}: ${shortCode}`}
        title={`Click to switch language (${shortCode} → ${getShortLanguageCode(nextLang)})`}
        className={langPillBtnClass}
      >
        <Languages className="w-3.5 h-3.5 text-[#9c7a32] dark:text-[#f0c95e] shrink-0" />
        <span className="text-[11px] font-extrabold leading-none tracking-tight">{shortCode}</span>
      </button>

      {/* 2. Circular Text Size Button */}
      <button
        type="button"
        onClick={cycleFontSize}
        aria-label={`${t.fontSize} (${fontSizeLabels[fontSize]})`}
        title={`${t.fontSize}: ${fontSizeLabels[fontSize]}`}
        className={`relative ${circleBtnClass}`}
      >
        <Type className="w-3.5 h-3.5 text-[#005a6e] dark:text-sky-300 shrink-0" />
        {fontSize !== 'normal' && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#c4962c] ring-1 ring-white dark:ring-slate-900" />
        )}
      </button>

      {/* 3. Circular Theme Switcher Button */}
      <button
        type="button"
        onClick={toggleTheme}
        data-testid="button-theme-toggle"
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className={circleBtnClass}
      >
        {theme === 'dark' ? (
          <Sun className="w-3.5 h-3.5 text-[#f0c95e] shrink-0" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-[#192f64] dark:text-sky-300 shrink-0" />
        )}
      </button>
    </div>
  );
};
