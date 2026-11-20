import { AppLanguage } from './translations';

export type HomeFaqCategoryId = 'admission' | 'academic' | 'residence' | 'fees' | 'others';

export interface HomeFaqEntry {
  id: string;
  category: HomeFaqCategoryId;
  q: Record<AppLanguage, string>;
  a: Record<AppLanguage, string>;
}

export interface QuickHomeRegPayload {
  studentName: string;
  guardianName: string;
  mobile: string;
  whatsapp: string;
  sameAsMobile: boolean;
  department: 'General' | 'Tahfiz';
  targetClass: string;
  accommodation: 'Non-Residential' | 'Residential' | 'Day-Care';
  address: string;
}

export interface QuickHomeRegValidation {
  valid: boolean;
  error?: string;
  resolvedWhatsapp: string;
}

export const HOME_FAQ_CATEGORIES: {
  id: HomeFaqCategoryId;
  label: Record<AppLanguage, string>;
}[] = [
  { id: 'admission', label: { bn: 'ভর্তি', en: 'Admission', ar: 'القبول' } },
  { id: 'academic', label: { bn: 'একাডেমিক', en: 'Academic', ar: 'الأكاديمي' } },
  { id: 'residence', label: { bn: 'আবাসন', en: 'Residential', ar: 'السكن' } },
  { id: 'fees', label: { bn: 'ফি ও ছাড়', en: 'Fees', ar: 'الرسوم' } },
  { id: 'others', label: { bn: 'অন্যান্য', en: 'Others', ar: 'أخرى' } },
];

