import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Building2,
  ExternalLink,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { localizeDynamicText } from '../utils/i18nContent';
import { AdminRole } from '../types/cms';
import { isValidExternalPortalUrl, resolveExternalPortals } from '../utils/portalAndHifzLogic';
import { ChangePasswordDialog } from './ChangePasswordDialog';

interface AdminLoginProps {
  initialRole?: AdminRole;
  onLoginSuccess: () => void;
  onBackToWebsite: () => void;
}

interface RoleChoice {
  role: AdminRole;
  /** Username of the sample account for this role on a demo server (its password comes from the server). */
  demoUser: string;
  icon: React.ElementType;
  shortBn: string;
  shortEn: string;
  shortAr: string;
}

const ROLE_CHOICES: RoleChoice[] = [
  {
    role: 'Super Admin',
    demoUser: 'admin',
    icon: ShieldCheck,
    shortBn: 'সুপার অ্যাডমিন',
    shortEn: 'Super Admin',
    shortAr: 'المشرف العام',
  },
  {
    role: 'Chairman / Managing Director',
    demoUser: 'chairman',
    icon: Award,
    shortBn: 'চেয়ারম্যান',
    shortEn: 'Chairman',
    shortAr: 'الرئيس',
  },
  {
    role: 'Principal / Vice Principal',
    demoUser: 'principal',
    icon: GraduationCap,
    shortBn: 'অধ্যক্ষ',
    shortEn: 'Principal',
    shortAr: 'المدير',
  },
  {
    role: 'Coordinators / Teachers',
    demoUser: 'teacher',
    icon: BookOpen,
    shortBn: 'শিক্ষক',
    shortEn: 'Teacher',
    shortAr: 'المعلم',
  },
  {
    role: 'Content Managers',
    demoUser: 'manager',
    icon: Users,
    shortBn: 'ম্যানেজার',
    shortEn: 'Manager',
    shortAr: 'مدير المحتوى',
  },
];

