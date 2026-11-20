import React, { useEffect, useState } from 'react';
import { motion, type Variants } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Briefcase,
  Bus,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Compass,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  Facebook,
  FileText,
  Gift,
  GitBranch,
  Globe,
  GraduationCap,
  HeartHandshake,
  Home,
  Image as ImageIcon,
  Layers,
  Mail,
  MapPin,
  Megaphone,
  Menu,
  MessageCircle,
  Monitor,
  Pause,
  Phone,
  Play,
  Send,
  Share2,
  Smartphone,
  Sparkles,
  Video,
  X,
  Youtube,
} from 'lucide-react';
import { useCMS } from '../store/useCMSStore';
import {
  AdminRole,
  CourseCategory,
  CourseItem,
  EventItem,
  NoticeCategory,
  NoticeItem,
} from '../types/cms';
import {
  filterNotices,
  hasValidVideoUrl,
  toBengaliDigits,
  validateInquiryInput,
} from '../utils/cmsLogic';
import {
  HEADER_NAV_GROUPS,
  localizeDigits,
  localizeDynamicText,
  PAGE_PATH_MAP,
  PublicPageId,
  resolvePageFromPath,
} from '../utils/i18nContent';
import { resolveVersionManagerConfig, shouldShowPublicVersion } from '../utils/versionLogic';
import { AdmissionFormModal } from './AdmissionFormModal';
import { AdmissionPopupModal } from './AdmissionPopupModal';
import { AccessibilityToolbar } from './AccessibilityToolbar';
import { HeaderLoginDropdown } from './HeaderLoginDropdown';
import { Hero3DCanvas } from './Hero3DCanvas';
import {
  CategorizedPhotoGallerySection,
  ExamScheduleAndSmartCampusSection,
  FramedPhotoModalData,
  HifzQuranTreeSection,
} from './HifzTreeAndGallerySection';
import {
  HomeCategorizedFaqSection,
  HomeContextAndPrincipalSection,
  HomeRegistrationSplitSection,
} from './HomeConversionAndFaqSection';
import { CareerPortalPage } from './CareerPortalPage';
import { BlogPortalPage } from './BlogPortalPage';
import { InteractiveFeeCalculator } from './InteractiveFeeCalculator';
import { MadrasahInfographicsSection } from './MadrasahInfographicsSection';
import { MobileBottomBar } from './MobileBottomBar';
import { NoorAIChatbot } from './NoorAIChatbot';
import {
  CertificateVerificationModal,
  ReleaseNotesModal,
} from './ReleaseNotesAndCertModals';
import {
  VirtualOfficeDeskCard,
  VirtualOfficeFloatingLauncher,
} from './VirtualOfficeWidget';
import {
  AppleCinemaVideoModal,
  AppleStudioPhotoLightbox,
  CinemaVideoModalItem,
} from './PremiumMediaModals';
import { RegistrationFormModal } from './RegistrationFormModal';
import {
  DEFAULT_BOYS_CAMPUS_EMBED_URL,
  DEFAULT_BOYS_CAMPUS_MAP_URL,
  DEFAULT_GIRLS_CAMPUS_EMBED_URL,
  DEFAULT_GIRLS_CAMPUS_MAP_URL,
  resolveGoogleMapsEmbedUrl,
} from '../utils/careerAndMapsLogic';
import { isValidExternalPortalUrl, resolveExternalPortals } from '../utils/portalAndHifzLogic';

interface PublicWebsiteProps {
  onOpenAdmin: (role?: AdminRole) => void;
}

const sectionRevealVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const cardItemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const SOCIAL_CONNECT_COPY = {
  bn: {
    badge: 'সোশ্যাল মিডিয়া ও লোকেশন নেটওয়ার্ক',
    title: 'মাহারাত মডেল মাদ্রাসার অফিশিয়াল কমিউনিটিতে যুক্ত থাকুন',
    subtitle:
      'প্রতিদিনের ক্লাস আপডেট, হিফজ তিলাওয়াত, নোটিশ, বিজ্ঞান মেলা ও উত্তরা সেক্টর-১২ ক্যাম্পাস লোকেশন পেতে আমাদের অফিশিয়াল চ্যানেলগুলোতে যুক্ত হোন।',
    platforms: {
      facebook: { name: 'Facebook Page', handle: '@maharatmodelmadrasah', action: 'Follow Page' },
      youtube: { name: 'YouTube Channel', handle: '@maharatmodelmadrasa', action: 'Subscribe' },
      whatsapp: { name: 'WhatsApp Helpline', handle: '01886-340308', action: 'Chat Now' },
      linkedin: { name: 'LinkedIn Official', handle: 'Maharat Foundation & Madrasah', action: 'Connect' },
      instagram: { name: 'Instagram', handle: 'ক্যাম্পাস লাইফ ও অ্যাক্টিভিটি রিলস', action: 'Follow' },
      twitter: { name: 'X (Twitter)', handle: 'তাৎক্ষণিক ঘোষণা ও আপডেট', action: 'Follow X' },
      telegram: { name: 'Telegram Channel', handle: 'নোটিশ পিডিএফ ও ই-প্রসপেক্টাস', action: 'Join Channel' },
      maps: { name: 'Google Maps Location', handle: 'বাড়ি-৭, রোড-১৭/এ, সেক্টর-১২, উত্তরা', action: 'Open Map' },
    },
  },
  en: {
    badge: 'Official Social & Location Network',
    title: 'Stay Connected With Maharat Model Madrasah',
    subtitle:
      'Follow our official social channels for daily campus updates, Tahfiz recitations, circulars, science fairs, and direct Uttara Sector-12 navigation.',
    platforms: {
      facebook: { name: 'Facebook Page', handle: '@maharatmodelmadrasah', action: 'Follow Page' },
      youtube: { name: 'YouTube Channel', handle: '@maharatmodelmadrasa', action: 'Subscribe' },
      whatsapp: { name: 'WhatsApp Helpline', handle: '01886-340308', action: 'Chat Now' },
      linkedin: { name: 'LinkedIn Official', handle: 'Maharat Foundation Network', action: 'Connect' },
      instagram: { name: 'Instagram', handle: 'Campus Life & Student Highlights', action: 'Follow' },
      twitter: { name: 'X (Twitter)', handle: 'Official Announcements & News', action: 'Follow X' },
      telegram: { name: 'Telegram Channel', handle: 'Notice PDFs & e-Prospectus', action: 'Join Channel' },
      maps: { name: 'Google Maps Location', handle: 'House-7, Road-17/A, Sector-12, Uttara', action: 'Open Map' },
    },
  },
  ar: {
    badge: 'شبكة التواصل الاجتماعي والموقع الرسمي',
    title: 'تواصلوا مع مدرسة المهارات النموذجية',
    subtitle:
      'تابعوا قنواتنا الرسمية للاطلاع على التحديثات اليومية، تلاوات القرآن الكريم، الإعلانات الرسمية، وموقع الحرم التعليمي في أوتارا قطاع ١٢.',
    platforms: {
      facebook: { name: 'صفحة فيسبوك', handle: '@maharatmodelmadrasah', action: 'تابع الصفحة' },
      youtube: { name: 'قناة يوتيوب', handle: '@maharatmodelmadrasa', action: 'اشترك الآن' },
      whatsapp: { name: 'واتساب للقبول', handle: '01886-340308', action: 'تحدث الآن' },
      linkedin: { name: 'لينكد إن الرسمي', handle: 'مؤسسة ومدرسة المهارات', action: 'تواصل معنا' },
      instagram: { name: 'إنستغرام', handle: 'أنشطة الطلاب والحياة المدرسية', action: 'متابعة' },
      twitter: { name: 'منصة X (تويتر)', handle: 'الأخبار والإعلانات العاجلة', action: 'متابعة' },
      telegram: { name: 'قناة تيليجرام', handle: 'ملفات PDF والنشرة التعريفية', action: 'انضم للقناة' },
      maps: { name: 'موقع خرائط جوجل', handle: 'منزل ٧، طريق ١٧/أ، قطاع ١٢، أوتارا', action: 'افتح الخريطة' },
    },
  },
} as const;

const NOTICE_CATEGORIES: ('All' | NoticeCategory)[] = [
  'All',
  'Admission',
  'Exam',
  'Academic',
  'Holiday',
];

const COURSE_CATEGORIES: ('All' | CourseCategory)[] = [
  'All',
  'Academic',
  'Hifzul Quran',
  'IT Skills',
  'Soft & Hard Skills',
];

const IT_SKILLS_GRID = [
  {
    title: 'Graphic Design',
    enSub: 'Brand Identity & Visual Design',
    bn: 'গ্রাফিক ডিজাইন ও ব্র্যান্ডিং',
    ar: 'التصميم الجرافيكي والهوية البصرية',
  },
  {
    title: 'Video Editing',
    enSub: 'Professional Video Post-Production',
    bn: 'প্রফেশনাল ভিডিও এডিটিং',
    ar: 'مونتاج وتحرير الفيديو الاحترافي',
  },
  {
    title: 'Motion Design & Animation',
    enSub: '2D/3D Motion Graphics & Visual Effects',
    bn: 'মোশন গ্রাফিক্স ও অ্যানিমেশন',
    ar: 'الموشن جرافيك والرسوم المتحركة',
  },
  {
    title: 'Sound Design',
    enSub: 'Audio Engineering & Studio Mastering',
    bn: 'সাউন্ড ডিজাইন ও অডিও ইঞ্জিনিয়ারিং',
    ar: 'هندسة الصوت والتسجيل الصوتي',
  },
  {
    title: 'Cinematography',
    enSub: 'Camera Framing & Lighting Direction',
    bn: 'সিনেমাটোগ্রাফি ও ক্যামেরা ফ্রেমিং',
    ar: 'التصوير السينمائي وإعداد الكاميرا',
  },
  {
    title: 'Artificial Intelligence (AI)',
    enSub: 'Generative AI & Prompt Engineering',
    bn: 'আর্টিফিশিয়াল ইন্টেলিজেন্স ও প্রম্পট',
    ar: 'الذكاء الاصطناعي وهندسة الأوامر',
  },
  {
    title: 'Web Design & Development',
    enSub: 'Modern Responsive Web Applications',
    bn: 'ওয়েব ডিজাইন ও ডেভেলপমেন্ট',
    ar: 'تصميم وتطوير مواقع الويب',
  },
  {
    title: 'App Design & Development',
    enSub: 'Mobile UI/UX & App Prototyping',
    bn: 'অ্যাপ ডিজাইন ও ইউআই/ইউএক্স',
    ar: 'تصميم التطبيقات وتجربة المستخدم',
  },
  {
    title: 'Microsoft Office Suite',
    enSub: 'Word, Excel & PowerPoint Mastery',
    bn: 'Word, Excel, PowerPoint মাস্টারি',
    ar: 'إتقان برامج مايكروسوفت أوفيس',
  },
  {
    title: 'Studio Setup (Audio & Video)',
    enSub: 'Broadcast Lighting & Acoustics',
    bn: 'স্টুডিও লাইটিং ও সেটআপ',
    ar: 'إعداد الاستوديو والإضاءة الاحترافية',
  },
  {
    title: 'Content Creation & Filmmaking',
    enSub: 'Scriptwriting & Documentary Production',
    bn: 'কন্টেন্ট ক্রিয়েশন ও ফিল্মমেকিং',
    ar: 'صناعة المحتوى والأفلام الوثائقية',
  },
  {
    title: 'Robotics Lab',
    enSub: 'Hardware Electronics & IoT Projects',
    bn: 'রোবটিক্স ও ইলেকট্রনিক্স প্রজেক্ট',
    ar: 'مختبر الروبوتات والإلكترونيات',
  },
];

const SOFT_HARD_SKILL_TRACKS = [
  {
    category: 'Personal Development',
    enSub: 'Mindset, Focus & Holistic Well-Being',
    bn: 'ব্যক্তিগত উন্নয়ন ও মানসিক স্বাস্থ্য',
    ar: 'تطوير الذات والصحة النفسية',
    count: { bn: '১৩টি দক্ষতা', en: '13 Skills', ar: '١٣ مهارة' },
    skills: [
      {
        bn: 'ব্যক্তিগত উন্নয়ন ও প্রোডাক্টিভিটি',
        en: 'Personal Development & Productivity',
        ar: 'تطوير الذات وزيادة الإنتاجية',
      },
      {
        bn: 'টাইম ম্যানেজমেন্ট ও মাল্টিটাস্কিং',
        en: 'Time Management & Multitasking',
        ar: 'إدارة الوقت وتنظيم الأولويات',
      },
      {
        bn: 'ডিপ ফোকাস ও মাইন্ড ট্রেইনিং',
        en: 'Deep Focus & Mind Training',
        ar: 'التركيز العميق وتدريب الذهن',
      },
      {
        bn: 'হ্যাবিট বিল্ডিং ও গোল সেটিং',
        en: 'Habit Building & Goal Setting',
        ar: 'بناء العادات الإيجابية وتحديد الأهداف',
      },
      {
        bn: 'ডিজিটাল ডিটক্স ও মোবাইল আসক্তি সচেতনতা',
        en: 'Digital Detox & Mobile Addiction Awareness',
        ar: 'التوازن الرقمي والوقاية من إدمان الشاشات',
      },
      {
        bn: 'আত্মবিশ্বাস গঠন ও স্ট্রেস ম্যানেজমেন্ট',
        en: 'Confidence Building & Stress Management',
        ar: 'بناء الثقة بالنفس وإدارة الضغوط',
      },
      {
        bn: 'প্রাথমিক স্বাস্থ্যসেবা ও ডায়েট প্ল্যানিং',
        en: 'Primary Health Care & Diet Planning',
        ar: 'الرعاية الصحية الأولية والتغذية السليمة',
      },
    ],
  },
  {
    category: 'Communication & Media',
    enSub: 'Trilingual Oratory & Creative Writing',
    bn: 'যোগাযোগ ও মিডিয়া দক্ষতা',
    ar: 'مهارات التواصل والإعلام',
    count: { bn: '১১টি দক্ষতা', en: '11 Skills', ar: '١١ مهارة' },
    skills: [
      {
        bn: 'বাংলা, ইংরেজি ও আরবি পাবলিক স্পিকিং',
        en: 'Bangla, English & Arabic Public Speaking',
        ar: 'الخطابة باللغات العربية والإنجليزية والبنغالية',
      },
      {
        bn: 'ব্রিটিশ ও আমেরিকান একসেন্ট ট্রেইনিং',
        en: 'British & American Accent Training',
        ar: 'إتقان النطق الصحيح باللغة الإنجليزية',
      },
      {
        bn: 'প্রেজেন্টেশন ও স্টেজ পারফরম্যান্স',
        en: 'Presentation & Stage Performance',
        ar: 'مهارات العرض والإلقاء المسرحي',
      },
      {
        bn: 'বই, প্রবন্ধ, গল্প ও স্ক্রিপ্ট রাইটিং',
        en: 'Book, Essay, Story & Script Writing',
        ar: 'كتابة المقالات والقصص والسيناريو',
      },
      {
        bn: 'সংবাদ উপস্থাপনা ও আবৃত্তি',
        en: 'News Presentation & Recitation',
        ar: 'تقديم الأخبار والإلقاء الصوتي',
      },
    ],
  },
  {
    category: 'Leadership, Safety & Essential Life Skills',
    enSub: 'Teamwork, First Aid & Sunnah Etiquette',
    bn: 'নেতৃত্ব, নিরাপত্তা ও জীবনমুখী দক্ষতা',
    ar: 'القيادة والسلامة والمهارات الحياتية',
    count: { bn: '১৮টি দক্ষতা', en: '18 Skills', ar: '١٨ مهارة' },
    skills: [
      {
        bn: 'লিডারশিপ ও টিম ম্যানেজমেন্ট',
        en: 'Leadership & Team Management',
        ar: 'القيادة وإدارة فرق العمل',
      },
      {
        bn: 'সেফটি, ফার্স্ট এইড ও ফায়ার রেসকিউ ড্রিল',
        en: 'Safety, First Aid & Fire Rescue Drills',
        ar: 'الإسعافات الأولية والتدريب على السلامة',
      },
      {
        bn: 'পারিবারিক ও সামাজিক আদব-কায়দা',
        en: 'Family & Social Etiquette (Adab)',
        ar: 'الآداب الإسلامية والأخلاق الاجتماعية',
      },
      {
        bn: 'ক্রিটিক্যাল থিংকিং ও প্রবলেম সলভিং',
        en: 'Critical Thinking & Problem Solving',
        ar: 'التفكير النقدي وحل المشكلات',
      },
      {
        bn: 'স্বাবলম্বিতা ও দৈনন্দিন সুন্নাহ লাইফস্টাইল',
        en: 'Self-Reliance & Daily Sunnah Lifestyle',
        ar: 'الاعتماد على النفس وتطبيق السنن اليومية',
      },
    ],
  },
  {
    category: 'Business & Entrepreneurship Skills',
    enSub: 'Halal Commerce & Startup Foundations',
    bn: 'বিজনেস মাইন্ডসেট ও উদ্যোক্তা দক্ষতা',
    ar: 'ريادة الأعمال والتجارة الإسلامية',
    count: { bn: '৮টি দক্ষতা', en: '8 Skills', ar: '٨ مهارات' },
    skills: [
      {
        bn: 'ইসলামিক বিজনেস মাইন্ডসেট ও হালাল বাণিজ্য',
        en: 'Islamic Business Mindset & Halal Commerce',
        ar: 'فقه التجارة الإسلامية وريادة الأعمال الحلال',
      },
      {
        bn: 'বিজনেস আইডিয়া জেনারেশন',
        en: 'Business Idea Generation',
        ar: 'ابتكار وتطوير الأفكار التجارية',
      },
      {
        bn: 'উদ্যোক্তা ও স্টার্টআপ বেসিকস',
        en: 'Entrepreneurship & Startup Basics',
        ar: 'أساسيات تأسيس المشاريع الناشئة',
      },
      {
        bn: 'পার্সোনাল ব্র্যান্ডিং ও নেটওয়ার্কিং',
        en: 'Personal Branding & Networking',
        ar: 'بناء الهوية المهنية والعلاقات العامة',
      },
      {
        bn: 'সেলস, নেগোসিয়েশন ও ডিজিটাল মার্কেটিং',
        en: 'Sales, Negotiation & Digital Marketing',
        ar: 'مهارات التفاوض والتسويق الرقمي',
      },
    ],
  },
];

const FEE_CARDS = [
  {
    title: { bn: 'প্লে – কেজি (প্রাথমিক স্তর)', en: 'Play – KG (Foundation)', ar: 'الروضة والتمهيدي' },
    subtitle: 'Official 2027 Fee Guide',
    items: [
      { label: { bn: 'নতুন ভর্তি (পুরাতন ২৪,০০০)', en: 'New Admission (Old 24,000)', ar: 'رسوم القبول الجديد' }, amount: '34,500' },
      { label: { bn: 'মাসিক বেতন (Monthly Tuition)', en: 'Monthly Tuition', ar: 'الرسوم الشهرية' }, amount: '5,000' },
    ],
  },
  {
    title: { bn: '১ম – ৩য় শ্রেণি (ইবতেদায়ী)', en: 'Class 1 – Class 3', ar: 'الصف الأول – الثالث' },
    subtitle: 'Primary Integrated Track',
    items: [
      { label: { bn: 'নতুন ভর্তি (পুরাতন ২৪,০০০)', en: 'New Admission (Old 24,000)', ar: 'رسوم القبول الجديد' }, amount: '34,500' },
      { label: { bn: 'মাসিক বেতন (Monthly Tuition)', en: 'Monthly Tuition', ar: 'الرسوم الشهرية' }, amount: '5,500' },
    ],
  },
  {
    title: { bn: '৪র্থ – ৫ম শ্রেণি', en: 'Class 4 – Class 5', ar: 'الصف الرابع – الخامس' },
    subtitle: 'Upper Primary + IT Lab',
    items: [
      { label: { bn: 'নতুন ভর্তি (পুরাতন ২৪,০০০)', en: 'New Admission (Old 24,000)', ar: 'رسوم القبول الجديد' }, amount: '34,500' },
      { label: { bn: 'মাসিক বেতন (Monthly Tuition)', en: 'Monthly Tuition', ar: 'الرسوم الشهرية' }, amount: '6,000' },
    ],
  },
  {
    title: { bn: '৬ষ্ঠ – ১০ম শ্রেণি (দাখিল)', en: 'Class 6 – Class 10 (Dakhil)', ar: 'الصف السادس – العاشر' },
    subtitle: 'Secondary + Science/ICT Lab (+2,000)',
    items: [
      { label: { bn: 'নতুন ভর্তি + ল্যাব (৩৪,৫০০+২,০০০)', en: 'New Admission + Lab', ar: 'القبول + رسوم المختبر' }, amount: '36,500' },
      { label: { bn: 'মাসিক বেতন (৬ষ্ঠ-৮ম: ৬,৫০০ | ৯ম-১০ম: ৭,০০০)', en: 'Monthly Tuition (6-8 / 9-10)', ar: 'الرسوم الشهرية' }, amount: '6,500–7,000' },
    ],
  },
  {
    title: { bn: 'হিফজুল কুরআন বিভাগ', en: 'Tahfizul Quran Department', ar: 'قسم تحفيظ القرآن الكريم' },
    subtitle: 'Noorani, Nazera, Hifz & Shunani',
    items: [
      { label: { bn: 'নতুন ভর্তি (পুরাতন ২৪,০০০)', en: 'New Admission (Old 24,000)', ar: 'رسوم القبول الجديد' }, amount: '34,500' },
      { label: { bn: 'মাসিক বেতন (Monthly Fee)', en: 'Monthly Tuition', ar: 'الرسوم الشهرية' }, amount: '5,500' },
    ],
  },
  {
    title: { bn: 'আবাসিক ও ডে-কেয়ার সার্ভিস', en: 'Hostel & Day-Care Services (2027)', ar: 'خدمات السكن والرعاية النهارية' },
    subtitle: 'First-time Seat Setup: +৳18,500',
    items: [
      { label: { bn: 'আবাসিক হোস্টেল (৩ বেলা খাবার ও তত্ত্বাবধান)', en: 'Hostel Full-Board / Month', ar: 'السكن الداخلي الشامل' }, amount: '14,500' },
      { label: { bn: 'ডে-কেয়ার ব্যবস্থা (সকাল ৭টা – রাত ৮:৩০)', en: 'Full Day-Care / Month', ar: 'الرعاية النهارية الشاملة' }, amount: '12,500' },
    ],
  },
];

