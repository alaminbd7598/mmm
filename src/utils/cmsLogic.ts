import {
  AccommodationMode,
  AdminRole,
  AdminUser,
  AdmissionLead,
  AIBotConfig,
  BrandLogoAsset,
  CMSState,
  ConfigurableRole,
  CourseItem,
  EmailNotificationLog,
  FeeCalculatorConfig,
  FeeStructureItem,
  HafizGraduateItem,
  LeadStatus,
  LeaveStatus,
  NoticeCategory,
  NoticeItem,
  PermissionAction,
  PhotoGalleryItem,
  ResourcePermission,
  RolePermissionMatrix,
  SeoMetaConfig,
  SiteSettings,
  TeacherLeaveRequest,
} from '../types/cms';
import { resolveVersionManagerConfig } from './versionLogic';
import { isAllowedEmbedUrl, isSafeMediaUrl } from './safeUrl';
import { isValidEmail, isValidPhone } from './contactValidation';

export type AdminTabId =
  | 'overview'
  | 'tokens'
  | 'virtual-office'
  | 'calendar'
  | 'blog'
  | 'ai-publisher'
  | 'branding'
  | 'seo-meta'
  | 'leaves'
  | 'career'
  | 'madrasah-infographics'
  | 'videos'
  | 'popup-ai-fees'
  | 'backup-ai'
  | 'releases'
  | 'news'
  | 'notices'
  | 'courses'
  | 'events'
  | 'leads'
  | 'emails'
  | 'users'
  | 'settings';

export const ALL_ADMIN_TABS: { id: AdminTabId; label: string; category: string }[] = [
  { id: 'overview', label: 'Dashboard Overview', category: 'Core' },
  { id: 'leads', label: 'লিড টু অ্যাডমিশন (Lead to Admission)', category: 'Admissions & CRM' },
  { id: 'tokens', label: 'Admission Token 2027 (ভর্তি টোকেন ও ডিসকাউন্ট)', category: 'Admissions & CRM' },
  { id: 'virtual-office', label: 'Virtual Office Live Desk (ভার্চুয়াল অফিস)', category: 'Admissions & CRM' },
  { id: 'popup-ai-fees', label: 'Popup, MMM AI Agent & Fee Calculator', category: 'Admissions & CRM' },
  { id: 'courses', label: 'Curriculum & Syllabus', category: 'Academics' },
  { id: 'notices', label: 'Notice Board Manager', category: 'Academics' },
  { id: 'events', label: 'Events & Seminars', category: 'Academics' },
  { id: 'calendar', label: 'Institutional Academic Calendar (গুগল সিঙ্ক)', category: 'Academics' },
  { id: 'madrasah-infographics', label: 'Madrasah Infographics & Transport', category: 'Academics' },
  { id: 'career', label: 'ক্যারিয়ার ও নিয়োগ ব্যবস্থাপনা (Career & Hiring)', category: 'HR & Faculty' },
  { id: 'leaves', label: 'Teacher Leave Management (ছুটি ব্যবস্থাপনা)', category: 'HR & Faculty' },
  { id: 'videos', label: 'মিডিয়া শোকেস (Media Showcase & Hifz Tree)', category: 'Website & Media' },
  { id: 'blog', label: 'Blog & Articles Manager (ব্লগ ও API পब्लিশ)', category: 'Website & Media' },
  { id: 'news', label: 'Scrolling News Ticker', category: 'Website & Media' },
  { id: 'emails', label: 'Email Notification Logs', category: 'Website & Media' },
  { id: 'ai-publisher', label: 'AI Smart Publishing Assistant (এআই পাবলিশার)', category: 'Administration' },
  { id: 'branding', label: 'Branding, Logo Vault & Mobile Bar', category: 'Administration' },
  { id: 'seo-meta', label: 'SEO & Social Meta Editor (এসইও ও ওপেন গ্রাফ মেটা)', category: 'Administration' },
  { id: 'users', label: 'User Roles & RBAC Matrix', category: 'Administration' },
  { id: 'settings', label: 'Campus Maps & Site Settings', category: 'Administration' },
  { id: 'backup-ai', label: 'Backup, Restore & AI Extractor', category: 'Administration' },
  { id: 'releases', label: 'Version & Release Manager (ভার্সন ও রোলব্যাক)', category: 'Administration' },
];

export const CONFIGURABLE_ADMIN_ROLES: ConfigurableRole[] = [
  'Super Admin',
  'Chairman / Managing Director',
  'Principal / Vice Principal',
  'Coordinators / Teachers',
  'Content Managers',
];

export function normalizeAdminRole(role?: string): AdminRole {
  if (!role) return 'Coordinators / Teachers';
  const r = role.trim();
  if (r === 'Super Admin') return 'Super Admin';
  if (r === 'Chairman / Managing Director' || r === 'Chairman' || r === 'Managing Director') {
    return 'Chairman / Managing Director';
  }
  if (r === 'Principal / Vice Principal' || r === 'Principal' || r === 'Vice Principal') {
    return 'Principal / Vice Principal';
  }
  if (r === 'Coordinators / Teachers' || r === 'Teacher' || r === 'Coordinator') {
    return 'Coordinators / Teachers';
  }
  if (r === 'Content Managers' || r === 'Content Manager') {
    return 'Content Managers';
  }
  return 'Coordinators / Teachers';
}

export function buildCRUDPermission(
  create: boolean,
  read: boolean,
  update: boolean,
  del: boolean
): ResourcePermission {
  const safeRead = read || create || update || del;
  return {
    create: safeRead ? create : false,
    read: safeRead,
    update: safeRead ? update : false,
    delete: safeRead ? del : false,
    view: safeRead,
    edit: safeRead ? update || create : false,
  };
}

export function normalizeResourcePermission(perm?: Partial<ResourcePermission>): ResourcePermission {
  if (!perm) {
    return buildCRUDPermission(false, false, false, false);
  }
  const read = Boolean(perm.read ?? perm.view);
  const update = Boolean(perm.update ?? perm.edit);
  const create = Boolean(perm.create ?? perm.edit);
  const del = Boolean(perm.delete);
  return buildCRUDPermission(create, read, update, del);
}

export const DEFAULT_RBAC_MATRIX: RolePermissionMatrix = {
  'Super Admin': {
    overview: buildCRUDPermission(true, true, true, true),
    tokens: buildCRUDPermission(true, true, true, true),
    'virtual-office': buildCRUDPermission(true, true, true, true),
    calendar: buildCRUDPermission(true, true, true, true),
    blog: buildCRUDPermission(true, true, true, true),
    'ai-publisher': buildCRUDPermission(true, true, true, true),
    branding: buildCRUDPermission(true, true, true, true),
    'seo-meta': buildCRUDPermission(true, true, true, true),
    leaves: buildCRUDPermission(true, true, true, true),
    career: buildCRUDPermission(true, true, true, true),
    'madrasah-infographics': buildCRUDPermission(true, true, true, true),
    videos: buildCRUDPermission(true, true, true, true),
    'popup-ai-fees': buildCRUDPermission(true, true, true, true),
    'backup-ai': buildCRUDPermission(true, true, true, true),
    releases: buildCRUDPermission(true, true, true, true),
    news: buildCRUDPermission(true, true, true, true),
    notices: buildCRUDPermission(true, true, true, true),
    courses: buildCRUDPermission(true, true, true, true),
    events: buildCRUDPermission(true, true, true, true),
    leads: buildCRUDPermission(true, true, true, true),
    emails: buildCRUDPermission(true, true, true, true),
    users: buildCRUDPermission(true, true, true, true),
    settings: buildCRUDPermission(true, true, true, true),
  },
  'Chairman / Managing Director': {
    overview: buildCRUDPermission(true, true, true, true),
    tokens: buildCRUDPermission(true, true, true, true),
    'virtual-office': buildCRUDPermission(true, true, true, true),
    calendar: buildCRUDPermission(true, true, true, true),
    blog: buildCRUDPermission(true, true, true, true),
    'ai-publisher': buildCRUDPermission(true, true, true, true),
    branding: buildCRUDPermission(true, true, true, true),
    'seo-meta': buildCRUDPermission(true, true, true, true),
    leaves: buildCRUDPermission(true, true, true, true),
    career: buildCRUDPermission(true, true, true, true),
    'madrasah-infographics': buildCRUDPermission(true, true, true, true),
    videos: buildCRUDPermission(true, true, true, true),
    'popup-ai-fees': buildCRUDPermission(true, true, true, true),
    'backup-ai': buildCRUDPermission(true, true, true, false),
    releases: buildCRUDPermission(true, true, true, false),
    news: buildCRUDPermission(true, true, true, true),
    notices: buildCRUDPermission(true, true, true, true),
    courses: buildCRUDPermission(true, true, true, true),
    events: buildCRUDPermission(true, true, true, true),
    leads: buildCRUDPermission(true, true, true, true),
    emails: buildCRUDPermission(false, true, false, false),
    users: buildCRUDPermission(false, false, false, false),
    settings: buildCRUDPermission(true, true, true, false),
  },
  'Principal / Vice Principal': {
    overview: buildCRUDPermission(false, true, true, false),
    tokens: buildCRUDPermission(true, true, true, true),
    'virtual-office': buildCRUDPermission(true, true, true, false),
    calendar: buildCRUDPermission(true, true, true, true),
    blog: buildCRUDPermission(true, true, true, true),
    'ai-publisher': buildCRUDPermission(true, true, true, false),
    branding: buildCRUDPermission(true, true, true, false),
    'seo-meta': buildCRUDPermission(true, true, true, false),
    leaves: buildCRUDPermission(true, true, true, true),
    career: buildCRUDPermission(true, true, true, true),
    'madrasah-infographics': buildCRUDPermission(true, true, true, true),
    videos: buildCRUDPermission(true, true, true, true),
    'popup-ai-fees': buildCRUDPermission(false, true, true, false),
    'backup-ai': buildCRUDPermission(false, true, true, false),
    releases: buildCRUDPermission(false, false, false, false),
    news: buildCRUDPermission(true, true, true, true),
    notices: buildCRUDPermission(true, true, true, true),
    courses: buildCRUDPermission(true, true, true, true),
    events: buildCRUDPermission(true, true, true, true),
    leads: buildCRUDPermission(true, true, true, true),
    emails: buildCRUDPermission(false, true, false, false),
    users: buildCRUDPermission(false, false, false, false),
    settings: buildCRUDPermission(false, true, false, false),
  },
  'Coordinators / Teachers': {
    overview: buildCRUDPermission(false, true, false, false),
    tokens: buildCRUDPermission(false, true, false, false),
    'virtual-office': buildCRUDPermission(false, true, false, false),
    calendar: buildCRUDPermission(false, true, false, false),
    blog: buildCRUDPermission(true, true, false, false),
    'ai-publisher': buildCRUDPermission(false, false, false, false),
    branding: buildCRUDPermission(false, false, false, false),
    'seo-meta': buildCRUDPermission(false, false, false, false),
    leaves: buildCRUDPermission(true, true, true, false),
    career: buildCRUDPermission(false, true, false, false),
    'madrasah-infographics': buildCRUDPermission(false, false, false, false),
    videos: buildCRUDPermission(false, false, false, false),
    'popup-ai-fees': buildCRUDPermission(false, false, false, false),
    'backup-ai': buildCRUDPermission(false, false, false, false),
    releases: buildCRUDPermission(false, false, false, false),
    news: buildCRUDPermission(false, false, false, false),
    notices: buildCRUDPermission(false, true, false, false),
    courses: buildCRUDPermission(true, true, true, false),
    events: buildCRUDPermission(false, true, false, false),
    leads: buildCRUDPermission(false, false, false, false),
    emails: buildCRUDPermission(false, false, false, false),
    users: buildCRUDPermission(false, false, false, false),
    settings: buildCRUDPermission(false, false, false, false),
  },
  'Content Managers': {
    overview: buildCRUDPermission(false, true, false, false),
    tokens: buildCRUDPermission(false, true, false, false),
    'virtual-office': buildCRUDPermission(false, true, true, false),
    calendar: buildCRUDPermission(true, true, true, false),
    blog: buildCRUDPermission(true, true, true, true),
    'ai-publisher': buildCRUDPermission(true, true, true, false),
    branding: buildCRUDPermission(true, true, true, false),
    'seo-meta': buildCRUDPermission(true, true, true, false),
    leaves: buildCRUDPermission(false, true, false, false),
    career: buildCRUDPermission(true, true, true, false),
    'madrasah-infographics': buildCRUDPermission(true, true, true, true),
    videos: buildCRUDPermission(true, true, true, true),
    'popup-ai-fees': buildCRUDPermission(true, true, true, false),
    'backup-ai': buildCRUDPermission(false, true, true, false),
    releases: buildCRUDPermission(false, false, false, false),
    news: buildCRUDPermission(true, true, true, true),
    notices: buildCRUDPermission(true, true, true, true),
    courses: buildCRUDPermission(true, true, true, true),
    events: buildCRUDPermission(true, true, true, true),
    leads: buildCRUDPermission(true, true, true, false),
    emails: buildCRUDPermission(false, true, false, false),
    users: buildCRUDPermission(false, false, false, false),
    settings: buildCRUDPermission(false, false, false, false),
  },
};

/**
 * Pure helper to toggle a specific CRUD action ('create' | 'read' | 'update' | 'delete' | 'view' | 'edit')
 * for a given role and resource in the RBAC Matrix.
 */
export function applyRolePermissionToggle(
  currentMatrix: RolePermissionMatrix | undefined,
  role: ConfigurableRole,
  resource: string,
  action: PermissionAction,
  value: boolean
): RolePermissionMatrix {
  const baseMatrix = currentMatrix || DEFAULT_RBAC_MATRIX;
  // Safeguard: Super Admin's access to 'users' (User Accounts & RBAC Matrix) cannot be revoked
  if (role === 'Super Admin' && resource === 'users') {
    return {
      ...baseMatrix,
      'Super Admin': {
        ...(baseMatrix['Super Admin'] || DEFAULT_RBAC_MATRIX['Super Admin']),
        users: buildCRUDPermission(true, true, true, true),
      },
    };
  }
  // Safeguard: Non-Super Admin roles cannot be granted 'users' management access
  if (role !== 'Super Admin' && resource === 'users') {
    return {
      ...baseMatrix,
      [role]: {
        ...(baseMatrix[role] || DEFAULT_RBAC_MATRIX[role]),
        users: buildCRUDPermission(false, false, false, false),
      },
    };
  }

  const roleEntry = baseMatrix[role] || DEFAULT_RBAC_MATRIX[role] || {};
  const currentPerm = normalizeResourcePermission(
    roleEntry[resource] || DEFAULT_RBAC_MATRIX[role]?.[resource]
  );

  let { create = false, read = false, update = false, delete: del = false } = currentPerm;

  if (action === 'read' || action === 'view') {
    read = value;
    if (!read) {
      create = false;
      update = false;
      del = false;
    }
  } else if (action === 'create') {
    create = value;
    if (create) read = true;
  } else if (action === 'update') {
    update = value;
    if (update) read = true;
  } else if (action === 'edit') {
    create = value;
    update = value;
    if (value) read = true;
  } else if (action === 'delete') {
    del = value;
    if (del) read = true;
  }

  const nextPerm = buildCRUDPermission(create, read, update, del);

  return {
    ...baseMatrix,
    [role]: {
      ...roleEntry,
      [resource]: nextPerm,
    },
  };
}

/**
 * Checks granular RBAC permission ('create' | 'read' | 'update' | 'delete' | 'view' | 'edit')
 * for a given role and admin resource.
 * Only Super Admin can manage user accounts and configure the RBAC matrix ('users').
 */
export function hasRolePermission(
  role: AdminRole | string,
  resource: AdminTabId,
  action: PermissionAction = 'view',
  customMatrix?: RolePermissionMatrix
): boolean {
  const normalizedRole = normalizeAdminRole(role);
  // Strict Super Admin Control: Only Super Admin can access or modify User Accounts & RBAC Matrix
  if (resource === 'users') {
    return normalizedRole === 'Super Admin';
  }
  // If no custom matrix overrides Super Admin, Super Admin defaults to true across all resources
  const matrix = customMatrix || DEFAULT_RBAC_MATRIX;
  const rolePerms =
    matrix[normalizedRole] ||
    (matrix as Record<string, Record<string, ResourcePermission>>)[role];
  if (!rolePerms) {
    return normalizedRole === 'Super Admin';
  }
  const rawPerm = rolePerms[resource] || DEFAULT_RBAC_MATRIX[normalizedRole]?.[resource];
  if (!rawPerm) {
    return normalizedRole === 'Super Admin';
  }
  const resPerm = normalizeResourcePermission(rawPerm);
  if (action === 'read' || action === 'view') return Boolean(resPerm.read);
  if (action === 'create') return Boolean(resPerm.read && resPerm.create);
  if (action === 'update') return Boolean(resPerm.read && resPerm.update);
  if (action === 'edit') return Boolean(resPerm.read && (resPerm.update || resPerm.create || resPerm.edit));
  if (action === 'delete') return Boolean(resPerm.read && resPerm.delete);
  return false;
}

/**
 * Checks whether a user with a given role is permitted to access (read/view) a specific admin tab/resource.
 */
export function canAccessAdminResource(
  role: AdminRole | string,
  resource: AdminTabId,
  customMatrix?: RolePermissionMatrix
): boolean {
  return hasRolePermission(role, resource, 'read', customMatrix);
}

