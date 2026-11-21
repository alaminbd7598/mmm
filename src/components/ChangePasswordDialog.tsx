import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, Lock, LogOut, X } from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { MIN_PASSWORD_LENGTH } from '../server/contracts';

interface ChangePasswordDialogProps {
  isOpen: boolean;
  /**
   * Forced mode (initial/reset password): the dialog cannot be dismissed; the only alternative to
   * choosing a new password is signing out.
   */
  forced?: boolean;
  onClose: () => void;
  onChanged: () => void;
  /** Forced mode only: sign out instead of changing the password. */
  onSignOut?: () => void;
}

const inputClass =
  'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-10 font-mono text-sm text-slate-900 dark:text-white outline-none focus:border-[#005a6e] focus:ring-2 focus:ring-[#005a6e]/20';

const toBengaliNumber = (n: number): string => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  isOpen,
  forced = false,
  onClose,
  onChanged,
  onSignOut,
}) => {
  const { language, changePassword, currentUser } = useCMS();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  useEffect(() => {
    if (!isOpen) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setIsSaving(false);
    // Remember what opened the dialog so focus returns there when it closes.
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    firstFieldRef.current?.focus();
    return () => {
      openerRef.current?.focus?.();
      openerRef.current = null;
    };
  }, [isOpen]);

  // Escape closes the (voluntary) dialog; Tab stays inside it while it is open.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !forced) {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!dialogRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, forced, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!currentPassword || !newPassword) {
      setError(
        tr(
          'অনুগ্রহ করে বর্তমান ও নতুন পাসওয়ার্ড প্রদান করুন।',
          'Please enter your current and new password.',
          'يرجى إدخال كلمة المرور الحالية والجديدة.'
        )
      );
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(
        tr(
          `নতুন পাসওয়ার্ড কমপক্ষে ${toBengaliNumber(MIN_PASSWORD_LENGTH)} অক্ষরের হতে হবে।`,
          `The new password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
          `يجب ألا تقل كلمة المرور الجديدة عن ${MIN_PASSWORD_LENGTH} أحرف.`
        )
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(
        tr(
          'নতুন পাসওয়ার্ড ও কনফার্ম পাসওয়ার্ড মিলছে না।',
          'The new password and its confirmation do not match.',
          'كلمة المرور الجديدة وتأكيدها غير متطابقتين.'
        )
      );
      return;
    }
    setIsSaving(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsSaving(false);
    if (!res.success) {
      setError(res.error || '');
      return;
    }
    onChanged();
  };

  const field = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
    autoComplete: string,
    ref?: React.Ref<HTMLInputElement>,
    describedBy?: string
  ) => (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          ref={ref}
          type={showPasswords ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          aria-describedby={describedBy}
          onChange={(e) => {
            setError('');
            onChange(e.target.value);
          }}
          required
          className={inputClass}
        />
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => {
        if (!forced && e.target === e.currentTarget) onClose();
      }}
      data-testid="change-password-overlay"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        data-testid="change-password-dialog"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#0a1738] to-[#005a6e] px-5 py-4 text-white">
          <div className="flex min-w-0 items-center gap-2.5">
            <KeyRound className="h-5 w-5 shrink-0 text-[#f0c95e]" />
            <div className="min-w-0">
              <h2 id="change-password-title" className="truncate text-sm font-bold">
                {forced
                  ? tr('নতুন পাসওয়ার্ড নির্ধারণ করুন', 'Set a New Password', 'تعيين كلمة مرور جديدة')
                  : tr('পাসওয়ার্ড পরিবর্তন করুন', 'Change Password', 'تغيير كلمة المرور')}
              </h2>
              <p className="truncate text-[11px] text-white/75">
                {currentUser ? `@${currentUser.username}` : ''}
              </p>
            </div>
          </div>
          {!forced && (
            <button
              type="button"
              onClick={onClose}
              aria-label={tr('বন্ধ করুন', 'Close', 'إغلاق')}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {forced && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              {tr(
                'নিরাপত্তার জন্য প্রথমবার লগইনের পর প্রাথমিক পাসওয়ার্ডটি পরিবর্তন করা বাধ্যতামূলক। নতুন পাসওয়ার্ড নির্ধারণের পর ড্যাশবোর্ড চালু হবে।',
                'For security, the initial password must be changed after the first sign-in. The dashboard opens once a new password is set.',
                'لأسباب أمنية يجب تغيير كلمة المرور الأولية بعد أول تسجيل دخول. ستفتح لوحة التحكم بعد تعيين كلمة مرور جديدة.'
              )}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300"
            >
              {error}
            </div>
          )}

          <div className="space-y-3">
            {field(
              'change-password-current',
              tr('বর্তমান পাসওয়ার্ড *', 'Current Password *', 'كلمة المرور الحالية *'),
              currentPassword,
              setCurrentPassword,
              'current-password',
              firstFieldRef
            )}
            {field(
              'change-password-new',
              tr('নতুন পাসওয়ার্ড *', 'New Password *', 'كلمة المرور الجديدة *'),
              newPassword,
              setNewPassword,
              'new-password',
              undefined,
              'change-password-hint'
            )}
            {field(
              'change-password-confirm',
              tr('নতুন পাসওয়ার্ড নিশ্চিত করুন *', 'Confirm New Password *', 'تأكيد كلمة المرور الجديدة *'),
              confirmPassword,
              setConfirmPassword,
              'new-password',
              undefined,
              'change-password-hint'
            )}
          </div>

          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span id="change-password-hint">
              {tr(
                `পাসওয়ার্ড কমপক্ষে ${toBengaliNumber(MIN_PASSWORD_LENGTH)} অক্ষরের হতে হবে এবং তাতে বর্ণ ও সংখ্যা দুটোই থাকতে হবে।`,
                `At least ${MIN_PASSWORD_LENGTH} characters, with letters and digits.`,
                `${MIN_PASSWORD_LENGTH} أحرف على الأقل، تتضمن أحرفاً وأرقاماً.`
              )}
            </span>
            <button
              type="button"
              onClick={() => setShowPasswords((v) => !v)}
              aria-label={
                showPasswords
                  ? tr('পাসওয়ার্ড লুকান', 'Hide passwords', 'إخفاء كلمات المرور')
                  : tr('পাসওয়ার্ড দেখুন', 'Show passwords', 'إظهار كلمات المرور')
              }
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {forced ? (
              onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {tr('সাইন আউট', 'Sign Out', 'تسجيل الخروج')}
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              >
                {tr('বাতিল', 'Cancel', 'إلغاء')}
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              data-testid="change-password-submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] px-5 py-2.5 text-xs font-extrabold text-white shadow-lg transition hover:opacity-95 disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#f0c95e]" />
              ) : (
                <KeyRound className="h-4 w-4 text-[#f0c95e]" />
              )}
              {tr('পাসওয়ার্ড সংরক্ষণ করুন', 'Save Password', 'حفظ كلمة المرور')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