const ACTIVITIES_LIST = [
  {
    title: { bn: 'মাহারাত বিজ্ঞান মেলা ও প্রযুক্তি প্রদর্শনী', en: 'Maharat Science Fair & Technology Exhibition', ar: 'معرض المهارات للعلوم والتقنية' },
    desc: {
      bn: 'মাহারাত মডেল মাদ্রাসার শিক্ষার্থীদের উদ্ভাবনী বিজ্ঞান প্রজেক্ট, রোবটিক্স ও প্রযুক্তিনির্ভর মডেল প্রদর্শনের বার্ষিক আয়োজন।',
      en: 'Annual showcase of student-built scientific models, robotics, and innovative technology projects.',
      ar: 'معرض سنوي لمشاريع الطلاب العلمية والروبوتات والابتكارات التقنية.',
    },
  },
  {
    title: { bn: 'বার্ষিক ফল উৎসব ও আনন্দ মেলা (Fruits Fair)', en: 'Annual Indigenous Fruits Festival', ar: 'مهرجان الفواكه السنوي' },
    desc: {
      bn: 'দেশীয় ফলের সাথে পরিচয় ও আল্লাহর নেয়ামতের শুকরিয়া আদায়ে শিক্ষার্থীদের অংশগ্রহণে বর্ণাঢ্য ফল উৎসব।',
      en: 'Colorful seasonal fruit festival teaching gratitude for Allah’s blessings and healthy nutrition.',
      ar: 'مهرجان تعليمي بهيج لتعريف الطلاب بالفواكه المحلية وشكر نعم الله.',
    },
  },
  {
    title: { bn: 'মাহারাত স্টুডেন্ট কাউন্সিল ও নেতৃত্ব প্রশিক্ষণ', en: 'Maharat Student Council & Leadership', ar: 'مجلس طلاب المهارات والقيادة' },
    desc: {
      bn: 'শিক্ষার্থীদের মাঝে দায়িত্ববোধ, শৃঙ্খলা ও নেতৃত্বের গুণাবলী বিকাশে নির্বাচিত স্টুডেন্ট কাউন্সিল কার্যক্রম।',
      en: 'Elected Student Council fostering leadership, discipline, and organizational responsibility.',
      ar: 'مجلس طلابي منتخب لتنمية روح القيادة والمسؤولية والانضباط.',
    },
  },
  {
    title: { bn: 'দেয়ালিকা, সাহিত্য চর্চা ও ত্রৈমাসিক ম্যাগাজিন', en: 'Wall Magazine & Quarterly Literary Publication', ar: 'المجلة الحائطية والفصلية الأدبية' },
    desc: {
      bn: 'বাংলা, ইংরেজি ও আরবি ভাষায় শিক্ষার্থীদের লেখা ছড়া, প্রবন্ধ, ক্যালিগ্রাফি নিয়ে দেয়ালিকা ও ত্রৈমাসিক ম্যাগাজিন প্রকাশ।',
      en: 'Trilingual wall magazines and quarterly publications featuring student essays, poetry, and calligraphy.',
      ar: 'إصدار مجلات حائطية وفصلية باللغات الثلاث تتضمن إبداعات الطلاب والخط العربي.',
    },
  },
  {
    title: { bn: 'আন্তর্জাতিক মানের হিফজ ও ক্বিরাত প্রতিযোগিতা', en: 'Tahfizul Quran & Qira’at Competition', ar: 'مسابقة تحفيظ القرآن والقراءات' },
    desc: {
      bn: 'মিশরের আল-আজহার ও দেশবরেণ্য ক্বারীদের উপস্থিতিতে তিলাওয়াত, হিফজুল কুরআন ও সিরাত অলিম্পিয়াড আয়োজন।',
      en: 'Recitation, Tahfiz, and Seerah Olympiads judged by Al-Azhar scholars and renowned Qaris.',
      ar: 'مسابقات في التلاوة والحفظ والسيرة النبوية بحضور علماء الأزهر والقراء المجازين.',
    },
  },
  {
    title: { bn: 'বার্ষিক শিক্ষা সফর ও ক্রীড়া প্রতিযোগিতা', en: 'Annual Study Tour & Sports Championship', ar: 'الرحلة العلمية والمهرجان الرياضي' },
    desc: {
      bn: 'শারীরিক সুস্থতা ও বাস্তব জ্ঞান অর্জনের লক্ষ্যে প্রতি বছর শিক্ষণীয় স্থানে শিক্ষা সফর ও বার্ষিক ক্রীড়া প্রতিযোগিতা।',
      en: 'Guided educational excursions to historical landmarks and annual outdoor sports championships.',
      ar: 'رحلات علمية سنوية ومسابقات رياضية لبناء اللياقة البدنية والمعرفة الميدانية.',
    },
  },
  {
    title: { bn: 'অভিভাবক সমাবেশ ও তারবিয়াহ সেমিনার', en: 'Parent-Teacher Tarbiyah Seminars', ar: 'ملتقى أولياء الأمور والندوات التربوية' },
    desc: {
      bn: 'সন্তানের পড়াশোনা ও চরিত্র গঠনে শিক্ষক-অভিভাবক সমন্বিত প্রচেষ্টার লক্ষ্যে নিয়মিত মতবিনিময় ও প্যারেন্টিং সেমিনার।',
      en: 'Regular interactive parenting seminars and progress meetings between guardians and faculty.',
      ar: 'لقاءات دورية وندوات تربوية بين الأسرة وإدارة المدرسة لمتابعة تقدم كل طالب.',
    },
  },
];

const SPECIALTIES_LIST = [
  {
    bn: '১. কুরআন-সুন্নাহর মৌলিক জ্ঞান ও আধুনিক জ্ঞান-বিজ্ঞানের (৫০/৫০) অপূর্ব সমন্বয়।',
    en: '1. Harmonious 50/50 integration of foundational Quran-Sunnah scholarship and modern sciences.',
    ar: '١. تكامل متوازن (٥٠/٥٠) بين علوم القرآن والسنة والعلوم الأكاديمية الحديثة.',
  },
  {
    bn: '২. মাদরাসা শিক্ষাবোর্ডের পাশাপাশি জাতীয় শিক্ষাক্রম (NCTB) ও ব্রিটিশ কারিকুলামের সমন্বয়।',
    en: '2. Synergy of Bangladesh Madrasah Education Board, NCTB National Curriculum, and British English standards.',
    ar: '٢. الجمع بين منهج هيئة التعليم الديني والمنهج الوطني (NCTB) ومعايير اللغة الإنجليزية البريطانية.',
  },
  {
    bn: '৩. তাজবীদ ভিত্তিক বিশুদ্ধ ও মার্জিত উচ্চারণে কুরআনুল কারীম তিলাওয়াত ও হিফজ।',
    en: '3. Authentic Tajweed-based Quran recitation and structured Tahfizul Quran program.',
    ar: '٣. تلاوة القرآن الكريم وحفظه بالتجويد المتقن ومخارج الحروف الصحيحة.',
  },
  {
    bn: '৪. ১ম শ্রেণি থেকেই আরবি ও ইংরেজি ভাষায় কথোপকথনের (Spoken) বিশেষ গুরুত্ব।',
    en: '4. Intensive Spoken Arabic and Spoken English conversation practice starting from Grade 1.',
    ar: '٤. عناية خاصة بالمحادثة باللغتين العربية والإنجليزية منذ الصف الأول الابتدائي.',
  },
  {
    bn: '৫. প্রখ্যাত শিক্ষাবিদ, আল-আজহার ও মদিনা বিশ্ববিদ্যালয়ের গ্র্যাজুয়েটদের তত্ত্বাবধানে পরিচালিত।',
    en: '5. Guided by renowned academicians and graduates from Al-Azhar (Egypt) and Madinah Islamic University.',
    ar: '٥. إشراف نخبة من الأكاديميين وخريجي جامعة الأزهر الشريف والجامعة الإسلامية بالمدينة المنورة.',
  },
  {
    bn: '৬. দক্ষ, অভিজ্ঞ ও প্রশিক্ষণপ্রাপ্ত শিক্ষক-শিক্ষিকা দ্বারা পাঠদান।',
    en: '6. Dedicated, highly trained, and experienced male and female faculty members.',
    ar: '٦. نخبة من المعلمين والمعلمات ذوي الخبرة والكفاءة التربوية العالية.',
  },
  {
    bn: '৭. মাল্টিমিডিয়া ও শীতাতপ নিয়ন্ত্রিত (AC) আধুনিক ও মনোরম শ্রেণিকক্ষ।',
    en: '7. Air-conditioned (AC), multimedia-equipped smart classrooms in Uttara Sector 13.',
    ar: '٧. فصول دراسية حديثة ومكيفة ومجهزة بوسائل العرض الذكية.',
  },
  {
    bn: '৮. আধুনিক কম্পিউটার ল্যাব, বিজ্ঞান গবেষণাগার ও সমৃদ্ধ লাইব্রেরি।',
    en: '8. Modern Computer & IT Lab, Science Laboratory, and rich Islamic & general library.',
    ar: '٨. مختبر حاسوب حديث، ومعمل علوم متكامل، ومكتبة ثرية.',
  },
  {
    bn: '৯. বালক ও বালিকাদের জন্য সম্পূর্ণ পৃথক ও নিরাপদ ক্যাম্পাস/শাখা।',
    en: '9. Completely separate, secure, and Islamic environment for Boys and Girls.',
    ar: '٩. بيئة تعليمية منفصلة وآمنة تماماً للبنين والبنات.',
  },
  {
    bn: '১০. ক্লাসের পড়া ক্লাসেই সম্পন্ন করা হয় (বাসায় প্রাইভেট টিউটরের প্রয়োজন হয় না)।',
    en: '10. Complete in-class lesson mastery — eliminating the need for home private tutors.',
    ar: '١٠. إتمام استيعاب الدروس داخل الفصل بالكامل دون الحاجة لدروس خصوصية.',
  },
  {
    bn: '১১. অপেক্ষাকৃত দুর্বল ও অমনোযোগী শিক্ষার্থীদের জন্য নিবিড় পরিচর্যা (Extra Care)।',
    en: '11. Dedicated remedial care and individualized academic counseling for slower learners.',
    ar: '١١. رعاية فردية ومتابعة خاصة للطلاب الذين يحتاجون إلى دعم إضافي.',
  },
  {
    bn: '১২. প্রতি শ্রেণিতে শিক্ষার্থী সংখ্যা সীমিত (সর্বোচ্চ ২০–২৫ জন)।',
    en: '12. Optimal student-teacher ratio with limited seats (20–25 students per section).',
    ar: '١٢. عدد محدود من الطلاب في كل فصل (٢٠–٢٥ طالباً) لضمان جودة التعليم.',
  },
  {
    bn: '১৩. কর্মব্যস্ত অভিভাবকদের সন্তানদের জন্য মানসম্মত হিফজ ও একাডেমিক ডে-কেয়ার এবং আবাসিক ব্যবস্থা।',
    en: '13. Full-Day Care (7:00 AM – 8:30 PM) and Residential facilities tailored for working parents.',
    ar: '١٣. نظام رعاية نهارية متكامل وسكن داخلي متميز لأبناء أولياء الأمور العاملين.',
  },
  {
    bn: '১৪. উত্তরা ও মিরপুর রুটে মাদ্রাসার নিজস্ব পরিবহন (মাইক্রোবাস) সুবিধা।',
    en: '14. Institution’s own microbus transport network across Uttara and Mirpur routes.',
    ar: '١٤. خدمة نقل مدرسي خاصة بالحافلات تغطي مسارات أوتارا وميربور.',
  },
  {
    bn: '১৫. সিসি ক্যামেরা দ্বারা সার্বক্ষণিক পর্যবেক্ষণ ও নিশ্ছিদ্র নিরাপত্তা ব্যবস্থা।',
    en: '15. 24/7 CCTV surveillance and strict campus security management.',
    ar: '١٥. مراقبة بالكاميرات على مدار الساعة ونظام أمني متكامل.',
  },
  {
    bn: '১৬. সুন্নাহ সম্মত জীবনযাপন, আদব-আখলাক ও নামাজের ব্যবহারিক প্রশিক্ষণ।',
    en: '16. Practical training in Salah, daily Masnoon Duas, and Prophetic character (Tarbiyah).',
    ar: '١٦. تدريب عملي يومي على الصلاة والأدعية المأثورة والآداب الإسلامية.',
  },
  {
    bn: '১৭. বিতর্ক, আবৃত্তি, ক্যালিগ্রাফি, দেয়ালিকা, বিজ্ঞান মেলা ও স্টুডেন্ট কাউন্সিলের মতো সমৃদ্ধ সহশিক্ষা কার্যক্রম।',
    en: '17. Rich co-curricular clubs: Debate, Calligraphy, Wall Magazine, Science Fair, and Student Council.',
    ar: '١٧. أنشطة لا صفية ثرية تشمل الخط العربي، المناظرات، معرض العلوم، ومجلس الطلاب.',
  },
];