export const LEAVE_TYPE_OPTIONS: { en: string; bn: string; ar: string }[] = [
  {
    en: 'Casual Leave',
    bn: 'নৈমিত্তিক ছুটি (Casual Leave)',
    ar: 'إجازة اعتيادية (Casual Leave)',
  },
  {
    en: 'Medical / Sick Leave',
    bn: 'অসুস্থতাজনিত ছুটি (Medical / Sick Leave)',
    ar: 'إجازة مرضية (Medical Leave)',
  },
  {
    en: 'Emergency Family Leave',
    bn: 'জরুরি পারিবারিক ছুটি (Emergency Family Leave)',
    ar: 'إجازة عائلية طارئة (Emergency Leave)',
  },
  {
    en: 'Academic / Exam Leave',
    bn: 'উচ্চশিক্ষা ও পরীক্ষা ছুটি (Academic / Exam Leave)',
    ar: 'إجازة دراسية / امتحانات (Exam Leave)',
  },
  {
    en: 'Hajj / Umrah Pilgrimage Leave',
    bn: 'হজ্জ ও ওমরাহ ছুটি (Hajj / Umrah Leave)',
    ar: 'إجازة حج أو عمرة (Hajj / Umrah)',
  },
  {
    en: 'Maternity / Paternity Leave',
    bn: 'মাতৃত্ব/পিতৃত্বকালীন ছুটি (Maternity / Paternity Leave)',
    ar: 'إجازة أمومة / أبوة (Parental Leave)',
  },
];

export const LEAVE_DEPARTMENT_OPTIONS: { en: string; bn: string; ar: string }[] = [
  {
    en: 'Hifzul Quran & Tajweed Department',
    bn: 'হিফজুল কুরআন ও তাজবীদ বিভাগ',
    ar: 'قسم تحفيظ القرآن الكريم والتجويد',
  },
  {
    en: 'General Academic Department (NCTB & English)',
    bn: 'জেনারেল একাডেমিক বিভাগ (NCTB ও ইংলিশ)',
    ar: 'القسم الأكاديمي العام (NCTB والإنجليزية)',
  },
  {
    en: 'Arabic Literature & Islamic Studies',
    bn: 'আরবি সাহিত্য ও ইসলামিক স্টাডিজ বিভাগ',
    ar: 'قسم اللغة العربية والدراسات الإسلامية',
  },
  {
    en: 'IT, Coding & Smart Lab Department',
    bn: 'আইটি, কোডিং ও স্মার্ট ল্যাব বিভাগ',
    ar: 'قسم تقنية المعلومات والبرمجة والمختبر الذكي',
  },
  {
    en: 'Pre-Hifz, Noorani & Day-Care Wing',
    bn: 'প্রি-হিফজ, নূরানী ও ডে-কেয়ার বিভাগ',
    ar: 'قسم التمهيدي والنورانية والرعاية النهارية',
  },
];

export const LEAVE_DESIGNATION_OPTIONS: { en: string; bn: string; ar: string }[] = [
  {
    en: 'Senior Hifz & Qirat Teacher (Ustad)',
    bn: 'সিনিয়র হিফজ ও ক্বিরাত শিক্ষক (উস্তাদ)',
    ar: 'معلم أول للتحفيظ والقراءات (أستاذ)',
  },
  {
    en: 'Senior Academic Lecturer',
    bn: 'সিনিয়র একাডেমিক প্রভাষক',
    ar: 'محاضر أكاديمي أول',
  },
  {
    en: 'Assistant Teacher (General & Science)',
    bn: 'সহকারী শিক্ষক (জেনারেল ও বিজ্ঞান)',
    ar: 'معلم مساعد (العلوم والمواد العامة)',
  },
  {
    en: 'Arabic & Islamic Studies Instructor',
    bn: 'আরবি ও ইসলামিক স্টাডিজ প্রশিক্ষক',
    ar: 'مدرس اللغة العربية والدراسات الإسلامية',
  },
  {
    en: 'IT & Smart Skills Instructor',
    bn: 'আইটি ও স্মার্ট স্কিলস প্রশিক্ষক',
    ar: 'مدرب تقنية المعلومات والمهارات الذكية',
  },
  {
    en: 'Day-Care & Tarbiyah Supervisor',
    bn: 'ডে-কেয়ার ও তারবিয়াহ সুপারভাইজার',
    ar: 'مشرف الرعاية النهارية والتربية',
  },
];

export const LEAVE_REASON_CATEGORY_OPTIONS: { en: string; bn: string; ar: string }[] = [
  {
    en: 'Medical Consultation / Hospital Treatment',
    bn: 'ডাক্তারি পরামর্শ বা চিকিৎসা সেবা',
    ar: 'استشارة طبية أو علاج بالمستشفى',
  },
  {
    en: 'Urgent Family Responsibility',
    bn: 'জরুরি পারিবারিক প্রয়োজন ও দায়িত্ব',
    ar: 'مسؤولية أو ظرف عائلي طارئ',
  },
  {
    en: 'Higher Education / Board Examination',
    bn: 'উচ্চশিক্ষা বা বোর্ড পরীক্ষায় অংশগ্রহণ',
    ar: 'دراسات عليا أو حضور امتحانات رسمية',
  },
  {
    en: 'Religious Pilgrimage / Ijtema / Umrah',
    bn: 'ধর্মীয় সফর / ওমরাহ / ইজতেমা',
    ar: 'سفر ديني أو أداء العمرة',
  },
  {
    en: 'Out-of-District Personal Travel',
    bn: 'জেলার বাইরে জরুরি ব্যক্তিগত সফর',
    ar: 'سفر شخصي ضروري خارج المنطقة',
  },
];

export const LEAVE_DURATION_OPTIONS: { days: number; en: string; bn: string; ar: string }[] = [
  { days: 1, en: '1 Day (Single Day)', bn: '১ দিন (এক দিনের ছুটি)', ar: 'يوم واحد (١ يوم)' },
  { days: 2, en: '2 Days', bn: '২ দিন', ar: 'يومان (٢ يوم)' },
  { days: 3, en: '3 Days', bn: '৩ দিন', ar: '٣ أيام' },
  { days: 4, en: '4 Days', bn: '৪ দিন', ar: '٤ أيام' },
  { days: 5, en: '5 Days', bn: '৫ দিন', ar: '٥ أيام' },
  { days: 7, en: '7 Days (1 Week)', bn: '৭ দিন (১ সপ্তাহ)', ar: '٧ أيام (أسبوع واحد)' },
  { days: 10, en: '10 Days', bn: '১০ দিন', ar: '١٠ أيام' },
  { days: 15, en: '15 Days (Half Month)', bn: '১৫ দিন (অর্ধ মাস)', ar: '١٥ يوماً' },
];

export const LEAVE_SUBSTITUTE_TEACHER_OPTIONS: { en: string; bn: string; ar: string }[] = [
  {
    en: 'Ustad Qari Abdullah Al-Mamun (Hifz & Tajweed)',
    bn: 'উস্তাদ ক্বারী আব্দুল্লাহ আল-মামুন (হিফজ ও তাজবীদ)',
    ar: 'الأستاذ القارئ عبد الله المأمون (التحفيظ والتجويد)',
  },
  {
    en: 'Maulana Tariqul Islam (Arabic & Islamic Studies)',
    bn: 'মাওলানা তারিকুল ইসলাম (আরবি ও ইসলামিক স্টাডিজ)',
    ar: 'مولانا طارق الإسلام (اللغة العربية والدراسات الإسلامية)',
  },
  {
    en: 'Teacher Farhana Akter (English & Mathematics)',
    bn: 'শিক্ষিকা ফারহানা আক্তার (ইংরেজি ও গণিত)',
    ar: 'المعلمة فرحانة أختر (الإنجليزية والرياضيات)',
  },
  {
    en: 'Teacher Tanvir Hossain (Science & IT Lab)',
    bn: 'শিক্ষক তানভীর হোসেন (বিজ্ঞান ও আইটি ল্যাব)',
    ar: 'المعلم تنوير حسين (العلوم ومختبر التقنية)',
  },
  {
    en: 'Hafez Maulana Zahidul Islam (Day-Care & Nazera)',
    bn: 'হাফেজ মাওলানা জাহিদুল ইসলাম (ডে-কেয়ার ও নাযেরা)',
    ar: 'الحافظ مولانا زاهد الإسلام (الرعاية النهارية والناظرة)',
  },
];

/**
 * Computes the inclusive end date (YYYY-MM-DD) given a start date and number of leave days.
 */