export const HOME_FAQ_ITEMS: HomeFaqEntry[] = [
  // Admission
  {
    id: 'faq-adm-1',
    category: 'admission',
    q: {
      bn: 'মাহারাত মডেল মাদ্রাসায় কোন কোন শ্রেণি ও বিভাগে ভর্তি নেওয়া হয়?',
      en: 'Which grades and departments are open for admission at Maharat Model Madrasah?',
      ar: 'ما هي الصفوف والأقسام المتاحة للقبول في مدرسة المهارات النموذجية؟',
    },
    a: {
      bn: 'মাহারাত মডেল মাদ্রাসায় (EIIN: 140630) দুটি মূল বিভাগে ভর্তি নেওয়া হয়—১) জেনারেল সেকশন: প্রি-প্লে ও প্লে থেকে ৯ম শ্রেণি/দাখিল পর্যন্ত (আরবি ও ইংলিশ ভার্সন, বালক ও বালিকাদের পৃথক ক্যাম্পাস); ২) তাহফিজুল কুরআন সেকশন: নূরানী, নাজেরা ও পূর্ণাঙ্গ হিফজুল কুরআন (+৪টি মৌলিক জেনারেল বিষয়)।',
      en: 'Maharat Model Madrasah (EIIN: 140630) admits students into two flagship tracks: 1) General Section from Pre-Play & Play up to Class 9/Dakhil (Arabic & English Version, separate Boys & Girls campuses); 2) Tahfizul Quran Section covering Nurani, Nazera, and full Hifz alongside 4 fundamental general subjects.',
      ar: 'تستقبل المدرسة الطلاب في مسارين رئيسيين: ١) القسم العام من التمهيدي حتى الصف التاسع/الداخل (بالنسختين العربية والإنجليزية)، ٢) قسم تحفيظ القرآن (النورانية والناظرة والحفظ الكامل مع ٤ مواد أساسية).',
    },
  },
  {
    id: 'faq-adm-2',
    category: 'admission',
    q: {
      bn: 'ভর্তির জন্য কী কী কাগজপত্র জমা দিতে হয় এবং ভর্তি পরীক্ষা কীভাবে হয়?',
      en: 'What documents are required for admission, and how does the assessment work?',
      ar: 'ما هي المستندات المطلوبة للقبول وكيف يتم تقييم الطالب؟',
    },
    a: {
      bn: 'ভর্তির জন্য শিক্ষার্থীর ৪ কপি পাসপোর্ট সাইজ ছবি, জন্ম নিবন্ধন সনদের ফটোকপি, পিতা-মাতার এনআইডি (NID) ফটোকপি এবং পূর্ববর্তী প্রতিষ্ঠানের ছাড়পত্র/মার্কশিট (প্রযোজ্য ক্ষেত্রে) জমা দিতে হয়। প্লে-নার্সারিতে মৌখিক এবং ১ম–৯ম শ্রেণিতে বাংলা, ইংরেজি, গণিত ও আরবি/কুরআন বিষয়ের ওপর সংক্ষিপ্ত মূল্যায়ন নেওয়া হয়।',
      en: 'Required documents include 4 passport-size photos of the student, birth certificate copy, parents’ NID copies, and previous academic transcript/TC (if applicable). Play/Nursery involves a friendly oral interaction, while Class 1–9 includes a concise assessment in Bangla, English, Math, and Arabic/Quran.',
      ar: 'تشمل المستندات ٤ صور شخصية للطالب، نسخة من شهادة الميلاد، ونسخة من بطاقة الهوية للوالدين. يتم إجراء مقابلة شفهية للتمهيدي وتقييم مختصر للصفوف الأعلى.',
    },
  },
  {
    id: 'faq-adm-3',
    category: 'admission',
    q: {
      bn: 'অনলাইনে ফরম পূরণ করার পর পরবর্তী ধাপ কী?',
      en: 'What is the next step after submitting the online registration form?',
      ar: 'ما هي الخطوة التالية بعد إرسال نموذج التسجيل عبر الإنترنت؟',
    },
    a: {
      bn: '১ মিনিটের অনলাইন রেজিস্ট্রেশন বা ৬-ধাপের ভর্তি ফরম জমা দেওয়ার পর আমাদের ভর্তি শাখার প্রতিনিধি দ্রুত আপনার দেওয়া মোবাইল বা হোয়াটসঅ্যাপ নম্বরে যোগাযোগ করে উত্তরা সেক্টর-১২ ক্যাম্পাস ভিজিট ও ভর্তি মূল্যায়নের সময় নির্ধারণ করে দেবেন।',
      en: 'After submitting the 1-minute registration or full 6-step admission form, our admission coordinator will promptly contact you via phone or WhatsApp to schedule your Uttara Sector-12 campus tour and assessment.',
      ar: 'بعد إرسال النموذج، سيتواصل معك فريق القبول سريعاً عبر الهاتف أو الواتساب لتحديد موعد زيارة الحرم المدرسي في أوتارا قطاع ١٢ وإجراء التقييم.',
    },
  },

  // Academic
  {
    id: 'faq-aca-1',
    category: 'academic',
    q: {
      bn: 'মাদ্রাসার পড়াশোনার পাশাপাশি জেনারেল ও আধুনিক আইসিটি শিক্ষার মান কেমন?',
      en: 'How does Maharat balance Islamic studies with NCTB general academics and ICT?',
      ar: 'كيف توازن المدرسة بين العلوم الشرعية والمناهج الحديثة وتقنية المعلومات؟',
    },
    a: {
      bn: 'বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড ও এনসিটিবি (NCTB) সিলেবাসের সাথে সমন্বয় করে আরবি ও ইংলিশ ভার্সনে পাঠদান করা হয়। আমাদের দাখিল পরীক্ষায় শতভাগ (১০০%) পাসের সাফল্য রয়েছে। পাশাপাশি প্রজেক্টর ও স্মার্ট বোর্ড সমৃদ্ধ আইসিটি ক্লাসরুম, ৩ ভাষায় (বাংলা, আরবি, ইংরেজি) কথোপকথন এবং ড্রীম ডায়েরি পরিচালিত হয়।',
      en: 'We integrate the Bangladesh Madrasah Education Board and NCTB curriculum in both Arabic and English versions, maintaining a 100% Dakhil board pass record. Every student also trains in smart ICT classrooms, trilingual fluency (Bangla, Arabic, English), and personal Dream Diary mentoring.',
      ar: 'نجمع بين مناهج مجلس التعليم الديني والمناهج الوطنية بنسبة نجاح ١٠٠٪ في شهادة الداخل، مع فصول ذكية لتقنية المعلومات وإتقان اللغات الثلاث.',
    },
  },
  {
    id: 'faq-aca-2',
    category: 'academic',
    q: {
      bn: 'তাহফিজুল কুরআন বিভাগে হিফজের সাথে কী কী জেনারেল বিষয় পড়ানো হয়?',
      en: 'Which general subjects are taught alongside Quran memorization in the Tahfiz section?',
      ar: 'ما هي المواد العامة التي تُدرّس مع حفظ القرآن الكريم؟',
    },
    a: {
      bn: 'তাহফিজ বিভাগে আন্তর্জাতিক মানের হাফেজ ও ক্বারীদের নিবিড় তত্ত্বাবধানে বিশুদ্ধ তাজবীদসহ হিফজের পাশাপাশি ৪টি মৌলিক জেনারেল বিষয়—বাংলা, ইংরেজি, গণিত ও আরবি নিয়মিত পড়ানো হয়, যাতে হিফজ শেষে শিক্ষার্থী সহজেই মূলধারার উচ্চতর শ্রেণিতে এগিয়ে যেতে পারে।',
      en: 'Alongside pure Tajweed-based Quran memorization under qualified Huffaz, Tahfiz students study 4 core academic subjects—Bangla, English, Mathematics, and Arabic—ensuring seamless progression into higher mainstream grades after Hifz completion.',
      ar: 'إلى جانب حفظ القرآن بالتجويد المتقن، يدرس طلاب التحفيظ ٤ مواد أكاديمية أساسية (البنغالية والإنجليزية والرياضيات والعربية) لضمان استمرار تفوقهم الأكاديمي.',
    },
  },
  {
    id: 'faq-aca-3',
    category: 'academic',
    q: {
      bn: 'বালক ও বালিকাদের ক্লাস ও ক্যাম্পাস কি সম্পূর্ণ আলাদা?',
      en: 'Are Boys and Girls campuses and classrooms completely separate?',
      ar: 'هل فصول وحرم البنين منفصل تماماً عن البنات؟',
    },
    a: {
      bn: 'হ্যাঁ, উত্তরা সেক্টর-১২ তে বালক ও বালিকাদের জন্য সম্পূর্ণ পৃথক ও নিরাপদ ক্যাম্পাস রয়েছে। গার্লস ক্যাম্পাস ও মূল অফিস: বাড়ি-৭, রোড-১৭/এ, সেক্টর-১২; এবং বয়েজ ক্যাম্পাস: বাড়ি-১১, রোড-১৯, সেক্টর-১২, উত্তরা।',
      en: 'Yes, we operate completely separate, secure campuses in Uttara Sector-12. Main Office & Girls Campus: House-7, Road-17/A, Sector-12; Boys Campus: House-11, Road-19, Sector-12, Uttara.',
      ar: 'نعم، لدينا حرمان منفصلان تماماً في أوتارا قطاع ١٢: حرم البنات والمكتب الرئيسي (منزل ٧، طريق ١٧/أ) وحرم البنين (منزل ١١، طريق ١٩).',
    },
  },

  // Residence
  {
    id: 'faq-res-1',
    category: 'residence',
    q: {
      bn: 'আবাসিক ও হিফজ ডে-কেয়ার ব্যবস্থা কীভাবে পরিচালিত হয়?',
      en: 'How are Residential boarding and Hifz Day-Care supervised?',
      ar: 'كيف تتم إدارة السكن الداخلي والرعاية النهارية؟',
    },
    a: {
      bn: '২৪ ঘণ্টা সিসিটিভি ক্যামেরা ও অভিজ্ঞ আবাসিক শিক্ষকদের সার্বক্ষণিক তত্ত্বাবধানে স্বাস্থ্যসম্মত পুষ্টিকর খাবার, সুশৃঙ্খল পড়াশোনা, নামাজ ও বিশ্রামের (কায়লুলাহ) ব্যবস্থা রয়েছে। ডে-কেয়ার শিক্ষার্থীরা সকাল ৭:০০টা থেকে রাত ৮:৩০টা পর্যন্ত সম্পূর্ণ পড়াশোনা ও খাবারসহ নিরাপদে থাকে।',
      en: 'Supervised 24/7 by dedicated residential teachers under full CCTV coverage, students receive balanced nutritious meals, structured study hours, prayer mentoring, and midday rest. Day-Care runs from 7:00 AM to 8:30 PM covering all lessons and meals.',
      ar: 'بإشراف معلمين مقيمين على مدار الساعة وكاميرات مراقبة، نوفر وجبات صحية وجدولاً منظماً للدراسة والصلاة، كما تمتد الرعاية النهارية من ٧:٠٠ صباحاً حتى ٨:٣٠ مساءً.',
    },
  },
  {
    id: 'faq-res-2',
    category: 'residence',
    q: {
      bn: 'আবাসিক শিক্ষার্থীদের সাথে অভিভাবক কখন দেখা করতে বা কথা বলতে পারেন?',
      en: 'When can parents visit or speak with residential students?',
      ar: 'متى يمكن لأولياء الأمور زيارة الطلاب المقيمين أو التواصل معهم؟',
    },
    a: {
      bn: 'নির্ধারিত সাপ্তাহিক সাক্ষাৎ ও ফোনে কথা বলার সূচি অনুযায়ী অভিভাবকগণ সন্তানের সাথে কথা বলতে ও দেখা করতে পারেন। এছাড়া মাসিক অভিভাবক সমাবেশ ও ডিজিটাল অগ্রগতি রিপোর্টের মাধ্যমে নিয়মিত আপডেট প্রদান করা হয়।',
      en: 'Parents have scheduled weekly phone calls and campus visitation hours, plus monthly parent-teacher review meetings and progress reports to stay closely connected with their child’s development.',
      ar: 'يُتاح لأولياء الأمور جدول أسبوعي منتظم للزيارة والاتصال الهاتفي، بالإضافة إلى اجتماعات شهرية وتقارير متابعة دورية.',
    },
  },

  // Fees
  {
    id: 'faq-fee-1',
    category: 'fees',
    q: {
      bn: 'ভর্তি ফি, মাসিক বেতন এবং বিশেষ ডিসকাউন্ট সুবিধা কী কী রয়েছে?',
      en: 'What are the admission fees, monthly tuition, and available discounts?',
      ar: 'ما هي رسوم القبول والرسوم الشهرية والخصومات المتاحة؟',
    },
    a: {
      bn: 'প্রত্যেক শ্রেণির প্রথম ৫ জন ভর্তিচ্ছু শিক্ষার্থীর জন্য ভর্তি ফিতে বিশেষ ছাড় এবং সহোদর ভাই-বোন বা মেধাবীদের জন্য টিউশন ফি ছাড়ের ব্যবস্থা রয়েছে। আপনি আমাদের ওয়েবসাইটের “ফি ক্যালকুলেটর” পেজ থেকে শ্রেণি ও আবাসন অনুযায়ী সঠিক হিসাব এবং অফিসিয়াল A4 PDF দেখতে পারবেন।',
      en: 'Special early-admission discounts apply to the first 5 students per class, along with sibling and merit concessions. You can calculate the exact breakdown for any grade or residential track and download an official A4 PDF from our interactive Fee Calculator.',
      ar: 'تتوفر خصومات خاصة لأول ٥ طلاب في كل صف وخصومات للإخوة والمتفوقين. يمكنك حساب التكلفة الدقيقة وتحميل كشف PDF رسمي عبر حاسبة الرسوم في الموقع.',
    },
  },
  {
    id: 'faq-fee-2',
    category: 'fees',
    q: {
      bn: 'বেতন ও ফি পরিশোধের মাধ্যমগুলো কী কী?',
      en: 'What payment methods are accepted for tuition and admission fees?',
      ar: 'ما هي طرق الدفع المتاحة للرسوم الدراسية؟',
    },
    a: {
      bn: 'অফিসে সরাসরি নগদ (Cash), ব্যাংক ডিপোজিট এবং মোবাইল ব্যাংকিংয়ের (বিকাশ/নগদ) মাধ্যমে নিরাপদে ফি পরিশোধ করে অফিসিয়াল রসিদ সংগ্রহ করা যায়।',
      en: 'Fees can be paid securely at the campus accounts desk via cash, bank deposit, or verified mobile banking (bKash/Nagad) with official printed receipts.',
      ar: 'يمكن دفع الرسوم نقداً في مكتب الحسابات أو عبر التحويل البنكي أو خدمات الدفع الإلكتروني مع استلام إيصال رسمي.',
    },
  },

  // Others
  {
    id: 'faq-oth-1',
    category: 'others',
    q: {
      bn: 'শিক্ষার্থীদের যাতায়াতের জন্য কি মাদ্রাসার নিজস্ব পরিবহন ব্যবস্থা আছে?',
      en: 'Does the madrasah provide its own school transport service?',
      ar: 'هل توفر المدرسة خدمة النقل المدرسي الخاص؟',
    },
    a: {
      bn: 'জি, উত্তরা সেক্টর ১–১৮, দিয়াবাড়ি, খালপাড়, আব্দুল্লাহপুর, আজমপুর এবং মিরপুর-১২/পল্লবী সংলগ্ন রুটে অভিজ্ঞ চালক ও তত্ত্বাবধায়কসহ মাদ্রাসার নিজস্ব নিরাপদ মাইক্রোবাস পরিবহন ব্যবস্থা চালু আছে।',
      en: 'Yes, we operate our own supervised microbus fleet covering Uttara Sectors 1–18, Diabari, Khalpar, Abdullahpur, Azampur, and Mirpur-12/Pallabi routes.',
      ar: 'نعم، نوفر حافلات خاصة آمنة تغطي قطاعات أوتارا ١–١٨ والمناطق المجاورة وميربور بإشراف كامل.',
    },
  },
  {
    id: 'faq-oth-2',
    category: 'others',
    q: {
      bn: 'সহশিক্ষা কার্যক্রম হিসেবে শিক্ষার্থীরা কী কী বিষয়ে অংশ নিতে পারে?',
      en: 'What co-curricular activities are offered to build student confidence?',
      ar: 'ما هي الأنشطة اللاصفية المتاحة لتنمية مهارات الطلاب؟',
    },
    a: {
      bn: 'পড়াশোনার পাশাপাশি বার্ষিক বিজ্ঞান মেলা, সীরাত প্রতিযোগিতা ও দেয়ালিকা প্রদর্শনী, ত্রৈমাসিক মাহারাত পত্রিকা সম্পাদনা, কিরাত ও হামদ-নাত মাহফিল, ফল মেলা, স্টুডেন্ট কাউন্সিল, বিতর্ক ও বার্ষিক শিক্ষাসফরের নিয়মিত আয়োজন করা হয়।',
      en: 'Students actively participate in our Annual Science Fair, Seerah Quiz & Wall Magazine Exhibition, Quarterly Maharat Magazine publishing, Qirat & Nasheed competitions, Fruit Festival, Student Council, Debate Club, and annual study tours.',
      ar: 'يشارك الطلاب في المعرض العلمي السنوي، مسابقة السيرة ومجلة الحائط، مجلة المهارات الفصلية، مسابقات التلاوة والخطابة، والرحلات العلمية السنوية.',
    },
  },
];

