import React from 'react';
import { LayoutDashboard, LogIn } from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { AdminRole } from '../types/cms';

interface HeaderLoginDropdownProps {
  onOpenAdminWithRole: (role?: AdminRole) => void;
  onNavigateCareer?: () => void;
}

/**
 * Compact, single-click header Login button cleanly aligned inside the navbar toolbar
 * with zero overflow on 390px mobile and desktop. Opens the modern split-screen Login Portal.
 */
export const HeaderLoginDropdown: React.FC<HeaderLoginDropdownProps> = ({
  onOpenAdminWithRole,
}) => {
  const { language, currentUser } = useCMS();

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  return (
    <button
      type="button"
      data-testid="header-login-button"
      onClick={() => onOpenAdminWithRole()}
      className="inline-flex h-8 sm:h-9 items-center gap-1 sm:gap-1.5 rounded-full border border-[#c4962c]/50 bg-gradient-to-r from-[#192f64] via-[#005a6e] to-[#192f64] px-2.5 sm:px-4 text-[11px] sm:text-xs font-bold text-white shadow-sm transition-all hover:opacity-95 active:scale-95 shrink-0 whitespace-nowrap cursor-pointer"
    >
      {currentUser ? (
        <LayoutDashboard className="h-3.5 w-3.5 text-[#f0c95e] shrink-0" />
      ) : (
        <LogIn className="h-3.5 w-3.5 text-[#f0c95e] shrink-0" />
      )}
      <span>
        {currentUser
          ? tr('ড্যাশবোর্ড', 'Dashboard', 'لوحة التحكم')
          : tr('লগইন', 'Login', 'دخول')}
      </span>
    </button>
  );
};