export function computeLeaveEndDate(startDate: string, totalDays: number): string {
  const safeDays = Math.max(1, Math.round(Number(totalDays) || 1));
  const parsed = new Date(`${startDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return startDate;
  }
  parsed.setUTCDate(parsed.getUTCDate() + safeDays - 1);
  return parsed.toISOString().slice(0, 10);
}

/**
 * Validates teacher leave request submission input.
 */
export function validateLeaveRequestInput(
  input: {
    teacherName: string;
    designation: string;
    department: string;
    leaveType: string;
    reasonCategory: string;
    startDate: string;
    totalDays: number;
    substituteTeacher: string;
    phone?: string;
    emergencyPhone?: string;
    reasonDetails?: string;
  },
  lang: 'bn' | 'en' | 'ar' = 'en'
): { valid: boolean; error?: string } {
  const tr = (bn: string, en: string, ar: string) =>
    lang === 'bn' ? bn : lang === 'ar' ? ar : en;

  if (!input.teacherName || input.teacherName.trim().length < 2) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে আবেদনকারী শিক্ষকের নাম নির্বাচন বা পূরণ করুন।',
        'Please provide the applicant teacher name.',
        'يرجى إدخال أو اختيار اسم المعلم مقدم الطلب.'
      ),
    };
  }
  if (!input.designation || !input.designation.trim()) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে ড্রপডাউন থেকে শিক্ষকের পদবি নির্বাচন করুন।',
        'Please select a teacher designation from the dropdown.',
        'يرجى اختيار المسمى الوظيفي للمعلم من القائمة المنسدلة.'
      ),
    };
  }
  if (!input.department || !input.department.trim()) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে ড্রপডাউন থেকে বিভাগ নির্বাচন করুন।',
        'Please select a department from the dropdown.',
        'يرجى اختيار القسم الأكاديمي من القائمة المنسدلة.'
      ),
    };
  }
  if (!input.leaveType || !input.leaveType.trim()) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে ড্রপডাউন থেকে ছুটির ধরন নির্বাচন করুন।',
        'Please select a leave type from the dropdown.',
        'يرجى اختيار نوع الإجازة من القائمة المنسدلة.'
      ),
    };
  }
  if (!input.reasonCategory || !input.reasonCategory.trim()) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে ড্রপডাউন থেকে ছুটির প্রধান কারণ নির্বাচন করুন।',
        'Please select a primary reason from the dropdown.',
        'يرجى اختيار السبب الرئيسي للإجازة من القائمة المنسدلة.'
      ),
    };
  }
  if (!input.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.startDate.trim())) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে ছুটির শুরুর সঠিক তারিখ নির্বাচন করুন।',
        'Please choose a valid leave start date.',
        'يرجى اختيار تاريخ بداية صحيح للإجازة.'
      ),
    };
  }
  if (!Number.isFinite(input.totalDays) || input.totalDays < 1 || input.totalDays > 60) {
    return {
      valid: false,
      error: tr(
        'ছুটির মেয়াদ অবশ্যই ১ থেকে ৬০ দিনের মধ্যে হতে হবে।',
        'Leave duration must be between 1 and 60 days.',
        'يجب أن تكون مدة الإجازة بين يوم واحد و ٦٠ يوماً.'
      ),
    };
  }
  if (!input.substituteTeacher || !input.substituteTeacher.trim()) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে ড্রপডাউন থেকে বিকল্প ক্লাস দায়িত্বপ্রাপ্ত শিক্ষক নির্বাচন করুন।',
        'Please select a substitute / class coverage teacher.',
        'يرجى اختيار المعلم البديل لتغطية الحصص من القائمة المنسدلة.'
      ),
    };
  }
  return { valid: true };
}

/**
 * Filters leave requests by status, department, and search query.
 */
export function filterLeaveRequests(
  leaves: TeacherLeaveRequest[],
  statusFilter: 'All' | LeaveStatus = 'All',
  departmentFilter: string = 'All',
  searchQuery: string = ''
): TeacherLeaveRequest[] {
  const q = searchQuery.trim().toLowerCase();
  return leaves.filter((item) => {
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    const matchesDept = departmentFilter === 'All' || item.department === departmentFilter;
    const matchesQuery =
      !q ||
      item.teacherName.toLowerCase().includes(q) ||
      item.leaveType.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      item.reasonCategory.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q);
    return matchesStatus && matchesDept && matchesQuery;
  });
}

/**
 * Converts ASCII digits to Bengali numerals (০-৯).
 */
export function toBengaliDigits(value: number | string): string {
  const bengaliMap: Record<string, string> = {
    '0': '০',
    '1': '১',
    '2': '২',
    '3': '৩',
    '4': '৪',
    '5': '৫',
    '6': '৬',
    '7': '৭',
    '8': '৮',
    '9': '৯',
  };
  return String(value).replace(/[0-9]/g, (d) => bengaliMap[d] || d);
}

export interface FeeCalculationInput {
  item: FeeStructureItem;
  apply25Discount: boolean;
  apply10Discount: boolean;
  apply5ExtraDiscount: boolean;
  accommodationMode: AccommodationMode;
  config: Pick<
    FeeCalculatorConfig,
    'residentialMonthlyFee' | 'dayCareMonthlyFee' | 'nonResidentialMonthlyFee'
  >;
  transportMonthlyFee?: number;
  transportLabelBn?: string;
  applySiblingDiscount?: boolean;
  siblingTuitionDiscountPercent?: number;
}

export interface FeeCalculationResult {
  baseAdmissionFee: number;
  totalDiscountPercent: number;
  discountAmount: number;
  netAdmissionFee: number;
  monthlyTuitionFee: number;
  siblingTuitionDiscountAmount: number;
  netMonthlyTuitionFee: number;
  accommodationMonthlyFee: number;
  accommodationLabelBn: string;
  transportMonthlyFee: number;
  transportLabelBn: string;
  totalMonthlyFee: number;
  totalPayableAtAdmission: number;
  annualServiceCharge: number;
}

/**
 * Pure calculator for the Interactive Admission Fee & Discount Calculator.
 * Enforces mutually exclusive accommodation mode ('non-residential' | 'residential' | 'daycare'),
 * computes exact discount percentages (25%, 10%, + Extra 5%), and integrates optional
 * Madrasah Transport Route / Distance fee and Sibling Tuition Discount.
 */
export function calculateAdmissionFeeSummary(
  input: FeeCalculationInput
): FeeCalculationResult {
  const baseAdmissionFee = Math.max(0, input.item.admissionFee);

  // Primary discount is either 25% or 10% (or both if toggled), plus extra 5%
  let totalDiscountPercent = 0;
  if (input.apply25Discount) totalDiscountPercent += 25;
  if (input.apply10Discount) totalDiscountPercent += 10;
  if (input.apply5ExtraDiscount) totalDiscountPercent += 5;

  const discountAmount = Math.round((baseAdmissionFee * totalDiscountPercent) / 100);
  const netAdmissionFee = Math.max(0, baseAdmissionFee - discountAmount);

  const monthlyTuitionFee = Math.max(0, input.item.monthlyTuition);
  const siblingDiscPct = input.applySiblingDiscount
    ? Math.max(0, Math.min(50, input.siblingTuitionDiscountPercent ?? 10))
    : 0;
  const siblingTuitionDiscountAmount = Math.round((monthlyTuitionFee * siblingDiscPct) / 100);
  const netMonthlyTuitionFee = Math.max(0, monthlyTuitionFee - siblingTuitionDiscountAmount);

  let accommodationMonthlyFee = 0;
  let accommodationLabelBn = 'অনাবাসিক (শুধু ক্লাস ও টিউশন)';

  if (input.accommodationMode === 'residential') {
    accommodationMonthlyFee = input.config.residentialMonthlyFee;
    accommodationLabelBn = 'আবাসিক ব্যবস্থা (আবাসন + ৩ বেলা খাবার ও নাস্তা)';
  } else if (input.accommodationMode === 'daycare') {
    accommodationMonthlyFee = input.config.dayCareMonthlyFee;
    accommodationLabelBn = 'ডে কেয়ার ব্যবস্থা (দুপুরের খাবার, নাস্তা ও তত্ত্বাবধান)';
  } else {
    accommodationMonthlyFee = input.config.nonResidentialMonthlyFee;
    accommodationLabelBn = 'অনাবাসিক (Non-Residential)';
  }

  const transportMonthlyFee = Math.max(0, Math.round(input.transportMonthlyFee ?? 0));
  const transportLabelBn =
    transportMonthlyFee > 0
      ? input.transportLabelBn || 'নিজস্ব পরিবহন সুবিধা'
      : 'পরিবহন সুবিধা ছাড়া (স্ব-উদ্যোগে যাতায়াত)';

  const totalMonthlyFee = netMonthlyTuitionFee + accommodationMonthlyFee + transportMonthlyFee;
  const totalPayableAtAdmission = netAdmissionFee + totalMonthlyFee;

  return {
    baseAdmissionFee,
    totalDiscountPercent,
    discountAmount,
    netAdmissionFee,
    monthlyTuitionFee: netMonthlyTuitionFee,
    siblingTuitionDiscountAmount,
    netMonthlyTuitionFee,
    accommodationMonthlyFee,
    accommodationLabelBn,
    transportMonthlyFee,
    transportLabelBn,
    totalMonthlyFee,
    totalPayableAtAdmission,
    annualServiceCharge: input.item.annualServiceCharge,
  };
}

/**
 * Computes custom monthly transport fee based on distance in kilometers and per-km rate,
 * rounded to the nearest 100 BDT with a sensible minimum when distance > 0.
 */
export function calculateTransportFeeByDistance(
  distanceKm: number,
  perKmRate: number = 600
): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  const safeRate = Number.isFinite(perKmRate) && perKmRate > 0 ? perKmRate : 600;
  const raw = distanceKm * safeRate;
  return Math.max(1000, Math.round(raw / 100) * 100);
}

/**
 * Normalizes stage subject percentages (Quran, Arabic, General) so they are clamped >= 0
 * and reports their total and proportional bar widths summing to 100%.
 */
export function computeStageBalanceWidths(stage: {
  quranPercent: number;
  arabicPercent: number;
  generalPercent: number;
}): {
  quranWidth: number;
  arabicWidth: number;
  generalWidth: number;
  totalPercent: number;
} {
  const q = Math.max(0, Number(stage.quranPercent) || 0);
  const a = Math.max(0, Number(stage.arabicPercent) || 0);
  const g = Math.max(0, Number(stage.generalPercent) || 0);
  const total = q + a + g;
  if (total <= 0) {
    return { quranWidth: 25, arabicWidth: 25, generalWidth: 50, totalPercent: 100 };
  }
  const qW = Math.round((q / total) * 100);
  const aW = Math.round((a / total) * 100);
  const gW = Math.max(0, 100 - qW - aW);
  return {
    quranWidth: qW,
    arabicWidth: aW,
    generalWidth: gW,
    totalPercent: total,
  };
}

export interface BotEvaluationResult {
  isOutOfScope: boolean;
  replyText: string;
  warningText?: string;
  newWarningCount: number;
  shouldLock: boolean;
}

/**
 * Evaluates a user message sent to the "Noor" AI Assistant.
 * - Answers greetings and any question related to the madrasah (admission, fees,
 *   Hifz, academic classes, residential, day care, IT skills, curriculum, address, phone, documents).
 * - Strictly denies out-of-scope questions and returns the exact warning notice with remaining attempts.
 */
export function evaluateNoorBotQuery(
  rawQuery: string,
  currentWarnings: number,
  botConfig: AIBotConfig,
  settings: SiteSettings,
  lang: 'bn' | 'en' | 'ar' = 'bn'
): BotEvaluationResult {
  const q = rawQuery.trim().toLowerCase();
  const tr = (bn: string, en: string, ar: string) =>
    lang === 'bn' ? bn : lang === 'ar' ? ar : en;

  // 1. Check explicit out-of-scope topics first (sports, politics, movies, cooking, weather, general trivia)
  const outOfScopeKeywords = [
    'ক্রিকেট',
    'ফুটবল',
    'খেলা',
    'সাকিব',
    'মেসি',
    'রোনালদো',
    'cricket',
    'football',
    'বিরিয়ানি',
    'রান্না',
    'রেসিপি',
    'recipe',
    'সিনেমা',
    'মুভি',
    'গান',
    'নাটক',
    'movie',
    'song',
    'রাজনীতি',
    'নির্বাচন',
    'প্রধানমন্ত্রী',
    'প্রেসিডেন্ট',
    'politics',
    'আবহাওয়া',
    'বৃষ্টি',
    'তাপমাত্রা',
    'weather',
    'শেয়ার বাজার',
    'বিটকয়েন',
    'crypto',
    'bitcoin',
    'জোকস',
    'কৌতুক',
    'joke',
    'প্রেম',
    'ভালোবাসা',
    'কবিতা লেখো',
    'গল্প বলো',
    'who is the president',
    'capital of',
    'রাজধানী কি',
    'টিকিট',
    'ভিসা',
    'পাসপোর্ট',
  ];

  const instituteKeywords = [
    'ভর্তি',
    'admission',
    'ফি',
    'fee',
    'বেতন',
    'tuition',
    'খরচ',
    'cost',
    'ছাড়',
    'ডিসকাউন্ট',
    'discount',
    'হিফজ',
    'হিফয',
    'hifz',
    'কুরআন',
    'কোরআন',
    'quran',
    'নূরানী',
    'নাজেরা',
    'নাযেরা',
    'শুনানী',
    'একাডেমিক',
    'academic',
    'জেনারেল',
    'general',
    'ক্লাস',
    'class',
    'শ্রেণি',
    'শ্রেণী',
    'নার্সারি',
    'nursery',
    'প্রেপ',
    'prep',
    'আবাসিক',
    'residential',
    'হোস্টেল',
    'hostel',
    'খাবার',
    'ডে কেয়ার',
    'ডে-কেয়ার',
    'day care',
    'daycare',
    'অনাবাসিক',
    'ঠিকানা',
    'address',
    'কোথায়',
    'location',
    'লোকেশন',
    'ফোন',
    'নম্বর',
    'নাম্বার',
    'যোগাযোগ',
    'contact',
    'phone',
    'call',
    'ইমেইল',
    'email',
    'কারিকুলাম',
    'curriculum',
    'সিলেবাস',
    'syllabus',
    'স্কিল',
    'skill',
    'আইটি',
    'কম্পিউটার',
    'গ্রাফিক',
    'ভিডিও',
    'ওয়েব',
    'রোবটিক্স',
    'মার্শাল আর্ট',
    'কারাতে',
    'বিতর্ক',
    'ক্যাম্পাস',
    'campus',
    'শিক্ষক',
    'উস্তাদ',
    'teacher',
    'মাদ্রাসা',
    'মাদরাসা',
    'ইনস্টিটিউট',
    'মাহারাত',
    'maharat',
    'eiin',
    '140630',
    '21023',
    'তাহফিজ',
    'tahfiz',
    'প্রতিষ্ঠান',
    'ডকুমেন্ট',
    'কাগজপত্র',
    'ছবি',
    'জন্ম নিবন্ধন',
    'সেশন',
    'পরীক্ষা',
    'সময়',
    'কখন',
    'কিভাবে',
    'কীভাবে',
    'القبول',
    'الرسوم',
    'تحفيظ',
    'القرآن',
    'العنوان',
    'السكن',
    'المهارات',
  ];

  const greetingKeywords = [
    'সালাম',
    'আসসালামু',
    'salam',
    'assalamu',
    'হ্যালো',
    'হাই',
    'hello',
    'hi',
    'hey',
    'কেমন আছেন',
    'কেমন আছো',
    'নূর',
    'noor',
    'ধন্যবাদ',
    'thanks',
    'thank you',
    'السلام',
    'مرحبا',
  ];

  // 0. Check custom structured Q&A items configured by Admin first
  if (botConfig.qaItems && botConfig.qaItems.length > 0 && lang === 'bn') {
    const matchedQA = botConfig.qaItems.find((item) => {
      if (item.question.trim().toLowerCase() === q) return true;
      return item.keywords.some((kw) => kw.trim() && q.includes(kw.trim().toLowerCase()));
    });
    if (matchedQA) {
      return {
        isOutOfScope: false,
        newWarningCount: currentWarnings,
        shouldLock: false,
        replyText: matchedQA.answer,
      };
    }
  }

  const hasInstituteKeyword = instituteKeywords.some((kw) => q.includes(kw));
  const hasGreeting = greetingKeywords.some((kw) => q.includes(kw));
  const hasOutOfScopeKeyword = outOfScopeKeywords.some((kw) => q.includes(kw));

  if ((hasOutOfScopeKeyword && !hasInstituteKeyword) || (!hasInstituteKeyword && !hasGreeting)) {
    const newWarningCount = currentWarnings + 1;
    const maxWarnings = botConfig.maxWarnings || 3;
    const remaining = Math.max(0, maxWarnings - newWarningCount);
    const shouldLock = newWarningCount >= maxWarnings;

    const warningText = shouldLock
      ? tr(
          `এটা প্রতিষ্ঠানের বিষয়ের বাইরের প্রশ্ন। আপনি ${maxWarnings} বার বিষয়ের বাইরের প্রশ্ন করায় কিছুক্ষণের জন্য বার্তা পাঠানো সাময়িকভাবে বন্ধ করা হয়েছে।`,
          `This question is outside the institute's scope. Because you asked ${maxWarnings} off-topic questions, messaging is temporarily paused.`,
          `هذا السؤال خارج نطاق المعهد. نظراً لطرح ${maxWarnings} أسئلة خارج النطاق، تم إيقاف المراسلة مؤقتاً.`
        )
      : tr(
          botConfig.warningTemplate.replace('{remaining}', String(remaining)),
          `Notice: This question is outside our institute's scope. You have ${remaining} off-topic attempts remaining.`,
          `تنبيه: هذا السؤال خارج نطاق المعهد. يتبقى لديك ${remaining} محاولات.`
        );

    return {
      isOutOfScope: true,
      replyText: tr(
        botConfig.refusalMessage,
        'Sorry, I am the dedicated AI Assistant for Maharat Model Madrasah (EIIN: 140630). I only answer questions regarding our admissions, curriculum, fees, and campus facilities.',
        'عذراً، أنا المساعد الذكي المخصص لمدرسة المهارات النموذجية. أجيب فقط على الأسئلة المتعلقة بالقبول والمناهج والرسوم ومرافق المعهد.'
      ),
      warningText,
      newWarningCount,
      shouldLock,
    };
  }

  // Construct helpful, accurate answer in the active language
  if (
    q.includes('ফি') ||
    q.includes('বেতন') ||
    q.includes('খরচ') ||
    q.includes('fee') ||
    q.includes('tuition') ||
    q.includes('cost') ||
    q.includes('ছাড়') ||
    q.includes('ডিসকাউন্ট') ||
    q.includes('الرسوم')
  ) {
    return {
      isOutOfScope: false,
      newWarningCount: currentWarnings,
      shouldLock: false,
      replyText: tr(
        'মাহারাত মডেল মাদ্রাসার (EIIN: 140630) ফি কাঠামো:\n• প্লে - ২য় শ্রেণি: ভর্তি ফি ১৮,০০০/- থেকে ২১,০০০/- (প্রত্যেক শ্রেণির প্রথম ৫ জনের জন্য বিশেষ ডিসকাউন্ট!), মাসিক বেতন ৪,৫০০/- থেকে ৫,০০০/-\n• ৩য় শ্রেণি: ভর্তি ফি ২৪,০০০/-, মাসিক বেতন ৫,৫০০/-\n• ৪র্থ - ৫ম শ্রেণি: ভর্তি ফি ২৬,০০০/-, মাসিক বেতন (টিউশনসহ) ৮,০০০/-\n• ৬ষ্ঠ - ৯ম শ্রেণি (দাখিল): ভর্তি ফি ২৮,০০০/- থেকে ৩০,০০০/-, মাসিক বেতন ৯,০০০/- থেকে ৯,৫০০/-\n• তাহফিজুল কুরআন বিভাগ (নূরানী, নাজেরা ও হিফজ): ভর্তি ফি ২০,০০০/-, মাসিক বেতন ৫,৫০০/-\n• আবাসিক চার্জ (আবাসন + খাবার): ৯,৫০০/- মাসিক এবং ডে-কেয়ার চার্জ: ৪,৫০০/- মাসিক। "Fees" পেইজের ইন্টারেক্টিভ ক্যালকুলেটর থেকে A4 সামারি ডাউনলোড করতে পারবেন।',
        'Maharat Model Madrasah (EIIN: 140630) Fee Structure:\n• Play – Grade 2: Admission BDT 18,000–21,000/- (Special discount for the first 5 students in each class!), Monthly Tuition BDT 4,500–5,000/-\n• Grade 3: Admission BDT 24,000/-, Monthly Tuition BDT 5,500/-\n• Grade 4 – 5: Admission BDT 26,000/-, Monthly Tuition BDT 8,000/-\n• Grade 6 – 9 (Dakhil): Admission BDT 28,000–30,000/-, Monthly Tuition BDT 9,000–9,500/-\n• Tahfizul Quran Dept (Noorani, Nazera, Hifz): Admission BDT 20,000/-, Monthly Tuition BDT 5,500/-\n• Residential Charge: BDT 9,500/month | Day-Care Charge: BDT 4,500/month.',
        'هيكل الرسوم لمدرسة المهارات النموذجية (EIIN: 140630):\n• التمهيدي إلى الصف الثاني: رسوم القبول ١٨,٠٠٠–٢١,٠٠٠ تاكا (خصم خاص لأول ٥ طلاب في كل صف)، الرسوم الشهرية ٤,٥٠٠–٥,٠٠٠ تاكا\n• الصف الثالث: القبول ٢٤,٠٠٠ تاكا، الشهري ٥,٥٠٠ تاكا\n• الصف الرابع والخامس: القبول ٢٦,٠٠٠ تاكا، الشهري ٨,٠٠٠ تاكا\n• الصف السادس إلى التاسع (الداخل): القبول ٢٨,٠٠٠–٣٠,٠٠٠ تاكا، الشهري ٩,٠٠٠–٩,٥٠٠ تاكا\n• قسم تحفيظ القرآن الكريم: القبول ٢٠,٠٠٠ تاكا، الشهري ٥,٥٠٠ تاكا\n• رسوم السكن الداخلي: ٩,٥٠٠ تاكا شهرياً | الرعاية النهارية: ٤,٥٠٠ تاكا شهرياً.'
      ),
    };
  }

  if (
    q.includes('হিফজ') ||
    q.includes('হিফয') ||
    q.includes('hifz') ||
    q.includes('তাহফিজ') ||
    q.includes('tahfiz') ||
    q.includes('নূরানী') ||
    q.includes('নাযেরা') ||
    q.includes('কুরআন') ||
    q.includes('تحفيظ') ||
    q.includes('القرآن')
  ) {
    return {
      isOutOfScope: false,
      newWarningCount: currentWarnings,
      shouldLock: false,
      replyText: tr(
        'মাহারাত তাহফিজ সেকশনে (Maharat Tahfiz Section) নূরানী, নাজেরা ও হিফজের পাশাপাশি ৪টি মৌলিক জেনারেল বিষয় (বাংলা, ইংরেজি, গণিত ও আরবি) পাঠদান করা হয়। অভিজ্ঞ হাফেজ ও ক্বারীদের নিবিড় তত্ত্বাবধানে তাজবীদসহ কুরআন হিফজ সম্পন্ন করানো হয়। ভর্তি ফি ২০,০০০/- এবং মাসিক বেতন ৫,৫০০/- (আবাসিক, অনাবাসিক ও ডে-কেয়ার সুবিধা রয়েছে)।',
        'Our Maharat Tahfiz Section offers Noorani, Nazera, and Hifz alongside 4 fundamental general subjects (Bangla, English, Mathematics & Arabic) under certified Huffaz and Qaris. Admission Fee: BDT 20,000/-, Monthly Tuition: BDT 5,500/- (Residential, Non-Residential, and Day-Care options available).',
        'يضم قسم تحفيظ القرآن في مدرسة المهارات النموذجية مراحل النورانية والناظرة والحفظ مع ٤ مواد أساسية (البنغالية والإنجليزية والرياضيات والعربية). رسوم القبول ٢٠,٠٠٠ تاكا والرسوم الشهرية ٥,٥٠٠ تاكا.'
      ),
    };
  }

  if (
    q.includes('আবাসিক') ||
    q.includes('হোস্টেল') ||
    q.includes('ডে কেয়ার') ||
    q.includes('ডে-কেয়ার') ||
    q.includes('খাবার') ||
    q.includes('residential') ||
    q.includes('day care') ||
    q.includes('السكن')
  ) {
    return {
      isOutOfScope: false,
      newWarningCount: currentWarnings,
      shouldLock: false,
      replyText: tr(
        'মাহারাত মডেল মাদ্রাসায় ৩ ধরনের ব্যবস্থা রয়েছে:\n১. আবাসিক ব্যবস্থা (আবাসন ৩,০০০/- + ৩ বেলা স্বাস্থ্যসম্মত খাবার ও ২ বেলা নাস্তা ৬,৫০০/- = মোট ৯,৫০০/- মাসিক)।\n২. ডে-কেয়ার ব্যবস্থা (সকাল ৭:০০ থেকে রাত ৮:৩০ পর্যন্ত তত্ত্বাবধান, দুপুরের খাবার, নাস্তা ও বিশ্রাম = ৪,৫০০/- মাসিক)।\n৩. অনাবাসিক ব্যবস্থা (নিয়মিত ক্লাস ও ক্লাসের পড়া ক্লাসেই আদায়)।',
        'We offer 3 accommodation modes at Maharat Model Madrasah:\n1. Residential (Hostel BDT 3,000/- + 3 Nutritious Meals & 2 Snacks BDT 6,500/- = Total BDT 9,500/month).\n2. Day-Care (7:00 AM to 8:30 PM supervision, lunch, snacks & rest = BDT 4,500/month).\n3. Non-Residential (Regular daily classes with in-class lesson completion).',
        'نوفر ٣ أنظمة للدراسة والإقامة في مدرسة المهارات النموذجية:\n١. القسم الداخلي الكامل (السكن ٣,٠٠٠ + ٣ وجبات رئيسية ووجبتين خفيفتين ٦,٥٠٠ = ٩,٥٠٠ تاكا شهرياً).\n٢. الرعاية النهارية (إشراف من ٧:٠٠ صباحاً حتى ٨:٣٠ مساءً مع الغداء والراحة = ٤,٥٠٠ تاكا شهرياً).\n٣. الدراسة اليومية غير الداخلية.'
      ),
    };
  }

  if (
    q.includes('ঠিকানা') ||
    q.includes('কোথায়') ||
    q.includes('লোকেশন') ||
    q.includes('যোগাযোগ') ||
    q.includes('ফোন') ||
    q.includes('নম্বর') ||
    q.includes('address') ||
    q.includes('contact') ||
    q.includes('العنوان')
  ) {
    return {
      isOutOfScope: false,
      newWarningCount: currentWarnings,
      shouldLock: false,
      replyText: tr(
        `আমাদের ঠিকানা: ${settings.address}।\nসরাসরি কথা বলতে কল করুন: ${settings.phonePrimary}, ${settings.phoneSecondary}, অথবা ${settings.phoneTertiary}। ইমেইল: ${settings.email}`,
        `Our Campus Address: ${settings.addressEn || settings.address}.\nCall our Admission Desk: ${settings.phonePrimary}, ${settings.phoneSecondary}, or ${settings.phoneTertiary}. Email: ${settings.email}`,
        `عنوان الحرم التعليمي: ${settings.addressEn || settings.address}.\nللتواصل المباشر: ${settings.phonePrimary}، ${settings.phoneSecondary}. البريد الإلكتروني: ${settings.email}`
      ),
    };
  }

  if (
    q.includes('কারিকুলাম') ||
    q.includes('স্কিল') ||
    q.includes('আইটি') ||
    q.includes('কম্পিউটার') ||
    q.includes('curriculum') ||
    q.includes('skill') ||
    q.includes('المهارات')
  ) {
    return {
      isOutOfScope: false,
      newWarningCount: currentWarnings,
      shouldLock: false,
      replyText: tr(
        'মাহারাত মডেল মাদ্রাসায় (EIIN: 140630 | Code: 21023) কুরআন-সুন্নাহ ও আধুনিক শিক্ষার ৫০/৫০ সমন্বিত কারিকুলামে পাঠদান করা হয়: ১. আল-কুরআন ও হাদিস শিক্ষা (১ম শ্রেণি থেকেই হাদিস মুখস্থ), ২. জেনারেল একাডেমিক (প্রি-প্লে/প্লে থেকে ৯ম/দাখিল - আরবি ও ইংলিশ ভার্সন), ৩. ৩ ভাষায় দক্ষতা (বাংলা, ইংরেজি ও আরবি স্পোকেন), ৪. আইসিটি স্মার্ট ক্লাসরুম ও প্রযুক্তি ল্যাব, ৫. ড্রীম ডায়েরি ও নৈতিক তারবিয়াহ, এবং ৬. বিজ্ঞান মেলা, দেয়ালিকা ও সহশিক্ষা কার্যক্রম।',
        'Maharat Model Madrasah (EIIN: 140630 | Code: 21023) teaches across an integrated 50/50 Islamic & General curriculum: 1. Al-Quran & Hadith Mastery (Hadith from Class 1), 2. Academic Excellence (Pre-Play/Play to Grade 9/Dakhil in Arabic & English Version), 3. Tri-Lingual Fluency (Bangla, English & Spoken Arabic), 4. ICT Smart Classrooms & Tech Lab, 5. Dream Diary & Moral Tarbiyah, and 6. Science Fairs, Wall Magazines & Co-Curricular Leadership.',
        'تعتمد مدرسة المهارات النموذجية (EIIN: 140630) منهجاً متكاملاً يجمع بين العلوم الإسلامية والأكاديمية: ١. القرآن الكريم والحديث الشريف، ٢. التميز الأكاديمي (من التمهيدي حتى الصف التاسع/الداخل بالنسختين العربية والإنجليزية)، ٣. إتقان ٣ لغات (البنغالية والإنجليزية والعربية المحكية)، ٤. الفصول الذكية ومختبر التقنية، ٥. التربية الأخلاقية وسجل الطموحات، ٦. المعارض العلمية والأنشطة اللاصفية.'
      ),
    };
  }

  if (q.includes('ভর্তি') || q.includes('ডকুমেন্ট') || q.includes('admission') || q.includes('القبول')) {
    return {
      isOutOfScope: false,
      newWarningCount: currentWarnings,
      shouldLock: false,
      replyText: tr(
        'মাহারাত মডেল মাদ্রাসায় প্রি-প্লে ও প্লে থেকে ৯ম শ্রেণি (দাখিল) এবং তাহফিজ বিভাগে ভর্তি চলছে! প্রত্যেক শ্রেণির প্রথম ৫ জনের জন্য ভর্তিতে বিশেষ ডিসকাউন্ট রয়েছে। ওয়েবসাইটের "Admission (ভর্তি ফরম)" মেনু থেকে ৬-ধাপের অনলাইন ফরমটি পূরণ করতে পারবেন। ভর্তির জন্য প্রয়োজন: শিক্ষার্থীর ৪ কপি পাসপোর্ট সাইজ ছবি, জন্ম নিবন্ধন সনদ এবং পিতা-মাতার এনআইডি ফটোকপি।',
        'Admissions are open at Maharat Model Madrasah from Pre-Play/Play to Grade 9 (Dakhil) and Tahfizul Quran! Special discounts apply for the first 5 students in each class. You can apply online via the 6-step Admission Form. Required documents: 4 passport-size photos of the student, birth certificate copy, and parents’ NID/Passport copies.',
        'باب القبول مفتوح في مدرسة المهارات النموذجية من مرحلة التمهيدي حتى الصف التاسع (الداخل) وقسم تحفيظ القرآن الكريم! خصم خاص لأول ٥ طلاب في كل صف. المستندات المطلوبة: ٤ صور شخصية للطالب، شهادة الميلاد، وصورة الهوية الوطنية لولي الأمر.'
      ),
    };
  }

  return {
    isOutOfScope: false,
    newWarningCount: currentWarnings,
    shouldLock: false,
    replyText: tr(
      `আসসালামু আলাইকুম! আমি ${settings.instituteNameBn}-এর এআই সহকারী ${botConfig.botName}। আমাদের জেনারেল সেকশন (প্রি-প্লে/প্লে থেকে ৯ম শ্রেণি), তাহফিজুল কুরআন বিভাগ, ভর্তি ফি, আবাসিক/ডে-কেয়ার সুবিধা বা কারিকুলাম সম্পর্কে যেকোনো প্রশ্ন করতে পারেন। জরুরি প্রয়োজনে কল করুন: ${settings.phonePrimary}।`,
      `Assalamu Alaikum! I am Noor, the AI Assistant of ${settings.instituteName} (EIIN: 140630). Feel free to ask about our General Section (Pre-Play to Grade 9), Tahfizul Quran Section, Admission Fees, Residential/Day-Care facilities, or Transport routes. Helpline: ${settings.phonePrimary}.`,
      `السلام عليكم! أنا نور، المساعد الذكي لـ ${settings.instituteName}. يسعدني الإجابة عن استفساراتكم حول القسم العام، قسم تحفيظ القرآن الكريم، رسوم القبول، السكن الداخلي والرعاية النهارية. للتواصل المباشر: ${settings.phonePrimary}.`
    ),
  };
}