export const GENERAL_CLASS_OPTIONS: Record<AppLanguage, string[]> = {
  bn: [
    'প্রি-প্লে / প্লে',
    'নার্সারি',
    'কেজি / প্রি-ওয়ান',
    '১ম শ্রেণি',
    '২য় শ্রেণি',
    '৩য় শ্রেণি',
    '৪র্থ শ্রেণি',
    '৫ম শ্রেণি',
    '৬ষ্ঠ শ্রেণি',
    '৭ম শ্রেণি',
    '৮ম শ্রেণি',
    '৯ম শ্রেণি (দাখিল — বিজ্ঞান/মানবিক)',
  ],
  en: [
    'Pre-Play / Play',
    'Nursery',
    'KG / Pre-One',
    'Class 1',
    'Class 2',
    'Class 3',
    'Class 4',
    'Class 5',
    'Class 6',
    'Class 7',
    'Class 8',
    'Class 9 (Dakhil — Science/Arts)',
  ],
  ar: [
    'التمهيدي (Pre-Play / Play)',
    'الروضة (Nursery)',
    'الصف الأول',
    'الصف الثاني',
    'الصف الثالث',
    'الصف الرابع',
    'الصف الخامس',
    'الصف السادس',
    'الصف السابع',
    'الصف الثامن',
    'الصف التاسع (الداخل)',
  ],
};