const FAQ_DATA = [
  {
    category: { bn: 'ভর্তি ও ফি', en: 'Admission & Fees', ar: 'القبول والرسوم' },
    q: {
      bn: '২০২৭ শিক্ষাবর্ষে কোন কোন শ্রেণিতে ও বিভাগে ভর্তি চলছে?',
      en: 'Which grades and departments are open for admission in the 2027 session?',
      ar: 'ما هي الصفوف والأقسام المتاحة للقبول في العام الدراسي ٢٠٢٧؟',
    },
    a: {
      bn: 'জেনারেল (একাডেমিক) বিভাগে প্রি-ওয়ান (নার্সারি) থেকে দশম শ্রেণি পর্যন্ত এবং হিফজুল কুরআন বিভাগে নূরানী, নাযেরা, হিফয ও শুনানী শাখায় ভর্তি চলছে।',
      en: 'Admissions are open from Pre-One (Nursery) to Grade 10 in the Academic Department, and in Noorani, Nazera, Hifz, and Shunani tracks in the Hifzul Quran Department.',
      ar: 'التسجيل متاح من مرحلة الروضة حتى الصف العاشر في القسم الأكاديمي، وفي مراحل النورانية والناظرة والحفظ والتسميع في قسم القرآن الكريم.',
    },
  },
  {
    category: { bn: 'ভর্তি ও ফি', en: 'Admission & Fees', ar: 'القبول والرسوم' },
    q: {
      bn: 'অগ্রিম ভর্তিতে কী কী বিশেষ ডিসকাউন্ট সুবিধা রয়েছে?',
      en: 'What special discounts are available for early admission?',
      ar: 'ما هي الخصومات الخاصة المتاحة للتسجيل المبكر؟',
    },
    a: {
      bn: 'অগ্রিম ভর্তিতে ২৫% ছাড়, প্রথম ১০০ জনের জন্য স্পেশাল ১০% ডিসকাউন্ট এবং এককালীন পরিশোধে এক্সট্রা ৫% ডিসকাউন্ট সুবিধা রয়েছে। আমাদের ইন্টারঅ্যাক্টিভ ফি ক্যালকুলেটরে ক্লিক করে আপনি আপনার সন্তানের সঠিক হিসাব ও A4 পিডিএফ ডাউনলোড করতে পারবেন।',
      en: 'We offer a 25% Early Bird discount, 10% Special discount for the first 100 students, and an extra 5% concession, plus Sibling discounts. Use our Interactive Fee Calculator to download an official A4 PDF estimate.',
      ar: 'نوفر خصم ٢٥٪ للتسجيل المبكر، و١٠٪ لأول ١٠٠ طالب، و٥٪ إضافية، بالإضافة إلى خصم الأشقاء. يمكنك استخدام حاسبة الرسوم التفاعلية لتحميل كشف A4 الرسمي.',
    },
  },
  {
    category: { bn: 'একাডেমিক ও কারিকুলাম', en: 'Academic & Curriculum', ar: 'المنهج والدراسة' },
    q: {
      bn: 'সন্তানের জন্য বাসায় আলাদা প্রাইভেট টিউটর রাখার প্রয়োজন হবে কি?',
      en: 'Will my child need a separate private tutor at home?',
      ar: 'هل سيحتاج الطالب إلى مدرس خصوصي في المنزل؟',
    },
    a: {
      bn: 'না, আমাদের বিশেষত্ব হলো ক্লাসের পড়া ক্লাসেই আদায় করা হয়। অভিজ্ঞ শিক্ষকদের তত্ত্বাবধানে শ্রেণিকক্ষেই প্রতিদিনের পাঠ সম্পন্ন করা হয়।',
      en: 'No. Our signature methodology ensures all daily lessons and revisions are completed inside the classroom under faculty supervision.',
      ar: 'لا، حيث يتميز منهجنا بإنجاز كافة الدروس والمراجعات داخل الفصل تحت إشراف المعلمين المتخصصين.',
    },
  },
  {
    category: { bn: 'একাডেমিক ও কারিকুলাম', en: 'Academic & Curriculum', ar: 'المنهج والدراسة' },
    q: {
      bn: 'জেনারেল শিক্ষার পাশাপাশি আইটি ও ভাষা শিক্ষার ব্যবস্থা কেমন?',
      en: 'How are IT skills and trilingual fluency integrated alongside general academics?',
      ar: 'كيف يتم دمج مهارات الحاسوب واللغات الثلاث مع الدراسة الأكاديمية؟',
    },
    a: {
      bn: 'প্রত্যেক শিক্ষার্থীকে প্রমিত বাংলা, ব্রিটিশ/আমেরিকান একসেন্টে ইংরেজি এবং সাবলীল আরবি ভাষার পাশাপাশি ১২টি আধুনিক আইটি স্কিলস ও ৫০+ সফট স্কিলস হাতে-কলমে শেখানো হয়।',
      en: 'Every student receives practical lab training in 12 IT tracks, 50+ Soft & Business skills, and spoken fluency in Bengali, English, and Arabic.',
      ar: 'يتدرب كل طالب عملياً على ١٢ مساراً تقنياً وأكثر من ٥٠ مهارة حياتية مع إتقان اللغات الثلاث: العربية والإنجليزية والبنغالية.',
    },
  },
  {
    category: { bn: 'আবাসন ও নিরাপত্তা', en: 'Care & Transport', ar: 'الرعاية والنقل' },
    q: {
      bn: 'আবাসিক, ডে-কেয়ার এবং নিজস্ব পরিবহন ব্যবস্থা কীভাবে পরিচালিত হয়?',
      en: 'How are Residential, Day-Care, and Own Transport facilities managed?',
      ar: 'كيف تُدار خدمات السكن الداخلي والرعاية النهارية والنقل المدرسي؟',
    },
    a: {
      bn: 'আমাদের রয়েছে সম্পূর্ণ সিসিটিভি নিয়ন্ত্রিত নিরাপদ ক্যাম্পাস, পুষ্টিকর খাবারসহ আবাসিক ও হিফজ ডে-কেয়ার ব্যবস্থা (সকাল ৭টা – রাত ৮:৩০) এবং উত্তরা ও মিরপুর রুটে নিজস্ব মাইক্রোবাস ও পরিবহন সার্ভিস।',
      en: 'We operate a 24/7 CCTV-secured campus with full-board Residential care, Hifz Day-Care (7:00 AM – 8:30 PM), and our own microbus fleet across Uttara and Mirpur routes.',
      ar: 'نوفر حرماً آمناً مراقباً بالكاميرات مع سكن داخلي متكامل، ورعاية نهارية من ٧:٠٠ صباحاً حتى ٨:٣٠ مساءً، وحافلات خاصة تغطي مسارات أوتارا وميربور.',
    },
  },
];

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({ onOpenAdmin }) => {
  const { state, currentUser, submitInquiry, language, t, pushToast } = useCMS();
  const {
    settings,
    news,
    notices,
    courses,
    popupConfig,
    campusVideo,
    departmentVideos,
    activityVideos,
    guardianReels,
  } = state;

  // Multi-Page URL Router State synced with browser location
  const [currentPage, setCurrentPage] = useState<PublicPageId>(() =>
    typeof window !== 'undefined' ? resolvePageFromPath(window.location.pathname) : 'home'
  );

  // Desktop Header Dropdown Open State
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  // Mobile Drawer Accordion Group Open State
  const [openMobileGroupId, setOpenMobileGroupId] = useState<string | null>('curriculum-group');
  // Release Notes Modal & Public QR Certificate Verification Modal
  const [isReleaseNotesOpen, setIsReleaseNotesOpen] = useState(false);
  const [verifyCertCode, setVerifyCertCode] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('verify-cert');
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(resolvePageFromPath(window.location.pathname));
      const params = new URLSearchParams(window.location.search);
      setVerifyCertCode(params.get('verify-cert'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleCloseVerifyCert = () => {
    setVerifyCertCode(null);
    if (typeof window !== 'undefined' && window.location.search.includes('verify-cert')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('verify-cert');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  const navigateToPage = (page: PublicPageId) => {
    const targetPath = PAGE_PATH_MAP[page] || '/';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ page }, '', targetPath);
    }
    setCurrentPage(page);
    setOpenDropdownId(null);
    setIsMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToQuickRegistration = () => {
    setOpenDropdownId(null);
    setIsMobileNavOpen(false);
    if (currentPage !== 'home') {
      const targetPath = PAGE_PATH_MAP.home || '/';
      if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
        window.history.pushState({ page: 'home' }, '', targetPath);
      }
      setCurrentPage('home');
      setTimeout(() => {
        document.getElementById('quick-registration')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    } else {
      document.getElementById('quick-registration')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Department mode toggle in top bar & hero ('Academic' | 'Hifz')
  const [heroDepartmentMode, setHeroDepartmentMode] = useState<'Academic' | 'Hifz'>('Academic');

  // Activity video filter ('All' | 'Academic' | 'Hifz')
  const [activityDeptFilter, setActivityDeptFilter] = useState<'All' | 'Academic' | 'Hifz'>('All');

  // Guardian Reviews horizontal reel scroller ref & auto-scroll state
  const guardianScrollRef = React.useRef<HTMLDivElement>(null);
  const [isGuardianAutoScrolling, setIsGuardianAutoScrolling] = useState<boolean>(true);

  // Apple-grade Cinema Video Player Modal state
  const [playingVideoModal, setPlayingVideoModal] = useState<CinemaVideoModalItem | null>(null);

  // Apple-grade Studio Photo Lightbox Modal state
  const [framedPhotoModal, setFramedPhotoModal] = useState<{
    current: FramedPhotoModalData;
    list: FramedPhotoModalData[];
    index: number;
  } | null>(null);

  const handleOpenFramedPhoto = (
    photo: FramedPhotoModalData,
    allPhotos?: FramedPhotoModalData[]
  ) => {
    const list = allPhotos && allPhotos.length > 0 ? allPhotos : [photo];
    const foundIdx = list.findIndex(
      (item) => (item.id && item.id === photo.id) || item.imageUrl === photo.imageUrl
    );
    setFramedPhotoModal({
      current: photo,
      list,
      index: foundIdx >= 0 ? foundIdx : 0,
    });
  };

  const navigateFramedPhoto = (direction: 'prev' | 'next') => {
    if (!framedPhotoModal || framedPhotoModal.list.length <= 1) return;
    const total = framedPhotoModal.list.length;
    const nextIdx =
      direction === 'next'
        ? (framedPhotoModal.index + 1) % total
        : (framedPhotoModal.index - 1 + total) % total;
    setFramedPhotoModal({
      ...framedPhotoModal,
      current: framedPhotoModal.list[nextIdx],
      index: nextIdx,
    });
  };

  // Mobile navigation drawer toggle
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Promotional popup modal state
  const [isPromoPopupOpen, setIsPromoPopupOpen] = useState<boolean>(false);

  // Filter states
  const [selectedNoticeCategory, setSelectedNoticeCategory] = useState<'All' | NoticeCategory>('All');
  const [noticeSearch, setNoticeSearch] = useState('');
  const [selectedCourseCategory, setSelectedCourseCategory] = useState<'All' | CourseCategory>('All');
  const [expandedSoftTrack, setExpandedSoftTrack] = useState<number>(0);
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('ALL');
  const [openFaqIndex, setOpenFaqIndex] = useState<number>(0);

  // Modals
  const [activeNoticeModal, setActiveNoticeModal] = useState<NoticeItem | null>(null);
  const [activeCourseModal, setActiveCourseModal] = useState<CourseItem | null>(null);
  const [activeEventModal, setActiveEventModal] = useState<EventItem | null>(null);
  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [preselectedAdmissionCourseId, setPreselectedAdmissionCourseId] = useState<string | undefined>(
    undefined
  );

  // Auto-scroll effect for Guardian Reviews Reels
  useEffect(() => {
    if (!isGuardianAutoScrolling || playingVideoModal) return;
    const interval = window.setInterval(() => {
      const el = guardianScrollRef.current;
      if (!el) return;
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 260, behavior: 'smooth' });
      }
    }, 3400);
    return () => window.clearInterval(interval);
  }, [isGuardianAutoScrolling, playingVideoModal]);

  const scrollGuardianReels = (direction: 'prev' | 'next') => {
    const el = guardianScrollRef.current;
    if (!el) return;
    const offset = direction === 'next' ? 280 : -280;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  // Quick Inquiry Form state
  const [inqName, setInqName] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqCourseId, setInqCourseId] = useState(courses[0]?.id || '');
  const [inqMessage, setInqMessage] = useState('');
  const [inqError, setInqError] = useState('');
  const [inqSuccess, setInqSuccess] = useState<string | null>(null);

  // Open promotional popup automatically once per session on Home page if enabled in Admin Dashboard
  useEffect(() => {
    if (popupConfig?.enabled && currentPage === 'home') {
      try {
        if (window.sessionStorage.getItem('maharat_promo_seen') === '1') return;
      } catch {
        // ignore storage errors
      }
      const timer = window.setTimeout(() => {
        setIsPromoPopupOpen(true);
        try {
          window.sessionStorage.setItem('maharat_promo_seen', '1');
        } catch {
          // ignore
        }
      }, 450);
      return () => window.clearTimeout(timer);
    }
  }, [popupConfig?.enabled, currentPage]);

  // Top bar live countdown timer synced with popupConfig
  const [topTimerSec, setTopTimerSec] = useState<number>(() => {
    const d = popupConfig?.countdownDays ?? 0;
    const h = popupConfig?.countdownHours ?? 2;
    const m = popupConfig?.countdownMinutes ?? 59;
    const s = popupConfig?.countdownSeconds ?? 14;
    return d * 86400 + h * 3600 + m * 60 + s;
  });

  useEffect(() => {
    const d = popupConfig?.countdownDays ?? 0;
    const h = popupConfig?.countdownHours ?? 2;
    const m = popupConfig?.countdownMinutes ?? 59;
    const s = popupConfig?.countdownSeconds ?? 14;
    setTopTimerSec(d * 86400 + h * 3600 + m * 60 + s);
  }, [
    popupConfig?.countdownDays,
    popupConfig?.countdownHours,
    popupConfig?.countdownMinutes,
    popupConfig?.countdownSeconds,
  ]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTopTimerSec((prev) => (prev > 0 ? prev - 1 : 10754));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const topDays = Math.floor(topTimerSec / 86400);
  const topHours = Math.floor((topTimerSec % 86400) / 3600);
  const topMinutes = Math.floor((topTimerSec % 3600) / 60);
  const topSeconds = topTimerSec % 60;

  const activeNewsItems = news.filter((n) => n.active);
  const filteredNotices = filterNotices(notices, selectedNoticeCategory, noticeSearch);
  const filteredCourses =
    selectedCourseCategory === 'All'
      ? courses
      : courses.filter((c) => c.category === selectedCourseCategory);

  const filteredFaqs =
    selectedFaqCategory === 'ALL'
      ? FAQ_DATA
      : FAQ_DATA.filter((item) => item.category.en === selectedFaqCategory);

  const handleOpenAdmissionWithCourse = (courseId?: string) => {
    setPreselectedAdmissionCourseId(courseId);
    setIsAdmissionModalOpen(true);
  };

  const handleQuickInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateInquiryInput(
      {
        name: inqName,
        phone: inqPhone,
        email: inqEmail,
        courseId: inqCourseId || courses[0]?.id || 'course-prep-2',
      },
      language
    );

    if (!validation.valid) {
      setInqError(
        validation.error ||
          (language === 'bn'
            ? 'অনুগ্রহ করে সকল আবশ্যক ঘর সঠিকভাবে পূরণ করুন।'
            : language === 'ar'
              ? 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح.'
              : 'Please check all required fields.')
      );
      setInqSuccess(null);
      return;
    }

    setInqError('');
    const emailDispatched = submitInquiry({
      name: inqName.trim(),
      phone: inqPhone.trim(),
      email: inqEmail.trim(),
      courseId: inqCourseId || courses[0]?.id || 'course-prep-2',
      message: inqMessage.trim() || 'Submitted via Public Website Online Admission & Inquiry Form.',
      source: 'Quick Inquiry',
    });

    setInqSuccess(
      language === 'bn'
        ? `ধন্যবাদ ${inqName}! আপনার আবেদনটি গৃহীত হয়েছে এবং এডমিনের ইমেইলে (${emailDispatched.recipientEmail}) স্বয়ংক্রিয় নোটিফিকেশন পাঠানো হয়েছে।`
        : language === 'ar'
          ? `شكراً لك ${inqName}! تم استلام طلبك بنجاح وإرسال إشعار للإدارة (${emailDispatched.recipientEmail}).`
          : `Thank you ${inqName}! Your inquiry has been received and dispatched to ${emailDispatched.recipientEmail}.`
    );
    setInqName('');
    setInqPhone('');
    setInqEmail('');
    setInqMessage('');
  };

  // Page-level localized copy for headers, cards & buttons
  const pageCopy = {
    bn: {
      backToHome: 'হোম পেজে ফিরে যান',
      exploreSectionsTitle: 'আমাদের একাডেমিক ও ক্যাম্পাস পোর্টাল এক্সপ্লোর করুন',
      exploreSectionsSub:
        'হোম পেজকে পরিচ্ছন্ন রাখতে প্রতিটি বিস্তারিত বিভাগ আলাদা পেজে সাজানো হয়েছে। নিচের যেকোনো কার্ডে বা উপরের ড্রপডাউন মেনুতে ক্লিক করে বিস্তারিত দেখুন।',
      viewDetailsBtn: 'বিস্তারিত পেজ দেখুন',
      watchCampusVideo: 'ক্লিক করে ক্যাম্পাস ভিডিওটি দেখুন',
      watchDeptVideo: 'বিভাগের ভিডিও দেখুন',
      applyBtn: 'ভর্তি আবেদন',
      whyChooseBadge: 'Why Choose Us',
      guardianReelsBadge: 'অভিভাবকদের মতামত ও ভিডিও রিভিউ',
      guardianReelsTitle: 'অভিভাবকদের ভিডিও রিভিউ',
      guardianReelsSub:
        'সন্তানদের পড়াশোনা, আমলি পরিবর্তন ও সার্বিক যত্ন নিয়ে সম্মানিত অভিভাবকদের বাস্তব অনুভূতি (যেকোনো রিলসে ক্লিক করে সরাসরি শুনুন)',
      autoScrollOn: 'অটো-স্ক্রল চালু',
      autoScrollOff: 'অটো-স্ক্রল বন্ধ',
      playVideo: 'ভিডিও প্লে করুন',
      videoComingSoon: 'ভিডিও শীঘ্রই যুক্ত হবে',
      viewAllReviewsBtn: 'সকল রিভিউ ও প্রশ্নোত্তর দেখুন',
      calcTotalWithDiscount: 'ছাড়সহ টোটাল খরচ হিসাব করুন',
      classesBadge: 'Academic Classes & Integrated Syllabus',
      classesTitle: 'একাডেমিক শ্রেণি ও বিষয়ভিত্তিক পাঠ্যক্রম',
      classesSub:
        'যেকোনো শ্রেণি বা বিভাগের ওপর ক্লিক করে বিস্তারিত বিষয়ভিত্তিক পাঠ্যক্রম (Subject-Wise Syllabus), বার্ষিক পিরিয়ড এবং অধ্যায়সমূহ দেখে নিন।',
      allDepts: 'সকল বিভাগ',
      academicClasses: 'একাডেমিক শ্রেণি',
      hifzDept: 'হিফজুল কুরআন',
      annualPeriods: 'বার্ষিক পিরিয়ড:',
      subjectsCount: 'পাঠ্যবিষয়:',
      monthlyFeeLabel: 'মাসিক বেতন / টিউশন ফি',
      admissionFeeLabel: 'ভর্তি ফি',
      viewSyllabusBtn: 'পাঠ্যক্রম ও সিলেবাস দেখুন',
      aboutQuote: '“আমরা শুধুমাত্র শিক্ষার্থী তৈরি করি না, আমরা মানবিক মূল্যবোধ সম্পন্ন আলোকিত মানুষ গড়ি।”',
      faqBadge: 'সচরাচর জিজ্ঞাসিত প্রশ্নাবলী',
      faqTitle: 'FAQS (অভিভাবকদের সাধারণ জিজ্ঞাসা)',
      allFaq: 'সকল',
      readFullNotice: 'বিস্তারিত পড়ুন',
      noNotices: 'কোনো নোটিশ পাওয়া যায়নি। অন্য ক্যাটাগরি নির্বাচন করুন।',
    },
    en: {
      backToHome: 'Back to Home Page',
      exploreSectionsTitle: 'Explore Our Academic & Campus Portal',
      exploreSectionsSub:
        'Each specialized department, 50/50 methodology, 10-year roadmap, day-care routine, and transport network is organized on its own dedicated page.',
      viewDetailsBtn: 'Open Dedicated Page',
      watchCampusVideo: 'Click to Watch Campus Documentary',
      watchDeptVideo: 'Watch Department Video',
      applyBtn: 'Apply Now',
      whyChooseBadge: 'Why Choose Us',
      guardianReelsBadge: 'Parent Testimonials & Video Reviews',
      guardianReelsTitle: 'GUARDIAN VIDEO REVIEWS',
      guardianReelsSub:
        'Listen to real stories from respected parents regarding their children’s academic progress, Hifz mastery, and moral transformation.',
      autoScrollOn: 'Auto-Scroll On',
      autoScrollOff: 'Auto-Scroll Paused',
      playVideo: 'Play Video',
      videoComingSoon: 'Video Coming Soon',
      viewAllReviewsBtn: 'View All Reviews & FAQs',
      calcTotalWithDiscount: 'Calculate Total Fee with Discounts',
      classesBadge: 'Academic Classes & Integrated Syllabus',
      classesTitle: 'Academic Grades & Subject-Wise Syllabus',
      classesSub:
        'Click on any grade or department below to inspect the complete subject-wise syllabus, annual lecture count, and module breakdown.',
      allDepts: 'All Tracks',
      academicClasses: 'Academic Grades',
      hifzDept: 'Tahfizul Quran',
      annualPeriods: 'Annual Classes:',
      subjectsCount: 'Modules:',
      monthlyFeeLabel: 'Monthly Tuition Fee',
      admissionFeeLabel: 'Admission Fee',
      viewSyllabusBtn: 'View Syllabus & Modules',
      aboutQuote: '“We do not merely produce students; we nurture enlightened human beings with moral excellence.”',
      faqBadge: 'Frequently Asked Questions',
      faqTitle: 'GUARDIAN FAQs & ADMISSION GUIDE',
      allFaq: 'All Topics',
      readFullNotice: 'Read Full Notice',
      noNotices: 'No notices found in this category.',
    },
    ar: {
      backToHome: 'العودة إلى الصفحة الرئيسية',
      exploreSectionsTitle: 'استكشف بوابة المعهد الأكاديمية والخدمية',
      exploreSectionsSub:
        'حفاظاً على تنظيم الموقع، تم تخصيص صفحة مستقلة لكل قسم (منهج ٥٠/٥٠، الخطة العشرية، الرعاية النهارية، النقل، والرسوم).',
      viewDetailsBtn: 'افتح الصفحة التفصيلية',
      watchCampusVideo: 'اضغط لمشاهدة الفيديو التعريفي للحرم',
      watchDeptVideo: 'شاهد فيديو القسم',
      applyBtn: 'قدم الآن',
      whyChooseBadge: 'لماذا تختار معهدنا',
      guardianReelsBadge: 'شهادات وآراء أولياء الأمور المرئية',
      guardianReelsTitle: 'آراء أولياء الأمور (فيديو)',
      guardianReelsSub:
        'استمع إلى انطباعات أولياء الأمور الكرام حول المستوى العلمي والتربوي لأبنائهم في المعهد.',
      autoScrollOn: 'التمرير التلقائي مفعل',
      autoScrollOff: 'التمرير التلقائي متوقف',
      playVideo: 'تشغيل الفيديو',
      videoComingSoon: 'الفيديو قريباً',
      viewAllReviewsBtn: 'عرض كافة الآراء والأسئلة الشائعة',
      calcTotalWithDiscount: 'احسب التكلفة الإجمالية مع الخصم',
      classesBadge: 'الصفوف الدراسية والمنهج التفصيلي',
      classesTitle: 'الصفوف الأكاديمية والمقررات الدراسية',
      classesSub:
        'اضغط على أي صف أو قسم للاطلاع على المنهج التفصيلي وعدد المحاضرات السنوية والوحدات الدراسية.',
      allDepts: 'جميع الأقسام',
      academicClasses: 'الصفوف الأكاديمية',
      hifzDept: 'تحفيظ القرآن',
      annualPeriods: 'الحصص السنوية:',
      subjectsCount: 'الوحدات:',
      monthlyFeeLabel: 'الرسوم الشهرية',
      admissionFeeLabel: 'رسوم القبول',
      viewSyllabusBtn: 'عرض المنهج والوحدات',
      aboutQuote: '«نحن لا نخرّج طلاباً فحسب، بل نبني جيلاً مستنيراً يتحلى بالقيم الإسلامية والأخلاق الرفيعة.»',
      faqBadge: 'الأسئلة الشائعة لأولياء الأمور',
      faqTitle: 'الأسئلة المتكررة حول القبول والدراسة',
      allFaq: 'الكل',
      readFullNotice: 'قراءة الإعلان كاملاً',
      noNotices: 'لا توجد إعلانات في هذا التصنيف حالياً.',
    },
  }[language];

  const handleTriggerVideoModal = (videoItem: CinemaVideoModalItem) => {
    setPlayingVideoModal(videoItem);
  };

  const HOME_PORTAL_CARDS: {
    page: PublicPageId;
    badge: Record<'bn' | 'en' | 'ar', string>;
    title: Record<'bn' | 'en' | 'ar', string>;
    desc: Record<'bn' | 'en' | 'ar', string>;
    icon: React.ReactNode;
    accentClass: string;
  }[] = [
    {
      page: 'hifz-tree',
      badge: { bn: '১ম – ২৪তম হাফেজ', en: '24 Huffaz Lineage', ar: '٢٤ حافظاً للقرآن' },
      title: {
        bn: 'হিফজুল কুরআন ট্রি (হাফেজদের বংশবৃক্ষ ও সম্মাননা)',
        en: 'Hifzul Quran Tree (Lineage of 24 Huffaz)',
        ar: 'شجرة حفاظ القرآن الكريم (١ – ٢٤ حافظاً)',
      },
      desc: {
        bn: 'মাদ্রাসার সূচনালগ্ন থেকে ১ম হাফেজ থেকে ২৪তম হাফেজ আহসানুদ্দিন পর্যন্ত ধারাবাহিক তালিকা, কক্সবাজার বিমান ভ্রমণ পুরস্কার ও শেয়ারিং।',
        en: 'Explore the complete chronological chain of Huffaz from the 1st to the 24th graduate with social sharing.',
        ar: 'سلسلة حفاظ القرآن الكريم من الحافظ الأول حتى الحافظ الرابع والعشرين مع إمكانية المشاركة.',
      },
      icon: <GitBranch className="w-6 h-6" />,
      accentClass: 'from-amber-500 to-purple-800',
    },
    {
      page: 'gallery',
      badge: { bn: '১০০% দাখিল ফলাফল ও অ্যালবাম', en: 'Framed Photo Gallery', ar: 'معرض الصور والإنجازات' },
      title: {
        bn: 'ফটো গ্যালারি, বোর্ড ফলাফল ও ইভেন্ট আর্কাইভ',
        en: 'Categorized Photo Gallery & Board Results',
        ar: 'معرض الصور ونتائج الامتحانات والأنشطة',
      },
      desc: {
        bn: 'দাখিল পরীক্ষায় ১০০% শতভাগ পাস (৫ জন A+), ৭ম সবক অনুষ্ঠান (৯৬ জন), শিক্ষাসফর ও মাহারাত পত্রিকার ফ্রেমড গ্যালারি।',
        en: '100% Dakhil Pass Result (5 GPA 5.00), 7th Sabak Ceremony, Study Tour, and Maharat Magazine in a framed lightbox.',
        ar: 'نتائج امتحان الداخل بنسبة نجاح ١٠٠٪، حفل السبق السابع، والرحلات العلمية في إطار منبثق.',
      },
      icon: <ImageIcon className="w-6 h-6" />,
      accentClass: 'from-fuchsia-600 to-purple-800',
    },
    {
      page: 'education-method',
      badge: { bn: '৫০/৫০ কারিকুলাম', en: '50/50 Methodology', ar: 'منهجية ٥٠/٥٠' },
      title: {
        bn: 'শিক্ষা পদ্ধতি ৫০/৫০ ও বিষয়ের ভারসাম্য',
        en: '50/50 Education Method & Subject Balance',
        ar: 'منهج التعليم ٥٠/٥٠ وتوازن المواد',
      },
      desc: {
        bn: 'প্রি-হিফজ, হিফজ ও আফটার হিফজ—তিন স্তরে কুরআন, আরবি ও সাধারণ শিক্ষার ইন্টারঅ্যাক্টিভ শতকরা অনুপাত।',
        en: 'Interactive subject percentage breakdown across Pre-Hifz, Hifz, and After-Hifz stages.',
        ar: 'التوزيع التفاعلي لنسب القرآن والعربية والعلوم العامة عبر المراحل الثلاث.',
      },
      icon: <Layers className="w-6 h-6" />,
      accentClass: 'from-purple-700 to-fuchsia-600',
    },
    {
      page: 'ten-year-plan',
      badge: { bn: '১০ বছরের রোডম্যাপ', en: '10-Year Master Plan', ar: 'خطة ١٠ سنوات' },
      title: {
        bn: 'নার্সারি থেকে একাদশ: ১০ বছরের পাঠ পরিকল্পনা',
        en: 'Nursery to Grade 11: 10-Year Academic Roadmap',
        ar: 'من الروضة إلى الحادي عشر: الخطة العشرية',
      },
      desc: {
        bn: '১ম শ্রেণি থেকে দাখিল ও মুতাওয়াসসিতা পর্যন্ত কুরআন, আরবি, ইসলাম ও সাধারণ শিক্ষার পূর্ণাঙ্গ ছক।',
        en: 'Complete 13-column progression matrix covering Quran, Arabic, Islamic Studies, Dakhil & Mutawassitah.',
        ar: 'مصفوفة متكاملة توضح مسار الطالب من الروضة حتى شهادة الداخل والمتوسطة.',
      },
      icon: <GraduationCap className="w-6 h-6" />,
      accentClass: 'from-[#2e0249] to-purple-700',
    },
    {
      page: 'daycare-routine',
      badge: { bn: 'সকাল ৭:০০ – রাত ৮:৩০', en: '7:00 AM – 8:30 PM', ar: '٧:٠٠ ص – ٨:٣٠ م' },
      title: {
        bn: 'হিফজ ডে-কেয়ারের একটি দিন ও সময়সূচি',
        en: 'A Day in Hifz Day-Care & Schedule',
        ar: 'الجدول اليومي لرعاية وتحفيظ القرآن',
      },
      desc: {
        bn: 'সকাল, দুপুর, বিকাল ও রাতের ৪ প্রহরের রুটিন, খাবার, বিশ্রাম (কায়লুলাহ) এবং ধাপভেদে মাদরাসার সময়।',
        en: 'Full-day supervised schedule covering Sabaq, academic classes, nutritious meals, midday rest, and sports.',
        ar: 'تفاصيل البرنامج اليومي للحفظ والدراسة والوجبات الصحية والقيلولة والرياضة.',
      },
      icon: <Clock className="w-6 h-6" />,
      accentClass: 'from-fuchsia-600 to-amber-500',
    },
    {
      page: 'transport',
      badge: { bn: 'উত্তরা ও মিরপুর রুট', en: 'Uttara & Mirpur Fleet', ar: 'مسارات النقل الخاص' },
      title: {
        bn: 'নিজস্ব পরিবহন রুট ম্যাপ ও মেট্রোরেল দূরত্ব',
        en: 'Own Transport Routes & Metro Rail Distance',
        ar: 'النقل المدرسي الخاص والمسافة من المترو',
      },
      desc: {
        bn: 'মাদ্রাসার নিজস্ব মাইক্রোবাস রুট, স্টপেজ সমূহ, দূরত্ব অনুযায়ী মাসিক ভাড়া ক্যালকুলেটর ও ল্যান্ডমার্ক গাইড।',
        en: 'Stop-by-stop route steppers, custom distance fare estimator, and distance from Uttara Metro Station.',
        ar: 'خريطة محطات الحافلات وحاسبة الرسوم حسب المسافة والموقع من محطة المترو.',
      },
      icon: <Bus className="w-6 h-6" />,
      accentClass: 'from-purple-800 to-indigo-700',
    },
    {
      page: 'fees',
      badge: { bn: 'অফিসিয়াল A4 প্রাক্কলন', en: 'Interactive Calculator', ar: 'حاسبة الرسوم' },
      title: {
        bn: 'ফি কাঠামো ও ইন্টারঅ্যাক্টিভ ফি ক্যালকুলেটর',
        en: 'Fee Structure & Interactive Cost Calculator',
        ar: 'هيكل الرسوم والحاسبة التفاعلية',
      },
      desc: {
        bn: 'শ্রেণি, আবাসন, পরিবহন ও সহোদর ছাড়সহ তাৎক্ষণিক হিসাব এবং অফিসিয়াল A4 লেটারহেড PDF ডাউনলোড।',
        en: 'Calculate net admission & monthly tuition with discounts and download an official A4 Letterhead PDF.',
        ar: 'احسب الرسوم الصافية مع الخصومات وحمّل كشف التكاليف الرسمي بصيغة PDF.',
      },
      icon: <Calculator className="w-6 h-6" />,
      accentClass: 'from-amber-500 to-fuchsia-600',
    },
    {
      page: 'curriculum',
      badge: { bn: '১২ আইটি + ৫০ সফট স্কিলস', en: '6 Pillars + 62 Skills', ar: 'المنهج والمهارات' },
      title: {
        bn: '৬-স্তম্ভ কারিকুলাম, আইটি ও সফট স্কিলস',
        en: '6-Pillar Curriculum, IT & Life Skills',
        ar: 'المنهج السداسي ومهارات التقنية والحياة',
      },
      desc: {
        bn: 'ইসলামিক ও একাডেমিক শিক্ষার পাশাপাশি গ্রাফিক ডিজাইন, কোডিং, রোবটিক্স, এআই ও পাবলিক স্পিকিং প্রশিক্ষণ।',
        en: 'Explore our 6 educational pillars, 12 practical IT lab tracks, and 50+ personal & entrepreneurship skills.',
        ar: 'استكشف أركان المنهج الستة و١٢ مساراً تقنياً وأكثر من ٥٠ مهارة قيادية.',
      },
      icon: <Cpu className="w-6 h-6" />,
      accentClass: 'from-purple-700 to-purple-950',
    },
  ];

  // Find active dropdown group & item for inner-page breadcrumb header
  const activeGroupForPage = HEADER_NAV_GROUPS.find(
    (g) => g.directPage === currentPage || g.items?.some((it) => it.page === currentPage)
  );
  const activeNavItem = activeGroupForPage?.items?.find((it) => it.page === currentPage);

  return (
    <div
      className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Enlarged 3D-Depth Promotional Discount & Countdown Strip (Maharat Logo Navy · Teal · Laurel Gold) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#071129] via-[#192f64] to-[#004454] text-white border-b border-[#c4962c]/35 text-xs sm:text-sm transition-colors shadow-[0_6px_24px_-6px_rgba(7,17,41,0.65)]">
        {/* Subtle 3D Top Specular Sheen & Ambient Light Orbs */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f0c95e]/60 to-transparent pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -left-16 top-1/2 -translate-y-1/2 w-56 h-20 rounded-full bg-[#0ea5b7]/20 blur-2xl pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -right-12 top-1/2 -translate-y-1/2 w-56 h-20 rounded-full bg-[#c4962c]/20 blur-2xl pointer-events-none"
        />

        <div className="relative z-10 cii-container-section py-2.5 sm:py-3 flex flex-wrap items-center justify-center lg:justify-between gap-3 sm:gap-4">
          {/* Left: Beveled 3D Special Discount Pill + Clear Subtitle */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5">
            <motion.span
              animate={{ y: [0, -1.5, 0] }}
              transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#005a6e] via-[#007c91] to-[#0ea5b7] text-white font-extrabold text-xs sm:text-[13.5px] border border-white/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_6px_18px_rgba(0,90,110,0.55)] whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#f0c95e]" />
              <span>{t.admissionOffer}</span>
            </motion.span>

            <span className="hidden xl:inline-block text-[13.5px] font-bold text-sky-100/95 tracking-tight">
              {language === 'bn'
                ? 'জেনারেল ও হিফজুল কুরআন বিভাগে ভর্তি চলছে!'
                : language === 'ar'
                  ? 'القبول مفتوح في القسم العام وتحفيظ القرآن!'
                  : 'General & Hifzul Quran Admissions Open!'}
            </span>
          </div>

          {/* Center: 3D Recessed Digital 2-Line Stacked Countdown Box */}
          <div
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#050d20]/90 border border-[#c4962c]/40 shadow-[inset_0_2px_6px_rgba(0,0,0,0.75),0_4px_14px_rgba(0,0,0,0.35)] font-mono tabular-nums"
            aria-label="Admission Offer Countdown"
          >
            <div className="flex flex-col items-center min-w-[36px] leading-none">
              <span className="text-[15px] font-black text-white">
                {localizeDigits(String(topDays).padStart(2, '0'), language)}
              </span>
              <span className="text-[9.5px] font-sans font-bold text-[#f0c95e] mt-0.5">
                {t.days}
              </span>
            </div>
            <span className="text-[#0ea5b7] font-black text-sm -mt-2">:</span>
            <div className="flex flex-col items-center min-w-[36px] leading-none">
              <span className="text-[15px] font-black text-white">
                {localizeDigits(String(topHours).padStart(2, '0'), language)}
              </span>
              <span className="text-[9.5px] font-sans font-bold text-[#f0c95e] mt-0.5">
                {t.hours}
              </span>
            </div>
            <span className="text-[#0ea5b7] font-black text-sm -mt-2">:</span>
            <div className="flex flex-col items-center min-w-[36px] leading-none">
              <span className="text-[15px] font-black text-white">
                {localizeDigits(String(topMinutes).padStart(2, '0'), language)}
              </span>
              <span className="text-[9.5px] font-sans font-bold text-[#f0c95e] mt-0.5">
                {t.minutes}
              </span>
            </div>
            <span className="text-[#0ea5b7] font-black text-sm -mt-2">:</span>
            <div className="flex flex-col items-center min-w-[36px] leading-none">
              <span className="text-[15px] font-black text-[#f0c95e]">
                {localizeDigits(String(topSeconds).padStart(2, '0'), language)}
              </span>
              <span className="text-[9.5px] font-sans font-bold text-sky-200 mt-0.5">
                {t.seconds}
              </span>
            </div>
          </div>

          {/* Right: 3D Elevated Enroll CTA + Beveled Academic/Hifz Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={scrollToQuickRegistration}
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-gradient-to-b from-[#f0c95e] via-[#d4a843] to-[#b88625] hover:from-[#f7d87c] hover:to-[#c4962c] text-[#08132e] font-extrabold text-xs sm:text-[13.5px] shadow-[inset_0_1px_1px_rgba(255,255,255,0.65),0_6px_18px_rgba(196,150,44,0.45)] transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#08132e]" />
              <span>{t.applyNow}</span>
            </button>

            <div className="hidden sm:inline-flex items-center rounded-full bg-[#050d20]/80 border border-[#0ea5b7]/45 p-1 shadow-[inset_0_2px_6px_rgba(0,0,0,0.65)]">
              <button
                type="button"
                onClick={() => setHeroDepartmentMode('Academic')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  heroDepartmentMode === 'Academic'
                    ? 'bg-gradient-to-r from-[#005a6e] to-[#0ea5b7] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_3px_10px_rgba(0,90,110,0.5)]'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'জেনারেল' : language === 'ar' ? 'الأكاديمي' : 'General'}</span>
              </button>
              <button
                type="button"
                onClick={() => setHeroDepartmentMode('Hifz')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  heroDepartmentMode === 'Hifz'
                    ? 'bg-gradient-to-r from-[#005a6e] to-[#0ea5b7] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),0_3px_10px_rgba(0,90,110,0.5)]'
                    : 'text-sky-100/80 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{language === 'bn' ? 'তাহফিজ' : language === 'ar' ? 'التحفيظ' : 'Tahfiz'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation Bar with Multi-Page Dropdown Lists + Login Mega-Dropdown */}
      <header
        onMouseLeave={() => setOpenDropdownId(null)}
        className="sticky top-0 z-40 bg-white/95 dark:bg-[#08132e]/95 backdrop-blur-md border-b border-[#192f64]/15 dark:border-[#007c91]/35 transition-colors shadow-[0_2px_16px_-6px_rgba(25,47,100,0.12)]"
      >
        <div className="cii-container-section py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Logo & Title (Dynamically controlled from Admin Branding Vault) */}
          <button
            type="button"
            onClick={() => navigateToPage('home')}
            className="flex items-center gap-2 text-sm sm:text-base xl:text-lg font-extrabold tracking-tight text-[#192f64] dark:text-white shrink-0 cursor-pointer text-left group"
          >
            {(settings.headerLogoDisplayMode || 'banner-only') !== 'text-only' &&
            settings.logoUrl ? (
              <div className="flex items-center gap-2 shrink-0">
                {/* Mobile (<640px): Compact Emblem + Short Name so 390px header has zero overlap */}
                <div className="flex sm:hidden items-center gap-1.5 min-w-0">
                  <img
                    src={settings.secondaryLogoUrl || settings.logoUrl}
                    alt={settings.instituteNameBn || settings.instituteName}
                    className="h-9 w-9 rounded-full object-contain bg-white p-0.5 shadow-2xs border border-[#005a6e]/25 shrink-0"
                  />
                  <div className="leading-tight min-w-0">
                    <span className="block text-xs font-extrabold text-[#192f64] dark:text-white truncate max-w-[82px]">
                      {language === 'bn' ? 'মাহারাত' : language === 'ar' ? 'المهارات' : 'Maharat'}
                    </span>
                    <span className="block text-[9px] font-mono font-bold text-[#005a6e] dark:text-[#f0c95e] truncate">
                      {settings.eiinNumber || '140630'}
                    </span>
                  </div>
                </div>
                {/* Tablet & Desktop (>=640px): Full Institutional Banner Logo */}
                <img
                  src={settings.logoUrl}
                  alt={settings.instituteNameBn || settings.instituteName}
                  style={{ height: `${Math.min(46, Math.max(36, settings.headerLogoHeightPx || 44))}px` }}
                  className="hidden sm:block w-auto max-w-[160px] lg:max-w-[170px] xl:max-w-[195px] 2xl:max-w-[225px] object-contain rounded-lg bg-white px-1.5 py-0.5 shadow-2xs border border-[#005a6e]/20 transition-transform group-hover:scale-[1.01] shrink-0"
                />
                {settings.headerLogoDisplayMode === 'logo-with-text' && (
                  <div className="leading-tight hidden sm:block">
                    <span className="block truncate max-w-[180px] sm:max-w-none">
                      {language === 'bn'
                        ? settings.instituteNameBn
                        : language === 'en'
                          ? settings.instituteName
                          : settings.instituteNameAr || t.instituteName}
                    </span>
                    <span className="block text-[10px] font-mono font-bold text-[#005a6e] dark:text-[#f0c95e]">
                      EIIN: {settings.eiinNumber || '140630'} | Code:{' '}
                      {settings.madrasahCode || '21023'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#192f64] to-[#005a6e] text-[#f0c95e] flex items-center justify-center shadow-sm shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <div className="leading-tight">
                  <span className="block truncate max-w-[180px] sm:max-w-none">
                    {language === 'bn'
                      ? settings.instituteNameBn
                      : language === 'en'
                        ? settings.instituteName
                        : settings.instituteNameAr || t.instituteName}
                  </span>
                  <span className="block text-[10px] font-mono font-bold text-[#005a6e] dark:text-[#f0c95e]">
                    EIIN: {settings.eiinNumber || '140630'} | Code: {settings.madrasahCode || '21023'}
                  </span>
                </div>
              </>
            )}
          </button>

          {/* Desktop Navigation with Interactive Dropdown Menus */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-0.5 xl:gap-1 text-[12px] xl:text-[13px] font-bold text-slate-700 dark:text-slate-200 min-w-0"
          >
            {HEADER_NAV_GROUPS.map((group) => {
              const isGroupActive =
                group.directPage === currentPage ||
                group.items?.some((item) => item.page === currentPage);
              const isOpen = openDropdownId === group.id;

              if (group.directPage) {
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => navigateToPage(group.directPage!)}
                    onMouseEnter={() => setOpenDropdownId(null)}
                    className={`px-2 xl:px-2.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      isGroupActive
                        ? 'bg-[#005a6e]/12 dark:bg-[#005a6e]/40 text-[#192f64] dark:text-[#f0c95e]'
                        : 'hover:bg-[#005a6e]/8 dark:hover:bg-white/10 hover:text-[#005a6e] dark:hover:text-[#f0c95e]'
                    }`}
                  >
                    {group.label[language]}
                  </button>
                );
              }

              return (
                <div
                  key={group.id}
                  className="relative"
                  onMouseEnter={() => setOpenDropdownId(group.id)}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenDropdownId(isOpen ? null : group.id)}
                    className={`inline-flex items-center gap-1 px-2 xl:px-2.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                      isGroupActive || isOpen
                        ? 'bg-[#005a6e]/12 dark:bg-[#005a6e]/40 text-[#192f64] dark:text-[#f0c95e]'
                        : 'hover:bg-[#005a6e]/8 dark:hover:bg-white/10 hover:text-[#005a6e] dark:hover:text-[#f0c95e]'
                    }`}
                  >
                    <span>{group.label[language]}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#005a6e] dark:text-[#f0c95e]' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Panel */}
                  {isOpen && group.items && (
                    <div className="absolute left-0 rtl:left-auto rtl:right-0 top-full pt-2 w-80 z-50">
                      <div className="rounded-2xl bg-white dark:bg-[#0b1630] border border-[#192f64]/20 dark:border-[#007c91]/40 shadow-2xl p-2 space-y-1">
                        {group.items.map((sub) => {
                          const isSubActive = currentPage === sub.page;
                          return (
                            <button
                              key={sub.page}
                              type="button"
                              onClick={() => navigateToPage(sub.page)}
                              className={`w-full text-left rtl:text-right p-3 rounded-xl transition-all flex items-start justify-between gap-2 cursor-pointer ${
                                isSubActive
                                  ? 'bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white shadow-sm'
                                  : 'hover:bg-[#005a6e]/8 dark:hover:bg-white/10 text-slate-800 dark:text-sky-100'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
                                  <span>{sub.title[language]}</span>
                                  {sub.badge && (
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                                        isSubActive
                                          ? 'bg-[#f0c95e] text-[#08132e]'
                                          : 'bg-[#005a6e]/12 dark:bg-[#005a6e]/40 text-[#005a6e] dark:text-[#f0c95e]'
                                      }`}
                                    >
                                      {sub.badge[language]}
                                    </span>
                                  )}
                                </div>
                                <p
                                  className={`text-[11px] leading-snug ${
                                    isSubActive
                                      ? 'text-sky-100/90'
                                      : 'text-slate-500 dark:text-slate-300'
                                  }`}
                                >
                                  {sub.subtitle[language]}
                                </p>
                              </div>
                              <ArrowRight
                                className={`w-4 h-4 shrink-0 mt-1 rtl:rotate-180 ${
                                  isSubActive ? 'text-[#f0c95e]' : 'text-[#005a6e] opacity-60'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Zone: Accessibility Controls + Compact Login Button + Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <AccessibilityToolbar />

            <HeaderLoginDropdown
              onOpenAdminWithRole={onOpenAdmin}
              onNavigateCareer={() => navigateToPage('career')}
            />

            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#192f64] dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            >
              {isMobileNavOpen ? (
                <X className="w-4 h-4 text-[#005a6e] dark:text-[#f0c95e]" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer with Accordion Dropdowns */}
        {isMobileNavOpen && (
          <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2.5 shadow-2xl max-h-[82vh] overflow-y-auto">
            {settings.logoUrl && (
              <div className="pb-2.5 mb-1 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <img
                  src={settings.logoUrl}
                  alt={settings.instituteNameBn || settings.instituteName}
                  className="h-9 w-auto max-w-[210px] object-contain rounded bg-white px-1.5 py-0.5 border border-slate-200"
                />
                <span className="text-[10px] font-mono font-bold text-[#005a6e] dark:text-[#f0c95e]">
                  EIIN: {settings.eiinNumber || '140630'}
                </span>
              </div>
            )}
            <nav className="flex flex-col space-y-1.5 text-sm font-bold text-slate-800 dark:text-slate-200">
              {HEADER_NAV_GROUPS.map((group) => {
                if (group.directPage) {
                  const isActive = currentPage === group.directPage;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => navigateToPage(group.directPage!)}
                      className={`w-full text-left rtl:text-right px-3.5 py-2.5 rounded-xl transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-[#192f64] to-[#005a6e] text-white'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {group.label[language]}
                    </button>
                  );
                }

                const isExpanded = openMobileGroupId === group.id;
                return (
                  <div
                    key={group.id}
                    className="rounded-xl border border-purple-100 dark:border-purple-800/60 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenMobileGroupId(isExpanded ? null : group.id)}
                      className="w-full px-3.5 py-2.5 bg-purple-50/60 dark:bg-purple-950/40 flex items-center justify-between text-left rtl:text-right text-[#2e0249] dark:text-amber-300 cursor-pointer"
                    >
                      <span>{group.label[language]}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isExpanded && group.items && (
                      <div className="p-2 space-y-1 bg-white dark:bg-slate-900">
                        {group.items.map((sub) => (
                          <button
                            key={sub.page}
                            type="button"
                            onClick={() => navigateToPage(sub.page)}
                            className={`w-full text-left rtl:text-right px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                              currentPage === sub.page
                                ? 'bg-purple-700 text-white font-extrabold'
                                : 'text-slate-700 dark:text-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950/50'
                            }`}
                          >
                            <div>
                              <div className="font-bold">{sub.title[language]}</div>
                              <div className="text-[10px] opacity-80">{sub.subtitle[language]}</div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 shrink-0 rtl:rotate-180" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileNavOpen(false);
                  handleOpenAdmissionWithCourse();
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white font-bold text-xs text-center shadow-sm cursor-pointer"
              >
                {t.applyNow}
              </button>
              <button
                type="button"
                onClick={() => navigateToPage('admission')}
                className="flex-1 py-2.5 rounded-xl bg-amber-400 text-purple-950 font-bold text-xs text-center shadow-sm cursor-pointer"
              >
                {t.navRegistration}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Live Scrolling News Ticker ("সর্বশেষ আপডেট") + Compact Top Social Media Icons */}
      {activeNewsItems.length > 0 && (
        <div
          id="top-news-ticker"
          className="bg-[#f0f7fa] dark:bg-[#091533] text-slate-800 dark:text-sky-100 border-b border-[#005a6e]/20 dark:border-[#007c91]/35 text-xs sm:text-[13.5px] transition-colors"
        >
          <div className="cii-container-section py-2 flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-1.5 font-extrabold text-[#192f64] dark:text-[#f0c95e] whitespace-nowrap shrink-0 pr-3 border-r border-[#005a6e]/25 dark:border-[#007c91]/40">
              <Megaphone className="w-3.5 h-3.5 text-[#005a6e] dark:text-[#f0c95e]" />
              <span>{t.latestUpdates}</span>
            </div>
            <div className="overflow-hidden flex-1 relative">
              <div className="animate-marquee flex items-center gap-12 whitespace-nowrap">
                {(language === 'bn' && activeNewsItems.length > 0
                  ? activeNewsItems.map((n) => n.text)
                  : t.newsMarquee
                )
                  .concat(
                    language === 'bn' && activeNewsItems.length > 0
                      ? activeNewsItems.map((n) => n.text)
                      : t.newsMarquee
                  )
                  .map((text, idx) => (
                    <span key={`news-ticker-${idx}`} className="inline-flex items-center gap-3 font-medium">
                      <span>{text}</span>
                      <span aria-hidden="true" className="text-[#9c7a32] dark:text-[#f0c95e]">
                        ●
                      </span>
                    </span>
                  ))}
              </div>
            </div>
            {/* Compact Top Social Media Icons (Facebook, YouTube, WhatsApp) */}
            <div className="hidden md:flex items-center gap-1.5 pl-3 border-l border-[#005a6e]/25 dark:border-[#007c91]/40 shrink-0">
              <a
                href={settings.facebookUrl || 'https://www.facebook.com/maharatmodelmadrasah'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Maharat Official Facebook"
                title="Facebook"
                className="w-7 h-7 rounded-full bg-[#1877F2]/12 hover:bg-[#1877F2] text-[#1877F2] hover:text-white flex items-center justify-center transition-all"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a
                href={settings.youtubeUrl || 'https://www.youtube.com/@maharatmodelmadrasa'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Maharat Official YouTube"
                title="YouTube"
                className="w-7 h-7 rounded-full bg-[#FF0000]/12 hover:bg-[#FF0000] text-[#DC2626] hover:text-white flex items-center justify-center transition-all"
              >
                <Youtube className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '') || '8801886340308'}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Maharat Admission WhatsApp"
                title="WhatsApp"
                className="w-7 h-7 rounded-full bg-[#25D366]/15 hover:bg-[#25D366] text-[#16A34A] hover:text-white flex items-center justify-center transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Inner Page Breadcrumb & Sibling Sub-Navigation Banner (Maharat Logo Gradient) */}
      {currentPage !== 'home' && (
        <div className="bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#005a6e] text-white border-b border-[#c4962c]/30 shadow-md">
          <div className="cii-container-section py-5 sm:py-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-200">
                <button
                  type="button"
                  onClick={() => navigateToPage('home')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
                  <span>{pageCopy.backToHome}</span>
                </button>
                <span>/</span>
                <span className="text-[#f0c95e]">
                  {activeGroupForPage?.label[language] || currentPage}
                </span>
                {activeNavItem && (
                  <>
                    <span>/</span>
                    <span className="text-white">{activeNavItem.title[language]}</span>
                  </>
                )}
              </div>

              <span className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-black/25 text-[#f0c95e] border border-white/15">
                {PAGE_PATH_MAP[currentPage]}
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {activeNavItem
                  ? activeNavItem.title[language]
                  : activeGroupForPage?.label[language]}
              </h1>
              {activeNavItem && (
                <p className="text-xs sm:text-sm text-sky-100/85 mt-1">
                  {activeNavItem.subtitle[language]}
                </p>
              )}
            </div>

            {/* Sibling Sub-Page Tabs within the Active Dropdown Category */}
            {activeGroupForPage?.items && activeGroupForPage.items.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {activeGroupForPage.items.map((sub) => {
                  const isActive = sub.page === currentPage;
                  return (
                    <button
                      key={sub.page}
                      type="button"
                      onClick={() => navigateToPage(sub.page)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#f0c95e] text-[#08132e] shadow-sm'
                          : 'bg-white/10 hover:bg-white/20 text-sky-100 border border-white/15'
                      }`}
                    >
                      {sub.title[language]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <main id="home" className="flex-1">
        {/* ===================================================================
            HOME PAGE ('/') — MAHARAT OFFICIAL LOGO GRADIENT + 3D DEPTH HERO
           =================================================================== */}
        {currentPage === 'home' && (
          <>
            {/* 1. Hero Banner Section — Maharat Official Logo Gradient (#071129 -> #192f64 -> #005a6e + Laurel Gold) */}
            {settings.pageVisibility?.hero !== false && (
              <section
                id="hero"
                className="relative overflow-hidden bg-gradient-to-br from-[#071129] via-[#192f64] to-[#005a6e] text-white py-16 lg:py-22 xl:py-26 transition-colors"
              >
                {/* Performance-Optimized HTML5 Canvas 3D-Projected Geometric Shapes & Light Particles */}
                <div className="absolute inset-0 pointer-events-none z-0">
                  <Hero3DCanvas />
                </div>

                {/* Sweeping Architectural Light Arcs (Right Side) + Ambient Floating 3D Academic Icons */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 600 600"
                  className="absolute -right-24 top-1/2 -translate-y-1/2 w-[560px] h-[560px] text-[#0ea5b7]/15 pointer-events-none z-0"
                  fill="none"
                >
                  {[120, 165, 210, 255, 300, 345].map((r) => (
                    <circle key={r} cx="360" cy="320" r={r} stroke="currentColor" strokeWidth="1.5" />
                  ))}
                </svg>

                <motion.div
                  aria-hidden="true"
                  animate={{ y: [0, -14, 0], rotate: [-4, 4, -4] }}
                  transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                  className="hidden md:flex absolute left-10 top-16 w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 items-center justify-center text-sky-200/30 pointer-events-none z-0"
                >
                  <BookOpen className="w-6 h-6" />
                </motion.div>
                <motion.div
                  aria-hidden="true"
                  animate={{ y: [0, 12, 0], rotate: [5, -5, 5] }}
                  transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="hidden md:flex absolute right-[26%] top-12 w-12 h-12 rounded-2xl bg-white/[0.04] border border-[#f0c95e]/15 items-center justify-center text-[#f0c95e]/30 pointer-events-none z-0"
                >
                  <Globe className="w-6 h-6" />
                </motion.div>
                <motion.div
                  aria-hidden="true"
                  animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
                  transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="hidden lg:flex absolute left-[44%] bottom-12 w-11 h-11 rounded-2xl bg-white/[0.04] border border-[#0ea5b7]/20 items-center justify-center text-[#0ea5b7]/30 pointer-events-none z-0"
                >
                  <GraduationCap className="w-5 h-5" />
                </motion.div>

                <div className="absolute -top-28 -right-24 w-[480px] h-[480px] rounded-full bg-[#0ea5b7]/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] rounded-full bg-[#c4962c]/15 blur-3xl pointer-events-none" />

                <div className="relative z-10 cii-container-hero grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-12 items-center">
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={sectionRevealVariants}
                    className="lg:col-span-7 space-y-6"
                  >
                    <div className="inline-flex flex-wrap items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-[#f0c95e]/35 backdrop-blur-md text-xs sm:text-sm font-bold text-[#f0c95e] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                      <Sparkles className="w-3.5 h-3.5 text-[#f0c95e] shrink-0" />
                      <span>
                        {language === 'bn'
                          ? 'মাহারাত মডেল মাদ্রাসা · উত্তরা সেক্টর-১২ · EIIN: 140630 · কোড: 21023'
                          : language === 'ar'
                            ? 'مدرسة المهارات النموذجية · أوتارا قطاع ١٢ · EIIN: 140630'
                            : 'Maharat Model Madrasah · Uttara Sector-12 · EIIN: 140630 · Code: 21023'}
                      </span>
                    </div>

                    <h1 className="cii-hero-title font-extrabold tracking-tight text-white">
                      {language === 'bn' ? settings.heroTitle : t.heroHeadingPart1}{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f0c95e] via-[#ffe28a] to-[#5eead4]">
                        {language === 'bn' ? settings.heroHighlight : t.heroHeadingPart2}
                      </span>
                    </h1>

                    <p className="text-base sm:text-lg text-sky-100/90 max-w-2xl leading-relaxed">
                      {heroDepartmentMode === 'Academic'
                        ? language === 'bn'
                          ? settings.heroSubtitle
                          : t.heroAcademicSub
                        : t.heroHifzSub}
                    </p>

                    {/* Exact Primary CTA Hierarchy: 1-Min Registration + Full Admission Form */}
                    <div className="flex flex-wrap items-center gap-4 pt-2">
                      <a
                        href="#quick-registration"
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToQuickRegistration();
                        }}
                        className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-gradient-to-b from-[#f0c95e] via-[#d4a843] to-[#b88625] hover:from-[#fae08c] hover:to-[#c4962c] text-[#08132e] font-extrabold text-sm sm:text-base shadow-[inset_0_1px_1px_rgba(255,255,255,0.65),0_12px_28px_-6px_rgba(196,150,44,0.55)] transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>
                          {t.heroBtnRegistration ||
                            (language === 'bn'
                              ? '১ মিনিটে রেজিস্ট্রেশন'
                              : language === 'ar'
                                ? 'تسجيل في دقيقة واحدة'
                                : '1-Minute Registration')}
                        </span>
                        <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleOpenAdmissionWithCourse()}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-sm sm:text-base backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] transition-all hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                      >
                        <FileText className="w-4 h-4 text-[#f0c95e]" />
                        <span>{t.heroBtnAdmission}</span>
                      </button>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-sky-100/95">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#f0c95e]" />
                        <span>{t.heroBadgeClass}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#5eead4]" />
                        <span>{t.heroBadgeQuran}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#f0c95e]" />
                        <span>{t.heroBadgeCare}</span>
                      </span>
                    </div>
                  </motion.div>

                  {/* Right 3D Floating Perspective Admission Spotlight Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 24, rotateY: -6 }}
                    animate={{ opacity: 1, y: [0, -7, 0], rotateY: 0 }}
                    transition={{
                      opacity: { duration: 0.6 },
                      rotateY: { duration: 0.7 },
                      y: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    whileHover={{ scale: 1.015 }}
                    className="lg:col-span-5 [perspective:1200px]"
                  >
                    <div className="relative rounded-3xl bg-gradient-to-br from-white/[0.12] via-[#192f64]/55 to-[#004454]/65 border border-[#f0c95e]/30 p-6 sm:p-7 shadow-[0_32px_75px_-18px_rgba(4,10,26,0.85),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-xl space-y-5">
                      <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-5">
                        <div>
                          <p
                            className={`text-xs font-bold text-[#f0c95e] ${
                              language === 'en' ? 'uppercase tracking-[0.14em]' : 'tracking-normal'
                            }`}
                          >
                            {language === 'bn'
                              ? 'ভর্তি চলছে · শিক্ষাবর্ষ ২০২৬–২০২৭'
                              : language === 'ar'
                                ? 'القبول مفتوح · ٢٠٢٦–٢٠٢٧'
                                : 'Admissions Open · 2026–2027'}
                          </p>
                          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5 leading-snug">
                            {t.heroRightOfferTitle}
                          </h2>
                          <p className="text-sm text-sky-100/85 font-medium mt-1">
                            {t.heroRightOfferSub}
                          </p>
                        </div>
                        <div className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-br from-[#f0c95e] via-[#d4a843] to-[#9c7a32] text-[#08132e] font-extrabold text-center shrink-0 shadow-[0_10px_25px_-4px_rgba(196,150,44,0.6),inset_0_1px_1px_rgba(255,255,255,0.6)]">
                          <div className="text-[11px] leading-tight">
                            {language === 'bn' ? 'প্রথম ৫ জনে' : language === 'ar' ? 'عرض خاص' : 'First 5 Seats'}
                          </div>
                          <div className="text-base leading-tight mt-0.5">{t.heroRightDiscount}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-2xl bg-white/[0.08] border border-white/15 shadow-inner">
                          <div className="text-xs font-bold text-[#f0c95e]">
                            {t.academic}
                          </div>
                          <div className="text-sm font-semibold text-white mt-1 leading-snug">
                            {t.heroRightDept1}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white/[0.08] border border-white/15 shadow-inner">
                          <div className="text-xs font-bold text-[#5eead4]">
                            {t.hifz}
                          </div>
                          <div className="text-sm font-semibold text-white mt-1 leading-snug">
                            {t.heroRightDept2}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white/[0.08] border border-white/15 shadow-inner">
                          <div className="text-xs font-bold text-[#f0c95e]">
                            {language === 'bn' ? 'পৃথক ক্যাম্পাস ও অর্জন' : language === 'ar' ? 'حرم منفصل وإنجازات' : 'Separate Campuses'}
                          </div>
                          <div className="text-sm font-semibold text-white mt-1 leading-snug">
                            {language === 'bn'
                              ? '৩০ জন হাফেজ · ১০০% দাখিল পাস'
                              : language === 'ar'
                                ? '٣٠ حافظاً · ١٠٠٪ نجاح داخل'
                                : '30 Huffaz · 100% Dakhil Pass'}
                          </div>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-white/[0.08] border border-white/15 shadow-inner">
                          <div className="text-xs font-bold text-[#5eead4]">
                            {language === 'bn' ? 'আবাসিক ও পরিবহন' : language === 'ar' ? 'سكن ونقل مدرسي' : 'Residential & Transport'}
                          </div>
                          <div className="text-sm font-semibold text-white mt-1 leading-snug">
                            {t.heroRightDept4}
                          </div>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between gap-4">
                        <div>
                          <span className="block text-xs text-sky-200/80 font-medium">
                            {t.heroDirectCall}
                          </span>
                          <a
                            href="tel:01886340308"
                            className="font-mono text-base font-extrabold text-[#f0c95e] hover:underline whitespace-nowrap"
                          >
                            {localizeDynamicText(
                              (settings.phonePrimary || '01886-340308').replace(/\s*\([^)]*\)\s*/g, '').trim(),
                              language
                            )}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPromoPopupOpen(true)}
                          className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#005a6e] to-[#0ea5b7] hover:from-[#006f85] hover:to-[#14b8a6] text-white text-sm font-extrabold transition-all cursor-pointer shrink-0 shadow-md border border-white/20"
                        >
                          {t.heroOpenModalBtn}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>
            )}

            {/* 2. Clean 4-Column Institutional Trust Strip */}
            {settings.pageVisibility?.highlights !== false && (
              <section className="bg-white dark:bg-slate-950 border-y border-slate-200/80 dark:border-slate-800/80 py-11 sm:py-14 transition-colors">
                <div className="cii-container-section grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                  <div className="space-y-1">
                    <div className="text-3xl sm:text-4xl font-extrabold text-[#192f64] dark:text-white font-mono tabular-nums tracking-tight">
                      {localizeDigits(language === 'bn' ? settings.statsStudents : t.statStudents, language)}
                    </div>
                    <div className="text-sm sm:text-[15px] font-medium text-slate-600 dark:text-slate-400 leading-snug">
                      {t.statStudentsSub}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl sm:text-4xl font-extrabold text-[#005a6e] dark:text-[#f0c95e] font-mono tabular-nums tracking-tight">
                      {localizeDigits(language === 'bn' ? '৩০+ জন' : '30+ Huffaz', language)}
                    </div>
                    <div className="text-sm sm:text-[15px] font-medium text-slate-600 dark:text-slate-400 leading-snug">
                      {language === 'bn'
                        ? 'তাহফিজুল কুরআন বিভাগ থেকে সম্মানিত হাফেজ'
                        : language === 'ar'
                          ? 'خريجو قسم تحفيظ القرآن الكريم'
                          : 'Honored Huffaz Graduated from Tahfiz Wing'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white font-mono tabular-nums tracking-tight">
                      {localizeDigits(language === 'bn' ? settings.statsCertifications : t.statMastery, language)}
                    </div>
                    <div className="text-sm sm:text-[15px] font-medium text-slate-600 dark:text-slate-400 leading-snug">
                      {t.statMasterySub}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl sm:text-4xl font-extrabold text-[#9c7a32] dark:text-[#f0c95e] font-mono tabular-nums tracking-tight">
                      {localizeDigits(language === 'bn' ? settings.statsSuccessRate : t.statSatisfaction, language)}
                    </div>
                    <div className="text-sm sm:text-[15px] font-medium text-slate-600 dark:text-slate-400 leading-snug">
                      {t.statSatisfactionSub}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 2.5 Authentic Founding Context, Chairman & Principal Message on Home */}
            <HomeContextAndPrincipalSection onNavigateToContext={() => navigateToPage('context')} />

            {/* 3. OUR DEPARTMENTS — Clean CII-Style Tabbed Interactive Spotlight */}
            {settings.pageVisibility?.departmentVideos !== false && departmentVideos.length > 0 && (
              <section
                id="departments"
                className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors"
              >
                <div className="cii-container-section space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2.5 max-w-2xl">
                      <p
                        className={`text-xs sm:text-sm font-bold text-purple-700 dark:text-amber-300 ${
                          language === 'en' ? 'uppercase tracking-[0.16em]' : 'tracking-normal'
                        }`}
                      >
                        {language === 'bn' ? 'একাডেমিক ও তাহফিজ ট্র্যাক' : 'Academic & Hifz Tracks'}
                      </p>
                      <h2 className="cii-section-title font-extrabold tracking-tight text-slate-950 dark:text-white">
                        {t.ourDepartments}
                      </h2>
                    </div>

                    {/* Apple-grade Segmented Tab Switcher */}
                    <div className="inline-flex rounded-full bg-slate-100 dark:bg-slate-900 p-1.5 border border-slate-200/80 dark:border-slate-800 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => setHeroDepartmentMode('Academic')}
                        className={`px-5 py-2.5 rounded-full text-sm sm:text-[15px] font-bold transition-all cursor-pointer ${
                          heroDepartmentMode === 'Academic'
                            ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {t.academic}
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroDepartmentMode('Hifz')}
                        className={`px-5 py-2.5 rounded-full text-sm sm:text-[15px] font-bold transition-all cursor-pointer ${
                          heroDepartmentMode === 'Hifz'
                            ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {t.hifz}
                      </button>
                    </div>
                  </div>

                  {(() => {
                    const activeDept =
                      departmentVideos.find((d) => d.departmentKey === heroDepartmentMode) ||
                      departmentVideos[0];
                    const deptTitle = localizeDynamicText(activeDept.titleBn, language);
                    const deptDesc = localizeDynamicText(activeDept.descriptionBn, language);
                    const deptBadge = localizeDynamicText(activeDept.badgeText, language);
                    const deptSub = localizeDynamicText(activeDept.subtitleEn, language);
                    const highlights =
                      heroDepartmentMode === 'Academic'
                        ? language === 'bn'
                          ? [
                              'প্রি-প্লে ও প্লে থেকে ৯ম শ্রেণি/দাখিল (আরবি ও ইংলিশ ভার্সন)',
                              'বালক ও বালিকাদের সম্পূর্ণ আলাদা ক্যাম্পাস (উত্তরা সেক্টর-১২)',
                              'বোর্ড পরীক্ষায় ১০০% শতভাগ পাস ও ত্রি-ভাষা দক্ষতা',
                              'প্রজেক্টর ও স্মার্ট বোর্ড সমৃদ্ধ আইসিটি স্মার্ট ক্লাসরুম',
                            ]
                          : [
                              'Pre-Play & Play through Class 9 / Dakhil (Arabic & English Version)',
                              'Separate Boys & Girls Campuses in Uttara Sector-12',
                              '100% Dakhil Board Pass Record & Trilingual Mastery',
                              'Smart ICT Classrooms with Projectors & Dream Diary',
                            ]
                        : language === 'bn'
                          ? [
                              'নূরানী, নাজেরা ও পূর্ণাঙ্গ হিফজুল কুরআন (আন্তর্জাতিক মানের হাফেজ ও ক্বারী)',
                              'হিফজের সাথে ৪টি মৌলিক জেনারেল বিষয় (বাংলা, ইংরেজি, গণিত ও আরবি)',
                              '১ম থেকে ৩০তম হাফেজ সম্মাননা ও ধারাবাহিক হিফজ ট্রি ঐতিহ্য',
                              '২৪/৭ সিসিটিভি নিরাপত্তা, আবাসিক ও সকাল ৭টা–রাত ৮:৩০ ডে-কেয়ার',
                            ]
                          : [
                              'Nurani, Nazera & Complete Hifzul Quran under expert Huffaz & Qaris',
                              '4 Fundamental Academic Subjects integrated alongside Hifz',
                              'Proven Lineage of 30 Huffaz Graduates & International Preparation',
                              '24/7 CCTV Residential Care & 7:00 AM–8:30 PM Hifz Day-Care',
                            ];

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                        {/* Left: Apple-Grade Edge-to-Edge 16:9 Cinema Preview */}
                        <div
                          onClick={() =>
                            handleTriggerVideoModal({
                              title: deptTitle,
                              videoUrl: activeDept.videoUrl,
                              subtitle: deptDesc,
                              thumbnailUrl: activeDept.thumbnailUrl,
                            })
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleTriggerVideoModal({
                                title: deptTitle,
                                videoUrl: activeDept.videoUrl,
                                subtitle: deptDesc,
                                thumbnailUrl: activeDept.thumbnailUrl,
                              });
                            }
                          }}
                          className="lg:col-span-7 group relative aspect-video rounded-3xl overflow-hidden bg-slate-900 ring-1 ring-slate-900/10 dark:ring-white/10 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.3)] cursor-pointer"
                        >
                          <img
                            src={activeDept.thumbnailUrl || '/assets/maharat/maharat-campus.jpg'}
                            alt={deptTitle}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/maharat/maharat-campus.jpg';
                            }}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent flex items-center justify-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-white group-hover:text-slate-950 transition-all duration-300">
                              <Play className="w-7 h-7 fill-current ml-1" />
                            </div>
                          </div>
                          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-sm text-white/90 font-medium">
                            <span>{deptBadge}</span>
                            <span className="backdrop-blur-md bg-black/45 px-3 py-1 rounded-full border border-white/15 text-xs">
                              {pageCopy.watchDeptVideo}
                            </span>
                          </div>
                        </div>

                        {/* Right: Clean Editorial Details & CTA */}
                        <div className="lg:col-span-5 space-y-6">
                          <div className="space-y-2.5">
                            <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-purple-700 dark:text-amber-300">
                              {deptSub}
                            </p>
                            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white leading-tight">
                              {deptTitle}
                            </h3>
                            <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                              {deptDesc}
                            </p>
                          </div>

                          <ul className="space-y-3">
                            {highlights.map((pt, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-3 text-[15px] sm:text-base text-slate-700 dark:text-slate-200"
                              >
                                <CheckCircle2 className="w-5 h-5 text-purple-700 dark:text-amber-300 shrink-0 mt-0.5" />
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => handleOpenAdmissionWithCourse()}
                              className="px-6 py-3 rounded-full bg-purple-800 hover:bg-purple-900 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 text-sm sm:text-base font-bold transition-colors cursor-pointer"
                            >
                              {pageCopy.applyBtn}
                            </button>
                            <button
                              type="button"
                              onClick={() => navigateToPage('curriculum')}
                              className="px-5 py-3 rounded-full bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white text-sm sm:text-base font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <span>{t.navCurriculum}</span>
                              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </section>
            )}

            {/* 4. OUR ACTIVITIES — Tabbed Showcase on Home (Inspired by Latest CII) */}
            {activityVideos.filter((v) => v.active).length > 0 && (
              <section
                id="home-activities"
                className="py-16 sm:py-20 lg:py-24 bg-slate-50 dark:bg-[#0d0118] text-slate-900 dark:text-white border-t border-slate-200/70 dark:border-slate-800/80 transition-colors"
              >
                <div className="cii-container-section space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2.5 max-w-2xl">
                      <p
                        className={`text-xs sm:text-sm font-bold text-purple-700 dark:text-amber-300 ${
                          language === 'en' ? 'uppercase tracking-[0.16em]' : 'tracking-normal'
                        }`}
                      >
                        {language === 'bn' ? 'সহশিক্ষা ও সৃজনশীল কার্যক্রম' : 'Co-Curricular Excellence'}
                      </p>
                      <h2 className="cii-section-title font-extrabold tracking-tight text-slate-950 dark:text-white">
                        {t.activitiesTitle}
                      </h2>
                      <p className="text-base sm:text-[17px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {t.activitiesSubtitle}
                      </p>
                    </div>

                    <div className="inline-flex rounded-full bg-white dark:bg-slate-900 p-1.5 border border-slate-200/80 dark:border-slate-800 self-start md:self-auto">
                      {[
                        { id: 'All' as const, label: pageCopy.allDepts },
                        { id: 'Academic' as const, label: t.academic },
                        { id: 'Hifz' as const, label: t.hifz },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActivityDeptFilter(tab.id)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            activityDeptFilter === tab.id
                              ? 'bg-slate-950 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                              : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {activityVideos
                      .filter(
                        (v) =>
                          v.active &&
                          (activityDeptFilter === 'All' || v.department === activityDeptFilter)
                      )
                      .slice(0, 4)
                      .map((video) => {
                        const videoTitle = localizeDynamicText(video.titleBn, language);
                        return (
                          <article
                            key={video.id}
                            onClick={() =>
                              handleTriggerVideoModal({
                                title: videoTitle,
                                videoUrl: video.videoUrl,
                                subtitle: video.department === 'Academic' ? t.academic : t.hifz,
                                thumbnailUrl: video.thumbnailUrl,
                              })
                            }
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleTriggerVideoModal({
                                  title: videoTitle,
                                  videoUrl: video.videoUrl,
                                  subtitle: video.department === 'Academic' ? t.academic : t.hifz,
                                  thumbnailUrl: video.thumbnailUrl,
                                });
                              }
                            }}
                            className="group cursor-pointer flex flex-col gap-3.5"
                          >
                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 ring-1 ring-slate-900/10 dark:ring-white/10 shadow-md group-hover:shadow-xl transition-all duration-300">
                              <img
                                src={video.thumbnailUrl || '/assets/maharat/maharat-campus.jpg'}
                                alt={videoTitle}
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.src = '/assets/maharat/maharat-campus.jpg';
                                }}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/35 text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-slate-950 transition-all duration-300">
                                  <Play className="w-4 h-4 fill-current ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1 px-0.5">
                              <p className="text-xs font-semibold text-purple-700 dark:text-amber-300">
                                {video.department === 'Academic' ? t.academic : t.hifz}
                              </p>
                              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-purple-800 dark:group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                                {videoTitle}
                              </h3>
                            </div>
                          </article>
                        );
                      })}
                  </div>
                </div>
              </section>
            )}

            {/* 5. OUR CAMPUS — Full-Bleed Cinema Documentary Showcase */}
            {settings.pageVisibility?.campusVideo !== false && campusVideo?.active !== false && (
              <section
                id="campus"
                className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-t border-slate-200/70 dark:border-slate-800/80 transition-colors"
              >
                <div className="cii-container-media space-y-8 text-center">
                  <div className="space-y-3 max-w-2xl mx-auto">
                    <p
                      className={`text-xs sm:text-sm font-bold text-purple-700 dark:text-amber-300 ${
                        language === 'en' ? 'uppercase tracking-[0.16em]' : 'tracking-normal'
                      }`}
                    >
                      {campusVideo.badgeText || 'Discover Our Campus'}
                    </p>
                    <h2 className="cii-section-title font-extrabold tracking-tight text-slate-950 dark:text-white">
                      {language === 'bn' ? campusVideo.titleBn : t.ourCampus}
                    </h2>
                    <p className="text-base sm:text-[17px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {language === 'bn' ? campusVideo.subtitleBn : t.campusSubtitle}
                    </p>
                  </div>

                  <div
                    onClick={() =>
                      handleTriggerVideoModal({
                        title: (language === 'bn' ? campusVideo.titleBn : t.campusDocTitle) || '',
                        videoUrl: campusVideo.videoUrl,
                        subtitle: (language === 'bn' ? campusVideo.subtitleBn : t.campusDocDesc) || '',
                        thumbnailUrl: campusVideo.thumbnailUrl,
                      })
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleTriggerVideoModal({
                          title: (language === 'bn' ? campusVideo.titleBn : t.campusDocTitle) || '',
                          videoUrl: campusVideo.videoUrl,
                          subtitle: (language === 'bn' ? campusVideo.subtitleBn : t.campusDocDesc) || '',
                          thumbnailUrl: campusVideo.thumbnailUrl,
                        });
                      }
                    }}
                    className="group relative rounded-[28px] overflow-hidden ring-1 ring-slate-900/10 dark:ring-white/12 bg-slate-950 shadow-[0_28px_80px_-24px_rgba(15,23,42,0.4)] cursor-pointer aspect-video max-h-[560px] mx-auto w-full"
                  >
                    <img
                      src={campusVideo.thumbnailUrl || '/assets/maharat/maharat-campus.jpg'}
                      alt={campusVideo.titleBn || 'Campus Video'}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/maharat/maharat-campus.jpg';
                      }}
                      className="w-full h-full object-cover opacity-90 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex flex-col items-center justify-center p-6 text-white">
                      <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white group-hover:bg-white group-hover:text-slate-950 flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110">
                        <Play className="w-8 h-8 fill-current ml-1" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold mt-5 text-center max-w-xl">
                        {language === 'bn' ? campusVideo.titleBn : t.campusDocTitle}
                      </h3>
                      <p className="text-sm sm:text-base text-white/80 max-w-xl text-center mt-1.5 line-clamp-2">
                        {language === 'bn' ? campusVideo.subtitleBn : t.campusDocDesc}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 6. HIFZUL QURAN TREE PREVIEW (Signature Maharat Pride: 1st–24th Huffaz) */}
            {settings.pageVisibility?.hifzTree !== false && (
              <HifzQuranTreeSection
                previewMode={true}
                onNavigateToFullTree={() => navigateToPage('hifz-tree')}
                onOpenFramedPhoto={handleOpenFramedPhoto}
                onOpenAdmission={() => handleOpenAdmissionWithCourse()}
              />
            )}

            {/* 7. APPLE-GRADE MULTIMEDIA GALLERY PREVIEW */}
            {settings.pageVisibility?.photoGallery !== false && (
              <CategorizedPhotoGallerySection
                previewMode={true}
                onNavigateToFullGallery={() => navigateToPage('gallery')}
                onOpenFramedPhoto={handleOpenFramedPhoto}
                onOpenVideoModal={handleTriggerVideoModal}
              />
            )}
          </>
        )}

        {/* ===================================================================
            DEDICATED HIFZUL QURAN TREE PAGE ('/hifz-tree') & GALLERY ('/gallery')
           =================================================================== */}
        {currentPage === 'hifz-tree' && (
          <HifzQuranTreeSection
            previewMode={false}
            onOpenFramedPhoto={handleOpenFramedPhoto}
            onOpenAdmission={() => handleOpenAdmissionWithCourse()}
          />
        )}

        {currentPage === 'gallery' && (
          <CategorizedPhotoGallerySection
            previewMode={false}
            onOpenFramedPhoto={handleOpenFramedPhoto}
            onOpenVideoModal={handleTriggerVideoModal}
          />
        )}

        {/* ===================================================================
            DEDICATED INFOGRAPHICS PAGES:
            /education-method, /ten-year-plan, /daycare-routine, /transport,
            /admission-guide, /context, /feedback
           =================================================================== */}
        {currentPage === 'education-method' && (
          <MadrasahInfographicsSection
            mode="education-method"
            onNavigateToSection={() => navigateToPage('syllabus')}
          />
        )}

        {currentPage === 'ten-year-plan' && (
          <MadrasahInfographicsSection
            mode="ten-year-plan"
            onNavigateToSection={() => navigateToPage('syllabus')}
          />
        )}

        {currentPage === 'daycare-routine' && (
          <MadrasahInfographicsSection
            mode="daycare-routine"
            onNavigateToSection={() => navigateToPage('fees')}
          />
        )}

        {currentPage === 'transport' && (
          <MadrasahInfographicsSection
            mode="transport"
            onNavigateToSection={() => navigateToPage('fees')}
          />
        )}

        {currentPage === 'admission-guide' && (
          <MadrasahInfographicsSection
            mode="admission-extra"
            onNavigateToSection={() => navigateToPage('admission')}
          />
        )}

        {currentPage === 'context' && (
          <MadrasahInfographicsSection
            mode="about-context"
            onNavigateToSection={() => navigateToPage('admission')}
          />
        )}

        {currentPage === 'feedback' && (
          <MadrasahInfographicsSection
            mode="feedback"
            onNavigateToSection={() => navigateToPage('contact')}
          />
        )}

        {/* ===================================================================
            /curriculum — 6-PILLAR CURRICULUM, 12 IT SKILLS & 50+ SOFT SKILLS
           =================================================================== */}
        {currentPage === 'curriculum' && (
          <section className="py-14 lg:py-18 bg-white dark:bg-[#24023d] dark:bg-gradient-to-b dark:from-[#24023d] dark:via-[#310452] dark:to-[#1a012c] text-slate-900 dark:text-white transition-colors">
            <div className="cii-container-section space-y-16">
              {/* 6 Pillars */}
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-700 dark:text-amber-300">
                    {pageCopy.whyChooseBadge}
                  </p>
                  <h2 className="cii-section-title font-extrabold tracking-tight text-[#2e0249] dark:text-white">
                    {t.curriculumTitle}
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    {
                      icon: <BookOpen className="w-5 h-5" />,
                      badgeClass: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
                      title: t.curriculumPillar1,
                      desc: t.curriculumPillar1Desc,
                    },
                    {
                      icon: <GraduationCap className="w-5 h-5" />,
                      badgeClass: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300',
                      title: t.curriculumPillar2,
                      desc: t.curriculumPillar2Desc,
                    },
                    {
                      icon: <Globe className="w-5 h-5" />,
                      badgeClass: 'bg-pink-100 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300',
                      title: t.curriculumPillar3,
                      desc: t.curriculumPillar3Desc,
                    },
                    {
                      icon: <Cpu className="w-5 h-5" />,
                      badgeClass: 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
                      title: t.curriculumPillar4,
                      desc: t.curriculumPillar4Desc,
                    },
                    {
                      icon: <HeartHandshake className="w-5 h-5" />,
                      badgeClass: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',
                      title: t.curriculumPillar5,
                      desc: t.curriculumPillar5Desc,
                    },
                    {
                      icon: <Briefcase className="w-5 h-5" />,
                      badgeClass: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
                      title: t.curriculumPillar6,
                      desc: t.curriculumPillar6Desc,
                    },
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl bg-purple-50/50 dark:bg-white/5 border border-purple-200/80 dark:border-white/10 p-6 space-y-2.5 shadow-xs"
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.badgeClass}`}>
                        {p.icon}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{p.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200 leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 12 IT Skills Grid */}
              <div className="space-y-8 pt-6 border-t border-purple-200/60 dark:border-white/10">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-white/10 border border-purple-200 dark:border-white/20 flex items-center justify-center mx-auto">
                    <Code2 className="w-6 h-6 text-purple-700 dark:text-purple-200" />
                  </div>
                  <h2 className="cii-section-title font-extrabold tracking-tight text-[#2e0249] dark:text-white">
                    {t.itSkillsTitle}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-purple-200 max-w-xl mx-auto">
                    {t.itSkillsSubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {IT_SKILLS_GRID.map((skill, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-purple-50/60 dark:bg-white/8 border border-purple-200/80 dark:border-white/15 hover:border-purple-400 dark:hover:border-purple-300/50 transition-colors flex items-center gap-3.5"
                    >
                      <div className="w-9 h-9 rounded-lg bg-purple-700 dark:bg-purple-500/30 text-white dark:text-purple-200 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                        {localizeDigits(String(idx + 1).padStart(2, '0'), language)}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {language === 'ar'
                            ? skill.ar
                            : language === 'bn'
                              ? skill.bn
                              : skill.title}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-purple-200">
                          {language === 'en' ? skill.enSub : skill.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Soft & Hard Skills Interactive Explorer */}
              <div className="space-y-8 pt-6 border-t border-purple-200/60 dark:border-white/10">
                <div className="text-center space-y-2">
                  <h2 className="cii-section-title font-extrabold tracking-tight text-[#2e0249] dark:text-white">
                    {t.softSkillsTitle}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-purple-200 max-w-2xl mx-auto">
                    {t.softSkillsSubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-5 space-y-3">
                    {SOFT_HARD_SKILL_TRACKS.map((track, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setExpandedSoftTrack(idx)}
                        className={`w-full text-left rtl:text-right p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          expandedSoftTrack === idx
                            ? 'bg-purple-800 dark:bg-white text-white dark:text-purple-950 border-purple-800 dark:border-white shadow-md'
                            : 'bg-purple-50/70 dark:bg-white/8 text-slate-900 dark:text-white border-purple-200 dark:border-white/15 hover:bg-purple-100/70 dark:hover:bg-white/15'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-bold">
                            {language === 'ar'
                              ? track.ar
                              : language === 'bn'
                                ? track.bn
                                : track.category}
                          </div>
                          <div
                            className={`text-xs mt-0.5 ${
                              expandedSoftTrack === idx
                                ? 'text-purple-200 dark:text-purple-800'
                                : 'text-slate-600 dark:text-purple-200'
                            }`}
                          >
                            {language === 'en' ? track.enSub : track.category}
                          </div>
                        </div>
                        <span
                          className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md shrink-0 ${
                            expandedSoftTrack === idx
                              ? 'bg-white/20 dark:bg-purple-100 text-white dark:text-purple-900'
                              : 'bg-purple-200/70 dark:bg-white/10 text-purple-900 dark:text-purple-200'
                          }`}
                        >
                          {track.count[language]}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="lg:col-span-7 rounded-2xl bg-purple-50/70 dark:bg-white/10 border border-purple-200 dark:border-white/20 p-6 sm:p-8 space-y-5">
                    <div className="flex items-center justify-between border-b border-purple-200 dark:border-white/15 pb-4">
                      <div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-700 dark:text-amber-300">
                          Skill Module Track 0{expandedSoftTrack + 1}
                        </span>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                          {language === 'ar'
                            ? SOFT_HARD_SKILL_TRACKS[expandedSoftTrack].ar
                            : language === 'bn'
                              ? SOFT_HARD_SKILL_TRACKS[expandedSoftTrack].bn
                              : SOFT_HARD_SKILL_TRACKS[expandedSoftTrack].category}
                        </h3>
                      </div>
                      <span className="text-xs font-mono font-semibold text-purple-800 dark:text-purple-200">
                        {SOFT_HARD_SKILL_TRACKS[expandedSoftTrack].count[language]}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {SOFT_HARD_SKILL_TRACKS[expandedSoftTrack].skills.map((sk, sIdx) => (
                        <div
                          key={sIdx}
                          className="p-3.5 rounded-xl bg-white dark:bg-white/8 border border-purple-100 dark:border-white/10 flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-white shadow-2xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-300 shrink-0" />
                          <span>{sk[language]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            /activities — OUR ACTIVITIES VIDEO GALLERY & 7 CO-CURRICULAR PILLARS
           =================================================================== */}
        {currentPage === 'activities' && (
          <section className="py-14 lg:py-18 bg-white dark:bg-[#140124] text-slate-900 dark:text-white transition-colors">
            <div className="cii-container-section space-y-12">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-700 dark:text-amber-300">
                    Co-Curricular &amp; Classroom Excellence
                  </p>
                  <h2 className="cii-section-title font-extrabold tracking-tight text-[#2e0249] dark:text-white">
                    {t.activitiesTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-purple-200 max-w-2xl">
                    {t.activitiesSubtitle}
                  </p>
                </div>

                <div className="inline-flex rounded-xl bg-purple-100 dark:bg-white/10 p-1 border border-purple-200 dark:border-white/15 self-start md:self-auto">
                  {[
                    { id: 'All' as const, label: pageCopy.allDepts },
                    { id: 'Academic' as const, label: t.academic },
                    { id: 'Hifz' as const, label: t.hifz },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActivityDeptFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        activityDeptFilter === tab.id
                          ? 'bg-fuchsia-600 text-white shadow-xs'
                          : 'text-purple-900 dark:text-purple-200 hover:text-purple-950 dark:hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {activityVideos
                  .filter(
                    (v) =>
                      v.active &&
                      (activityDeptFilter === 'All' || v.department === activityDeptFilter)
                  )
                  .map((video) => {
                    const videoTitle = localizeDynamicText(video.titleBn, language);
                    const hasActVideo = hasValidVideoUrl(video.videoUrl);
                    return (
                      <div
                        key={video.id}
                        onClick={() =>
                          handleTriggerVideoModal({
                            title: videoTitle,
                            videoUrl: video.videoUrl,
                            subtitle:
                              video.department === 'Academic' ? t.academic : t.hifz,
                          })
                        }
                        className="group rounded-2xl bg-white dark:bg-[#1e0338]/90 border border-purple-200/80 dark:border-purple-500/35 hover:border-fuchsia-500 dark:hover:border-amber-300/70 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div className="relative aspect-video bg-slate-950 overflow-hidden">
                          <img
                            src={video.thumbnailUrl || '/assets/maharat/maharat-campus.jpg'}
                            alt={videoTitle}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/maharat/maharat-campus.jpg';
                            }}
                            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-fuchsia-600/95 group-hover:bg-amber-400 text-white group-hover:text-slate-950 flex items-center justify-center shadow-lg transition-all group-hover:scale-110 ring-2 ring-white/40">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 text-[10px] font-bold text-amber-300 border border-white/15">
                            {video.department === 'Academic' ? t.academic : t.hifz}
                          </span>
                        </div>
                        <div className="p-4 flex items-center justify-between gap-2">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {videoTitle}
                          </h3>
                          <span className="text-[11px] font-bold text-fuchsia-600 dark:text-amber-300 shrink-0 group-hover:underline">
                            {hasActVideo ? `${pageCopy.playVideo} →` : pageCopy.videoComingSoon}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {ACTIVITIES_LIST.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-purple-50/70 dark:bg-[#1e0338]/90 border border-purple-200/80 dark:border-purple-500/35 hover:border-purple-400 transition-all space-y-2"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 flex items-center justify-center font-mono text-xs font-extrabold">
                      {localizeDigits(String(idx + 1).padStart(2, '0'), language)}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {act.title[language]}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-purple-200 leading-relaxed">
                      {act.desc[language]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            GUARDIAN REVIEWS — APPLE-GRADE CINEMA CAROUSEL (Home & '/reviews')
           =================================================================== */}
        {(currentPage === 'home' || currentPage === 'reviews') && (
          <section
            id="guardian-reviews"
            className="py-16 sm:py-20 lg:py-24 bg-slate-50 dark:bg-[#0d0118] text-slate-900 dark:text-white border-t border-slate-200/70 dark:border-slate-800/80 transition-colors"
          >
            <div className="cii-container-section space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2.5 max-w-2xl">
                  <p
                    className={`text-xs sm:text-sm font-bold text-purple-700 dark:text-amber-300 ${
                      language === 'en' ? 'uppercase tracking-[0.16em]' : 'tracking-normal'
                    }`}
                  >
                    {pageCopy.guardianReelsBadge}
                  </p>
                  <h2 className="cii-section-title font-extrabold tracking-tight text-slate-950 dark:text-white">
                    {language === 'bn'
                      ? 'সম্মানিত অভিভাবকদের অনুভূতি'
                      : pageCopy.guardianReelsTitle}
                  </h2>
                  <p className="text-base sm:text-[17px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    {pageCopy.guardianReelsSub}
                  </p>
                </div>

                {/* Minimal Apple-grade Carousel Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollGuardianReels('prev')}
                    aria-label="Previous Guardian Review"
                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGuardianAutoScrolling((prev) => !prev)}
                    aria-label={isGuardianAutoScrolling ? 'Pause auto scroll' : 'Resume auto scroll'}
                    className="px-4 h-10 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                  >
                    {isGuardianAutoScrolling ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>{pageCopy.autoScrollOn}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>{pageCopy.autoScrollOff}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollGuardianReels('next')}
                    aria-label="Next Guardian Review"
                    className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div
                ref={guardianScrollRef}
                onMouseEnter={() => setIsGuardianAutoScrolling(false)}
                onMouseLeave={() => setIsGuardianAutoScrolling(true)}
                className="flex items-stretch gap-6 overflow-x-auto pb-4 pt-1 no-scrollbar snap-x snap-mandatory"
              >
                {guardianReels
                  .filter((r) => r.active)
                  .map((reel) => {
                    const reelRelation = localizeDynamicText(reel.guardianRelationBn, language);
                    const reelTitle = localizeDynamicText(reel.titleBn, language);
                    const modalTitle =
                      reelTitle.includes(reelRelation) || reelRelation === reelTitle
                        ? reelTitle
                        : `${reelRelation} — ${reelTitle}`;
                    const hasReelVideo = hasValidVideoUrl(reel.videoUrl);
                    return (
                      <article
                        key={reel.id}
                        onClick={() =>
                          handleTriggerVideoModal({
                            title: modalTitle,
                            videoUrl: reel.videoUrl,
                            subtitle: pageCopy.guardianReelsTitle,
                            isVertical: false,
                            thumbnailUrl: reel.thumbnailUrl,
                          })
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleTriggerVideoModal({
                              title: modalTitle,
                              videoUrl: reel.videoUrl,
                              subtitle: pageCopy.guardianReelsTitle,
                              isVertical: false,
                              thumbnailUrl: reel.thumbnailUrl,
                            });
                          }
                        }}
                        className="group w-[320px] sm:w-[380px] shrink-0 snap-start rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-[0_24px_48px_-16px_rgba(46,2,73,0.22)] transition-all duration-300 cursor-pointer flex flex-col"
                      >
                        {/* Clean Edge-to-Edge 16:9 Cinema Frame (Zero fake monitor chrome) */}
                        <div className="relative aspect-video bg-slate-900 overflow-hidden">
                          <img
                            src={reel.thumbnailUrl || '/assets/maharat/maharat-campus.jpg'}
                            alt={reelTitle}
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.src = '/assets/maharat/maharat-campus.jpg';
                            }}
                            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent flex items-center justify-center">
                            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-white group-hover:bg-white group-hover:text-slate-950 flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-300">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[11px] font-medium text-white/95">
                            {hasReelVideo ? pageCopy.playVideo : pageCopy.videoComingSoon}
                          </span>
                        </div>

                        {/* Clean Editorial Card Body */}
                        <div className="p-5 sm:p-6 space-y-2 flex-1 flex flex-col justify-between text-left rtl:text-right">
                          <div className="space-y-1.5">
                            <p className="text-xs sm:text-[13px] font-semibold text-purple-700 dark:text-amber-300">
                              {reelRelation}
                            </p>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-800 dark:group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                              {reelTitle}
                            </h3>
                          </div>
                        </div>
                      </article>
                    );
                  })}
              </div>
            </div>
          </section>
        )}

        {/* HOME CONVERSION SECTIONS: Virtual Office Hybrid Live Desk + 1-Minute Registration Split + 5-Category Tabbed FAQ */}
        {currentPage === 'home' && (
          <>
            <section className="py-10 sm:py-12 bg-slate-50 dark:bg-slate-950 border-t border-slate-200/70 dark:border-slate-800/80">
              <div className="cii-container-section">
                <VirtualOfficeDeskCard />
              </div>
            </section>
            <HomeRegistrationSplitSection
              onOpenFullAdmission={() => handleOpenAdmissionWithCourse()}
            />
            <HomeCategorizedFaqSection />
          </>
        )}

        {/* ===================================================================
            /admission — ONLINE REGISTRATION & 6-STEP ADMISSION FORM
           =================================================================== */}
        {currentPage === 'admission' && (
          <section
            id="registration-section"
            className="py-16 lg:py-20 bg-[#f6f3fb] dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors"
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
              <div className="text-center space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-200 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.regSectionBadge}</span>
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                  {t.regSectionTitle}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                  {t.regSectionSubtitle}
                </p>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#6b21a8] p-5 sm:p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg border border-purple-500/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                    <FileText className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold">{t.regBannerTitle}</h4>
                    <p className="text-xs sm:text-sm text-purple-200 mt-0.5">
                      {t.regBannerSubtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAdmissionWithCourse()}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap cursor-pointer shrink-0 shadow-md flex items-center justify-center gap-2"
                >
                  <span>{t.regBannerBtn}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              <RegistrationFormModal isOpen={true} inlineMode={true} onClose={() => {}} />
            </div>
          </section>
        )}

        {/* ===================================================================
            /fees — FEES STRUCTURE + INTERACTIVE FEE & DISCOUNT CALCULATOR
           =================================================================== */}
        {currentPage === 'fees' && (
          <section
            id="fees"
            className="py-16 lg:py-20 bg-purple-50/50 dark:bg-[#1a012e] text-slate-900 dark:text-white border-b border-purple-100 dark:border-transparent transition-colors"
          >
            <div className="cii-container-section space-y-16">
              <div className="space-y-10">
                <div className="text-center max-w-3xl mx-auto space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-purple-700 dark:text-amber-300">
                    Academic &amp; Hifz Fee Structure
                  </p>
                  <h2 className="cii-section-title font-extrabold tracking-tight text-[#2e0249] dark:text-white">
                    {t.feeOverviewTitle}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-purple-200">
                    {t.feeOverviewSubtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {FEE_CARDS.map((card, index) => (
                    <div
                      key={index}
                      className="rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-6 shadow-xl border border-purple-200 dark:border-purple-800/70 flex flex-col justify-between space-y-5 transition-colors"
                    >
                      <div className="space-y-4">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                            {card.subtitle}
                          </span>
                          <h3 className="text-lg font-extrabold text-[#2e0249] dark:text-white mt-0.5">
                            {card.title[language]}
                          </h3>
                        </div>

                        <div className="space-y-2.5">
                          {card.items.map((row, rIdx) => (
                            <div
                              key={rIdx}
                              className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-800/60 flex items-center justify-between text-xs sm:text-sm"
                            >
                              <span className="font-medium text-slate-700 dark:text-slate-200">
                                {row.label[language]}
                              </span>
                              <span className="font-extrabold text-purple-950 dark:text-amber-300 font-mono">
                                {language === 'en'
                                  ? `BDT ${localizeDigits(row.amount, 'en')}/-`
                                  : language === 'ar'
                                    ? `${localizeDigits(row.amount, 'ar')} تاكا`
                                    : `৳ ${localizeDigits(row.amount, 'bn')}/-`}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <a
                        href="#fee-calculator"
                        className="w-full py-2.5 px-4 rounded-xl bg-[#4c0575] hover:bg-[#3b035c] text-white font-semibold text-xs transition-colors text-center block"
                      >
                        {pageCopy.calcTotalWithDiscount} &rarr;
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              <InteractiveFeeCalculator />
            </div>
          </section>
        )}

        {/* ===================================================================
            /syllabus — ACADEMIC CLASSES & SUBJECT-WISE SYLLABUS
           =================================================================== */}
        {currentPage === 'syllabus' && (
          <section
            id="courses"
            className="py-14 lg:py-18 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors"
          >
            <div className="cii-container-section space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    {pageCopy.classesBadge}
                  </p>
                  <h2 className="cii-section-title font-extrabold text-slate-900 dark:text-white">
                    {pageCopy.classesTitle}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                    {pageCopy.classesSub}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/80 dark:bg-slate-800 rounded-xl">
                  {COURSE_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCourseCategory(cat)}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedCourseCategory === cat
                          ? 'bg-purple-700 text-white shadow-sm'
                          : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat === 'All'
                        ? pageCopy.allDepts
                        : cat === 'Academic'
                          ? pageCopy.academicClasses
                          : cat === 'Hifzul Quran'
                            ? pageCopy.hifzDept
                            : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => {
                  const localizedCourseTitle = course.titleBn
                    ? localizeDynamicText(course.titleBn, language)
                    : course.title;
                  const localizedOverview = localizeDynamicText(course.overview, language);
                  const localizedFee = localizeDynamicText(course.fee, language);
                  const localizedAdmFee = course.admissionFee
                    ? localizeDynamicText(course.admissionFee, language)
                    : '';
                  return (
                    <article
                      key={course.id}
                      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 transition-all flex flex-col justify-between overflow-hidden shadow-xs"
                    >
                      <div>
                        <div className="bg-gradient-to-r from-[#2e0249] to-[#581c87] p-5 text-white">
                          <div className="flex items-center justify-between gap-2 text-xs text-purple-200 mb-2">
                            <span>{course.category}</span>
                            <span>·</span>
                            <span className="font-mono">{course.duration}</span>
                          </div>
                          <h3 className="text-lg font-bold leading-snug">
                            {language === 'en' ? course.title : localizedCourseTitle}
                          </h3>
                          {language === 'bn' && course.title && (
                            <p className="text-xs text-purple-200 mt-1">{course.title}</p>
                          )}
                        </div>

                        <div className="p-5 space-y-4">
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                            {localizedOverview}
                          </p>

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-mono">
                            <span>
                              {pageCopy.annualPeriods} {localizeDigits(course.totalClasses, language)}
                            </span>
                            <span>·</span>
                            <span>
                              {pageCopy.subjectsCount} {localizeDigits(course.modules.length, language)}
                            </span>
                          </div>

                          <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800/60 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                                {pageCopy.monthlyFeeLabel}
                              </span>
                              <span className="text-sm font-bold text-purple-950 dark:text-purple-200 font-mono">
                                {localizedFee}
                              </span>
                            </div>
                            {localizedAdmFee && (
                              <div className="text-right rtl:text-left">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                                  {pageCopy.admissionFeeLabel}
                                </span>
                                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                  {localizedAdmFee}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-2 flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setActiveCourseModal(course)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {pageCopy.viewSyllabusBtn} ({localizeDigits(course.modules.length, language)})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAdmissionWithCourse(course.id)}
                          className="py-2.5 px-3.5 rounded-xl bg-purple-100 dark:bg-purple-950/70 hover:bg-purple-200 dark:hover:bg-purple-900/90 text-purple-900 dark:text-purple-200 text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {pageCopy.applyBtn}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {(currentPage === 'syllabus' || currentPage === 'notices') && (
          <ExamScheduleAndSmartCampusSection
            onOpenAdmission={() => handleOpenAdmissionWithCourse()}
          />
        )}

        {/* ===================================================================
            /about — OUR SPECIALTIES & MISSION (15 PILLARS)
           =================================================================== */}
        {currentPage === 'about' && (
          <section
            id="about"
            className="py-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors"
          >
            <div className="cii-container-section space-y-10">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  Our Identity &amp; Mission
                </p>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                  {t.aboutTitle}
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  {t.aboutSubtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SPECIALTIES_LIST.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-purple-50/50 dark:bg-slate-800/70 border border-purple-200/70 dark:border-slate-800 flex items-start gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-purple-700 dark:text-amber-300 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                      {item[language]}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-[#3b0764] via-[#581c87] to-[#6b21a8] p-8 sm:p-10 text-center text-white space-y-5 shadow-lg">
                <p className="text-xl sm:text-2xl font-bold max-w-3xl mx-auto leading-snug">
                  {pageCopy.aboutQuote}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigateToPage('context')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-sm hover:bg-amber-300 transition-colors cursor-pointer"
                  >
                    <span>
                      {language === 'bn'
                        ? 'প্রতিষ্ঠার প্রেক্ষাপট ও ইউনিফর্ম দেখুন'
                        : language === 'ar'
                          ? 'خلفية التأسيس والزي المدرسي'
                          : 'View Institutional Context & Uniform'}
                    </span>
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateToPage('contact')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-purple-950 font-bold text-sm hover:bg-purple-50 transition-colors cursor-pointer"
                  >
                    {t.navContact}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            /notices — DYNAMIC NOTICE BOARD & CIRCULARS
           =================================================================== */}
        {currentPage === 'notices' && (
          <section
            id="notices"
            className="py-16 lg:py-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    Institute Notice Board
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                    {t.noticesTitle}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {t.noticesSubtitle}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <input
                    type="text"
                    value={noticeSearch}
                    onChange={(e) => setNoticeSearch(e.target.value)}
                    placeholder={t.noticesSearch}
                    aria-label="Search notices"
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-purple-600"
                  />
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    {NOTICE_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedNoticeCategory(cat)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          selectedNoticeCategory === cat
                            ? 'bg-purple-700 text-white'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                      >
                        {cat === 'All' ? t.noticesAll : cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredNotices.length === 0 ? (
                <div className="p-10 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
                  {pageCopy.noNotices}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {filteredNotices.map((notice) => (
                    <div
                      key={notice.id}
                      className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 transition-colors flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <span className="font-bold text-purple-800 dark:text-purple-300">
                            {notice.category}
                          </span>
                          <span>Published: {localizeDigits(notice.publishDate, language)}</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                          {localizeDynamicText(notice.title, language)}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {localizeDynamicText(notice.description, language)}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveNoticeModal(notice)}
                          className="text-xs font-bold text-purple-800 dark:text-purple-300 hover:text-purple-950 dark:hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{pageCopy.readFullNotice}</span>
                        </button>

                        {notice.attachmentUrl && (
                          <a
                            href={notice.attachmentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-purple-800 dark:hover:text-purple-300 inline-flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===================================================================
            FAQs Section (Shown on '/reviews')
           =================================================================== */}
        {currentPage === 'reviews' && (
          <section className="py-16 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
              <div className="text-center space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  {pageCopy.faqBadge}
                </p>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {pageCopy.faqTitle}
                </h2>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { key: 'ALL', label: pageCopy.allFaq },
                  {
                    key: 'Admission & Fees',
                    label:
                      language === 'bn'
                        ? 'ভর্তি ও ফি'
                        : language === 'ar'
                          ? 'القبول والرسوم'
                          : 'Admission & Fees',
                  },
                  {
                    key: 'Academic & Curriculum',
                    label:
                      language === 'bn'
                        ? 'একাডেমিক ও কারিকুলাম'
                        : language === 'ar'
                          ? 'المنهج والدراسة'
                          : 'Academic & Curriculum',
                  },
                  {
                    key: 'Care & Transport',
                    label:
                      language === 'bn'
                        ? 'আবাসন ও নিরাপত্তা'
                        : language === 'ar'
                          ? 'الرعاية والنقل'
                          : 'Care & Transport',
                  },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedFaqCategory(cat.key)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedFaqCategory === cat.key
                        ? 'bg-purple-700 text-white'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                        className="w-full px-5 py-4 text-left rtl:text-right flex items-center justify-between gap-4 cursor-pointer"
                      >
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {faq.q[language]}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-purple-600 shrink-0 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                          {faq.a[language]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ===================================================================
            /career — CAREER & RECRUITMENT PORTAL (TEACHERS & STAFF)
           =================================================================== */}
        {currentPage === 'career' && (
          <CareerPortalPage onNavigateContact={() => navigateToPage('contact')} />
        )}

        {/* ===================================================================
            /blog — OFFICIAL INSTITUTIONAL BLOG & ARTICLES
           =================================================================== */}
        {currentPage === 'blog' && <BlogPortalPage />}

        {/* ===================================================================
            /contact — SPLIT CONTACT PORTAL + VIRTUAL OFFICE DESK + DUAL GOOGLE MAPS
           =================================================================== */}
        {currentPage === 'contact' && (() => {
          const boysMapUrl = settings.boysCampusMapUrl || DEFAULT_BOYS_CAMPUS_MAP_URL;
          const boysEmbedUrl = resolveGoogleMapsEmbedUrl(
            settings.boysCampusMapEmbedUrl || boysMapUrl,
            DEFAULT_BOYS_CAMPUS_EMBED_URL
          );
          const girlsMapUrl = settings.girlsCampusMapUrl || DEFAULT_GIRLS_CAMPUS_MAP_URL;
          const girlsEmbedUrl = resolveGoogleMapsEmbedUrl(
            settings.girlsCampusMapEmbedUrl || girlsMapUrl,
            DEFAULT_GIRLS_CAMPUS_EMBED_URL
          );

          return (
            <section
              id="contact"
              className="py-14 lg:py-20 bg-slate-50 dark:bg-[#071129] transition-colors"
            >
              <div className="cii-container-section space-y-12">
                <VirtualOfficeDeskCard />
                {/* Split Card: Left Maharat Official Navy-Teal Info Panel + Right Crisp White Message Form */}
                <div className="rounded-[28px] overflow-hidden shadow-[0_28px_80px_-24px_rgba(10,23,56,0.28)] border border-[#192f64]/15 dark:border-[#007c91]/35 bg-white dark:bg-slate-900 grid grid-cols-1 lg:grid-cols-12">
                  {/* Left Maharat Official Logo Gradient Contact Panel */}
                  <div className="lg:col-span-5 bg-gradient-to-br from-[#071129] via-[#192f64] to-[#005a6e] text-white p-7 sm:p-10 flex flex-col justify-between gap-8 relative overflow-hidden">
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 rounded-full bg-[#0ea5b7]/20 blur-3xl pointer-events-none" />
                    <div className="relative z-10 space-y-6">
                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-[#f0c95e]/35 text-[11px] font-bold text-[#f0c95e]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>
                            {language === 'bn'
                              ? 'মাহারাত মডেল মাদ্রাসা · উত্তরা সেক্টর-১২'
                              : language === 'ar'
                                ? 'مدرسة المهارات النموذجية · أوتارا قطاع ١٢'
                                : 'Maharat Model Madrasah · Uttara Sector-12'}
                          </span>
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                          {t.contactTitle}
                        </h2>
                        <p className="text-sm text-sky-100/85 leading-relaxed">
                          {t.contactSubtitle}
                        </p>
                      </div>

                      <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.07] border border-white/10">
                          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/25 text-amber-300 flex items-center justify-center shrink-0">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-purple-200/80">{t.contactPhone}</div>
                            <a
                              href="tel:01886340308"
                              className="block text-base font-extrabold text-white font-mono hover:text-amber-300 transition-colors mt-0.5"
                            >
                              {localizeDynamicText(settings.phonePrimary, language)}
                            </a>
                            <div className="text-xs text-purple-200/90 font-mono mt-0.5">
                              {localizeDynamicText(settings.phoneSecondary, language)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.07] border border-white/10">
                          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/25 text-amber-300 flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-purple-200/80">{t.contactEmail}</div>
                            <a
                              href={`mailto:${settings.email}`}
                              className="block text-sm font-bold text-white font-mono hover:text-amber-300 mt-0.5"
                            >
                              {settings.email}
                            </a>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.07] border border-white/10">
                          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/25 text-amber-300 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div className="space-y-1.5">
                            <div className="text-xs font-semibold text-purple-200/80">{t.contactAddress}</div>
                            <div className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                              <span className="text-amber-300">
                                {language === 'bn' ? 'বয়েজ ও মেইন ক্যাম্পাস: ' : 'Boys & Main Campus: '}
                              </span>
                              {language === 'bn'
                                ? 'বাড়ি-১১, রোড-১৯, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০'
                                : 'House#11, Road#19, Sector-12, Uttara, Dhaka-1230'}
                            </div>
                            <div className="text-xs sm:text-[13px] font-semibold text-purple-100 leading-snug">
                              <span className="text-amber-300">
                                {language === 'bn' ? 'গার্লস ক্যাম্পাস ও মূল অফিস: ' : 'Girls Campus & Office: '}
                              </span>
                              {language === 'bn'
                                ? 'বাড়ি-০৭, রোড-১৭/এ, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০'
                                : 'House#07, Road#17/A, Sector-12, Uttara, Dhaka-1230'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.07] border border-white/10">
                          <div className="w-10 h-10 rounded-xl bg-fuchsia-500/25 text-amber-300 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-purple-200/80">
                              {t.contactOfficeHours}
                            </div>
                            <div className="text-sm font-bold text-white mt-0.5">
                              {localizeDynamicText(settings.officeHours, language)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Social Channel Quick Buttons */}
                    <div className="relative z-10 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2.5">
                      <a
                        href="https://www.facebook.com/maharatmodelmadrasah"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                      >
                        Facebook
                      </a>
                      <a
                        href="https://www.youtube.com/@maharatmodelmadrasa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                      >
                        YouTube
                      </a>
                      <a
                        href={`https://wa.me/88${(settings.whatsappNumber || '01886340308').replace(/[^0-9]/g, '').replace(/^88/, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/30 text-xs font-bold text-emerald-200 transition-colors"
                      >
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  {/* Right Crisp White Message Form ("একটি বার্তা পাঠান") */}
                  <div className="lg:col-span-7 p-7 sm:p-10 bg-white dark:bg-slate-900">
                    <div className="mb-6">
                      <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                        {language === 'bn'
                          ? 'একটি বার্তা পাঠান'
                          : language === 'ar'
                            ? 'أرسل رسالة مباشرة'
                            : 'Send Us a Message'}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {t.inquiryFormSubtitle}
                      </p>
                    </div>

                    {inqError && (
                      <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                        {inqError}
                      </div>
                    )}

                    {inqSuccess && (
                      <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm text-emerald-800 dark:text-emerald-200 font-semibold flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>{inqSuccess}</span>
                      </div>
                    )}

                    <form onSubmit={handleQuickInquirySubmit} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="inq-name"
                            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                          >
                            {t.regFormStudentName}
                          </label>
                          <input
                            id="inq-name"
                            type="text"
                            value={inqName}
                            onChange={(e) => setInqName(e.target.value)}
                            placeholder={language === 'bn' ? 'আপনার / শিক্ষার্থীর নাম' : 'Full Name'}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 text-sm focus:border-purple-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="inq-phone"
                            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                          >
                            {t.regFormPhone}
                          </label>
                          <input
                            id="inq-phone"
                            type="tel"
                            value={inqPhone}
                            onChange={(e) => setInqPhone(e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 text-sm focus:border-purple-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="inq-email"
                            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                          >
                            {t.regFormEmail}
                          </label>
                          <input
                            id="inq-email"
                            type="email"
                            value={inqEmail}
                            onChange={(e) => setInqEmail(e.target.value)}
                            placeholder="parent@example.com"
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 text-sm focus:border-purple-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
                            required
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="inq-course"
                            className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                          >
                            {t.regFormClass}
                          </label>
                          <select
                            id="inq-course"
                            value={inqCourseId}
                            onChange={(e) => setInqCourseId(e.target.value)}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 text-sm focus:border-purple-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
                          >
                            {courses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {language === 'en'
                                  ? c.title
                                  : localizeDynamicText(c.titleBn || c.title, language)}{' '}
                                ({localizeDynamicText(c.fee, language)})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="inq-message"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
                        >
                          {t.regFormNotes}
                        </label>
                        <textarea
                          id="inq-message"
                          rows={4}
                          value={inqMessage}
                          onChange={(e) => setInqMessage(e.target.value)}
                          placeholder={
                            language === 'bn'
                              ? 'ভর্তি, আবাসিক, পরিবহন বা যেকোনো প্রশ্ন এখানে লিখুন...'
                              : 'Write your message or question here...'
                          }
                          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-4 py-3 text-sm focus:border-purple-600 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-colors"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#192f64] via-[#005a6e] to-[#007c91] hover:opacity-95 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-[#192f64]/25 transition-all cursor-pointer"
                      >
                        <Send className="w-4 h-4 text-[#f0c95e]" />
                        <span>{t.inquiryFormSendBtn}</span>
                      </button>
                    </form>
                  </div>
                </div>

                {/* Dual Interactive Google Maps Campus Showcase (Admin-Controlled via Settings) */}
                <div className="space-y-6">
                  <div className="text-center max-w-2xl mx-auto space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#005a6e]/12 dark:bg-[#005a6e]/35 text-[#005a6e] dark:text-[#f0c95e] text-xs font-bold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {language === 'bn'
                          ? 'গুগল ম্যাপে সরাসরি ক্যাম্পাস লোকেশন'
                          : language === 'ar'
                            ? 'مواقع الحرمين على خرائط جوجل'
                            : 'Live Interactive Google Maps Locations'}
                      </span>
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
                      {language === 'bn'
                        ? 'আমাদের দুটি ক্যাম্পাসের অবস্থান (উত্তরা সেক্টর-১২)'
                        : language === 'ar'
                          ? 'موقعا الحرم التعليمي في أوتارا قطاع ١٢'
                          : 'Our Two Uttara Sector-12 Campuses'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Campus 1: Boys & Main Campus (Verified Link: https://maps.app.goo.gl/SxcrUPWtW8VbSYdEA) */}
                    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#192f64]/15 dark:border-[#007c91]/35 overflow-hidden shadow-lg flex flex-col">
                      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#0a1738] via-[#192f64] to-[#1e4280] text-white flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#f0c95e]">
                            {language === 'bn' ? 'ক্যাম্পাস ০১ · ভেরিফায়েড লোকেশন' : 'Campus 01 · Verified Pin'}
                          </div>
                          <h4 className="text-lg font-extrabold mt-0.5">
                            {language === 'bn'
                              ? 'বয়েজ ও মেইন ক্যাম্পাস (মাহারাত মডেল মাদ্রাসা)'
                              : 'Boys & Main Campus (Maharat Model Madrasah)'}
                          </h4>
                          <p className="text-xs text-sky-100/85 mt-1">
                            {language === 'bn'
                              ? 'বাড়ি-১১, রোড-১৯, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০'
                              : 'House#11, Road#19, Sector-12, Uttara, Dhaka-1230'}
                          </p>
                        </div>
                        <a
                          href={boysMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#f0c95e] hover:bg-[#fae08c] text-[#08132e] text-xs font-extrabold transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'Google Maps-এ দেখুন' : 'Open in Google Maps'}</span>
                        </a>
                      </div>
                      <div className="relative h-72 sm:h-80 w-full bg-slate-100 dark:bg-slate-800">
                        <iframe
                          title="Maharat Model Madrasah Boys & Main Campus Map"
                          src={boysEmbedUrl}
                          className="w-full h-full border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                        />
                      </div>
                    </div>

                    {/* Campus 2: Girls Campus & Main Office */}
                    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-[#005a6e]/20 dark:border-[#007c91]/35 overflow-hidden shadow-lg flex flex-col">
                      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#004454] via-[#005a6e] to-[#007c91] text-white flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-[#f0c95e]">
                            {language === 'bn' ? 'ক্যাম্পাস ০২ · বালিকা শাখা ও অফিস' : 'Campus 02 · Girls Wing & Office'}
                          </div>
                          <h4 className="text-lg font-extrabold mt-0.5">
                            {language === 'bn'
                              ? 'গার্লস ক্যাম্পাস ও মূল ভর্তি অফিস'
                              : 'Girls Campus & Main Admission Office'}
                          </h4>
                          <p className="text-xs text-sky-100/85 mt-1">
                            {language === 'bn'
                              ? 'বাড়ি-০৭, রোড-১৭/এ, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০'
                              : 'House#07, Road#17/A, Sector-12, Uttara, Dhaka-1230'}
                          </p>
                        </div>
                        <a
                          href={girlsMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-sky-50 text-[#0a1738] text-xs font-extrabold transition-colors shrink-0"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{language === 'bn' ? 'Google Maps-এ দেখুন' : 'Open in Google Maps'}</span>
                        </a>
                      </div>
                      <div className="relative h-72 sm:h-80 w-full bg-slate-100 dark:bg-slate-800">
                        <iframe
                          title="Maharat Model Madrasah Girls Campus & Main Office Map"
                          src={girlsEmbedUrl}
                          className="w-full h-full border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}
      </main>

      {/* Reorganized Executive 4-Column Institutional Footer in Maharat Official Logo Gradient */}
      <footer className="relative overflow-hidden bg-gradient-to-br from-[#071129] via-[#11234e] to-[#003b49] text-slate-200 border-t border-[#c4962c]/35 pt-16 pb-24 lg:pb-10 transition-colors">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#192f64] via-[#d4a843] to-[#005a6e] pointer-events-none"
        />

        <div className="relative z-10 cii-container-section">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/15">
            {/* Column 1 (4 Cols): Official Maharat Identity + Vibrant Social Media Icons */}
            <div className="lg:col-span-4 space-y-4">
              {settings.logoUrl ? (
                <div className="inline-block bg-white rounded-2xl p-2.5 shadow-lg border border-[#c4962c]/40">
                  <img
                    src={settings.logoUrl}
                    alt={settings.instituteNameBn || settings.instituteName}
                    className="h-12 sm:h-14 w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2.5 text-lg font-extrabold text-white">
                  <span className="w-9 h-9 rounded-xl bg-[#005a6e] text-[#f0c95e] flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </span>
                  <span>
                    {language === 'bn'
                      ? settings.instituteNameBn
                      : language === 'en'
                        ? settings.instituteName
                        : settings.instituteNameAr || t.instituteName}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold text-[#f0c95e]">
                <span className="px-2.5 py-1 rounded-md bg-white/10 border border-[#f0c95e]/30">
                  EIIN: {settings.eiinNumber || '140630'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-white/10 border border-[#0ea5b7]/35 text-sky-200">
                  MC: {settings.madrasahCode || '21023'}
                </span>
              </div>

              <p className="text-sm text-sky-100/80 leading-relaxed">{t.footerAbout}</p>

              {/* Vibrant Branded Social Media Icon Row */}
              <div className="pt-2 space-y-2">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#f0c95e]">
                  {language === 'bn'
                    ? 'অফিশিয়াল সোশ্যাল মিডিয়ায় যুক্ত হোন'
                    : language === 'ar'
                      ? 'تابعنا على وسائل التواصل'
                      : 'Connect on Official Channels'}
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={settings.facebookUrl || 'https://www.facebook.com/maharatmodelmadrasah'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook Official Page"
                    title="Facebook"
                    className="w-10 h-10 rounded-xl bg-[#1877F2] hover:bg-[#1465d1] text-white flex items-center justify-center shadow-md transition-transform hover:-translate-y-0.5"
                  >
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a
                    href={settings.youtubeUrl || 'https://www.youtube.com/@maharatmodelmadrasa'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube Official Channel"
                    title="YouTube"
                    className="w-10 h-10 rounded-xl bg-[#FF0000] hover:bg-[#dc2626] text-white flex items-center justify-center shadow-md transition-transform hover:-translate-y-0.5"
                  >
                    <Youtube className="w-5 h-5" />
                  </a>
                  <a
                    href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '') || '8801886340308'}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp Direct Helpline"
                    title="WhatsApp"
                    className="w-10 h-10 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-[#08132e] flex items-center justify-center shadow-md transition-transform hover:-translate-y-0.5"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                  <a
                    href={settings.boysCampusMapUrl || DEFAULT_BOYS_CAMPUS_MAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Google Maps Location"
                    title="Google Maps"
                    className="w-10 h-10 rounded-xl bg-[#f0c95e] hover:bg-[#fae08c] text-[#08132e] flex items-center justify-center shadow-md transition-transform hover:-translate-y-0.5"
                  >
                    <MapPin className="w-5 h-5" />
                  </a>
                  <a
                    href={`mailto:${settings.email}`}
                    aria-label="Send Official Email"
                    title="Email"
                    className="w-10 h-10 rounded-xl bg-[#007c91] hover:bg-[#0ea5b7] text-white flex items-center justify-center shadow-md transition-transform hover:-translate-y-0.5"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Column 2 (2 Cols): Academics & Madrasah Programs */}
            <div className="lg:col-span-2 space-y-3.5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#f0c95e]">
                {language === 'bn'
                  ? 'একাডেমিক ও প্রোগ্রাম'
                  : language === 'ar'
                    ? 'البرامج الأكاديمية'
                    : 'Academics'}
              </h3>
              <ul className="space-y-2.5 text-sm text-sky-100/85">
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToPage('education-method')}
                    className="hover:text-[#f0c95e] transition-colors cursor-pointer text-left"
                  >
                    {HEADER_NAV_GROUPS[2].items?.[0].title[language]}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToPage('ten-year-plan')}
                    className="hover:text-[#f0c95e] transition-colors cursor-pointer text-left"
                  >
                    {HEADER_NAV_GROUPS[2].items?.[1].title[language]}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToPage('curriculum')}
                    className="hover:text-[#f0c95e] transition-colors cursor-pointer text-left"
                  >
                    {language === 'bn'
                      ? 'কোর্স ও কারিকুলাম'
                      : language === 'ar'
                        ? 'المنهج والدورات الدراسية'
                        : 'Courses & Curriculum'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToPage('hifz-tree')}
                    className="hover:text-[#f0c95e] transition-colors cursor-pointer text-left"
                  >
                    {language === 'bn'
                      ? 'হিফজুল কুরআন ট্রি (৩০ হাফেজ)'
                      : language === 'ar'
                        ? 'شجرة الحفاظ (٣٠ حافظاً)'
                        : 'Hifzul Quran Lineage (30 Huffaz)'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToPage('gallery')}
                    className="hover:text-[#f0c95e] transition-colors cursor-pointer text-left"
                  >
                    {language === 'bn' ? 'ফটো ও মিডিয়া গ্যালারি' : 'Photo & Media Gallery'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3 (3 Cols): Admissions, Career & Live External ERP Portals */}
            <div className="lg:col-span-3 space-y-3.5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#f0c95e]">
                {language === 'bn'
                  ? 'ভর্তি, ক্যারিয়ার ও ইআরপি পোর্টাল'
                  : language === 'ar'
                    ? 'القبول والوظائف وبوابات ERP'
                    : 'Admissions, Career & ERP'}
              </h3>
              <ul className="space-y-2.5 text-sm text-sky-100/85">
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToPage('admission')}
                    className="hover:text-[#f0c95e] transition-colors cursor-pointer text-left"
                  >
                    {t.navRegistration}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToPage('fees')}
                    className="hover:text-[#f0c95e] transition-colors cursor-pointer text-left"
                  >
                    {t.navFees}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToPage('transport')}
                    className="hover:text-[#f0c95e] transition-colors cursor-pointer text-left"
                  >
                    {HEADER_NAV_GROUPS[4].items?.[0].title[language]}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => navigateToPage('career')}
                    className="hover:text-[#f0c95e] transition-colors cursor-pointer text-left font-bold text-[#f0c95e]"
                  >
                    {language === 'bn'
                      ? 'ক্যারিয়ার ও নিয়োগ বিজ্ঞপ্তি'
                      : language === 'ar'
                        ? 'الوظائف والتعيينات'
                        : 'Career & Recruitment'}
                  </button>
                </li>
                {resolveExternalPortals(settings.externalPortals)
                  .filter((p) => p.active !== false && isValidExternalPortalUrl(p.url))
                  .map((portal) => (
                    <li key={`footer-erp-${portal.id}`}>
                      <a
                        href={portal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sky-200 hover:text-[#f0c95e] transition-colors font-semibold"
                      >
                        <span>{language === 'en' ? portal.labelEn : portal.labelBn}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Column 4 (3 Cols): Dual Campuses & Direct Contact */}
            <div className="lg:col-span-3 space-y-3.5">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#f0c95e]">
                {t.footerContact}
              </h3>
              <div className="space-y-3 text-sm text-sky-100/85">
                <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 space-y-1">
                  <div className="text-xs font-extrabold text-[#f0c95e]">
                    {language === 'bn' ? 'বয়েজ ও মেইন ক্যাম্পাস' : 'Boys & Main Campus'}
                  </div>
                  <p className="text-xs leading-relaxed">
                    {language === 'bn'
                      ? 'বাড়ি-১১, রোড-১৯, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০'
                      : 'House-11, Road-19, Sector-12, Uttara, Dhaka-1230'}
                  </p>
                  <a
                    href={settings.boysCampusMapUrl || DEFAULT_BOYS_CAMPUS_MAP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#5eead4] hover:underline pt-0.5"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{language === 'bn' ? 'ম্যাপ লোকেশন দেখুন' : 'View on Google Maps'}</span>
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.06] border border-white/10 space-y-1">
                  <div className="text-xs font-extrabold text-[#5eead4]">
                    {language === 'bn' ? 'প্রধান অফিস ও গার্লস ক্যাম্পাস' : 'Main Office & Girls Campus'}
                  </div>
                  <p className="text-xs leading-relaxed">
                    {language === 'bn'
                      ? 'বাড়ি-০৭, রোড-১৭/এ, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০'
                      : 'House-07, Road-17/A, Sector-12, Uttara, Dhaka-1230'}
                  </p>
                </div>

                <div className="space-y-1 pt-1">
                  <a
                    href="tel:01886340308"
                    className="flex items-center gap-2 font-mono text-sm text-[#f0c95e] font-extrabold hover:underline"
                  >
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{localizeDynamicText(settings.phonePrimary, language)}</span>
                  </a>
                  <div className="flex items-center gap-2 font-mono text-xs text-sky-200">
                    <Mail className="w-3.5 h-3.5 shrink-0 text-[#5eead4]" />
                    <span className="truncate">{settings.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Legal & Version Strip (Admin Login button removed per v2.2.0 cleanup) */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-sky-200/80">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1">
              <span>
                &copy; {new Date().getFullYear()} {t.footerRights}
              </span>
              {(() => {
                const vm = resolveVersionManagerConfig(state.versionManager);
                if (!shouldShowPublicVersion(vm)) return null;
                return (
                  <button
                    type="button"
                    data-testid="public-footer-version"
                    onClick={() => setIsReleaseNotesOpen(true)}
                    className="inline-flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/20 border border-[#f0c95e]/30 px-2.5 py-0.5 font-mono text-xs text-[#f0c95e] transition-colors cursor-pointer"
                    title={language === 'bn' ? 'আপডেট নোটিস ও চেঞ্জলগ দেখুন' : 'View Release Notes'}
                  >
                    <span>v{vm.activeVersion}</span>
                  </button>
                );
              })()}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                aria-label="Back to top"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#007c91] text-white flex items-center justify-center transition-colors cursor-pointer border border-white/15"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal 1: Course Detail & Subject-Wise Class Modules Viewer */}
      {activeCourseModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="course-modal-title"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="relative w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
            <div className="bg-gradient-to-r from-[#2e0249] via-[#4c0575] to-[#6b21a8] px-6 py-5 text-white flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-mono text-purple-200">
                  {activeCourseModal.category} · Duration: {activeCourseModal.duration} · Total
                  Classes: {localizeDigits(activeCourseModal.totalClasses, language)}
                </div>
                <h2 id="course-modal-title" className="text-xl font-extrabold mt-1">
                  {language === 'en'
                    ? activeCourseModal.title
                    : localizeDynamicText(
                        activeCourseModal.titleBn || activeCourseModal.title,
                        language
                      )}
                </h2>
                {language === 'bn' && activeCourseModal.title && (
                  <p className="text-xs text-purple-200 mt-0.5">{activeCourseModal.title}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveCourseModal(null)}
                aria-label="Close course modal"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
                  Course Overview
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {localizeDynamicText(activeCourseModal.overview, language)}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                  <span>Subject-Wise Class Modules &amp; Lecture Breakdown</span>
                </h3>

                {activeCourseModal.modules.map((mod) => (
                  <div
                    key={mod.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-md bg-purple-700 text-white font-mono text-xs font-bold">
                          Module {localizeDigits(String(mod.moduleNumber).padStart(2, '0'), language)}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {localizeDynamicText(mod.title, language)}
                        </h4>
                      </div>
                      <span className="text-xs font-mono font-semibold text-purple-800 dark:text-purple-300">
                        {localizeDigits(mod.lectureCount, language)} Lectures
                      </span>
                    </div>

                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {mod.topics.map((topic, tIdx) => (
                        <li
                          key={tIdx}
                          className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{localizeDynamicText(topic, language)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-100 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setActiveCourseModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = activeCourseModal.id;
                  setActiveCourseModal(null);
                  handleOpenAdmissionWithCourse(id);
                }}
                className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold cursor-pointer"
              >
                {pageCopy.applyBtn} &rarr;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Notice Full Details Viewer */}
      {activeNoticeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notice-modal-title"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="relative w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#2e0249] px-6 py-4 text-white flex items-center justify-between gap-4">
              <div className="text-xs font-mono text-purple-200">
                {activeNoticeModal.category} · Published:{' '}
                {localizeDigits(activeNoticeModal.publishDate, language)}
              </div>
              <button
                type="button"
                onClick={() => setActiveNoticeModal(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <h3
                id="notice-modal-title"
                className="text-lg font-extrabold text-slate-900 dark:text-white"
              >
                {localizeDynamicText(activeNoticeModal.title, language)}
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {localizeDynamicText(activeNoticeModal.description, language)}
              </p>
              {activeNoticeModal.attachmentUrl && (
                <div className="pt-2">
                  <a
                    href={activeNoticeModal.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t.noticesViewPdf}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Event Details Viewer */}
      {activeEventModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#3b0764] px-6 py-4 text-white flex items-center justify-between">
              <span className="text-xs font-mono text-purple-200">
                {activeEventModal.type} · {activeEventModal.date}
              </span>
              <button
                type="button"
                onClick={() => setActiveEventModal(null)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {activeEventModal.title}
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeEventModal.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: 6-Step Comprehensive Admission Form Modal */}
      <AdmissionFormModal
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        preselectedCourseId={preselectedAdmissionCourseId}
      />

      {/* Modal 5: Promotional Admission Offer Popup Notice */}
      <AdmissionPopupModal
        isOpen={isPromoPopupOpen}
        onClose={() => {
          setIsPromoPopupOpen(false);
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('maharat_promo_popup_dismissed', '1');
          }
        }}
        onApplyNow={() => {
          setIsPromoPopupOpen(false);
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('maharat_promo_popup_dismissed', '1');
          }
          handleOpenAdmissionWithCourse();
        }}
      />

      {/* Modal 6: Apple-Grade Cinema Video Player */}
      <AppleCinemaVideoModal
        video={playingVideoModal}
        language={language}
        onClose={() => setPlayingVideoModal(null)}
        onOpenAdmission={() => handleOpenAdmissionWithCourse()}
      />

      {/* Modal 7: Apple-Grade Studio Photo Lightbox */}
      <AppleStudioPhotoLightbox
        modalData={framedPhotoModal}
        language={language}
        onClose={() => setFramedPhotoModal(null)}
        onNavigate={navigateFramedPhoto}
        onCopiedToast={() =>
          pushToast(
            language === 'bn' ? 'লিংক কপি হয়েছে!' : 'Link Copied!',
            language === 'bn'
              ? 'ছবির লিংকটি আপনার ক্লিপবোর্ডে সংরক্ষিত হয়েছে।'
              : 'The photo link has been copied to your clipboard.',
            'info'
          )
        }
      />

      {/* Floating Virtual Office Live Desk Launcher */}
      <VirtualOfficeFloatingLauncher />

      {/* Floating Bottom-Right MMM AI Agent & WhatsApp Bot */}
      <NoorAIChatbot />

      {/* Mobile App-Style Fixed Bottom Navigation Bar */}
      <MobileBottomBar
        currentPage={currentPage}
        onNavigate={(target) => {
          const mapped: PublicPageId =
            target === 'careers'
              ? 'career'
              : target === 'courses'
                ? 'curriculum'
                : (target as PublicPageId);
          navigateToPage(mapped);
        }}
      />

      {/* Public Release Notes Changelog Modal */}
      <ReleaseNotesModal
        isOpen={isReleaseNotesOpen}
        onClose={() => setIsReleaseNotesOpen(false)}
      />

      {/* Public QR-Verified Hafez Certificate Modal */}
      <CertificateVerificationModal
        certCode={verifyCertCode}
        onClose={handleCloseVerifyCert}
      />
    </div>
  );
};
