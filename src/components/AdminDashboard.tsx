import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Briefcase,
  Calculator,
  Calendar,
  ChevronDown,
  ChevronRight,
  DatabaseBackup,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Gift,
  GitBranch,
  Globe,
  KeyRound,
  GraduationCap,
  Image,
  LayoutDashboard,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  Newspaper,
  Plus,
  Radio,
  Receipt,
  Save,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  UserCircle2,
  UserPlus,
  Users,
  Video,
  Wand2,
  X,
} from 'lucide-react';
import { generateAdmissionPDF } from '../utils/pdfExport';
import { validateNewPassword } from '../utils/passwordPolicy';
import { useCMS } from '../store/useCMSStore';
import { MIN_PASSWORD_LENGTH } from '../server/contracts';
import {
  AIBotConfig,
  AdminRole,
  AdmissionLead,
  ClassModule,
  CourseCategory,
  CourseItem,
  EventItem,
  FeeCalculatorConfig,
  LEAD_STATUS_OPTIONS,
  MobileBottomBarSlotTarget,
  NoticeCategory,
  NoticeItem,
  PageVisibilityConfig,
  PopupNoticeConfig,
  SiteSettings,
} from '../types/cms';
import {
  AdminTabId,
  canAccessAdminResource,
  hasRolePermission,
  toBengaliDigits,
} from '../utils/cmsLogic';
import { localizeDynamicText } from '../utils/i18nContent';
import { EnrollmentTrendsChart } from './EnrollmentTrendsChart';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { AdminMadrasahInfographicsTab } from './AdminMadrasahInfographicsTab';
import {
  AdminBackupAndAITab,
  AdminLeaveManagementTab,
  AdminRBACMatrixSection,
  AdminVideosTab,
} from './AdminLeaveManagementTab';
import { AdminLeadsCRMTab } from './AdminLeadsCRMTab';
import { AdminCareerTab } from './AdminCareerTab';
import { AdminVersionManagerTab } from './AdminVersionManagerTab';
import { AdminAdmissionTokenTab } from './AdminAdmissionTokenTab';
import { AdminVirtualOfficeTab } from './AdminVirtualOfficeTab';
import { AdminCalendarTab } from './AdminCalendarTab';
import { AdminBlogTab } from './AdminBlogTab';
import { AdminAIPublisherTab } from './AdminAIPublisherTab';
import { AdminProfileModal } from './AdminProfileModal';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { ReleaseNotesModal } from './ReleaseNotesAndCertModals';
import { resolveVersionManagerConfig, shouldShowAdminVersion } from '../utils/versionLogic';
import {
  DEFAULT_BOYS_CAMPUS_EMBED_URL,
  DEFAULT_BOYS_CAMPUS_MAP_URL,
  DEFAULT_GIRLS_CAMPUS_EMBED_URL,
  DEFAULT_GIRLS_CAMPUS_MAP_URL,
  resolveGoogleMapsEmbedUrl,
} from '../utils/careerAndMapsLogic';
import {
  isValidExternalPortalUrl,
  removeBotQAItem,
  reorderSuggestedQuestions,
  resolveExternalPortals,
  upsertBotQAItem,
} from '../utils/portalAndHifzLogic';