/**
 * Builds the simulated email notification sent to the Admin when a new student inquiry or admission form is submitted.
 */
export function buildAdminNewInquiryEmail(
  lead: Pick<AdmissionLead, 'name' | 'phone' | 'email' | 'courseTitle' | 'message' | 'source'>,
  adminEmail: string,
  instituteName: string,
  timestamp: string = new Date().toISOString()
): EmailNotificationLog {
  return {
    id: `email-adm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipientEmail: adminEmail,
    recipientName: `${instituteName} Admissions Desk`,
    recipientType: 'Admin',
    subject: `[New ${lead.source}] ${lead.name} applied for ${lead.courseTitle}`,
    body: `Dear Admissions Admin,\n\nA new student inquiry has been submitted via the ${instituteName} public portal.\n\nApplicant Name: ${lead.name}\nPhone: ${lead.phone}\nEmail: ${lead.email}\nSelected Course: ${lead.courseTitle}\nSubmission Type: ${lead.source}\nMessage / Note: ${lead.message || 'N/A'}\n\nPlease log in to the Admin Control Panel to review documents and update the applicant status.`,
    sentAt: timestamp,
    triggerEvent: `New Inquiry Submitted (${lead.source})`,
    status: 'Dispatched (Simulated)',
  };
}

/**
 * Builds the simulated email notification sent to the Student when an Admin updates their inquiry status.
 */
export function buildStudentStatusUpdateEmail(
  lead: Pick<AdmissionLead, 'name' | 'email' | 'courseTitle'>,
  newStatus: LeadStatus,
  instituteName: string,
  institutePhone: string,
  timestamp: string = new Date().toISOString()
): EmailNotificationLog {
  const statusGuidanceMap: Record<LeadStatus, string> = {
    New:
      'Thank you for submitting your admission inquiry. Our coordinator will contact you shortly.',
    Pending:
      'Your application is currently queued for initial review by our academic admissions committee.',
    Contacted:
      'Our admissions counselor has initiated contact with you. Please let us know if you have any questions.',
    Interested:
      'We noted your interest and our admissions office is pleased to guide you with program details.',
    'Follow-up':
      'We have scheduled a follow-up conversation regarding your admission query.',
    'Campus Visit':
      'A physical campus visit has been scheduled. We look forward to welcoming you to our madrasah.',
    'Document Verification':
      'Your application has moved to Document Verification. Please ensure your birth certificate/NID, academic transcripts, and passport photos are ready.',
    'Interview Scheduled':
      'Congratulations! Your academic & tarbiyah assessment interview has been scheduled. Our coordinator will confirm your time slot shortly.',
    'Offer Extended':
      'We are pleased to extend an official Admission Offer for your selected program at our institute. Please complete the fee formalities to secure your seat.',
    Admitted:
      'Congratulations! Your admission has been officially confirmed. Welcome to our academic family!',
    Enrolled:
      'You are now fully enrolled and assigned to your class batch. Class routine and orientation materials have been unlocked.',
    'Not Now':
      'Your admission inquiry has been placed on hold. Feel free to re-contact us anytime.',
    Rejected:
      'Thank you for your interest. Unfortunately, we are unable to offer a seat in this batch at this time due to capacity or eligibility constraints.',
  };

  return {
    id: `email-stu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    recipientEmail: lead.email,
    recipientName: lead.name,
    recipientType: 'Student',
    subject: `[${instituteName}] Application Status Updated: ${newStatus}`,
    body: `Assalamu Alaikum ${lead.name},\n\nYour admission inquiry for "${lead.courseTitle}" at ${instituteName} has been updated to: ${newStatus.toUpperCase()}.\n\nNext Steps:\n${statusGuidanceMap[newStatus]}\n\nFor immediate assistance, contact our admissions desk at ${institutePhone}.\n\nWarm regards,\nAdmissions Office, ${instituteName}`,
    sentAt: timestamp,
    triggerEvent: `Status Changed to ${newStatus}`,
    status: 'Dispatched (Simulated)',
  };
}

/**
 * Filters notices by category and search query.
 */
export function filterNotices(
  notices: NoticeItem[],
  category: 'All' | NoticeCategory,
  searchQuery: string = ''
): NoticeItem[] {
  return notices.filter((notice) => {
    const matchesCategory = category === 'All' || notice.category === category;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      notice.title.toLowerCase().includes(q) ||
      notice.description.toLowerCase().includes(q) ||
      notice.category.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}

/**
 * Filters leads by status, courseId, and search query.
 */
export function filterLeads(
  leads: AdmissionLead[],
  statusFilter: 'All' | LeadStatus,
  courseIdFilter: string = 'All',
  searchQuery: string = ''
): AdmissionLead[] {
  return leads.filter((lead) => {
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesCourse = courseIdFilter === 'All' || lead.courseId === courseIdFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      lead.name.toLowerCase().includes(q) ||
      lead.phone.toLowerCase().includes(q) ||
      lead.email.toLowerCase().includes(q) ||
      lead.courseTitle.toLowerCase().includes(q);
    return matchesStatus && matchesCourse && matchesQuery;
  });
}

/**
 * Normalized 7 core pipeline stages for the visual Kanban Board
 */
export const CRM_PIPELINE_STAGES: {
  id: LeadStatus;
  labelBn: string;
  labelEn: string;
  colorClass: string;
  bgLightClass: string;
  borderClass: string;
  badgeClass: string;
}[] = [
  {
    id: 'New',
    labelBn: 'নতুন লিড (New)',
    labelEn: 'New Leads',
    colorClass: 'text-blue-700 dark:text-blue-300',
    bgLightClass: 'bg-blue-50/70 dark:bg-blue-950/30',
    borderClass: 'border-blue-200 dark:border-blue-800/60',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
  },
  {
    id: 'Contacted',
    labelBn: 'কথা বলা হয়েছে (Contacted)',
    labelEn: 'Contacted',
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgLightClass: 'bg-amber-50/70 dark:bg-amber-950/30',
    borderClass: 'border-amber-200 dark:border-amber-800/60',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
  },
  {
    id: 'Interested',
    labelBn: 'আগ্রহী অভিভাবক (Interested)',
    labelEn: 'Interested',
    colorClass: 'text-purple-700 dark:text-purple-300',
    bgLightClass: 'bg-purple-50/70 dark:bg-purple-950/30',
    borderClass: 'border-purple-200 dark:border-purple-800/60',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
  },
  {
    id: 'Follow-up',
    labelBn: 'ফলো-আপ বাকি (Follow-up)',
    labelEn: 'Follow-up Due',
    colorClass: 'text-orange-700 dark:text-orange-300',
    bgLightClass: 'bg-orange-50/70 dark:bg-orange-950/30',
    borderClass: 'border-orange-200 dark:border-orange-800/60',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200',
  },
  {
    id: 'Campus Visit',
    labelBn: 'ক্যাম্পাস ভিজিট / যাচাই (Visit)',
    labelEn: 'Campus Visit & Docs',
    colorClass: 'text-teal-700 dark:text-teal-300',
    bgLightClass: 'bg-teal-50/70 dark:bg-teal-950/30',
    borderClass: 'border-teal-200 dark:border-teal-800/60',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200',
  },
  {
    id: 'Admitted',
    labelBn: 'ভর্তি সম্পন্ন (Admitted & Enrolled)',
    labelEn: 'Admitted / Enrolled',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgLightClass: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    borderClass: 'border-emerald-200 dark:border-emerald-800/60',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
  },
  {
    id: 'Not Now',
    labelBn: 'আপাতত নয় / বাতিল (Not Now)',
    labelEn: 'Not Now / Postponed',
    colorClass: 'text-slate-600 dark:text-slate-400',
    bgLightClass: 'bg-slate-100/70 dark:bg-slate-900/40',
    borderClass: 'border-slate-200 dark:border-slate-800',
    badgeClass: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  },
];

/**
 * Localizes any lead status string into Bengali, English, or Arabic.
 */
export const localizeLeadStatus = (status: string, lang: 'bn' | 'en' | 'ar' = 'bn'): string => {
  const map: Record<string, { bn: string; en: string; ar: string }> = {
    All: { bn: 'সকল', en: 'All', ar: 'الكل' },
    New: { bn: 'নতুন আবেদন', en: 'New Lead', ar: 'طلب جديد' },
    Pending: { bn: 'পেন্ডিং', en: 'Pending', ar: 'قيد الانتظار' },
    Contacted: { bn: 'যোগাযোগ করা হয়েছে', en: 'Contacted', ar: 'تم التواصل' },
    Reviewed: { bn: 'যাচাইকৃত', en: 'Reviewed', ar: 'تمت المراجعة' },
    Interested: { bn: 'আগ্রহী', en: 'Interested', ar: 'مهتم' },
    'Follow-up': { bn: 'ফলো-আপে আছে', en: 'Follow-up Due', ar: 'متابعة' },
    'Campus Visit': { bn: 'ক্যাম্পাস ভিজিট', en: 'Campus Visit', ar: 'زيارة الحرم' },
    'Campus Visit Scheduled': { bn: 'ক্যাম্পাস ভিজিট নির্ধারিত', en: 'Campus Visit Scheduled', ar: 'تم تحديد زيارة الحرم' },
    'Assessment Completed': { bn: 'মূল্যায়ন সম্পন্ন', en: 'Assessment Completed', ar: 'اكتمل التقييم' },
    'Offer Extended': { bn: 'ভর্তি প্রস্তাব পাঠানো', en: 'Offer Extended', ar: 'تم تقديم العرض' },
    Admitted: { bn: 'ভর্তি সম্পন্ন 🎓', en: 'Admitted', ar: 'تم القبول' },
    Accepted: { bn: 'অনুমোদিত', en: 'Accepted', ar: 'مقبول' },
    Enrolled: { bn: 'ভর্তি সম্পন্ন', en: 'Enrolled', ar: 'تم التسجيل' },
    'Not Now': { bn: 'স্থগিত / পরে ভাববেন', en: 'Not Now', ar: 'ليس الآن' },
    Waitlisted: { bn: 'অপেক্ষমাণ তালিকা', en: 'Waitlisted', ar: 'قائمة الانتظار' },
    Rejected: { bn: 'বাতিলকৃত', en: 'Rejected', ar: 'مرفوض' },
    Archived: { bn: 'আর্কাইভড', en: 'Archived', ar: 'مؤرشف' },
  };

  const item = map[status];
  if (!item) return status;
  return lang === 'bn' ? item.bn : lang === 'ar' ? item.ar : item.en;
};

/**
 * Normalizes any Bangladeshi phone number string to 11 digits (e.g., 01XXXXXXXXX).
 */
export function normalizePhoneNumber(raw: string): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8801') && digits.length === 13) {
    return digits.slice(2);
  }
  if (digits.startsWith('01') && digits.length === 11) {
    return digits;
  }
  if (digits.length >= 10 && digits.startsWith('1')) {
    return '0' + digits.slice(0, 10);
  }
  return digits.slice(-11);
}

/**
 * Checks whether an incoming phone matches an existing lead.
 */
export function findMatchingLeadByPhone(
  leads: AdmissionLead[],
  incomingPhone: string
): AdmissionLead | undefined {
  const normalizedIncoming = normalizePhoneNumber(incomingPhone);
  if (!normalizedIncoming || normalizedIncoming.length < 10) return undefined;
  return leads.find((l) => {
    const lNorm = normalizePhoneNumber(l.phone);
    if (lNorm && lNorm === normalizedIncoming) return true;
    const fMobile = l.detailedData?.fatherMobile ? normalizePhoneNumber(l.detailedData.fatherMobile) : '';
    if (fMobile && fMobile === normalizedIncoming) return true;
    const gMobile = l.detailedData?.guardianMobile ? normalizePhoneNumber(l.detailedData.guardianMobile) : '';
    if (gMobile && gMobile === normalizedIncoming) return true;
    return false;
  });
}

/**
 * Parses raw CSV or spreadsheet copy-paste text into structured leads with auto deduplication.
 */