export const AdminLogin: React.FC<AdminLoginProps> = ({
  initialRole,
  onLoginSuccess,
  onBackToWebsite,
}) => {
  const {
    state,
    login,
    logout,
    loginWithGoogleProfile,
    language,
    storageMode,
    demoAccounts,
    loginSetup,
    currentUser,
    mustChangePassword,
  } = useCMS();
  // Sample sign-ins exist only on a demo server that has its demo admin enabled.
  const isDemoMode = storageMode === 'demo' && demoAccounts.length > 0;
  const demoPasswordOf = (username: string): string =>
    demoAccounts.find((account) => account.username === username)?.password || '';
  const initialChoice =
    ROLE_CHOICES.find((r) => r.role === initialRole) || ROLE_CHOICES[0];

  const [selectedRole, setSelectedRole] = useState<AdminRole>(initialChoice.role);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialRole) {
      const found = ROLE_CHOICES.find((r) => r.role === initialRole);
      if (found) setSelectedRole(found.role);
    }
  }, [initialRole]);

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  // Shown while the server cannot accept any sign-in, so the owner knows which setting to add.
  const setupNotice =
    loginSetup === 'ADMIN_BOOTSTRAP_PASSWORD'
      ? tr(
          'অ্যাডমিন পাসওয়ার্ড এখনো সেট করা হয়নি। হোস্টিং প্যানেলের Environment Variables-এ ADMIN_BOOTSTRAP_PASSWORD (কমপক্ষে ১২ অক্ষর; অক্ষর ও সংখ্যা মিলিয়ে) যোগ করে সাইটটি রিডিপ্লয় বা রিস্টার্ট করুন। এরপর ইউজার আইডি admin ও ওই পাসওয়ার্ড দিয়ে লগইন করে নিজের নতুন পাসওয়ার্ড ঠিক করুন।',
          'No administrator password has been set yet. Add ADMIN_BOOTSTRAP_PASSWORD (at least 12 characters, with letters and digits) to the environment variables in your hosting panel, then redeploy or restart the site. After that, sign in as "admin" with that password and choose your own new password.',
          'لم تُضبط كلمة مرور المسؤول بعد. أضف ADMIN_BOOTSTRAP_PASSWORD (12 حرفاً على الأقل، بأحرف وأرقام) إلى متغيرات البيئة في لوحة الاستضافة، ثم أعد نشر الموقع أو أعد تشغيله. بعد ذلك سجّل الدخول باسم المستخدم admin وبهذه الكلمة ثم اختر كلمة مرور جديدة خاصة بك.'
        )
      : loginSetup === 'JWT_SECRET'
        ? tr(
            'লগইন চালু করতে হোস্টিং প্যানেলের Environment Variables-এ JWT_SECRET (কমপক্ষে ৩২ অক্ষরের এলোমেলো মান) যোগ করে সাইটটি রিডিপ্লয় বা রিস্টার্ট করুন।',
            'To enable sign-in, add JWT_SECRET (a random value of at least 32 characters) to the environment variables in your hosting panel, then redeploy or restart the site.',
            'لتفعيل تسجيل الدخول، أضف JWT_SECRET (قيمة عشوائية من 32 حرفاً على الأقل) إلى متغيرات البيئة في لوحة الاستضافة، ثم أعد نشر الموقع أو أعد تشغيله.'
          )
        : loginSetup === 'DATABASE_URL'
          ? tr(
              'এই সার্ভারে কোনো ডাটাবেস সংযুক্ত নেই, তাই অ্যাডমিন লগইন বন্ধ আছে। হোস্টিং প্যানেলের Environment Variables-এ DATABASE_URL ও JWT_SECRET যোগ করে সাইটটি রিডিপ্লয় করুন। শুধু পরীক্ষামূলক ডেমো দেখাতে চাইলে DEMO_MODE=1 দিন।',
              'No database is connected to this server, so admin sign-in is switched off. Add DATABASE_URL and JWT_SECRET to the environment variables in your hosting panel and redeploy the site. For a trial demo only, set DEMO_MODE=1 instead.',
              'لا توجد قاعدة بيانات متصلة بهذا الخادم، لذلك تسجيل دخول الإدارة متوقف. أضف DATABASE_URL و JWT_SECRET إلى متغيرات البيئة في لوحة الاستضافة ثم أعد نشر الموقع. للعرض التجريبي فقط اضبط DEMO_MODE=1.'
            )
          : '';

  const externalPortals = resolveExternalPortals(state.settings.externalPortals).filter(
    (p) => p.active !== false && isValidExternalPortalUrl(p.url)
  );

  const handleSelectRole = (choice: RoleChoice) => {
    setSelectedRole(choice.role);
    setError('');
  };

  const handleFillDemoCredentials = (choice: RoleChoice) => {
    setSelectedRole(choice.role);
    setUsername(choice.demoUser);
    setPassword(demoPasswordOf(choice.demoUser));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const cleanUser = username.trim();
    const cleanPass = password;
    if (cleanUser.length < 3 || cleanPass.trim().length < 4) {
      setError(
        tr(
          'অনুগ্রহ করে সঠিক ইউজার আইডি ও পাসওয়ার্ড প্রদান করুন।',
          'Please enter a valid User ID and Password.',
          'يرجى إدخال اسم مستخدم وكلمة مرور صالحة.'
        )
      );
      return;
    }
    setIsSubmitting(true);
    const res = await login(cleanUser, cleanPass, selectedRole);
    setIsSubmitting(false);
    if (!res.success) {
      setError(
        res.error ||
          tr(
            'ইউজার আইডি, পাসওয়ার্ড বা রোল সঠিক নয়।',
            'Invalid User ID, Password, or Role selection.',
            'بيانات الدخول غير صحيحة.'
          )
      );
      return;
    }
    setError('');
    setPassword('');
    // With a pending password change the forced dialog below takes over instead.
    if (!res.mustChangePassword) onLoginSuccess();
  };

  // Google identities cannot be verified server-side, so this only reports the alternative.
  const handleGoogleSignIn = () => {
    const res = loginWithGoogleProfile({ email: '', displayName: '' });
    setError(res.error || '');
  };

  const instName =
    language === 'bn'
      ? state.settings.instituteNameBn
      : localizeDynamicText(state.settings.instituteName, language);

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between transition-colors"
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#0a1738]/95 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {state.settings.logoUrl ? (
            <img
              src={state.settings.logoUrl}
              alt={instName}
              className="h-9 sm:h-10 w-auto max-w-[180px] object-contain rounded-lg bg-white px-1.5 py-0.5 border border-slate-200"
            />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#192f64] to-[#005a6e] text-[#f0c95e] flex items-center justify-center font-black text-xs">
              MMM
            </div>
          )}
          <div className="min-w-0 hidden sm:block">
            <div className="text-sm font-extrabold text-[#192f64] dark:text-white truncate">
              {instName}
            </div>
            <div className="text-[11px] font-semibold text-[#005a6e] dark:text-[#f0c95e]">
              EIIN: {state.settings.eiinNumber || '140630'} · MC: 21023
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <AccessibilityToolbar />
          <button
            type="button"
            onClick={onBackToWebsite}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 text-xs font-bold text-[#192f64] dark:text-slate-100 hover:bg-slate-50 transition cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{tr('হোমপেইজ', 'Website', 'الموقع')}</span>
          </button>
        </div>
      </header>

      {/* Main Modern Split-Screen Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl grid grid-cols-1 lg:grid-cols-12">
          {/* Left Side: Role Selector Circles + Credentials + Google Sign-In + External ERP */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 space-y-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#005a6e]/10 dark:bg-[#005a6e]/30 px-3 py-1 text-[11px] font-bold text-[#005a6e] dark:text-[#f0c95e]">
                <ShieldCheck className="h-3.5 w-3.5" />
                {tr('মাহারাত স্মার্ট পোর্টাল লগইন', 'Maharat Unified Smart Login', 'بوابة الدخول الموحدة')}
              </span>
              <h1 className="mt-2.5 text-2xl sm:text-3xl font-extrabold text-[#192f64] dark:text-white tracking-tight">
                {tr('স্বাগতম! আপনার রোল নির্বাচন করুন', 'Welcome Back! Select Your Role', 'مرحباً! اختر دورك')}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {tr(
                  'প্রথমে আপনার পদবির আইকনে ক্লিক করুন, তারপর ইউজার আইডি ও পাসওয়ার্ড দিয়ে লগইন করুন।',
                  'Click your role badge below, then enter your User ID & Password or continue with Google.',
                  'انقر على أيقونة دورك ثم أدخل اسم المستخدم وكلمة المرور.'
                )}
              </p>
            </div>

            {/* Step 1: Circular Role Criteria Icons */}
            <div className="grid grid-cols-5 gap-2">
              {ROLE_CHOICES.map((choice) => {
                const Icon = choice.icon;
                const active = selectedRole === choice.role;
                return (
                  <button
                    key={choice.role}
                    type="button"
                    data-testid={`login-role-${choice.demoUser}`}
                    aria-pressed={active}
                    onClick={() => handleSelectRole(choice)}
                    className="group flex flex-col items-center gap-1.5 text-center cursor-pointer"
                  >
                    <span
                      className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full border-2 transition-all ${
                        active
                          ? 'border-[#c4962c] bg-gradient-to-br from-[#192f64] to-[#005a6e] text-[#f0c95e] shadow-lg scale-105'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-300 group-hover:border-[#005a6e]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span
                      className={`text-[10.5px] font-bold leading-tight ${
                        active
                          ? 'text-[#192f64] dark:text-[#f0c95e]'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {tr(choice.shortBn, choice.shortEn, choice.shortAr)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Step 2: Credentials Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {setupNotice && (
                <div
                  role="status"
                  data-testid="login-setup-notice"
                  className="rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-semibold leading-relaxed text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
                >
                  {setupNotice}
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
                <div>
                  <label
                    htmlFor="login-userid"
                    className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    {tr('ইউজার আইডি *', 'User ID *', 'اسم المستخدم *')}
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-userid"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      autoCapitalize="none"
                      spellCheck={false}
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-3.5 font-mono text-sm text-slate-900 dark:text-white outline-none focus:border-[#005a6e] focus:ring-2 focus:ring-[#005a6e]/20"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-1 block text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    {tr('পাসওয়ার্ড *', 'Password *', 'كلمة المرور *')}
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2.5 pl-10 pr-10 font-mono text-sm text-slate-900 dark:text-white outline-none focus:border-[#005a6e] focus:ring-2 focus:ring-[#005a6e]/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? tr('পাসওয়ার্ড লুকান', 'Hide password', 'إخفاء كلمة المرور')
                          : tr('পাসওয়ার্ড দেখুন', 'Show password', 'إظهار كلمة المرور')
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {tr('লগইন ৮ ঘণ্টা সক্রিয় থাকে', 'Sign-in lasts 8 hours', 'تبقى الجلسة فعّالة 8 ساعات')}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {selectedRole}
                </span>
              </div>

              <button
                type="submit"
                data-testid="login-submit-button"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] py-3 text-sm font-extrabold text-white shadow-lg transition hover:opacity-95 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#f0c95e]" />
                ) : (
                  <Lock className="h-4 w-4 text-[#f0c95e]" />
                )}
                {tr('ড্যাশবোর্ডে লগইন করুন', 'Sign In to Dashboard', 'تسجيل الدخول')}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
              <span className="mx-3 shrink-0 text-[11px] font-bold uppercase text-slate-400">
                {tr('অথবা', 'OR', 'أو')}
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            </div>

            {/* Official Google Material Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              data-testid="google-signin-button"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-4 text-sm font-semibold text-slate-800 dark:text-slate-100 shadow-xs transition hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 cursor-pointer"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>
                {tr('Google অ্যাকাউন্ট দিয়ে সাইন ইন করুন', 'Sign in with Google', 'تسجيل الدخول باستخدام Google')}
              </span>
            </button>

            {/* Step 3: External ERP Portals (Below Internal Login as requested) */}
            {externalPortals.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#005a6e] dark:text-[#f0c95e]">
                    {tr('এক্সটার্নাল ইআরপি পোর্টাল (Student · Guardian · ERP)', 'External School ERP Portals', 'بوابات نظام ERP الخارجية')}
                  </span>
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {externalPortals.map((portal) => (
                    <a
                      key={portal.id}
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs font-bold text-[#192f64] dark:text-slate-100 hover:border-[#005a6e] hover:bg-[#005a6e]/5 transition"
                    >
                      <span className="truncate">
                        {language === 'en' ? portal.labelEn : portal.labelBn}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#005a6e] dark:text-[#f0c95e]" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Maharat Royal Navy-Teal-Gold Branded Executive Showcase */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0a1738] via-[#192f64] to-[#005a6e] p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[#f0c95e]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-[#007c91]/30 blur-3xl" />

            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f0c95e]/35 bg-white/10 px-3 py-1 text-[11px] font-bold text-[#f0c95e]">
                <Sparkles className="h-3.5 w-3.5" />
                MAHARAT MODEL MADRASAH
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                {tr(
                  'স্মার্ট মাদ্রাসা ব্যবস্থাপনা ও ডিজিটাল কন্ট্রোল সেন্টার',
                  'Smart Madrasah Management & Digital Control Hub',
                  'مركز الإدارة الذكية لمدرسة مهارات'
                )}
              </h2>
              <p className="text-xs sm:text-sm text-sky-100/85 leading-relaxed">
                {tr(
                  'ভর্তি সিআরএম, ২০২৭ এডমিশন টোকেন, ভার্চুয়াল লাইভ অফিস, প্রাতিষ্ঠানিক ক্যালেন্ডার, QR সার্টিফিকেট এবং ব্লগ প্রকাশনা—সবকিছু এক প্ল্যাটফর্মে।',
                  'Manage Admissions CRM, 2027 Admission Tokens, Live Virtual Office, Academic Calendar, QR Hifz Certificates, and Multilingual Publishing from one secure hub.',
                  'إدارة القبول، رموز القبول 2027، المكتب الافتراضي، والتقويم الأكاديمي من منصة واحدة آمنة.'
                )}
              </p>
            </div>

            {/* Role Quick-Select Card (demo credentials only when the server runs in Demo Mode) */}
            <div className="relative z-10 mt-8 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#f0c95e]">
                {isDemoMode
                  ? tr('ডেমো মোড · পরীক্ষামূলক লগইন', 'Demo Mode · Sample Sign-In', 'الوضع التجريبي · دخول تجريبي')
                  : tr('রোল-ভিত্তিক কুইক অ্যাক্সেস', 'Role Quick Select', 'اختيار سريع للأدوار')}
              </div>
              {isDemoMode && (
                <p
                  data-testid="login-demo-mode-notice"
                  className="rounded-lg border border-amber-300/40 bg-amber-400/15 px-2.5 py-1.5 text-[10.5px] leading-snug text-amber-100"
                >
                  {tr(
                    'ডাটাবেস সংযুক্ত নয় (DATABASE_URL নেই)। পরিবর্তনগুলো সার্ভার রিস্টার্ট হলে মুছে যাবে। নিচের নমুনা অ্যাকাউন্টে ক্লিক করে লগইন তথ্য পূরণ করুন।',
                    'No database is connected (DATABASE_URL is not set). Changes are lost when the server restarts. Click a sample account below to fill in its credentials.',
                    'لا توجد قاعدة بيانات متصلة (DATABASE_URL غير مضبوط). تُفقد التغييرات عند إعادة تشغيل الخادم. انقر على حساب تجريبي لتعبئة بيانات الدخول.'
                  )}
                </p>
              )}
              <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                {ROLE_CHOICES.map((c) => (
                  <button
                    key={c.role}
                    type="button"
                    onClick={() => (isDemoMode ? handleFillDemoCredentials(c) : handleSelectRole(c))}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition cursor-pointer ${
                      selectedRole === c.role
                        ? 'bg-[#f0c95e] text-[#0a1738] font-extrabold'
                        : 'bg-white/5 text-slate-200 hover:bg-white/15'
                    }`}
                  >
                    <span>{tr(c.shortBn, c.shortEn, c.shortAr)}</span>
                    {isDemoMode && (
                      <span className="font-mono text-[10px]">
                        {c.demoUser} / {demoPasswordOf(c.demoUser)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-6 border-t border-white/15 pt-4 text-[11px] text-sky-100/75">
              EIIN: {state.settings.eiinNumber || '140630'} · MC: 21023 · Sector-12, Uttara, Dhaka
            </div>
          </div>
        </div>
      </main>

      <ChangePasswordDialog
        isOpen={Boolean(currentUser && mustChangePassword)}
        forced
        onClose={() => undefined}
        onChanged={onLoginSuccess}
        onSignOut={() => {
          void logout();
        }}
      />
    </div>
  );
};
