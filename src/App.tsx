import React, { Suspense, lazy, useState } from 'react';
import { AlertTriangle, CheckCircle2, Home, Info, Mail, RefreshCw, X } from 'lucide-react';
import { ThemeProvider } from './store/ThemeContext';
import { CMSProvider, PUBLIC_CACHE_STORAGE_KEY, useCMS } from './store/useCMSStore';
import { PublicWebsite } from './components/PublicWebsite';
import type { AdminRole, CMSState } from './types/cms';
import { DEFAULT_TITLE } from './app/seo';

// The admin panel is loaded on demand, so visitors of the public site never download it.
const AdminLogin = lazy(() => import('./components/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));

const AdminLoading: React.FC = () => (
  <div role="status" aria-label="Loading" className="flex min-h-screen items-center justify-center">
    <RefreshCw className="h-7 w-7 animate-spin text-[#192f64] dark:text-[#f0c95e]" />
  </div>
);

type AppView = 'public' | 'admin-login' | 'admin-dashboard';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode; onResetToHome?: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onResetToHome?: () => void }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected rendering error',
    };
  }

  componentDidCatch(error: Error) {
    console.error('[MMM AppErrorBoundary]', error);
  }

  handleRecover = () => {
    this.setState({ hasError: false, errorMessage: '' });
    if (this.props.onResetToHome) {
      this.props.onResetToHome();
    }
  };

  handleHardReset = () => {
    try {
      localStorage.removeItem(PUBLIC_CACHE_STORAGE_KEY);
      localStorage.removeItem('maharat_model_madrasah_cms_v11');
      localStorage.removeItem('mmm_admission_discount_tokens_v1');
    } catch {
      // ignore storage errors
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
          <div className="max-w-md w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-extrabold text-[#192f64] dark:text-white">
              পেইজটি লোড করতে সাময়িক সমস্যা হয়েছে
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              চিন্তার কিছু নেই — আপনার ডেটা সুরক্ষিত আছে। নিচের বাটনে ক্লিক করে পুনরায় চেষ্টা করুন অথবা হোমপেইজে ফিরে যান।
            </p>
            {this.state.errorMessage && (
              <div className="rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-[11px] font-mono text-slate-600 dark:text-slate-300 break-words">
                {this.state.errorMessage}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleRecover}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#005a6e] px-4 py-2.5 text-xs font-bold text-white hover:opacity-95 cursor-pointer"
              >
                <Home className="h-3.5 w-3.5" />
                হোমপেইজে ফিরুন
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-slate-50 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                পুনরায় লোড করুন
              </button>
              <button
                type="button"
                onClick={this.handleHardReset}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 cursor-pointer"
              >
                ক্যাশ রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainShell: React.FC = () => {
  const { currentUser, mustChangePassword, toasts, dismissToast } = useCMS();
  const hasStaffSession = Boolean(currentUser) && !mustChangePassword;
  const [preferredAdminRole, setPreferredAdminRole] = useState<AdminRole | undefined>(undefined);
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#admin') {
        return 'admin-login';
      }
    }
    return 'public';
  });

  React.useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setCurrentView((prev) => (prev === 'admin-dashboard' ? 'admin-dashboard' : 'admin-login'));
      } else {
        setCurrentView('public');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // If user logs out (or must still change the password) while inside admin-dashboard, return to admin-login
  React.useEffect(() => {
    if (currentView === 'admin-dashboard' && !hasStaffSession) {
      setCurrentView('admin-login');
    }
  }, [currentView, hasStaffSession]);

  // A staff session restored on reload (or completed on the login screen) opens the dashboard.
  React.useEffect(() => {
    if (currentView === 'admin-login' && hasStaffSession) {
      setCurrentView('admin-dashboard');
    }
  }, [currentView, hasStaffSession]);

  // The public pages set their own titles; the admin screens use the site title.
  React.useEffect(() => {
    if (currentView !== 'public') document.title = DEFAULT_TITLE;
  }, [currentView]);

  const handleOpenAdmin = (role?: AdminRole) => {
    if (role) {
      setPreferredAdminRole(role);
    }
    if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
      window.history.pushState(null, '', '/admin');
    }
    if (hasStaffSession) {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('admin-login');
    }
  };

  const handleBackToWebsite = () => {
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      window.history.pushState(null, '', '/');
    }
    setCurrentView('public');
  };

  return (
    <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Global Real-time Notification / Email Dispatch Toast Stack */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto rounded-2xl p-4 shadow-xl border flex items-start justify-between gap-3 transition-all ${
                t.type === 'email'
                  ? 'bg-[#0a1738] border-[#007c91] text-white'
                  : t.type === 'info'
                  ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100'
                  : 'bg-[#004454] border-[#c4962c] text-white'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {t.type === 'email' ? (
                  <Mail className="w-4 h-4 text-[#f0c95e] shrink-0 mt-0.5" />
                ) : t.type === 'info' ? (
                  <Info className="w-4 h-4 text-[#005a6e] dark:text-[#f0c95e] shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#f0c95e] shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="text-xs font-bold">{t.title}</div>
                  <div
                    className={`text-[11px] leading-snug ${
                      t.type === 'info' ? 'text-slate-600 dark:text-slate-300' : 'text-slate-200'
                    }`}
                  >
                    {t.description}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className="p-1 rounded-lg opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <AppErrorBoundary key={currentView} onResetToHome={handleBackToWebsite}>
        {currentView === 'public' && <PublicWebsite onOpenAdmin={handleOpenAdmin} />}

        <Suspense fallback={<AdminLoading />}>
          {currentView === 'admin-login' && (
            <AdminLogin
              initialRole={preferredAdminRole}
              onLoginSuccess={() => setCurrentView('admin-dashboard')}
              onBackToWebsite={handleBackToWebsite}
            />
          )}

          {currentView === 'admin-dashboard' && hasStaffSession && (
            <AdminDashboard onSwitchToWebsite={handleBackToWebsite} />
          )}
        </Suspense>
      </AppErrorBoundary>
    </div>
  );
};

export default function App({ initialPublicState }: { initialPublicState?: Partial<CMSState> | null }) {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <CMSProvider initialPublicState={initialPublicState}>
          <MainShell />
        </CMSProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