export function parseBulkLeadsCsvText(
  rawText: string,
  existingLeads: AdmissionLead[],
  defaultCourseTitle: string = 'General Academic & Hifz',
  sourceTag: string = 'Excel / Sheet Import'
): {
  newLeads: AdmissionLead[];
  duplicatesCount: number;
  invalidCount: number;
} {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const newLeads: AdmissionLead[] = [];
  let duplicatesCount = 0;
  let invalidCount = 0;

  const nowFormatted = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Skip common header row
    if (
      i === 0 &&
      (line.toLowerCase().includes('name') ||
        line.toLowerCase().includes('phone') ||
        line.includes('নাম') ||
        line.includes('ফোন'))
    ) {
      continue;
    }

    // Split by comma or tab
    const tokens = line.includes('\t')
      ? line.split('\t').map((t) => t.trim())
      : line.split(',').map((t) => t.trim().replace(/^["']|["']$/g, ''));

    if (tokens.length === 0) continue;

    const name = tokens[0] || '';
    const phone = tokens[1] || '';
    const email = tokens[2] && tokens[2].includes('@') ? tokens[2] : '';
    const preferredClass = tokens[3] || '';
    const messageOrNote = tokens[4] || '';

    const normPhone = normalizePhoneNumber(phone);
    if (!name || !normPhone || normPhone.length < 10) {
      invalidCount++;
      continue;
    }

    // Deduplicate against existing leads + newly parsed leads
    const existsInDb = findMatchingLeadByPhone(existingLeads, normPhone);
    const existsInBatch = newLeads.some((l) => normalizePhoneNumber(l.phone) === normPhone);
    if (existsInDb || existsInBatch) {
      duplicatesCount++;
      continue;
    }

    const lead: AdmissionLead = {
      id: `lead-import-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      phone: normPhone,
      email: email || `${normPhone}@leads.maharatmadrasah.com`,
      courseId: 'course-prep-2',
      courseTitle: preferredClass ? `${preferredClass} (${defaultCourseTitle})` : defaultCourseTitle,
      message: messageOrNote || `Imported via ${sourceTag}`,
      status: 'New',
      submittedAt: nowFormatted,
      source: 'Excel Import',
      targetClass: preferredClass,
      marketingSourceTag: sourceTag,
      priority: 'Warm',
      admissionChancePercent: 45,
      callLogs: [],
      notes: [
        {
          id: `note-${Date.now()}`,
          authorName: 'System Importer',
          timestamp: nowFormatted,
          text: `Лиডটি ${sourceTag} থেকে স্বয়ংক্রিয়ভাবে ইমপোর্ট করা হয়েছে।`,
        },
      ],
    };

    newLeads.push(lead);
  }

  return { newLeads, duplicatesCount, invalidCount };
}

/**
 * Resolves a course title from a course ID, with fallback.
 */
export function resolveCourseTitle(courses: CourseItem[], courseId: string): string {
  const found = courses.find((c) => c.id === courseId);
  return found ? found.title : 'General Admission Inquiry';
}

/**
 * Validates public inquiry submission fields.
 */
export function validateInquiryInput(
  input: {
    name: string;
    phone: string;
    email: string;
    courseId: string;
  },
  lang: 'bn' | 'en' | 'ar' = 'en'
): { valid: boolean; error?: string } {
  const tr = (bn: string, en: string, ar: string) =>
    lang === 'bn' ? bn : lang === 'ar' ? ar : en;

  if (!input.name || input.name.trim().length < 2) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে শিক্ষার্থীর পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)।',
        'Please enter the applicant full name (minimum 2 characters).',
        'يرجى إدخال الاسم الكامل للطالب (حرفان على الأقل).'
      ),
    };
  }
  if (!input.phone || !isValidPhone(input.phone)) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে একটি সঠিক মোবাইল নম্বর প্রদান করুন।',
        'Please enter a valid contact phone number.',
        'يرجى إدخال رقم هاتف صحيح للتواصل.'
      ),
    };
  }
  if (!input.email || !isValidEmail(input.email.trim())) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা প্রদান করুন।',
        'Please enter a valid email address for status notifications.',
        'يرجى إدخال عنوان بريد إلكتروني صحيح.'
      ),
    };
  }
  if (!input.courseId || !input.courseId.trim()) {
    return {
      valid: false,
      error: tr(
        'অনুগ্রহ করে একটি কোর্স বা বিভাগ নির্বাচন করুন।',
        'Please select a target course or department.',
        'يرجى اختيار البرنامج أو القسم المطلوب.'
      ),
    };
  }
  return { valid: true };
}

/**
 * Converts any YouTube (watch, embed, shorts, youtu.be) OR Facebook (reel, watch, share/v, share/r, video)
 * URL into a clean, auto-playing embeddable URL with vertical/horizontal orientation detection.
 */
export function getYouTubeEmbedUrl(rawUrl: string): ParsedVideoUrl {
  const parsed = parseVideoUrl(rawUrl);
  if (!parsed.embedUrl) return parsed;
  // Only the known embed providers may be framed; direct media files must be http(s) or same-site.
  const playable =
    parsed.platform === 'direct' && DIRECT_VIDEO_FILE_RE.test(parsed.embedUrl)
      ? isSafeMediaUrl(parsed.embedUrl)
      : isAllowedEmbedUrl(parsed.embedUrl);
  return playable ? parsed : { embedUrl: '', videoId: null, isVerticalShort: false, platform: 'direct' };
}

export const DIRECT_VIDEO_FILE_RE = /\.(mp4|webm|ogg)(\?|$)/i;

interface ParsedVideoUrl {
  embedUrl: string;
  videoId: string | null;
  isVerticalShort: boolean;
  platform: 'youtube' | 'facebook' | 'direct';
}

function parseVideoUrl(rawUrl: string): ParsedVideoUrl {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed) {
    return { embedUrl: '', videoId: null, isVerticalShort: false, platform: 'direct' };
  }

  // 1. Check Facebook Reel / Video URLs first
  const isFacebookUrl =
    /facebook\.com\/|fb\.watch\//i.test(trimmed) ||
    trimmed.includes('facebook.com/plugins/video.php');

  if (isFacebookUrl) {
    if (trimmed.includes('facebook.com/plugins/video.php')) {
      return {
        embedUrl: trimmed,
        videoId: 'fb-plugin',
        isVerticalShort: trimmed.includes('%2Freel%2F') || trimmed.includes('/reel/'),
        platform: 'facebook',
      };
    }

    const fbReelMatch = trimmed.match(/facebook\.com\/reel\/([0-9a-zA-Z_-]+)/i);
    const fbShareRMatch = trimmed.match(/facebook\.com\/share\/r\/([0-9a-zA-Z_-]+)/i);
    const fbVideoMatch = trimmed.match(/facebook\.com\/.*\/videos\/([0-9a-zA-Z_-]+)/i);
    const fbId = fbReelMatch?.[1] || fbShareRMatch?.[1] || fbVideoMatch?.[1] || 'fb-video';

    const canonicalFbHref = fbReelMatch?.[1]
      ? `https://www.facebook.com/reel/${fbReelMatch[1]}`
      : trimmed;

    return {
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
        canonicalFbHref
      )}&show_text=false&autoplay=true&width=1280`,
      videoId: fbId,
      isVerticalShort: false,
      platform: 'facebook',
    };
  }

  // 2. Check YouTube Watch / Shorts / Embed / youtu.be URLs
  const isVerticalShort = false;
  let videoId: string | null = null;

  // Match /shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{6,})/i);
  if (shortsMatch?.[1]) {
    videoId = shortsMatch[1];
  }

  // Match ?v=VIDEO_ID or &v=VIDEO_ID
  if (!videoId) {
    const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{6,})/i);
    if (watchMatch?.[1]) {
      videoId = watchMatch[1];
    }
  }

  // Match /embed/VIDEO_ID
  if (!videoId) {
    const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{6,})/i);
    if (embedMatch?.[1]) {
      videoId = embedMatch[1];
    }
  }

  // Match youtu.be/VIDEO_ID
  if (!videoId) {
    const shortLinkMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{6,})/i);
    if (shortLinkMatch?.[1]) {
      videoId = shortLinkMatch[1];
    }
  }

  if (!videoId) {
    return { embedUrl: trimmed, videoId: null, isVerticalShort, platform: 'direct' };
  }

  return {
    embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`,
    videoId,
    isVerticalShort,
    platform: 'youtube',
  };
}

/**
 * Pure filter for Hifzul Quran Tree graduates by year/session and search query.
 */
export function filterHifzGraduates(
  graduates: HafizGraduateItem[],
  yearFilter: string = 'All',
  searchQuery: string = ''
): HafizGraduateItem[] {
  const q = searchQuery.trim().toLowerCase();
  const normalizedFilter = (yearFilter || 'All').trim();
  return [...(graduates || [])]
    .filter((item) => {
      const matchesYear =
        normalizedFilter === 'All' ||
        normalizedFilter === 'all' ||
        (normalizedFilter === 'featured' && Boolean(item.featured)) ||
        (normalizedFilter === 'air-tour' &&
          (item.badgeTextBn?.includes('বিমান') || item.durationNoteBn?.includes('বিমান'))) ||
        item.completionYear === normalizedFilter ||
        (normalizedFilter === '2022-2023' &&
          (item.completionYear === '2022' || item.completionYear === '2023'));
      const matchesQuery =
        !q ||
        item.nameBn.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.serialLabelBn.toLowerCase().includes(q) ||
        String(item.serialNumber).includes(q) ||
        item.classNameBn.toLowerCase().includes(q) ||
        item.descriptionBn.toLowerCase().includes(q);
      return matchesYear && matchesQuery;
    })
    .sort((a, b) => b.serialNumber - a.serialNumber);
}

/**
 * Pure filter for Categorized Photo Gallery items by category and search query.
 */
export function filterPhotoGallery(
  items: PhotoGalleryItem[],
  categoryFilter: string = 'All',
  searchQuery: string = ''
): PhotoGalleryItem[] {
  const q = searchQuery.trim().toLowerCase();
  return (items || []).filter((item) => {
    if (item.active === false) return false;
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesQuery =
      !q ||
      item.titleBn.toLowerCase().includes(q) ||
      (item.titleEn || '').toLowerCase().includes(q) ||
      item.descriptionBn.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });
}

export interface UnifiedMediaHubItem {
  id: string;
  mediaType: 'photo' | 'video';
  category: PhotoGalleryItem['category'];
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  dateBn: string;
  badgeTextBn: string;
  thumbnailUrl: string;
  videoUrl?: string;
  facebookPostUrl?: string;
}

/**
 * Builds a unified list of both Photos (17 Facebook posts) and Videos (10 Facebook videos)
 * mapped into the same 5 institutional categories so photos and videos appear together.
 */
export function buildUnifiedMediaHubItems(
  state: Pick<CMSState, 'photoGallery' | 'activityVideos' | 'campusVideo'>
): UnifiedMediaHubItem[] {
  const photoItems: UnifiedMediaHubItem[] = (state.photoGallery || [])
    .filter((p) => p.active !== false)
    .map((p) => ({
      id: p.id,
      mediaType: 'photo' as const,
      category: p.category,
      titleBn: p.titleBn,
      titleEn: p.titleEn || p.titleBn,
      descriptionBn: p.descriptionBn,
      dateBn: p.dateBn,
      badgeTextBn: p.badgeTextBn || p.category,
      thumbnailUrl: p.imageUrl,
      facebookPostUrl: p.facebookPostUrl,
    }));

  const assignVideoCategory = (titleBn: string, dept?: string): PhotoGalleryItem['category'] => {
    if (
      titleBn.includes('হিফজ') ||
      titleBn.includes('তিলাওয়াত') ||
      titleBn.includes('সবক') ||
      titleBn.includes('মাশক') ||
      dept === 'Hifz'
    ) {
      return 'Hifz & Sabak';
    }
    if (titleBn.includes('ফলাফল') || titleBn.includes('পুরস্কার') || titleBn.includes('বৃত্তি')) {
      return 'Board & Exam Results';
    }
    if (titleBn.includes('ক্রীড়া') || titleBn.includes('সফর') || titleBn.includes('ইভেন্ট')) {
      return 'Study Tour & Events';
    }
    if (titleBn.includes('সীরাত') || titleBn.includes('ক্যালিগ্রাফি') || titleBn.includes('সংস্কৃতি')) {
      return 'Seerah & Publications';
    }
    return 'Teacher Training & Campus';
  };

  const videoItems: UnifiedMediaHubItem[] = (state.activityVideos || [])
    .filter((v) => v.active !== false && hasValidVideoUrl(v.videoUrl))
    .map((v, idx) => {
      const safeTitleBn = v.titleBn || v.title || `মাহারাত ভিডিও #${idx + 1}`;
      const cat = assignVideoCategory(safeTitleBn, v.department);
      return {
        id: `unified-vid-${v.id || idx}`,
        mediaType: 'video' as const,
        category: cat,
        titleBn: safeTitleBn,
        titleEn: `Maharat HD Video Showcase #${idx + 1}`,
        descriptionBn:
          v.department === 'Hifz'
            ? 'মাহারাত মডেল মাদ্রাসার হিফজুল কুরআন ও তাজবীদ বিভাগের শিক্ষার্থীদের সরাসরি তিলাওয়াত ও ক্লাসরুম মুহূর্ত।'
            : 'মাহারাত মডেল মাদ্রাসার স্মার্ট একাডেমিক কার্যক্রম, সহশিক্ষা ও ক্যাম্পাস ইভেন্টের অফিসিয়াল ভিডিও।',
        dateBn: '২০২৬ শিক্ষাবর্ষ',
        badgeTextBn: v.department === 'Hifz' ? 'হিফজ ও ক্বিরাত ভিডিও' : 'স্মার্ট ক্যাম্পাস ভিডিও',
        thumbnailUrl: v.thumbnailUrl || '/assets/maharat/fb/fb-media-1.jpg',
        videoUrl: v.videoUrl,
        facebookPostUrl: v.videoUrl,
      };
    });

  // Interleave videos and photos so every category view shows a rich mix of both
  const combined: UnifiedMediaHubItem[] = [];
  const maxLen = Math.max(photoItems.length, videoItems.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < videoItems.length) combined.push(videoItems[i]);
    if (i < photoItems.length) combined.push(photoItems[i]);
  }
  return combined;
}

/**
 * Pure filter for Unified Media Hub items by category, media type ('all' | 'photo' | 'video'), and search query.
 */
export function filterUnifiedMediaItems(
  items: UnifiedMediaHubItem[],
  categoryFilter: 'All' | PhotoGalleryItem['category'] = 'All',
  mediaTypeFilter: 'all' | 'photo' | 'video' = 'all',
  searchQuery: string = ''
): UnifiedMediaHubItem[] {
  const q = searchQuery.trim().toLowerCase();
  return (items || []).filter((item) => {
    const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesType = mediaTypeFilter === 'all' || item.mediaType === mediaTypeFilter;
    const matchesQuery =
      !q ||
      item.titleBn.toLowerCase().includes(q) ||
      item.titleEn.toLowerCase().includes(q) ||
      item.descriptionBn.toLowerCase().includes(q) ||
      item.badgeTextBn.toLowerCase().includes(q);
    return matchesCat && matchesType && matchesQuery;
  });
}

export interface ExamScheduleItem {
  id: string;
  sessionTerm: '2026-annual' | '2026-second-term' | '2027-first-term';
  sessionTermLabelBn: string;
  sessionTermLabelEn: string;
  classGroup: 'play-2' | 'class-3-5' | 'class-6-8' | 'class-9-dakhil' | 'hifz-noorani';
  classGroupLabelBn: string;
  classGroupLabelEn: string;
  examDateBn: string;
  examDateIso: string;
  dayNameBn: string;
  dayNameEn: string;
  subjectBn: string;
  subjectEn: string;
  subjectCode: string;
  timeSlotBn: string;
  timeSlotEn: string;
  shiftAndHallBn: string;
}

export const DEFAULT_EXAM_SCHEDULES: ExamScheduleItem[] = [
  // 2026 Annual Exam — Play to Class 2
  {
    id: 'ex-1',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'play-2',
    classGroupLabelBn: 'প্রি-প্লে, প্লে, নার্সারি ও ১ম–২য় শ্রেণি',
    classGroupLabelEn: 'Pre-Play, Play, Nursery & Grade 1–2',
    examDateBn: '১৫ নভেম্বর ২০২৬',
    examDateIso: '2026-11-15',
    dayNameBn: 'রবিবার',
    dayNameEn: 'Sunday',
    subjectBn: 'আল-কুরআন মাজীদ, নূরানী কায়দা ও তাজবীদ (মৌখিক ও লিখিত)',
    subjectEn: 'Al-Quran Majeed, Noorani Qaida & Tajweed',
    subjectCode: 'QUR-101',
    timeSlotBn: 'সকাল ৯:০০ – দুপুর ১১:৩০',
    timeSlotEn: '09:00 AM – 11:30 AM',
    shiftAndHallBn: 'প্রভাতী শিফট • হল-এ (উত্তরা সেক্টর-১২ ক্যাম্পাস)',
  },
  {
    id: 'ex-2',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'play-2',
    classGroupLabelBn: 'প্রি-প্লে, প্লে, নার্সারি ও ১ম–২য় শ্রেণি',
    classGroupLabelEn: 'Pre-Play, Play, Nursery & Grade 1–2',
    examDateBn: '১৭ নভেম্বর ২০২৬',
    examDateIso: '2026-11-17',
    dayNameBn: 'মঙ্গলবার',
    dayNameEn: 'Tuesday',
    subjectBn: 'বাংলা সাহিত্য ও ব্যাকরণ ফাউন্ডেশন',
    subjectEn: 'Bengali Literature & Language Foundation',
    subjectCode: 'BEN-102',
    timeSlotBn: 'সকাল ৯:০০ – দুপুর ১১:৩০',
    timeSlotEn: '09:00 AM – 11:30 AM',
    shiftAndHallBn: 'প্রভাতী শিফট • হল-এ (উত্তরা সেক্টর-১২ ক্যাম্পাস)',
  },
  {
    id: 'ex-3',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'play-2',
    classGroupLabelBn: 'প্রি-প্লে, প্লে, নার্সারি ও ১ম–২য় শ্রেণি',
    classGroupLabelEn: 'Pre-Play, Play, Nursery & Grade 1–2',
    examDateBn: '১৯ নভেম্বর ২০২৬',
    examDateIso: '2026-11-19',
    dayNameBn: 'বৃহস্পতিবার',
    dayNameEn: 'Thursday',
    subjectBn: 'ইংরেজি (English For Today & Spoken Phonics)',
    subjectEn: 'English For Today & Spoken Phonics',
    subjectCode: 'ENG-103',
    timeSlotBn: 'সকাল ৯:০০ – দুপুর ১১:৩০',
    timeSlotEn: '09:00 AM – 11:30 AM',
    shiftAndHallBn: 'প্রভাতী শিফট • হল-এ (উত্তরা সেক্টর-১২ ক্যাম্পাস)',
  },
  {
    id: 'ex-4',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'play-2',
    classGroupLabelBn: 'প্রি-প্লে, প্লে, নার্সারি ও ১ম–২য় শ্রেণি',
    classGroupLabelEn: 'Pre-Play, Play, Nursery & Grade 1–2',
    examDateBn: '২২ নভেম্বর ২০২৬',
    examDateIso: '2026-11-22',
    dayNameBn: 'রবিবার',
    dayNameEn: 'Sunday',
    subjectBn: 'প্রাথমিক গণিত ও মানসিক দক্ষতা (Mathematics & IQ)',
    subjectEn: 'Elementary Mathematics & Mental Math',
    subjectCode: 'MAT-104',
    timeSlotBn: 'সকাল ৯:০০ – দুপুর ১১:৩০',
    timeSlotEn: '09:00 AM – 11:30 AM',
    shiftAndHallBn: 'প্রভাতী শিফট • হল-এ (উত্তরা সেক্টর-১২ ক্যাম্পাস)',
  },
  // 2026 Annual Exam — Class 3 to 5
  {
    id: 'ex-5',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'class-3-5',
    classGroupLabelBn: '৩য় থেকে ৫ম শ্রেণি (প্রাথমিক ও বৃত্তি প্রস্তুতি)',
    classGroupLabelEn: 'Grade 3 to Grade 5 (Primary & Scholarship)',
    examDateBn: '১৫ নভেম্বর ২০২৬',
    examDateIso: '2026-11-15',
    dayNameBn: 'রবিবার',
    dayNameEn: 'Sunday',
    subjectBn: 'আল-কুরআনুল কারীম, আকাইদ ও ফিকহ',
    subjectEn: 'Al-Quran, Aqeedah & Islamic Fiqh',
    subjectCode: 'ISL-301',
    timeSlotBn: 'সকাল ১০:০০ – দুপুর ১:০০',
    timeSlotEn: '10:00 AM – 01:00 PM',
    shiftAndHallBn: 'দিবা শিফট • হল-বি (স্মার্ট একাডেমিক ভবন)',
  },
  {
    id: 'ex-6',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'class-3-5',
    classGroupLabelBn: '৩য় থেকে ৫ম শ্রেণি (প্রাথমিক ও বৃত্তি প্রস্তুতি)',
    classGroupLabelEn: 'Grade 3 to Grade 5 (Primary & Scholarship)',
    examDateBn: '১৮ নভেম্বর ২০২৬',
    examDateIso: '2026-11-18',
    dayNameBn: 'বুধবার',
    dayNameEn: 'Wednesday',
    subjectBn: 'আরবি ভাষা ও ব্যাকরণ (আল-লুগাতুল আরাবিয়্যাহ)',
    subjectEn: 'Arabic Language & Grammar (Al-Lughatul Arabiyyah)',
    subjectCode: 'ARA-302',
    timeSlotBn: 'সকাল ১০:০০ – দুপুর ১:০০',
    timeSlotEn: '10:00 AM – 01:00 PM',
    shiftAndHallBn: 'দিবা শিফট • হল-বি (স্মার্ট একাডেমিক ভবন)',
  },
  {
    id: 'ex-7',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'class-3-5',
    classGroupLabelBn: '৩য় থেকে ৫ম শ্রেণি (প্রাথমিক ও বৃত্তি প্রস্তুতি)',
    classGroupLabelEn: 'Grade 3 to Grade 5 (Primary & Scholarship)',
    examDateBn: '২১ নভেম্বর ২০২৬',
    examDateIso: '2026-11-21',
    dayNameBn: 'শনিবার',
    dayNameEn: 'Saturday',
    subjectBn: 'ইংরেজি ১ম ও ২য় পত্র এবং স্পোকেন ইংলিশ ল্যাব',
    subjectEn: 'English 1st & 2nd Paper + Spoken Assessment',
    subjectCode: 'ENG-303',
    timeSlotBn: 'সকাল ১০:০০ – দুপুর ১:০০',
    timeSlotEn: '10:00 AM – 01:00 PM',
    shiftAndHallBn: 'দিবা শিফট • হল-বি (স্মার্ট একাডেমিক ভবন)',
  },
  {
    id: 'ex-8',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'class-3-5',
    classGroupLabelBn: '৩য় থেকে ৫ম শ্রেণি (প্রাথমিক ও বৃত্তি প্রস্তুতি)',
    classGroupLabelEn: 'Grade 3 to Grade 5 (Primary & Scholarship)',
    examDateBn: '২৪ নভেম্বর ২০২৬',
    examDateIso: '2026-11-24',
    dayNameBn: 'মঙ্গলবার',
    dayNameEn: 'Tuesday',
    subjectBn: 'প্রাথমিক বিজ্ঞান ও কম্পিউটার আইটি প্র্যাকটিক্যাল',
    subjectEn: 'Elementary Science & Computer IT Lab',
    subjectCode: 'SCI-304',
    timeSlotBn: 'সকাল ১০:০০ – দুপুর ১:০০',
    timeSlotEn: '10:00 AM – 01:00 PM',
    shiftAndHallBn: 'দিবা শিফট • আইটি ল্যাব ও হল-বি',
  },
  // 2026 Annual Exam — Class 6 to 8
  {
    id: 'ex-9',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'class-6-8',
    classGroupLabelBn: '৬ষ্ঠ থেকে ৮ম শ্রেণি (জুনিয়র দাখিল ও জেনারেল)',
    classGroupLabelEn: 'Grade 6 to Grade 8 (Junior Dakhil & General)',
    examDateBn: '১৬ নভেম্বর ২০২৬',
    examDateIso: '2026-11-16',
    dayNameBn: 'সোমবার',
    dayNameEn: 'Monday',
    subjectBn: 'কুরআন মাজীদ ও তাজবীদ এবং হাদিস শরীফ',
    subjectEn: 'Quran Majeed, Tajweed & Hadith Sharif',
    subjectCode: 'QHD-601',
    timeSlotBn: 'সকাল ১০:০০ – দুপুর ১:০০',
    timeSlotEn: '10:00 AM – 01:00 PM',
    shiftAndHallBn: 'মেইন এক্সাম হল-সি • উত্তরা সেক্টর-১২ ক্যাম্পাস',
  },
  {
    id: 'ex-10',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'class-6-8',
    classGroupLabelBn: '৬ষ্ঠ থেকে ৮ম শ্রেণি (জুনিয়র দাখিল ও জেনারেল)',
    classGroupLabelEn: 'Grade 6 to Grade 8 (Junior Dakhil & General)',
    examDateBn: '১৯ নভেম্বর ২০২৬',
    examDateIso: '2026-11-19',
    dayNameBn: 'বৃহস্পতিবার',
    dayNameEn: 'Thursday',
    subjectBn: 'আরবি ১ম পত্র (আদব) ও আরবি ২য় পত্র (নাহু-সরফ)',
    subjectEn: 'Arabic 1st Paper & Arabic Grammar (Nahw-Sarf)',
    subjectCode: 'ARA-602',
    timeSlotBn: 'সকাল ১০:০০ – দুপুর ১:০০',
    timeSlotEn: '10:00 AM – 01:00 PM',
    shiftAndHallBn: 'মেইন এক্সাম হল-সি • উত্তরা সেক্টর-১২ ক্যাম্পাস',
  },
  {
    id: 'ex-11',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'class-6-8',
    classGroupLabelBn: '৬ষ্ঠ থেকে ৮ম শ্রেণি (জুনিয়র দাখিল ও জেনারেল)',
    classGroupLabelEn: 'Grade 6 to Grade 8 (Junior Dakhil & General)',
    examDateBn: '২৩ নভেম্বর ২০২৬',
    examDateIso: '2026-11-23',
    dayNameBn: 'সোমবার',
    dayNameEn: 'Monday',
    subjectBn: 'গণিত (বীজগণিত ও জ্যামিতি) এবং সাধারণ বিজ্ঞান',
    subjectEn: 'General Mathematics & Integrated Science',
    subjectCode: 'MTH-603',
    timeSlotBn: 'সকাল ১০:০০ – দুপুর ১:০০',
    timeSlotEn: '10:00 AM – 01:00 PM',
    shiftAndHallBn: 'মেইন এক্সাম হল-সি • উত্তরা সেক্টর-১২ ক্যাম্পাস',
  },
  // 2026 Annual Exam — Class 9 / Dakhil
  {
    id: 'ex-12',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'class-9-dakhil',
    classGroupLabelBn: '৯ম ও দাখিল শ্রেণি (বোর্ড ও নির্বাচনী পরীক্ষা)',
    classGroupLabelEn: 'Grade 9 & Dakhil (Board Prep & Test Exam)',
    examDateBn: '১৬ নভেম্বর ২০২৬',
    examDateIso: '2026-11-16',
    dayNameBn: 'সোমবার',
    dayNameEn: 'Monday',
    subjectBn: 'কুরআন মাজীদ ও তাজবীদ এবং আল-হাদিস (বোর্ড স্ট্যান্ডার্ড)',
    subjectEn: 'Quran Majeed & Al-Hadith (Madrasah Board Standard)',
    subjectCode: 'DKH-901',
    timeSlotBn: 'সকাল ১০:০০ – দুপুর ১:০০',
    timeSlotEn: '10:00 AM – 01:00 PM',
    shiftAndHallBn: 'বোর্ড এক্সাম হল-ডি • উত্তরা সেক্টর-১২ ক্যাম্পাস',
  },
  {
    id: 'ex-13',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'class-9-dakhil',
    classGroupLabelBn: '৯ম ও দাখিল শ্রেণি (বোর্ড ও নির্বাচনী পরীক্ষা)',
    classGroupLabelEn: 'Grade 9 & Dakhil (Board Prep & Test Exam)',
    examDateBn: '২২ নভেম্বর ২০২৬',
    examDateIso: '2026-11-22',
    dayNameBn: 'রবিবার',
    dayNameEn: 'Sunday',
    subjectBn: 'ইংরেজি, সাধারণ গণিত ও আইসিটি প্র্যাকটিক্যাল',
    subjectEn: 'English, General Mathematics & ICT Practical',
    subjectCode: 'DKH-902',
    timeSlotBn: 'সকাল ১০:০০ – দুপুর ১:০০',
    timeSlotEn: '10:00 AM – 01:00 PM',
    shiftAndHallBn: 'বোর্ড এক্সাম হল-ডি • উত্তরা সেক্টর-১২ ক্যাম্পাস',
  },
  // 2026 Annual Exam — Tahfizul Quran & Noorani
  {
    id: 'ex-14',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'hifz-noorani',
    classGroupLabelBn: 'তাহফিজুল কুরআন (নূরানী, নাজেরা, হিফজ ও শুনানী)',
    classGroupLabelEn: 'Tahfizul Quran (Noorani, Nazera, Hifz & Shunani)',
    examDateBn: '১৫ নভেম্বর ২০২৬',
    examDateIso: '2026-11-15',
    dayNameBn: 'রবিবার',
    dayNameEn: 'Sunday',
    subjectBn: 'হিফজুল কুরআন পূর্ণাঙ্গ শুনানী ও লাহজা-তাজবীদ মূল্যায়ন',
    subjectEn: 'Hifzul Quran Recitation (Shunani) & Tajweed Viva',
    subjectCode: 'HFZ-701',
    timeSlotBn: 'সকাল ৮:৩০ – দুপুর ১২:৩০',
    timeSlotEn: '08:30 AM – 12:30 PM',
    shiftAndHallBn: 'হিফজ অডিটোরিয়াম • আন্তর্জাতিক ক্বারী বোর্ড',
  },
  {
    id: 'ex-15',
    sessionTerm: '2026-annual',
    sessionTermLabelBn: '২০২৬ — বার্ষিক পরীক্ষা (Annual Exam)',
    sessionTermLabelEn: '2026 — Annual Examination',
    classGroup: 'hifz-noorani',
    classGroupLabelBn: 'তাহফিজুল কুরআন (নূরানী, নাজেরা, হিফজ ও শুনানী)',
    classGroupLabelEn: 'Tahfizul Quran (Noorani, Nazera, Hifz & Shunani)',
    examDateBn: '১৮ নভেম্বর ২০২৬',
    examDateIso: '2026-11-18',
    dayNameBn: 'বুধবার',
    dayNameEn: 'Wednesday',
    subjectBn: 'হিফজের পাশাপাশি ৪টি মৌলিক বিষয় (বাংলা, ইংরেজি, গণিত ও আরবি)',
    subjectEn: '4 Core Academic Subjects for Hifz Students',
    subjectCode: 'HFZ-702',
    timeSlotBn: 'সকাল ৯:৩০ – দুপুর ১২:০০',
    timeSlotEn: '09:30 AM – 12:00 PM',
    shiftAndHallBn: 'হিফজ একাডেমিক জোন • সেক্টর-১২ ও ১৩ ক্যাম্পাস',
  },
  // 2026 2nd Term / Special Evaluation
  {
    id: 'ex-16',
    sessionTerm: '2026-second-term',
    sessionTermLabelBn: '২০২৬ — ২য় সাময়িক ও বিশেষ মূল্যায়ন পরীক্ষা',
    sessionTermLabelEn: '2026 — 2nd Term & Special Evaluation Exam',
    classGroup: 'play-2',
    classGroupLabelBn: 'প্রি-প্লে, প্লে, নার্সারি ও ১ম–২য় শ্রেণি',
    classGroupLabelEn: 'Pre-Play, Play, Nursery & Grade 1–2',
    examDateBn: '১০ আগস্ট ২০২৬',
    examDateIso: '2026-08-10',
    dayNameBn: 'সোমবার',
    dayNameEn: 'Monday',
    subjectBn: 'কুরআন তাজবীদ, বাংলা, ইংরেজি ও গণিত সমন্বিত মূল্যায়ন',
    subjectEn: 'Quran Tajweed, Bengali, English & Math Assessment',
    subjectCode: 'TRM2-101',
    timeSlotBn: 'সকাল ৯:০০ – দুপুর ১১:৩০',
    timeSlotEn: '09:00 AM – 11:30 AM',
    shiftAndHallBn: 'প্রভাতী শিফট • হল-এ',
  },
  {
    id: 'ex-17',
    sessionTerm: '2026-second-term',
    sessionTermLabelBn: '২০২৬ — ২য় সাময়িক ও বিশেষ মূল্যায়ন পরীক্ষা',
    sessionTermLabelEn: '2026 — 2nd Term & Special Evaluation Exam',
    classGroup: 'class-6-8',
    classGroupLabelBn: '৬ষ্ঠ থেকে ৮ম শ্রেণি (জুনিয়র দাখিল ও জেনারেল)',
    classGroupLabelEn: 'Grade 6 to Grade 8 (Junior Dakhil & General)',
    examDateBn: '১২ আগস্ট ২০২৬',
    examDateIso: '2026-08-12',
    dayNameBn: 'বুধবার',
    dayNameEn: 'Wednesday',
    subjectBn: 'আরবি সাহিত্য, ইংরেজি, গণিত ও বিজ্ঞান ২য় সাময়িক পরীক্ষা',
    subjectEn: 'Arabic, English, Mathematics & Science 2nd Term',
    subjectCode: 'TRM2-601',
    timeSlotBn: 'সকাল ১০:০০ – দুপুর ১:০০',
    timeSlotEn: '10:00 AM – 01:00 PM',
    shiftAndHallBn: 'দিবা শিফট • হল-সি',
  },
  // 2027 1st Term Exam
  {
    id: 'ex-18',
    sessionTerm: '2027-first-term',
    sessionTermLabelBn: '২০২৭ — ১ম সাময়িক পরীক্ষা (নতুন শিক্ষাবর্ষ)',
    sessionTermLabelEn: '2027 — 1st Term Examination (New Session)',
    classGroup: 'play-2',
    classGroupLabelBn: 'প্রি-প্লে, প্লে, নার্সারি ও ১ম–২য় শ্রেণি',
    classGroupLabelEn: 'Pre-Play, Play, Nursery & Grade 1–2',
    examDateBn: '১৮ এপ্রিল ২০২৭',
    examDateIso: '2027-04-18',
    dayNameBn: 'রবিবার',
    dayNameEn: 'Sunday',
    subjectBn: 'নূরানী কায়দা, মাসনূন দোয়া, বাংলা ও ইংলিশ ফনিক্স',
    subjectEn: 'Noorani Qaida, Masnoon Dua, Bengali & English Phonics',
    subjectCode: 'S27-101',
    timeSlotBn: 'সকাল ৯:০০ – দুপুর ১১:৩০',
    timeSlotEn: '09:00 AM – 11:30 AM',
    shiftAndHallBn: 'প্রভাতী শিফট • হল-এ',
  },
  {
    id: 'ex-19',
    sessionTerm: '2027-first-term',
    sessionTermLabelBn: '২০২৭ — ১ম সাময়িক পরীক্ষা (নতুন শিক্ষাবর্ষ)',
    sessionTermLabelEn: '2027 — 1st Term Examination (New Session)',
    classGroup: 'hifz-noorani',
    classGroupLabelBn: 'তাহফিজুল কুরআন (নূরানী, নাজেরা, হিফজ ও শুনানী)',
    classGroupLabelEn: 'Tahfizul Quran (Noorani, Nazera, Hifz & Shunani)',
    examDateBn: '২০ এপ্রিল ২০২৭',
    examDateIso: '2027-04-20',
    dayNameBn: 'মঙ্গলবার',
    dayNameEn: 'Tuesday',
    subjectBn: '১ম ত্রৈমাসিক পারা শুনানী, মাশক ও তাজবীদ পরীক্ষা',
    subjectEn: '1st Quarterly Para Recitation & Tajweed Exam',
    subjectCode: 'S27-701',
    timeSlotBn: 'সকাল ৮:৩০ – দুপুর ১২:৩০',
    timeSlotEn: '08:30 AM – 12:30 PM',
    shiftAndHallBn: 'হিফজ অডিটোরিয়াম • উত্তরা সেক্টর-১২ ক্যাম্পাস',
  },
];

/**
 * Pure filter for Exam Schedules by classGroup ('All' | specific classGroup) and sessionTerm ('All' | specific sessionTerm).
 */
export function filterExamSchedules(
  schedules: ExamScheduleItem[] = DEFAULT_EXAM_SCHEDULES,
  classGroupFilter: string = 'All',
  sessionTermFilter: string = 'All'
): ExamScheduleItem[] {
  return (schedules || []).filter((item) => {
    const matchesClass = classGroupFilter === 'All' || item.classGroup === classGroupFilter;
    const matchesTerm = sessionTermFilter === 'All' || item.sessionTerm === sessionTermFilter;
    return matchesClass && matchesTerm;
  });
}


/**
 * Builds direct social sharing links (Facebook, WhatsApp, and copyable deep link)
 * for any individual Hafez card in the Hifzul Quran Tree.
 */
export function buildHafizSocialShareLinks(
  hafiz: HafizGraduateItem,
  siteOrigin: string = 'https://maharatmadrasah.com'
): {
  shareUrl: string;
  shareText: string;
  facebookShareUrl: string;
  whatsappShareUrl: string;
} {
  const cleanOrigin = (siteOrigin || 'https://maharatmadrasah.com').replace(/\/+$/, '');
  const shareUrl = `${cleanOrigin}/hifz-tree?hafiz=${hafiz.serialNumber}`;
  const shareText = `আলহামদুলিল্লাহ! মাহারাত মডেল মাদ্রাসার (EIIN: 140630) ${hafiz.serialLabelBn} ${hafiz.nameBn} (${hafiz.classNameBn}) পবিত্র কুরআনুল কারীমের হিফজ সম্পন্ন করেছেন (${hafiz.completionDate})। বিস্তারিত দেখুন: ${shareUrl}`;
  const targetUrlToShare = hafiz.facebookPostUrl || shareUrl;

  return {
    shareUrl,
    shareText,
    facebookShareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      targetUrlToShare
    )}&quote=${encodeURIComponent(shareText)}`,
    whatsappShareUrl: `https://wa.me/?text=${encodeURIComponent(shareText)}`,
  };
}

