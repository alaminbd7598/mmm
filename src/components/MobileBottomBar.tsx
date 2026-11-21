import React from 'react';
import {
  Bell,
  BookOpen,
  Briefcase,
  Calculator,
  GraduationCap,
  Home,
  Newspaper,
  Phone,
  TreePine,
  type LucideIcon,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import type { MobileBottomBarSlot, MobileBottomBarSlotTarget } from '../types/cms';
import type { PublicPageId } from '../utils/i18nContent';

export interface MobileBottomBarProps {
  currentPage: PublicPageId;
  onNavigate: (target: MobileBottomBarSlotTarget) => void;
}

const MAX_SLOTS = 5;

const TARGET_ICONS: Record<MobileBottomBarSlotTarget, LucideIcon> = {
  home: Home,
  courses: BookOpen,
  admission: GraduationCap,
  blog: Newspaper,
  contact: Phone,
  'hifz-tree': TreePine,
  notices: Bell,
  careers: Briefcase,
  fees: Calculator,
};

// Public pages that light up each slot (first entry is the page the parent navigates to).
const TARGET_PAGES: Record<MobileBottomBarSlotTarget, PublicPageId[]> = {
  home: ['home'],
  courses: ['curriculum', 'syllabus', 'education-method'],
  admission: ['admission', 'admission-guide'],
  blog: ['blog'],
  contact: ['contact'],
  'hifz-tree': ['hifz-tree'],
  notices: ['notices'],
  careers: ['career'],
  fees: ['fees'],
};

const GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
};

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ currentPage, onNavigate }) => {
  const { state, language } = useCMS();
  const config = state.mobileBottomBar;

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  // Persisted CMS data can be stale or hand-edited: tolerate a non-array `slots` and unknown targets.
  const slots = (Array.isArray(config?.slots) ? config.slots : [])
    .filter((slot) => slot && Object.prototype.hasOwnProperty.call(TARGET_ICONS, slot.target))
    .slice(0, MAX_SLOTS);

  if (!config?.enabled || slots.length === 0) return null;

  const labelOf = (slot: MobileBottomBarSlot) => {
    const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
    const bn = clean(slot.labelBn);
    const en = clean(slot.labelEn);
    const ar = clean(slot.labelAr);
    return (language === 'bn' ? bn || en : language === 'ar' ? ar || en || bn : en || bn) || slot.target;
  };

  // Only one slot is shown as current even if two slots resolve to the same page.
  const activeIndex = slots.findIndex((slot) => TARGET_PAGES[slot.target].includes(currentPage));

  return (
    <nav
      data-testid="mobile-bottom-bar"
      aria-label={tr('মোবাইল দ্রুত নেভিগেশন', 'Mobile quick navigation', 'التنقل السريع للجوال')}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="no-print fixed inset-x-0 bottom-0 z-30 lg:hidden border-t border-slate-200/90 dark:border-slate-700/80 bg-white/95 dark:bg-[#0a1738]/95 backdrop-blur-md shadow-[0_-6px_24px_-12px_rgba(25,47,100,0.35)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <ul className={`mx-auto grid h-14 max-w-xl list-none m-0 p-0 ${GRID_COLS[slots.length]}`}>
        {slots.map((slot, idx) => {
          const Icon = TARGET_ICONS[slot.target];
          const isActive = idx === activeIndex;
          const label = labelOf(slot);

          return (
            <li key={slot.id || `${slot.target}-${idx}`} className="relative min-w-0">
              <button
                type="button"
                onClick={() => onNavigate(slot.target)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
                title={label}
                data-testid={`mobile-bottom-bar-${slot.target}`}
                className={`group relative flex h-full w-full flex-col items-center justify-end gap-0.5 px-1 pb-1.5 outline-none transition-colors motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c4962c] ${
                  isActive
                    ? 'text-[#005a6e] dark:text-[#f0c95e]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-[#192f64] dark:hover:text-white'
                }`}
              >
                {slot.highlighted ? (
                  <span
                    aria-hidden="true"
                    className={`absolute -top-4 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-br from-[#192f64] to-[#005a6e] text-[#f0c95e] shadow-lg shadow-[#192f64]/30 ring-4 ring-white dark:ring-[#0a1738] transition-transform motion-reduce:transition-none group-active:scale-95 ${
                      isActive ? 'border-2 border-[#c4962c]' : 'border border-[#c4962c]/60'
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2.25} />
                  </span>
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className={`absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full transition-opacity motion-reduce:transition-none ${
                        isActive ? 'bg-[#005a6e] dark:bg-[#f0c95e] opacity-100' : 'opacity-0'
                      }`}
                    />
                    <Icon
                      aria-hidden="true"
                      className="h-5 w-5 shrink-0 transition-transform motion-reduce:transition-none group-active:scale-90"
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                  </>
                )}
                <span
                  className={`block max-w-full truncate text-[10px] leading-tight ${
                    isActive || slot.highlighted ? 'font-extrabold' : 'font-semibold'
                  } ${
                    slot.highlighted && !isActive ? 'text-[#192f64] dark:text-[#f0c95e]' : ''
                  }`}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