export const TAHFIZ_CLASS_OPTIONS: Record<AppLanguage, string[]> = {
  bn: [
    'নূরানী বিভাগ (প্রাথমিক তাজবীদ)',
    'নাজেরা বিভাগ (বিশুদ্ধ কুরআন তিলাওয়াত)',
    'হিফজুল কুরআন বিভাগ (+৪টি মৌলিক বিষয়)',
    'শুনানী ও আন্তর্জাতিক প্রতিযোগিতা প্রস্তুতি',
  ],
  en: [
    'Nurani Section (Foundational Tajweed)',
    'Nazera Section (Fluent Quran Recitation)',
    'Hifzul Quran Section (+4 Core Subjects)',
    'Shunani & Competition Preparation',
  ],
  ar: [
    'قسم النورانية (تأسيس التجويد)',
    'قسم الناظرة (تلاوة متقنة)',
    'قسم تحفيظ القرآن (+٤ مواد أساسية)',
    'قسم المراجعة والمسابقات الدولية',
  ],
};

export function filterHomeFaqByCategory(
  items: HomeFaqEntry[],
  category: HomeFaqCategoryId
): HomeFaqEntry[] {
  return items.filter((item) => item.category === category);
}

export function validateQuickHomeRegistration(
  payload: QuickHomeRegPayload,
  language: AppLanguage
): QuickHomeRegValidation {
  const cleanStudent = payload.studentName.trim();
  const cleanGuardian = payload.guardianName.trim();
  const cleanMobile = payload.mobile.trim();
  const resolvedWhatsapp = payload.sameAsMobile ? cleanMobile : payload.whatsapp.trim();

  if (cleanStudent.length < 2) {
    return {
      valid: false,
      resolvedWhatsapp,
      error:
        language === 'bn'
          ? 'অনুগ্রহ করে শিক্ষার্থীর পূর্ণ নাম লিখুন।'
          : language === 'ar'
            ? 'يرجى إدخال الاسم الكامل للطالب.'
            : 'Please enter the student’s full name.',
    };
  }

  if (cleanGuardian.length < 2) {
    return {
      valid: false,
      resolvedWhatsapp,
      error:
        language === 'bn'
          ? 'অনুগ্রহ করে পিতা বা অভিভাবকের নাম লিখুন।'
          : language === 'ar'
            ? 'يرجى إدخال اسم ولي الأمر.'
            : 'Please enter the guardian’s name.',
    };
  }

  const digits = cleanMobile.replace(/\D/g, '');
  if (digits.length < 10) {
    return {
      valid: false,
      resolvedWhatsapp,
      error:
        language === 'bn'
          ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01886-340308)।'
          : language === 'ar'
            ? 'يرجى إدخال رقم هاتف صحيح مكون من ١٠ أرقام على الأقل.'
            : 'Please enter a valid phone number (at least 10 digits).',
    };
  }

  if (!payload.targetClass.trim()) {
    return {
      valid: false,
      resolvedWhatsapp,
      error:
        language === 'bn'
          ? 'অনুগ্রহ করে কাঙ্ক্ষিত শ্রেণি বা স্তর নির্বাচন করুন।'
          : language === 'ar'
            ? 'يرجى اختيار الصف المطلوب.'
            : 'Please select a target class or level.',
    };
  }

  return {
    valid: true,
    resolvedWhatsapp,
  };
}