export const LEGACY_SEED_VIDEO_IDS = [
  'ScMzIvxBSi4',
  'gL6jnXvFT38',
  't4yx0qHfBys',
  'v8t4P1Hm9Rk',
  'wFdcJxr53cQ',
  'C1AesZa90Eo',
  'nfOXdQ4Jwms',
  'HLw315c7udg',
  'GuYXC9kCM1c',
  '8AmMkZvSbrk',
  'PxFPwsAb28g',
  'A0_IpETk1IU',
  'ttVzf1xumjk',
  '1cnIaEmKXoY',
  'pKvUJijZ-M4',
  '-lMiRiaSr6c',
  'Y3TdZByevwQ',
  'yRY23uHobeU',
  'HBZf-HXwk2Q',
  'cLu1HVBy-GM',
  'dQw4w9WgXcQ',
  'jNQXAC9IVRw',
  'aqz-KE-bpKQ',
];

export const LOCAL_MAHARAT_THUMBNAILS = [
  '/assets/maharat/maharat-campus.jpg',
  '/assets/maharat/maharat-science-fair.jpg',
  '/assets/maharat/maharat-approach.png',
  '/assets/maharat/maharat-uniform.png',
];

export function sanitizeThumbnailUrl(url?: string, index: number = 0): string {
  const fallback = LOCAL_MAHARAT_THUMBNAILS[Math.abs(index) % LOCAL_MAHARAT_THUMBNAILS.length];
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('lms-api.nexes.ai')) {
    return fallback;
  }
  return trimmed;
}

