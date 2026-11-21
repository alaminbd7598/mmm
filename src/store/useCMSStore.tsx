import React, { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';
import {
  ActivityVideoItem,
  AdminRole,
  AdminUser,
  AdmissionExtraConfig,
  AdmissionLead,
  AdmissionToken2027,
  AIBotConfig,
  AppReleaseEntry,
  AppVersionManagerConfig,
  BlogAutomationConfig,
  BlogPostItem,
  BrandLogoAsset,
  CampusVideoConfig,
  CareerApplicationItem,
  CareerApplicationStatus,
  CareerJobCircular,
  CMSState,
  ConfigurableRole,
  CourseItem,
  DayCareRoutineConfig,
  DepartmentVideoItem,
  DetailedAdmissionData,
  EducationMethodConfig,
  EmailNotificationLog,
  EventItem,
  FeeCalculatorConfig,
  GuardianComplaintItem,
  GuardianReelItem,
  HafizGraduateItem,
  HifzTreeConfig,
  InstitutionalCalendarEvent,
  LeadCallLog,
  LeadNoteItem,
  LeadPriority,
  LeadStatus,
  LeaveStatus,
  MadrasahContextConfig,
  MobileBottomBarConfig,
  NewsItem,
  NoticeItem,
  PermissionAction,
  PhotoGalleryItem,
  PopupNoticeConfig,
  SiteSettings,
  TeacherLeaveRequest,
  TenYearPlanConfig,
  TransportAndLandmarkConfig,
  UniformGuideConfig,
  VirtualOfficeConfig,
  VirtualOfficeSession,
  VirtualOfficeSessionStatus,
  WhatsAppBotConfig,
} from '../types/cms';
import {
  SemverBumpType,
  createReleaseEntry,
  resolveVersionManagerConfig,
  rollbackToReleaseSnapshot,
  validateImportedReleaseSnapshot,
} from '../utils/versionLogic';
import { INITIAL_CMS_STATE } from '../data/seedData';
import { buildMaharatModelMadrasahPreset } from '../data/madrasahInfographicsData';
import {
  addLogoToSettings,
  applyRolePermissionToggle,
  buildAdminNewInquiryEmail,
  buildStudentStatusUpdateEmail,
  clearAllVideoLinksFromState,
  DEFAULT_RBAC_MATRIX,
  deleteLogoFromSettings,
  enableAllPublicSections,
  findMatchingLeadByPhone,
  normalizeAdminRole,
  parseBulkLeadsCsvText,
  resolveCourseTitle,
} from '../utils/cmsLogic';
import {
  AppLanguage,
  FontSizeLevel,
  TRANSLATIONS,
  TranslationDictionary,
} from '../utils/translations';
import { ThemeMode, ThemeContextValue, useTheme } from './ThemeContext';
import {
  COLLECTION_KEYS,
  MIN_PASSWORD_LENGTH,
  PRIVATE_KEYS,
  SINGLETON_KEYS,
  type DemoAccount,
  type LoginSetupIssue,
  type SafeUser,
  type StateKey,
} from '../server/contracts';
import { canReplaceKey } from '../server/state/permissions';
import { postChangePassword, postLogin, postLogout } from '../lib/api/auth';
import {
  PUBLIC_CACHE_STORAGE_KEY,
  loadInitialClientState,
  provideInitialPublicState,
  useServerSync,
  type ClientStorageMode,
  type LiveSyncStatus,
  type SyncAudience,
} from './sync/useServerSync';

const ROLE_LABELS_BN: Record<string, string> = {
  'Super Admin': 'সুপার অ্যাডমিন',
  'Chairman / Managing Director': 'চেয়ারম্যান / ব্যবস্থাপনা পরিচালক',
  'Principal / Vice Principal': 'অধ্যক্ষ / উপাধ্যক্ষ',
  'Coordinators / Teachers': 'কো-অর্ডিনেটর / শিক্ষক',
  'Content Managers': 'কনটেন্ট ম্যানেজার',
};

const ALL_STATE_KEYS: readonly StateKey[] = [...SINGLETON_KEYS, ...COLLECTION_KEYS];

export type { ThemeMode, ThemeContextValue };
export { useTheme };

export { PUBLIC_CACHE_STORAGE_KEY };
export type { ClientStorageMode, LiveSyncStatus };
const LANG_STORAGE_KEY = 'maharat_model_madrasah_lang';
const FONTSIZE_STORAGE_KEY = 'maharat_model_madrasah_fontsize';

export interface ToastNotification {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'info' | 'email';
}

export interface LoginResult {
  success: boolean;
  error?: string;
  mustChangePassword?: boolean;
}

export interface ChangePasswordResult {
  success: boolean;
  error?: string;
}

/** Result of a public form submission: `error` is a localized message for the visitor. */
export type SubmitOutcome<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

export type InquiryOutcome = SubmitOutcome<{
  /** Id of the stored lead: the reference number shown on receipts. */
  leadId: string;
  emailLog: EmailNotificationLog;
}>;

interface CMSContextType {
  state: CMSState;
  currentUser: AdminUser | null;
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  fontSize: FontSizeLevel;
  setFontSize: (size: FontSizeLevel) => void;
  cycleFontSize: () => void;
  t: TranslationDictionary;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  pushToast: (title: string, description: string, type?: 'success' | 'info' | 'email') => void;
  // Live Deployment Server Sync
  liveSyncStatus: LiveSyncStatus;
  syncLocalToLiveServer: (silent?: boolean) => Promise<boolean>;
  pullFromLiveServer: (silent?: boolean) => Promise<boolean>;
  enableAllWebsiteSections: () => void;
  // Auth & Personal Staff Profile Vault
  login: (username: string, password?: string, expectedRole?: AdminRole) => Promise<LoginResult>;
  /** True while the signed-in staff member must replace an initial/reset password. */
  mustChangePassword: boolean;
  changePassword: (currentPassword: string, newPassword: string) => Promise<ChangePasswordResult>;
  /** Where data is persisted: MySQL ('database'), in-memory demo server ('demo'), or not reachable ('offline'). */
  storageMode: ClientStorageMode;
  /** Sample sign-ins offered by a demo server (empty otherwise). */
  demoAccounts: DemoAccount[];
  /** The server setting still missing before staff can sign in (null when sign-in works). */
  loginSetup: LoginSetupIssue | null;
  loginWithGoogleProfile: (profile: {
    email: string;
    displayName: string;
    photoURL?: string;
    roleHint?: AdminRole;
  }) => { success: boolean; error?: string };
  updateCurrentUserProfile: (
    patch: Partial<
      Pick<
        AdminUser,
        | 'fullName'
        | 'designation'
        | 'phone'
        | 'email'
        | 'bio'
        | 'photoUrl'
        | 'signatureDataUrl'
        | 'signatorySlot'
        | 'googleEmail'
      >
    >
  ) => void;
  logout: () => Promise<void>;
  // Branding & Global Header Logo Vault
  uploadAndStoreLogo: (
    logoInput: {
      name: string;
      url: string;
      variant?: BrandLogoAsset['variant'];
    },
    setAsActiveHeaderLogo?: boolean
  ) => void;
  deleteStoredLogo: (logoId: string) => void;
  // Reset & Backup/Restore
  resetToDefaultData: () => void;
  importFullCMSState: (newState: CMSState, summaryMessage?: string) => void;
  // News CRUD
  addNews: (text: string) => void;
  toggleNews: (id: string) => void;
  deleteNews: (id: string) => void;
  // Notices CRUD
  addNotice: (notice: Omit<NoticeItem, 'id'>) => void;
  updateNotice: (notice: NoticeItem) => void;
  deleteNotice: (id: string) => void;
  // Academic Classes & Curriculum Syllabus CRUD
  addCourse: (course: Omit<CourseItem, 'id'>) => void;
  updateCourse: (course: CourseItem) => void;
  deleteCourse: (id: string) => void;
  // Events CRUD
  addEvent: (event: Omit<EventItem, 'id'>) => void;
  updateEvent: (event: EventItem) => void;
  deleteEvent: (id: string) => void;
  // Leads & Inquiries CRUD + CRM Pipeline & Deduplication
  /**
   * Public forms: sends the inquiry to the server and resolves with its answer; nothing is shown
   * as submitted unless the server stored it. `viaStaffSync` (admin CRM "add lead") instead adds
   * or merges the lead in the signed-in staff member's state, which is then synced as usual.
   */
  submitInquiry: (
    leadInput: Omit<AdmissionLead, 'id' | 'status' | 'submittedAt' | 'courseTitle'>,
    options?: { viaStaffSync?: boolean }
  ) => Promise<InquiryOutcome>;
  /** Visitor-facing, localized reason why a public endpoint refused or never received a submission. */
  publicSubmitError: (failure: { status: number; code: string; error?: string }) => string;
  updateLeadStatus: (leadId: string, newStatus: LeadStatus) => EmailNotificationLog | null;
  updateLeadCourse: (leadId: string, newCourseId: string) => void;
  deleteLead: (id: string) => void;
  addLeadCallLog: (
    leadId: string,
    outcome: LeadCallLog['callOutcome'],
    durationText?: string,
    note?: string
  ) => void;
  addLeadNote: (leadId: string, text: string) => void;
  scheduleLeadFollowUp: (leadId: string, nextCallDate?: string, nextCallTime?: string) => void;
  updateLeadPriority: (leadId: string, priority: LeadPriority) => void;
  bulkImportLeads: (
    rawText: string,
    sourceTag?: string
  ) => { newCount: number; duplicatesCount: number; invalidCount: number };
  updateLeadDetailedAdmission: (leadId: string, detailedData: DetailedAdmissionData) => void;
  updateLeadChecklist: (
    leadId: string,
    checklistPatch: Partial<NonNullable<AdmissionLead['checklist']>>
  ) => void;
  updateLeadCounselor: (leadId: string, counselorName: string) => void;
  // Career & Recruitment Portal CRUD
  addCareerJob: (job: Omit<CareerJobCircular, 'id' | 'createdAt'>) => void;
  updateCareerJob: (job: CareerJobCircular) => void;
  deleteCareerJob: (id: string) => void;
  /** Sends the application to the server; resolves with the stored record (server-assigned id). */
  submitCareerApplication: (
    app: Omit<CareerApplicationItem, 'id' | 'status' | 'submittedAt'>
  ) => Promise<SubmitOutcome<{ application: CareerApplicationItem }>>;
  updateCareerApplicationStatus: (
    appId: string,
    status: CareerApplicationStatus,
    hrNote?: string
  ) => void;
  deleteCareerApplication: (appId: string) => void;
  // Users & Roles CRUD + Granular RBAC Matrix
  addAdminUser: (user: Omit<AdminUser, 'id' | 'createdAt'>) => void;
  updateAdminUserRole: (userId: string, role: AdminUser['role']) => void;
  deleteAdminUser: (id: string) => void;
  updateRolePermission: (
    role: ConfigurableRole,
    resource: string,
    action: PermissionAction,
    value: boolean
  ) => void;
  resetRBACMatrix: () => void;
  // Teacher Leave Management CRUD
  submitLeaveRequest: (
    input: Omit<TeacherLeaveRequest, 'id' | 'status' | 'submittedAt'>
  ) => TeacherLeaveRequest;
  reviewLeaveRequest: (
    id: string,
    status: LeaveStatus,
    reviewerComment: string,
    reviewedBy: string
  ) => void;
  deleteLeaveRequest: (id: string) => void;
  // Settings & Special Controllers
  updateSettings: (settings: SiteSettings) => void;
  updatePopupConfig: (popupConfig: PopupNoticeConfig) => void;
  updateAIBotConfig: (aiBotConfig: AIBotConfig) => void;
  updateWhatsAppConfig: (whatsappConfig: WhatsAppBotConfig) => void;
  updateFeeCalculatorConfig: (feeCalculatorConfig: FeeCalculatorConfig) => void;
  // Video & Media Showcases CRUD
  updateCampusVideo: (campusVideo: CampusVideoConfig) => void;
  updateDepartmentVideo: (item: DepartmentVideoItem) => void;
  addActivityVideo: (item: Omit<ActivityVideoItem, 'id'>) => void;
  updateActivityVideo: (item: ActivityVideoItem) => void;
  deleteActivityVideo: (id: string) => void;
  addGuardianReel: (item: Omit<GuardianReelItem, 'id'>) => void;
  updateGuardianReel: (item: GuardianReelItem) => void;
  deleteGuardianReel: (id: string) => void;
  clearAllVideoLinks: () => void;
  // Hifzul Quran Tree & Categorized Photo Gallery CRUD
  updateHifzTreeConfig: (config: HifzTreeConfig) => void;
  addHafizGraduate: (item: Omit<HafizGraduateItem, 'id'>) => void;
  updateHafizGraduate: (item: HafizGraduateItem) => void;
  deleteHafizGraduate: (id: string) => void;
  addPhotoGalleryItem: (item: Omit<PhotoGalleryItem, 'id'>) => void;
  updatePhotoGalleryItem: (item: PhotoGalleryItem) => void;
  deletePhotoGalleryItem: (id: string) => void;
  // Madrasah Infographics & Target Project Preset CRUD
  updateEducationMethodConfig: (config: EducationMethodConfig) => void;
  updateTenYearPlanConfig: (config: TenYearPlanConfig) => void;
  updateDayCareRoutineConfig: (config: DayCareRoutineConfig) => void;
  updateTransportConfig: (config: TransportAndLandmarkConfig) => void;
  updateAdmissionExtraConfig: (config: AdmissionExtraConfig) => void;
  updateUniformConfig: (config: UniformGuideConfig) => void;
  updateMadrasahContextConfig: (config: MadrasahContextConfig) => void;
  /** Sends the complaint / suggestion to the server and resolves with its answer. */
  submitGuardianComplaint: (
    item: Omit<GuardianComplaintItem, 'id' | 'submittedAt' | 'status'>
  ) => Promise<SubmitOutcome>;
  updateComplaintStatus: (
    id: string,
    status: GuardianComplaintItem['status'],
    adminReply?: string
  ) => void;
  deleteComplaint: (id: string) => void;
  applyTargetInstitutionPreset: (preset: 'maharat' | 'craft') => void;
  // Version & Release Manager + Snapshot Rollback
  updateVersionVisibility: (
    patch: Partial<
      Pick<AppVersionManagerConfig, 'enabled' | 'showInPublicFooter' | 'showInAdminDashboard'>
    >
  ) => void;
  createVersionRelease: (input: {
    bumpType?: SemverBumpType;
    customVersion?: string;
    title: string;
    notes: string;
    added?: string[];
    improved?: string[];
    removed?: string[];
  }) => AppReleaseEntry;
  rollbackToVersion: (releaseId: string) => { success: boolean; error?: string };
  deleteVersionRelease: (releaseId: string) => void;
  importVersionReleaseJson: (rawJson: string) => { success: boolean; entry?: AppReleaseEntry; error?: string };
  // Admission Token 2027 CRUD
  addAdmissionToken: (token: Omit<AdmissionToken2027, 'id' | 'createdAt'>) => AdmissionToken2027;
  updateAdmissionToken: (token: AdmissionToken2027) => void;
  deleteAdmissionToken: (id: string) => void;
  // Blog & Automation API CRUD
  addBlogPost: (post: Omit<BlogPostItem, 'id'>) => BlogPostItem;
  updateBlogPost: (post: BlogPostItem) => void;
  deleteBlogPost: (id: string) => void;
  updateBlogAutomationConfig: (config: BlogAutomationConfig) => void;
  // Institutional Academic Calendar CRUD + Google Sync
  addCalendarEvent: (ev: Omit<InstitutionalCalendarEvent, 'id'>) => InstitutionalCalendarEvent;
  updateCalendarEvent: (ev: InstitutionalCalendarEvent) => void;
  deleteCalendarEvent: (id: string) => void;
  mergeGoogleCalendarEvents: (incoming: InstitutionalCalendarEvent[]) => number;
  // Mobile App-Style Bottom Bar Config
  updateMobileBottomBar: (config: MobileBottomBarConfig) => void;
  // Virtual Office / Hybrid Live Desk Config & Sessions
  updateVirtualOfficeConfig: (config: VirtualOfficeConfig) => void;
  recordLocalVirtualOfficeSession: (session: VirtualOfficeSession) => void;
  updateVirtualOfficeSessionStatus: (
    sessionId: string,
    status: VirtualOfficeSessionStatus
  ) => void;
  deleteVirtualOfficeSession: (sessionId: string) => void;
}

const CMSContext = createContext<CMSContextType | undefined>(undefined);

export const CMSProvider: React.FC<{
  children: React.ReactNode;
  /** Public content rendered into the page by the server, for a first paint with live data. */
  initialPublicState?: Partial<CMSState> | null;
}> = ({ children, initialPublicState }) => {
  const { theme, setTheme, toggleTheme } = useTheme();

  const [state, setState] = useState<CMSState>(() => {
    provideInitialPublicState(initialPublicState);
    return loadInitialClientState();
  });

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const mustChangePasswordRef = useRef(mustChangePassword);
  mustChangePasswordRef.current = mustChangePassword;

  // Multi-Language state ('bn' | 'en' | 'ar') with default 'bn'
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY) as AppLanguage | null;
      if (savedLang === 'bn' || savedLang === 'en' || savedLang === 'ar') {
        return savedLang;
      }
    } catch {
      // Ignore
    }
    return 'bn';
  });

  // Accessible Font Size Scaling ('normal' | 'large' | 'larger')
  const [fontSize, setFontSizeState] = useState<FontSizeLevel>(() => {
    try {
      const savedSize = localStorage.getItem(FONTSIZE_STORAGE_KEY) as FontSizeLevel | null;
      if (savedSize === 'normal' || savedSize === 'large' || savedSize === 'larger') {
        return savedSize;
      }
    } catch {
      // Ignore
    }
    return 'normal';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    try {
      localStorage.setItem(LANG_STORAGE_KEY, language);
    } catch {
      // Ignore
    }
  }, [language]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('font-scale-sm', 'font-scale-normal', 'font-scale-large', 'font-scale-larger');
    root.classList.add(`font-scale-${fontSize}`);
    try {
      localStorage.setItem(FONTSIZE_STORAGE_KEY, fontSize);
    } catch {
      // Ignore
    }
  }, [fontSize]);

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    if (newLang === 'ar') {
      pushToast('اللغة: العربية', 'تم تغيير لغة الموقع إلى العربية بنجاح.', 'info');
    } else if (newLang === 'en') {
      pushToast('Language: English', 'Website language has been switched to English.', 'info');
    } else {
      pushToast('ভাষা: বাংলা', 'ওয়েবসাইটের ভাষা সফলভাবে বাংলা এ পরিবর্তন করা হয়েছে।', 'info');
    }
  };

  const setFontSize = (newSize: FontSizeLevel) => {
    setFontSizeState(newSize);
  };

  const cycleFontSize = () => {
    setFontSizeState((prev) => {
      if (prev === 'normal') return 'large';
      if (prev === 'large') return 'larger';
      return 'normal';
    });
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS.bn;

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const pushToast = (
    title: string,
    description: string,
    type: 'success' | 'info' | 'email' = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [{ id, title, description, type }, ...prev.slice(0, 3)]);
    setTimeout(() => {
      dismissToast(id);
    }, 5500);
  };

  const tr = (bn: string, en: string, ar: string) =>
    language === 'bn' ? bn : language === 'ar' ? ar : en;

  const toClientUser = (user: SafeUser): AdminUser => {
    const { mustChangePassword: _pending, ...profile } = user;
    return { ...profile, role: normalizeAdminRole(profile.role) };
  };

  const handleSession = useCallback((me: SafeUser | null, audience: SyncAudience) => {
    if (me) {
      setCurrentUser(toClientUser(me));
      setMustChangePassword(Boolean(me.mustChangePassword));
      return;
    }
    // A session that must change its password may not read staff state yet; keep it signed in.
    if (audience === 'public' && currentUserRef.current && !mustChangePasswordRef.current) {
      setCurrentUser(null);
    }
  }, []);

  const sync = useServerSync({ state, setState, onSession: handleSession, notify: pushToast, tr });
  const { storageMode, liveSyncStatus, demoAccounts, loginSetup } = sync;

  const loginErrorMessage = (code: string, status: number, roleLabel: string): string => {
    switch (code) {
      case 'INVALID_CREDENTIALS':
        return tr(
          'ইউজার আইডি অথবা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে আবার চেষ্টা করুন।',
          'Invalid User ID or Password. Please verify your credentials.',
          'اسم المستخدم أو كلمة المرور غير صحيحة.'
        );
      case 'ROLE_MISMATCH':
        return tr(
          `এই অ্যাকাউন্টটি "${ROLE_LABELS_BN[roleLabel] || roleLabel}" রোলের নয়। অনুগ্রহ করে সঠিক রোল নির্বাচন করুন।`,
          `This account is not assigned to "${roleLabel}". Please select the matching role to sign in.`,
          `هذا الحساب غير مخصص لدور "${roleLabel}". يرجى اختيار الدور الصحيح.`
        );
      case 'RATE_LIMITED':
        return tr(
          'অনেকবার ভুল চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          'Too many sign-in attempts. Please try again in a few minutes.',
          'محاولات تسجيل دخول كثيرة. يرجى المحاولة بعد بضع دقائق.'
        );
      case 'NOT_CONFIGURED':
        return tr(
          'সার্ভারে লগইন চালু করা হয়নি। হোস্টিং প্যানেলে DATABASE_URL, JWT_SECRET ও ADMIN_BOOTSTRAP_PASSWORD ঠিকভাবে বসিয়ে সার্ভার রিস্টার্ট করুন।',
          'Sign-in is not set up on the server. Set DATABASE_URL, JWT_SECRET and ADMIN_BOOTSTRAP_PASSWORD in the hosting panel and restart the server.',
          'لم يتم إعداد تسجيل الدخول على الخادم. اضبط DATABASE_URL و JWT_SECRET و ADMIN_BOOTSTRAP_PASSWORD ثم أعد تشغيل الخادم.'
        );
      default:
        return status === 0
          ? tr(
              'সার্ভারের সাথে সংযোগ করা যায়নি। ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।',
              'Could not reach the server. Please check your connection and try again.',
              'تعذر الاتصال بالخادم. يرجى التحقق من الاتصال والمحاولة مرة أخرى.'
            )
          : tr(
              'লগইন সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।',
              'Sign-in could not be completed. Please try again.',
              'تعذر إكمال تسجيل الدخول. يرجى المحاولة مرة أخرى.'
            );
    }
  };

  const login = async (username: string, password?: string, expectedRole?: AdminRole): Promise<LoginResult> => {
    const cleanUser = username.trim();
    const cleanPass = password || '';
    if (!cleanUser || !cleanPass.trim()) {
      return {
        success: false,
        error: tr(
          'অনুগ্রহ করে ইউজার আইডি এবং পাসওয়ার্ড উভয়ই প্রদান করুন।',
          'Please enter both User ID and Password.',
          'يرجى إدخال اسم المستخدم وكلمة المرور.'
        ),
      };
    }

    // Persist any pending visitor submission before the state is replaced by staff data.
    await sync.flush();
    const res = await postLogin(cleanUser, cleanPass, expectedRole);
    if (!res.ok || !res.data.user) {
      const code = res.ok ? res.data.code || 'FAILED' : res.code;
      return {
        success: false,
        error: loginErrorMessage(code, res.status, normalizeAdminRole(expectedRole || '')),
      };
    }

    const user = toClientUser(res.data.user);
    const pending = Boolean(res.data.mustChangePassword ?? res.data.user.mustChangePassword);
    setCurrentUser(user);
    setMustChangePassword(pending);
    // Staff data is only served once the initial password has been replaced.
    if (!pending) await sync.refetch();

    pushToast(
      tr(`স্বাগতম, ${user.fullName}`, `Welcome, ${user.fullName}`, `مرحباً، ${user.fullName}`),
      tr(
        `সক্রিয় রোল: ${user.role}`,
        `Authenticated Role: ${user.role}`,
        `تم تسجيل الدخول بدور: ${user.role}`
      ),
      'info'
    );
    return { success: true, mustChangePassword: pending };
  };

  const changePasswordErrorMessage = (code: string, status: number): string => {
    switch (code) {
      case 'INVALID_CREDENTIALS':
        return tr('বর্তমান পাসওয়ার্ডটি সঠিক নয়।', 'The current password is incorrect.', 'كلمة المرور الحالية غير صحيحة.');
      case 'TOO_SHORT':
        return tr(
          `নতুন পাসওয়ার্ড কমপক্ষে ${String(MIN_PASSWORD_LENGTH).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)])} অক্ষরের হতে হবে।`,
          `The new password must be at least ${MIN_PASSWORD_LENGTH} characters long.`,
          `يجب ألا تقل كلمة المرور الجديدة عن ${MIN_PASSWORD_LENGTH} أحرف.`
        );
      case 'TOO_LONG':
        return tr(
          'নতুন পাসওয়ার্ডটি খুব দীর্ঘ; অনুগ্রহ করে আরও ছোট পাসওয়ার্ড দিন।',
          'The new password is too long; please choose a shorter one.',
          'كلمة المرور الجديدة طويلة جداً؛ يرجى اختيار كلمة أقصر.'
        );
      case 'NEEDS_LETTER_AND_DIGIT':
        return tr(
          'নতুন পাসওয়ার্ডে বর্ণ ও সংখ্যা দুটোই থাকতে হবে।',
          'The new password must contain both letters and digits.',
          'يجب أن تحتوي كلمة المرور الجديدة على أحرف وأرقام.'
        );
      case 'SAME_AS_USERNAME':
      case 'CONTAINS_USERNAME':
        return tr(
          'পাসওয়ার্ডের ভেতরে ইউজার আইডি থাকতে পারবে না।',
          'The password must not contain the User ID.',
          'يجب ألا تحتوي كلمة المرور على اسم المستخدم.'
        );
      case 'TOO_COMMON':
        return tr(
          'এই পাসওয়ার্ডটি খুব প্রচলিত বা সহজে অনুমান করা যায়; অনুগ্রহ করে অন্য পাসওয়ার্ড বেছে নিন।',
          'This password is too common or easy to guess; please choose another one.',
          'كلمة المرور هذه شائعة أو سهلة التخمين؛ يرجى اختيار كلمة أخرى.'
        );
      case 'SAME_AS_CURRENT':
        return tr(
          'নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে ভিন্ন হতে হবে।',
          'The new password must differ from the current one.',
          'يجب أن تختلف كلمة المرور الجديدة عن الحالية.'
        );
      case 'RATE_LIMITED':
        return tr(
          'অনেকবার চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
          'Too many attempts. Please try again later.',
          'محاولات كثيرة. يرجى المحاولة لاحقاً.'
        );
      case 'UNAUTHENTICATED':
        return tr(
          'সেশনের মেয়াদ শেষ। অনুগ্রহ করে আবার লগইন করুন।',
          'Your session has expired. Please sign in again.',
          'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.'
        );
      default:
        return status === 0
          ? tr(
              'সার্ভারের সাথে সংযোগ করা যায়নি। আবার চেষ্টা করুন।',
              'Could not reach the server. Please try again.',
              'تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.'
            )
          : tr(
              'পাসওয়ার্ড পরিবর্তন করা যায়নি। আবার চেষ্টা করুন।',
              'The password could not be changed. Please try again.',
              'تعذر تغيير كلمة المرور. يرجى المحاولة مرة أخرى.'
            );
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<ChangePasswordResult> => {
    if (!currentUserRef.current) {
      return { success: false, error: changePasswordErrorMessage('UNAUTHENTICATED', 401) };
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return { success: false, error: changePasswordErrorMessage('TOO_SHORT', 400) };
    }
    const res = await postChangePassword(currentPassword, newPassword);
    if (!res.ok) {
      if (res.code === 'UNAUTHENTICATED') {
        setCurrentUser(null);
        setMustChangePassword(false);
        sync.resetToPublic();
        void sync.refetch();
      }
      return { success: false, error: changePasswordErrorMessage(res.code, res.status) };
    }
    const wasPending = mustChangePasswordRef.current;
    setMustChangePassword(false);
    mustChangePasswordRef.current = false;
    if (wasPending) await sync.refetch();
    pushToast(
      tr('পাসওয়ার্ড পরিবর্তন হয়েছে', 'Password Changed', 'تم تغيير كلمة المرور'),
      tr(
        'আপনার নতুন পাসওয়ার্ড সফলভাবে সংরক্ষিত হয়েছে।',
        'Your new password has been saved securely.',
        'تم حفظ كلمة المرور الجديدة بأمان.'
      )
    );
    return { success: true };
  };

  const loginWithGoogleProfile = (_profile: {
    email: string;
    displayName: string;
    photoURL?: string;
    roleHint?: AdminRole;
  }): { success: boolean; error?: string } => ({
    success: false,
    error: tr(
      'Google সাইন-ইন বর্তমানে উপলব্ধ নয়। অনুগ্রহ করে ইউজার আইডি ও পাসওয়ার্ড ব্যবহার করুন।',
      'Google sign-in is not available; please use your User ID & Password.',
      'تسجيل الدخول عبر Google غير متاح؛ يرجى استخدام اسم المستخدم وكلمة المرور.'
    ),
  });

  const updateCurrentUserProfile = (
    patch: Partial<
      Pick<
        AdminUser,
        | 'fullName'
        | 'designation'
        | 'phone'
        | 'email'
        | 'bio'
        | 'photoUrl'
        | 'signatureDataUrl'
        | 'signatorySlot'
        | 'googleEmail'
      >
    >
  ) => {
    if (!currentUser) return;
    const updatedUser: AdminUser = {
      ...currentUser,
      ...patch,
    };
    setCurrentUser(updatedUser);
    setState((prev) => {
      const isListed = prev.users.some((u) => u.id === currentUser.id);
      const users = prev.users.map((u) => {
        if (u.id === currentUser.id) return { ...u, ...patch };
        // Taking a signatory slot (Super Admin only) removes it from whoever held it.
        if (
          patch.signatorySlot &&
          patch.signatorySlot !== 'none' &&
          patch.signatorySlot !== currentUser.signatorySlot &&
          u.signatorySlot === patch.signatorySlot
        ) {
          return { ...u, signatorySlot: 'none' as const };
        }
        return u;
      });
      // Roles without the users permission may receive a state without their own record.
      return { ...prev, users: isListed ? users : [...users, updatedUser] };
    });
    pushToast(
      tr('প্রোফাইল ও ডিজিটাল স্বাক্ষর সংরক্ষিত হয়েছে', 'Profile & Digital Signature Saved', 'تم حفظ الملف الشخصي والتوقيع الرقمي'),
      updatedUser.fullName
    );
  };

  const logout = async (): Promise<void> => {
    // Save the staff member's pending edits while the session is still valid.
    if (!mustChangePasswordRef.current) await sync.flush();
    await postLogout();
    setCurrentUser(null);
    setMustChangePassword(false);
    mustChangePasswordRef.current = false;
    sync.resetToPublic();
    pushToast(
      tr('লগআউট সম্পন্ন', 'Signed Out', 'تم تسجيل الخروج'),
      tr(
        'আপনি অ্যাডমিন কন্ট্রোল প্যানেল থেকে প্রস্থান করেছেন।',
        'You have exited the Admin Control Panel.',
        'لقد غادرت لوحة تحكم الإدارة.'
      ),
      'info'
    );
    await sync.refetch();
  };

  const uploadAndStoreLogo = (
    logoInput: {
      name: string;
      url: string;
      variant?: BrandLogoAsset['variant'];
    },
    setAsActiveHeaderLogo: boolean = true
  ) => {
    setState((prev) => ({
      ...prev,
      settings: addLogoToSettings(prev.settings, logoInput, setAsActiveHeaderLogo),
    }));
    pushToast(
      tr('লোগো সংরক্ষিত ও আপডেট হয়েছে', 'Brand Logo Stored & Applied', 'تم حفظ وتطبيق الشعار'),
      tr(
        `"${logoInput.name}" ব্র্যান্ডিং ভল্টে সংরক্ষিত হয়েছে${setAsActiveHeaderLogo ? ' এবং ওয়েবসাইটের হেডারে যুক্ত হয়েছে' : ''}।`,
        `"${logoInput.name}" saved in Branding Vault${setAsActiveHeaderLogo ? ' and applied to global website headers' : ''}.`,
        `تم حفظ "${logoInput.name}" في مكتبة الشعارات.`
      )
    );
  };

  const deleteStoredLogo = (logoId: string) => {
    setState((prev) => ({
      ...prev,
      settings: deleteLogoFromSettings(prev.settings, logoId),
    }));
    pushToast(
      tr('লোগো মুছে ফেলা হয়েছে', 'Stored Logo Removed', 'تم حذف الشعار'),
      tr(
        'ব্র্যান্ডিং ভল্ট থেকে কাস্টম লোগোটি সরানো হয়েছে।',
        'Custom logo removed from the Branding Vault.',
        'تمت إزالة الشعار المخصص من المكتبة.'
      ),
      'info'
    );
  };

  /** Keys a factory reset must not overwrite: accounts and personal records stay as they are. */
  const RESET_PRESERVED_KEYS: StateKey[] = ['users', ...PRIVATE_KEYS.filter((k) => k !== 'rbacMatrix')];

  /**
   * Keys the signed-in role may not replace wholesale: everything it cannot fully read, create,
   * update and delete (same rule as the server). A restore or reset by a role with a partial view
   * therefore never wipes data that role does not even receive.
   */
  const fullReplaceExclusions = (): StateKey[] => {
    const role = currentUserRef.current?.role;
    if (!role) return [...ALL_STATE_KEYS];
    const matrix = stateRef.current.rbacMatrix;
    return ALL_STATE_KEYS.filter((key) => !canReplaceKey(role, key, matrix));
  };

  const resetToDefaultData = () => {
    const preserved = [...new Set([...RESET_PRESERVED_KEYS, ...fullReplaceExclusions()])];
    setState((prev) => {
      const next: Record<string, unknown> = { ...INITIAL_CMS_STATE };
      for (const key of preserved) next[key] = prev[key];
      return next as unknown as CMSState;
    });
    sync.requestFullReplace(preserved);
    pushToast(
      tr('ডাটাবেস রিসেট সম্পন্ন', 'Database Reset Complete', 'تمت إعادة ضبط قاعدة البيانات'),
      tr(
        'সকল কোর্স, নোটিশ, পপআপ, এআই বট, ফি ও সেটিংস ডিফল্ট অবস্থায় ফিরিয়ে আনা হয়েছে।',
        'All courses, notices, popup, AI bot, fees, and settings restored to factory seed data.',
        'تمت استعادة جميع الدورات والإعلانات والإعدادات إلى البيانات الافتراضية.'
      ),
      'info'
    );
  };

  // News CRUD
  const addNews = (text: string) => {
    const newItem: NewsItem = {
      id: `news-${Date.now()}`,
      text: text.trim(),
      active: true,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setState((prev) => ({ ...prev, news: [newItem, ...prev.news] }));
    pushToast(
      tr('স্ক্রলিং সংবাদ যুক্ত হয়েছে', 'News Ticker Added', 'تمت إضافة خبر متحرك'),
      tr(
        'লাইভ ওয়েবসাইটে স্ক্রলিং নিউজ আপডেট করা হয়েছে।',
        'Live marquee updated on the public website.',
        'تم تحديث شريط الأخبار في الموقع.'
      )
    );
  };

  const toggleNews = (id: string) => {
    setState((prev) => ({
      ...prev,
      news: prev.news.map((n) => (n.id === id ? { ...n, active: !n.active } : n)),
    }));
  };

  const deleteNews = (id: string) => {
    setState((prev) => ({
      ...prev,
      news: prev.news.filter((n) => n.id !== id),
    }));
    pushToast(
      tr('সংবাদ মুছে ফেলা হয়েছে', 'News Item Removed', 'تم حذف الخبر'),
      tr('স্ক্রলিং নিউজ টিকার আপডেট হয়েছে।', 'Scrolling news ticker updated.', 'تم تحديث شريط الأخبار.')
    );
  };

  // Notices CRUD
  const addNotice = (notice: Omit<NoticeItem, 'id'>) => {
    const newNotice: NoticeItem = {
      ...notice,
      id: `not-${Date.now()}`,
    };
    setState((prev) => ({ ...prev, notices: [newNotice, ...prev.notices] }));
    pushToast(
      tr('নোটিশ প্রকাশিত হয়েছে', 'Notice Published', 'تم نشر الإعلان'),
      tr(
        `"${notice.title}" নোটিশ বোর্ডে প্রকাশিত হয়েছে।`,
        `"${notice.title}" is now live on the Notice Board.`,
        `"${notice.title}" منشور الآن في لوحة الإعلانات.`
      )
    );
  };

  const updateNotice = (notice: NoticeItem) => {
    setState((prev) => ({
      ...prev,
      notices: prev.notices.map((n) => (n.id === notice.id ? notice : n)),
    }));
    pushToast(
      tr('নোটিশ আপডেট হয়েছে', 'Notice Updated', 'تم تحديث الإعلان'),
      tr(
        `"${notice.title}" এর পরিবর্তন সংরক্ষিত হয়েছে।`,
        `Changes to "${notice.title}" saved.`,
        `تم حفظ التغييرات على "${notice.title}".`
      )
    );
  };

  const deleteNotice = (id: string) => {
    setState((prev) => ({
      ...prev,
      notices: prev.notices.filter((n) => n.id !== id),
    }));
    pushToast(
      tr('নোটিশ মুছে ফেলা হয়েছে', 'Notice Deleted', 'تم حذف الإعلان'),
      tr('পাবলিক নোটিশ বোর্ড থেকে সরানো হয়েছে।', 'Notice removed from public board.', 'تمت إزالة الإعلان من اللوحة العامة.')
    );
  };

  // Courses CRUD
  const addCourse = (course: Omit<CourseItem, 'id'>) => {
    const newCourse: CourseItem = {
      ...course,
      id: `course-${Date.now()}`,
    };
    setState((prev) => ({ ...prev, courses: [...prev.courses, newCourse] }));
    pushToast(
      tr('নতুন কোর্স যুক্ত হয়েছে', 'Course Created', 'تم إنشاء الدورة'),
      tr(
        `"${course.title}" কারিকুলামে যুক্ত করা হয়েছে।`,
        `"${course.title}" added to the curriculum.`,
        `تمت إضافة "${course.title}" إلى المنهج الدراسي.`
      )
    );
  };

  const updateCourse = (course: CourseItem) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.map((c) => (c.id === course.id ? course : c)),
    }));
    pushToast(
      tr('কোর্স ও সিলেবাস সংরক্ষিত', 'Course & Syllabus Saved', 'تم حفظ الدورة والمنهج'),
      tr(
        `"${course.title}" আপডেট হয়েছে (${course.modules.length}টি মডিউল)।`,
        `Updated "${course.title}" (${course.modules.length} modules).`,
        `تم تحديث "${course.title}" (${course.modules.length} وحدات).`
      )
    );
  };

  const deleteCourse = (id: string) => {
    setState((prev) => ({
      ...prev,
      courses: prev.courses.filter((c) => c.id !== id),
    }));
    pushToast(
      tr('কোর্স মুছে ফেলা হয়েছে', 'Course Deleted', 'تم حذف الدورة'),
      tr('তালিকা থেকে কোর্সটি সরানো হয়েছে।', 'Course removed from catalog.', 'تمت إزالة الدورة من القائمة.')
    );
  };

  // Events CRUD
  const addEvent = (event: Omit<EventItem, 'id'>) => {
    const newEvent: EventItem = {
      ...event,
      id: `evt-${Date.now()}`,
    };
    setState((prev) => ({ ...prev, events: [newEvent, ...prev.events] }));
    pushToast(
      tr('ইভেন্ট প্রকাশিত হয়েছে', 'Event Published', 'تم نشر الفعالية'),
      tr(
        `"${event.title}" আসন্ন সেমিনারে যুক্ত হয়েছে।`,
        `"${event.title}" added to Upcoming Seminars.`,
        `تمت إضافة "${event.title}" إلى الفعاليات القادمة.`
      )
    );
  };

  const updateEvent = (event: EventItem) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === event.id ? event : e)),
    }));
    pushToast(
      tr('ইভেন্ট আপডেট হয়েছে', 'Event Updated', 'تم تحديث الفعالية'),
      `"${event.title}"`
    );
  };

  const deleteEvent = (id: string) => {
    setState((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id),
    }));
    pushToast(
      tr('ইভেন্ট মুছে ফেলা হয়েছে', 'Event Deleted', 'تم حذف الفعالية'),
      tr('তালিকা থেকে ইভেন্ট সরানো হয়েছে।', 'Event removed from schedule.', 'تمت إزالة الفعالية من الجدول.')
    );
  };

  /** Visitor-facing explanation of why a public form could not be submitted. */
  const publicSubmitError = (failure: { status: number; code: string; error?: string }): string => {
    if (failure.status === 0) {
      return tr(
        'সার্ভারের সাথে সংযোগ করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।',
        'Could not reach the server. Please check your connection and try again.',
        'تعذر الاتصال بالخادم. يرجى التحقق من الاتصال والمحاولة مرة أخرى.'
      );
    }
    const detail = failure.error || '';
    if (failure.code === 'RATE_LIMITED') {
      return tr(
        'অল্প সময়ে অনেকবার চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।',
        'Too many attempts in a short time. Please try again in a little while.',
        'محاولات كثيرة في وقت قصير. يرجى المحاولة بعد قليل.'
      );
    }
    if (failure.code === 'JOB_CLOSED') {
      return tr(
        'এই পদের জন্য এখন আর আবেদন গ্রহণ করা হচ্ছে না।',
        'This position is no longer accepting applications.',
        'لم يعد التقديم متاحاً لهذه الوظيفة.'
      );
    }
    if (failure.code === 'UPLOADS_UNAVAILABLE') {
      return tr(
        'এই মুহূর্তে ফাইল আপলোড গ্রহণ করা যাচ্ছে না। অনুগ্রহ করে ফাইল ছাড়া জমা দিন অথবা অফিসে যোগাযোগ করুন।',
        'File uploads cannot be accepted at the moment. Please submit without the file or contact the office.',
        'لا يمكن استقبال الملفات حالياً. يرجى الإرسال بدون ملف أو التواصل مع المكتب.'
      );
    }
    if (failure.code === 'TOO_LARGE' || /photo|cv file|too large|too big/i.test(detail)) {
      return tr(
        'সংযুক্ত ছবি বা ফাইলের আকার অনেক বড়। অনুগ্রহ করে ছোট আকারের ফাইল দিয়ে আবার চেষ্টা করুন।',
        'The attached photo or file is too large. Please try again with a smaller file.',
        'حجم الصورة أو الملف المرفق كبير جداً. يرجى المحاولة بملف أصغر.'
      );
    }
    if (/phone/i.test(detail)) {
      return tr(
        'মোবাইল নম্বরটি সঠিক নয়। অনুগ্রহ করে সঠিক নম্বর দিয়ে আবার চেষ্টা করুন।',
        'The phone number is not valid. Please correct it and try again.',
        'رقم الهاتف غير صحيح. يرجى تصحيحه والمحاولة مرة أخرى.'
      );
    }
    if (/email/i.test(detail)) {
      return tr(
        'ইমেইল ঠিকানাটি সঠিক নয়। অনুগ্রহ করে সঠিক ইমেইল দিয়ে আবার চেষ্টা করুন।',
        'The email address is not valid. Please correct it and try again.',
        'البريد الإلكتروني غير صحيح. يرجى تصحيحه والمحاولة مرة أخرى.'
      );
    }
    if (failure.code === 'BAD_REQUEST') {
      return tr(
        'কিছু তথ্য সঠিক নয়। অনুগ্রহ করে ফরমের ঘরগুলো যাচাই করে আবার চেষ্টা করুন।',
        'Some details are not valid. Please check the form and try again.',
        'بعض البيانات غير صحيحة. يرجى مراجعة النموذج والمحاولة مرة أخرى.'
      );
    }
    const phone = (stateRef.current.settings.phonePrimary || '').split('(')[0].trim();
    return tr(
      `দুঃখিত, এখন জমা দেওয়া যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন${phone ? ` অথবা ${phone} নম্বরে কল করুন` : ''}।`,
      `Sorry, this could not be submitted right now. Please try again shortly${phone ? ` or call ${phone}` : ''}.`,
      `عذراً، تعذر الإرسال الآن. يرجى المحاولة بعد قليل${phone ? ` أو الاتصال على ${phone}` : ''}.`
    );
  };

  const displayTimestamp = (): string =>
    new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Leads & Email Notifications
  const submitInquiry = async (
    leadInput: Omit<AdmissionLead, 'id' | 'status' | 'submittedAt' | 'courseTitle'>,
    options: { viaStaffSync?: boolean } = {}
  ): Promise<InquiryOutcome> => {
    if (options.viaStaffSync) {
      const { lead, emailLog } = addOrMergeLeadLocally(leadInput);
      return { ok: true, leadId: lead.id, emailLog };
    }
    const courseTitle = resolveCourseTitle(state.courses, leadInput.courseId);
    const adminEmail = buildAdminNewInquiryEmail(
      { name: leadInput.name, phone: leadInput.phone, email: leadInput.email, courseTitle, message: leadInput.message, source: leadInput.source },
      state.settings.email,
      state.settings.instituteName,
      displayTimestamp()
    );
    const res = await sync.submitPublic([
      { key: 'leads', item: { ...leadInput, id: `lead-${Date.now()}` } },
      { key: 'emails', item: { ...adminEmail } },
    ]);
    if (!res.ok) return { ok: false, error: publicSubmitError(res) };
    pushToast(
      tr('নতুন আবেদন ও ইমেইল নোটিফিকেশন নিবন্ধিত', 'New Lead & Email Logged', 'تم تسجيل الطلب وإرسال الإشعار'),
      `"${leadInput.name}" — ${courseTitle}`,
      'email'
    );
    return { ok: true, leadId: res.ids[0] || '', emailLog: { ...adminEmail, id: res.ids[1] || adminEmail.id } };
  };

  /** Staff CRM entry with smart de-duplication and auto-progression (synced through /api/admin/sync). */
  const addOrMergeLeadLocally = (
    leadInput: Omit<AdmissionLead, 'id' | 'status' | 'submittedAt' | 'courseTitle'>
  ): { lead: AdmissionLead; emailLog: EmailNotificationLog } => {
    const nowFormatted = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const courseTitle = resolveCourseTitle(state.courses, leadInput.courseId);

    // Smart Deduplication & Auto-Progression Check
    const incomingPhone = leadInput.phone || leadInput.detailedData?.fatherMobile || '';
    const existingMatch = findMatchingLeadByPhone(state.leads, incomingPhone);

    const isFullAdmission =
      leadInput.source === 'Full Admission Form' || Boolean(leadInput.detailedData);

    let resultingLead: AdmissionLead;
    let isMerged = false;

    if (existingMatch) {
      isMerged = true;
      const mergedNotes = existingMatch.notes || [];
      const updatedNotes = [
        ...mergedNotes,
        {
          id: `note-${Date.now()}`,
          authorName: 'Online Applicant (অভিভাবক)',
          timestamp: nowFormatted,
          text: isFullAdmission
            ? 'অভিভাবক নিজেই অনলাইনে ৬-ধাপের পূর্ণাঙ্গ ভর্তি ফর্ম সাবমিট করেছেন। লিডটি স্বয়ংক্রিয়ভাবে Admitted কলামে স্থানান্তরিত হয়েছে।'
            : 'অভিভাবক পুনরায় অনলাইনে তথ্য হালনাগাদ/রেজিস্ট্রেশন সাবমিট করেছেন।',
        },
      ];

      resultingLead = {
        ...existingMatch,
        name: leadInput.name || existingMatch.name,
        phone: leadInput.phone || existingMatch.phone,
        email: leadInput.email || existingMatch.email,
        courseId: leadInput.courseId || existingMatch.courseId,
        courseTitle: courseTitle || existingMatch.courseTitle,
        message: leadInput.message || existingMatch.message,
        guardianName: leadInput.guardianName || existingMatch.guardianName,
        guardianRelation: leadInput.guardianRelation || existingMatch.guardianRelation,
        preferredDepartment: leadInput.preferredDepartment || existingMatch.preferredDepartment,
        targetClass: leadInput.targetClass || existingMatch.targetClass,
        preferredAccommodation: leadInput.preferredAccommodation || existingMatch.preferredAccommodation,
        campusVisitDate: leadInput.campusVisitDate || existingMatch.campusVisitDate,
        detailedData: leadInput.detailedData || existingMatch.detailedData,
        // Auto-progress stage: If 6-step full admission form is submitted, move to Admitted
        status: isFullAdmission ? 'Admitted' : existingMatch.status,
        priority: isFullAdmission ? 'Hot' : existingMatch.priority || 'Warm',
        admissionChancePercent: isFullAdmission ? 95 : existingMatch.admissionChancePercent || 60,
        notes: updatedNotes,
        lastContactedAt: nowFormatted,
      };

      setState((prev) => ({
        ...prev,
        leads: prev.leads.map((l) => (l.id === existingMatch.id ? resultingLead : l)),
      }));

      pushToast(
        isFullAdmission
          ? tr('ভর্তি ফর্ম আপডেট ও প্রগ্রেস সম্পন্ন!', 'Lead Updated & Progressed to Admitted!', 'تم تحديث الطلب ونقله إلى مرحلة القبول!')
          : tr('বিদ্যমান লিড সফলভাবে আপডেট হয়েছে', 'Existing Lead Updated', 'تم تحديث بيانات الطلب المسجل مسبقاً'),
        `${resultingLead.name} (${resultingLead.phone})`
      );
    } else {
      resultingLead = {
        ...leadInput,
        id: `lead-${Date.now()}`,
        courseTitle,
        status: isFullAdmission ? 'Admitted' : 'New',
        submittedAt: nowFormatted,
        priority: isFullAdmission ? 'Hot' : 'Warm',
        admissionChancePercent: isFullAdmission ? 90 : 40,
        callLogs: [],
        notes: [
          {
            id: `note-${Date.now()}`,
            authorName: 'System',
            timestamp: nowFormatted,
            text: isFullAdmission
              ? 'ওয়েবসাইট থেকে সরাসরি ৬-ধাপের পূর্ণাঙ্গ ভর্তি ফর্ম পূরণ করা হয়েছে।'
              : 'ওয়েবসাইট অনলাইন রেজিস্ট্রেশন ফর্ম থেকে নতুন লিড গৃহীত হয়েছে।',
          },
        ],
      };

      setState((prev) => ({
        ...prev,
        leads: [resultingLead, ...prev.leads],
      }));
    }

    const adminEmailNotification = buildAdminNewInquiryEmail(
      {
        name: resultingLead.name,
        phone: resultingLead.phone,
        email: resultingLead.email,
        courseTitle: resultingLead.courseTitle,
        message: resultingLead.message,
        source: resultingLead.source,
      },
      state.settings.email,
      state.settings.instituteName,
      nowFormatted
    );

    setState((prev) => ({
      ...prev,
      emails: [adminEmailNotification, ...prev.emails],
    }));

    if (!isMerged) {
      pushToast(
        tr(
          'নতুন আবেদন ও ইমেইল নোটিফিকেশন নিবন্ধিত',
          'New Lead & Email Logged',
          'تم تسجيل الطلب وإرسال الإشعار'
        ),
        `"${resultingLead.name}" — ${resultingLead.courseTitle}`,
        'email'
      );
    }

    return { lead: resultingLead, emailLog: adminEmailNotification };
  };

  const updateLeadStatus = (
    leadId: string,
    newStatus: LeadStatus
  ): EmailNotificationLog | null => {
    const targetLead = state.leads.find((l) => l.id === leadId);
    if (!targetLead) return null;

    const nowFormatted = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const studentEmailNotification = buildStudentStatusUpdateEmail(
      {
        name: targetLead.name,
        email: targetLead.email,
        courseTitle: targetLead.courseTitle,
      },
      newStatus,
      state.settings.instituteName,
      state.settings.phonePrimary,
      nowFormatted
    );

    const updatedNotes = [
      ...(targetLead.notes || []),
      {
        id: `note-${Date.now()}`,
        authorName: currentUser?.fullName || 'Admin',
        timestamp: nowFormatted,
        text: `স্ট্যাটাস পরিবর্তন: ${targetLead.status} ➔ ${newStatus}`,
      },
    ];

    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) =>
        l.id === leadId ? { ...l, status: newStatus, notes: updatedNotes } : l
      ),
      emails: [studentEmailNotification, ...prev.emails],
    }));

    pushToast(
      tr(
        `স্ট্যাটাস আপডেট ও ইমেইল পাঠানো হয়েছে (${newStatus})`,
        `Lead Status Updated (${newStatus})`,
        `تم تحديث الحالة وإشعار الطالب (${newStatus})`
      ),
      `${targetLead.name} (${newStatus})`,
      'success'
    );

    return studentEmailNotification;
  };

  const addLeadCallLog = (
    leadId: string,
    outcome: LeadCallLog['callOutcome'],
    durationText?: string,
    note?: string
  ) => {
    const nowFormatted = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const logItem: LeadCallLog = {
      id: `call-${Date.now()}`,
      callerName: currentUser?.fullName || 'Counselor',
      callOutcome: outcome,
      durationText: durationText || 'Connected',
      timestamp: nowFormatted,
      note,
    };

    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => {
        if (l.id !== leadId) return l;
        const existingLogs = l.callLogs || [];
        const existingNotes = l.notes || [];
        const nextNotes = note
          ? [
              ...existingNotes,
              {
                id: `note-${Date.now()}`,
                authorName: currentUser?.fullName || 'Counselor',
                timestamp: nowFormatted,
                text: `[কল নোট - ${outcome}]: ${note}`,
              },
            ]
          : existingNotes;

        return {
          ...l,
          callLogs: [logItem, ...existingLogs],
          notes: nextNotes,
          lastContactedAt: nowFormatted,
          status: l.status === 'New' || l.status === 'Pending' ? 'Contacted' : l.status,
        };
      }),
    }));

    pushToast(
      tr('কল লগ সফলভাবে সেভ হয়েছে', 'Call Log Saved', 'تم حفظ سجل المكالمة'),
      `${outcome} ${durationText ? `(${durationText})` : ''}`
    );
  };

  const addLeadNote = (leadId: string, text: string) => {
    if (!text.trim()) return;
    const nowFormatted = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const noteItem: LeadNoteItem = {
      id: `note-${Date.now()}`,
      authorName: currentUser?.fullName || 'Staff',
      timestamp: nowFormatted,
      text: text.trim(),
    };

    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) =>
        l.id === leadId ? { ...l, notes: [...(l.notes || []), noteItem] } : l
      ),
    }));

    pushToast(
      tr('নোট যুক্ত হয়েছে', 'Note Added', 'تمت إضافة الملاحظة'),
      text.slice(0, 50)
    );
  };

  const scheduleLeadFollowUp = (
    leadId: string,
    nextCallDate?: string,
    nextCallTime?: string
  ) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              nextCallDate,
              nextCallTime,
              status: l.status === 'Contacted' || l.status === 'Interested' ? 'Follow-up' : l.status,
            }
          : l
      ),
    }));

    pushToast(
      tr('ফলো-আপ শিডিউল নির্ধারিত হয়েছে', 'Follow-up Scheduled', 'تم تحديد موعد المتابعة'),
      `${nextCallDate || 'Date set'} ${nextCallTime || ''}`
    );
  };

  const updateLeadPriority = (leadId: string, priority: LeadPriority) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => (l.id === leadId ? { ...l, priority } : l)),
    }));
    pushToast(
      tr('অগ্রাধিকার লেভেল আপডেট হয়েছে', 'Lead Priority Updated', 'تم تحديث درجة الأولوية'),
      `Priority: ${priority}`
    );
  };

  const bulkImportLeads = (rawText: string, sourceTag: string = 'Spreadsheet Import') => {
    const { newLeads, duplicatesCount, invalidCount } = parseBulkLeadsCsvText(
      rawText,
      state.leads,
      'General Academic & Hifz',
      sourceTag
    );

    if (newLeads.length > 0) {
      setState((prev) => ({
        ...prev,
        leads: [...newLeads, ...prev.leads],
      }));
    }

    pushToast(
      tr(
        `${newLeads.length}টি নতুন লিড ইমপোর্ট সম্পন্ন!`,
        `${newLeads.length} Leads Imported Successfully!`,
        `تم استيراد ${newLeads.length} جهة اتصال بنجاح!`
      ),
      tr(
        `${duplicatesCount}টি ডুপ্লিকেট বাদ দেওয়া হয়েছে, ${invalidCount}টি অকার্যকর।`,
        `${duplicatesCount} duplicates skipped, ${invalidCount} invalid rows.`,
        `تم تخطي ${duplicatesCount} جهة مكررة، و${invalidCount} صف غير صالح.`
      )
    );

    return {
      newCount: newLeads.length,
      duplicatesCount,
      invalidCount,
    };
  };

  const updateLeadDetailedAdmission = (leadId: string, detailedData: DetailedAdmissionData) => {
    const nowFormatted = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) => {
        if (l.id !== leadId) return l;
        const notes = l.notes || [];
        return {
          ...l,
          detailedData,
          status: 'Admitted',
          priority: 'Hot',
          admissionChancePercent: 100,
          notes: [
            ...notes,
            {
              id: `note-${Date.now()}`,
              authorName: currentUser?.fullName || 'Admin',
              timestamp: nowFormatted,
              text: 'অফিস থেকে শিক্ষার্থীর ৬-ধাপের পূর্ণাঙ্গ ভর্তি ফর্ম ও তথ্য সফলভাবে সম্পন্ন করা হয়েছে।',
            },
          ],
        };
      }),
    }));

    pushToast(
      tr('পূর্ণাঙ্গ ভর্তি ফর্ম সংরক্ষিত হয়েছে!', 'Full Admission Completed!', 'تم استكمال بيانات القبول بنجاح!'),
      tr('শিক্ষার্থীর তথ্য Admitted ধাপে উন্নীত করা হয়েছে।', 'Student moved to Admitted status.', 'تم نقل الطالب إلى المقبولين.')
    );
  };

  const updateLeadCourse = (leadId: string, newCourseId: string) => {
    const newCourseTitle = resolveCourseTitle(state.courses, newCourseId);
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) =>
        l.id === leadId ? { ...l, courseId: newCourseId, courseTitle: newCourseTitle } : l
      ),
    }));
    pushToast(
      tr('নির্বাচিত কোর্স আপডেট হয়েছে', 'Associated Course Updated', 'تم تحديث الدورة المرتبطة'),
      `"${newCourseTitle}"`,
      'info'
    );
  };

  const deleteLead = (id: string) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.filter((l) => l.id !== id),
    }));
    pushToast(
      tr('আবেদন রেকর্ড মুছে ফেলা হয়েছে', 'Lead Deleted', 'تم حذف سجل الطلب'),
      tr('শিক্ষার্থীর আবেদন রেকর্ড সরানো হয়েছে।', 'Student inquiry record removed.', 'تمت إزالة سجل استفسار الطالب.')
    );
  };

  const updateLeadChecklist = (
    leadId: string,
    checklistPatch: Partial<NonNullable<AdmissionLead['checklist']>>
  ) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) =>
        l.id === leadId
          ? {
              ...l,
              checklist: {
                ...(l.checklist || {}),
                ...checklistPatch,
              },
            }
          : l
      ),
    }));
  };

  const updateLeadCounselor = (leadId: string, counselorName: string) => {
    setState((prev) => ({
      ...prev,
      leads: prev.leads.map((l) =>
        l.id === leadId
          ? { ...l, assignedCounselor: counselorName, assignedStaff: counselorName }
          : l
      ),
    }));
    pushToast(
      tr('কাউন্সেলর নির্ধারিত হয়েছে', 'Counselor Assigned', 'تم تعيين المستشار'),
      counselorName
    );
  };

  // Career & Recruitment Portal CRUD
  const addCareerJob = (job: Omit<CareerJobCircular, 'id' | 'createdAt'>) => {
    const newJob: CareerJobCircular = {
      ...job,
      id: `job-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setState((prev) => ({
      ...prev,
      careerJobs: [newJob, ...(prev.careerJobs || [])],
    }));
    pushToast(
      tr('নতুন নিয়োগ বিজ্ঞপ্তি প্রকাশিত হয়েছে', 'Job Circular Published', 'تم نشر إعلان الوظيفة'),
      job.titleBn
    );
  };

  const updateCareerJob = (job: CareerJobCircular) => {
    setState((prev) => ({
      ...prev,
      careerJobs: (prev.careerJobs || []).map((j) => (j.id === job.id ? job : j)),
    }));
    pushToast(
      tr('নিয়োগ বিজ্ঞপ্তি আপডেট হয়েছে', 'Job Circular Updated', 'تم تحديث إعلان الوظيفة'),
      job.titleBn
    );
  };

  const deleteCareerJob = (id: string) => {
    setState((prev) => ({
      ...prev,
      careerJobs: (prev.careerJobs || []).filter((j) => j.id !== id),
    }));
    pushToast(
      tr('নিয়োগ বিজ্ঞপ্তি মুছে ফেলা হয়েছে', 'Job Circular Removed', 'تم حذف الإعلان'),
      tr('ক্যারিয়ার পোর্টাল হালনাগাদ করা হয়েছে।', 'Career portal updated.', 'تم تحديث بوابة الوظائف.')
    );
  };

  const submitCareerApplication = async (
    app: Omit<CareerApplicationItem, 'id' | 'status' | 'submittedAt'>
  ): Promise<SubmitOutcome<{ application: CareerApplicationItem }>> => {
    const res = await sync.submitPublic([{ key: 'careerApplications', item: { ...app, id: `capp-${Date.now()}` } }]);
    if (!res.ok) return { ok: false, error: publicSubmitError(res) };
    pushToast(
      tr('চাকরির আবেদন সফলভাবে জমা হয়েছে!', 'Application Submitted!', 'تم إرسال طلب التوظيف بنجاح!'),
      `${app.applicantName} — ${app.jobTitleBn}`
    );
    return {
      ok: true,
      application: { ...app, id: res.ids[0] || '', status: 'Received', submittedAt: displayTimestamp() },
    };
  };

  const updateCareerApplicationStatus = (
    appId: string,
    status: CareerApplicationStatus,
    hrNote?: string
  ) => {
    setState((prev) => ({
      ...prev,
      careerApplications: (prev.careerApplications || []).map((a) =>
        a.id === appId
          ? { ...a, status, hrNote: hrNote !== undefined ? hrNote : a.hrNote }
          : a
      ),
    }));
    pushToast(
      tr('আবেদনের স্ট্যাটাস আপডেট হয়েছে', 'Application Status Updated', 'تم تحديث حالة الطلب'),
      status
    );
  };

  const deleteCareerApplication = (appId: string) => {
    setState((prev) => ({
      ...prev,
      careerApplications: (prev.careerApplications || []).filter((a) => a.id !== appId),
    }));
    pushToast(
      tr('আবেদন রেকর্ড মুছে ফেলা হয়েছে', 'Application Deleted', 'تم حذف الطلب'),
      tr('এইচআর তালিকা থেকে সরানো হয়েছে।', 'Removed from HR list.', 'تمت الإزالة من القائمة.')
    );
  };

  // Users & Roles CRUD
  // The form's plaintext password reaches the server only inside the sync op (hashed there) and
  // is stripped from memory once that op is confirmed (see useServerSync / stripConfirmedSecrets).
  const addAdminUser = (user: Omit<AdminUser, 'id' | 'createdAt'>) => {
    const newUser: AdminUser = {
      ...user,
      id: `usr-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setState((prev) => ({ ...prev, users: [...prev.users, newUser] }));
    pushToast(
      tr('নতুন স্টাফ অ্যাকাউন্ট তৈরি হয়েছে', 'Staff Account Created', 'تم إنشاء حساب موظف'),
      `${user.fullName} (${user.role})`
    );
  };

  const updateAdminUserRole = (userId: string, role: AdminUser['role']) => {
    setState((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === userId ? { ...u, role } : u)),
    }));
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, role } : null));
    }
    pushToast(
      tr('রোল পারমিশন আপডেট হয়েছে', 'Role Permission Updated', 'تم تحديث صلاحيات الدور'),
      `${role}`
    );
  };

  const deleteAdminUser = (id: string) => {
    if (state.users.length <= 1) {
      pushToast(
        tr('অ্যাকশন ব্লকড', 'Action Blocked', 'تم حظر الإجراء'),
        tr(
          'সর্বশেষ অ্যাডমিন অ্যাকাউন্ট মুছে ফেলা যাবে না।',
          'Cannot delete the last remaining admin account.',
          'لا يمكن حذف حساب المشرف الأخير المتبقي.'
        ),
        'info'
      );
      return;
    }
    setState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== id),
    }));
    pushToast(
      tr('ইউজার অ্যাকাউন্ট মুছে ফেলা হয়েছে', 'User Removed', 'تمت إزالة المستخدم'),
      tr('অ্যাডমিন ইউজার অ্যাক্সেস বাতিল করা হয়েছে।', 'Admin user account revoked.', 'تم إلغاء حساب المستخدم.')
    );
  };

  const updateRolePermission = (
    role: ConfigurableRole,
    resource: string,
    action: PermissionAction,
    value: boolean
  ) => {
    setState((prev) => ({
      ...prev,
      rbacMatrix: applyRolePermissionToggle(prev.rbacMatrix, role, resource, action, value),
    }));
  };

  const resetRBACMatrix = () => {
    setState((prev) => ({
      ...prev,
      rbacMatrix: DEFAULT_RBAC_MATRIX,
    }));
    pushToast(
      tr('RBAC পারমিশন ম্যাট্রিক্স রিসেট হয়েছে', 'RBAC Matrix Restored', 'تمت استعادة مصفوفة الصلاحيات'),
      tr(
        'Principal, Content Manager ও Teacher রোলের ডিফল্ট পারমিশন ফিরিয়ে আনা হয়েছে।',
        'Default role permissions for Principal, Content Manager, and Teacher have been restored.',
        'تمت استعادة الصلاحيات الافتراضية للمدير ومدير المحتوى والمعلم.'
      ),
      'info'
    );
  };

  // Teacher Leave Management CRUD
  const submitLeaveRequest = (
    input: Omit<TeacherLeaveRequest, 'id' | 'status' | 'submittedAt'>
  ): TeacherLeaveRequest => {
    const nowFormatted = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const newLeave: TeacherLeaveRequest = {
      ...input,
      id: `LV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      status: 'Pending',
      submittedAt: nowFormatted,
    };
    setState((prev) => ({
      ...prev,
      leaveRequests: [newLeave, ...(prev.leaveRequests || [])],
    }));
    pushToast(
      tr('ছুটির আবেদন জমা হয়েছে', 'Leave Request Submitted', 'تم إرسال طلب الإجازة'),
      tr(
        `${newLeave.teacherName}-এর আবেদন অধ্যক্ষ/চেয়ারম্যানের অনুমোদনের জন্য পাঠানো হয়েছে।`,
        `Application ${newLeave.id} sent to Principal/Chairman for review.`,
        `تم إرسال طلب ${newLeave.teacherName} لمراجعة المدير/الرئيس.`
      )
    );
    return newLeave;
  };

  const reviewLeaveRequest = (
    id: string,
    status: LeaveStatus,
    reviewerComment: string,
    reviewedBy: string
  ) => {
    const nowFormatted = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const targetLeave = (state.leaveRequests || []).find((lv) => lv.id === id);
    let leaveEmailLog: EmailNotificationLog | null = null;

    if (targetLeave) {
      const recipientEmail = `${targetLeave.teacherUsername || 'teacher'}@maharatmadrasah.com`;
      const subject = `[${state.settings.instituteName}] Leave Request ${targetLeave.id} ${status.toUpperCase()} by Principal/Chairman`;
      const body = `Dear ${targetLeave.teacherName},\n\nYour application for "${targetLeave.leaveType}" from ${targetLeave.startDate} to ${targetLeave.endDate} (${targetLeave.totalDays} day(s)) has been ${status.toUpperCase()} by ${reviewedBy}.\n\nReviewer Comment: ${reviewerComment.trim() || 'No additional remarks'}\n\nAssigned Substitute Teacher: ${targetLeave.substituteTeacher}\n\n${
        status === 'Approved'
          ? 'You can now log in to the Teacher Leave Management dashboard to preview and download your official formatted A4 PDF approval certificate.'
          : 'Please contact the Principal or Academic Office if you require further discussion or assistance.'
      }\n\nWarm regards,\nOffice of the Principal & Chairman\n${state.settings.instituteName}`;

      leaveEmailLog = {
        id: `email-leave-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        recipientEmail,
        recipientName: targetLeave.teacherName,
        recipientType: 'Admin',
        subject,
        body,
        sentAt: nowFormatted,
        triggerEvent: `Leave Status Changed to ${status} (${targetLeave.id})`,
        status: 'Dispatched (Simulated)',
      };
    }

    setState((prev) => ({
      ...prev,
      leaveRequests: (prev.leaveRequests || []).map((lv) =>
        lv.id === id
          ? {
              ...lv,
              status,
              reviewerComment: reviewerComment.trim() || lv.reviewerComment,
              reviewedBy,
              reviewedAt: nowFormatted,
            }
          : lv
      ),
      emails: leaveEmailLog ? [leaveEmailLog, ...prev.emails] : prev.emails,
    }));

    pushToast(
      tr(
        `ছুটির আবেদন: ${status === 'Approved' ? 'অনুমোদিত' : status === 'Rejected' ? 'বাতিল' : 'বিবেচনাধীন'}`,
        `Leave Request ${status}`,
        `تحديث حالة الإجازة: ${status}`
      ),
      tr(
        `আবেদন নং ${id} সফলভাবে আপডেট করা হয়েছে।`,
        `Leave request ${id} has been marked as ${status}.`,
        `تم تحديث الطلب رقم ${id} بنجاح.`
      )
    );

    if (leaveEmailLog) {
      pushToast(
        tr(
          `শিক্ষককে স্বয়ংক্রিয় ইমেইল নোটিফিকেশন পাঠানো হয়েছে (${status})`,
          `Automated Email Dispatched to Teacher (${status})`,
          `تم إرسال إشعار بريد إلكتروني تلقائي للمعلم (${status})`
        ),
        `${leaveEmailLog.recipientEmail} — "${leaveEmailLog.subject}"`,
        'email'
      );
    }
  };

  const deleteLeaveRequest = (id: string) => {
    setState((prev) => ({
      ...prev,
      leaveRequests: (prev.leaveRequests || []).filter((lv) => lv.id !== id),
    }));
    pushToast(
      tr('ছুটির রেকর্ড মুছে ফেলা হয়েছে', 'Leave Record Deleted', 'تم حذف سجل الإجازة'),
      `ID: ${id}`,
      'info'
    );
  };

  const updateSettings = (settings: SiteSettings) => {
    setState((prev) => ({ ...prev, settings }));
    pushToast(
      tr('সাইট সেটিংস সংরক্ষিত', 'Site Settings Saved', 'تم حفظ إعدادات الموقع'),
      tr(
        'ওয়েবসাইটের ব্র্যান্ডিং ও যোগাযোগের তথ্য আপডেট হয়েছে।',
        'Live website branding and contact details updated.',
        'تم تحديث بيانات العلامة التجارية والتواصل في الموقع.'
      )
    );
  };

  const updatePopupConfig = (popupConfig: PopupNoticeConfig) => {
    setState((prev) => ({ ...prev, popupConfig }));
    pushToast(
      tr('ভর্তি পপআপ আপডেট হয়েছে', 'Admission Popup Updated', 'تم تحديث النافذة المنبثقة للقبول'),
      tr(
        'লাইভ প্রমোশনাল পপআপ নোটিশ ও কাউন্টডাউন টাইমার আপডেট হয়েছে।',
        'Live promotional popup notice & countdown timer updated.',
        'تم تحديث إعلان القبول المنبثق والعداد التنازلي.'
      )
    );
  };

  const updateAIBotConfig = (aiBotConfig: AIBotConfig) => {
    setState((prev) => ({ ...prev, aiBotConfig }));
    pushToast(
      tr('এআই সহকারী সেটিংস সংরক্ষিত', 'AI Assistant Config Saved', 'تم حفظ إعدادات المساعد الذكي'),
      `${aiBotConfig.botName}`
    );
  };

  const updateWhatsAppConfig = (whatsappConfig: WhatsAppBotConfig) => {
    setState((prev) => ({ ...prev, whatsappConfig }));
    pushToast(
      tr('হোয়াটসঅ্যাপ বট সংরক্ষিত', 'WhatsApp Bot Saved', 'تم حفظ إعدادات واتساب'),
      tr(
        'হোয়াটসঅ্যাপ বট ও কুইক টপিকসমূহ সফলভাবে আপডেট করা হয়েছে।',
        'WhatsApp bot & quick inquiry topics updated.',
        'تم تحديث بوت واتساب والمواضيع السريعة بنجاح.'
      )
    );
  };

  const updateFeeCalculatorConfig = (feeCalculatorConfig: FeeCalculatorConfig) => {
    setState((prev) => ({ ...prev, feeCalculatorConfig }));
    pushToast(
      tr('ফি ক্যালকুলেটর আপডেট হয়েছে', 'Fee Calculator Updated', 'تم تحديث حاسبة الرسوم'),
      tr(
        'ইন্টারেক্টিভ ভর্তি ফি ও ডিসকাউন্ট ক্যালকুলেটর আপডেট হয়েছে।',
        'Live interactive admission fee & discount calculator updated.',
        'تم تحديث حاسبة رسوم القبول والخصومات التفاعلية.'
      )
    );
  };

  const updateCampusVideo = (campusVideo: CampusVideoConfig) => {
    setState((prev) => ({ ...prev, campusVideo }));
    pushToast(
      tr('ক্যাম্পাস ভিডিও আপডেট হয়েছে', 'Campus Video Updated', 'تم تحديث فيديو الحرم التعليمي'),
      tr(
        'আওয়ার ক্যাম্পাস ভিডিও সফলভাবে আপডেট করা হয়েছে।',
        'Our Campus video tour has been updated.',
        'تم تحديث الفيديو التعريفي للحرم التعليمي بنجاح.'
      )
    );
  };

  const updateDepartmentVideo = (item: DepartmentVideoItem) => {
    setState((prev) => ({
      ...prev,
      departmentVideos: prev.departmentVideos.map((d) => (d.id === item.id ? item : d)),
    }));
    pushToast(
      tr('বিভাগীয় ভিডিও আপডেট হয়েছে', 'Department Video Updated', 'تم تحديث فيديو القسم'),
      `"${item.titleEn || item.titleBn}"`
    );
  };

  const addActivityVideo = (item: Omit<ActivityVideoItem, 'id'>) => {
    const newItem: ActivityVideoItem = {
      ...item,
      id: `act-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      activityVideos: [newItem, ...prev.activityVideos],
    }));
    pushToast(
      tr('অ্যাক্টিভিটি ভিডিও যুক্ত হয়েছে', 'Activity Video Added', 'تمت إضافة فيديو نشاط'),
      `"${item.titleEn || item.titleBn}"`
    );
  };

  const updateActivityVideo = (item: ActivityVideoItem) => {
    setState((prev) => ({
      ...prev,
      activityVideos: prev.activityVideos.map((v) => (v.id === item.id ? item : v)),
    }));
    pushToast(
      tr('অ্যাক্টিভিটি ভিডিও সংরক্ষিত', 'Activity Video Saved', 'تم حفظ فيديو النشاط'),
      `"${item.titleEn || item.titleBn}"`
    );
  };

  const deleteActivityVideo = (id: string) => {
    setState((prev) => ({
      ...prev,
      activityVideos: prev.activityVideos.filter((v) => v.id !== id),
    }));
    pushToast(
      tr('অ্যাক্টিভিটি ভিডিও সরানো হয়েছে', 'Activity Video Removed', 'تم حذف فيديو النشاط'),
      tr('ভিডিওটি আওয়ার অ্যাক্টিভিটিস থেকে সরানো হয়েছে।', 'Video removed from Our Activities.', 'تمت إزالة الفيديو من أنشطتنا.'),
      'info'
    );
  };

  const addGuardianReel = (item: Omit<GuardianReelItem, 'id'>) => {
    const newItem: GuardianReelItem = {
      ...item,
      id: `reel-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      guardianReels: [newItem, ...prev.guardianReels],
    }));
    pushToast(
      tr('গার্ডিয়ান রিভিউ রিল যুক্ত হয়েছে', 'Guardian Review Reel Added', 'تمت إضافة فيديو تقييم ولي أمر'),
      `"${item.titleBn}"`
    );
  };

  const updateGuardianReel = (item: GuardianReelItem) => {
    setState((prev) => ({
      ...prev,
      guardianReels: prev.guardianReels.map((r) => (r.id === item.id ? item : r)),
    }));
    pushToast(
      tr('গার্ডিয়ান রিভিউ সংরক্ষিত', 'Guardian Review Reel Saved', 'تم حفظ تقييم ولي الأمر'),
      `"${item.titleBn}"`
    );
  };

  const deleteGuardianReel = (id: string) => {
    setState((prev) => ({
      ...prev,
      guardianReels: prev.guardianReels.filter((r) => r.id !== id),
    }));
    pushToast(
      tr('গার্ডিয়ান রিভিউ সরানো হয়েছে', 'Guardian Review Removed', 'تم حذف تقييم ولي الأمر'),
      tr('গার্ডিয়ান রিভিউ ভিডিওটি সরানো হয়েছে।', 'Guardian review video removed.', 'تمت إزالة فيديو تقييم ولي الأمر.'),
      'info'
    );
  };

  const clearAllVideoLinks = () => {
    setState((prev) => clearAllVideoLinksFromState(prev));
    pushToast(
      tr('সমস্ত ভিডিও লিঙ্ক সরানো হয়েছে', 'All Video Links Cleared', 'تمت إزالة جميع روابط الفيديو'),
      tr(
        'হিরো, ক্যাম্পাস, বিভাগ, অ্যাক্টিভিটি ও অভিভাবক রিলসের সব ভিডিও লিঙ্ক খালি করা হয়েছে। আপনি যেকোনো সময় ড্যাশবোর্ড থেকে নতুন লিঙ্ক যুক্ত করতে পারবেন।',
        'All video links have been cleared. You can add new links anytime from the dashboard.',
        'تم مسح جميع روابط الفيديو. يمكنك إضافة روابط جديدة في أي وقت من لوحة التحكم.'
      ),
      'info'
    );
  };

  const updateHifzTreeConfig = (hifzTreeConfig: HifzTreeConfig) => {
    setState((prev) => ({ ...prev, hifzTreeConfig }));
    pushToast(
      tr('হিফজুল কুরআন ট্রি আপডেট হয়েছে', 'Hifzul Quran Tree Updated', 'تم تحديث شجرة حفاظ القرآن'),
      tr(
        'হাফেজদের বংশবৃক্ষ ও সম্মাননা তথ্য সংরক্ষিত হয়েছে।',
        'Hifzul Quran lineage and graduate records saved.',
        'تم حفظ بيانات حفاظ القرآن الكريم بنجاح.'
      )
    );
  };

  const addHafizGraduate = (item: Omit<HafizGraduateItem, 'id'>) => {
    const newItem: HafizGraduateItem = {
      ...item,
      id: `hafiz-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      hifzTreeConfig: {
        ...prev.hifzTreeConfig,
        totalHuffazCount: Math.max(
          prev.hifzTreeConfig.totalHuffazCount,
          newItem.serialNumber,
          prev.hifzTreeConfig.graduates.length + 1
        ),
        graduates: [newItem, ...prev.hifzTreeConfig.graduates].sort(
          (a, b) => b.serialNumber - a.serialNumber
        ),
      },
    }));
    pushToast(
      tr('নতুন হাফেজ প্রোফাইল যুক্ত হয়েছে', 'New Hafez Added to Hifz Tree', 'تمت إضافة حافظ جديد'),
      `${item.serialBadgeBn} — ${item.nameBn}`
    );
  };

  const updateHafizGraduate = (item: HafizGraduateItem) => {
    setState((prev) => ({
      ...prev,
      hifzTreeConfig: {
        ...prev.hifzTreeConfig,
        graduates: prev.hifzTreeConfig.graduates.map((g) => (g.id === item.id ? item : g)),
      },
    }));
    pushToast(
      tr('হাফেজ প্রোফাইল সংরক্ষিত', 'Hafez Profile Saved', 'تم حفظ ملف الحافظ'),
      `${item.serialBadgeBn} — ${item.nameBn}`
    );
  };

  const deleteHafizGraduate = (id: string) => {
    setState((prev) => ({
      ...prev,
      hifzTreeConfig: {
        ...prev.hifzTreeConfig,
        graduates: prev.hifzTreeConfig.graduates.filter((g) => g.id !== id),
      },
    }));
    pushToast(
      tr('হাফেজ প্রোফাইল সরানো হয়েছে', 'Hafez Profile Removed', 'تم حذف ملف الحافظ'),
      `ID: ${id}`,
      'info'
    );
  };

  const addPhotoGalleryItem = (item: Omit<PhotoGalleryItem, 'id'>) => {
    const newItem: PhotoGalleryItem = {
      ...item,
      id: `pg-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      photoGallery: [newItem, ...(prev.photoGallery || [])],
    }));
    pushToast(
      tr('ফটো গ্যালারিতে নতুন ছবি যুক্ত হয়েছে', 'Photo Added to Gallery', 'تمت إضافة صورة للمعرض'),
      `"${item.titleBn}"`
    );
  };

  const updatePhotoGalleryItem = (item: PhotoGalleryItem) => {
    setState((prev) => ({
      ...prev,
      photoGallery: (prev.photoGallery || []).map((p) => (p.id === item.id ? item : p)),
    }));
    pushToast(
      tr('ফটো গ্যালারি আইটেম সংরক্ষিত', 'Photo Gallery Item Saved', 'تم حفظ الصورة'),
      `"${item.titleBn}"`
    );
  };

  const deletePhotoGalleryItem = (id: string) => {
    setState((prev) => ({
      ...prev,
      photoGallery: (prev.photoGallery || []).filter((p) => p.id !== id),
    }));
    pushToast(
      tr('গ্যালারি থেকে ছবি সরানো হয়েছে', 'Photo Removed from Gallery', 'تمت إزالة الصورة'),
      `ID: ${id}`,
      'info'
    );
  };

  const importFullCMSState = (newState: CMSState, summaryMessage?: string) => {
    const excluded = fullReplaceExclusions();
    // Keys this role may not replace keep their current values, locally and on the server.
    setState((prev) => {
      const next: Record<string, unknown> = { ...newState };
      for (const key of excluded) next[key] = prev[key];
      return next as unknown as CMSState;
    });
    sync.requestFullReplace(excluded);
    pushToast(
      tr(
        'প্রতিষ্ঠানের ডাটা সফলভাবে আপডেট হয়েছে',
        'Institution Data Restored Successfully',
        'تم استرجاع بيانات المعهد بنجاح'
      ),
      summaryMessage ||
        tr(
          'সম্পূর্ণ ডাটাবেস ও ওয়েবসাইটের তথ্য সফলভাবে রিস্টোর করা হয়েছে।',
          'Full database and website state restored successfully.',
          'تمت استعادة قاعدة البيانات ومعلومات الموقع بالكامل.'
        )
    );
  };

  const updateEducationMethodConfig = (educationMethodConfig: EducationMethodConfig) => {
    setState((prev) => ({ ...prev, educationMethodConfig }));
    pushToast(
      tr(
        'শিক্ষা পদ্ধতি ৫০/৫০ আপডেট হয়েছে',
        '50/50 Education Method Updated',
        'تم تحديث منهجية التعليم المتوازن ٥٠/٥٠'
      ),
      tr(
        'স্তরভেদে বিষয়ের ভারসাম্য ও শতাংশ সংরক্ষিত হয়েছে।',
        'Stage-by-stage subject balance and percentages saved.',
        'تم حفظ نسب التوازن بين المواد لكل مرحلة.'
      )
    );
  };

  const updateTenYearPlanConfig = (tenYearPlanConfig: TenYearPlanConfig) => {
    setState((prev) => ({ ...prev, tenYearPlanConfig }));
    pushToast(
      tr(
        '১০ বছরের পাঠ পরিকল্পনা সংরক্ষিত',
        '10-Year Study Plan Saved',
        'تم حفظ الخطة الدراسية لـ ١٠ سنوات'
      ),
      tr(
        'নার্সারি থেকে একাদশ পাঠ পরিকল্পনা আপডেট হয়েছে।',
        'Nursery to Grade 11 academic roadmap updated.',
        'تم تحديث الخطة الدراسية من التمهيدي حتى الصف الحادي عشر.'
      )
    );
  };

  const updateDayCareRoutineConfig = (dayCareRoutineConfig: DayCareRoutineConfig) => {
    setState((prev) => ({ ...prev, dayCareRoutineConfig }));
    pushToast(
      tr(
        'ডে-কেয়ার রুটিন আপডেট হয়েছে',
        'Day-Care Routine Updated',
        'تم تحديث جدول الرعاية النهارية'
      ),
      tr(
        'হিফজ ডে-কেয়ারের দৈনিক রুটিন ও সময়সূচি সংরক্ষিত হয়েছে।',
        'Daily schedule and supervision timeline saved.',
        'تم حفظ الجدول اليومي للرعاية النهارية.'
      )
    );
  };

  const updateTransportConfig = (transportConfig: TransportAndLandmarkConfig) => {
    setState((prev) => ({ ...prev, transportConfig }));
    pushToast(
      tr(
        'নিজস্ব পরিবহন ও দূরত্ব আপডেট হয়েছে',
        'Own Transport & Routes Updated',
        'تم تحديث مسارات النقل المدرسي'
      ),
      tr(
        'পরিবহন রুট, স্টপেজ, দূরত্ব ও মাসিক ভাড়া সংরক্ষিত হয়েছে।',
        'Transport routes, stops, distances, and monthly fares saved.',
        'تم حفظ المسارات والمحطات والرسوم الشهرية.'
      )
    );
  };

  const updateAdmissionExtraConfig = (admissionExtraConfig: AdmissionExtraConfig) => {
    setState((prev) => ({ ...prev, admissionExtraConfig }));
    pushToast(
      tr(
        'ভর্তি ও ফি তুলনা আপডেট হয়েছে',
        'Admission & Fee Comparison Updated',
        'تم تحديث مقارنة الرسوم والقبول'
      ),
      tr(
        'ডে-কেয়ার বনাম নন-ডে-কেয়ার ফি, ভাইবোন ছাড় ও বয়সসীমা সংরক্ষিত হয়েছে।',
        'Day-care vs non-daycare fees, sibling discount, and age guide saved.',
        'تم حفظ مقارنة الرسوم وخصم الأشقاء والفئات العمرية.'
      )
    );
  };

  const updateUniformConfig = (uniformConfig: UniformGuideConfig) => {
    setState((prev) => ({ ...prev, uniformConfig }));
    pushToast(
      tr('ইউনিফর্ম গাইড সংরক্ষিত', 'Uniform Guide Saved', 'تم حفظ دليل الزي المدرسي'),
      tr(
        'বালক ও বালিকা ড্রেস কোড সফলভাবে আপডেট হয়েছে।',
        'Boys and girls dress code specifications updated.',
        'تم تحديث مواصفات الزي المدرسي للبنين والبنات.'
      )
    );
  };

  const updateMadrasahContextConfig = (madrasahContextConfig: MadrasahContextConfig) => {
    setState((prev) => ({ ...prev, madrasahContextConfig }));
    pushToast(
      tr(
        'মাদ্রাসা প্রেক্ষাপট ও লক্ষ্য সংরক্ষিত',
        'Institutional Context & Mission Saved',
        'تم حفظ رؤية ورسالة المعهد'
      ),
      tr(
        'প্রতিষ্ঠার প্রেক্ষাপট, মিশন-ভিশন ও বাণী আপডেট হয়েছে।',
        'Founding context, mission-vision, and Principal message updated.',
        'تم تحديث سياق التأسيس والرسالة وكلمة المدير.'
      )
    );
  };

  const submitGuardianComplaint = async (
    item: Omit<GuardianComplaintItem, 'id' | 'submittedAt' | 'status'>
  ): Promise<SubmitOutcome> => {
    const res = await sync.submitPublic([{ key: 'complaints', item: { ...item, id: `comp-${Date.now()}` } }]);
    if (!res.ok) return { ok: false, error: publicSubmitError(res) };
    pushToast(
      tr(
        'অভিযোগ / পরামর্শ গৃহীত হয়েছে',
        'Feedback / Suggestion Received',
        'تم استلام الملاحظة / الاقتراح'
      ),
      tr(
        'আপনার মূল্যবান মতামত সরাসরি মাদ্রাসা প্রশাসনের কাছে পাঠানো হয়েছে।',
        'Your feedback has been forwarded directly to the administration.',
        'تم إرسال ملاحظاتكم مباشرة إلى إدارة المعهد.'
      )
    );
    return { ok: true };
  };

  const updateComplaintStatus = (
    id: string,
    status: GuardianComplaintItem['status'],
    adminReply?: string
  ) => {
    setState((prev) => ({
      ...prev,
      complaints: (prev.complaints || []).map((c) =>
        c.id === id ? { ...c, status, adminReply: adminReply ?? c.adminReply } : c
      ),
    }));
    pushToast(
      tr('অভিযোগ স্ট্যাটাস আপডেট হয়েছে', 'Feedback Status Updated', 'تم تحديث حالة الملاحظة'),
      `Status: "${status}"`
    );
  };

  const deleteComplaint = (id: string) => {
    setState((prev) => ({
      ...prev,
      complaints: (prev.complaints || []).filter((c) => c.id !== id),
    }));
    pushToast(
      tr('অভিযোগ ডিলিট করা হয়েছে', 'Feedback Record Deleted', 'تم حذف سجل الملاحظة'),
      `ID: ${id}`,
      'info'
    );
  };

  const applyTargetInstitutionPreset = (preset: 'maharat' | 'craft') => {
    if (preset === 'maharat') {
      setState((prev) => buildMaharatModelMadrasahPreset(prev));
      pushToast(
        tr(
          'মাহারাত মডেল মাদ্রাসা প্রিসেট চালু হয়েছে!',
          'Maharat Model Madrasah Preset Activated!',
          'تم تفعيل إعدادات مدرسة مهارات النموذجية!'
        ),
        tr(
          'ওয়েবসাইটের নাম, স্লোগান, উত্তরা সেক্টর ১২ ঠিকানা, ফোন ও প্রেক্ষাপট মাহারাত মডেল মাদ্রাসায় রূপান্তরিত হয়েছে।',
          'Branding, slogan, Uttara Sector 12 address, phone, and context switched to Maharat Model Madrasah.',
          'تم تحويل العلامة التجارية والعنوان والبيانات إلى مدرسة مهارات النموذجية.'
        )
      );
    } else {
      setState((prev) => ({
        ...prev,
        settings: INITIAL_CMS_STATE.settings,
        madrasahContextConfig: {
          ...prev.madrasahContextConfig,
          activePresetId: 'craft',
        },
      }));
      pushToast(
        tr(
          'ক্রাফট ইনস্টিটিউট প্রিসেট চালু হয়েছে!',
          'Craft International Institute Preset Restored!',
          'تم تفعيل إعدادات معهد كرافت الدولي!'
        ),
        tr(
          'ওয়েবসাইটের ব্র্যান্ডিং ক্রাফট ইন্টারন্যাশনাল ইনস্টিটিউটে ফিরিয়ে আনা হয়েছে।',
          'Website branding restored to Craft International Institute.',
          'تمت استعادة العلامة التجارية لمعهد كرافت الدولي.'
        )
      );
    }
  };

  const syncLocalToLiveServer = async (silent: boolean = false): Promise<boolean> => {
    const ok = await sync.flush();
    if (!silent) {
      if (ok) {
        pushToast(
          tr(
            'লাইভ সার্ভারে সকল তথ্য সিঙ্ক হয়েছে!',
            'All Data Synced to Live Server!',
            'تمت مزامنة جميع البيانات مع الخادم المباشر!'
          ),
          tr(
            'সকল তথ্য সার্ভারে সংরক্ষিত হয়েছে; এখন যেকোনো ডিভাইস থেকে ওয়েবসাইটে সর্বশেষ তথ্য দেখা যাবে।',
            'All local and deployment updates are now live and accessible to everyone via the shared URL.',
            'جميع التحديثات متاحة الآن مباشرة للجميع عبر الرابط المشترك.'
          )
        );
      } else {
        pushToast(
          tr('সার্ভার সিঙ্ক ব্যর্থ হয়েছে', 'Live Server Sync Failed', 'فشلت المزامنة مع الخادم'),
          tr('অনুগ্রহ করে ইন্টারনেট কানেকশন বা সার্ভার স্ট্যাটাস চেক করুন।', 'Please verify server connection.', 'يرجى التحقق من الاتصال بالخادم.'),
          'info'
        );
      }
    }
    return ok;
  };

  const pullFromLiveServer = async (silent: boolean = false): Promise<boolean> => {
    const ok = await sync.refetch();
    if (ok && !silent) {
      pushToast(
        tr('লাইভ সার্ভার থেকে সর্বশেষ তথ্য লোড হয়েছে', 'Pulled Latest Live Server Data', 'تم جلب أحدث البيانات من الخادم'),
        `Version #${sync.currentVersion()}`
      );
    }
    return ok;
  };

  const enableAllWebsiteSections = () => {
    setState((prev) => ({
      ...prev,
      settings: enableAllPublicSections(prev.settings),
    }));
    pushToast(
      tr(
        'সকল ওয়েবসাইট সেকশন সবার জন্য উন্মুক্ত করা হয়েছে!',
        'All Website Sections Enabled for Everyone!',
        'تم تفعيل جميع أقسام الموقع للجميع!'
      ),
      tr(
        'হিরো, ইনফোগ্রাফিক, কোর্স, ফি ক্যালকুলেটর, ভিডিও, নোটিশ ও যোগাযোগসহ ১৭টি সেকশন লাইভ ওয়েবসাইটে সক্রিয় করা হয়েছে।',
        'All 17 public website sections are now active and visible to every visitor.',
        'جميع أقسام الموقع العام نشطة ومرئية الآن لكل زائر.'
      )
    );
  };

  // --- Version & Release Manager Actions ---
  const updateVersionVisibility = (
    patch: Partial<
      Pick<AppVersionManagerConfig, 'enabled' | 'showInPublicFooter' | 'showInAdminDashboard'>
    >
  ) => {
    setState((prev) => {
      const current = resolveVersionManagerConfig(prev.versionManager);
      return {
        ...prev,
        versionManager: {
          ...current,
          ...patch,
        },
      };
    });
  };

  const createVersionRelease = (input: {
    bumpType?: SemverBumpType;
    customVersion?: string;
    title: string;
    notes: string;
    added?: string[];
    improved?: string[];
    removed?: string[];
  }): AppReleaseEntry => {
    const actor = currentUser?.fullName || currentUser?.username || 'Super Admin';
    const { nextConfig, createdRelease } = createReleaseEntry(state, {
      bumpType: input.bumpType,
      customVersion: input.customVersion,
      title: input.title,
      notes: input.notes,
      added: input.added,
      improved: input.improved,
      removed: input.removed,
      createdBy: actor,
    });
    setState((prev) => ({
      ...prev,
      versionManager: nextConfig,
    }));
    pushToast(
      tr(
        `নতুন ভার্সন ${createdRelease.tag} স্ন্যাপশট সেভ হয়েছে`,
        `Saved Release Snapshot ${createdRelease.tag}`,
        `تم حفظ لقطة الإصدار ${createdRelease.tag}`
      ),
      createdRelease.title
    );
    return createdRelease;
  };

  const rollbackToVersion = (releaseId: string): { success: boolean; error?: string } => {
    const actor = currentUser?.fullName || currentUser?.username || 'Super Admin';
    const result = rollbackToReleaseSnapshot(state, releaseId, actor);
    if (!result.success || !result.nextState || !result.restoredRelease) {
      pushToast(
        tr('রোলব্যাক সম্ভব হয়নি', 'Rollback Failed', 'تعذر الاسترجاع'),
        result.error || 'Snapshot unavailable',
        'info'
      );
      return { success: false, error: result.error };
    }
    setState(result.nextState);
    pushToast(
      tr(
        `${result.restoredRelease.tag} ভার্সনে সফলভাবে রোলব্যাক সম্পন্ন হয়েছে`,
        `Rolled Back to ${result.restoredRelease.tag}`,
        `تم الاسترجاع إلى الإصدار ${result.restoredRelease.tag}`
      ),
      tr(
        'আগের অবস্থার একটি অটো-সেফটি ব্যাকআপ স্বয়ংক্রিয়ভাবে সংরক্ষণ করা হয়েছে।',
        'An automatic pre-rollback safety backup was captured before restoring.',
        'تم إنشاء نسخة احتياطية أوتوماتيكية قبل الاسترجاع.'
      )
    );
    return { success: true };
  };

  const deleteVersionRelease = (releaseId: string) => {
    setState((prev) => {
      const current = resolveVersionManagerConfig(prev.versionManager);
      const remaining = current.releases.filter((r) => r.id !== releaseId);
      return {
        ...prev,
        versionManager: {
          ...current,
          releases: remaining.length > 0 ? remaining : current.releases,
        },
      };
    });
    pushToast(
      tr('রিলিজ এন্ট্রি মুছে ফেলা হয়েছে', 'Release Entry Removed', 'تم حذف سجل الإصدار'),
      tr('রিলিজ হিস্ট্রি আপডেট করা হয়েছে।', 'Release history updated.', 'تم تحديث سجل الإصدارات.'),
      'info'
    );
  };

  const importVersionReleaseJson = (
    rawJson: string
  ): { success: boolean; entry?: AppReleaseEntry; error?: string } => {
    const parsed = validateImportedReleaseSnapshot(rawJson);
    if (!parsed.valid || !parsed.entry) {
      pushToast(
        tr('স্ন্যাপশট ইম্পোর্ট ব্যর্থ হয়েছে', 'Snapshot Import Failed', 'فشل استيراد اللقطة'),
        parsed.error || 'Invalid JSON',
        'info'
      );
      return { success: false, error: parsed.error };
    }
    setState((prev) => {
      const current = resolveVersionManagerConfig(prev.versionManager);
      return {
        ...prev,
        versionManager: {
          ...current,
          releases: [parsed.entry!, ...current.releases].slice(0, 25),
        },
      };
    });
    pushToast(
      tr(
        `স্ন্যাপশট ${parsed.entry.tag} ইম্পোর্ট সম্পন্ন হয়েছে`,
        `Imported Snapshot ${parsed.entry.tag}`,
        `تم استيراد اللقطة ${parsed.entry.tag}`
      ),
      tr(
        'এখন আপনি রিলিজ তালিকা থেকে যেকোনো সময় এটি রিস্টোর করতে পারবেন।',
        'You can now restore this snapshot anytime from the release history.',
        'يمكنك استعادة هذه اللقطة في أي وقت من سجل الإصدارات.'
      )
    );
    return { success: true, entry: parsed.entry };
  };

  // --- Admission Token 2027 CRUD ---
  const addAdmissionToken = (
    token: Omit<AdmissionToken2027, 'id' | 'createdAt'>
  ): AdmissionToken2027 => {
    const created: AdmissionToken2027 = {
      ...token,
      id: `tok-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      createdAt: new Date().toISOString().slice(0, 10),
      createdBy: token.createdBy || token.issuedBy || currentUser?.fullName || 'Principal Office',
    };
    setState((prev) => ({
      ...prev,
      admissionTokens2027: [created, ...(prev.admissionTokens2027 || [])],
    }));
    pushToast(
      tr(`অ্যাডমিশন টোকেন ${created.tokenCode} তৈরি হয়েছে`, `Admission Token ${created.tokenCode} Issued`, `تم إصدار قسيمة القبول ${created.tokenCode}`),
      `${created.studentName} · ${created.guardianPhone}`
    );
    return created;
  };

  const updateAdmissionToken = (token: AdmissionToken2027) => {
    setState((prev) => ({
      ...prev,
      admissionTokens2027: (prev.admissionTokens2027 || []).map((t) =>
        t.id === token.id ? token : t
      ),
    }));
    pushToast(
      tr('টোকেন আপডেট হয়েছে', 'Token Updated', 'تم تحديث القسيمة'),
      `${token.tokenCode} (${token.status})`,
      'info'
    );
  };

  const deleteAdmissionToken = (id: string) => {
    setState((prev) => ({
      ...prev,
      admissionTokens2027: (prev.admissionTokens2027 || []).filter((t) => t.id !== id),
    }));
    pushToast(
      tr('টোকেন মুছে ফেলা হয়েছে', 'Token Removed', 'تم حذف القسيمة'),
      tr('অ্যাডমিশন টোকেন তালিকা হালনাগাদ হয়েছে।', 'Admission Token list updated.', 'تم تحديث قائمة القسائم.'),
      'info'
    );
  };

  // --- Blog & Automation API CRUD ---
  const addBlogPost = (post: Omit<BlogPostItem, 'id'>): BlogPostItem => {
    const created: BlogPostItem = {
      ...post,
      id: `blog-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    };
    setState((prev) => ({
      ...prev,
      blogPosts: [created, ...(prev.blogPosts || [])],
    }));
    pushToast(
      tr('নতুন ব্লগ পোস্ট প্রকাশিত হয়েছে', 'Blog Post Saved', 'تم حفظ المقال'),
      created.titleBn || created.titleEn
    );
    return created;
  };

  const updateBlogPost = (post: BlogPostItem) => {
    setState((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).map((p) => (p.id === post.id ? post : p)),
    }));
    pushToast(
      tr('ব্লগ পোস্ট আপডেট হয়েছে', 'Blog Post Updated', 'تم تحديث المقال'),
      post.titleBn || post.titleEn
    );
  };

  const deleteBlogPost = (id: string) => {
    setState((prev) => ({
      ...prev,
      blogPosts: (prev.blogPosts || []).filter((p) => p.id !== id),
    }));
    pushToast(
      tr('ব্লগ পোস্ট মুছে ফেলা হয়েছে', 'Blog Post Deleted', 'تم حذف المقال'),
      tr('ব্লগ আর্কাইভ হালনাগাদ হয়েছে।', 'Blog archive updated.', 'تم تحديث المدونة.'),
      'info'
    );
  };

  const updateBlogAutomationConfig = (config: BlogAutomationConfig) => {
    setState((prev) => ({
      ...prev,
      blogAutomationConfig: config,
    }));
    pushToast(
      tr('ব্লগ অটোমেশন API সেটিংস সংরক্ষিত', 'Blog Automation API Saved', 'تم حفظ إعدادات API المدونة'),
      config.enabled ? 'POST /api/blog/action-publish Active' : 'Webhook Paused',
      'info'
    );
  };

  // --- Institutional Academic Calendar CRUD + Google Sync ---
  const addCalendarEvent = (
    ev: Omit<InstitutionalCalendarEvent, 'id'>
  ): InstitutionalCalendarEvent => {
    const created: InstitutionalCalendarEvent = {
      ...ev,
      id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    };
    setState((prev) => ({
      ...prev,
      calendarEvents: [created, ...(prev.calendarEvents || [])].sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
    }));
    pushToast(
      tr('ক্যালেন্ডার ইভেন্ট যুক্ত হয়েছে', 'Calendar Event Added', 'تمت إضافة الحدث للتقويم'),
      `${created.titleBn} (${created.date})`
    );
    return created;
  };

  const updateCalendarEvent = (ev: InstitutionalCalendarEvent) => {
    setState((prev) => ({
      ...prev,
      calendarEvents: (prev.calendarEvents || []).map((item) => (item.id === ev.id ? ev : item)),
    }));
  };

  const deleteCalendarEvent = (id: string) => {
    setState((prev) => ({
      ...prev,
      calendarEvents: (prev.calendarEvents || []).filter((item) => item.id !== id),
    }));
    pushToast(
      tr('ক্যালেন্ডার ইভেন্ট মুছে ফেলা হয়েছে', 'Calendar Event Removed', 'تم حذف الحدث'),
      tr('প্রাতিষ্ঠানিক ক্যালেন্ডার আপডেট হয়েছে।', 'Institutional calendar updated.', 'تم تحديث التقويم.'),
      'info'
    );
  };

  const mergeGoogleCalendarEvents = (incoming: InstitutionalCalendarEvent[]): number => {
    const existing = stateRef.current.calendarEvents || [];
    const existingKeys = new Set(
      existing.map((e) => e.googleEventId || `${e.date}::${e.titleEn.toLowerCase()}`)
    );
    const uniqueNew = incoming.filter((e) => {
      const key = e.googleEventId || `${e.date}::${e.titleEn.toLowerCase()}`;
      if (existingKeys.has(key)) return false;
      existingKeys.add(key);
      return true;
    });

    if (uniqueNew.length > 0) {
      setState((prev) => ({
        ...prev,
        calendarEvents: [...(prev.calendarEvents || []), ...uniqueNew].sort((a, b) =>
          a.date.localeCompare(b.date)
        ),
      }));
    }
    return uniqueNew.length;
  };

  // --- Mobile App-Style Bottom Bar Config ---
  const updateMobileBottomBar = (config: MobileBottomBarConfig) => {
    setState((prev) => ({
      ...prev,
      mobileBottomBar: config,
    }));
    pushToast(
      tr('মোবাইল বটম নেভিগেশন বার আপডেট হয়েছে', 'Mobile Bottom Bar Updated', 'تم تحديث شريط التنقل السفلي'),
      config.enabled ? `${config.slots.length} Slots Active` : 'Disabled',
      'info'
    );
  };

  // --- Virtual Office / Hybrid Live Desk ---
  const updateVirtualOfficeConfig = (config: VirtualOfficeConfig) => {
    setState((prev) => ({
      ...prev,
      virtualOfficeConfig: config,
    }));
    pushToast(
      tr('ভার্চুয়াল অফিস সেটিংস সংরক্ষিত হয়েছে', 'Virtual Office Updated', 'تم حفظ إعدادات المكتب الافتراضي'),
      `${config.manualStatus} · ${config.primaryPlatform}`
    );
  };

  /**
   * The check-in endpoint has already stored the session and its lead on the server. Signed-in
   * staff reload state to see them; visitors never hold sessions locally (private data). Adding
   * the session locally would make the sync layer re-send it as a staff write.
   */
  const recordLocalVirtualOfficeSession = (_session: VirtualOfficeSession) => {
    if (currentUser) void sync.refetch({ background: true });
  };

  const updateVirtualOfficeSessionStatus = (
    sessionId: string,
    status: VirtualOfficeSessionStatus
  ) => {
    setState((prev) => ({
      ...prev,
      virtualOfficeSessions: (prev.virtualOfficeSessions || []).map((s) =>
        s.id === sessionId ? { ...s, sessionStatus: status } : s
      ),
    }));
    pushToast(
      tr('চেক-ইন স্ট্যাটাস আপডেট হয়েছে', 'Session Status Updated', 'تم تحديث حالة الجلسة'),
      status,
      'info'
    );
  };

  const deleteVirtualOfficeSession = (sessionId: string) => {
    setState((prev) => ({
      ...prev,
      virtualOfficeSessions: (prev.virtualOfficeSessions || []).filter((s) => s.id !== sessionId),
    }));
    pushToast(
      tr('ভার্চুয়াল অফিস সেশন মুছে ফেলা হয়েছে', 'Session Deleted', 'تم حذف الجلسة'),
      tr('চেক-ইন কিউ হালনাগাদ হয়েছে।', 'Check-in queue updated.', 'تم تحديث قائمة الانتظار.'),
      'info'
    );
  };

  return (
    <CMSContext.Provider
      value={{
        state,
        currentUser,
        theme,
        toggleTheme,
        setTheme,
        language,
        setLanguage,
        fontSize,
        setFontSize,
        cycleFontSize,
        t,
        toasts,
        dismissToast,
        pushToast,
        liveSyncStatus,
        syncLocalToLiveServer,
        pullFromLiveServer,
        enableAllWebsiteSections,
        login,
        mustChangePassword,
        changePassword,
        storageMode,
        demoAccounts,
        loginSetup,
        loginWithGoogleProfile,
        updateCurrentUserProfile,
        logout,
        uploadAndStoreLogo,
        deleteStoredLogo,
        resetToDefaultData,
        importFullCMSState,
        addNews,
        toggleNews,
        deleteNews,
        addNotice,
        updateNotice,
        deleteNotice,
        addCourse,
        updateCourse,
        deleteCourse,
        addEvent,
        updateEvent,
        deleteEvent,
        submitInquiry,
        publicSubmitError,
        updateLeadStatus,
        updateLeadCourse,
        deleteLead,
        addLeadCallLog,
        addLeadNote,
        scheduleLeadFollowUp,
        updateLeadPriority,
        bulkImportLeads,
        updateLeadDetailedAdmission,
        updateLeadChecklist,
        updateLeadCounselor,
        addCareerJob,
        updateCareerJob,
        deleteCareerJob,
        submitCareerApplication,
        updateCareerApplicationStatus,
        deleteCareerApplication,
        addAdminUser,
        updateAdminUserRole,
        deleteAdminUser,
        updateRolePermission,
        resetRBACMatrix,
        submitLeaveRequest,
        reviewLeaveRequest,
        deleteLeaveRequest,
        updateSettings,
        updatePopupConfig,
        updateAIBotConfig,
        updateWhatsAppConfig,
        updateFeeCalculatorConfig,
        updateCampusVideo,
        updateDepartmentVideo,
        addActivityVideo,
        updateActivityVideo,
        deleteActivityVideo,
        addGuardianReel,
        updateGuardianReel,
        deleteGuardianReel,
        clearAllVideoLinks,
        updateHifzTreeConfig,
        addHafizGraduate,
        updateHafizGraduate,
        deleteHafizGraduate,
        addPhotoGalleryItem,
        updatePhotoGalleryItem,
        deletePhotoGalleryItem,
        updateEducationMethodConfig,
        updateTenYearPlanConfig,
        updateDayCareRoutineConfig,
        updateTransportConfig,
        updateAdmissionExtraConfig,
        updateUniformConfig,
        updateMadrasahContextConfig,
        submitGuardianComplaint,
        updateComplaintStatus,
        deleteComplaint,
        applyTargetInstitutionPreset,
        updateVersionVisibility,
        createVersionRelease,
        rollbackToVersion,
        deleteVersionRelease,
        importVersionReleaseJson,
        addAdmissionToken,
        updateAdmissionToken,
        deleteAdmissionToken,
        addBlogPost,
        updateBlogPost,
        deleteBlogPost,
        updateBlogAutomationConfig,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        mergeGoogleCalendarEvents,
        updateMobileBottomBar,
        updateVirtualOfficeConfig,
        recordLocalVirtualOfficeSession,
        updateVirtualOfficeSessionStatus,
        deleteVirtualOfficeSession,
      }}
    >
      {children}
    </CMSContext.Provider>
  );
};

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error('useCMS must be used within a CMSProvider');
  }
  return context;
};