interface AdminDashboardProps {
  onSwitchToWebsite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onSwitchToWebsite }) => {
  const {
    state,
    currentUser,
    language,
    logout,
    pushToast,
    liveSyncStatus,
    storageMode,
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
    addAdminUser,
    updateAdminUserRole,
    deleteAdminUser,
    updateSettings,
    uploadAndStoreLogo,
    deleteStoredLogo,
    updatePopupConfig,
    updateAIBotConfig,
    updateFeeCalculatorConfig,
    updateMobileBottomBar,
  } = useCMS();

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);

  const versionManagerConfig = resolveVersionManagerConfig(state.versionManager);
  const showAdminVersionBadge = shouldShowAdminVersion(versionManagerConfig);
  const tr = (bn: string, en: string, ar: string) =>
    language === 'en' ? en : language === 'ar' ? ar : bn;
  const loc = (text?: string) => (text ? localizeDynamicText(text, language) : '');

  const localizeRole = (role: AdminRole) => {
    if (role === 'Super Admin') return tr('সুপার অ্যাডমিন (Super Admin)', 'Super Admin', 'المشرف العام');
    if (role === 'Chairman / Managing Director')
      return tr('চেয়ারম্যান / এমডি', 'Chairman / Managing Director', 'رئيس مجلس الإدارة / المدير العام');
    if (role === 'Principal / Vice Principal')
      return tr('অধ্যক্ষ / উপাধ্যক্ষ', 'Principal / Vice Principal', 'المدير / نائب المدير');
    if (role === 'Coordinators / Teachers')
      return tr('কো-অর্ডিনেটর / শিক্ষক', 'Coordinators / Teachers', 'المنسقون / المعلمون');
    return tr('কন্টেন্ট ম্যানেজার', 'Content Managers', 'مديرو المحتوى');
  };

  const localizeLeadStatus = (status: string) => {
    if (status === 'All') return tr('সকল', 'All', 'الكل');
    if (status === 'Pending') return tr('পেন্ডিং', 'Pending', 'قيد الانتظار');
    if (status === 'Contacted') return tr('যোগাযোগ করা হয়েছে', 'Contacted', 'تم التواصل');
    if (status === 'Campus Visit Scheduled')
      return tr('ক্যাম্পাস ভিজিট নির্ধারিত', 'Campus Visit Scheduled', 'تم تحديد زيارة الحرم');
    if (status === 'Assessment Completed')
      return tr('মূল্যায়ন সম্পন্ন', 'Assessment Completed', 'اكتمل التقييم');
    if (status === 'Offer Extended') return tr('ভর্তি প্রস্তাব পাঠানো', 'Offer Extended', 'تم تقديم العرض');
    if (status === 'Enrolled') return tr('ভর্তি সম্পন্ন', 'Enrolled', 'تم التسجيل');
    if (status === 'Waitlisted') return tr('অপেক্ষমাণ তালিকা', 'Waitlisted', 'قائمة الانتظار');
    if (status === 'Archived') return tr('আর্কাইভড', 'Archived', 'مؤرشف');
    return status;
  };

  const [activeTab, setActiveTab] = useState<AdminTabId>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  // News state
  const [newTickerText, setNewTickerText] = useState('');

  // Notice state
  const [editingNotice, setEditingNotice] = useState<NoticeItem | null>(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeCategory, setNoticeCategory] = useState<NoticeCategory>('Admission');
  const [noticeDate, setNoticeDate] = useState(new Date().toISOString().slice(0, 10));
  const [noticeDesc, setNoticeDesc] = useState('');
  const [noticeAttachment, setNoticeAttachment] = useState('');

  // Course & Nested Modules state
  const [selectedCourseForModules, setSelectedCourseForModules] = useState<string>(
    state.courses[0]?.id || ''
  );
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseTitleBn, setCourseTitleBn] = useState('');
  const [courseCategory, setCourseCategory] = useState<CourseCategory>('Academic');
  const [courseDuration, setCourseDuration] = useState('1 Academic Year');
  const [courseTotalClasses, setCourseTotalClasses] = useState(240);
  const [courseFee, setCourseFee] = useState('৳ 5,000 / Month');
  const [courseAdmissionFee, setCourseAdmissionFee] = useState('৳ 21,000');
  const [courseOverview, setCourseOverview] = useState('');

  // Nested Module Form state
  const [modNumber, setModNumber] = useState(1);
  const [modTitle, setModTitle] = useState('');
  const [modLectures, setModLectures] = useState(24);
  const [modTopicsText, setModTopicsText] = useState('');
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  // Event state
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDate, setEvtDate] = useState('2026-11-15');
  const [evtTime, setEvtTime] = useState('10:00 AM – 01:00 PM');
  const [evtVenue, setEvtVenue] = useState('Main Campus Auditorium');
  const [evtType] = useState<EventItem['type']>('On-Campus');
  const [evtDesc, setEvtDesc] = useState('');

  // Lead inspection state
  const [inspectingLead, setInspectingLead] = useState<AdmissionLead | null>(null);

  // User Role management state
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserError, setNewUserError] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<AdminRole>('Content Managers');

  // Branding & Logo Vault state
  const [customLogoName, setCustomLogoName] = useState('');
  const [customLogoUrlInput, setCustomLogoUrlInput] = useState('');
  const [customLogoVariant, setCustomLogoVariant] = useState<
    'banner-transparent' | 'banner-white' | 'emblem' | 'custom'
  >('banner-transparent');
  const [setAsActiveOnUpload, setSetAsActiveOnUpload] = useState(true);
  const [brandingFeedback, setBrandingFeedback] = useState<string | null>(null);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(state.settings);

  // Popup, AI Bot, and Fee Calculator CMS forms
  const [popupForm, setPopupForm] = useState<PopupNoticeConfig>(state.popupConfig);
  const [aiBotForm, setAiBotForm] = useState<AIBotConfig>(state.aiBotConfig);
  const [feeCalcForm, setFeeCalcForm] = useState<FeeCalculatorConfig>(state.feeCalculatorConfig);

  // Chatbot Q&A & Suggested Question organizer local states
  const [newSuggestedQ, setNewSuggestedQ] = useState('');
  const [newQaCategory, setNewQaCategory] = useState('ভর্তি ও ফি');
  const [newQaQuestion, setNewQaQuestion] = useState('');
  const [newQaKeywords, setNewQaKeywords] = useState('');
  const [newQaAnswer, setNewQaAnswer] = useState('');

  // External ERP Portal Links draft states
  const [newPortalLabelBn, setNewPortalLabelBn] = useState('');
  const [newPortalLabelEn, setNewPortalLabelEn] = useState('');
  const [newPortalUrl, setNewPortalUrl] = useState('');
  const [newPortalRoleTag, setNewPortalRoleTag] = useState<'student' | 'admin' | 'teacher' | 'guardian'>('student');

  const userRole: AdminRole = currentUser?.role || 'Super Admin';
  const hasAccess = canAccessAdminResource(userRole, activeTab, state.rbacMatrix);
  const canEditActiveTab = hasRolePermission(userRole, activeTab, 'edit', state.rbacMatrix);
  const canDeleteActiveTab = hasRolePermission(userRole, activeTab, 'delete', state.rbacMatrix);

  // Sync forms when state updates or resets
  React.useEffect(() => {
    setSettingsForm(state.settings);
  }, [state.settings]);

  React.useEffect(() => {
    setPopupForm(state.popupConfig);
  }, [state.popupConfig]);

  React.useEffect(() => {
    setAiBotForm(state.aiBotConfig);
  }, [state.aiBotConfig]);

  React.useEffect(() => {
    setFeeCalcForm(state.feeCalculatorConfig);
  }, [state.feeCalculatorConfig]);

  const activeCourseObj =
    state.courses.find((c) => c.id === selectedCourseForModules) || state.courses[0];

  // Handlers for Notice CRUD
  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditActiveTab || !noticeTitle.trim()) return;
    if (editingNotice) {
      updateNotice({
        ...editingNotice,
        title: noticeTitle.trim(),
        category: noticeCategory,
        publishDate: noticeDate,
        description: noticeDesc.trim(),
        attachmentUrl: noticeAttachment.trim() || undefined,
      });
      setEditingNotice(null);
    } else {
      addNotice({
        title: noticeTitle.trim(),
        category: noticeCategory,
        publishDate: noticeDate,
        description: noticeDesc.trim(),
        attachmentUrl: noticeAttachment.trim() || undefined,
      });
    }
    setNoticeTitle('');
    setNoticeDesc('');
    setNoticeAttachment('');
  };

  const handleStartEditNotice = (n: NoticeItem) => {
    if (!canEditActiveTab) return;
    setEditingNotice(n);
    setNoticeTitle(n.title);
    setNoticeCategory(n.category);
    setNoticeDate(n.publishDate);
    setNoticeDesc(n.description);
    setNoticeAttachment(n.attachmentUrl || '');
  };

  // Handlers for Course CRUD
  const handleSaveCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditActiveTab || !courseTitle.trim()) return;
    if (editingCourse) {
      updateCourse({
        ...editingCourse,
        title: courseTitle.trim(),
        titleBn: courseTitleBn.trim() || undefined,
        category: courseCategory,
        duration: courseDuration,
        totalClasses: Number(courseTotalClasses) || 100,
        fee: courseFee,
        admissionFee: courseAdmissionFee,
        overview: courseOverview,
      });
      setEditingCourse(null);
    } else {
      addCourse({
        title: courseTitle.trim(),
        titleBn: courseTitleBn.trim() || undefined,
        category: courseCategory,
        duration: courseDuration,
        totalClasses: Number(courseTotalClasses) || 100,
        fee: courseFee,
        admissionFee: courseAdmissionFee,
        overview: courseOverview,
        modules: [],
      });
    }
    setCourseTitle('');
    setCourseTitleBn('');
    setCourseOverview('');
  };

  const handleStartEditCourse = (c: CourseItem) => {
    if (!canEditActiveTab) return;
    setEditingCourse(c);
    setCourseTitle(c.title);
    setCourseTitleBn(c.titleBn || '');
    setCourseCategory(c.category);
    setCourseDuration(c.duration);
    setCourseTotalClasses(c.totalClasses);
    setCourseFee(c.fee);
    setCourseAdmissionFee(c.admissionFee || '');
    setCourseOverview(c.overview);
  };

  // Handlers for Nested Class Modules inside a Course
  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditActiveTab || !activeCourseObj || !modTitle.trim()) return;
    const topicsArray = modTopicsText
      .split('\n')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingModuleId) {
      const updatedModules = activeCourseObj.modules.map((m) =>
        m.id === editingModuleId
          ? {
              ...m,
              moduleNumber: Number(modNumber) || 1,
              title: modTitle.trim(),
              lectureCount: Number(modLectures) || 10,
              topics: topicsArray.length ? topicsArray : ['Core concepts & practical practice'],
            }
          : m
      );
      updateCourse({ ...activeCourseObj, modules: updatedModules });
      setEditingModuleId(null);
    } else {
      const newModule: ClassModule = {
        id: `mod-${Date.now()}`,
        moduleNumber: Number(modNumber) || activeCourseObj.modules.length + 1,
        title: modTitle.trim(),
        lectureCount: Number(modLectures) || 12,
        topics: topicsArray.length ? topicsArray : ['Core concepts & practical practice'],
      };
      updateCourse({
        ...activeCourseObj,
        modules: [...activeCourseObj.modules, newModule],
      });
    }
    setModTitle('');
    setModTopicsText('');
    setModNumber(activeCourseObj.modules.length + 2);
  };

  const handleEditModule = (m: ClassModule) => {
    if (!canEditActiveTab) return;
    setEditingModuleId(m.id);
    setModNumber(m.moduleNumber);
    setModTitle(m.title);
    setModLectures(m.lectureCount);
    setModTopicsText(m.topics.join('\n'));
  };

  const handleDeleteModule = (modId: string) => {
    if (!canDeleteActiveTab || !activeCourseObj) return;
    updateCourse({
      ...activeCourseObj,
      modules: activeCourseObj.modules.filter((m) => m.id !== modId),
    });
  };

  // Handlers for Events CRUD
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditActiveTab || !evtTitle.trim()) return;
    if (editingEvent) {
      updateEvent({
        ...editingEvent,
        title: evtTitle.trim(),
        date: evtDate,
        time: evtTime,
        venue: evtVenue,
        type: evtType,
        description: evtDesc,
      });
      setEditingEvent(null);
    } else {
      addEvent({
        title: evtTitle.trim(),
        date: evtDate,
        time: evtTime,
        venue: evtVenue,
        type: evtType,
        description: evtDesc,
        registrationOpen: true,
      });
    }
    setEvtTitle('');
    setEvtDesc('');
  };

  // Handlers for User creation
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditActiveTab || !newUsername.trim() || !newUserFullName.trim()) return;
    // Same rules the server applies, checked here so a refused account is never shown as created.
    const username = newUsername.trim();
    const password = newUserPassword;
    const policy = validateNewPassword(password, username);
    const problem = state.users.some((u) => u.username.toLowerCase() === username.toLowerCase())
      ? tr('এই ইউজার আইডি ইতিমধ্যে ব্যবহৃত হচ্ছে।', 'This User ID is already in use.', 'اسم المستخدم هذا مستخدم بالفعل.')
      : policy.ok
        ? ''
        : policy.code === 'SAME_AS_USERNAME' || policy.code === 'CONTAINS_USERNAME'
          ? tr('পাসওয়ার্ডের ভেতরে ইউজার আইডি থাকতে পারবে না।', 'The password must not contain the User ID.', 'يجب ألا تحتوي كلمة المرور على اسم المستخدم.')
          : policy.code === 'TOO_COMMON'
            ? tr(
                'এই পাসওয়ার্ডটি খুব সহজ বা বহুল ব্যবহৃত। অনুগ্রহ করে অন্য একটি পাসওয়ার্ড দিন।',
                'This password is too common. Please choose a different one.',
                'كلمة المرور هذه شائعة جداً. يرجى اختيار كلمة أخرى.'
              )
            : policy.code === 'TOO_LONG'
              ? tr(
                  'পাসওয়ার্ডটি খুব দীর্ঘ; অনুগ্রহ করে আরও ছোট পাসওয়ার্ড দিন।',
                  'The password is too long; please choose a shorter one.',
                  'كلمة المرور طويلة جداً؛ يرجى اختيار كلمة أقصر.'
                )
              : tr(
                  `পাসওয়ার্ড কমপক্ষে ${toBengaliDigits(MIN_PASSWORD_LENGTH)} অক্ষরের হতে হবে এবং তাতে বর্ণ ও সংখ্যা দুটোই থাকতে হবে।`,
                  `The password must be at least ${MIN_PASSWORD_LENGTH} characters long and contain both letters and digits.`,
                  `يجب ألا تقل كلمة المرور عن ${MIN_PASSWORD_LENGTH} أحرف وأن تحتوي على أحرف وأرقام.`
                );
    setNewUserError(problem);
    if (problem) return;
    addAdminUser({
      username,
      password,
      fullName: newUserFullName.trim(),
      email: newUserEmail.trim() || `${newUsername.trim()}@maharatmadrasah.com`,
      role: newUserRole,
    });
    setNewUsername('');
    setNewUserPassword('');
    setNewUserFullName('');
    setNewUserEmail('');
  };

  interface NavItem {
    id: AdminTabId;
    label: string;
    icon: React.ElementType;
  }

  interface NavCategoryGroup {
    id: string;
    label: string;
    icon: React.ElementType;
    items: NavItem[];
  }

  const overviewItem: NavItem = {
    id: 'overview',
    label: tr('ড্যাশবোর্ড ওভারভিউ', 'Dashboard Overview', 'نظرة عامة على لوحة التحكم'),
    icon: LayoutDashboard,
  };

  const navCategories: NavCategoryGroup[] = [
    {
      id: 'admissions',
      label: tr('ভর্তি ও সিআরএম (Admissions & CRM)', 'Admissions & CRM', 'القبول وإدارة العملاء'),
      icon: Users,
      items: [
        {
          id: 'leads',
          label: tr('লিড টু অ্যাডমিশন (Lead to Admission)', 'Lead to Admission', 'مسار القبول (CRM)'),
          icon: Users,
        },
        {
          id: 'tokens',
          label: tr('এডমিশন টোকেন ২০২৭', 'Admission Token 2027', 'بطاقة القبول ٢٠٢٧'),
          icon: Receipt,
        },
        {
          id: 'virtual-office',
          label: tr('ভার্চুয়াল অফিস (Live Desk)', 'Virtual Office Live Desk', 'المكتب الافتراضي المباشر'),
          icon: Radio,
        },
        {
          id: 'popup-ai-fees',
          label: tr('পপআপ, এমএমএম এআই ও ফি ক্যালকুলেটর', 'Popup, MMM AI & Fees', 'النافذة والذكاء وحاسبة الرسوم'),
          icon: Bot,
        },
      ],
    },
    {
      id: 'academic',
      label: tr('একাডেমিক ও ক্যাম্পাস (Academics)', 'Academics & Campus', 'الأكاديميا والحرم'),
      icon: BookOpen,
      items: [
        {
          id: 'courses',
          label: tr('কারিকুলাম ও সিলেবাস', 'Curriculum & Syllabus', 'المناهج والمقررات'),
          icon: BookOpen,
        },
        {
          id: 'notices',
          label: tr('নোটিশ বোর্ড ম্যানেজার', 'Notice Board Manager', 'إدارة لوحة الإعلانات'),
          icon: FileText,
        },
        {
          id: 'events',
          label: tr('ইভেন্ট ও সেমিনার', 'Events & Seminars', 'الفعاليات والندوات'),
          icon: Calendar,
        },
        {
          id: 'calendar',
          label: tr('প্রাতিষ্ঠানিক ক্যালেন্ডার', 'Academic Calendar', 'التقويم المؤسسي'),
          icon: Calendar,
        },
        {
          id: 'madrasah-infographics',
          label: tr('মাদ্রাসা ইনফোগ্রাফিক, হিফজ ট্রি ও রুট', 'Infographics, Hifz Tree & Routes', 'الرسوم والمعلوماتية والنقل'),
          icon: Sparkles,
        },
      ],
    },
    {
      id: 'hr-career',
      label: tr('শিক্ষক, এইচআর ও ক্যারিয়ার (HR & Career)', 'HR, Faculty & Career', 'الموارد البشرية والتوظيف'),
      icon: Briefcase,
      items: [
        {
          id: 'career',
          label: tr('ক্যারিয়ার ও নিয়োগ ব্যবস্থাপনা', 'Career & Recruitment', 'الوظائف والتعيينات'),
          icon: Briefcase,
        },
        {
          id: 'leaves',
          label: tr('শিক্ষক ছুটি ও আবেদন', 'Teacher Leaves & A4 PDF', 'إجازات المعلمين'),
          icon: FileCheck2,
        },
      ],
    },
    {
      id: 'media',
      label: tr('ওয়েবসাইট ও মিডিয়া (Website & Media)', 'Website & Media', 'الموقع والوسائط'),
      icon: Video,
      items: [
        {
          id: 'videos',
          label: tr('মিডিয়া শোকেস (Media Showcase)', 'Media Showcase', 'معرض الوسائط'),
          icon: Video,
        },
        {
          id: 'blog',
          label: tr('ব্লগ ও আর্টিকেল ম্যানেজার', 'Blog & Articles Manager', 'إدارة المدونة والمقالات'),
          icon: Newspaper,
        },
        {
          id: 'news',
          label: tr('স্ক্রলিং নিউজ ম্যানেজার', 'Scrolling News Manager', 'إدارة شريط الأخبار'),
          icon: Megaphone,
        },
        {
          id: 'emails',
          label: tr('ইমেইল নোটিফিকেশন লগ', 'Email Notification Logs', 'سجلات إشعارات البريد'),
          icon: Mail,
        },
      ],
    },
    {
      id: 'admin',
      label: tr('প্রশাসন ও সিস্টেম (Administration)', 'Administration & System', 'الإدارة والنظام'),
      icon: Settings,
      items: [
        {
          id: 'ai-publisher',
          label: tr('AI স্মার্ট পাবলিশিং অ্যাসিস্ট্যান্ট', 'AI Smart Publishing Assistant', 'مساعد النشر الذكي AI'),
          icon: Wand2,
        },
        {
          id: 'branding',
          label: tr('ব্র্যান্ডিং, হেডার ও মোবাইল বার', 'Branding, Header & Mobile Bar', 'الهوية والشريط السفلي'),
          icon: Image,
        },
        {
          id: 'users',
          label: tr('ইউজার রোল ও RBAC', 'User Roles & RBAC', 'أدوار المستخدمين والصلاحيات'),
          icon: ShieldCheck,
        },
        {
          id: 'settings',
          label: tr('সাইট, ম্যাপ ও পেইজ সেটিংস', 'Site, Maps & Page Settings', 'إعدادات الموقع والخرائط'),
          icon: Settings,
        },
        {
          id: 'backup-ai',
          label: tr('ব্যাকআপ ও রিস্টোর', 'Backup & Restore', 'النسخ الاحتياطي والاستعادة'),
          icon: DatabaseBackup,
        },
        {
          id: 'releases',
          label: tr('ভার্সন ও রোলব্যাক', 'Version & Rollback', 'الإصدارات والاسترجاع'),
          icon: GitBranch,
        },
      ],
    },
  ];

  // Flat navItems for backwards compatibility
  const navItems: NavItem[] = [overviewItem, ...navCategories.flatMap((c) => c.items)];

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
    >
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-68 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex-col justify-between shrink-0 border-r border-slate-200 dark:border-slate-800 transition-colors">
        <div className="p-3.5 space-y-4 overflow-y-auto">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-white border border-purple-200 flex items-center justify-center text-purple-900 shrink-0 shadow-xs overflow-hidden p-0.5">
              {state.settings.secondaryLogoUrl || state.settings.logoUrl ? (
                <img
                  src={state.settings.secondaryLogoUrl || state.settings.logoUrl}
                  alt="MMM"
                  className="w-full h-full object-contain"
                />
              ) : (
                <GraduationCap className="w-5 h-5 text-purple-700" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-[#192f64] dark:text-white truncate">
                {tr(
                  state.settings.instituteNameBn || 'মাহারাত মডেল মাদ্রাসা',
                  state.settings.instituteName || 'Maharat Model Madrasah',
                  state.settings.instituteNameAr || 'مدرسة المهارات النموذجية'
                )}
              </div>
              <div className="text-[11px] text-[#005a6e] dark:text-[#5eead4] font-mono truncate">
                EIIN: {state.settings.eiinNumber || '140630'} · MC: {state.settings.madrasahCode || '21023'}
              </div>
            </div>
          </div>

          <nav aria-label="Admin Sidebar Navigation" className="space-y-2">
            {/* Top-Level Overview Item */}
            <button
              type="button"
              onClick={() => setActiveTab(overviewItem.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === overviewItem.id
                  ? 'bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-[#0a1738] dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span className="truncate">{overviewItem.label}</span>
              </div>
            </button>

            {/* Collapsible Dropdown Categories (Zero numeric badge pills per v2.2.0 cleanup) */}
            {navCategories.map((category) => {
              const CategoryIcon = category.icon;
              const hasActiveChild = category.items.some((i) => i.id === activeTab);
              const isCollapsed = collapsedCategories[category.id] === true && !hasActiveChild;

              return (
                <div
                  key={category.id}
                  className="rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-1.5 space-y-1"
                >
                  {/* Category Dropdown Toggle Header */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider text-[#192f64] dark:text-[#f0c95e] hover:bg-teal-50/70 dark:hover:bg-[#192f64]/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CategoryIcon className="w-3.5 h-3.5 text-[#005a6e] dark:text-[#5eead4] shrink-0" />
                      <span className="truncate">{category.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Category Children Items (Collapsible List) */}
                  {!isCollapsed && (
                    <div className="space-y-0.5 pt-0.5 pl-1 rtl:pr-1">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const isLocked = !canAccessAdminResource(userRole, item.id, state.rbacMatrix);
                        const isActive = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              isActive
                                ? 'bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white shadow-xs font-bold'
                                : isLocked
                                  ? 'text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-800 hover:text-[#0a1738] dark:hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                              <span className="truncate text-[11px] sm:text-xs">{item.label}</span>
                            </div>

                            {isLocked && (
                              <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Authenticated User Session Card (No Demo Role Switcher) */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2.5 bg-slate-50 dark:bg-slate-950/50">
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200/80 dark:border-slate-800 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                {tr('সক্রিয় সেশন (RBAC)', 'Authenticated Session', 'الجلسة النشطة')}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              {loc(currentUser?.fullName || 'Super Administrator')}
            </div>
            <div className="text-[11px] font-mono text-purple-800 dark:text-purple-300 truncate">
              @{currentUser?.username || 'admin'} · {localizeRole(userRole)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              logout();
              onSwitchToWebsite();
            }}
            className="w-full py-2 px-3 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{tr('লগআউট করুন', 'Sign Out', 'تسجيل الخروج')}</span>
          </button>

          {showAdminVersionBadge && (
            <div className="pt-1">
              <button
                type="button"
                data-testid="admin-dashboard-version"
                onClick={() => setIsReleaseNotesOpen(true)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer"
              >
                <span className="inline-flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3" />
                  <span>v{versionManagerConfig.activeVersion}</span>
                </span>
                <span className="text-[10px] font-sans font-bold text-[#005a6e] dark:text-[#f0c95e]">
                  {tr('আপডেট নোটিস', 'Release Notes', 'ملاحظات')}
                </span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer Navigation */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-72 max-w-[85vw] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col justify-between h-full z-10 shadow-2xl overflow-y-auto">
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {tr('MMM অ্যাডমিন', 'MMM Admin', 'إدارة المهارات')}
                    </div>
                    <div className="text-[10px] text-purple-700 dark:text-purple-300 font-mono">
                      {tr('রোল:', 'Role:', 'الدور:')} {localizeRole(userRole)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav aria-label="Mobile Admin Navigation" className="space-y-2">
                {/* Top-Level Overview */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(overviewItem.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === overviewItem.id
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    <span className="truncate">{overviewItem.label}</span>
                  </div>
                </button>

                {/* Categories (Mobile Sidebar — Zero numeric badge pills) */}
                {navCategories.map((category) => {
                  const CategoryIcon = category.icon;
                  const hasActiveChild = category.items.some((i) => i.id === activeTab);
                  const isCollapsed = collapsedCategories[category.id] === true && !hasActiveChild;

                  return (
                    <div
                      key={`mob-${category.id}`}
                      className="rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-1.5 space-y-1"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <CategoryIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          <span className="truncate">{category.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isCollapsed ? (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {!isCollapsed && (
                        <div className="space-y-0.5 pt-0.5 pl-1 rtl:pr-1">
                          {category.items.map((item) => {
                            const Icon = item.icon;
                            const isLocked = !canAccessAdminResource(userRole, item.id, state.rbacMatrix);
                            const isActive = activeTab === item.id;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setActiveTab(item.id);
                                  setIsMobileSidebarOpen(false);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                                    : isLocked
                                      ? 'text-slate-400 dark:text-slate-500'
                                      : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <Icon className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate text-xs">{item.label}</span>
                                </div>

                                {isLocked && (
                                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-950/70">
              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  onSwitchToWebsite();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Globe className="w-4 h-4" />
                <span>{tr('লাইভ ওয়েবসাইটে যান', 'Switch to Live Website', 'الانتقال إلى الموقع المباشر')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onSwitchToWebsite();
                }}
                className="w-full py-2 px-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{tr('লগআউট করুন', 'Sign Out', 'تسجيل الخروج')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Top Responsive Bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3 transition-colors shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              aria-label="Open Admin Menu"
              className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <span className="text-xs sm:text-sm font-extrabold text-[#192f64] dark:text-white truncate block">
                {tr('মাহারাত মডেল মাদ্রাসা', 'Maharat Model Madrasah', 'مدرسة المهارات النموذجية')} ·{' '}
                <span className="text-[#005a6e] dark:text-[#f0c95e]">
                  {navItems.find((i) => i.id === activeTab)?.label}
                </span>
              </span>
              <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-mono hidden sm:block truncate">
                {tr('সক্রিয় রোল:', 'Active Role:', 'الدور النشط:')} {localizeRole(userRole)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {storageMode === 'demo' && (
              <span
                data-testid="admin-demo-mode-badge"
                title={tr(
                  'ডেমো মোড: কোনো ডাটাবেস সংযুক্ত নেই, তাই পরিবর্তনগুলো সার্ভার রিস্টার্ট হলে মুছে যাবে। স্থায়ীভাবে সংরক্ষণের জন্য DATABASE_URL সেট করুন।',
                  'Demo Mode: no database is connected, so changes are lost when the server restarts. Set DATABASE_URL to persist data.',
                  'الوضع التجريبي: لا توجد قاعدة بيانات متصلة، لذا تُفقد التغييرات عند إعادة تشغيل الخادم. اضبط DATABASE_URL لحفظ البيانات.'
                )}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide shrink-0 cursor-help"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{tr('ডেমো মোড', 'Demo Mode', 'وضع تجريبي')}</span>
              </span>
            )}
            {liveSyncStatus.status === 'local-only' && (
              <span
                role="status"
                data-testid="admin-unsaved-badge"
                title={tr(
                  'সার্ভারের সাথে সংযোগ নেই। আপনার পরিবর্তনগুলো এই ব্রাউজারে আছে; সংযোগ ফিরে এলে স্বয়ংক্রিয়ভাবে সেভ হবে। ততক্ষণ ট্যাবটি বন্ধ করবেন না।',
                  'The server cannot be reached. Your changes are kept in this browser and will be saved automatically when the connection returns. Keep this tab open until then.',
                  'تعذر الوصول إلى الخادم. تغييراتك محفوظة في هذا المتصفح وستُحفظ تلقائياً عند عودة الاتصال. لا تغلق هذه النافذة حتى ذلك الحين.'
                )}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] sm:text-[11px] font-extrabold shrink-0 cursor-help"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">{tr('সংরক্ষণ বাকি আছে', 'Not saved yet', 'لم يُحفظ بعد')}</span>
              </span>
            )}
            <AccessibilityToolbar compact={true} />

            {/* Staff Personal Profile & Digital Signature Vault Trigger */}
            <button
              type="button"
              data-testid="admin-profile-btn"
              onClick={() => setIsProfileModalOpen(true)}
              className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
              title={tr('প্রোফাইল ও ডিজিটাল স্বাক্ষর ভল্ট', 'Profile & Digital Signature Vault', 'الملف الشخصي والتوقيع الرقمي')}
            >
              {currentUser?.photoUrl ? (
                <img
                  src={currentUser.photoUrl}
                  alt={currentUser.fullName}
                  className="w-6 h-6 rounded-full object-cover border border-[#005a6e]/40 shrink-0"
                />
              ) : (
                <UserCircle2 className="w-5 h-5 text-[#005a6e] dark:text-[#f0c95e] shrink-0" />
              )}
              <span className="hidden lg:inline max-w-[130px] truncate">
                {currentUser?.fullName || 'Super Admin'}
              </span>
            </button>

            <button
              type="button"
              data-testid="admin-change-password-btn"
              onClick={() => setIsChangePasswordOpen(true)}
              aria-label={tr('পাসওয়ার্ড পরিবর্তন করুন', 'Change Password', 'تغيير كلمة المرور')}
              title={tr('পাসওয়ার্ড পরিবর্তন করুন', 'Change Password', 'تغيير كلمة المرور')}
              className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#005a6e] dark:text-[#f0c95e] transition-colors cursor-pointer shrink-0"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onSwitchToWebsite}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#192f64] to-[#005a6e] hover:opacity-95 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#f0c95e]" />
              <span className="hidden sm:inline">
                {tr('লাইভ ওয়েবসাইটে যান', 'Switch to Live Website', 'الانتقال إلى الموقع المباشر')}
              </span>
              <span className="sm:hidden">{tr('ওয়েবসাইট', 'Website', 'الموقع')}</span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="p-3 sm:p-6 flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto [&_input]:dark:bg-slate-800 [&_input]:dark:border-slate-700 [&_input]:dark:text-slate-100 [&_select]:dark:bg-slate-800 [&_select]:dark:border-slate-700 [&_select]:dark:text-slate-100 [&_textarea]:dark:bg-slate-800 [&_textarea]:dark:border-slate-700 [&_textarea]:dark:text-slate-100 [&_label]:dark:text-slate-300">
          {!hasAccess ? (
            /* RBAC Permission Restricted Screen */
            <div className="max-w-xl mx-auto my-12 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 p-8 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {tr(
                  'অ্যাক্সেস সীমাবদ্ধ: RBAC পারমিশন প্রয়োজন',
                  'Access Restricted: RBAC Permission Required',
                  'الوصول مقيد: مطلوب صلاحية RBAC'
                )}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {tr(
                  `আপনার বর্তমান অ্যাকাউন্ট রোল হলো ${localizeRole(userRole)}। সুপার অ্যাডমিন কর্তৃক নির্ধারিত RBAC পারমিশন ম্যাট্রিক্স অনুযায়ী এই মডিউলটি দেখার অনুমতি আপনার নেই।`,
                  `Your current account role is ${localizeRole(userRole)}. According to the RBAC Permission Matrix configured by the Super Admin, your role does not have view access to this module.`,
                  `دور حسابك الحالي هو ${localizeRole(userRole)}. وفقاً لمصفوفة صلاحيات RBAC التي حددها المدير العام، لا يملك دورك صلاحية عرض هذه الوحدة.`
                )}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                >
                  {tr(
                    'ড্যাশবোর্ড ওভারভিউতে যান',
                    'Go to Dashboard Overview',
                    'الانتقال إلى نظرة عامة على لوحة التحكم'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold cursor-pointer"
                >
                  {tr(
                    'লগআউট করে অন্য রোলে লগইন করুন →',
                    'Sign Out to Authenticate as Another Role →',
                    'تسجيل الخروج للدخول بدور آخر ←'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Read-only RBAC Banner if user has View but not Edit permission */}
              {!canEditActiveTab && (
                <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-semibold">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {tr(
                        `রিড-অনলি মোড (${localizeRole(userRole)}): আপনার এই ট্যাবে শুধুমাত্র দেখার (View) অনুমতি রয়েছে, এডিট বা ডিলিট করার অনুমতি নেই।`,
                        `Read-Only Mode (${localizeRole(userRole)}): Your role has View permission on this module, but Edit/Delete actions are disabled by RBAC.`,
                        `وضع القراءة فقط (${localizeRole(userRole)}): يملك دورك صلاحية العرض فقط في هذه الوحدة، بينما تم تعطيل التعديل والحذف.`
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* TAB 1: DASHBOARD OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {tr('মোট কারিকুলাম ও কোর্স', 'Total Courses', 'إجمالي المناهج والدورات')}
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                        {state.courses.length}
                      </div>
                      <div className="text-xs text-purple-700 dark:text-purple-400 mt-1">
                        {state.courses.reduce((acc, c) => acc + c.modules.length, 0)}{' '}
                        {tr('সক্রিয় সিলেবাস মডিউল', 'Active Syllabus Modules', 'وحدات دراسية نشطة')}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {tr('শিক্ষক ছুটির আবেদন', 'Teacher Leave Requests', 'طلبات إجازات المعلمين')}
                      </div>
                      <div className="text-3xl font-extrabold text-purple-700 dark:text-purple-400 font-mono tabular-nums mt-1">
                        {(state.leaveRequests || []).length}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('leaves')}
                        className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline mt-1 cursor-pointer"
                      >
                        {(state.leaveRequests || []).filter((l) => l.status === 'Approved').length}{' '}
                        {tr(
                          'অনুমোদিত (A4 PDF ডাউনলোড) →',
                          'Approved (Download A4 PDF) →',
                          'معتمد (تحميل شهادة PDF) ←'
                        )}
                      </button>
                    </div>

                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {tr('নোটিশ, ইভেন্ট ও পরিবহন রুট', 'Notices, Events & Transport', 'الإعلانات والفعاليات والنقل')}
                      </div>
                      <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
                        {state.notices.length + state.events.length}
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('notices')}
                        className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline mt-1 cursor-pointer"
                      >
                        {state.notices.length} {tr('নোটিশ', 'Notices', 'إعلانات')} ·{' '}
                        {state.transportConfig?.routes?.length || 0}{' '}
                        {tr('পরিবহন রুট →', 'Transport Routes →', 'مسارات النقل ←')}
                      </button>
                    </div>

                    <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {tr('ভর্তি আবেদন ও জিজ্ঞাসা', 'Admission Leads & Inquiries', 'طلبات القبول والاستفسارات')}
                      </div>
                      <div className="text-3xl font-extrabold text-purple-700 dark:text-purple-400 font-mono tabular-nums mt-1">
                        {state.leads.length}
                      </div>
                      <div className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-mono">
                        {state.leads.filter((l) => l.status === 'Pending').length}{' '}
                        {tr('পেন্ডিং', 'Pending', 'قيد الانتظار')} · {state.emails.length}{' '}
                        {tr('ইমেইল প্রেরিত', 'Emails Sent', 'بريد مرسل')}
                      </div>
                    </div>
                  </div>

                  {/* Recharts Student Enrollment Trends Data Visualization */}
                  <EnrollmentTrendsChart />

                  {/* Quick Lead Pipeline Breakdown */}
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {tr(
                            'ভর্তি ফানেল স্ট্যাটাস বিশ্লেষণ (৮টি ধাপ)',
                            'Granular Admission Funnel Status Breakdown',
                            'تحليل مراحل القبول والتسجيل'
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {tr(
                            'ভর্তির ৮টি ধাপে শিক্ষার্থীদের রিয়েল-টাইম অবস্থান',
                            'Real-time distribution across all 8 admission stages',
                            'التوزيع الفوري عبر جميع مراحل القبول الثماني'
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab('leads')}
                        className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        {tr('সকল আবেদন দেখুন →', 'Manage All Leads →', 'إدارة جميع الطلبات ←')}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                      {LEAD_STATUS_OPTIONS.map((status) => {
                        const count = state.leads.filter((l) => l.status === status).length;
                        return (
                          <div
                            key={status}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-center"
                          >
                            <div className="text-xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
                              {count}
                            </div>
                            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5 leading-tight">
                              {localizeLeadStatus(status)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: ADMISSION TOKEN 2027 */}
              {activeTab === 'tokens' && <AdminAdmissionTokenTab />}

              {/* TAB: VIRTUAL OFFICE / HYBRID LIVE DESK */}
              {activeTab === 'virtual-office' && <AdminVirtualOfficeTab />}

              {/* TAB: INSTITUTIONAL ACADEMIC CALENDAR (GOOGLE SYNC) */}
              {activeTab === 'calendar' && <AdminCalendarTab />}

              {/* TAB: BLOG & ARTICLES + AUTOMATION WEBHOOK */}
              {activeTab === 'blog' && <AdminBlogTab />}

              {/* TAB: AI SMART PUBLISHING ASSISTANT */}
              {activeTab === 'ai-publisher' && <AdminAIPublisherTab />}

              {/* TAB: CAREER & RECRUITMENT PORTAL MANAGER */}
              {activeTab === 'career' && <AdminCareerTab />}

              {/* TAB: TEACHER LEAVE MANAGEMENT & A4 PDF */}
              {activeTab === 'leaves' && <AdminLeaveManagementTab />}

              {/* TAB: MADRASAH INFOGRAPHICS & TRANSPORT */}
              {activeTab === 'madrasah-infographics' && <AdminMadrasahInfographicsTab />}

              {/* TAB: MEDIA SHOWCASE */}
              {activeTab === 'videos' && <AdminVideosTab />}

              {/* TAB: BACKUP, RESTORE & SMART AUTO-FILL */}
              {activeTab === 'backup-ai' && <AdminBackupAndAITab />}

              {/* TAB: POPUP NOTICE, MMM AI AGENT & INTERACTIVE FEE CALCULATOR CMS */}
              {activeTab === 'popup-ai-fees' && (
                <div className="space-y-8">
                  {/* SECTION 1: ADMISSION PROMOTIONAL POPUP NOTICE CMS */}
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-fuchsia-100 dark:bg-fuchsia-950 text-fuchsia-700 dark:text-fuchsia-300 flex items-center justify-center">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            {tr(
                              '১. এডমিশন পপআপ নোটিশ কন্ট্রোল',
                              '1. Promotional Admission Popup Notice CMS',
                              '١. إدارة إشعار القبول المنبثق الترويجي'
                            )}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tr(
                              'ওয়েবসাইটে প্রবেশের সাথে সাথে যে প্রমোশনাল পপআপ ও কাউন্টডাউন টাইমার দেখায় তা পরিবর্তন করুন',
                              'Customize the promotional popup banner and countdown timer shown to visitors',
                              'تخصيص نافذة العروض المنبثقة ومؤقت العد التنازلي للزوار'
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            popupForm.enabled
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                          }`}
                        >
                          {popupForm.enabled
                            ? tr('● পপআপ চালু আছে', '● Popup Active on Website', '● النافذة المنبثقة مفعلة')
                            : tr('○ পপআপ বন্ধ রয়েছে', '○ Popup Disabled', '○ النافذة المنبثقة متوقفة')}
                        </span>
                        <button
                          type="button"
                          disabled={!canEditActiveTab}
                          onClick={() => {
                            const updated = { ...popupForm, enabled: !popupForm.enabled };
                            setPopupForm(updated);
                            updatePopupConfig(updated);
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-xs disabled:opacity-50 ${
                            popupForm.enabled
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {popupForm.enabled
                            ? tr('পপআপ বন্ধ করুন', 'Turn OFF Popup', 'إيقاف النافذة')
                            : tr('পপআপ চালু করুন', 'Turn ON Popup', 'تشغيل النافذة')}
                        </button>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!canEditActiveTab) return;
                        updatePopupConfig(popupForm);
                      }}
                      className="space-y-4 text-xs"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('উপরের ব্যাজ টেক্সট', 'Top Badge Text', 'نص الشارة العلوية')}
                          </label>
                          <input
                            type="text"
                            disabled={!canEditActiveTab}
                            value={loc(popupForm.badgeText)}
                            onChange={(e) =>
                              setPopupForm({ ...popupForm, badgeText: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('মূল শিরোনাম', 'Main Offer Headline', 'العنوان الرئيسي للعرض')}
                          </label>
                          <input
                            type="text"
                            disabled={!canEditActiveTab}
                            value={loc(popupForm.headline)}
                            onChange={(e) =>
                              setPopupForm({ ...popupForm, headline: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('হাইলাইট ডিসকাউন্ট টেক্সট', 'Highlight Discount Text', 'نص الخصم المميز')}
                          </label>
                          <input
                            type="text"
                            disabled={!canEditActiveTab}
                            value={loc(popupForm.discountText)}
                            onChange={(e) =>
                              setPopupForm({ ...popupForm, discountText: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('পপআপ বিস্তারিত বিবরণ', 'Popup Description Text', 'وصف النافذة المنبثقة')}
                        </label>
                        <textarea
                          rows={2}
                          disabled={!canEditActiveTab}
                          value={loc(popupForm.description)}
                          onChange={(e) =>
                            setPopupForm({ ...popupForm, description: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('কাউন্টডাউন দিন', 'Countdown Days', 'الأيام')}
                          </label>
                          <input
                            type="number"
                            disabled={!canEditActiveTab}
                            value={popupForm.countdownDays}
                            onChange={(e) =>
                              setPopupForm({
                                ...popupForm,
                                countdownDays: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('ঘণ্টা', 'Hours', 'الساعات')}
                          </label>
                          <input
                            type="number"
                            disabled={!canEditActiveTab}
                            value={popupForm.countdownHours}
                            onChange={(e) =>
                              setPopupForm({
                                ...popupForm,
                                countdownHours: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('মিনিট', 'Minutes', 'الدقائق')}
                          </label>
                          <input
                            type="number"
                            disabled={!canEditActiveTab}
                            value={popupForm.countdownMinutes}
                            onChange={(e) =>
                              setPopupForm({
                                ...popupForm,
                                countdownMinutes: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('সেকেন্ড', 'Seconds', 'الثواني')}
                          </label>
                          <input
                            type="number"
                            disabled={!canEditActiveTab}
                            value={popupForm.countdownSeconds}
                            onChange={(e) =>
                              setPopupForm({
                                ...popupForm,
                                countdownSeconds: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('বাটন টেক্সট (CTA)', 'CTA Button Text', 'نص زر الإجراء')}
                          </label>
                          <input
                            type="text"
                            disabled={!canEditActiveTab}
                            value={loc(popupForm.ctaText)}
                            onChange={(e) =>
                              setPopupForm({ ...popupForm, ctaText: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!canEditActiveTab}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {tr(
                            'পপআপ সেটিংস সংরক্ষণ করুন',
                            'Save Popup Notice Settings',
                            'حفظ إعدادات النافذة المنبثقة'
                          )}
                        </span>
                      </button>
                    </form>
                  </div>

                  {/* SECTION 2: NOOR AI ASSISTANT CHATBOT CMS */}
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                          <Bot className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            {tr(
                              '২. এমএমএম এআই এজেন্ট (MMM AI Agent) চ্যাটবট ও নলেজ বেস কন্ট্রোল',
                              '2. MMM AI Agent Chatbot & Knowledge Base CMS',
                              '٢. إدارة وكيل الذكاء الاصطناعي MMM AI وقاعدة المعرفة'
                            )}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tr(
                              'প্রতিষ্ঠানের বাইরে প্রশ্ন করলে ডিনাই মেসেজ, সতর্কতা এবং প্রতিষ্ঠানের তথ্যভান্ডার নিয়ন্ত্রণ করুন',
                              'Control out-of-scope refusal messages, warning limits, and custom institute knowledge base',
                              'التحكم في رسائل الرفض والتنبيهات وقاعدة المعرفة الخاصة بالمعهد'
                            )}
                          </p>
                        </div>
                      </div>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          disabled={!canEditActiveTab}
                          checked={aiBotForm.enabled}
                          onChange={(e) =>
                            setAiBotForm({ ...aiBotForm, enabled: e.target.checked })
                          }
                          className="w-4 h-4 accent-purple-600"
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {tr(
                            'ওয়েবসাইটে AI চ্যাটবট চালু রাখুন',
                            'Enable AI Chatbot on Website',
                            'تفعيل المساعد الذكي على الموقع'
                          )}
                        </span>
                      </label>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!canEditActiveTab) return;
                        updateAIBotConfig(aiBotForm);
                      }}
                      className="space-y-4 text-xs"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('বটের নাম', 'Bot Name', 'اسم المساعد')}
                          </label>
                          <input
                            type="text"
                            disabled={!canEditActiveTab}
                            value={loc(aiBotForm.botName)}
                            onChange={(e) =>
                              setAiBotForm({ ...aiBotForm, botName: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr(
                              'সর্বোচ্চ ওয়ার্নিং সংখ্যা (লক হওয়ার আগে)',
                              'Max Out-of-Scope Warnings Before Lock',
                              'الحد الأقصى للتنبيهات قبل القفل'
                            )}
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            disabled={!canEditActiveTab}
                            value={aiBotForm.maxWarnings}
                            onChange={(e) =>
                              setAiBotForm({
                                ...aiBotForm,
                                maxWarnings: Number(e.target.value) || 3,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr(
                              'কুলডাউন লক সময় (সেকেন্ড)',
                              'Cooldown Lock Duration (Seconds)',
                              'مدة القفل المؤقت (بالثواني)'
                            )}
                          </label>
                          <input
                            type="number"
                            min={10}
                            max={600}
                            disabled={!canEditActiveTab}
                            value={aiBotForm.cooldownSeconds}
                            onChange={(e) =>
                              setAiBotForm({
                                ...aiBotForm,
                                cooldownSeconds: Number(e.target.value) || 60,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr(
                              'বাইরের প্রশ্নের উত্তর (Refusal Reply)',
                              'Out-of-Scope Refusal Reply',
                              'رد رفض الأسئلة خارج النطاق'
                            )}
                          </label>
                          <textarea
                            rows={2}
                            disabled={!canEditActiveTab}
                            value={loc(aiBotForm.refusalMessage)}
                            onChange={(e) =>
                              setAiBotForm({ ...aiBotForm, refusalMessage: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr(
                              'সতর্কবার্তা টেমপ্লেট ({remaining} = বাকি সুযোগ)',
                              'Warning Box Template ({remaining} = chances left)',
                              'قالب رسالة التنبيه ({remaining} = الفرص المتبقية)'
                            )}
                          </label>
                          <textarea
                            rows={2}
                            disabled={!canEditActiveTab}
                            value={loc(aiBotForm.warningTemplate)}
                            onChange={(e) =>
                              setAiBotForm({
                                ...aiBotForm,
                                warningTemplate: e.target.value,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {tr(
                            'প্রতিষ্ঠানের কাস্টম তথ্যভান্ডার (Knowledge Base)',
                            'Institute Custom Knowledge Base',
                            'قاعدة المعرفة المخصصة للمعهد'
                          )}
                        </label>
                        <textarea
                          rows={3}
                          disabled={!canEditActiveTab}
                          value={loc(aiBotForm.customKnowledgeBase)}
                          onChange={(e) =>
                            setAiBotForm({
                              ...aiBotForm,
                              customKnowledgeBase: e.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                        />
                      </div>

                      {/* Suggested Quick Question Chips Organizer */}
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-extrabold text-[#0a1738] dark:text-[#f0c95e]">
                            {tr(
                              `কুইক সাজেস্টেড প্রশ্ন (Suggested Quick Chips — ${(aiBotForm.suggestedQuestions || []).length}টি)`,
                              `Suggested Quick Question Chips (${(aiBotForm.suggestedQuestions || []).length})`,
                              'الأسئلة السريعة المقترحة'
                            )}
                          </h3>
                          <span className="text-[11px] text-slate-500">
                            {tr('চ্যাটবট খুললেই ভিজিটররা এই প্রশ্নগুলো দেখতে পাবে', 'Shown immediately when chatbot opens', 'تظهر عند فتح المساعد')}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {(aiBotForm.suggestedQuestions || []).map((q, idx) => (
                            <div key={`sq-${idx}`} className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-[#192f64] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                disabled={!canEditActiveTab}
                                value={q}
                                onChange={(e) => {
                                  const next = [...(aiBotForm.suggestedQuestions || [])];
                                  next[idx] = e.target.value;
                                  setAiBotForm({ ...aiBotForm, suggestedQuestions: next });
                                }}
                                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold"
                              />
                              {canEditActiveTab && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() =>
                                      setAiBotForm({
                                        ...aiBotForm,
                                        suggestedQuestions: reorderSuggestedQuestions(
                                          aiBotForm.suggestedQuestions || [],
                                          idx,
                                          'up'
                                        ),
                                      })
                                    }
                                    className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                                    title="Move Up"
                                  >
                                    ↑
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === (aiBotForm.suggestedQuestions || []).length - 1}
                                    onClick={() =>
                                      setAiBotForm({
                                        ...aiBotForm,
                                        suggestedQuestions: reorderSuggestedQuestions(
                                          aiBotForm.suggestedQuestions || [],
                                          idx,
                                          'down'
                                        ),
                                      })
                                    }
                                    className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-bold disabled:opacity-40 cursor-pointer"
                                    title="Move Down"
                                  >
                                    ↓
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAiBotForm({
                                        ...aiBotForm,
                                        suggestedQuestions: (aiBotForm.suggestedQuestions || []).filter(
                                          (_, i) => i !== idx
                                        ),
                                      })
                                    }
                                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                    title="Delete Suggested Question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {canEditActiveTab && (
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              value={newSuggestedQ}
                              onChange={(e) => setNewSuggestedQ(e.target.value)}
                              placeholder={tr('নতুন সাজেস্টেড প্রশ্ন লিখুন (যেমন: পরিবহন ব্যবস্থা কি আছে?)...', 'Add new suggested quick question...', 'أضف سؤالاً سريعاً...')}
                              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!newSuggestedQ.trim()) return;
                                setAiBotForm({
                                  ...aiBotForm,
                                  suggestedQuestions: [
                                    ...(aiBotForm.suggestedQuestions || []),
                                    newSuggestedQ.trim(),
                                  ],
                                });
                                setNewSuggestedQ('');
                              }}
                              className="px-4 py-2 rounded-xl bg-[#005a6e] hover:bg-[#004454] text-white font-bold text-xs cursor-pointer shrink-0"
                            >
                              + {tr('প্রশ্ন যোগ করুন', 'Add Chip', 'إضافة')}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Custom Chatbot Q&A Knowledge Database Organizer */}
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-extrabold text-[#0a1738] dark:text-[#f0c95e]">
                            {tr(
                              `চ্যাটবট প্রশ্নোত্তর ডাটাবেস অর্গানাইজার (${(aiBotForm.qaItems || []).length}টি উত্তর)`,
                              `Chatbot Custom Q&A Database Organizer (${(aiBotForm.qaItems || []).length} Answers)`,
                              'قاعدة الأسئلة والأجوبة للمساعد الذكي'
                            )}
                          </h3>
                          <span className="text-[11px] text-slate-500">
                            {tr('কীওয়ার্ড মিললেই চ্যাটবট আপনার সাজানো উত্তরটি দেবে', 'Bot matches keywords and replies with your exact answer', 'يطابق الكلمات المفتاحية ويرد بإجابتك')}
                          </span>
                        </div>

                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                          {(aiBotForm.qaItems || []).map((qa) => (
                            <div
                              key={qa.id}
                              className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-[#005a6e]/40 text-[#005a6e] dark:text-[#5eead4] text-[10px] font-extrabold">
                                  {qa.category}
                                </span>
                                {canEditActiveTab && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAiBotForm({
                                        ...aiBotForm,
                                        qaItems: removeBotQAItem(aiBotForm.qaItems || [], qa.id),
                                      })
                                    }
                                    className="text-rose-500 hover:text-rose-700 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{tr('মুছুন', 'Delete', 'حذف')}</span>
                                  </button>
                                )}
                              </div>
                              <input
                                type="text"
                                disabled={!canEditActiveTab}
                                value={qa.question}
                                onChange={(e) =>
                                  setAiBotForm({
                                    ...aiBotForm,
                                    qaItems: upsertBotQAItem(aiBotForm.qaItems || [], {
                                      ...qa,
                                      question: e.target.value,
                                    }),
                                  })
                                }
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 font-bold text-xs"
                              />
                              <input
                                type="text"
                                disabled={!canEditActiveTab}
                                value={(qa.keywords || []).join(', ')}
                                onChange={(e) =>
                                  setAiBotForm({
                                    ...aiBotForm,
                                    qaItems: upsertBotQAItem(aiBotForm.qaItems || [], {
                                      ...qa,
                                      keywords: e.target.value
                                        .split(',')
                                        .map((k) => k.trim())
                                        .filter(Boolean),
                                    }),
                                  })
                                }
                                placeholder="Keywords (comma separated)..."
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 font-mono text-[11px]"
                              />
                              <textarea
                                rows={2}
                                disabled={!canEditActiveTab}
                                value={qa.answer}
                                onChange={(e) =>
                                  setAiBotForm({
                                    ...aiBotForm,
                                    qaItems: upsertBotQAItem(aiBotForm.qaItems || [], {
                                      ...qa,
                                      answer: e.target.value,
                                    }),
                                  })
                                }
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs"
                              />
                            </div>
                          ))}
                        </div>

                        {canEditActiveTab && (
                          <div className="p-3 rounded-xl border border-dashed border-[#005a6e]/40 bg-white dark:bg-slate-900 space-y-2">
                            <div className="text-[11px] font-extrabold text-[#005a6e] dark:text-[#5eead4]">
                              + {tr('নতুন চ্যাটবট প্রশ্নোত্তর যুক্ত করুন', 'Add New Chatbot Q&A Entry', 'إضافة سؤال وجواب جديد')}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={newQaCategory}
                                onChange={(e) => setNewQaCategory(e.target.value)}
                                placeholder={tr('ক্যাটাগরি (যেমন: পরিবহন)', 'Category', 'الفئة')}
                                className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs"
                              />
                              <input
                                type="text"
                                value={newQaQuestion}
                                onChange={(e) => setNewQaQuestion(e.target.value)}
                                placeholder={tr('প্রশ্ন লিখুন...', 'Question...', 'السؤال...')}
                                className="sm:col-span-2 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs font-bold"
                              />
                            </div>
                            <input
                              type="text"
                              value={newQaKeywords}
                              onChange={(e) => setNewQaKeywords(e.target.value)}
                              placeholder={tr('কীওয়ার্ডসমূহ কমা দিয়ে লিখুন (যেমন: পরিবহন, বাস, গাড়ি, transport, bus)', 'Comma-separated keywords (e.g. bus, transport, van)', 'الكلمات المفتاحية مفصولة بفاصلة')}
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 font-mono text-[11px]"
                            />
                            <div className="flex flex-col sm:flex-row gap-2">
                              <textarea
                                rows={2}
                                value={newQaAnswer}
                                onChange={(e) => setNewQaAnswer(e.target.value)}
                                placeholder={tr('চ্যাটবট যে উত্তরটি দেবে তা বিস্তারিত লিখুন...', 'Detailed chatbot answer...', 'الإجابة المفصلة...')}
                                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!newQaQuestion.trim() || !newQaAnswer.trim()) return;
                                  const nextQa = upsertBotQAItem(aiBotForm.qaItems || [], {
                                    id: `qa-custom-${Date.now()}`,
                                    category: newQaCategory.trim() || 'সাধারণ',
                                    question: newQaQuestion.trim(),
                                    keywords: newQaKeywords
                                      .split(',')
                                      .map((k) => k.trim())
                                      .filter(Boolean),
                                    answer: newQaAnswer.trim(),
                                  });
                                  setAiBotForm({ ...aiBotForm, qaItems: nextQa });
                                  setNewQaQuestion('');
                                  setNewQaKeywords('');
                                  setNewQaAnswer('');
                                }}
                                className="px-4 py-2 rounded-xl bg-[#005a6e] hover:bg-[#004454] text-white font-extrabold text-xs cursor-pointer shrink-0 self-end"
                              >
                                + {tr('উত্তর যুক্ত করুন', 'Add Q&A', 'إضافة')}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!canEditActiveTab}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#192f64] to-[#005a6e] hover:from-[#132654] hover:to-[#004454] text-white font-bold text-xs cursor-pointer disabled:opacity-50 shadow-sm"
                      >
                        <Save className="w-4 h-4 text-[#f0c95e]" />
                        <span>
                          {tr(
                            'AI বট কনফিগারেশন ও প্রশ্নোত্তর সংরক্ষণ করুন',
                            'Save AI Bot Config & Q&A Database',
                            'حفظ إعدادات المساعد الذكي'
                          )}
                        </span>
                      </button>
                    </form>
                  </div>

                  {/* SECTION 3: INTERACTIVE FEE & DISCOUNT CALCULATOR CMS */}
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                    <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                        <Calculator className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {tr(
                            '৩. ইন্টারঅ্যাক্টিভ ফি ও ছাড় ক্যালকুলেটর কন্ট্রোল',
                            '3. Interactive Fee & Discount Calculator CMS',
                            '٣. إدارة حاسبة الرسوم والخصومات التفاعلية'
                          )}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {tr(
                            'জেনারেল ও হিফজুল কুরআন বিভাগের শ্রেণিভিত্তিক ভর্তি ফি, মাসিক বেতন ও ছাড় কাস্টমাইজ করুন',
                            'Customize class-wise admission fees, monthly tuition, residential charges, and discount percentages',
                            'تخصيص رسوم القبول والرسوم الشهرية ورسوم السكن ونسب الخصم لكل صف'
                          )}
                        </p>
                      </div>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!canEditActiveTab) return;
                        updateFeeCalculatorConfig(feeCalcForm);
                      }}
                      className="space-y-5 text-xs"
                    >
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('অগ্রিম ছাড় (%)', 'Advance Discount (%)', 'خصم التسجيل المبكر (%)')}
                          </label>
                          <input
                            type="number"
                            disabled={!canEditActiveTab}
                            value={feeCalcForm.discount25Percent}
                            onChange={(e) =>
                              setFeeCalcForm({
                                ...feeCalcForm,
                                discount25Percent: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('বিশেষ ছাড় (%)', 'Special Discount (%)', 'خصم خاص (%)')}
                          </label>
                          <input
                            type="number"
                            disabled={!canEditActiveTab}
                            value={feeCalcForm.discount10Percent}
                            onChange={(e) =>
                              setFeeCalcForm({
                                ...feeCalcForm,
                                discount10Percent: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('অতিরিক্ত ছাড় (%)', 'Extra Discount (%)', 'خصم إضافي (%)')}
                          </label>
                          <input
                            type="number"
                            disabled={!canEditActiveTab}
                            value={feeCalcForm.discount5Percent}
                            onChange={(e) =>
                              setFeeCalcForm({
                                ...feeCalcForm,
                                discount5Percent: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('আবাসিক মাসিক ফি (৳)', 'Residential Monthly Fee (৳)', 'رسوم السكن الشهرية (৳)')}
                          </label>
                          <input
                            type="number"
                            disabled={!canEditActiveTab}
                            value={feeCalcForm.residentialMonthlyFee}
                            onChange={(e) =>
                              setFeeCalcForm({
                                ...feeCalcForm,
                                residentialMonthlyFee: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('ডে-কেয়ার মাসিক ফি (৳)', 'Day-Care Monthly Fee (৳)', 'رسوم الرعاية النهارية الشهرية (৳)')}
                          </label>
                          <input
                            type="number"
                            disabled={!canEditActiveTab}
                            value={feeCalcForm.dayCareMonthlyFee}
                            onChange={(e) =>
                              setFeeCalcForm({
                                ...feeCalcForm,
                                dayCareMonthlyFee: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300">
                              <th className="py-2.5 px-3">{tr('বিভাগ', 'Department', 'القسم')}</th>
                              <th className="py-2.5 px-3">
                                {tr('শ্রেণি / লেভেল', 'Class / Level Name', 'الصف / المستوى')}
                              </th>
                              <th className="py-2.5 px-3">
                                {tr('ভর্তি ফি (৳)', 'Admission Fee (৳)', 'رسوم القبول (৳)')}
                              </th>
                              <th className="py-2.5 px-3">
                                {tr('মাসিক বেতন (৳)', 'Monthly Fee (৳)', 'الرسوم الشهرية (৳)')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {feeCalcForm.items.map((item, idx) => (
                              <tr key={item.id}>
                                <td className="py-2 px-3 font-mono font-bold text-purple-700 dark:text-purple-300">
                                  {item.department === 'General'
                                    ? tr('জেনারেল (Academic)', 'General (Academic)', 'العام (أكاديمي)')
                                    : tr('হিফজুল কুরআন (Hifz)', 'Hifzul Quran (Hifz)', 'تحفيظ القرآن')}
                                </td>
                                <td className="py-2 px-3 font-semibold">
                                  {language === 'en' ? item.classNameEn || loc(item.classNameBn) : loc(item.classNameBn)}
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    disabled={!canEditActiveTab}
                                    value={item.admissionFee}
                                    onChange={(e) => {
                                      const next = [...feeCalcForm.items];
                                      next[idx] = {
                                        ...item,
                                        admissionFee: Number(e.target.value) || 0,
                                      };
                                      setFeeCalcForm({ ...feeCalcForm, items: next });
                                    }}
                                    className="w-28 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-mono"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    disabled={!canEditActiveTab}
                                    value={item.monthlyTuition}
                                    onChange={(e) => {
                                      const next = [...feeCalcForm.items];
                                      next[idx] = {
                                        ...item,
                                        monthlyTuition: Number(e.target.value) || 0,
                                      };
                                      setFeeCalcForm({ ...feeCalcForm, items: next });
                                    }}
                                    className="w-28 rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-mono"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        type="submit"
                        disabled={!canEditActiveTab}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>
                          {tr(
                            'ফি ক্যালকুলেটর কনফিগারেশন সংরক্ষণ করুন',
                            'Save Fee Calculator Configuration',
                            'حفظ إعدادات حاسبة الرسوم'
                          )}
                        </span>
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: ADMISSION LEADS & EDUCATIONAL CRM PIPELINE */}
              {activeTab === 'leads' && (
                <AdminLeadsCRMTab
                  onInspectLead={setInspectingLead}
                  canEdit={canEditActiveTab}
                  canDelete={canDeleteActiveTab}
                />
              )}

              {/* TAB 3: EMAIL NOTIFICATION LOGS */}
              {activeTab === 'emails' && (
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {tr(
                        `স্বয়ংক্রিয় ইমেইল নোটিফিকেশন লগ (${state.emails.length})`,
                        `Automated Email Notification Outbox (${state.emails.length})`,
                        `سجل إشعارات البريد الإلكتروني التلقائية (${state.emails.length})`
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {tr(
                        `প্রতিটি নতুন আবেদন অ্যাডমিনকে (${state.settings.email}) জানায় এবং স্ট্যাটাস পরিবর্তন হলে শিক্ষার্থীকে ইমেইল পাঠায়।`,
                        `Every new public inquiry notifies the Admin (${state.settings.email}), and every status update notifies the Student.`,
                        `كل استفسار جديد يرسل إشعاراً للمدير (${state.settings.email})، وكل تحديث للحالة يخطر الطالب.`
                      )}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {state.emails.map((eml) => (
                      <div
                        key={eml.id}
                        className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-4 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {loc(eml.subject)}
                          </div>
                          <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                            {eml.status} · {eml.sentAt}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                          {tr('প্রাপক', 'Recipient', 'المستلم')} ({eml.recipientType}):{' '}
                          <strong>{eml.recipientEmail}</strong> ({loc(eml.recipientName)}) ·{' '}
                          {tr('ইভেন্ট:', 'Trigger:', 'الحدث:')} {eml.triggerEvent}
                        </div>
                        <pre className="text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-lg p-3 whitespace-pre-wrap font-sans leading-relaxed">
                          {loc(eml.body)}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SCROLLING NEWS MANAGER */}
              {activeTab === 'news' && (
                <div className="space-y-6">
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {tr(
                        'স্ক্রলিং নিউজ টিকার ম্যানেজার (Marquee)',
                        'Scrolling News Ticker Manager (Marquee)',
                        'إدارة شريط الأخبار المتحرك (Marquee)'
                      )}
                    </h2>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!canEditActiveTab || !newTickerText.trim()) return;
                        addNews(newTickerText);
                        setNewTickerText('');
                      }}
                      className="flex flex-col sm:flex-row gap-3"
                    >
                      <input
                        type="text"
                        disabled={!canEditActiveTab}
                        value={newTickerText}
                        onChange={(e) => setNewTickerText(e.target.value)}
                        placeholder={tr(
                          'নতুন স্ক্রলিং ব্রেকিং নিউজ বা ভর্তি বিজ্ঞপ্তি লিখুন...',
                          'Enter new scrolling breaking news or admission alert...',
                          'أدخل خبراً عاجلاً أو إعلان قبول جديداً للشريط المتحرك...'
                        )}
                        className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:border-purple-600 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!canEditActiveTab}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{tr('নিউজ যুক্ত করুন', 'Add News Ticker', 'إضافة خبر')}</span>
                      </button>
                    </form>

                    <div className="divide-y divide-slate-200 dark:divide-slate-800 pt-2">
                      {state.news.map((item) => (
                        <div
                          key={item.id}
                          className="py-3.5 flex items-center justify-between gap-4 text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {loc(item.text)}
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 font-mono">
                              {tr('তৈরি:', 'Created:', 'تاريخ الإنشاء:')} {item.createdAt} ·{' '}
                              {item.active
                                ? tr('টপ বারে সক্রিয়', 'Active on Top Bar', 'نشط في الشريط العلوي')
                                : tr('লুকানো / নিষ্ক্রিয়', 'Inactive / Hidden', 'غير نشط / مخفي')}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={!canEditActiveTab}
                              onClick={() => toggleNews(item.id)}
                              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                                item.active
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {item.active
                                ? tr('সক্রিয়', 'Active', 'نشط')
                                : tr('নিষ্ক্রিয়', 'Inactive', 'غير نشط')}
                            </button>
                            {canDeleteActiveTab && (
                              <button
                                type="button"
                                onClick={() => deleteNews(item.id)}
                                aria-label="Delete ticker item"
                                className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: NOTICE BOARD MANAGER */}
              {activeTab === 'notices' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 h-fit">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {editingNotice
                        ? tr('নোটিশ সম্পাদনা করুন', 'Edit Notice', 'تعديل الإعلان')
                        : tr('নতুন নোটিশ প্রকাশ করুন', 'Publish New Notice', 'نشر إعلان جديد')}
                    </h2>
                    <form onSubmit={handleSaveNotice} className="space-y-3.5 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('নোটিশের শিরোনাম *', 'Notice Title *', 'عنوان الإعلان *')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={noticeTitle}
                          onChange={(e) => setNoticeTitle(e.target.value)}
                          placeholder={tr('নোটিশের শিরোনাম...', 'Enter notice title...', 'أدخل عنوان الإعلان...')}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('ক্যাটাগরি', 'Category', 'الفئة')}
                          </label>
                          <select
                            disabled={!canEditActiveTab}
                            value={noticeCategory}
                            onChange={(e) => setNoticeCategory(e.target.value as NoticeCategory)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                          >
                            <option value="Admission">{tr('ভর্তি (Admission)', 'Admission', 'القبول')}</option>
                            <option value="Exam">{tr('পরীক্ষা (Exam)', 'Exam', 'الامتحانات')}</option>
                            <option value="Academic">{tr('একাডেমিক (Academic)', 'Academic', 'أكاديمي')}</option>
                            <option value="Holiday">{tr('ছুটি (Holiday)', 'Holiday', 'عطلة')}</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('প্রকাশের তারিখ', 'Publish Date', 'تاريخ النشر')}
                          </label>
                          <input
                            type="date"
                            disabled={!canEditActiveTab}
                            value={noticeDate}
                            onChange={(e) => setNoticeDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('বিস্তারিত বিবরণ *', 'Full Description *', 'التفاصيل الكاملة *')}
                        </label>
                        <textarea
                          rows={4}
                          disabled={!canEditActiveTab}
                          value={noticeDesc}
                          onChange={(e) => setNoticeDesc(e.target.value)}
                          placeholder={tr('বিস্তারিত নোটিশ লিখুন...', 'Write full notice details...', 'اكتب تفاصيل الإعلان...')}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('সংযুক্ত PDF লিংক (ঐচ্ছিক)', 'Attachment PDF URL (Optional)', 'رابط ملف PDF المرفق (اختياري)')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={noticeAttachment}
                          onChange={(e) => setNoticeAttachment(e.target.value)}
                          placeholder="/assets/maharat/maharat-prospectus-2026.pdf"
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={!canEditActiveTab}
                          className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer disabled:opacity-50"
                        >
                          {editingNotice
                            ? tr('নোটিশ আপডেট করুন', 'Update Notice', 'تحديث الإعلان')
                            : tr('নোটিশ প্রকাশ করুন', 'Publish Notice', 'نشر الإعلان')}
                        </button>
                        {editingNotice && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNotice(null);
                              setNoticeTitle('');
                              setNoticeDesc('');
                            }}
                            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                          >
                            {tr('বাতিল', 'Cancel', 'إلغاء')}
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {tr(
                        `প্রকাশিত নোটিশসমূহ (${state.notices.length})`,
                        `Published Notices (${state.notices.length})`,
                        `الإعلانات المنشورة (${state.notices.length})`
                      )}
                    </h2>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {state.notices.map((n) => (
                        <div key={n.id} className="py-3.5 flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="text-xs font-mono text-purple-700 dark:text-purple-400">
                              {n.category} · {n.publishDate}
                            </div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {loc(n.title)}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                              {loc(n.description)}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {canEditActiveTab && (
                              <button
                                type="button"
                                onClick={() => handleStartEditNotice(n)}
                                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                aria-label={`Edit ${n.title}`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteActiveTab && (
                              <button
                                type="button"
                                onClick={() => deleteNotice(n.id)}
                                className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                                aria-label={`Delete ${n.title}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: CURRICULUM & ACADEMIC SYLLABUS */}
              {activeTab === 'courses' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 h-fit">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {editingCourse
                          ? tr('কারিকুলাম বা শ্রেণি বিবরণ পরিবর্তন', 'Edit Curriculum / Program', 'تعديل المنهج أو البرنامج')
                          : tr('নতুন কারিকুলাম / একাডেমিক বিভাগ যুক্ত করুন', 'Add New Curriculum / Academic Program', 'إضافة منهج أو قسم أكاديمي جديد')}
                      </h2>
                      <form onSubmit={handleSaveCourse} className="space-y-3 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('কোর্সের শিরোনাম (ইংরেজি) *', 'Course Title (English) *', 'عنوان البرنامج (بالإنجليزية) *')}
                          </label>
                          <input
                            type="text"
                            disabled={!canEditActiveTab}
                            value={courseTitle}
                            onChange={(e) => setCourseTitle(e.target.value)}
                            placeholder="e.g. Class Nine Vocational Track"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('কোর্সের সাবটাইটেল (বাংলা)', 'Course Subtitle (Bengali)', 'العنوان الفرعي (بالبنغالية)')}
                          </label>
                          <input
                            type="text"
                            disabled={!canEditActiveTab}
                            value={courseTitleBn}
                            onChange={(e) => setCourseTitleBn(e.target.value)}
                            placeholder={tr('বাংলা শিরোনাম...', 'Bengali subtitle...', 'العنوان الفرعي...')}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              {tr('বিভাগ (Category)', 'Category', 'الفئة')}
                            </label>
                            <select
                              disabled={!canEditActiveTab}
                              value={courseCategory}
                              onChange={(e) =>
                                setCourseCategory(e.target.value as CourseCategory)
                              }
                              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white"
                            >
                              <option value="Academic">Academic</option>
                              <option value="Hifzul Quran">Hifzul Quran</option>
                              <option value="IT Skills">IT Skills</option>
                              <option value="Soft & Hard Skills">Soft &amp; Hard Skills</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              {tr('মেয়াদ (Duration)', 'Duration', 'المدة')}
                            </label>
                            <input
                              type="text"
                              disabled={!canEditActiveTab}
                              value={courseDuration}
                              onChange={(e) => setCourseDuration(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              {tr('মোট ক্লাস', 'Total Classes', 'إجمالي الحصص')}
                            </label>
                            <input
                              type="number"
                              disabled={!canEditActiveTab}
                              value={courseTotalClasses}
                              onChange={(e) => setCourseTotalClasses(Number(e.target.value))}
                              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              {tr('মাসিক বেতন', 'Monthly Fee', 'الرسوم الشهرية')}
                            </label>
                            <input
                              type="text"
                              disabled={!canEditActiveTab}
                              value={courseFee}
                              onChange={(e) => setCourseFee(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              {tr('ভর্তি ফি', 'Admission Fee', 'رسوم القبول')}
                            </label>
                            <input
                              type="text"
                              disabled={!canEditActiveTab}
                              value={courseAdmissionFee}
                              onChange={(e) => setCourseAdmissionFee(e.target.value)}
                              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('কোর্সের বিবরণ', 'Course Overview', 'نظرة عامة على البرنامج')}
                          </label>
                          <textarea
                            rows={3}
                            disabled={!canEditActiveTab}
                            value={courseOverview}
                            onChange={(e) => setCourseOverview(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={!canEditActiveTab}
                            className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer disabled:opacity-50"
                          >
                            {editingCourse
                              ? tr('পরিবর্তন সংরক্ষণ করুন', 'Save Course Changes', 'حفظ التعديلات')
                              : tr('কোর্স যুক্ত করুন', 'Add Course', 'إضافة البرنامج')}
                          </button>
                          {editingCourse && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCourse(null);
                                setCourseTitle('');
                                setCourseOverview('');
                              }}
                              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
                            >
                              {tr('বাতিল', 'Cancel', 'إلغاء')}
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {tr(
                          `সক্রিয় কারিকুলাম (${state.courses.length}) — সিলেবাস সম্পাদনা করতে "মডিউল ম্যানেজ" ক্লিক করুন`,
                          `Active Courses (${state.courses.length}) — Click "Manage Modules" to edit Syllabus`,
                          `البرامج النشطة (${state.courses.length}) — انقر على "إدارة الوحدات" لتعديل المنهج`
                        )}
                      </h2>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {state.courses.map((c) => (
                          <div
                            key={c.id}
                            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div>
                              <div className="text-xs font-mono text-purple-700 dark:text-purple-400">
                                {c.category} · {loc(c.fee)} · {c.modules.length}{' '}
                                {tr('মডিউল', 'Modules', 'وحدات')}
                              </div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">
                                {loc(c.title)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedCourseForModules(c.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                                  activeCourseObj?.id === c.id
                                    ? 'bg-purple-700 text-white'
                                    : 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:bg-purple-100'
                                }`}
                              >
                                {tr('মডিউল ম্যানেজ', 'Manage Modules', 'إدارة الوحدات')} ({c.modules.length})
                              </button>
                              {canEditActiveTab && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditCourse(c)}
                                  className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              )}
                              {canDeleteActiveTab && (
                                <button
                                  type="button"
                                  onClick={() => deleteCourse(c.id)}
                                  className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {activeCourseObj && (
                    <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-200 dark:border-purple-800/70 p-6 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                            {tr(
                              'নেস্টেড বিষয়ভিত্তিক সিলেবাস ও ক্লাস মডিউল বিল্ডার',
                              'Nested Subject-Wise Class Module Builder',
                              'منشئ الوحدات الدراسية والموضوعات الفرعية'
                            )}
                          </div>
                          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                            {tr('সিলেবাস:', 'Syllabus for:', 'المنهج الدراسي لـ:')}{' '}
                            {loc(activeCourseObj.title)}
                          </h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <form
                          onSubmit={handleSaveModule}
                          className="lg:col-span-5 space-y-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 h-fit"
                        >
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {editingModuleId
                              ? tr('ক্লাস মডিউল সম্পাদনা', 'Edit Class Module', 'تعديل الوحدة الدراسية')
                              : tr('নতুন বিষয় / মডিউল যুক্ত করুন', 'Add Subject Class Module', 'إضافة وحدة دراسية جديدة')}
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                {tr('মডিউল নং', 'Module No.', 'رقم الوحدة')}
                              </label>
                              <input
                                type="number"
                                disabled={!canEditActiveTab}
                                value={modNumber}
                                onChange={(e) => setModNumber(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">
                                {tr('লেকচার সংখ্যা', 'Lecture Count', 'عدد المحاضرات')}
                              </label>
                              <input
                                type="number"
                                disabled={!canEditActiveTab}
                                value={modLectures}
                                onChange={(e) => setModLectures(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              {tr('বিষয় / মডিউলের নাম *', 'Subject / Module Title *', 'عنوان المادة / الوحدة *')}
                            </label>
                            <input
                              type="text"
                              disabled={!canEditActiveTab}
                              value={modTitle}
                              onChange={(e) => setModTitle(e.target.value)}
                              placeholder={tr('যেমন: তাজবীদসহ কুরআন শিক্ষা', 'e.g. Quran with Tajweed', 'مثال: القرآن الكريم بالتجويد')}
                              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              {tr('পাঠ্য বিষয়সমূহ (প্রতি লাইনে একটি)', 'Topics Covered (One topic per line)', 'الموضوعات المشمولة (موضوع في كل سطر)')}
                            </label>
                            <textarea
                              rows={3}
                              disabled={!canEditActiveTab}
                              value={modTopicsText}
                              onChange={(e) => setModTopicsText(e.target.value)}
                              placeholder={'Topic 1\nTopic 2\nTopic 3'}
                              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm bg-white"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={!canEditActiveTab}
                            className="w-full py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer disabled:opacity-50"
                          >
                            {editingModuleId
                              ? tr('মডিউল আপডেট করুন', 'Update Module', 'تحديث الوحدة')
                              : tr('+ কোর্সে মডিউল যুক্ত করুন', '+ Add Module to Course', '+ إضافة الوحدة إلى البرنامج')}
                          </button>
                        </form>

                        <div className="lg:col-span-7 space-y-3">
                          {activeCourseObj.modules.map((m) => (
                            <div
                              key={m.id}
                              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4"
                            >
                              <div className="space-y-1.5">
                                <div className="text-sm font-bold text-slate-900 dark:text-white">
                                  {tr('মডিউল', 'Module', 'الوحدة')} {m.moduleNumber}: {loc(m.title)}{' '}
                                  <span className="text-xs font-mono text-purple-700 dark:text-purple-400">
                                    ({m.lectureCount} {tr('লেকচার', 'Lectures', 'محاضرة')})
                                  </span>
                                </div>
                                <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc pl-4 space-y-0.5">
                                  {m.topics.map((t, idx) => (
                                    <li key={idx}>{loc(t)}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {canEditActiveTab && (
                                  <button
                                    type="button"
                                    onClick={() => handleEditModule(m)}
                                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                )}
                                {canDeleteActiveTab && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteModule(m.id)}
                                    className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: EVENTS MANAGER */}
              {activeTab === 'events' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 h-fit">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {editingEvent
                        ? tr('ইভেন্ট সম্পাদনা করুন', 'Edit Event', 'تعديل الفعالية')
                        : tr('নতুন ইভেন্ট বা সেমিনার যুক্ত করুন', 'Add Upcoming Event / Seminar', 'إضافة فعالية أو ندوة قادمة')}
                    </h2>
                    <form onSubmit={handleSaveEvent} className="space-y-3 text-xs">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('ইভেন্টের নাম *', 'Event Title *', 'عنوان الفعالية *')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={evtTitle}
                          onChange={(e) => setEvtTitle(e.target.value)}
                          placeholder={tr('সেমিনার বা ইভেন্টের নাম...', 'Enter event or seminar title...', 'أدخل عنوان الفعالية أو الندوة...')}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('তারিখ', 'Date', 'التاريخ')}
                          </label>
                          <input
                            type="date"
                            disabled={!canEditActiveTab}
                            value={evtDate}
                            onChange={(e) => setEvtDate(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('সময়', 'Time', 'الوقت')}
                          </label>
                          <input
                            type="text"
                            disabled={!canEditActiveTab}
                            value={evtTime}
                            onChange={(e) => setEvtTime(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('স্থান (Venue)', 'Venue', 'المكان')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={evtVenue}
                          onChange={(e) => setEvtVenue(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('বিস্তারিত বিবরণ', 'Description', 'التفاصيل')}
                        </label>
                        <textarea
                          rows={3}
                          disabled={!canEditActiveTab}
                          value={evtDesc}
                          onChange={(e) => setEvtDesc(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!canEditActiveTab}
                        className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer disabled:opacity-50"
                      >
                        {editingEvent
                          ? tr('ইভেন্ট আপডেট করুন', 'Update Event', 'تحديث الفعالية')
                          : tr('ইভেন্ট প্রকাশ করুন', 'Publish Event', 'نشر الفعالية')}
                      </button>
                    </form>
                  </div>

                  <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {tr(
                        `নির্ধারিত ইভেন্টসমূহ (${state.events.length})`,
                        `Scheduled Events (${state.events.length})`,
                        `الفعاليات المجدولة (${state.events.length})`
                      )}
                    </h2>
                    <div className="divide-y divide-slate-200 dark:divide-slate-800">
                      {state.events.map((e) => (
                        <div key={e.id} className="py-3.5 flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs font-mono text-purple-700 dark:text-purple-400">
                              {e.type} · {e.date} · {e.time}
                            </div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                              {loc(e.title)}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {loc(e.venue)}
                            </div>
                          </div>
                          {canDeleteActiveTab && (
                            <button
                              type="button"
                              onClick={() => deleteEvent(e.id)}
                              className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 7.5: BRANDING & PERSISTENT GLOBAL HEADER LOGO VAULT */}
              {activeTab === 'branding' && (
                <div className="space-y-6">
                  {/* Top Banner */}
                  <div className="bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#2e0249] text-white rounded-2xl p-6 shadow-xl border border-purple-500/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-purple-950 text-xs font-black uppercase tracking-wider">
                        <Image className="w-3.5 h-3.5" />
                        <span>
                          {tr(
                            'প্রতিষ্ঠানের ব্র্যান্ডিং ও গ্লোবাল হেডার লোগো ভল্ট',
                            'Institutional Branding & Global Header Logo Vault',
                            'الهوية المؤسسية وخزنة الشعارات الرسمية'
                          )}
                        </span>
                      </span>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                        {tr(
                          'লোগো আপলোড, সংরক্ষণ ও ওয়েবসাইটের সকল হেডারে গ্লোবাল পারসিস্টেন্স',
                          'Upload, Store & Persist Official Logos Globally Across All Website Headers',
                          'رفع وحفظ وتطبيق الشعارات الرسمية عبر جميع ترويسات الموقع'
                        )}
                      </h2>
                      <p className="text-xs sm:text-sm text-purple-200 max-w-3xl">
                        {tr(
                          'এখান থেকে নতুন লোগো ইমেজ আপলোড করে লোগো ভল্টে সংরক্ষণ করুন এবং ১-ক্লিকে ওয়েবসাইটের মেইন হেডার, মোবাইল মেনু, অ্যাডমিন পোর্টাল ও A4 প্যাডে স্থায়ীভাবে সেট করুন।',
                          'Upload and store multiple brand logos in the persistent vault, select your active primary banner logo and compact emblem, and customize global header dimensions.',
                          'قم برفع وحفظ شعارات المعهد في الخزنة الدائمة وتطبيقها فوراً على ترويسة الموقع ولوحة التحكم والمستندات.'
                        )}
                      </p>
                    </div>
                    <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-center shrink-0">
                      <div className="text-2xl font-black text-amber-300 font-mono">
                        {(state.settings.storedLogos || []).length}
                      </div>
                      <div className="text-[11px] font-bold text-purple-200">
                        {tr('সংরক্ষিত লোগো (Stored Logos)', 'Stored Logos in Vault', 'الشعارات المحفوظة')}
                      </div>
                    </div>
                  </div>

                  {brandingFeedback && (
                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 px-4 py-3 text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                      <span>✓ {brandingFeedback}</span>
                      <button
                        type="button"
                        onClick={() => setBrandingFeedback(null)}
                        className="text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                      >
                        {tr('বন্ধ করুন', 'Dismiss', 'إغلاق')}
                      </button>
                    </div>
                  )}

                  {/* Live Global Website Header Preview */}
                  <div className="rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 p-6 space-y-4 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {tr(
                            'গ্লোবাল ওয়েবসাইট হেডার লাইভ প্রিভিউ (Global Header Persistence Preview)',
                            'Live Global Website Header Persistence Preview',
                            'معاينة مباشرة لترويسة الموقع العام'
                          )}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {tr(
                            'নিচের প্রিভিউতে দেখুন পাবলিক ওয়েবসাইটের স্টিকি হেডার ও অ্যাডমিন হেডারে আপনার নির্বাচিত লোগো কেমন দেখাচ্ছে।',
                            'Real-time preview of how your active stored logo renders across the public website sticky header and navigation bar.',
                            'معاينة فورية لكيفية ظهور الشعار النشط في ترويسة الموقع العام.'
                          )}
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200">
                        Mode: {settingsForm.headerLogoDisplayMode || 'banner-only'} · Height:{' '}
                        {settingsForm.headerLogoHeightPx || 48}px
                      </span>
                    </div>

                    {/* Simulated Public Website Header */}
                    <div className="rounded-2xl border-2 border-purple-200 dark:border-purple-800/80 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {(settingsForm.headerLogoDisplayMode || 'banner-only') !== 'text-only' &&
                          settingsForm.logoUrl && (
                            <img
                              src={settingsForm.logoUrl}
                              alt={settingsForm.instituteNameBn || settingsForm.instituteName}
                              style={{ height: `${settingsForm.headerLogoHeightPx || 48}px` }}
                              className="w-auto max-w-[290px] object-contain rounded-lg bg-white px-2 py-0.5 shadow-2xs border border-purple-200/70"
                            />
                          )}
                        {((settingsForm.headerLogoDisplayMode || 'banner-only') ===
                          'logo-with-text' ||
                          (settingsForm.headerLogoDisplayMode || 'banner-only') === 'text-only' ||
                          !settingsForm.logoUrl) && (
                          <div className="leading-tight">
                            <span className="block text-sm sm:text-base font-black text-[#2e0249] dark:text-white">
                              {language === 'bn'
                                ? settingsForm.instituteNameBn
                                : language === 'ar'
                                  ? settingsForm.instituteNameAr
                                  : settingsForm.instituteName}
                            </span>
                            <span className="block text-[10px] font-mono font-bold text-purple-700 dark:text-amber-300">
                              EIIN: {settingsForm.eiinNumber || '140630'} | Madrasah Code:{' '}
                              {settingsForm.madrasahCode || '21023'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <span className="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-amber-300">
                          {tr('হোম', 'Home', 'الرئيسية')}
                        </span>
                        <span className="px-3 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-slate-800 hidden sm:inline">
                          {tr('একাডেমিক ও কারিকুলাম', 'Academics', 'الأكاديميا')}
                        </span>
                        <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white">
                          {tr('ভর্তি ও ফি', 'Admission & Fees', 'القبول والرسوم')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Upload & Store New Logo + Global Header Display Settings */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left 5 Cols: Upload & Store Logo to Vault */}
                    <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 h-fit">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <Plus className="w-4 h-4 text-purple-700" />
                        <span>
                          {tr(
                            'নতুন লোগো আপলোড ও সংরক্ষণ করুন (Upload to Vault)',
                            'Upload & Store New Logo in Vault',
                            'رفع وحفظ شعار جديد في الخزنة'
                          )}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        {tr(
                          'আপনার কম্পিউটার বা মোবাইল থেকে PNG, JPG, SVG লোগো ফাইল আপলোড করুন অথবা সরাসরি ইমেজ URL দিয়ে লোগো ভল্টে সংরক্ষণ করুন।',
                          'Upload a PNG, JPG, SVG, or WebP logo file from your computer/phone or add an image URL directly to the persistent Logo Vault.',
                          'قم برفع ملف صورة الشعار من جهازك أو أضف رابط الشعار لحفظه في الخزنة.'
                        )}
                      </p>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {tr('লোগোর নাম / লেবেল *', 'Logo Title / Label *', 'اسم / تسمية الشعار *')}
                          </label>
                          <input
                            type="text"
                            disabled={!canEditActiveTab}
                            value={customLogoName}
                            onChange={(e) => setCustomLogoName(e.target.value)}
                            placeholder={tr(
                              'যেমন: মাহারাত অফিশিয়াল হেডার লোগো ২০২৬',
                              'e.g. Official Header Banner Logo 2026',
                              'مثال: الشعار الرسمي للترويسة ٢٠٢٦'
                            )}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                            {tr('লোগোর ধরন (Variant)', 'Logo Variant Type', 'نوع الشعار')}
                          </label>
                          <select
                            disabled={!canEditActiveTab}
                            value={customLogoVariant}
                            onChange={(e) =>
                              setCustomLogoVariant(
                                e.target.value as
                                  | 'banner-transparent'
                                  | 'banner-white'
                                  | 'emblem'
                                  | 'custom'
                              )
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white"
                          >
                            <option value="banner-transparent">
                              {tr(
                                'Horizontal Banner (Transparent Background)',
                                'Horizontal Banner (Transparent Background)',
                                'شعار أفقي (خلفية شفافة)'
                              )}
                            </option>
                            <option value="banner-white">
                              {tr(
                                'Horizontal Banner (White Card Background)',
                                'Horizontal Banner (White Card Background)',
                                'شعار أفقي (خلفية بيضاء)'
                              )}
                            </option>
                            <option value="emblem">
                              {tr(
                                'Square / Circular Emblem (Monogram / Favicon)',
                                'Square / Circular Emblem (Monogram / Favicon)',
                                'شعار دائري / أيقونة مصغرة'
                              )}
                            </option>
                            <option value="custom">
                              {tr('Custom Institutional Logo', 'Custom Institutional Logo', 'شعار مخصص')}
                            </option>
                          </select>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            disabled={!canEditActiveTab}
                            checked={setAsActiveOnUpload}
                            onChange={(e) => setSetAsActiveOnUpload(e.target.checked)}
                            className="w-4 h-4 accent-purple-700 rounded"
                          />
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {tr(
                              'আপলোডের সাথে সাথে ওয়েবসাইটের সক্রিয় হেডার লোগো হিসেবে সেট করুন',
                              'Immediately set as Active Website Header Logo upon upload',
                              'تعيين كشعار نشط لترويسة الموقع فور الرفع'
                            )}
                          </span>
                        </label>

                        {/* Option A: File Upload from Device */}
                        <div className="pt-2">
                          <label className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 hover:from-purple-800 hover:to-fuchsia-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                            <Image className="w-4 h-4" />
                            <span>
                              {tr(
                                'ডিভাইস থেকে লোগো ইমেজ ফাইল আপলোড করুন (PNG/JPG/SVG)',
                                'Upload Logo Image File from Device (PNG/JPG/SVG)',
                                'رفع ملف صورة الشعار من الجهاز'
                              )}
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={!canEditActiveTab}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = () => {
                                  if (typeof reader.result === 'string') {
                                    const label =
                                      customLogoName.trim() ||
                                      file.name.replace(/\.[^/.]+$/, '');
                                    uploadAndStoreLogo(
                                      {
                                        name: label,
                                        url: reader.result,
                                        variant: customLogoVariant,
                                      },
                                      setAsActiveOnUpload
                                    );
                                    setCustomLogoName('');
                                    setBrandingFeedback(
                                      tr(
                                        `"${label}" লোগো ভল্টে সংরক্ষিত হয়েছে এবং হেডারে আপডেট করা হয়েছে।`,
                                        `Logo "${label}" saved to Vault and persisted across website headers.`,
                                        `تم حفظ الشعار "${label}" وتحديث ترويسة الموقع.`
                                      )
                                    );
                                  }
                                };
                                reader.readAsDataURL(file);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>

                        {/* Option B: Add Logo by URL */}
                        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                          <label className="block font-bold text-slate-700 dark:text-slate-300">
                            {tr(
                              'অথবা সরাসরি লোগো ইমেজ URL ভল্টে যুক্ত করুন:',
                              'Or Store Logo via Direct Image URL:',
                              'أو أضف الشعار عبر رابط الصورة مباشرة:'
                            )}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              disabled={!canEditActiveTab}
                              value={customLogoUrlInput}
                              onChange={(e) => setCustomLogoUrlInput(e.target.value)}
                              placeholder="/assets/maharat/01-Branding_Logo-with-EIIN_02.png"
                              className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs font-mono"
                            />
                            <button
                              type="button"
                              disabled={!canEditActiveTab || !customLogoUrlInput.trim()}
                              onClick={() => {
                                const label =
                                  customLogoName.trim() ||
                                  `Custom Logo ${(state.settings.storedLogos || []).length + 1}`;
                                uploadAndStoreLogo(
                                  {
                                    name: label,
                                    url: customLogoUrlInput.trim(),
                                    variant: customLogoVariant,
                                  },
                                  setAsActiveOnUpload
                                );
                                setCustomLogoName('');
                                setCustomLogoUrlInput('');
                                setBrandingFeedback(
                                  tr(
                                    `"${label}" লোগো ভল্টে সংরক্ষিত হয়েছে।`,
                                    `Logo "${label}" added to persistent Logo Vault.`,
                                    `تمت إضافة الشعار "${label}" إلى الخزنة.`
                                  )
                                );
                              }}
                              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-purple-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50 shrink-0"
                            >
                              {tr('+ ভল্টে সেভ করুন', '+ Save to Vault', '+ حفظ')}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right 7 Cols: Stored Logos Vault & Global Header Configuration */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            {tr(
                              `সংরক্ষিত লোগো ভল্ট (Stored Logo Vault — ${(state.settings.storedLogos || []).length})`,
                              `Stored Logo Vault (${(state.settings.storedLogos || []).length} Logos)`,
                              `خزنة الشعارات المحفوظة (${(state.settings.storedLogos || []).length})`
                            )}
                          </h3>
                          <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">
                            {tr(
                              'যেকোনো লোগো ১-ক্লিকে ওয়েবসাইট হেডারে সক্রিয় করুন',
                              '1-Click Activate Across All Website Headers',
                              'تفعيل بضغطة واحدة عبر جميع ترويسات الموقع'
                            )}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {(state.settings.storedLogos || []).map((logoItem) => {
                            const isPrimaryActive = state.settings.logoUrl === logoItem.url;
                            const isSecondaryActive =
                              state.settings.secondaryLogoUrl === logoItem.url;
                            return (
                              <div
                                key={logoItem.id}
                                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                  isPrimaryActive
                                    ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-600 ring-2 ring-purple-500/30 shadow-sm'
                                    : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                      {logoItem.name}
                                    </span>
                                    {isPrimaryActive && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shrink-0">
                                        {tr('সক্রিয় হেডার', 'Active Header', 'نشط')}
                                      </span>
                                    )}
                                  </div>

                                  <div className="h-16 rounded-xl bg-white border border-slate-200/80 p-2 flex items-center justify-center overflow-hidden">
                                    <img
                                      src={logoItem.url}
                                      alt={logoItem.name}
                                      className="max-h-12 w-auto object-contain"
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                                  <button
                                    type="button"
                                    disabled={!canEditActiveTab || isPrimaryActive}
                                    onClick={() => {
                                      const updated = {
                                        ...state.settings,
                                        logoUrl: logoItem.url,
                                      };
                                      setSettingsForm(updated);
                                      updateSettings(updated);
                                      setBrandingFeedback(
                                        tr(
                                          `"${logoItem.name}" এখন ওয়েবসাইটের সকল হেডারে সক্রিয় করা হয়েছে।`,
                                          `"${logoItem.name}" is now active across all website headers.`,
                                          `تم تفعيل "${logoItem.name}" في ترويسة الموقع.`
                                        )
                                      );
                                    }}
                                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer ${
                                      isPrimaryActive
                                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-default'
                                        : 'bg-purple-700 hover:bg-purple-800 text-white'
                                    }`}
                                  >
                                    {isPrimaryActive
                                      ? tr('✓ মেইন হেডারে সক্রিয়', '✓ Active Header Logo', '✓ الشعار النشط')
                                      : tr('মেইন হেডারে সেট করুন', 'Set as Header Logo', 'تعيين للترويسة')}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={!canEditActiveTab}
                                    onClick={() => {
                                      const updated = {
                                        ...state.settings,
                                        secondaryLogoUrl: logoItem.url,
                                      };
                                      setSettingsForm(updated);
                                      updateSettings(updated);
                                      setBrandingFeedback(
                                        tr(
                                          `"${logoItem.name}" সাইডবার ও মনোগ্রাম আইকন হিসেবে সেট করা হয়েছে।`,
                                          `"${logoItem.name}" set as Secondary Emblem / Monogram.`,
                                          `تم تعيين "${logoItem.name}" كشعار فرعي.`
                                        )
                                      );
                                    }}
                                    className={`py-1.5 px-2.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                                      isSecondaryActive
                                        ? 'bg-amber-100 border-amber-400 text-amber-950 dark:bg-amber-950/50 dark:text-amber-300'
                                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-50'
                                    }`}
                                  >
                                    {isSecondaryActive
                                      ? tr('★ মনোগ্রাম', '★ Emblem', '★ أيقونة')
                                      : tr('মনোগ্রাম সেট', 'Set Emblem', 'كأيقونة')}
                                  </button>

                                  {canDeleteActiveTab &&
                                    (state.settings.storedLogos || []).length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => deleteStoredLogo(logoItem.id)}
                                        aria-label={`Delete ${logoItem.name}`}
                                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Header Display Mode & Size Controls */}
                      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {tr(
                            'গ্লোবাল হেডার লোগো ডিসপ্লে মোড ও সাইজ কন্ট্রোল',
                            'Global Header Display Mode & Logo Sizing',
                            'إعدادات عرض وحجم شعار الترويسة'
                          )}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              {tr(
                                'হেডার ডিসপ্লে স্টাইল (Display Mode)',
                                'Header Display Mode',
                                'نمط عرض الترويسة'
                              )}
                            </label>
                            <select
                              disabled={!canEditActiveTab}
                              value={settingsForm.headerLogoDisplayMode || 'banner-only'}
                              onChange={(e) => {
                                const updated: SiteSettings = {
                                  ...settingsForm,
                                  headerLogoDisplayMode: e.target.value as
                                    | 'banner-only'
                                    | 'logo-with-text'
                                    | 'text-only',
                                };
                                setSettingsForm(updated);
                                updateSettings(updated);
                              }}
                              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold bg-white"
                            >
                              <option value="banner-only">
                                {tr(
                                  'শুধুমাত্র অফিশিয়াল ব্যানার লোগো (Banner Logo Only)',
                                  'Official Banner Logo Only (Recommended)',
                                  'الشعار الأفقي الكامل فقط (موصى به)'
                                )}
                              </option>
                              <option value="logo-with-text">
                                {tr(
                                  'লোগো + প্রতিষ্ঠানের নাম ও EIIN টেক্সট',
                                  'Logo + Institution Title & EIIN Text',
                                  'الشعار مع النص ورقم EIIN'
                                )}
                              </option>
                              <option value="text-only">
                                {tr(
                                  'শুধুমাত্র টেক্সট ও আইকন (Text Only)',
                                  'Text & Default Icon Only',
                                  'النص والأيقونة فقط'
                                )}
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                              {tr(
                                `হেডার লোগোর উচ্চতা (Height: ${settingsForm.headerLogoHeightPx || 48}px)`,
                                `Header Logo Height (${settingsForm.headerLogoHeightPx || 48}px)`,
                                `ارتفاع الشعار (${settingsForm.headerLogoHeightPx || 48}px)`
                              )}
                            </label>
                            <input
                              type="range"
                              min={36}
                              max={72}
                              step={2}
                              disabled={!canEditActiveTab}
                              value={settingsForm.headerLogoHeightPx || 48}
                              onChange={(e) => {
                                const updated: SiteSettings = {
                                  ...settingsForm,
                                  headerLogoHeightPx: Number(e.target.value),
                                };
                                setSettingsForm(updated);
                                updateSettings(updated);
                              }}
                              className="w-full accent-purple-700 cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
                              <span>Compact (36px)</span>
                              <span>Default (48px)</span>
                              <span>Large (72px)</span>
                            </div>
                          </div>
                        </div>

                        {/* Live Desktop & Mobile Header Preview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 space-y-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase">
                              {tr('ডেস্কটপ হেডার লাইভ প্রিভিউ (1440px)', 'Desktop Header Preview', 'معاينة سطح المكتب')}
                            </div>
                            <div className="rounded-lg bg-white dark:bg-[#08132e] border border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                {settingsForm.logoUrl && (settingsForm.headerLogoDisplayMode || 'banner-only') !== 'text-only' ? (
                                  <img
                                    src={settingsForm.logoUrl}
                                    alt="Preview"
                                    style={{ height: `${Math.min(44, settingsForm.headerLogoHeightPx || 44)}px` }}
                                    className="w-auto max-w-[140px] object-contain"
                                  />
                                ) : (
                                  <span className="text-xs font-extrabold text-[#192f64] dark:text-white truncate">
                                    {settingsForm.instituteNameBn}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                <span>হোম</span>
                                <span>একাডেমিক</span>
                                <span>ব্লগ</span>
                                <span className="px-2 py-0.5 rounded-full bg-[#192f64] text-white">লগইন</span>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 space-y-2">
                            <div className="text-[11px] font-bold text-slate-500 uppercase">
                              {tr('মোবাইল হেডার লাইভ প্রিভিউ (390px)', 'Mobile Header Preview', 'معاينة الجوال')}
                            </div>
                            <div className="max-w-[260px] mx-auto rounded-lg bg-white dark:bg-[#08132e] border border-slate-200 dark:border-slate-800 px-2.5 py-1.5 flex items-center justify-between gap-1.5">
                              {settingsForm.logoUrl ? (
                                <img
                                  src={settingsForm.logoUrl}
                                  alt="Mobile Preview"
                                  className="h-7 w-auto max-w-[96px] object-contain"
                                />
                              ) : (
                                <span className="text-[10px] font-extrabold text-[#192f64] dark:text-white truncate">
                                  মাহারাত
                                </span>
                              )}
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[9px] font-bold text-slate-700">বাং</span>
                                <span className="px-2 py-0.5 rounded-full bg-[#192f64] text-[9px] font-bold text-white">লগইন</span>
                                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">☰</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile App-Style Customizable 5-Slot Bottom Navigation Bar Configurator */}
                      {state.mobileBottomBar && (
                        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-[#005a6e]/10 text-[#005a6e] dark:text-[#f0c95e] flex items-center justify-center">
                                <Smartphone className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                                  {tr(
                                    'মোবাইল অ্যাপ-স্টাইল বটম নেভিগেশন বার কনফিগারেশন',
                                    'Mobile App-Style Bottom Navigation Bar Configurator',
                                    'إعدادات شريط التنقل السفلي للجوال'
                                  )}
                                </h3>
                                <p className="text-[11px] text-slate-500">
                                  {tr(
                                    'মোবাইল স্ক্রিনে নিচে প্রদর্শিত ৫টি স্লট ও মধ্যবর্তী হাইলাইটেড বাটন এখান থেকে পরিবর্তন করুন।',
                                    'Configure the 5 mobile bottom bar slots and highlighted center CTA.',
                                    'قم بتخصيص الأزرار الخمسة في الشريط السفلي للجوال.'
                                  )}
                                </p>
                              </div>
                            </div>
                            <label className="inline-flex items-center gap-2 font-bold cursor-pointer">
                              <input
                                type="checkbox"
                                disabled={!canEditActiveTab}
                                checked={state.mobileBottomBar.enabled}
                                onChange={(e) =>
                                  updateMobileBottomBar({
                                    ...state.mobileBottomBar!,
                                    enabled: e.target.checked,
                                  })
                                }
                                className="w-4 h-4 accent-[#005a6e]"
                              />
                              <span>{state.mobileBottomBar.enabled ? 'সক্রিয় (ON)' : 'বন্ধ (OFF)'}</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                            {state.mobileBottomBar.slots.map((slot, idx) => (
                              <div
                                key={slot.id}
                                className={`rounded-xl border p-3 space-y-2 ${
                                  slot.highlighted
                                    ? 'border-[#c4962c] bg-amber-50/40 dark:bg-amber-950/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] font-extrabold text-[#005a6e] dark:text-[#f0c95e]">
                                    SLOT #{idx + 1}
                                  </span>
                                  <label className="inline-flex items-center gap-1 text-[10px] cursor-pointer">
                                    <input
                                      type="checkbox"
                                      disabled={!canEditActiveTab}
                                      checked={Boolean(slot.highlighted)}
                                      onChange={(e) => {
                                        const nextSlots = state.mobileBottomBar!.slots.map((s, i) => ({
                                          ...s,
                                          highlighted: i === idx ? e.target.checked : false,
                                        }));
                                        updateMobileBottomBar({
                                          ...state.mobileBottomBar!,
                                          slots: nextSlots,
                                        });
                                      }}
                                    />
                                    <span>CTA</span>
                                  </label>
                                </div>
                                <select
                                  disabled={!canEditActiveTab}
                                  value={slot.target}
                                  onChange={(e) => {
                                    const nextSlots = state.mobileBottomBar!.slots.map((s, i) =>
                                      i === idx
                                        ? { ...s, target: e.target.value as MobileBottomBarSlotTarget }
                                        : s
                                    );
                                    updateMobileBottomBar({
                                      ...state.mobileBottomBar!,
                                      slots: nextSlots,
                                    });
                                  }}
                                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1.5 text-xs font-bold bg-white"
                                >
                                  <option value="home">Home</option>
                                  <option value="courses">Courses</option>
                                  <option value="admission">Admission</option>
                                  <option value="blog">Blog</option>
                                  <option value="contact">Contact</option>
                                  <option value="hifz-tree">Hifz Tree</option>
                                  <option value="notices">Notices</option>
                                  <option value="careers">Careers</option>
                                  <option value="fees">Fees</option>
                                </select>
                                <input
                                  type="text"
                                  disabled={!canEditActiveTab}
                                  value={slot.labelBn}
                                  onChange={(e) => {
                                    const nextSlots = state.mobileBottomBar!.slots.map((s, i) =>
                                      i === idx ? { ...s, labelBn: e.target.value } : s
                                    );
                                    updateMobileBottomBar({
                                      ...state.mobileBottomBar!,
                                      slots: nextSlots,
                                    });
                                  }}
                                  placeholder="বাংলা লেবেল"
                                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs"
                                />
                                <input
                                  type="text"
                                  disabled={!canEditActiveTab}
                                  value={slot.labelEn}
                                  onChange={(e) => {
                                    const nextSlots = state.mobileBottomBar!.slots.map((s, i) =>
                                      i === idx ? { ...s, labelEn: e.target.value } : s
                                    );
                                    updateMobileBottomBar({
                                      ...state.mobileBottomBar!,
                                      slots: nextSlots,
                                    });
                                  }}
                                  placeholder="English Label"
                                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: USER ROLES & GRANULAR RBAC PERMISSION MATRIX (SUPER ADMIN ONLY) */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  {/* Granular Role-Based Access Control (RBAC) Matrix Editor */}
                  <AdminRBACMatrixSection />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4 h-fit">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {tr(
                          'নতুন স্টাফ / অ্যাডমিন অ্যাকাউন্ট তৈরি করুন (৫-রোল RBAC)',
                          'Create Staff / Admin Account (5-Role RBAC)',
                          'إنشاء حساب موظف أو مسؤول جديد (٥ أدوار)'
                        )}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {tr(
                          'শুধুমাত্র Super Admin নতুন ইউজার অ্যাকাউন্ট তৈরি এবং ৫টি নির্ধারিত রোলের যেকোনো একটি অ্যাসাইন করতে পারবেন।',
                          'Only Super Admin can create user accounts and assign one of the 5 official RBAC roles.',
                          'يمكن للمشرف العام فقط إنشاء الحسابات وتعيين أحد الأدوار الخمسة المعتمدة.'
                        )}
                      </p>
                      <form onSubmit={handleAddUser} className="space-y-3 text-xs">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('পূর্ণ নাম *', 'Full Name *', 'الاسم الكامل *')}
                          </label>
                          <input
                            type="text"
                            disabled={userRole !== 'Super Admin'}
                            value={newUserFullName}
                            onChange={(e) => setNewUserFullName(e.target.value)}
                            placeholder="e.g. Ustadh Mahmudul Hasan"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              {tr('ইউজার আইডি / ইউজারনেম *', 'User ID / Username *', 'اسم المستخدم *')}
                            </label>
                            <input
                              type="text"
                              disabled={userRole !== 'Super Admin'}
                              value={newUsername}
                              onChange={(e) => setNewUsername(e.target.value)}
                              placeholder="mahmud"
                              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-slate-700 mb-1">
                              {tr('পাসওয়ার্ড *', 'Password *', 'كلمة المرور *')}
                            </label>
                            <input
                              type="text"
                              disabled={userRole !== 'Super Admin'}
                              value={newUserPassword}
                              onChange={(e) => setNewUserPassword(e.target.value)}
                              placeholder="Noor-2027-Uttara"
                              required
                              aria-describedby="new-user-password-hint"
                              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono"
                            />
                          </div>
                        </div>
                        <p id="new-user-password-hint" className="text-[11px] text-slate-500 dark:text-slate-400">
                          {tr(
                            `কমপক্ষে ${toBengaliDigits(MIN_PASSWORD_LENGTH)} অক্ষর; বর্ণ ও সংখ্যা দুটোই থাকতে হবে। প্রথমবার লগইনের পর ব্যবহারকারীকে নিজের পাসওয়ার্ড বদলাতে হবে।`,
                            `At least ${MIN_PASSWORD_LENGTH} characters with letters and digits. The user must choose their own password at first sign-in.`,
                            `${MIN_PASSWORD_LENGTH} أحرف على الأقل تتضمن أحرفاً وأرقاماً. يجب على المستخدم تغييرها عند أول تسجيل دخول.`
                          )}
                        </p>
                        {newUserError && (
                          <p role="alert" data-testid="new-user-error" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300">
                            {newUserError}
                          </p>
                        )}
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('ইমেইল', 'Email', 'البريد الإلكتروني')}
                          </label>
                          <input
                            type="email"
                            disabled={userRole !== 'Super Admin'}
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            placeholder="staff@maharatmadrasah.com"
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {tr('নির্ধারিত রোল (5 RBAC Roles)', 'Assigned RBAC Role (5 Official Roles)', 'الدور المحدد في النظام')}
                          </label>
                          <select
                            disabled={userRole !== 'Super Admin'}
                            value={newUserRole}
                            onChange={(e) => setNewUserRole(e.target.value as AdminRole)}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm bg-white font-semibold"
                          >
                            <option value="Super Admin">
                              {tr(
                                '1. Super Admin (পূর্ণ সিস্টেম, ইউজার ও RBAC ম্যাট্রিক্স কন্ট্রোল)',
                                '1. Super Admin (Full System, Users & RBAC Matrix Control)',
                                '١. المشرف العام (تحكم كامل بالنظام والصلاحيات)'
                              )}
                            </option>
                            <option value="Chairman / Managing Director">
                              {tr(
                                '2. Chairman / Managing Director (চেয়ারম্যান / এমডি — নীতি ও চূড়ান্ত অনুমোদন)',
                                '2. Chairman / Managing Director (Executive Oversight & Approvals)',
                                '٢. رئيس مجلس الإدارة / المدير العام'
                              )}
                            </option>
                            <option value="Principal / Vice Principal">
                              {tr(
                                '3. Principal / Vice Principal (অধ্যক্ষ / উপাধ্যক্ষ — ছুটি ও একাডেমিক তদারকি)',
                                '3. Principal / Vice Principal (Leave Approvals & Academic Oversight)',
                                '٣. المدير / نائب المدير'
                              )}
                            </option>
                            <option value="Coordinators / Teachers">
                              {tr(
                                '4. Coordinators / Teachers (কো-অর্ডিনেটর / শিক্ষকবৃন্দ — ছুটি ও ক্লাস)',
                                '4. Coordinators / Teachers (Leave Requests & Academic Modules)',
                                '٤. المنسقون / المعلمون'
                              )}
                            </option>
                            <option value="Content Managers">
                              {tr(
                                '5. Content Managers (কন্টেন্ট, ব্র্যান্ডিং, নোটিশ, কোর্স ও ভর্তি লিডস)',
                                '5. Content Managers (Branding, Notices, Courses, Videos & Leads)',
                                '٥. مديرو المحتوى'
                              )}
                            </option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={userRole !== 'Super Admin'}
                          className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>
                            {tr('ইউজার অ্যাকাউন্ট যুক্ত করুন', 'Add Staff Account', 'إضافة حساب موظف')}
                          </span>
                        </button>
                      </form>
                    </div>

                    <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {tr(
                          `কনফিগারকৃত ইউজার অ্যাকাউন্ট ও ৫-রোল তালিকা (${state.users.length})`,
                          `Configured Staff Accounts & 5-Role Assignments (${state.users.length})`,
                          `حسابات الموظفين والأدوار الخمسة (${state.users.length})`
                        )}
                      </h2>
                      <div className="divide-y divide-slate-200 dark:divide-slate-800">
                        {state.users.map((u) => (
                          <div
                            key={u.id}
                            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <div className="text-sm font-bold text-slate-900 dark:text-white">
                                {loc(u.fullName)}
                              </div>
                              <div className="text-slate-500 dark:text-slate-400 font-mono">
                                {tr('ইউজার আইডি:', 'User ID:', 'المعرف:')}{' '}
                                <strong>@{u.username}</strong> · {u.email}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <select
                                aria-label={`Role for ${u.fullName}`}
                                disabled={userRole !== 'Super Admin'}
                                value={u.role}
                                onChange={(e) =>
                                  updateAdminUserRole(u.id, e.target.value as AdminRole)
                                }
                                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-purple-900 dark:text-purple-300"
                              >
                                <option value="Super Admin">1. Super Admin</option>
                                <option value="Chairman / Managing Director">
                                  2. Chairman / Managing Director
                                </option>
                                <option value="Principal / Vice Principal">
                                  3. Principal / Vice Principal
                                </option>
                                <option value="Coordinators / Teachers">
                                  4. Coordinators / Teachers
                                </option>
                                <option value="Content Managers">5. Content Managers</option>
                              </select>
                              {userRole === 'Super Admin' && (
                                <button
                                  type="button"
                                  onClick={() => deleteAdminUser(u.id)}
                                  className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: GENERAL SITE SETTINGS */}
              {activeTab === 'settings' && (
                <div className="max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      {tr(
                        'সাধারণ সাইট সেটিংস ও লাইভ ব্র্যান্ডিং',
                        'General Site Settings & Live Branding',
                        'الإعدادات العامة للموقع والهوية المباشرة'
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {tr(
                        'এখানে সংরক্ষিত পরিবর্তন সাথে সাথে ওয়েবসাইটের হেডার, হিরো ব্যানার ও যোগাযোগের তথ্যে আপডেট হবে।',
                        'Changes saved here immediately update the public website header, hero banner, and contact details.',
                        'التغييرات المحفوظة هنا تحدث ترويسة الموقع العام واللافتة الرئيسية وبيانات الاتصال فوراً.'
                      )}
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!canEditActiveTab) return;
                      updateSettings(settingsForm);
                    }}
                    className="space-y-4 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('প্রতিষ্ঠানের নাম (বাংলা)', 'Institute Name (Bengali)', 'اسم المعهد (بالبنغالية)')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.instituteNameBn}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, instituteNameBn: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('প্রতিষ্ঠানের নাম (ইংরেজি)', 'Institute Name (English)', 'اسم المعهد (بالإنجليزية)')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.instituteName}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, instituteName: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('প্রতিষ্ঠানের নাম (আরবি)', 'Institute Name (Arabic)', 'اسم المعهد (بالعربية)')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.instituteNameAr || 'مدرسة المهارات النموذجية'}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, instituteNameAr: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('EIIN নম্বর (EIIN Number)', 'EIIN Number', 'رقم EIIN')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.eiinNumber || '140630'}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, eiinNumber: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('মাদ্রাসা কোড (Madrasah Code)', 'Madrasah Code', 'رمز المدرسة')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.madrasahCode || '21023'}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, madrasahCode: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('মাদ্রাসার স্লোগান (Motto)', 'Institutional Motto', 'شعار المدرسة')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.mottoEn || 'A Madrasah with Excellence'}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, mottoEn: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('হিরো ব্যানার মূল শিরোনাম', 'Hero Headline Main Text', 'العنوان الرئيسي في اللافتة')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={loc(settingsForm.heroTitle)}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroTitle: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('হিরো হাইলাইট টেক্সট', 'Hero Highlight Accent Text', 'النص المميز في اللافتة')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={loc(settingsForm.heroHighlight)}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroHighlight: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('অ্যাডমিন ইমেইল ঠিকানা', 'Admin Notification Email Address', 'البريد الإلكتروني للإدارة')}
                        </label>
                        <input
                          type="email"
                          disabled={!canEditActiveTab}
                          value={settingsForm.email}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, email: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('ভর্তি হেল্পলাইন নম্বর (প্রধান)', 'Primary Admission Phone', 'هاتف القبول الرئيسي')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.phonePrimary}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, phonePrimary: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('হটলাইন / আইপি ফোন নম্বরসমূহ', 'Secondary / IP Hotline Numbers', 'أرقام الهواتف الإضافية')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.phoneSecondary}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, phoneSecondary: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          {tr('হোয়াটসঅ্যাপ নম্বর', 'WhatsApp Number', 'رقم واتساب')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.whatsappNumber}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })
                          }
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {tr('হিরো ব্যানার সাবটাইটেল', 'Hero Banner Subtitle', 'الوصف الفرعي للافتة الرئيسية')}
                      </label>
                      <textarea
                        rows={2}
                        disabled={!canEditActiveTab}
                        value={loc(settingsForm.heroSubtitle)}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        {tr('ক্যাম্পাসের পূর্ণ ঠিকানা', 'Campus Full Address', 'العنوان الكامل للحرم الدراسي')}
                      </label>
                      <textarea
                        rows={2}
                        disabled={!canEditActiveTab}
                        value={loc(settingsForm.address)}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, address: e.target.value })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!canEditActiveTab}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>
                        {tr(
                          'সাইট সেটিংস সংরক্ষণ করুন',
                          'Save Site Settings in Real Time',
                          'حفظ إعدادات الموقع فوراً'
                        )}
                      </span>
                    </button>
                  </form>

                  {/* Dual Campus Google Maps Location & Embed Manager */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-purple-700 dark:text-amber-300" />
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {tr(
                            'দুটি ক্যাম্পাসের গুগল ম্যাপ লোকেশন ও এম্বেড কন্ট্রোলার (Contact Page Maps)',
                            'Dual Campus Google Maps Location & Embed Manager',
                            'إدارة مواقع خرائط جوجل للحرمين'
                          )}
                        </h3>
                      </div>
                      <button
                        type="button"
                        disabled={!canEditActiveTab}
                        onClick={() => {
                          const updated = {
                            ...settingsForm,
                            boysCampusMapUrl: settingsForm.boysCampusMapUrl || DEFAULT_BOYS_CAMPUS_MAP_URL,
                            boysCampusMapEmbedUrl: resolveGoogleMapsEmbedUrl(
                              settingsForm.boysCampusMapUrl || DEFAULT_BOYS_CAMPUS_MAP_URL,
                              DEFAULT_BOYS_CAMPUS_EMBED_URL
                            ),
                            girlsCampusMapUrl: settingsForm.girlsCampusMapUrl || DEFAULT_GIRLS_CAMPUS_MAP_URL,
                            girlsCampusMapEmbedUrl: resolveGoogleMapsEmbedUrl(
                              settingsForm.girlsCampusMapUrl || DEFAULT_GIRLS_CAMPUS_MAP_URL,
                              DEFAULT_GIRLS_CAMPUS_EMBED_URL
                            ),
                          };
                          setSettingsForm(updated);
                          updateSettings(updated);
                          pushToast(
                            tr('ক্যাম্পাস ম্যাপ সংরক্ষিত', 'Campus Maps Saved', 'تم حفظ الخرائط'),
                            tr('যোগাযোগ পেজে উভয় ক্যাম্পাসের লাইভ গুগল ম্যাপ আপডেট হয়েছে।', 'Both campus maps updated live on the Contact page.', 'تم التحديث بنجاح'),
                            'success'
                          );
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{tr('ম্যাপ লিংক অটো-এম্বেড ও সেভ করুন', 'Auto-Embed & Save Maps', 'حفظ الخرائط')}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">
                      {tr(
                        'যেকোনো গুগল ম্যাপ শেয়ার লিংক (যেমন: https://maps.app.goo.gl/...) অথবা ঠিকানা পেস্ট করলে স্বয়ংক্রিয়ভাবে ইন্টারেক্টিভ ম্যাপ এম্বেড তৈরি হবে।',
                        'Paste any Google Maps share URL or campus address to automatically generate live interactive map embeds for the Contact page.',
                        'الصق أي رابط من خرائط جوجل أو عنوان الحرم لتوليد خريطة تفاعلية مباشرة.'
                      )}
                    </p>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Campus 1: Boys & Main Campus */}
                      <div className="rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-slate-800/50 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-purple-900 dark:text-amber-300">
                            {tr('১. বয়েজ ও মেইন ক্যাম্পাস (বাড়ি-১১, রোড-১৯, সেক্টর-১২)', '1. Boys & Main Campus (Sector-12)', 'حرم البنين والرئيسي')}
                          </span>
                          <a
                            href={settingsForm.boysCampusMapUrl || DEFAULT_BOYS_CAMPUS_MAP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{tr('ম্যাপ খুলুন', 'Open Map', 'فتح')}</span>
                          </a>
                        </div>
                        <div className="space-y-2 text-xs">
                          <label className="block font-semibold text-slate-700 dark:text-slate-300">
                            {tr('Google Maps শেয়ার লিংক', 'Google Maps Share URL', 'رابط المشاركة')}
                          </label>
                          <input
                            type="url"
                            disabled={!canEditActiveTab}
                            value={settingsForm.boysCampusMapUrl || DEFAULT_BOYS_CAMPUS_MAP_URL}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                boysCampusMapUrl: e.target.value,
                                boysCampusMapEmbedUrl: resolveGoogleMapsEmbedUrl(
                                  e.target.value,
                                  DEFAULT_BOYS_CAMPUS_EMBED_URL
                                ),
                              })
                            }
                            placeholder="https://maps.app.goo.gl/SxcrUPWtW8VbSYdEA"
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                          />
                        </div>
                        <div className="rounded-xl overflow-hidden border border-purple-200 dark:border-slate-700 h-44 bg-slate-100">
                          <iframe
                            title="Admin Boys Campus Map Preview"
                            src={resolveGoogleMapsEmbedUrl(
                              settingsForm.boysCampusMapEmbedUrl || settingsForm.boysCampusMapUrl,
                              DEFAULT_BOYS_CAMPUS_EMBED_URL
                            )}
                            className="w-full h-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      </div>

                      {/* Campus 2: Girls Campus & Main Office */}
                      <div className="rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-slate-800/50 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-purple-900 dark:text-amber-300">
                            {tr('২. গার্লস ক্যাম্পাস ও মূল অফিস (বাড়ি-০৭, রোড-১৭/এ)', '2. Girls Campus & Main Office', 'حرم البنات والمكتب الرئيسي')}
                          </span>
                          <a
                            href={settingsForm.girlsCampusMapUrl || DEFAULT_GIRLS_CAMPUS_MAP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>{tr('ম্যাপ খুলুন', 'Open Map', 'فتح')}</span>
                          </a>
                        </div>
                        <div className="space-y-2 text-xs">
                          <label className="block font-semibold text-slate-700 dark:text-slate-300">
                            {tr('Google Maps শেয়ার লিংক / ঠিকানা', 'Google Maps Share URL / Address', 'رابط المشاركة')}
                          </label>
                          <input
                            type="text"
                            disabled={!canEditActiveTab}
                            value={settingsForm.girlsCampusMapUrl || DEFAULT_GIRLS_CAMPUS_MAP_URL}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                girlsCampusMapUrl: e.target.value,
                                girlsCampusMapEmbedUrl: resolveGoogleMapsEmbedUrl(
                                  e.target.value,
                                  DEFAULT_GIRLS_CAMPUS_EMBED_URL
                                ),
                              })
                            }
                            placeholder="https://www.google.com/maps/search/..."
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                          />
                        </div>
                        <div className="rounded-xl overflow-hidden border border-purple-200 dark:border-slate-700 h-44 bg-slate-100">
                          <iframe
                            title="Admin Girls Campus Map Preview"
                            src={resolveGoogleMapsEmbedUrl(
                              settingsForm.girlsCampusMapEmbedUrl || settingsForm.girlsCampusMapUrl,
                              DEFAULT_GIRLS_CAMPUS_EMBED_URL
                            )}
                            className="w-full h-full border-0"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live External ERP Portal Links Manager (Student Portal + Admin ERP Portal) */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-[#005a6e] dark:text-[#5eead4]" />
                        <div>
                          <h3 className="text-base font-extrabold text-[#0a1738] dark:text-white">
                            {tr(
                              'এক্সটার্নাল ইআরপি ও লগইন পোর্টাল লিংক ম্যানেজার (Student & Admin ERP)',
                              'External ERP & Login Portal Links Manager',
                              'إدارة روابط بوابات الدخول الخارجية (ERP)'
                            )}
                          </h3>
                          <p className="text-xs text-slate-500">
                            {tr(
                              'হেডার লগইন মেনু ও ফুটারে প্রদর্শিত লাইভ স্টুডেন্ট পোর্টাল ও অ্যাডমিন ইআরপি লিংক এখান থেকে সম্পাদনা বা নতুন লিংক যুক্ত করুন।',
                              'Manage live Student & Admin ERP URLs displayed in the Header Login dropdown and Footer.',
                              'إدارة روابط بوابة الطلاب والإدارة المعروضة في قائمة تسجيل الدخول.'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {resolveExternalPortals(settingsForm.externalPortals).map((portal, pIdx) => (
                        <div
                          key={portal.id}
                          className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center text-xs"
                        >
                          <div className="lg:col-span-3">
                            <input
                              type="text"
                              disabled={!canEditActiveTab}
                              value={portal.labelBn}
                              onChange={(e) => {
                                const current = resolveExternalPortals(settingsForm.externalPortals);
                                const next = current.map((p, idx) =>
                                  idx === pIdx ? { ...p, labelBn: e.target.value } : p
                                );
                                setSettingsForm({ ...settingsForm, externalPortals: next });
                              }}
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-bold"
                              placeholder="বাংলা শিরোনাম"
                            />
                          </div>
                          <div className="lg:col-span-5">
                            <input
                              type="url"
                              disabled={!canEditActiveTab}
                              value={portal.url}
                              onChange={(e) => {
                                const current = resolveExternalPortals(settingsForm.externalPortals);
                                const next = current.map((p, idx) =>
                                  idx === pIdx ? { ...p, url: e.target.value } : p
                                );
                                setSettingsForm({ ...settingsForm, externalPortals: next });
                              }}
                              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono text-[11px]"
                              placeholder="http://103.166.74.212:2020/..."
                            />
                          </div>
                          <div className="lg:col-span-2 flex items-center gap-2">
                            <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold">
                              <input
                                type="checkbox"
                                disabled={!canEditActiveTab}
                                checked={portal.active}
                                onChange={(e) => {
                                  const current = resolveExternalPortals(settingsForm.externalPortals);
                                  const next = current.map((p, idx) =>
                                    idx === pIdx ? { ...p, active: e.target.checked } : p
                                  );
                                  setSettingsForm({ ...settingsForm, externalPortals: next });
                                }}
                                className="accent-[#005a6e]"
                              />
                              <span>{tr('সক্রিয়', 'Active', 'مفعل')}</span>
                            </label>
                          </div>
                          <div className="lg:col-span-2 flex items-center justify-end gap-2">
                            <a
                              href={portal.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-[#005a6e]/10 text-[#005a6e] dark:text-[#5eead4] font-bold inline-flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>{tr('টেস্ট', 'Open', 'فتح')}</span>
                            </a>
                            {canEditActiveTab && (
                              <button
                                type="button"
                                onClick={() => {
                                  const current = resolveExternalPortals(settingsForm.externalPortals);
                                  setSettingsForm({
                                    ...settingsForm,
                                    externalPortals: current.filter((_, idx) => idx !== pIdx),
                                  });
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                                title="Remove Portal Link"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {canEditActiveTab && (
                      <div className="p-3.5 rounded-2xl border border-dashed border-[#005a6e]/40 bg-teal-50/30 dark:bg-slate-900/50 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center text-xs">
                        <input
                          type="text"
                          value={newPortalLabelBn}
                          onChange={(e) => setNewPortalLabelBn(e.target.value)}
                          placeholder={tr('নতুন পোর্টালের নাম (যেমন: টিচার ইআরপি)', 'New Portal Name (Bn)', 'اسم البوابة')}
                          className="sm:col-span-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-bold"
                        />
                        <input
                          type="text"
                          value={newPortalLabelEn}
                          onChange={(e) => setNewPortalLabelEn(e.target.value)}
                          placeholder="English Title (optional)"
                          className="sm:col-span-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5"
                        />
                        <input
                          type="url"
                          value={newPortalUrl}
                          onChange={(e) => setNewPortalUrl(e.target.value)}
                          placeholder="http://103.166.74.212:2020/..."
                          className="sm:col-span-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono"
                        />
                        <select
                          value={newPortalRoleTag}
                          onChange={(e) =>
                            setNewPortalRoleTag(
                              e.target.value as 'student' | 'admin' | 'teacher' | 'guardian'
                            )
                          }
                          className="sm:col-span-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5"
                        >
                          <option value="student">Student</option>
                          <option value="admin">Admin</option>
                          <option value="teacher">Teacher</option>
                          <option value="guardian">Guardian</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            if (!newPortalLabelBn.trim() || !isValidExternalPortalUrl(newPortalUrl)) {
                              pushToast(
                                tr('সঠিক লিংক দিন', 'Invalid Portal URL', 'رابط غير صالح'),
                                tr('http:// বা https:// দিয়ে শুরু সঠিক লিংক দিন।', 'Enter a valid http:// or https:// URL.', 'أدخل رابطاً صحيحاً.'),
                                'info'
                              );
                              return;
                            }
                            const current = resolveExternalPortals(settingsForm.externalPortals);
                            const updated = [
                              ...current,
                              {
                                id: `erp-custom-${Date.now()}`,
                                labelBn: newPortalLabelBn.trim(),
                                labelEn: newPortalLabelEn.trim() || newPortalLabelBn.trim(),
                                subtitleBn: 'মাহারাত মডেল মাদ্রাসা এক্সটার্নাল পোর্টাল',
                                subtitleEn: 'Maharat Model Madrasah External Portal',
                                url: newPortalUrl.trim(),
                                category: (newPortalRoleTag === 'teacher' ? 'other' : newPortalRoleTag) as 'student' | 'guardian' | 'admin' | 'other',
                                active: true,
                              },
                            ];
                            setSettingsForm({ ...settingsForm, externalPortals: updated });
                            setNewPortalLabelBn('');
                            setNewPortalLabelEn('');
                            setNewPortalUrl('');
                          }}
                          className="sm:col-span-2 py-1.5 px-3 rounded-lg bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white font-extrabold cursor-pointer"
                        >
                          + {tr('যুক্ত করুন', 'Add Link', 'إضافة')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Official Logo, Branding & Media Manager */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <Image className="w-5 h-5 text-[#005a6e] dark:text-[#5eead4]" />
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {tr(
                          'প্রতিষ্ঠানের অফিশিয়াল লোগো, মনোগ্রাম ও মিডিয়া ম্যানেজার',
                          'Official Logo, Monogram & Media Manager',
                          'إدارة شعار المدرسة الرسمي والوسائط'
                        )}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      {tr(
                        'মাহারাত মডেল মাদ্রাসার অফিশিয়াল লোগো প্রিসেট নির্বাচন করুন, কম্পিউটার/ফোন থেকে নতুন লোগো আপলোড করুন অথবা কাস্টম লোগো URL ব্যবহার করুন।',
                        'Select an official Maharat Model Madrasah logo preset, upload a custom logo image file from your device, or enter a custom logo URL.',
                        'اختر أحد شعارات مدرسة المهارات الرسمية، أو قم برفع ملف شعار جديد من جهازك، أو أدخل رابط الشعار مباشرة.'
                      )}
                    </p>

                    {/* Live Logo Preview & 1-Click Preset Selector */}
                    <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-slate-800/70 border border-purple-200 dark:border-slate-700 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="text-xs font-extrabold uppercase tracking-wider text-purple-900 dark:text-amber-300">
                            {tr('বর্তমান সক্রিয় লোগো প্রিভিউ', 'Active Website Logo Preview', 'معاينة الشعار النشط حالياً')}
                          </span>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            {tr(
                              'ওয়েবসাইটের হেডার, ফুটার ও A4 অফিশিয়াল প্যাডে এই লোগোটি প্রদর্শিত হবে।',
                              'Displayed across the website header, footer, and printable A4 letterheads.',
                              'يظهر هذا الشعار في ترويسة الموقع والتذييل والمستندات الرسمية A4.'
                            )}
                          </p>
                        </div>

                        {/* Upload from device button */}
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer shadow-xs shrink-0">
                          <Image className="w-4 h-4" />
                          <span>
                            {tr('ডিভাইস থেকে নতুন লোগো আপলোড করুন', 'Upload Logo File', 'رفع ملف شعار جديد')}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={!canEditActiveTab}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = () => {
                                if (typeof reader.result === 'string') {
                                  const updated = { ...settingsForm, logoUrl: reader.result };
                                  setSettingsForm(updated);
                                  updateSettings(updated);
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-purple-200 flex items-center justify-center min-h-[84px]">
                        {settingsForm.logoUrl ? (
                          <img
                            src={settingsForm.logoUrl}
                            alt="Active Logo Preview"
                            className="max-h-20 w-auto object-contain"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No Logo Selected (Using Default Icon)</span>
                        )}
                      </div>

                      {/* 4 Quick Logo Presets */}
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {tr(
                            '১-ক্লিকে অফিশিয়াল লোগো পরিবর্তন করুন (Official Logo Presets):',
                            '1-Click Official Logo Presets:',
                            'قوالب الشعار الرسمية بضغطة واحدة:'
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                          {[
                            {
                              label: 'লোগো ১: EIIN ও কোডসহ (ট্রান্সপারেন্ট)',
                              url: '/assets/maharat/01-Branding_Logo-with-EIIN_02.svg',
                            },
                            {
                              label: 'লোগো ২: EIIN ও কোডসহ (হোয়াইট ব্যানার)',
                              url: '/assets/maharat/01-Branding_Logo-with-EIIN_01.svg',
                            },
                            {
                              label: 'লোগো ৩: ওয়েবসাইট অফিশিয়াল ব্যানার',
                              url: '/assets/maharat/maharat-front-logo.jpg',
                            },
                            {
                              label: 'লোগো ৪: গোল মনোগ্রাম (MMM Emblem)',
                              url: '/assets/maharat/maharat-favicon.png',
                            },
                          ].map((preset) => {
                            const isSelected = settingsForm.logoUrl === preset.url;
                            return (
                              <button
                                key={preset.url}
                                type="button"
                                disabled={!canEditActiveTab}
                                onClick={() => {
                                  const updated = { ...settingsForm, logoUrl: preset.url };
                                  setSettingsForm(updated);
                                  updateSettings(updated);
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                                  isSelected
                                    ? 'bg-purple-100 dark:bg-purple-900/60 border-purple-600 ring-2 ring-purple-500/40'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                                }`}
                              >
                                <div className="h-11 bg-white rounded-lg p-1 flex items-center justify-center border border-slate-100">
                                  <img
                                    src={preset.url}
                                    alt={preset.label}
                                    className="max-h-9 w-auto object-contain"
                                  />
                                </div>
                                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                  {preset.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Logo URL */}
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {tr('মাদ্রাসা মনোগ্রাম / লোগো ইউআরএল', 'Logo Monogram URL', 'رابط شعار المعهد')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.logoUrl || ''}
                          onChange={(e) => {
                            const updated = { ...settingsForm, logoUrl: e.target.value };
                            setSettingsForm(updated);
                            updateSettings(updated);
                          }}
                          placeholder="/assets/maharat/01-Branding_Logo-with-EIIN_02.svg"
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-mono"
                        />
                      </div>

                      {/* Hero Banner URL */}
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {tr('হিরো ব্যানার ব্যাকগ্রাউন্ড ইমেজ ইউআরএল', 'Hero Banner Background Image URL', 'رابط صورة خلفية اللافتة')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.heroBannerUrl || ''}
                          onChange={(e) => {
                            const updated = { ...settingsForm, heroBannerUrl: e.target.value };
                            setSettingsForm(updated);
                            updateSettings(updated);
                          }}
                          placeholder="/assets/maharat/maharat-campus.jpg"
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-mono"
                        />
                      </div>

                      {/* Hero Video URL */}
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {tr('ক্যাম্পাস পরিচিতি ভিডিও ইউআরএল (YouTube / Direct)', 'Campus Intro Video URL', 'رابط فيديو جولة الحرم')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.heroVideoUrl || ''}
                          onChange={(e) => {
                            const updated = { ...settingsForm, heroVideoUrl: e.target.value };
                            setSettingsForm(updated);
                            updateSettings(updated);
                          }}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-mono"
                        />
                      </div>

                      {/* Prospectus PDF URL */}
                      <div>
                        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          {tr('অফিসিয়াল ভর্তি প্রসপেক্টাস / ব্রোশিওর PDF লিঙ্ক', 'Official Prospectus / Brochure PDF URL', 'رابط النشرة التعريفية للقبول')}
                        </label>
                        <input
                          type="text"
                          disabled={!canEditActiveTab}
                          value={settingsForm.prospectusPdfUrl || ''}
                          onChange={(e) => {
                            const updated = { ...settingsForm, prospectusPdfUrl: e.target.value };
                            setSettingsForm(updated);
                            updateSettings(updated);
                          }}
                          placeholder="/assets/maharat/maharat-prospectus-2026.pdf"
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Page & Section Visibility Manager */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        {tr(
                          'ওয়েবসাইট পেইজ ও সেকশন ভিজিবিলিটি কন্ট্রোলার (অন / অফ টগল)',
                          'Website Pages & Sections Visibility Controller (ON/OFF)',
                          'التحكم في ظهور صفحات وأقسام الموقع (تشغيل / إيقاف)'
                        )}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      {tr(
                        'যেকোনো সেকশন বা পেইজ এখান থেকে সুইচ অফ করলে পাবলিক ওয়েবসাইট থেকে তা তৎক্ষণাৎ অদৃশ্য হয়ে যাবে।',
                        'Toggling any section OFF immediately hides it from the public website navigation and page render.',
                        'إيقاف تفعيل أي قسم يخفيه فوراً من الموقع العام وقوائم التنقل.'
                      )}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {[
                        { key: 'hero', bn: 'হিরো ব্যানার ও মূল হেডার', en: 'Hero Banner Section', ar: 'اللافتة الرئيسية' },
                        { key: 'highlights', bn: 'শীর্ষ একাডেমিক বৈশিষ্ট্য', en: 'Key Highlights Section', ar: 'المميزات الرئيسية' },
                        { key: 'infographics', bn: '৮টি মাদ্রাসা ইনফোগ্রাফিক ও রুট', en: '8 Madrasah Infographics & Transport', ar: 'الرسوم والمعلوماتية والنقل' },
                        { key: 'courses', bn: 'কারিকুলাম ও একাডেমিক কোর্স', en: 'Curriculum & Courses', ar: 'المناهج والدورات' },
                        { key: 'campusVideo', bn: 'ক্যাম্পাস লাইভ ভিডিও ট্যুর', en: 'Campus Video Tour', ar: 'فيديو الحرم المدرسي' },
                        { key: 'departmentVideos', bn: 'বিভাগীয় ভিডিও শোকেস', en: 'Departmental Videos', ar: 'مقاطع فيديو الأقسام' },
                        { key: 'activityVideos', bn: 'সহশিক্ষা ও কার্যক্রম ভিডিও', en: 'Activity & Co-Curricular Videos', ar: 'فيديوهات الأنشطة' },
                        { key: 'feeCalculator', bn: 'স্মার্ট টিউশন ফি ক্যালকুলেটর', en: 'Smart Tuition Fee Calculator', ar: 'حاسبة الرسوم الدراسية' },
                        { key: 'notices', bn: 'ডিজিタル নোটিশ বোর্ড', en: 'Notice Board', ar: 'لوحة الإعلانات' },
                        { key: 'events', bn: 'আসন্ন ইভেন্ট ও সেমিনার', en: 'Upcoming Events & Seminars', ar: 'الفعاليات والندوات' },
                        { key: 'guardianReels', bn: 'অভিভাবক মতামত ও রিলস', en: 'Guardian Testimonials & Reels', ar: 'آراء أولياء الأمور' },
                        { key: 'faq', bn: 'সাধারণ প্রশ্নোত্তর (FAQ)', en: 'FAQ Section', ar: 'الأسئلة الشائعة' },
                        { key: 'contact', bn: 'যোগাযোগ ও সরাসরি অনুসন্ধান', en: 'Contact & Inquiry Portal', ar: 'التواصل والاستفسار' },
                        { key: 'admissionModal', bn: 'অনলাইন ভর্তি আবেদন ফর্ম', en: 'Online Admission Portal Modal', ar: 'نموذج التقديم للقبول' },
                      ].map((item) => {
                        const isVisible =
                          settingsForm.pageVisibility?.[item.key as keyof typeof settingsForm.pageVisibility] !== false;

                        return (
                          <div
                            key={item.key}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                              isVisible
                                ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/60'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                            }`}
                          >
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {language === 'bn' ? item.bn : language === 'ar' ? item.ar : item.en}
                            </span>

                            <button
                              type="button"
                              disabled={!canEditActiveTab}
                              onClick={() => {
                                const currentVis = settingsForm.pageVisibility || {
                                  heroBanner: true,
                                  infographics: true,
                                  courses: true,
                                  campusVideo: true,
                                  departmentVideos: true,
                                  activityVideos: true,
                                  feeCalculator: true,
                                  notices: true,
                                  events: true,
                                  guardianReels: true,
                                  faq: true,
                                  contactInquiry: true,
                                  admissionModal: true,
                                };
                                const updatedVisibility: PageVisibilityConfig = {
                                  heroBanner: currentVis.heroBanner ?? true,
                                  infographics: currentVis.infographics ?? true,
                                  courses: currentVis.courses ?? true,
                                  campusVideo: currentVis.campusVideo ?? true,
                                  departmentVideos: currentVis.departmentVideos ?? true,
                                  activityVideos: currentVis.activityVideos ?? true,
                                  feeCalculator: currentVis.feeCalculator ?? true,
                                  notices: currentVis.notices ?? true,
                                  events: currentVis.events ?? true,
                                  guardianReels: currentVis.guardianReels ?? true,
                                  faq: currentVis.faq ?? true,
                                  contactInquiry: currentVis.contactInquiry ?? true,
                                  admissionModal: currentVis.admissionModal ?? true,
                                  hero: currentVis.hero ?? true,
                                  highlights: currentVis.highlights ?? true,
                                  contact: currentVis.contact ?? true,
                                  [item.key]: !isVisible,
                                };
                                const updated = { ...settingsForm, pageVisibility: updatedVisibility };
                                setSettingsForm(updated);
                                updateSettings(updated);
                              }}
                              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                                isVisible ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                                  isVisible ? 'right-1 rtl:right-auto rtl:left-1' : 'left-1 rtl:left-auto rtl:right-1'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: VERSION & RELEASE MANAGER (Visibility Controls + Rollback) */}
              {activeTab === 'releases' && (
                <AdminVersionManagerTab
                  canEdit={canEditActiveTab}
                  canDelete={canDeleteActiveTab}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal: Lead Full Application Details Inspector */}
      {inspectingLead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inspect-lead-title"
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-[#2e0249] to-purple-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 id="inspect-lead-title" className="text-base font-bold">
                  {tr('আবেদনকারীর বিস্তারিত তথ্য:', 'Applicant Dossier:', 'ملف المتقدم:')}{' '}
                  {loc(inspectingLead.name)}
                </h3>
                <p className="text-xs text-purple-200 font-mono">
                  {tr('স্ট্যাটাস:', 'Status:', 'الحالة:')} {localizeLeadStatus(inspectingLead.status)} ·{' '}
                  {inspectingLead.source}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingLead(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/70 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {tr('ফোন:', 'Phone:', 'الهاتف:')}
                  </span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {inspectingLead.phone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {tr('ইমেইল:', 'Email:', 'البريد الإلكتروني:')}
                  </span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {inspectingLead.email}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {tr('নির্বাচিত কোর্স:', 'Associated Course:', 'البرنامج المختار:')}
                  </span>
                  <span className="font-bold text-purple-900 dark:text-purple-300">
                    {loc(inspectingLead.courseTitle)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 block">
                    {tr('বার্তা / নোট:', 'Message / Notes:', 'الرسالة / الملاحظات:')}
                  </span>
                  <span className="text-slate-800 dark:text-slate-200">
                    {loc(inspectingLead.message)}
                  </span>
                </div>
              </div>

              {inspectingLead.detailedData && (
                <div className="space-y-3">
                  <div className="font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                    {tr(
                      '৬-ধাপের ভর্তি ফরমের পূর্ণাঙ্গ তথ্য',
                      '6-Step Admission Form Dossier',
                      'بيانات استمارة القبول الكاملة (٦ خطوات)'
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-purple-50/50 dark:bg-purple-950/30 p-4 rounded-xl border border-purple-100 dark:border-purple-800/60">
                    <div>
                      <span className="text-slate-500 block">
                        {tr('শিক্ষার্থীর নাম:', 'Student Name:', 'اسم الطالب:')}
                      </span>
                      <span className="font-bold">
                        {loc(inspectingLead.detailedData.studentNameBn)} (
                        {inspectingLead.detailedData.studentNameEn})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        {tr('জন্ম তারিখ ও লিঙ্গ:', 'DOB & Gender:', 'تاريخ الميلاد والجنس:')}
                      </span>
                      <span className="font-bold">
                        {inspectingLead.detailedData.dob || 'N/A'} ·{' '}
                        {loc(inspectingLead.detailedData.gender || 'N/A')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        {tr('বিভাগ ও শ্রেণি:', 'Department & Class:', 'القسم والصف:')}
                      </span>
                      <span className="font-bold text-purple-900 dark:text-purple-300">
                        {loc(
                          inspectingLead.detailedData.department ||
                            inspectingLead.preferredDepartment ||
                            'Academic'
                        )}{' '}
                        —{' '}
                        {loc(
                          inspectingLead.detailedData.targetClass ||
                            inspectingLead.targetClass ||
                            'N/A'
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        {tr('আবাসন ধরন:', 'Residential Status:', 'نوع الإقامة:')}
                      </span>
                      <span className="font-bold">
                        {loc(
                          inspectingLead.detailedData.academicCategory ||
                            inspectingLead.preferredAccommodation ||
                            'অনাবাসিক'
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        {tr('পিতার তথ্য:', 'Father Info:', 'بيانات الأب:')}
                      </span>
                      <span className="font-bold">
                        {loc(inspectingLead.detailedData.fatherNameBn)} (
                        {inspectingLead.detailedData.fatherMobile})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">
                        {tr('মাতার তথ্য:', 'Mother Info:', 'بيانات الأم:')}
                      </span>
                      <span className="font-bold">
                        {loc(inspectingLead.detailedData.motherNameBn)} (
                        {inspectingLead.detailedData.motherMobile})
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => generateAdmissionPDF(inspectingLead)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-700 hover:from-purple-800 hover:to-fuchsia-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {tr(
                    'ভর্তি আবেদন ফরম PDF ডাউনলোড',
                    'Download Official Admission Application PDF',
                    'تحميل استمارة القبول الرسمية PDF'
                  )}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setInspectingLead(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                {tr('বন্ধ করুন', 'Close Dossier', 'إغلاق')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Personal Profile & Digital Signature Vault Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <ChangePasswordDialog
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onChanged={() => setIsChangePasswordOpen(false)}
      />

      {/* Full Changelog & Release Notes Modal */}
      <ReleaseNotesModal
        isOpen={isReleaseNotesOpen}
        onClose={() => setIsReleaseNotesOpen(false)}
      />
    </div>
  );
};