export function sanitizeVideoUrl(url?: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  for (const legacyId of LEGACY_SEED_VIDEO_IDS) {
    if (trimmed.includes(legacyId)) {
      return '';
    }
  }
  return trimmed;
}

export function hasValidVideoUrl(url?: string): boolean {
  return Boolean(sanitizeVideoUrl(url));
}

export function clearAllVideoLinksFromState(state: CMSState): CMSState {
  return {
    ...state,
    settings: {
      ...state.settings,
      heroVideoUrl: '',
    },
    campusVideo: {
      ...state.campusVideo,
      videoUrl: '',
    },
    departmentVideos: state.departmentVideos.map((dv) => ({
      ...dv,
      videoUrl: '',
    })),
    activityVideos: state.activityVideos.map((av) => ({
      ...av,
      videoUrl: '',
    })),
    guardianReels: state.guardianReels.map((gr) => ({
      ...gr,
      videoUrl: '',
    })),
  };
}

/**
 * Enables all public website sections in SiteSettings so every visitor can access all information.
 */
export function enableAllPublicSections(settings: SiteSettings): SiteSettings {
  return {
    ...settings,
    showNewsTicker: true,
    showHeroSection: true,
    showStatsBanner: true,
    showQuickExploreGrid: true,
    showAboutSection: true,
    showGallerySection: true,
    showCoursesSection: true,
    showFeeCalculator: true,
    showSeminarsSection: true,
    showCampusVideoSection: true,
    showDepartmentVideosSection: true,
    showActivityVideosSection: true,
    showGuardianReviewsSection: true,
    showNoticesSection: true,
    showMadrasahInfographicsSection: true,
    showSocialConnectSection: true,
    showContactSection: true,
  };
}

/**
 * Deeply merges a partial or full CMSState (from the public cache, GET /api/state, or a JSON backup)
 * with fallbackState so all 5 roles, RBAC permissions, stored logos, and infographics are preserved.
 */
export interface MergeCMSStateOptions {
  /**
   * True when `rawCandidate` is the stored state itself (a server response): its lists are used
   * exactly as they are, even when empty or shorter than the built-in defaults. False (default)
   * for seed content and imported backups, where an empty or missing list means "use the default".
   */
  authoritative?: boolean;
}

export function mergeLiveCMSState(
  rawCandidate: Record<string, unknown> | Partial<CMSState> | null | undefined,
  fallbackState: CMSState,
  options: MergeCMSStateOptions = {}
): CMSState {
  if (!rawCandidate || typeof rawCandidate !== 'object') {
    return fallbackState;
  }
  const authoritative = options.authoritative === true;
  /** The incoming list, unless it is missing (or, for non-authoritative sources, empty). */
  const list = <T, F extends T[] | undefined>(incoming: T[] | null | undefined, fallback: F): T[] | F =>
    Array.isArray(incoming) && (authoritative || incoming.length > 0) ? incoming : fallback;
  const parsed = rawCandidate as Partial<CMSState> & Record<string, unknown>;
  const incomingSettings =
    parsed.settings && typeof parsed.settings === 'object'
      ? (parsed.settings as Partial<SiteSettings>)
      : ('instituteName' in parsed ? (parsed as Partial<SiteSettings>) : {});

  const savedLogos: BrandLogoAsset[] = Array.isArray(incomingSettings.storedLogos)
    ? incomingSettings.storedLogos
    : [];
  const mergedLogos = [...savedLogos];
  // Stored state keeps exactly its own logo vault (a removed preset stays removed); backups and
  // seed content are topped up with the built-in presets.
  if (!authoritative || !Array.isArray(incomingSettings.storedLogos)) {
    for (const preset of fallbackState.settings.storedLogos || []) {
      if (!mergedLogos.some((l) => l.url === preset.url)) {
        mergedLogos.push(preset);
      }
    }
  }

  const parsedRbac = (parsed.rbacMatrix || {}) as Record<string, Record<string, unknown>>;

  const mergedCampusVideo = {
    ...fallbackState.campusVideo,
    ...(parsed.campusVideo || {}),
  };

  const rawDeptVideos =
    list(parsed.departmentVideos, fallbackState.departmentVideos);

  const rawActivityVideos =
    list(parsed.activityVideos, fallbackState.activityVideos);

  const rawGuardianReels =
    list(parsed.guardianReels, fallbackState.guardianReels);

  return {
    ...fallbackState,
    ...parsed,
    settings: {
      ...fallbackState.settings,
      ...incomingSettings,
      heroVideoUrl: sanitizeVideoUrl(incomingSettings.heroVideoUrl ?? fallbackState.settings.heroVideoUrl),
      storedLogos: mergedLogos,
      externalPortals: list(incomingSettings.externalPortals, fallbackState.settings.externalPortals),
      seoConfig: {
        ...DEFAULT_SEO_META_CONFIG,
        ...(fallbackState.settings.seoConfig || {}),
        ...(incomingSettings.seoConfig || {}),
        pageOverrides: list(
          incomingSettings.seoConfig?.pageOverrides,
          fallbackState.settings.seoConfig?.pageOverrides || DEFAULT_SEO_META_CONFIG.pageOverrides
        ),
      },
    },
    popupConfig: {
      ...fallbackState.popupConfig,
      ...(parsed.popupConfig || {}),
    },
    aiBotConfig: {
      ...fallbackState.aiBotConfig,
      ...(parsed.aiBotConfig || {}),
      suggestedQuestions: list(parsed.aiBotConfig?.suggestedQuestions, fallbackState.aiBotConfig.suggestedQuestions),
      qaItems: list(parsed.aiBotConfig?.qaItems, fallbackState.aiBotConfig.qaItems),
    },
    whatsappConfig: {
      ...fallbackState.whatsappConfig,
      ...(parsed.whatsappConfig || {}),
      quickTopics: list(parsed.whatsappConfig?.quickTopics, fallbackState.whatsappConfig.quickTopics),
    },
    feeCalculatorConfig: {
      ...fallbackState.feeCalculatorConfig,
      ...(parsed.feeCalculatorConfig || {}),
      items: list(parsed.feeCalculatorConfig?.items, fallbackState.feeCalculatorConfig.items),
    },
    campusVideo: {
      ...mergedCampusVideo,
      videoUrl: sanitizeVideoUrl(mergedCampusVideo.videoUrl),
      thumbnailUrl: sanitizeThumbnailUrl(mergedCampusVideo.thumbnailUrl, 0),
    },
    departmentVideos: rawDeptVideos.map((dv, idx) => ({
      ...dv,
      videoUrl: sanitizeVideoUrl(dv.videoUrl),
      thumbnailUrl: sanitizeThumbnailUrl(dv.thumbnailUrl, idx),
    })),
    activityVideos: rawActivityVideos.map((av, idx) => ({
      ...av,
      videoUrl: sanitizeVideoUrl(av.videoUrl),
      thumbnailUrl: sanitizeThumbnailUrl(av.thumbnailUrl, idx),
    })),
    guardianReels: rawGuardianReels.map((gr, idx) => ({
      ...gr,
      videoUrl: sanitizeVideoUrl(gr.videoUrl),
      thumbnailUrl: sanitizeThumbnailUrl(gr.thumbnailUrl, idx),
    })),
    news: Array.isArray(parsed.news) ? parsed.news : fallbackState.news,
    notices: Array.isArray(parsed.notices) ? parsed.notices : fallbackState.notices,
    courses: Array.isArray(parsed.courses) ? parsed.courses : fallbackState.courses,
    events: Array.isArray(parsed.events) ? parsed.events : fallbackState.events,
    leads: Array.isArray(parsed.leads) ? parsed.leads : fallbackState.leads,
    users: (() => {
      const existing: AdminUser[] = (Array.isArray(parsed.users) ? parsed.users : []).map(
        (u: AdminUser) => ({
          ...u,
          role: normalizeAdminRole(u.role),
        })
      );
      if (authoritative && Array.isArray(parsed.users)) return existing;
      const merged = [...existing];
      for (const seedUser of fallbackState.users) {
        if (!merged.some((u) => u.username === seedUser.username || u.role === seedUser.role)) {
          merged.push(seedUser);
        }
      }
      return merged.length ? merged : fallbackState.users;
    })(),
    rbacMatrix: {
      'Super Admin': {
        ...DEFAULT_RBAC_MATRIX['Super Admin'],
        ...(parsedRbac['Super Admin'] || {}),
      },
      'Chairman / Managing Director': {
        ...DEFAULT_RBAC_MATRIX['Chairman / Managing Director'],
        ...(parsedRbac['Chairman / Managing Director'] || {}),
      },
      'Principal / Vice Principal': {
        ...DEFAULT_RBAC_MATRIX['Principal / Vice Principal'],
        ...(parsedRbac['Principal / Vice Principal'] || parsedRbac['Principal'] || {}),
      },
      'Coordinators / Teachers': {
        ...DEFAULT_RBAC_MATRIX['Coordinators / Teachers'],
        ...(parsedRbac['Coordinators / Teachers'] || parsedRbac['Teacher'] || {}),
      },
      'Content Managers': {
        ...DEFAULT_RBAC_MATRIX['Content Managers'],
        ...(parsedRbac['Content Managers'] || parsedRbac['Content Manager'] || {}),
      },
    } as RolePermissionMatrix,
    leaveRequests: list(parsed.leaveRequests, fallbackState.leaveRequests),
    emails: list(parsed.emails, fallbackState.emails),
    educationMethodConfig: {
      ...fallbackState.educationMethodConfig,
      ...(parsed.educationMethodConfig || {}),
      stages: list(parsed.educationMethodConfig?.stages, fallbackState.educationMethodConfig.stages),
    },
    tenYearPlanConfig: {
      ...fallbackState.tenYearPlanConfig,
      ...(parsed.tenYearPlanConfig || {}),
      stageBanners: list(parsed.tenYearPlanConfig?.stageBanners, fallbackState.tenYearPlanConfig.stageBanners),
      classColumns: list(parsed.tenYearPlanConfig?.classColumns, fallbackState.tenYearPlanConfig.classColumns),
      tracks: list(parsed.tenYearPlanConfig?.tracks, fallbackState.tenYearPlanConfig.tracks),
    },
    dayCareRoutineConfig: {
      ...fallbackState.dayCareRoutineConfig,
      ...(parsed.dayCareRoutineConfig || {}),
      periods: list(parsed.dayCareRoutineConfig?.periods, fallbackState.dayCareRoutineConfig.periods),
      durationBars: list(parsed.dayCareRoutineConfig?.durationBars, fallbackState.dayCareRoutineConfig.durationBars),
    },
    transportConfig: {
      ...fallbackState.transportConfig,
      ...(parsed.transportConfig || {}),
      vehicleImageUrl:
        typeof parsed.transportConfig?.vehicleImageUrl === 'string' &&
        parsed.transportConfig.vehicleImageUrl.endsWith('/transport_van.png')
          ? '/assets/maharat/transport-van.png'
          : parsed.transportConfig?.vehicleImageUrl || fallbackState.transportConfig.vehicleImageUrl,
      routes: list(parsed.transportConfig?.routes, fallbackState.transportConfig.routes),
      landmarks: list(parsed.transportConfig?.landmarks, fallbackState.transportConfig.landmarks),
    },
    admissionExtraConfig: {
      ...fallbackState.admissionExtraConfig,
      ...(parsed.admissionExtraConfig || {}),
      feeComparisonRows: list(parsed.admissionExtraConfig?.feeComparisonRows, fallbackState.admissionExtraConfig.feeComparisonRows),
      ageEligibilityList: list(parsed.admissionExtraConfig?.ageEligibilityList, fallbackState.admissionExtraConfig.ageEligibilityList),
      requiredDocumentsBn: list(parsed.admissionExtraConfig?.requiredDocumentsBn, fallbackState.admissionExtraConfig.requiredDocumentsBn),
    },
    uniformConfig: {
      ...fallbackState.uniformConfig,
      ...(parsed.uniformConfig || {}),
    },
    madrasahContextConfig: {
      ...fallbackState.madrasahContextConfig,
      ...(parsed.madrasahContextConfig || {}),
    },
    hifzTreeConfig: {
      ...fallbackState.hifzTreeConfig,
      ...(parsed.hifzTreeConfig || {}),
      // Stored data is authoritative: a graduate removed in the admin panel stays removed. Only
      // old backups / seed content (non-authoritative) are topped up from the built-in list.
      totalHuffazCount:
        authoritative && Number.isFinite(Number(parsed.hifzTreeConfig?.totalHuffazCount))
          ? Number(parsed.hifzTreeConfig?.totalHuffazCount)
          : Math.max(Number(parsed.hifzTreeConfig?.totalHuffazCount || 0), fallbackState.hifzTreeConfig.totalHuffazCount),
      graduates:
        Array.isArray(parsed.hifzTreeConfig?.graduates) &&
        (authoritative || parsed.hifzTreeConfig.graduates.length >= fallbackState.hifzTreeConfig.graduates.length)
          ? parsed.hifzTreeConfig.graduates
          : fallbackState.hifzTreeConfig.graduates,
    },
    photoGallery:
      list(parsed.photoGallery, fallbackState.photoGallery),
    complaints: list(parsed.complaints, fallbackState.complaints),
    versionManager: resolveVersionManagerConfig(
      parsed.versionManager ?? fallbackState.versionManager
    ),
    careerJobs:
      list(parsed.careerJobs, fallbackState.careerJobs || []),
    careerApplications:
      list(parsed.careerApplications, fallbackState.careerApplications || []),
    careerCandidates: Array.isArray(parsed.careerCandidates)
      ? parsed.careerCandidates
      : fallbackState.careerCandidates || [],
    admissionTokens2027:
      list(parsed.admissionTokens2027, fallbackState.admissionTokens2027 || []),
    blogPosts:
      list(parsed.blogPosts, fallbackState.blogPosts || []),
    blogAutomationConfig: {
      ...(fallbackState.blogAutomationConfig || {
        enabled: true,
        apiKey: 'mmm-blog-live-key-2027',
        defaultAuthorName: 'Maharat Editorial Desk',
        defaultCategory: 'Education & Tarbiyah',
      }),
      ...(parsed.blogAutomationConfig || {}),
    },
    calendarEvents:
      list(parsed.calendarEvents, fallbackState.calendarEvents || []),
    mobileBottomBar:
      parsed.mobileBottomBar && Array.isArray(parsed.mobileBottomBar.slots) && (authoritative || parsed.mobileBottomBar.slots.length > 0)
        ? parsed.mobileBottomBar
        : fallbackState.mobileBottomBar,
    virtualOfficeConfig: parsed.virtualOfficeConfig
      ? {
          ...(fallbackState.virtualOfficeConfig || parsed.virtualOfficeConfig),
          ...parsed.virtualOfficeConfig,
          desks:
            // The desk list always falls back to the defaults when empty (the server does the same).
            Array.isArray(parsed.virtualOfficeConfig.desks) && parsed.virtualOfficeConfig.desks.length
              ? parsed.virtualOfficeConfig.desks
              : fallbackState.virtualOfficeConfig?.desks || [],
        }
      : fallbackState.virtualOfficeConfig,
    virtualOfficeSessions:
      list(parsed.virtualOfficeSessions, fallbackState.virtualOfficeSessions || []),
  };
}

/**
 * Validates and merges a JSON backup object into a complete CMSState safely.
 */
export function validateAndMergeCMSBackup(
  rawInput: unknown,
  fallbackState: CMSState
): { valid: boolean; mergedState?: CMSState; state?: CMSState; error?: string; summary?: string } {
  let rawParsed: unknown = rawInput;
  if (typeof rawInput === 'string') {
    try {
      rawParsed = JSON.parse(rawInput);
    } catch {
      return { valid: false, error: 'অকার্যকর JSON ফরম্যাট। অনুগ্রহ করে সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।' };
    }
  }
  if (!rawParsed || typeof rawParsed !== 'object' || Array.isArray(rawParsed)) {
    return { valid: false, error: 'অকার্যকর JSON ফরম্যাট। অনুগ্রহ করে সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।' };
  }

  const candidate = (rawParsed as Record<string, unknown>).data &&
    typeof (rawParsed as Record<string, unknown>).data === 'object'
    ? ((rawParsed as Record<string, unknown>).data as Record<string, unknown>)
    : (rawParsed as Record<string, unknown>);

  const hasAnyRecognizedKey =
    'settings' in candidate ||
    'courses' in candidate ||
    'notices' in candidate ||
    'feeCalculatorConfig' in candidate ||
    'activityVideos' in candidate ||
    'instituteName' in candidate;

  if (!hasAnyRecognizedKey) {
    return {
      valid: false,
      error: 'এই JSON ফাইলে প্রতিষ্ঠানের কোনো বৈধ ডাটা (settings, courses, notices বা videos) পাওয়া যায়নি।',
    };
  }

  const mergedState = mergeLiveCMSState(candidate, fallbackState);

  return {
    valid: true,
    mergedState,
    state: mergedState,
    summary: `${mergedState.settings.instituteNameBn} (${mergedState.settings.instituteName}) — ${mergedState.courses.length}টি একাডেমিক শ্রেণি/পাঠ্যক্রম, ${mergedState.activityVideos.length}টি অ্যাক্টিভিটি ভিডিও এবং ${mergedState.notices.length}টি নোটিশ লোড হয়েছে।`,
  };
}

export interface ExtractedInstitutionProfile {
  instituteName: string;
  instituteNameBn: string;
  tagline: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  phonePrimary: string;
  phoneSecondary: string;
  email: string;
  address: string;
  addressEn: string;
  whatsappNumber: string;
  residentialMonthlyFee: number;
  dayCareMonthlyFee: number;
  customKnowledgeBase: string;
}

/**
 * Deterministic smart document extractor that parses uploaded text/docs/brochures
 * into an ExtractedInstitutionProfile (used as instant fallback or pre-processor alongside Gemini AI).
 */
export function extractInstitutionFromTextHeuristic(
  rawText: string,
  currentState: CMSState
): ExtractedInstitutionProfile {
  const text = rawText.trim();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Extract Email
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0] : currentState.settings.email;

  // Extract Bangladeshi Phone Numbers
  const phoneMatches = text.match(/(?:\+?88)?01[3-9]\d{2}[-\s]?\d{6}/g) || [];
  const phonePrimary = phoneMatches[0] || currentState.settings.phonePrimary;
  const phoneSecondary = phoneMatches[1] || currentState.settings.phoneSecondary;
  const whatsappNumber = phoneMatches[0]
    ? phoneMatches[0].replace(/[^0-9+]/g, '')
    : currentState.settings.whatsappNumber;

  // Extract English Name
  let instituteName = currentState.settings.instituteName;
  const engNameMatch =
    text.match(/(?:Institute Name|Name|Institution|Academy|Madrasa|School)\s*[:\-]\s*([A-Za-z0-9\s.,&'-]{4,60})/i) ||
    lines.find((l) => /^[A-Z][A-Za-z0-9\s&'-]{5,55}(?:Institute|Academy|School|Madrasa|College|University)/i.test(l));
  if (typeof engNameMatch === 'string') {
    instituteName = engNameMatch.trim();
  } else if (engNameMatch?.[1]) {
    instituteName = engNameMatch[1].trim();
  }

  // Extract Bengali Name
  let instituteNameBn = currentState.settings.instituteNameBn;
  const bnNameMatch = text.match(/(?:প্রতিষ্ঠানের নাম|নাম|মাদরাসা|ইনস্টিটিউট|একাডেমি)\s*[:\-]\s*([^\n\r]{4,70})/);
  if (bnNameMatch?.[1]) {
    instituteNameBn = bnNameMatch[1].trim();
  } else {
    const firstBnLine = lines.find(
      (l) => /[\u0980-\u09FF]/.test(l) && l.length >= 6 && l.length <= 60 && !l.includes(':')
    );
    if (firstBnLine) {
      instituteNameBn = firstBnLine;
    }
  }

  // Extract Address
  let address = currentState.settings.address;
  const addrMatch = text.match(/(?:ঠিকানা|Address|Location|ক্যাম্পাস)\s*[:\-]\s*([^\n\r]{8,160})/i);
  if (addrMatch?.[1]) {
    address = addrMatch[1].trim();
  }

  // Extract Tagline / Slogan
  let tagline = currentState.settings.tagline;
  const taglineMatch = text.match(/(?:স্লোগান|Tagline|Motto|লক্ষ্য)\s*[:\-]\s*([^\n\r]{8,140})/i);
  if (taglineMatch?.[1]) {
    tagline = taglineMatch[1].trim();
  }

  return {
    instituteName,
    instituteNameBn,
    tagline,
    heroTitle: currentState.settings.heroTitle,
    heroHighlight: currentState.settings.heroHighlight,
    heroSubtitle: text.slice(0, 220).replace(/\s+/g, ' ').trim() || currentState.settings.heroSubtitle,
    phonePrimary,
    phoneSecondary,
    email,
    address,
    addressEn: currentState.settings.addressEn,
    whatsappNumber,
    residentialMonthlyFee: currentState.feeCalculatorConfig.residentialMonthlyFee,
    dayCareMonthlyFee: currentState.feeCalculatorConfig.dayCareMonthlyFee,
    customKnowledgeBase: `${instituteNameBn} (${instituteName}) — ঠিকানা: ${address}। ফোন: ${phonePrimary}, ইমেইল: ${email}। সারসংক্ষেপ: ${text.slice(0, 500).replace(/\s+/g, ' ')}`,
  };
}

/**
 * Pure helper to add and persist a new logo image into SiteSettings.storedLogos,
 * optionally setting it as the active global header logo (`logoUrl`).
 */
export function addLogoToSettings(
  currentSettings: SiteSettings,
  newLogoInput: {
    id?: string;
    name: string;
    url: string;
    variant?: BrandLogoAsset['variant'];
    uploadedAt?: string;
  },
  setAsActiveHeaderLogo: boolean = true
): SiteSettings {
  const trimmedUrl = newLogoInput.url.trim();
  if (!trimmedUrl) return currentSettings;

  const existingLogos = currentSettings.storedLogos || [];
  const newAsset: BrandLogoAsset = {
    id: newLogoInput.id || `logo-${Date.now()}`,
    name: newLogoInput.name.trim() || 'Uploaded Brand Logo',
    url: trimmedUrl,
    variant: newLogoInput.variant || 'custom',
    uploadedAt: newLogoInput.uploadedAt || new Date().toISOString().slice(0, 10),
    isSystemPreset: false,
  };

  // Deduplicate if same URL already exists, otherwise prepend
  const filtered = existingLogos.filter((item) => item.url !== trimmedUrl);
  const updatedLogos = [newAsset, ...filtered];

  return {
    ...currentSettings,
    storedLogos: updatedLogos,
    logoUrl: setAsActiveHeaderLogo ? trimmedUrl : currentSettings.logoUrl,
  };
}

/**
 * Pure helper to remove a stored logo by ID from SiteSettings.storedLogos.
 * If the removed logo was the active header logo, falls back to the first remaining stored logo.
 */
export function deleteLogoFromSettings(
  currentSettings: SiteSettings,
  logoId: string
): SiteSettings {
  const existingLogos = currentSettings.storedLogos || [];
  const target = existingLogos.find((l) => l.id === logoId);
  if (!target || target.isSystemPreset) {
    return currentSettings;
  }

  const remaining = existingLogos.filter((l) => l.id !== logoId);
  const nextActiveUrl =
    currentSettings.logoUrl === target.url
      ? remaining[0]?.url || '/assets/maharat/01-Branding_Logo-with-EIIN_02.svg'
      : currentSettings.logoUrl;

  return {
    ...currentSettings,
    storedLogos: remaining,
    logoUrl: nextActiveUrl,
  };
}

// ============================================================================
// SEO META EDITOR & OPEN GRAPH DYNAMIC SYNCHRONIZER
// ============================================================================

export const DEFAULT_SEO_META_CONFIG: SeoMetaConfig = {
  documentTitle: 'মাহারাত মডেল মাদ্রাসা | Maharat Model Madrasah (EIIN: 140630)',
  metaDescription:
    'মাহারাত মডেল মাদ্রাসা (Maharat Model Madrasah | مدرسة المهارات النموذجية) — EIIN: 140630 | Code: 21023। কুরআন-সুন্নাহর বিশুদ্ধ ইলম ও আধুনিক জেনারেল শিক্ষার সমন্বয়ে প্রি-প্লে থেকে দাখিল ও তাহফিজুল কুরআন বিভাগে ভর্তি চলছে। উত্তরা, ঢাকা।',
  metaKeywords:
    'মাহারাত মডেল মাদ্রাসা, Maharat Model Madrasah, EIIN 140630, উত্তরা মাদ্রাসা, হিফজুল কুরআন মাদ্রাসা, দাখিল মাদ্রাসা ঢাকা, আরবি ও ইংলিশ ভার্সন মাদ্রাসা, Tahfizul Quran Madrasah Uttara',
  ogTitle: 'মাহারাত মডেল মাদ্রাসা | Maharat Model Madrasah (EIIN: 140630)',
  ogDescription:
    'একটি আধুনিক মানসম্পন্ন ব্যতিক্রমী দ্বীনি শিক্ষা প্রতিষ্ঠান — প্রি-প্লে ও প্লে থেকে নবম/দাখিল (আরবি ও ইংলিশ ভার্সন) এবং তাহফিজুল কুরআন বিভাগে ভর্তি চলছে। সেক্টর-১২, উত্তরা, ঢাকা।',
  ogImageUrl: '/assets/maharat/fb/fb-media-3.jpg',
  ogSiteName: 'মাহারাত মডেল মাদ্রাসা | Maharat Model Madrasah',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterHandle: '@maharatmadrasah',
  canonicalBaseUrl: 'https://maharatmodelmadrasah.edu.bd',
  robotsDirective: 'index, follow',
  enableJsonLdSchema: true,
  syncOgWithMeta: false,
  pageOverrides: [
    {
      routePath: '/',
      pageLabelBn: 'হোম পেইজ (Home)',
      pageLabelEn: 'Home Page',
      title: 'মাহারাত মডেল মাদ্রাসা | Maharat Model Madrasah (EIIN: 140630)',
      metaDescription:
        'মাহারাত মডেল মাদ্রাসা (EIIN: 140630) — কুরআন-সুন্নাহর বিশুদ্ধ ইলম ও আধুনিক জেনারেল শিক্ষার সমন্বয়ে প্রি-প্লে থেকে দাখিল এবং তাহফিজুল কুরআন বিভাগে ভর্তি চলছে। উত্তরা, ঢাকা।',
      ogImageUrl: '/assets/maharat/fb/fb-media-3.jpg',
    },
    {
      routePath: '/syllabus',
      pageLabelBn: 'কারিকুলাম ও পাঠ্যক্রম (Curriculum)',
      pageLabelEn: 'Curriculum & Syllabus',
      title: 'কারিকুলাম ও পাঠ্যক্রম | মাহারাত মডেল মাদ্রাসা (EIIN: 140630)',
      metaDescription:
        'প্রি-প্লে ও প্লে থেকে নবম/দাখিল (আরবি ও ইংলিশ ভার্সন) এবং নূরানী, নাজেরা ও হিফজুল কুরআন বিভাগের সমন্বিত সিলেবাস ও পাঠ্যক্রম দেখুন।',
      ogImageUrl: '/assets/maharat/fb/fb-media-2.jpg',
    },
    {
      routePath: '/hifz-tree',
      pageLabelBn: 'হিফজুল কুরআন বংশবৃক্ষ (Hifz Tree)',
      pageLabelEn: 'Hifzul Quran Lineage Tree',
      title: 'হিফজুল কুরআন ট্রি (১ম–৩০তম হাফেজ) | মাহারাত মডেল মাদ্রাসা',
      metaDescription:
        'মাহারাত মডেল মাদ্রাসার গৌরবময় ১ম থেকে ৩০তম কুরআনের হাফেজদের বংশবৃক্ষ, পাগড়ি প্রদান ও বিমানে কক্সবাজার শিক্ষাসফর সম্মাননা।',
      ogImageUrl: '/assets/maharat/fb/fb-media-1.jpg',
    },
    {
      routePath: '/gallery',
      pageLabelBn: 'মাল্টিমিডিয়া গ্যালারি (Photo & Video Gallery)',
      pageLabelEn: 'Multimedia Photo & Video Gallery',
      title: 'মাল্টিমিডিয়া ফটো ও ভিডিও গ্যালারি | মাহারাত মডেল মাদ্রাসা',
      metaDescription:
        'মাহারাত মডেল মাদ্রাসার হিফজ সবক অনুষ্ঠান, বোর্ড পরীক্ষার ফলাফল, বার্ষিক শিক্ষাসফর, সীরাত প্রদর্শনী ও স্মার্ট ক্যাম্পাসের ছবি ও ১৬:৯ এইচডি ভিডিও।',
      ogImageUrl: '/assets/maharat/fb/fb-media-5.jpg',
    },
    {
      routePath: '/admission',
      pageLabelBn: 'অনলাইন ভর্তি ও রেজিস্ট্রেশন (Admission)',
      pageLabelEn: 'Online Admission & Registration',
      title: 'অনলাইন ভর্তি আবেদন ও ফি ক্যালকুলেটর | মাহারাত মডেল মাদ্রাসা',
      metaDescription:
        'মাহারাত মডেল মাদ্রাসায় ২০২৬-২০২৭ শিক্ষাবর্ষে আবাসিক, অনাবাসিক ও ডে-কেয়ার বিভাগে অনলাইনে ভর্তি ফর্ম পূরণ ও টিউশন ফি হিসাব করুন।',
      ogImageUrl: '/assets/maharat/fb/fb-media-3.jpg',
    },
    {
      routePath: '/notices',
      pageLabelBn: 'নোটিশ বোর্ড ও পরীক্ষার রুটিন (Notices)',
      pageLabelEn: 'Notice Board & Exam Routine',
      title: 'ডিজিটাল নোটিশ বোর্ড ও পরীক্ষার সময়সূচি | মাহারাত মডেল মাদ্রাসা',
      metaDescription:
        'মাহারাত মডেল মাদ্রাসার ভর্তি বিজ্ঞপ্তি, পরীক্ষার রুটিন, ছুটির তালিকা এবং একাডেমিক নোটিশসমূহ দেখুন ও পিডিএফ ডাউনলোড করুন।',
      ogImageUrl: '/assets/maharat/fb/fb-media-4.jpg',
    },
    {
      routePath: '/career',
      pageLabelBn: 'ক্যারিয়ার ও নিয়োগ বিজ্ঞপ্তি (Career)',
      pageLabelEn: 'Career & Job Circulars',
      title: 'ক্যারিয়ার ও নিয়োগ বিজ্ঞপ্তি | মাহারাত মডেল মাদ্রাসা (উত্তরা সেক্টর-১২)',
      metaDescription:
        'মাহারাত মডেল মাদ্রাসায় হিফজ শিক্ষক, জেনারেল ও ইংলিশ ভার্সন শিক্ষক এবং প্রশাসনিক পদে অনলাইনে আবেদন করুন।',
      ogImageUrl: '/assets/maharat/maharat-campus.jpg',
    },
    {
      routePath: '/contact',
      pageLabelBn: 'যোগাযোগ ও ক্যাম্পাস ম্যাপ (Contact)',
      pageLabelEn: 'Contact & Campus Location',
      title: 'যোগাযোগ ও ক্যাম্পাস ঠিকানা | মাহারাত মডেল মাদ্রাসা (উত্তরা সেক্টর-১২)',
      metaDescription:
        'প্রধান অফিস ও গার্লস ক্যাম্পাস: বাড়ি-৭, রোড-১৭/এ, সেক্টর-১২, উত্তরা, ঢাকা। বয়েস ক্যাম্পাস: বাড়ি-১১, রোড-১৯, সেক্টর-১২, উত্তরা, ঢাকা। ফোন: 01886-340308।',
      ogImageUrl: '/assets/maharat/maharat-campus.jpg',
    },
  ],
  updatedAt: '2026-11-10',
};
