import { AppLanguage } from './translations';

const BN_TO_EN_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

const EN_TO_BN_DIGITS: Record<string, string> = {
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

const EN_TO_AR_DIGITS: Record<string, string> = {
  '0': '٠',
  '1': '١',
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
};

export function localizeDigits(val: string | number, lang: AppLanguage): string {
  const normalizedEn = String(val).replace(/[০-৯]/g, (d) => BN_TO_EN_DIGITS[d] || d);
  if (lang === 'bn') {
    return normalizedEn.replace(/[0-9]/g, (d) => EN_TO_BN_DIGITS[d] || d);
  }
  if (lang === 'ar') {
    return normalizedEn.replace(/[0-9]/g, (d) => EN_TO_AR_DIGITS[d] || d);
  }
  return normalizedEn;
}

export function formatCurrencyByLang(amount: number, lang: AppLanguage): string {
  const formatted = amount.toLocaleString('en-IN');
  if (lang === 'bn') {
    return `৳ ${localizeDigits(formatted, 'bn')}/-`;
  }
  if (lang === 'ar') {
    return `${localizeDigits(formatted, 'ar')} تاكا`;
  }
  return `BDT ${formatted}/-`;
}

/**
 * Exact & phrase-level dictionary for dynamic CMS Bengali strings -> English & Arabic
 */
const EXACT_TEXT_MAP: Record<string, { en: string; ar: string }> = {
  // Screenshot 1: 50/50 Education Method
  'শিক্ষা পদ্ধতি': {
    en: 'Education Methodology',
    ar: 'منهجية التعليم المتكامل',
  },
  '৫০': {
    en: '50',
    ar: '٥٠',
  },
  'ইসলামি শিক্ষা': {
    en: 'Islamic Education',
    ar: 'التربية الإسلامية والعلوم الشرعية',
  },
  'কুরআন, আরবি, আকিদাহ, ফিকহ, হাদিস, সীরাহ': {
    en: 'Quran, Arabic Language, Aqeedah, Fiqh, Hadith & Seerah',
    ar: 'القرآن الكريم، اللغة العربية، العقيدة، الفقه، الحديث، والسيرة النبوية',
  },
  'সাধারণ শিক্ষা': {
    en: 'General Education',
    ar: 'التعليم الأكاديمي العام',
  },
  'বাংলা মিডিয়াম NCTB, দাখিল পর্যন্ত': {
    en: 'National Curriculum (NCTB) & Dakhil Board Standard',
    ar: 'المنهج الوطني المعتمد حتى المرحلة الثانوية (الداخل)',
  },
  'বাংলা ও ইংরেজি মাধ্যম সমন্বিত NCTB কারিকুলাম (দাখিল পর্যন্ত)': {
    en: 'Integrated Bengali & English Medium NCTB Curriculum (Up to Dakhil)',
    ar: 'منهج وطني متكامل باللغتين البنغالية والإنجليزية حتى مرحلة الداخل',
  },
  'এটি এমন একটি শিক্ষাব্যবস্থা, যেখানে মাদরাসার কারিকুলাম, সিলেবাস ও রুটিনে ইসলামি শিক্ষা ও সাধারণ শিক্ষাকে সমান গুরুত্ব দেওয়া হয়।': {
    en: 'An integrated educational system where Islamic scholarship and modern academic subjects receive equal weight across curriculum, syllabus, and daily schedules.',
    ar: 'نظام تعليمي متكامل يمنح العلوم الشرعية والعلوم الأكاديمية الحديثة أهمية متساوية في المنهج والجدول اليومي.',
  },
  'মাহারাত মডেল মাদ্রাসায় কুরআন-সুন্নাহর মৌলিক শিক্ষার পাশাপাশি জেনারেল বিষয়ের সমান গুরুত্ব নিশ্চিত করা হয়, যাতে একজন শিক্ষার্থী দ্বীনি ও জাগতিক উভয় ক্ষেত্রে নেতৃত্ব দিতে পারে।': {
    en: 'Ensuring equal emphasis on authentic Quran-Sunnah studies and modern general subjects so every student excels in both spiritual and professional spheres.',
    ar: 'ضمان التوازن الكامل بين علوم القرآن والسنة والعلوم الحديثة لإعداد جيل قيادي متميز دينياً وعلمياً.',
  },
  'স্তরভেদে বিষয়ের ভারসাম্য': {
    en: 'Stage-Wise Subject Balance',
    ar: 'توازن المواد الدراسية حسب المرحلة',
  },
  'প্রি-হিফজ': {
    en: 'Pre-Hifz',
    ar: 'ما قبل الحفظ',
  },
  'হিফজ': {
    en: 'Hifz Track',
    ar: 'مرحلة الحفظ',
  },
  'আফটার হিফজ': {
    en: 'After-Hifz',
    ar: 'ما بعد الحفظ',
  },
  'নার্সারি থেকে প্রথম': {
    en: 'Nursery to Grade 1',
    ar: 'من الروضة إلى الصف الأول',
  },
  'দ্বিতীয় থেকে পঞ্চম': {
    en: 'Grade 2 to Grade 5',
    ar: 'من الصف الثاني إلى الخامس',
  },
  'ষষ্ঠ থেকে দশম (দাখিল)': {
    en: 'Grade 6 to Grade 10 (Dakhil)',
    ar: 'من الصف السادس إلى العاشر (الداخل)',
  },
  'সকাল ৯:০০ থেকে দুপুর ১:০০': {
    en: '9:00 AM – 1:00 PM',
    ar: '٩:٠٠ صباحاً – ١:٠٠ ظهراً',
  },
  'সকাল ৭:০০ থেকে রাত ৮:৩০': {
    en: '7:00 AM – 8:30 PM',
    ar: '٧:٠٠ صباحاً – ٨:٣٠ مساءً',
  },
  'সকাল ৮:০০ থেকে দুপুর ১:০০': {
    en: '8:00 AM – 1:00 PM',
    ar: '٨:٠٠ صباحاً – ١:٠٠ ظهراً',
  },
  'কায়দা, আম্মাপারা ও নাজেরার পাশাপাশি বাংলা, ইংরেজি ও গণিতের মৌলিক ভিত্তি।': {
    en: 'Foundation in Qaida, Ammapara & Nazera alongside core Bengali, English, and Mathematics.',
    ar: 'تأسيس متقن في القاعدة النورانية وجزء عمّ والتلاوة مع أساسيات البنغالية والإنجليزية والرياضيات.',
  },
  'পূর্ণাঙ্গ কুরআন হিফজ ও শুনানির পাশাপাশি প্রতিদিন আড়াই ঘণ্টা আরবি ও জেনারেল ক্লাস।': {
    en: 'Complete Quran memorization and recitation alongside 2.5 hours of daily Arabic and general academic classes.',
    ar: 'حفظ القرآن الكريم كاملاً مع التسميع، بالإضافة إلى ساعتين ونصف يومياً للغة العربية والمواد العامة.',
  },
  'হিফজ তিলাওয়াত সংরক্ষণ, আরবি ভাষায় উচ্চতর ইসলাম শিক্ষা এবং বোর্ড কারিকুলামের পূর্ণাঙ্গ প্রস্তুতি।': {
    en: 'Hifz retention, advanced Islamic studies in Arabic, and comprehensive board exam preparation.',
    ar: 'تثبيت الحفظ، والدراسات الإسلامية المتقدمة باللغة العربية، والاستعداد الكامل لامتحانات الشهادة الرسمية.',
  },

  // Screenshot 2: 10-Year Plan
  'নার্সারি থেকে একাদশ, তিন স্তরে': {
    en: 'Nursery to Grade 11 Across Three Structured Stages',
    ar: 'من الروضة إلى الصف الحادي عشر عبر ثلاث مراحل متكاملة',
  },
  'আমাদের প্রধান উদ্দেশ্য হলো মাধ্যমিক পর্যায়ে একজন শিক্ষার্থীর এমন একটি শক্ত ভিত্তি গড়ে দেওয়া, যাতে সে ভবিষ্যতে মাদরাসা কিংবা কলেজ, উভয় ক্ষেত্রেই সফল হওয়ার পূর্ণ প্রস্তুতি অর্জন করতে পারে।': {
    en: 'Our core objective is to build a rock-solid foundation at the secondary level so every student is fully prepared to excel in higher Islamic seminaries, colleges, or universities.',
    ar: 'هدفنا الأساسي هو بناء قاعدة علمية متينة في المرحلة الثانوية تؤهل الطالب للنجاح الباهر في الدراسات العليا الشرعية أو الجامعية.',
  },
  '১০ বছরের পাঠ পরিকল্পনা': {
    en: '10-Year Master Academic Plan',
    ar: 'الخطة الدراسية الشاملة لعشر سنوات',
  },
  '১ম শ্রেণি থেকে দাখিল, পূর্ণ বা আংশিক হিফজসহ। সাথে নার্সারি, কেজি ও একাদশ।': {
    en: 'Grade 1 to Dakhil with full or partial Hifz, plus Nursery, KG, and Grade 11.',
    ar: 'من الصف الأول حتى شهادة الداخل مع الحفظ الكامل أو الجزئي، شاملاً الروضة والتمهيدي والصف الحادي عشر.',
  },
  'নার্সারি': { en: 'Nursery', ar: 'الروضة' },
  'কেজি': { en: 'KG', ar: 'التمهيدي' },
  '১ম': { en: '1st', ar: 'الأول' },
  '২য়': { en: '2nd', ar: 'الثاني' },
  '৩য়': { en: '3rd', ar: 'الثالث' },
  '৪র্থ': { en: '4th', ar: 'الرابع' },
  '৫ম': { en: '5th', ar: 'الخامس' },
  '৬ষ্ঠ': { en: '6th', ar: 'السادس' },
  '৭ম': { en: '7th', ar: 'السابع' },
  '৮ম': { en: '8th', ar: 'الثامن' },
  '৯ম': { en: '9th', ar: 'التاسع' },
  '১০ম': { en: '10th', ar: 'العاشر' },
  'একাদশ': { en: '11th', ar: 'الحادي عشر' },
  '৫+ বছর': { en: '5+ Yrs', ar: '+٥ سنوات' },
  '৬+': { en: '6+ Yrs', ar: '+٦' },
  '৭+': { en: '7+ Yrs', ar: '+٧' },
  '৮+': { en: '8+ Yrs', ar: '+٨' },
  '৯+': { en: '9+ Yrs', ar: '+٩' },
  '১০+': { en: '10+ Yrs', ar: '+١٠' },
  '১১+': { en: '11+ Yrs', ar: '+١١' },
  '১২+': { en: '12+ Yrs', ar: '+١٢' },
  '১৩+': { en: '13+ Yrs', ar: '+١٣' },
  '১৪+': { en: '14+ Yrs', ar: '+١٤' },
  '১৫+': { en: '15+ Yrs', ar: '+١٥' },
  '১৬+': { en: '16+ Yrs', ar: '+١٦' },
  '১৭+': { en: '17+ Yrs', ar: '+١٧' },
  'কুরআন': { en: 'Quran', ar: 'القرآن' },
  'আরবি': { en: 'Arabic', ar: 'العربية' },
  'ইসলাম': { en: 'Islamic', ar: 'الإسلاميات' },
  'সাধারণ': { en: 'General', ar: 'العلوم العامة' },
  'কায়দা': { en: 'Qaida', ar: 'القاعدة' },
  'আম্মাপারা': { en: 'Juz Amma', ar: 'جزء عمّ' },
  'নাজেরা': { en: 'Nazera', ar: 'التلاوة النظرية' },
  'হিফজ ১': { en: 'Hifz I', ar: 'حفظ ١' },
  'হিফজ ২': { en: 'Hifz II', ar: 'حفظ ٢' },
  'হিফজ ৩': { en: 'Hifz III', ar: 'حفظ ٣' },
  'শুনানি': { en: 'Shunani', ar: 'المراجعة والتسميع' },
  'তিলাওয়াত ও ইয়াদ সংরক্ষণ': { en: 'Recitation & Hifz Retention', ar: 'تثبيت الحفظ والتلاوة' },
  'আরবি ভাষা (কথোপকথন, নাহু, সরফ ও সাহিত্য)': {
    en: 'Arabic Language (Spoken, Grammar, Morphology & Literature)',
    ar: 'اللغة العربية (المحادثة، النحو، الصرف، والأدب)',
  },
  'ইসলাম শিক্ষা': { en: 'Islamic Studies', ar: 'التربية الإسلامية' },
  'ইসলাম শিক্ষা, আরবিতে': { en: 'Islamic Studies in Arabic', ar: 'العلوم الشرعية باللغة العربية' },
  'বাংলা, ইংরেজি, গণিত': { en: 'Bengali, English & Math', ar: 'البنغالية، الإنجليزية، والرياضيات' },
  '+ বিজ্ঞান': { en: '+ Science', ar: '+ العلوم' },
  '+ বিজিএস': { en: '+ Social Science', ar: '+ الدراسات الاجتماعية' },
  'দাখিল': { en: 'Dakhil', ar: 'شهادة الداخل' },
  'বোর্ডের সিলেবাস': { en: 'Board Syllabus', ar: 'المنهج الرسمي' },
  'মুতাওয়াসসিতা': { en: 'Mutawassitah', ar: 'المتوسطة الشرعية' },
  'দাখিলের পর এক বছর': { en: '1-Year Post-Dakhil', ar: 'سنة بعد الداخل' },
  'কলেজ': { en: 'College / HSC', ar: 'الكلية الأكاديمية' },
  'নার্সারি থেকে ৮ম শ্রেণি পর্যন্ত আরবি ও ইসলামি শিক্ষার বই আল কুরআনের ভাষা ইনস্টিটিউট (AQVI) ও সমন্বিত কারিকুলাম প্রণীত। ৬ষ্ঠ শ্রেণি থেকে ইসলাম শিক্ষা আরবি ভাষায়।': {
    en: 'From Nursery to Grade 8, Arabic and Islamic textbooks follow the AQVI & Integrated Curriculum. From Grade 6 onwards, Islamic Studies are taught in Arabic.',
    ar: 'من الروضة حتى الصف الثامن تُدرّس كتب اللغة العربية والعلوم الشرعية وفق منهج معهد لغة القرآن، وبدءاً من الصف السادس تُدرّس العلوم الإسلامية باللغة العربية.',
  },
  'শ্রেণিভিত্তিক পূর্ণ পাঠ পরিকল্পনা': {
    en: 'View Class-Wise Detailed Syllabus',
    ar: 'عرض المنهج التفصيلي لكل صف',
  },

  // Screenshot 3: Hifz Day-Care Routine
  'হিফজ ডে-কেয়ারের একটি দিন': {
    en: 'A Day in Our Hifz Day-Care Program',
    ar: 'يوم كامل في برنامج رعاية وتحفيظ القرآن الكريم',
  },
  'সকাল ৭টা থেকে রাত ৮:৩০, খাবারসহ পূর্ণ দিনের তত্ত্বাবধানে। কুরআনের পাশাপাশি প্রতিদিন আরবি, ইসলাম ও সাধারণ ক্লাস, দুপুরে বিশ্রাম, আর আসরের পর খেলা।': {
    en: 'From 7:00 AM to 8:30 PM under full-day supervision with nutritious meals. Daily Quran memorization alongside Arabic, Islamic & General classes, midday rest, and afternoon sports.',
    ar: 'من ٧:٠٠ صباحاً حتى ٨:٣٠ مساءً تحت إشراف تربوي كامل مع الوجبات الصحية؛ يجمع بين حفظ القرآن ودروس العربية والعلوم العامة، مع قيلولة الظهيرة والرياضة بعد العصر.',
  },
  'সকাল': { en: 'Morning Session', ar: 'الفترة الصباحية' },
  'দুপুর': { en: 'Midday Session', ar: 'فترة الظهيرة' },
  'বিকাল': { en: 'Afternoon Session', ar: 'فترة العصر' },
  'সন্ধ্যা ও রাত': { en: 'Evening & Night', ar: 'المساء والليل' },
  '৭:০০': { en: '7:00 AM', ar: '٧:٠٠ ص' },
  '৮:৩০': { en: '8:30 AM', ar: '٨:٣٠ ص' },
  '৯:০০': { en: '9:00 AM', ar: '٩:٠٠ ص' },
  '১০:০০': { en: '10:00 AM', ar: '١٠:٠٠ ص' },
  '১২:৩০': { en: '12:30 PM', ar: '١٢:٣٠ ظ' },
  '৩:০০': { en: '3:00 PM', ar: '٣:٠٠ م' },
  'আসরের পর': { en: 'After Asr', ar: 'بعد صلاة العصر' },
  'সন্ধ্যা': { en: 'Maghrib', ar: 'عند المغرب' },
  'মাগরিবের পর': { en: 'After Maghrib', ar: 'بعد صلاة المغرب' },
  '৮:২০': { en: '8:20 PM', ar: '٨:٢٠ م' },
  'সবক ও সাত সবক': { en: 'New Sabaq & Seven-Sabaq Review', ar: 'الدرس الجديد ومراجعة السبع' },
  'সবক: নতুন পড়া। সাত সবক: গত কয়েক দিনের পড়া।': {
    en: 'Sabaq: New lesson memorization. Seven-Sabaq: Revision of recent days.',
    ar: 'الدرس الجديد: الحفظ اليومي، والسبع: مراجعة محفوظات الأيام السابقة.',
  },
  'নাশতা': { en: 'Morning Breakfast', ar: 'وجبة الإفطار الصباحية' },
  'স্বাস্থ্যসম্মত সকালের খাবার।': { en: 'Nutritious morning meal on campus.', ar: 'وجبة إفطار صحية ومتوازنة.' },
  'সাত সবক, আমুখতার প্রস্তুতি ও মাশক': {
    en: 'Amukhta Revision & Tajweed Mashq',
    ar: 'تحضير المراجعة الكبرى ومشق التجويد',
  },
  'আমুখতা: পুরোনো পড়ার পুনরাবৃত্তি।': {
    en: 'Amukhta: Systematic revision of previously memorized Juz.',
    ar: 'المراجعة: تثبيت الأجزاء المحفوظة سابقاً بإتقان.',
  },
  'আরবি, ইসলাম ও সাধারণ ক্লাস': {
    en: 'Arabic, Islamic & General Academic Classes',
    ar: 'دروس اللغة العربية والعلوم الشرعية والعامة',
  },
  'প্রতিদিন আড়াই ঘণ্টা': { en: '2.5 hours daily structured classes', ar: 'ساعتان ونصف يومياً' },
  'সালাত, গোসল, দুপুরের খাবার ও ঘুম': {
    en: 'Dhuhr Prayer, Shower, Lunch & Qaylulah Rest',
    ar: 'صلاة الظهر، الاغتسال، الغداء، وقيلولة الراحة',
  },
  'পৌনে ৩টা পর্যন্ত': { en: 'Supervised rest until 2:45 PM', ar: 'حتى الساعة ٢:٤٥ ظهراً' },
  'আমুখতা, তিলাওয়াত ও নতুন সবকের নাজেরা': {
    en: 'Amukhta Recitation & Next Day Sabaq Nazera',
    ar: 'تسميع المراجعة وتلاوة الدرس الجديد نظراً',
  },
  'আসর পর্যন্ত': { en: 'Until Asr prayer time', ar: 'حتى وقت صلاة العصر' },
  'খেলা': { en: 'Afternoon Sports & Recreation', ar: 'النشاط الرياضي والترفيهي' },
  'শারীরিক কসরত ও বিনোদন': { en: 'Physical exercise and outdoor play', ar: 'تمارين بدنية وألعاب جماعية هادفة' },
  'আজকার ও মাগরিবের সালাত': { en: 'Evening Adhkar & Maghrib Prayer', ar: 'أذكار المساء وصلاة المغرب' },
  'মাসনুন দোয়া ও মাগরিবের জামাত': {
    en: 'Masnoon supplications and congregational prayer',
    ar: 'الأدعية المأثورة وصلاة الجماعة',
  },
  'নতুন সবক মুখস্থ': { en: 'Next Day Sabaq Memorization', ar: 'حفظ الدرس الجديد لليوم التالي' },
  'আগামীকালের নতুন পাঠ প্রস্তুতি': {
    en: 'Guided preparation of tomorrow’s Hifz lesson',
    ar: 'إعداد وحفظ اللوح الجديد بإشراف المعلم',
  },
  'ইশার সালাত': { en: 'Isha Congregational Prayer', ar: 'صلاة العشاء جماعة' },
  'জামাতের সাথে ইশার নামাজ আদায়': { en: 'Isha prayer with Sunnah etiquette', ar: 'أداء صلاة العشاء في جماعة' },
  'ছুটি': { en: 'Dismissal & Home Return', ar: 'الانصراف والعودة للمنزل' },
  'অভিভাবকের সাথে বাসায় ফেরা': { en: 'Safe handover to guardians / transport', ar: 'العودة الآمنة مع ولي الأمر أو حافلة المعهد' },
  'সকালের সময় সারা বছর একই। বিকাল ও সন্ধ্যার পড়া সালাতের ওয়াক্ত ধরে চলে, তাই শীতে বিকালের কিছু পড়া সন্ধ্যায় হয়। ছুটি সবসময় রাত ৮:৩০-এ।': {
    en: 'Morning schedules remain constant year-round. Afternoon and evening sessions follow prayer times, adjusting slightly in winter. Dismissal is always at 8:30 PM.',
    ar: 'تظل مواعيد الصباح ثابتة طوال العام، بينما تتبع فترات المساء مواقيت الصلاة، ويكون الانصراف دائماً في الساعة ٨:٣٠ مساءً.',
  },
  'ধাপভেদে মাদরাসার সময়': {
    en: 'Campus Hours Across Stages',
    ar: 'ساعات الدوام حسب المرحلة الدراسية',
  },
  'সকাল ৭টা': { en: '7:00 AM', ar: '٧:٠٠ صباحاً' },
  'দুপুর ১টা': { en: '1:00 PM', ar: '١:٠٠ ظهراً' },
  'রাত ৮:৩০': { en: '8:30 PM', ar: '٨:٣٠ مساءً' },

  // Screenshot 4: Own Transport & Landmarks
  'নিজস্ব পরিবহন': {
    en: 'Institute Own Transport Network',
    ar: 'شبكة النقل المدرسي الخاصة بالمعهد',
  },
  'অভিজ্ঞ চালক ও দায়িত্বশীল সহকারীর মাধ্যমে পরিচালিত।': {
    en: 'Operated by experienced drivers and dedicated student attendants across major routes.',
    ar: 'تُدار بواسطة سائقين ذوي خبرة ومشرفين أمناء لضمان سلامة الطلاب.',
  },
  'মাদরাসার নিজস্ব গাড়ি।': {
    en: 'Official Campus Microbus & Transport Fleet.',
    ar: 'أسطول الحافلات والمركبات الخاصة بالمعهد.',
  },
  'উত্তরা মাইক্রো ১': { en: 'Uttara Microbus 1', ar: 'حافلة أوتارا ١' },
  'উত্তরা মাইক্রো ২': { en: 'Uttara Microbus 2', ar: 'حافلة أوتارا ٢' },
  'উত্তরা অটো': { en: 'Uttara Shuttle', ar: 'مركبة أوتارا' },
  'মিরপুর মাইক্রো': { en: 'Mirpur Microbus', ar: 'حافلة ميربور' },
  'মিরপুর অটো': { en: 'Mirpur Shuttle', ar: 'مركبة ميربور' },
  'মাইক্রোবাস': { en: 'AC Microbus', ar: 'حافلة صغيرة مكيفة' },
  'রিজার্ভ অটো': { en: 'Reserved Shuttle', ar: 'مركبة مخصصة' },
  'হাউস বিল্ডিং': { en: 'House Building', ar: 'هاوس بيلدينغ' },
  'সেক্টর ৭': { en: 'Sector 7', ar: 'قطاع ٧' },
  'সেক্টর ১১': { en: 'Sector 11', ar: 'قطاع ١١' },
  'সেক্টর ১৩': { en: 'Sector 13', ar: 'قطاع ١٣' },
  'খালপাড়': { en: 'Khalpar', ar: 'خالبـار' },
  'জসীমউদ্দীন রোড': { en: 'Jashimuddin Road', ar: 'شارع جاسم الدين' },
  'সেক্টর ১৪': { en: 'Sector 14', ar: 'قطاع ١٤' },
  'সেক্টর ১২': { en: 'Sector 12', ar: 'قطاع ١٢' },
  'সেক্টর ১৫': { en: 'Sector 15', ar: 'قطاع ١٥' },
  'সেক্টর ১৮': { en: 'Sector 18', ar: 'قطاع ١٨' },
  'মিরপুর ১০': { en: 'Mirpur 10', ar: 'ميربور ١٠' },
  'মিরপুর ১৩': { en: 'Mirpur 13', ar: 'ميربور ١٣' },
  'মিরপুর ১১': { en: 'Mirpur 11', ar: 'ميربور ١١' },
  'কালশী': { en: 'Kalshi', ar: 'كالشي' },
  'শাগুফতা': { en: 'Shagufta', ar: 'شاغوفتا' },
  'মিরপুর ডিওএইচএস': { en: 'Mirpur DOHS', ar: 'ميربور DOHS' },
  'রূপনগর আবাসিক এলাকা': { en: 'Rupnagar Residential Area', ar: 'حي روبنغر السكني' },
  'পল্লবী': { en: 'Pallabi', ar: 'بالابي' },
  'মিরপুর সাড়ে ১১': { en: 'Mirpur 11.5', ar: 'ميربور ١١.٥' },
  'মিরপুর ১২ (বি/সি ব্লক)': { en: 'Mirpur 12 (Block B/C)', ar: 'ميربور ١٢ (بلوك B/C)' },
  'মাদরাসাতুল কুরআন': { en: 'Main Campus', ar: 'الحرم الرئيسي للمعهد' },
  'মাহারাত মডেল মাদ্রাসা': { en: 'Maharat Model Madrasah Campus', ar: 'حرم مدرسة مهارات النموذجية' },
  'মেট্রোরেল ও আশেপাশের ল্যান্ডমার্ক থেকে ক্যাম্পাসের দূরত্ব': {
    en: 'Campus Distance from Metro Rail & Key Landmarks',
    ar: 'المسافة إلى الحرم التعليمي من محطة المترو والمعالم الرئيسية',
  },
  'উত্তরা সেন্টার মেট্রো স্টেশন থেকে ৬০০ মিটার পূর্বে': {
    en: '600 Meters East of Uttara Center Metro Rail Station',
    ar: '٦٠٠ متر شرق محطة مترو أوتارا سنتر',
  },
  'উত্তরা সেন্টার মেট্রো স্টেশন': { en: 'Uttara Center Metro Station', ar: 'محطة مترو أوتارا سنتر' },
  'উত্তরা উত্তর (দিয়াবাড়ি) মেট্রো স্টেশন': { en: 'Uttara North Metro Station', ar: 'محطة مترو شمال أوتارا' },
  'জমজম টাওয়ার (সেক্টর ১৩)': { en: 'Zamzam Tower (Sector 13)', ar: 'برج زمزم (قطاع ١٣)' },
  'হাউস বিল্ডিং বাস স্টপেজ': { en: 'House Building Bus Stop', ar: 'محطة حافلات هاوس بيلدينغ' },
  'মিরপুর ডিওএইচএস গেট': { en: 'Mirpur DOHS Main Gate', ar: 'بوابة ميربور DOHS' },
  '৬০০ মিটার': { en: '600 Meters', ar: '٦٠٠ متر' },
  '১.২ কি.মি.': { en: '1.2 km', ar: '١.٢ كم' },
  '১.৮ কি.মি.': { en: '1.8 km', ar: '١.٨ كم' },
  '২.৫ কি.মি.': { en: '2.5 km', ar: '٢.٥ كم' },
  '৩.০ কি.মি.': { en: '3.0 km', ar: '٣.٠ كم' },
  'পূর্বে (হাঁটা পথ ৬ মিনিট)': { en: 'East (6 mins walk)', ar: 'شرقاً (٦ دقائق سيراً)' },
  'দক্ষিণ-পূর্বে': { en: 'South-East', ar: 'جنوب شرق' },
  'পশ্চিমে': { en: 'West', ar: 'غرباً' },
  'পশ্চিমে (খালপাড় হয়ে)': { en: 'West (via Khalpar)', ar: 'غرباً (عبر خالبار)' },
  'উত্তরে': { en: 'North', ar: 'شمالاً' },

  // Admission Comparison, Sibling Discount, Age & Documents
  'ডে-কেয়ার বনাম নন-ডে-কেয়ার ফি তুলনা': {
    en: 'Regular Non-Daycare vs. Full-Day Hifz Day-Care Comparison',
    ar: 'مقارنة بين النظام الصباحي المعتاد ونظام الرعاية النهارية الكاملة',
  },
  'অভিভাবকদের সুবিধার্থে নিয়মিত (নন-ডে-কেয়ার) এবং পূর্ণাঙ্গ হিফজ ডে-কেয়ার ব্যবস্থাপনার পার্থক্য': {
    en: 'Clear side-by-side comparison between Regular Day Classes and Supervised Full-Day Hifz Day-Care',
    ar: 'مقارنة تفصيلية واضحة لأولياء الأمور بين الدوام الاعتيادي ونظام الرعاية النهارية الكاملة',
  },
  'মাদ্রাসার সময়সূচি': { en: 'Campus Schedule', ar: 'ساعات الدوام اليومي' },
  'সকাল ৮:০০ / ৯:০০ থেকে দুপুর ১:০০ পর্যন্ত': { en: '8:00 / 9:00 AM to 1:00 PM', ar: '٨:٠٠ / ٩:٠٠ صباحاً حتى ١:٠٠ ظهراً' },
  'সকাল ৭:০০ থেকে রাত ৮:৩০ পর্যন্ত': { en: '7:00 AM to 8:30 PM (Full Day)', ar: '٧:٠٠ صباحاً حتى ٨:٣٠ مساءً (يوم كامل)' },
  'মাসিক টিউশন ও তত্ত্বাবধান ফি': { en: 'Monthly Tuition & Supervision Fee', ar: 'الرسوم الشهرية والإشراف' },
  '৪,৫০০৳ – ৬,০০০৳ (শ্রেণিভেদে)': { en: 'BDT 4,500 – 6,000 (By Grade)', ar: '٤,٥٠٠ – ٦,٠٠٠ تاكا (حسب الصف)' },
  '৯,৫০০৳ – ১১,৫০০৳ (খাবার ও পূর্ণ তত্ত্বাবধানসহ)': {
    en: 'BDT 9,500 – 11,500 (With Meals & Full Supervision)',
    ar: '٩,٥٠٠ – ١١,٥٠٠ تاكا (شاملاً الوجبات والإشراف الكامل)',
  },
  'খাবার ও নাস্তা সুবিধা': { en: 'Meals & Refreshments', ar: 'الوجبات الصحية والضيافة' },
  'বাসা থেকে টিফিন আনতে হবে': { en: 'Home-packed tiffin', ar: 'إحضار وجبة خفيفة من المنزل' },
  'সকালের নাশতা, দুপুরের খাবার ও বিকালের নাস্তা মাদ্রাসায়': {
    en: 'Breakfast, Lunch & Evening Snacks provided on campus',
    ar: 'الإفطار والغداء ووجبة المساء متوفرة داخل المعهد',
  },
  'দুপুরের বিশ্রাম (কায়লুলাহ) ও খেলাধুলা': { en: 'Midday Rest (Qaylulah) & Sports', ar: 'قيلولة الظهيرة والنشاط الرياضي' },
  'প্রযোজ্য নয়': { en: 'Not Applicable', ar: 'غير مشمول' },
  'নির্ধারিত বেডে দুপুরের ঘুম ও আসরের পর খেলাধুলা': {
    en: 'Dedicated midday rest beds & supervised afternoon sports',
    ar: 'أسرّة مخصصة للقيلولة وأنشطة رياضية بعد العصر',
  },
  'বাসায় অতিরিক্ত প্রাইভেট টিউটর': { en: 'Need for Home Private Tutor', ar: 'الحاجة إلى مدرس خصوصي بالمنزل' },
  'সাধারণত প্রয়োজন হয় না': { en: 'Generally not needed', ar: 'لا حاجة غالباً' },
  'সম্পূর্ণ অপ্রয়োজনীয় (মাদ্রাসাতেই সবক ও হোমওয়ার্ক সম্পন্ন)': {
    en: '100% Unnecessary (All lessons & homework completed at campus)',
    ar: 'غير ضروري إطلاقاً (يتم إنجاز كافة الدروس والواجبات داخل المعهد)',
  },
  'সহোদর / ভাইবোন ছাড় (Sibling Discount)': {
    en: 'Sibling & Family Concession (Sibling Discount)',
    ar: 'خصم الإخوة والأشقاء (Sibling Discount)',
  },
  'একই পরিবারের একাধিক সন্তান অধ্যয়নরত থাকলে ২য় ও পরবর্তী সন্তানের ভর্তি ফিতে ৫০% এবং মাসিক টিউশন ফিতে ২৫% বিশেষ ছাড় প্রযোজ্য।': {
    en: 'Families with multiple enrolled children receive a 50% discount on admission fees and a 25% discount on monthly tuition for the second and subsequent siblings.',
    ar: 'تُمنح العائلات التي لديها أكثر من طالب خصماً بنسبة ٥٠٪ على رسوم القبول و٢٥٪ على الرسوم الشهرية للطالب الثاني وما بعده.',
  },
  'শ্রেণিভিত্তিক ভর্তির বয়সসীমা': {
    en: 'Grade-Wise Age Eligibility Chart',
    ar: 'السن المناسب للقبول حسب الصف الدراسي',
  },
  'ভর্তির জন্য প্রয়োজনীয় কাগজপত্র': {
    en: 'Required Documents for Admission',
    ar: 'المستندات والوثائق المطلوبة للتسجيل',
  },
  'শিক্ষার্থীর অনলাইন জন্ম নিবন্ধন সনদের ফটোকপি (১ কপি)': {
    en: 'Photocopy of Student’s Online Birth Registration Certificate (1 Copy)',
    ar: 'صورة من شهادة الميلاد الرقمية للطالب (نسخة واحدة)',
  },
  'শিক্ষার্থীর সদ্য তোলা পাসপোর্ট সাইজের রঙিন ছবি (৪ কপি)': {
    en: 'Recent Passport-Size Colored Photographs of Student (4 Copies)',
    ar: '٤ صور شخصية ملونة حديثة للطالب بحجم جواز السفر',
  },
  'পিতা ও মাতার জাতীয় পরিচয়পত্র (NID) / পাসপোর্টের ফটোকপি': {
    en: 'Photocopy of Father’s & Mother’s National ID (NID) or Passport',
    ar: 'صورة من بطاقة الهوية الوطنية (NID) أو جواز السفر للوالدين',
  },
  'পিতা ও মাতার পাসপোর্ট সাইজের ছবি (১ কপি করে)': {
    en: 'Passport-Size Photograph of Father & Mother (1 Copy Each)',
    ar: 'صورة شخصية لكل من الأب والأم (نسخة واحدة لكل منهما)',
  },
  'পূর্ববর্তী প্রতিষ্ঠানের ছাড়পত্র (TC) বা মার্কশিট (প্রযোজ্য ক্ষেত্রে)': {
    en: 'Transfer Certificate (TC) or Academic Transcript from Previous School (If applicable)',
    ar: 'شهادة الانتقال أو كشف الدرجات من المدرسة السابقة (إن وجد)',
  },
  'রক্তের গ্রুপ পরীক্ষার রিপোর্ট': {
    en: 'Student Blood Group Test Report',
    ar: 'تقرير فصيلة دم الطالب',
  },

  // Institutional Context & Uniform
  'মাদ্রাসা প্রতিষ্ঠার প্রেক্ষাপট ও দর্শন': {
    en: 'Institutional Context & Educational Philosophy',
    ar: 'خلفية التأسيس والفلسفة التربوية',
  },
  'মাদ্রাসা প্রতিষ্ঠার প্রেক্ষাপট': {
    en: 'Background & Vision of Our Institution',
    ar: 'نشأة المعهد ورسالته التربوية',
  },
  'আমাদের লক্ষ্য ও উদ্দেশ্য (Mission & Objectives)': {
    en: 'Our Core Mission & Strategic Objectives',
    ar: 'أهدافنا الاستراتيجية ورسالتنا التعليمية',
  },
  'পাঠদান পদ্ধতি ও তারবিয়াহ': {
    en: 'Pedagogical Approach & Moral Tarbiyah',
    ar: 'منهجية التدريس والتربية الأخلاقية',
  },
  'মাদ্রাসা ইউনিফর্ম ও ড্রেস কোড': {
    en: 'Official Student Uniform & Dress Code',
    ar: 'الزي المدرسي الرسمي وضوابط المظهر',
  },
  'সুন্নাহসম্মত, মার্জিত ও পরিচ্ছন্ন পোশাকের মাধ্যমে শিক্ষার্থীদের মাঝে শৃঙ্খলা ও আত্মমর্যাদাবোধ গড়ে তোলা হয়।': {
    en: 'Cultivating discipline, modesty, and dignity through neat, Sunnah-compliant institutional attire.',
    ar: 'تعزيز الانضباط والوقار والاعتزاز بالهوية الإسلامية من خلال الزي المدرسي الأنيق الموافق للسنة.',
  },
  'বালক (ছাত্র) ইউনিফর্ম': {
    en: 'Boys’ Official Uniform',
    ar: 'الزي الرسمي للطلاب (البنين)',
  },
  'বালিকা (ছাত্রী) ইউনিফর্ম': {
    en: 'Girls’ Official Uniform',
    ar: 'الزي الرسمي للطالبات (البنات)',
  },
  'মাসনুন দোয়া ও যিকির': {
    en: 'Masnoon Supplications & Evening Adhkar',
    ar: 'الأدعية المأثورة وأذكار المساء',
  },
  'উস্তাদের তত্ত্বাবধানে আগামীকালের সবক প্রস্তুতি': {
    en: 'Guided preparation of tomorrow’s lesson under teacher supervision',
    ar: 'إعداد وحفظ درس الغد تحت إشراف المعلم مباشرة',
  },
  'জামাতের সাথে সালাত আদায়': {
    en: 'Congregational prayer with Sunnah etiquette',
    ar: 'أداء الصلاة جماعة وفق الآداب النبوية',
  },
  'মাইক্রো': {
    en: 'Microbus',
    ar: 'حافلة صغيرة',
  },
  'অটো': {
    en: 'Shuttle',
    ar: 'مركبة نقل',
  },
  'মাহারাত / মাদরাসা ক্যাম্পাস': {
    en: 'Main Campus',
    ar: 'الحرم الرئيسي للمعهد',
  },
  'মাহারাত মডেল মাদ্রাসা (উত্তরা সেক্টর ১২)': {
    en: 'Maharat Model Madrasah (Uttara Sector 12)',
    ar: 'مدرسة المهارات النموذجية (أوتارا قطاع ١٢)',
  },
  'মেট্রোরেল ও প্রধান ল্যান্ডমার্ক থেকে ক্যাম্পাসের দূরত্ব': {
    en: 'Campus Distance from Metro Rail & Key Landmarks',
    ar: 'المسافة إلى المعهد من محطة المترو والمعالم الرئيسية',
  },
  'উত্তরা সেন্টার মেট্রো স্টেশন থেকে ৬০০ মিটার পূর্বে (সেক্টর ১২ সংলগ্ন)': {
    en: '600 Meters East of Uttara Center Metro Station (Adjacent to Sector 12)',
    ar: '٦٠٠ متر شرق محطة مترو أوتارا سنتر (بجوار قطاع ١٢)',
  },
  'উত্তরা সেন্টার মেট্রোরেল স্টেশন': {
    en: 'Uttara Center Metro Rail Station',
    ar: 'محطة مترو أوتارا سنتر',
  },
  'উত্তরা সেক্টর ১২ (খালপাড় / রবীন্দ্র সরণি)': {
    en: 'Uttara Sector 12 (Khalpar / Rabindra Sarani)',
    ar: 'أوتارا قطاع ١٢ (خالبار / شارع رابندرا)',
  },
  '৪০০ মিটার': {
    en: '400 Meters',
    ar: '٤٠٠ متر',
  },
  'মূল ক্যাম্পাস সংলগ্ন': {
    en: 'Adjacent to Main Campus',
    ar: 'بجوار الحرم الرئيسي مباشرة',
  },
  'উত্তরা দক্ষিণ মেট্রোরেল স্টেশন': {
    en: 'Uttara South Metro Rail Station',
    ar: 'محطة مترو جنوب أوتارا',
  },
  '২.৮ কিমি': {
    en: '2.8 km',
    ar: '٢.٨ كم',
  },
  'রিসেপশন রুট': {
    en: 'Direct Reception Route',
    ar: 'طريق مباشر للمعهد',
  },
  'মিরপুর ডিওএইচএস (Mirpur DOHS)': {
    en: 'Mirpur DOHS',
    ar: 'حي ميربور DOHS',
  },
  '২.৫ কিমি': {
    en: '2.5 km',
    ar: '٢.٥ كم',
  },
  'সংযোগ সড়ক হয়ে ১০ মিনিট': {
    en: '10 mins via Link Road',
    ar: '١٠ دقائق عبر الطريق الرابط',
  },
  'হাউস বিল্ডিং / আজমপুর বাস স্ট্যান্ড': {
    en: 'House Building / Azampur Bus Stand',
    ar: 'محطة حافلات هاوس بيلدينغ / عزامبور',
  },
  '৩.২ কিমি': {
    en: '3.2 km',
    ar: '٣.٢ كم',
  },
  'উত্তরা মাইক্রো রুট ১': {
    en: 'Uttara Microbus Route 1',
    ar: 'مسار حافلة أوتارا ١',
  },
  'নন-ডে-কেয়ার বনাম হিফজ ডে-কেয়ার ফি তুলনা': {
    en: 'Regular Non-Daycare vs. Hifz Day-Care Fee Comparison',
    ar: 'مقارنة رسوم الدوام الاعتيادي ونظام الرعاية النهارية للتحفيظ',
  },
  'সকাল থেকে দুপুর ১টা পর্যন্ত নিয়মিত ক্লাস এবং সকাল ৭টা থেকে রাত ৮:৩০ পর্যন্ত পূর্ণাঙ্গ ডে-কেয়ার ব্যবস্থার খরচের তুলনামূলক বিবরণী।': {
    en: 'Comparative breakdown between Regular Classes (until 1:00 PM) and Full-Day Supervised Day-Care (7:00 AM to 8:30 PM).',
    ar: 'مقارنة تفصيلية للرسوم بين الدوام الصباحي المعتاد (حتى ١:٠٠ ظهراً) ونظام الرعاية النهارية الكاملة (من ٧:٠٠ صباحاً حتى ٨:٣٠ مساءً).',
  },
  'মাসিক টিউশন ফি (পাঠদান ও তত্ত্বাবধান)': {
    en: 'Monthly Tuition Fee (Instruction & Supervision)',
    ar: 'الرسوم الدراسية الشهرية (التعليم والإشراف)',
  },
  '৳ ৬,০০০/-': { en: 'BDT 6,000/-', ar: '٦,٠٠٠ تاكا' },
  '৳ ১০,০০০/-': { en: 'BDT 10,000/-', ar: '١٠,٠٠٠ تاكا' },
  'মাসিক খাবার ফি (সকালের নাশতা, দুপুরের খাবার ও বিকালের নাস্তা)': {
    en: 'Monthly Meal Fee (Breakfast, Lunch & Afternoon Snacks)',
    ar: 'رسوم الوجبات الشهرية (الإفطار، الغداء، ووجبة المساء)',
  },
  '৳ ৪,৫০০/-': { en: 'BDT 4,500/-', ar: '٤,٥٠٠ تاكا' },
  'এককালীন ভর্তি ফি (Admission Fee)': {
    en: 'One-Time Admission Fee',
    ar: 'رسوم القبول والتسجيل (لمرة واحدة)',
  },
  '৳ ২০,০০০/-': { en: 'BDT 20,000/-', ar: '٢٠,٠٠٠ تاكا' },
  '৳ ২৫,০০০/-': { en: 'BDT 25,000/-', ar: '٢٥,٠٠٠ تاكا' },
  'বার্ষিক সেশন ও শিক্ষা উপকরণ ফি (Annual Session Fee)': {
    en: 'Annual Session & Learning Materials Fee',
    ar: 'رسوم الدورة السنوية والوسائل التعليمية',
  },
  '৳ ১৫,০০০/-': { en: 'BDT 15,000/-', ar: '١٥,٠٠٠ تاكا' },
  'মাদ্রাসায় অবস্থানকাল (Daily Campus Timing)': {
    en: 'Daily Campus Hours',
    ar: 'ساعات التواجد اليومي بالمعهد',
  },
  'সকাল ৮:০০/৯:০০ — দুপুর ১:০০': {
    en: '8:00 / 9:00 AM — 1:00 PM',
    ar: '٨:٠٠ / ٩:٠٠ صباحاً — ١:٠٠ ظهراً',
  },
  'সকাল ৭:০০ — রাত ৮:৩০': {
    en: '7:00 AM — 8:30 PM',
    ar: '٧:٠٠ صباحاً — ٨:٣٠ مساءً',
  },
  'সহোদর / ভাইবোন ছাড় (Sibling Discount Policy)': {
    en: 'Sibling Concession Policy (Sibling Discount)',
    ar: 'سياسة خصم الإخوة والأشقاء',
  },
  'একই পরিবারের একাধিক সন্তান অধ্যয়ন করলে ২য় ও পরবর্তী সন্তানের ভর্তি ফিতে ২৫% এবং মাসিক টিউশন বেতনে ১০% বিশেষ সহোদর ছাড় প্রদান করা হয়।': {
    en: 'When multiple children from the same family study here, the 2nd and subsequent siblings receive a 25% discount on admission fees and a 10% discount on monthly tuition.',
    ar: 'عند التحاق أكثر من طالب من نفس الأسرة، يحصل الطالب الثاني وما بعده على خصم ٢٥٪ في رسوم القبول و١٠٪ في الرسوم الشهرية.',
  },
  'শ্রেণিভিত্তিক ভর্তির বয়সসীমা (Age Eligibility)': {
    en: 'Grade-Wise Age Eligibility Chart',
    ar: 'جدول السن المناسب للقبول حسب الصف',
  },
  'প্লে (Play Group)': { en: 'Play Group', ar: 'مرحلة التمهيدي الأول (Play)' },
  '৪+ বছর': { en: '4+ Years', ar: '+٤ سنوات' },
  'প্রি-হিফজ ফাউন্ডেশন': { en: 'Pre-Hifz Foundation', ar: 'تأسيس ما قبل الحفظ' },
  'নার্সারি (Nursery)': { en: 'Nursery', ar: 'الروضة (Nursery)' },
  'প্রি-হিফজ (কায়দা)': { en: 'Pre-Hifz (Qaida)', ar: 'ما قبل الحفظ (القاعدة)' },
  'কেজি (KG)': { en: 'KG', ar: 'التمهيدي (KG)' },
  '৬+ বছর': { en: '6+ Years', ar: '+٦ سنوات' },
  'প্রি-হিফজ (আম্মাপারা)': { en: 'Pre-Hifz (Juz Amma)', ar: 'ما قبل الحفظ (جزء عمّ)' },
  '১ম শ্রেণি (Class 1)': { en: 'Grade 1 (Class 1)', ar: 'الصف الأول' },
  '৭+ বছর': { en: '7+ Years', ar: '+٧ سنوات' },
  'প্রি-হিফজ (নাজেরা)': { en: 'Pre-Hifz (Nazera)', ar: 'ما قبل الحفظ (التلاوة)' },
  '২য় থেকে ৫ম শ্রেণি': { en: 'Grade 2 to Grade 5', ar: 'من الصف الثاني إلى الخامس' },
  '৮+ থেকে ১১+ বছর': { en: '8+ to 11+ Years', ar: 'من +٨ إلى +١١ سنة' },
  'হিফজ ও শুনানি স্তর': { en: 'Hifz & Shunani Track', ar: 'مرحلة الحفظ والتسميع' },
  '৬ষ্ঠ থেকে ১০ম (দাখিল)': { en: 'Grade 6 to 10 (Dakhil)', ar: 'من السادس إلى العاشر (الداخل)' },
  '১২+ থেকে ১৬+ বছর': { en: '12+ to 16+ Years', ar: 'من +١٢ إلى +١٦ سنة' },
  'আফটার হিফজ স্তর': { en: 'After-Hifz Track', ar: 'مرحلة ما بعد الحفظ' },
  'ভর্তির জন্য প্রয়োজনীয় কাগজপত্র (Required Documents)': {
    en: 'Required Documents for Admission',
    ar: 'الوثائق والمستندات المطلوبة للقبول',
  },
  'শিক্ষার্থীর জন্ম নিবন্ধন সনদের ফটোকপি (Online Birth Certificate)।': {
    en: 'Photocopy of Student’s Online Birth Registration Certificate.',
    ar: 'صورة من شهادة الميلاد الرقمية للطالب.',
  },
  'শিক্ষার্থীর পাসপোর্ট সাইজের ৪ কপি রঙিন ছবি।': {
    en: '4 Passport-Size Colored Photographs of the Student.',
    ar: '٤ صور شخصية ملونة للطالب بحجم جواز السفر.',
  },
  'পিতা ও মাতার জাতীয় পরিচয়পত্রের (NID) ফটোকপি।': {
    en: 'Photocopy of Father’s & Mother’s National ID Card (NID).',
    ar: 'صورة من بطاقة الهوية الوطنية (NID) للأب والأم.',
  },
  'পিতা ও মাতার পাসপোর্ট সাইজের ২ কপি করে ছবি।': {
    en: '2 Passport-Size Photographs Each of Father & Mother.',
    ar: 'صورتان شخصيتان لكل من الأب والأم.',
  },
  'পূর্ববর্তী প্রতিষ্ঠানের ছাড়পত্র / মার্কশিট (২য় শ্রেণি থেকে তদূর্ধ্ব শ্রেণির জন্য)।': {
    en: 'Transfer Certificate (TC) / Academic Transcript from Previous Institution (For Grade 2 & above).',
    ar: 'شهادة الانتقال أو كشف الدرجات من المدرسة السابقة (للصف الثاني فما فوق).',
  },
  'মাদ্রাসা ইউনিফর্ম ও ড্রেস কোড (Madrasah Uniform)': {
    en: 'Official Student Uniform & Dress Code',
    ar: 'الزي المدرسي الرسمي وضوابط المظهر',
  },
  'সুন্নাহসম্মত, শালীন ও পরিচ্ছন্ন পোশাক পরিধান আমাদের তারবিয়াহ ও আদব শিক্ষার অন্যতম অংশ।': {
    en: 'Wearing modest, neat, and Sunnah-compliant attire is an integral part of our moral Tarbiyah and etiquette training.',
    ar: 'إن ارتداء الزي الأنيق المحتشم الموافق للسنة جزء أصيل من منهجنا التربوي والأخلاقي.',
  },
  'বালক শিক্ষার্থীদের পোশাক (Boys Uniform)': {
    en: 'Boys’ Official Dress Code',
    ar: 'الزي الرسمي للطلاب (البنين)',
  },
  'নির্ধারিত রঙের সুন্নতি পাঞ্জাবি বা জুব্বা (হাঁটুর নিচে পর্যন্ত লম্বা)।': {
    en: 'Approved Sunnah Panjabi or Thobe (extending below the knees).',
    ar: 'ثوب أو قميص سني باللون المعتمد (يمتد إلى ما تحت الركبة).',
  },
  'সাদা ঢোলা পায়জামা (টাখনুর ওপরে)।': {
    en: 'Loose White Trouser / Pajama (above the ankles).',
    ar: 'سروال أبيض فضفاض (فوق الكعبين).',
  },
  'সাদা পাঁচকলি বা গোল সুন্নতি টুপি।': {
    en: 'White Five-Panel or Round Sunnah Cap.',
    ar: 'قبعة بيضاء سنية (طاقية).',
  },
  'শীতকালে মাদ্রাসা নির্ধারিত নেভি-ব্লু সোয়েটার বা ব্লেজার এবং কালো জুতা ও সাদা মোজা।': {
    en: 'Campus-prescribed Navy-Blue Sweater or Blazer in winter, with black shoes and white socks.',
    ar: 'سترة أو بليزر كحلي معتمد في الشتاء، مع حذاء أسود وجوارب بيضاء.',
  },
  'বালিকা শিক্ষার্থীদের পোশাক (Girls Uniform)': {
    en: 'Girls’ Official Dress Code',
    ar: 'الزي الرسمي للطالبات (البنات)',
  },
  'নির্ধারিত রঙের ঢিলেঢালা ম্যাক্সি/গাউন ও সাদা সালোয়ার।': {
    en: 'Approved loose-fitting Gown / Abaya with white Salwar.',
    ar: 'عباءة مدرسية فضفاضة باللون المعتمد مع سروال أبيض.',
  },
  'পূর্ণাঙ্গ হিজাব বা স্কার্ফ (বয়সভেদে নিকাব ও আবায়া)।': {
    en: 'Full Hijab / Headscarf (Abaya & Niqab for senior grades).',
    ar: 'حجاب كامل ساتر (وعباءة ونقاب للمراحل العليا).',
  },
  'শীতকালে মাদ্রাসা নির্ধারিত কার্ডিগান বা সোয়েটার এবং কালো কাপড়ের জুতা ও মোজা।': {
    en: 'Campus-prescribed Cardigan or Sweater in winter, with black shoes and socks.',
    ar: 'سترة شتوية معتمدة في فصل الشتاء مع حذاء أسود وجوارب.',
  },
  'বিশেষ দ্রষ্টব্য: ভর্তির পর মাদ্রাসার নির্দিষ্ট টেইলার্স বা স্টোর থেকে কাপড়ের নমুনা ও মাপ অনুযায়ী ইউনিফর্ম সংগ্রহ করা যাবে।': {
    en: 'Note: After admission, official uniform fabric and measurements can be collected from the designated campus store.',
    ar: 'ملاحظة: بعد إتمام التسجيل يمكن الحصول على الزي الرسمي والمقاسات المعتمدة من متجر المعهد المخصص.',
  },
  'মাদ্রাসা প্রতিষ্ঠার প্রেক্ষাপট ও লক্ষ্য (Maharat Model Madrasah Context)': {
    en: 'Institutional Context & Vision',
    ar: 'خلفية التأسيس والرسالة التعليمية',
  },
  'মাহারাত মডেল মাদ্রাসা — মানসম্মত শিক্ষা, দক্ষ জাতি ও উন্নত দেশ': {
    en: 'Quality Education, Skilled Generation & Prosperous Nation',
    ar: 'تعليم متميز، جيل كفؤ، ووطن متقدم',
  },
  'শিক্ষা জাতির মেরুদণ্ড। কিন্তু সে শিক্ষা যদি হয় আদর্শ ও নৈতিকতাবিবর্জিত, তবে তা জাতিকে আলোর বদলে অন্ধকারের দিকে ঠেলে দেয়। আমাদের দেশে প্রচলিত দুটি প্রধান শিক্ষাধারা—জেনারেল ও মাদ্রাসা শিক্ষার মধ্যকার দূরত্ব ঘুচিয়ে একটি সমন্বিত, যুগোপযোগী ও মানসম্মত শিক্ষাব্যবস্থা গড়ে তোলার মহান লক্ষ্য নিয়ে প্রতিষ্ঠিত হয়েছে মাহারাত মডেল মাদ্রাসা (Maharat Model Madrasah)।': {
    en: 'Education is the backbone of a nation. Yet education devoid of moral values leads society into darkness rather than light. Bridging the gap between general academic schooling and classical Islamic seminary education, our institution provides a world-class, integrated educational system.',
    ar: 'التعليم هو العمود الفقري للأمة، ولردم الفجوة بين التعليم الأكاديمي العام والتعليم الشرعي الأصيل، تأسس هذا الصرح التعليمي ليقدم منهجاً متكاملاً يجمع بين الأصالة والمعاصرة.',
  },
  'আমরা এমন এক প্রজন্ম গড়ে তুলতে চাই যারা একদিকে কুরআন-সুন্নাহর গভীর জ্ঞানে আলোকিত হয়ে মসজিদের মেহরাবে ইমামতি ও দ্বীনি নেতৃত্ব দিতে পারবে, অন্যদিকে আধুনিক বিজ্ঞান, গণিত, ইংরেজি ও তথ্যপ্রযুক্তিতে দক্ষ হয়ে ডাক্তার, প্রকৌশলী, বিচারক বা আদর্শ প্রশাসক হিসেবে দেশ ও উম্মাহর সেবা করতে পারবে।': {
    en: 'We aim to nurture a generation illuminated by deep knowledge of the Quran and Sunnah capable of spiritual leadership, while equally excelling in modern science, mathematics, English, and technology as doctors, engineers, scholars, and ethical leaders.',
    ar: 'نهدف إلى إعداد جيل مستنير بعلوم القرآن والسنة قادر على القيادة الدينية، ومتفوق في الوقت ذاته في العلوم الحديثة والرياضيات واللغات والتقنية لخدمة المجتمع والأمة.',
  },
  'আমাদের লক্ষ্য ও উদ্দেশ্য (Our Mission)': {
    en: 'Our Core Mission & Objectives',
    ar: 'رسالتنا وأهدافنا الاستراتيجية',
  },
  'বিশুদ্ধ তাজবীদ ও তারতীলসহ পবিত্র কুরআন তিলাওয়াত ও হিফজ সম্পন্ন করানো।': {
    en: 'Ensuring authentic Quran recitation and Hifz with proper Tajweed and Tarteel.',
    ar: 'إتقان تلاوة وحفظ القرآن الكريم بالتجويد والترتيل الصحيح.',
  },
  'বাংলা, ইংরেজি ও আরবি—এই তিন ভাষায় সাবলীল কথোপকথন ও লেখার দক্ষতা তৈরি করা।': {
    en: 'Developing fluent speaking and writing proficiency in Bengali, English, and Arabic.',
    ar: 'تنمية مهارات المحادثة والكتابة بطلاقة في اللغات الثلاث: البنغالية والإنجليزية والعربية.',
  },
  'আলিয়া মাদ্রাসা বোর্ড (NCTB দাখিল) ও আন্তর্জাতিক মানের জেনারেল কারিকুলামের ৫০/৫০ সমন্বয়।': {
    en: '50/50 integration of National Curriculum (NCTB Dakhil) and international-standard general academics.',
    ar: 'دمج متوازن بنسبة ٥٠/٥٠ بين المنهج الوطني المعتمد والمعايير الأكاديمية العالمية.',
  },
  'শিশুদের চরিত্র গঠনে নবীজী (সা.)-এর সুন্নাহ, আদব-আখলাক ও আমলি তারবিয়াহ নিশ্চিত করা।': {
    en: 'Instilling Prophetic Sunnah, noble character (Akhlaq), and practical Tarbiyah in every child.',
    ar: 'غرس السنة النبوية والآداب الإسلامية والتربية العملية في نفوس الطلاب.',
  },
  'আমাদের ভবিষ্যৎ রূপকল্প (Our Vision)': {
    en: 'Our Strategic Vision',
    ar: 'رؤيتنا المستقبلية',
  },
  'মাধ্যমিক (দাখিল) পর্যায়ে এমন মজবুত ভিত্তি তৈরি করা যাতে শিক্ষার্থী উচ্চশিক্ষায় মাদ্রাসা বা কলেজ—উভয় ক্ষেত্রেই শীর্ষস্থান অর্জন করতে পারে।': {
    en: 'Building a rock-solid secondary foundation so students achieve top ranks in both higher Islamic seminaries and mainstream colleges.',
    ar: 'بناء أساس علمي متين في المرحلة الثانوية يؤهل الطالب للتفوق في الجامعات الأكاديمية أو المعاهد الشرعية العليا.',
  },
  'প্রাইভেট টিউটর ছাড়াই ক্লাসের পড়া ক্লাসেই সম্পন্ন করার আধুনিক ও আনন্দময় শিক্ষাপদ্ধতি।': {
    en: 'Modern, joyful classroom pedagogy that completes all lessons in class without needing home private tutors.',
    ar: 'منهجية تدريس تفاعلية حديثة تُنجز كافة الدروس داخل الفصل دون الحاجة إلى دروس خصوصية بالمنزل.',
  },
  'উত্তরা ও ঢাকা অঞ্চলের অভিভাবকদের জন্য সবচেয়ে নির্ভরযোগ্য, নিরাপদ ও আদর্শ দ্বীনি শিক্ষাপ্রতিষ্ঠান হিসেবে নিজেদের প্রতিষ্ঠিত করা।': {
    en: 'Serving as the most trusted, safe, and exemplary integrated Islamic educational institution for families.',
    ar: 'تقديم نموذج تعليمي آمن وموثوق ورائد يجمع بين التربية الإسلامية والتميز الأكاديمي.',
  },
  'আমাদের বিশেষ শিক্ষণ কৌশল (Our Approach)': {
    en: 'Our Pedagogical Approach',
    ar: 'منهجيتنا التربوية والتعليمية',
  },
  'অভিজ্ঞ হাফেজ, আলেম ও বিশ্ববিদ্যালয় গ্র্যাজুয়েট শিক্ষকদের সমন্বয়ে গঠিত প্যানেল; অডিও-ভিজ্যুয়াল স্মার্ট ক্লাসরুম; সাপ্তাহিক ও মাসিক তারবিয়াহ মূল্যায়ন এবং দুর্বল শিক্ষার্থীদের জন্য স্পেশাল কেয়ার।': {
    en: 'Faculty combining experienced Huffaz, Islamic scholars, and university graduates; smart audio-visual classrooms; regular Tarbiyah evaluations, and dedicated care for every learner.',
    ar: 'نخبة من الحفاظ والعلماء وخريجي الجامعات، فصول ذكية تفاعلية، تقييم تربوي دوري، ورعاية خاصة لكل طالب.',
  },
  'চেয়ারম্যান মহোদয়ের বাণী (Chairman Message)': {
    en: 'Message from the Chairman',
    ar: 'كلمة رئيس مجلس الإدارة',
  },
  'সন্তান আপনার সবচেয়ে বড় আমানত। দুনিয়ার সাময়িক সফলতার পাশাপাশি আখেরাতে নাজাতের জন্য সন্তানকে কুরআন ও আধুনিক জ্ঞানের সমন্বিত শিক্ষায় শিক্ষিত করা প্রতিটি সচেতন অভিভাবকের দায়িত্ব। মাহারাত মডেল মাদ্রাসায় আমরা সেই আমানতের সর্বোত্তম হেফাজতে প্রতিশ্রুতিবদ্ধ।': {
    en: 'Your child is your greatest trust (Amanah). Educating them in both the Quran and modern sciences for success in this world and the Hereafter is every conscious parent’s duty. We are committed to safeguarding that sacred trust.',
    ar: 'الأبناء أمانة عظيمة، وتعليمهم القرآن الكريم والعلوم الحديثة معاً لتحقيق الفلاح في الدنيا والآخرة مسؤولية كل ولي أمر واعٍ، ونحن ملتزمون برعاية هذه الأمانة بأعلى المعايير.',
  },
  'অধ্যক্ষ মহোদয়ের বাণী (Principal Message)': {
    en: 'Message from the Principal',
    ar: 'كلمة عميد المعهد',
  },
  'আমরা মুখস্থবিদ্যার পরিবর্তে অনুধাবন ও বাস্তব অনুশীলনে বিশ্বাসী। প্রতিটি শিক্ষার্থীর মেধা ও মনস্তত্ত্ব বুঝে ব্যক্তিগত যত্নের মাধ্যমে আমরা তাদের সুপ্ত প্রতিভার বিকাশ ঘটাই।': {
    en: 'We believe in comprehension and practical application over rote memorization. By understanding each student’s aptitude and psychology, we nurture their unique potential through personalized mentorship.',
    ar: 'نؤمن بالفهم والتطبيق العملي بدلاً من التلقين المجرد، ونحرص على تنمية مواهب كل طالب من خلال الرعاية الفردية المتخصصة.',
  },
  'মোঃ সাইফুল ইসলাম (অভিভাবক — ৩য় শ্রেণি)': {
    en: 'Md. Saiful Islam (Guardian — Grade 3)',
    ar: 'محمد سيف الإسلام (ولي أمر — الصف الثالث)',
  },
  'আহনাফ ইসলাম': {
    en: 'Ahnaf Islam',
    ar: 'أحناف إسلام',
  },
  '৩য় শ্রেণি (হিফজ বিভাগ)': {
    en: 'Grade 3 (Hifz Department)',
    ar: 'الصف الثالث (قسم التحفيظ)',
  },
  'পরামর্শ (Suggestion)': {
    en: 'Suggestion',
    ar: 'اقتراح تطويري',
  },
  'উত্তরা সেক্টর ১২ এর মাইক্রোবাস রুট ২ এর গাড়িটি সকাল ৬:৪৫ এর পরিবর্তে ৬:৫০ এ সেক্টর ১৪ মোড়ে আসলে শিশুদের জন্য সুবিধা হয়।': {
    en: 'It would be very convenient for the children if the Uttara Sector 12 Microbus Route 2 arrives at Sector 14 crossing at 6:50 AM instead of 6:45 AM.',
    ar: 'سيكون من المريح جداً للأطفال لو تصل حافلة المسار الثاني (قطاع ١٢) إلى تقاطع قطاع ١٤ الساعة ٦:٥٠ صباحاً بدلاً من ٦:٤٥.',
  },
  'জাযাকাল্লাহু খাইরান। আপনার পরামর্শটি পরিবহন শাখায় জানানো হয়েছে এবং সময় সমন্বয় করা হচ্ছে।': {
    en: 'JazakAllahu Khairan. Your suggestion has been forwarded to the Transport Department and the stop timing is being adjusted.',
    ar: 'جزاكم الله خيراً، تم إحالة اقتراحكم إلى قسم النقل المدرسي وجارٍ تعديل الموعد.',
  },

  // Site Settings & Contact Strings
  'ইসলামি ও আধুনিক শিক্ষার সমন্বয়ে স্কিলস বেইসড শিক্ষা কারিকুলাম নিয়ে বাংলাদেশে আমরাই প্রথম..!!': {
    en: 'Bangladesh’s First Integrated Islamic & Modern Skills-Based Educational Curriculum!',
    ar: 'الأول في بنغلاديش بمنهج تعليمي متكامل يجمع بين العلوم الإسلامية والمهارات الحديثة!',
  },
  'স্কিলস বেইসড শিক্ষা কারিকুলাম নিয়ে': {
    en: 'Pioneering a Skills-Based Curriculum',
    ar: 'ريادة التعليم القائم على المهارات',
  },
  'বাংলাদেশে আমরাই প্রথম..!!': {
    en: 'First Time in Bangladesh!',
    ar: 'لأول مرة في بنغلاديش!',
  },
  'আমরা কেবল শিক্ষার্থী তৈরি করি না, আমরা মানবিক মূল্যবোধ সম্পন্ন আলোকিত মানুষ গড়ি। নার্সারি থেকে ক্লাস এইট পর্যন্ত এবং হিফজুল কুরআন বিভাগে আবাসিক, অনাবাসিক ও ডে-কেয়ারে ভর্তি চলছে।': {
    en: 'We do not merely produce students; we nurture enlightened individuals with strong moral values. Admissions are open from Nursery to Grade 8 and in Hifzul Quran (Residential, Non-Residential & Day-Care).',
    ar: 'نحن لا نخرّج طلاباً فحسب، بل نبني جيلاً مستنيراً يتحلى بالقيم الأخلاقية. التسجيل مفتوح من الروضة حتى الصف الثامن وفي قسم تحفيظ القرآن (داخلي، نهاري، ورعاية نهارية).',
  },
  '01604-858100 (ভর্তির জন্য)': {
    en: '01604-858100 (Admission Desk)',
    ar: '01604-858100 (مكتب القبول)',
  },
  '01830678383 (অফিসিয়াল)': {
    en: '01830678383 (Official Desk)',
    ar: '01830678383 (المكتب الرسمي)',
  },
  'ঢাকা-চট্টগ্রাম মহাসড়ক (চিটাগাং রোড) সংলগ্ন ওয়াপদা রোড, নিমাইকাশারী বাজার, ফিউচার টাওয়ার (স্বপ্ন সুপার শপ বিল্ডিং - ৫ম তলা), সিদ্ধিরগঞ্জ, নারায়ণগঞ্জ - ১৪৩০': {
    en: '5th Floor, Future Tower (Shwapno Super Shop Building), Wapda Road, Nimaikashari Bazar, Chittagong Road, Siddhirganj, Narayanganj - 1430',
    ar: 'الطابق الخامس، برج فيوتشر، طريق وابدا، شيتاغونغ رود، سيديرغانج، نارايانغانج - ١٤٣٠',
  },
  'উত্তরা সেক্টর ১২ (উত্তরা সেন্টার মেট্রোরেল স্টেশন থেকে ৬০০ মিটার পূর্বে), ঢাকা-১২৩০': {
    en: 'Uttara Sector 12 (600m East of Uttara Center Metro Rail Station), Dhaka-1230',
    ar: 'أوتارا قطاع ١٢ (٦٠٠ متر شرق محطة مترو أوتارا سنتر)، دكا - ١٢٣٠',
  },
  'শনিবার - বৃহস্পতিবার: সকাল ৮:০০ - বিকাল ৫:০০ (শুক্রবার জুমার পর অভিভাবক সাক্ষাৎ)': {
    en: 'Saturday – Thursday: 8:00 AM – 5:00 PM (Friday Parent Visits after Jummah)',
    ar: 'السبت – الخميس: ٨:٠٠ صباحاً – ٥:٠٠ مساءً (زيارة أولياء الأمور يوم الجمعة بعد الصلاة)',
  },

  // Promotional Popup Modal
  'সীমিত সময়ের অফার': {
    en: 'Limited Time Admission Offer',
    ar: 'عرض قبول لفترة محدودة',
  },
  'ভর্তি চলছে ২০২৭! প্রথম ১০০ জনের জন্য বিশেষ': {
    en: 'Admissions Open 2027! Special Offer for First 100 Students:',
    ar: 'التسجيل مفتوح لعام ٢٠٢٧! عرض خاص لأول ١٠٠ طالب:',
  },
  '১০% ডিসকাউন্ট': {
    en: '10% Special Discount',
    ar: 'خصم خاص ١٠٪',
  },
  'অফারটি শেষ হতে আর মাত্র কিছু সময় বাকি — এখনই আবেদন করে আসন নিশ্চিত করুন': {
    en: 'Limited seats remaining under this promotional wave — apply online now to secure your child’s admission.',
    ar: 'لم يتبق سوى وقت قصير على انتهاء هذا العرض — بادر بالتقديم الآن لتأكيد مقعد طفلك.',
  },
  'এখনই আবেদন করুন': {
    en: 'Apply Online Now',
    ar: 'قدم طلبك الآن',
  },
  'এখনই ভর্তি হোন': {
    en: 'Enroll Now',
    ar: 'سجل الآن',
  },

  // Campus & Department Videos
  'আমাদের ক্যাম্পাস ডকুমেন্টারি': {
    en: 'Our Campus Documentary Tour',
    ar: 'جولة وثائقية في رحاب المعهد',
  },
  'এক ভিডিওতে ঘুরে দেখুন আমাদের পুরো ক্যাম্পাস — শ্রেণিকক্ষ থেকে হিফজখানা।': {
    en: 'Take a complete tour of our modern classrooms, Hifz hall, IT lab, and safe residential facilities in one video.',
    ar: 'شاهد في فيديو واحد كافة مرافق المعهد من الفصول الذكية إلى قاعات التحفيظ والمختبرات.',
  },
  'ক্যাম্পাস ট্যুর দেখুন': {
    en: 'Watch Campus Tour',
    ar: 'شاهد جولة الحرم',
  },
  'একাডেমিক কারিকুলাম': {
    en: 'Academic Curriculum',
    ar: 'المنهج الأكاديمي المتكامل',
  },
  'একাডেমিক কারিকুলাম (প্রেপ থেকে দাখিল)': {
    en: 'Academic Curriculum (Prep to Dakhil)',
    ar: 'المنهج الأكاديمي (من التمهيدي حتى الداخل)',
  },
  'প্রেপ (নার্সারি) থেকে ক্লাস এইট/দাখিল পর্যন্ত': {
    en: 'From Prep (Nursery) to Grade 8 / Dakhil',
    ar: 'من مرحلة الروضة حتى الصف الثامن / الداخل',
  },
  'ভর্তি করানোর পূর্বে অবশ্যই ভিডিওটি দেখে নিন। জাতীয় শিক্ষাক্রমের পাশাপাশি ইংরেজি, আরবি, গণিত ও আইটি স্কিলসের সমন্বিত সিলেবাস।': {
    en: 'Watch this overview before admission. An integrated syllabus combining the National Curriculum with Spoken English, Arabic, Math, and 12 IT skills.',
    ar: 'يرجى مشاهدة الفيديو قبل التسجيل؛ منهج متكامل يجمع بين المنهج الوطني واللغتين الإنجليزية والعربية والرياضيات ومهارات التقنية.',
  },
  'একাডেমিক বিভাগে ভর্তি আবেদন': {
    en: 'Apply to Academic Dept.',
    ar: 'التقديم في القسم الأكاديمي',
  },
  'তাহফিজুল কুরআন (নূরানী, নাজেরা ও হিফজ)': {
    en: 'Tahfizul Quran (Noorani, Nazera & Hifz)',
    ar: 'تحفيظ القرآن الكريم (النورانية، الناظرة، والحفظ)',
  },
  '(নূরানী, নাজেরা ও হিফজ)': {
    en: '(Noorani, Nazera & Hifz)',
    ar: '(النورانية، الناظرة، والحفظ)',
  },
  'Tahfizul Quran & Islamic Studies — আন্তর্জাতিক মানের হাফেজ ও ক্বারীদের তত্ত্বাবধানে বিশুদ্ধ হিফজের পাশাপাশি জেনারেল শিক্ষার সমন্বয়।': {
    en: 'Tahfizul Quran & Islamic Studies — Authentic Quran memorization under internationally certified Qaris & Huffaz alongside core general academics.',
    ar: 'تحفيظ القرآن والدراسات الإسلامية — حفظ متقن بإشراف نخبة من القراء والحفاظ المجازين مع دراسة المواد الأكاديمية الأساسية.',
  },
  'হিফজ বিভাগে ভর্তি আবেদন': {
    en: 'Apply to Hifz Dept.',
    ar: 'التقديم في قسم التحفيظ',
  },

  // Activity Videos (12 Videos)
  'খুদে সাংবাদিকদের নিউজ রিপোর্টিং': {
    en: 'Young Journalists News Reporting Showcase',
    ar: 'تقرير إخباري يقدمه الصحفيون الصغار بالمعهد',
  },
  'দুই শিক্ষার্থীর অবিশ্বাস্য নিউজ প্রেজেন্টেশন': {
    en: 'Remarkable News Presentation by Two Students',
    ar: 'تقديم إخباري متميز لطالبين من المعهد',
  },
  'মাদ্রাসার শিক্ষার্থীদের অসাধারণ বিতর্ক': {
    en: 'Parliamentary Debate Showcase by Students',
    ar: 'مناظرة علمية وحوارية رائعة لطلاب المعهد',
  },
  'মার্শাল আর্ট ও কারাতে আত্মরক্ষা': {
    en: 'Martial Arts & Karate Self-Defense Training',
    ar: 'تدريب الكاراتيه وفنون الدفاع عن النفس',
  },
  'ক্লাসেই শেখানো হচ্ছে রান্নাবান্না': {
    en: 'Practical Culinary & Essential Life Skills Session',
    ar: 'تدريب عملي على المهارات الحياتية والاعتماد على النفس',
  },
  'মাদ্রাসার ছাত্রীদের ইংলিশ নিউজ প্রেজেন্টেশন': {
    en: 'English News Presentation by Female Students',
    ar: 'تقديم نشرة الأخبار باللغة الإنجليزية لطالبات المعهد',
  },
  'ক্যাম্পাসে এক দারুণ সকালের গল্প': {
    en: 'A Vibrant Morning Assembly & Tarbiyah on Campus',
    ar: 'إشراقة صباحية تربوية مميزة داخل الحرم التعليمي',
  },
  'সংগীত প্রশিক্ষণ, শুনুন সুরের গল্প!': {
    en: 'Islamic Nasheed & Vocal Artistry Workshop',
    ar: 'التدريب على النشيد الإسلامي والأداء الصوتي',
  },
  'সঠিক নিয়মে সালাম ও সুন্নাহ আদব': {
    en: 'Prophetic Greeting (Salam) & Daily Sunnah Etiquette',
    ar: 'تعليم آداب السلام والسنن النبوية اليومية',
  },
  'সাঁতার ও ওয়াটার সেফটি প্রশিক্ষণ': {
    en: 'Swimming & Water Safety Practical Training',
    ar: 'تدريب السباحة والسلامة المائية للطلاب',
  },
  'আরবি ও বাংলা ক্যালিগ্রাফি আর্ট': {
    en: 'Arabic & Bengali Calligraphy Art Workshop',
    ar: 'ورشة فن الخط العربي والبنغالي',
  },

  // Guardian Video Review Reels
  'ইঞ্জিনিয়ার তানভীর আহমেদ': {
    en: 'Engr. Tanvir Ahmed',
    ar: 'المهندس تنوير أحمد',
  },
  'ইঞ্জিনিয়ার তানভীর আহমেদ (অভিভাবক)': {
    en: 'Engr. Tanvir Ahmed (Guardian)',
    ar: 'المهندس تنوير أحمد (ولي أمر)',
  },
  'অভিভাবক ভিডিও রিভিউ: ইঞ্জিনিয়ার তানভীর আহমেদ': {
    en: 'Parent Testimonial: Engr. Tanvir Ahmed on Academic & Moral Quality',
    ar: 'انطباع ولي الأمر: المهندس تنوير أحمد حول المستوى العلمي والتربوي',
  },
  'ড. মাহমুদুল হাসান': {
    en: 'Dr. Mahmudul Hasan',
    ar: 'الدكتور محمود الحسن',
  },
  'ড. মাহমুদুল হাসান (অভিভাবক)': {
    en: 'Dr. Mahmudul Hasan (Guardian)',
    ar: 'الدكتور محمود الحسن (ولي أمر)',
  },
  'অভিভাবক ভিডিও রিভিউ: ড. মাহমুদুল হাসান': {
    en: 'Parent Testimonial: Dr. Mahmudul Hasan on 50/50 Curriculum',
    ar: 'انطباع ولي الأمر: الدكتور محمود الحسن حول منهجية التعليم المتكامل',
  },
  'ফারহানা হক': {
    en: 'Farhana Haque',
    ar: 'فرحانة حق',
  },
  'ফারহানা হক (অভিভাবক)': {
    en: 'Farhana Haque (Guardian)',
    ar: 'فرحانة حق (ولية أمر)',
  },
  'অভিভাবক ভিডিও রিভিউ: ফারহানা হক': {
    en: 'Parent Testimonial: Farhana Haque on Safe Campus & Care',
    ar: 'انطباع ولية الأمر: فرحانة حق حول الرعاية التربوية والأمان',
  },
  'আরিফুর রহমান': {
    en: 'Arifur Rahman',
    ar: 'عارف الرحمن',
  },
  'আরিফুর রহমান (অভিভাবক)': {
    en: 'Arifur Rahman (Guardian)',
    ar: 'عارف الرحمن (ولي أمر)',
  },
  'অভিভাবক ভিডিও রিভিউ: আরিফুর রহমান': {
    en: 'Parent Testimonial: Arifur Rahman on Hifz & Spoken Languages',
    ar: 'انطباع ولي الأمر: عارف الرحمن حول تحفيظ القرآن وإتقان اللغات',
  },
  'নাসরিন আক্তার': {
    en: 'Nasrin Akter',
    ar: 'نسرين أختر',
  },
  'নাসরিন আক্তার (অভিভাবক)': {
    en: 'Nasrin Akter (Guardian)',
    ar: 'نسرين أختر (ولية أمر)',
  },
  'অভিভাবক ভিডিও রিভিউ: নাসরিন আক্তার': {
    en: 'Parent Testimonial: Nasrin Akter on In-Class Lesson Completion',
    ar: 'انطباع ولية الأمر: نسرين أختر حول استيعاب الدروس داخل الفصل',
  },

  // Fee Calculator Items (Classes & Descriptions)
  'ইন্টারঅ্যাক্টিভ ফি ও ছাড় ক্যালকুলেটর': {
    en: 'Interactive Admission Fee & Discount Calculator',
    ar: 'حاسبة رسوم القبول والخصومات التفاعلية',
  },
  'বিভাগ, শ্রেণি, ডিসকাউন্ট ও আবাসিক/ডে-কেয়ার সুবিধা নির্বাচন করে ভর্তির পূর্ণাঙ্গ খরচের হিসাব ও A4 সামারি ডাউনলোড করুন': {
    en: 'Select department, grade, discount wave, and accommodation/transport options to calculate net fees and download an official A4 summary.',
    ar: 'اختر القسم والصف والخصم ونظام السكن أو النقل لحساب التكلفة الصافية وتحميل كشف A4 الرسمي.',
  },
  'প্লে শ্রেণি (Play Group)': {
    en: 'Play Group (Pre-Foundation)',
    ar: 'مرحلة اللعب والتمهيدي الأول (Play Group)',
  },
  'আদব-আখলাক, নূরানী কায়দা, ছড়া ও খেলাচ্ছলে শিক্ষা': {
    en: 'Islamic etiquette (Adab), Noorani Qaida, rhymes, and joyful activity-based learning',
    ar: 'الآداب الإسلامية، القاعدة النورانية، الأناشيد، والتعلم التفاعلي الممتع',
  },
  'নার্সারি / প্রি-ওয়ান (Nursery / Pre-One)': {
    en: 'Nursery / Pre-One',
    ar: 'الروضة / التمهيدي (Nursery / Pre-One)',
  },
  'নূরানী কায়দা, প্রমিত বাংলা, ইংলিশ ফনিক্স ও গণিত ফাউন্ডেশন': {
    en: 'Noorani Qaida, Standard Bengali, English Phonics, and Mathematics Foundation',
    ar: 'القاعدة النورانية، مبادئ البنغالية، الصوتيات الإنجليزية، وتأسيس الرياضيات',
  },
  'প্রথম শ্রেণি (Class One)': {
    en: 'Class One (Grade 1)',
    ar: 'الصف الأول الابتدائي (Class One)',
  },
  'জাতীয় শিক্ষাক্রম, তাজবীদসহ কুরআন, ৩ ভাষায় স্পোকেন': {
    en: 'National Curriculum, Quran with Tajweed, and Trilingual Spoken Fluency',
    ar: 'المنهج الوطني، تلاوة القرآن بالتجويد، والمحادثة باللغات الثلاث',
  },
  'দ্বিতীয় শ্রেণি (Class Two)': {
    en: 'Class Two (Grade 2)',
    ar: 'الصف الثاني الابتدائي (Class Two)',
  },
  'কুরআন নাযেরা, ইংরেজি গ্রামার, গণিত ও আর্লি স্কিলস': {
    en: 'Nazera Quran, English Grammar, Mathematics, and Early Creative Skills',
    ar: 'تلاوة القرآن نظراً، قواعد الإنجليزية، الرياضيات، والمهارات الإبداعية المبكرة',
  },
  'তৃতীয় শ্রেণি (Class Three)': {
    en: 'Class Three (Grade 3)',
    ar: 'الصف الثالث الابتدائي (Class Three)',
  },
  'সমন্বিত একাডেমিক + ৩ ভাষায় প্রেজেন্টেশন ও বেসিক কম্পিউটার': {
    en: 'Integrated Academics + Trilingual Presentation Skills & Basic Computing',
    ar: 'التعليم الأكاديمي المتكامل مع مهارات الإلقاء باللغات الثلاث وأساسيات الحاسوب',
  },
  'চতুর্থ শ্রেণি (Class Four)': {
    en: 'Class Four (Grade 4)',
    ar: 'الصف الرابع الابتدائي (Class Four)',
  },
  'মাসিক বেতন ও টিউশন ফি অন্তর্ভুক্ত (ক্লাসের পড়া ক্লাসেই আদায় + আইটি ল্যাব)': {
    en: 'Includes Monthly Tuition & Guided Coaching (In-class lesson mastery + IT Lab)',
    ar: 'شامل الرسوم الدراسية والمتابعة اليومية (إنجاز الدروس داخل الفصل + مختبر التقنية)',
  },
  'পঞ্চম শ্রেণি (Class Five)': {
    en: 'Class Five (Grade 5)',
    ar: 'الصف الخامس الابتدائي (Class Five)',
  },
  'মাসিক বেতন ও টিউশন ফি অন্তর্ভুক্ত + আইটি ও ক্রিয়েটিভ প্রজেক্ট': {
    en: 'Includes Monthly Tuition & Coaching + Practical IT & Creative Projects',
    ar: 'شامل الرسوم الشهرية والإشراف الدراسي + مشاريع التقنية والإبداع',
  },
  'ষষ্ঠ শ্রেণি (Class Six)': {
    en: 'Class Six (Grade 6)',
    ar: 'الصف السادس الإعدادي (Class Six)',
  },
  'বোর্ড কারিকুলাম + ১২টি প্রফেশনাল আইটি স্কিলস ও রোবটিক্স ল্যাব': {
    en: 'Board Curriculum + 12 Professional IT Skills & Robotics Laboratory',
    ar: 'المنهج الرسمي المعتمد + ١٢ مهارة تقنية احترافية ومختبر الروبوتات',
  },
  'সপ্তম শ্রেণি (Class Seven)': {
    en: 'Class Seven (Grade 7)',
    ar: 'الصف السابع الإعدادي (Class Seven)',
  },
  'উচ্চতর গণিত, বিজ্ঞান ল্যাব, ইংলিশ ডিবেট ও ৫০+ সফট স্কিলস': {
    en: 'Advanced Math, Science Lab, English Debate & 50+ Soft Skills',
    ar: 'الرياضيات المتقدمة، مختبر العلوم، المناظرات الإنجليزية، وأكثر من ٥٠ مهارة حياتية',
  },
  'অষ্টম শ্রেণি (Class Eight)': {
    en: 'Class Eight (Grade 8)',
    ar: 'الصف الثامن الإعدادي (Class Eight)',
  },
  'জুনিয়র স্কলারশিপ প্রস্তুতি, ক্যারিয়ার গাইডেন্স ও বিজনেস মাইন্ডসেট': {
    en: 'Junior Scholarship Preparation, Career Guidance & Entrepreneurial Mindset',
    ar: 'الإعداد للمنح الدراسية، التوجيه المهني، وبناء عقلية ريادة الأعمال',
  },
  'নবম শ্রেণি (Class Nine)': {
    en: 'Class Nine (Grade 9 / Dakhil)',
    ar: 'الصف التاسع الثانوي (Class Nine / الداخل)',
  },
  'বিজ্ঞান ও মানবিক বিভাগ, প্রি-এসএসসি প্রস্তুতি ও অ্যাডভান্সড আইটি': {
    en: 'Science & Humanities Tracks, Pre-SSC/Dakhil Preparation & Advanced IT',
    ar: 'القسم العلمي والأدبي، الإعداد للشهادة الثانوية، والتقنية المتقدمة',
  },
  'দশম শ্রেণি (Class Ten)': {
    en: 'Class Ten (Grade 10 / Dakhil)',
    ar: 'الصف العاشر الثانوي (Class Ten / الداخل)',
  },
  'এসএসসি বোর্ড পরীক্ষা ও স্কিলস বেইসড ভবিষ্যৎ ক্যারিয়ার প্রস্তুতি': {
    en: 'SSC / Dakhil Board Exam Mastery & Skills-Based Future Career Readiness',
    ar: 'الاستعداد الكامل لامتحانات الشهادة الرسمية والمهارات المهنية المستقبلية',
  },
  'নূরানী ও মাখরাজ বিভাগ': {
    en: 'Noorani & Makhraj Foundation Track',
    ar: 'قسم القاعدة النورانية وتصحيح المخارج',
  },
  'সিফাত ও মাখরাজ অনুযায়ী বিশুদ্ধ আরবি উচ্চারণ, তাজবীদ ও মাসনুন দোয়া': {
    en: 'Authentic Arabic articulation (Makhraj & Sifat), Tajweed rules, and daily Masnoon Duas',
    ar: 'النطق العربي الفصيح وفق المخارج والصفات، أحكام التجويد، والأدعية المأثورة',
  },
  'নাযেরা কুরআন বিভাগ': {
    en: 'Nazera Quran Recitation Track',
    ar: 'قسم التلاوة النظرية المتقنة (الناظرة)',
  },
  'পূর্ণ কুরআন দেখে তাজবীদ ও তারতীলসহ দ্রুত তিলাওয়াত ও জেনারেল ফাউন্ডেশন': {
    en: 'Fluent recitation of the entire Quran with Tajweed & Tarteel plus core general subjects',
    ar: 'تلاوة المصحف كاملاً بالتجويد والترتيل مع تأسيس المواد الأكاديمية العامة',
  },
  'হিফজুল কুরআন বিভাগ (পূর্ণাঙ্গ হিফজ)': {
    en: 'Complete Tahfizul Quran Department',
    ar: 'قسم تحفيظ القرآن الكريم الكامل',
  },
  'আন্তর্জাতিক মানের হাফেজ ও ক্বারীদের নিবিড় তত্ত্বাবধানে পূর্ণ কুরআন হিফজ ও জেনারেল শিক্ষা': {
    en: 'Complete Quran memorization under internationally certified Huffaz & Qaris alongside general academics',
    ar: 'حفظ القرآن الكريم كاملاً بإشراف نخبة من القراء والحفاظ المجازين مع التعليم العام',
  },
  'শুনানী ও মুসাবাকাহ বিভাগ': {
    en: 'Shunani & International Competition Track',
    ar: 'قسم التسميع والمسابقات القرآنية الدولية',
  },
  'খতম পরবর্তী পূর্ণ কুরআন শুনানী, ইয়াদ মজবুতকরণ ও আন্তর্জাতিক প্রতিযোগিতার প্রস্তুতি': {
    en: 'Post-Khatm full Quran revision (Shunani), retention mastery, and international competition prep',
    ar: 'مراجعة وتثبيت الختمة كاملة وتأهيل الحفاظ للمسابقات القرآنية الوطنية والدولية',
  },

  // Notices (Titles & Descriptions)
  '২০২৭ শিক্ষাবর্ষে ভর্তি বিজ্ঞপ্তি ও অগ্রিম ভর্তি ছাড় সংক্রান্ত নোটিশ': {
    en: 'Admission Circular for Academic Session 2027 & Early-Bird Scholarship Notice',
    ar: 'إعلان القبول للعام الدراسي ٢٠٢٧ وإشعار خصم التسجيل المبكر',
  },
  'ক্রাফট ইন্টারন্যাশনাল ইনস্টিটিউটে ২০২৭ সেশনে প্রি-ওয়ান (নার্সারি) থেকে অষ্টম শ্রেণি এবং হিফজুল কুরআন বিভাগে সীমিত আসনে ভর্তি চলছে। নির্ধারিত সময়ের মধ্যে অগ্রিম ভর্তি সম্পন্ন করলে বিশেষ ছাড় প্রযোজ্য হবে। প্রয়োজনীয় ডকুমেন্টস: শিক্ষার্থীর ৪ কপি পাসপোর্ট সাইজ ছবি, জন্ম নিবন্ধন সনদ এবং পিতা-মাতার এনআইডি কপি।': {
    en: 'Admissions are open for limited seats from Pre-One (Nursery) to Grade 8 and in the Hifzul Quran Department for the 2027 session. Special early-bird discounts apply for timely enrollment. Required documents: 4 passport-size photos of the student, birth registration certificate, and copies of parents’ NID.',
    ar: 'التسجيل مفتوح لمقاعد محدودة من مرحلة الروضة حتى الصف الثامن وفي قسم تحفيظ القرآن للعام الدراسي ٢٠٢٧، مع خصم خاص للتسجيل المبكر. الوثائق المطلوبة: ٤ صور شخصية للطالب، شهادة الميلاد، وصورة الهوية الوطنية للوالدين.',
  },
  'মাহারাত মডেল মাদ্রাসায় (EIIN: 140630) প্রি-প্লে ও প্লে থেকে নবম/দাখিল শ্রেণি (আরবি ও ইংলিশ ভার্সন) এবং তাহফিজুল কুরআন বিভাগে সীমিত আসনে ভর্তি চলছে। প্রত্যেক শ্রেণির প্রথম ৫ জন শিক্ষার্থীর জন্য বিশেষ ছাড় প্রযোজ্য হবে। প্রয়োজনীয় ডকুমেন্টস: শিক্ষার্থীর ৪ কপি পাসপোর্ট সাইজ ছবি, জন্ম নিবন্ধন সনদ এবং পিতা-মাতার এনআইডি কপি।': {
    en: 'Admissions are open at Maharat Model Madrasah (EIIN: 140630) for limited seats from Pre-Play & Play to Grade 9 / Dakhil (Arabic & English Version) and in the Tahfizul Quran Department. Special discount applies for the first 5 students in each class. Required documents: 4 passport-size photos of the student, birth registration certificate, and copies of parents’ NID.',
    ar: 'التسجيل مفتوح في مدرسة المهارات النموذجية (EIIN: 140630) لمقاعد محدودة من مرحلة التمهيدي حتى الصف التاسع/الداخل (النسخة العربية والإنجليزية) وفي قسم تحفيظ القرآن، مع خصم خاص لأول ٥ طلاب في كل صف. الوثائق المطلوبة: ٤ صور شخصية للطالب، شهادة الميلاد، وصورة الهوية الوطنية للوالدين.',
  },
  'হিফজ ও একাডেমিক বিভাগের মাসিক মূল্যায়ন ও তারবিয়াহ পরীক্ষার সময়সূচি': {
    en: 'Monthly Academic Assessment & Moral Tarbiyah Evaluation Schedule',
    ar: 'جدول التقييم الشهري والاختبارات التربوية لقسمي التحفيظ والأكاديمي',
  },
  'সকল বিভাগের শিক্ষার্থীদের অবগতির জন্য জানানো যাচ্ছে যে, আগামী মাসের ৫ তারিখ থেকে মাসিক একাডেমিক ও আমলি তারবিয়াহ মূল্যায়ন পরীক্ষা অনুষ্ঠিত হবে। ক্লাসের পড়া ক্লাসেই আদায় করার পাশাপাশি দৈনিক সুন্নাহ ও আদব অনুশীলনের ডায়েরি সঙ্গে আনতে হবে।': {
    en: 'All students are hereby informed that the monthly academic and practical Tarbiyah evaluation will commence on the 5th of next month. Students must bring their daily Sunnah and etiquette practice diary.',
    ar: 'يُعلن لجميع الطلاب أن الاختبارات الشهرية والتقييم التربوي العملي ستبدأ في الخامس من الشهر القادم، مع ضرورة إحضار سجل المتابعة اليومية للآداب والسنن.',
  },
  'আইটি স্কিলস ল্যাব ও রোবটিক্স প্র্যাকটিক্যাল প্রজেক্ট প্রদর্শনী সপ্তাহ': {
    en: 'IT Skills Lab & Robotics Practical Project Exhibition Week',
    ar: 'أسبوع معرض مشاريع مختبر التقنية والروبوتات التطبيقية',
  },
  'চতুর্থ থেকে অষ্টম শ্রেণির শিক্ষার্থীদের অংশগ্রহণে গ্রাফিক ডিজাইন, ভিডিও এডিটিং, কন্টেন্ট ক্রিয়েশন এবং রোবটিক্স ল্যাবের প্র্যাকটিক্যাল প্রজেক্ট মূল্যায়ন আগামী সপ্তাহে অনুষ্ঠিত হবে।': {
    en: 'Students from Grade 4 to Grade 8 will showcase their practical projects in Graphic Design, Video Editing, Content Creation, and Robotics Lab next week.',
    ar: 'سيقدم طلاب الصفوف من الرابع إلى الثامن مشاريعهم العملية في التصميم الجرافيكي، المونتاج، صناعة المحتوى، والروبوتات خلال الأسبوع القادم.',
  },
  'শুক্রবার সাপ্তাহিক ছুটি ও আবাসিক শিক্ষার্থীদের অভিভাবক সাক্ষাতের সময়সূচি': {
    en: 'Friday Weekly Holiday & Residential Parent Visiting Hours',
    ar: 'العطلة الأسبوعية يوم الجمعة ومواعيد زيارة أولياء أمور طلاب السكن الداخلي',
  },
  'আবাসিক বিভাগের অভিভাবকবৃন্দ প্রতি শুক্রবার জুমার নামাজের পর দুপুর ২:৩০ থেকে আসর পর্যন্ত শিক্ষার্থীদের সাথে সাক্ষাৎ করতে পারবেন। ক্যাম্পাসে সিসিটিভি ও সিকিউরিটি গার্ডের নির্দেশনা মেনে চলার অনুরোধ করা হলো।': {
    en: 'Guardians of residential students may visit their children every Friday after Jummah prayer from 2:30 PM until Asr. Please follow campus security and CCTV protocols.',
    ar: 'يمكن لأولياء أمور طلاب القسم الداخلي زيارة أبنائهم كل يوم جمعة بعد صلاة الجمعة من الساعة ٢:٣٠ ظهراً حتى العصر، مع الالتزام بتعليمات الأمن والسلامة.',
  },

  // Courses & Syllabus Modules
  'প্রেপ (নার্সারি) - দ্বিতীয় শ্রেণি (একাডেমিক বিভাগ)': {
    en: 'Prep (Nursery) – Grade 2 (Foundation Academic)',
    ar: 'الروضة والتمهيدي – الصف الثاني (التأسيس الأكاديمي)',
  },
  '৳ ৫,০০০ / মাসিক বেতন': {
    en: 'BDT 5,000 / Monthly Tuition',
    ar: '٥,٠٠٠ تاكا / الرسوم الشهرية',
  },
  '৳ ২১,০০০ (ভর্তি ফি)': {
    en: 'BDT 21,000 (Admission Fee)',
    ar: '٢١,٠٠٠ تاكا (رسوم القبول)',
  },
  'শিশুদের প্রারম্ভিক শিক্ষাজীবনে নূরানী পদ্ধতিতে বিশুদ্ধ কুরআন তিলাওয়াত, বাংলা, ইংরেজি ও গণিতের মজবুত ভিত্তি এবং দৈনন্দিন মাসনুন দোয়া ও আদব-আখলাক অভ্যস্তকরণের সমন্বিত প্রোগ্রাম। ক্লাসের পড়া ক্লাসেই আদায় করা হয়।': {
    en: 'An integrated early-childhood program combining authentic Quran recitation (Noorani method), strong foundations in Bengali, English & Mathematics, and daily Masnoon Duas & Islamic etiquette. All daily lessons are completed in class.',
    ar: 'برنامج تأسيسي متكامل للأطفال يجمع بين تلاوة القرآن بالطريقة النورانية، وإتقان أساسيات البنغالية والإنجليزية والرياضيات، والآداب والأدعية اليومية مع إنجاز كافة الدروس داخل الفصل.',
  },
  'নূরানী কায়দা, মাখরাজ ও মাসনুন দোয়া': {
    en: 'Noorani Qaida, Makhraj & Daily Masnoon Duas',
    ar: 'القاعدة النورانية، مخارج الحروف، والأدعية المأثورة',
  },
  'আরবি ২৯টি হরফের সঠিক মাখরাজ ও উচ্চারণ অনুশীলন': {
    en: 'Correct articulation and Makhraj practice of all 29 Arabic letters',
    ar: 'التدريب العملي على مخارج الحروف العربية التسعة والعشرين ونطقها الفصيح',
  },
  'দৈনন্দিন জীবনের ৩০টি প্রয়োজনীয় মাসনুন দোয়া ও সুন্নাহ আমল': {
    en: '30 essential daily Masnoon supplications and practical Sunnah habits',
    ar: 'حفظ وتطبيق ٣٠ دعاءً من الأدعية اليومية المأثورة والسنن العملية',
  },
  'ওযু, নামাজ ও পাক-পবিত্রতার প্র্যাকটিক্যাল প্রশিক্ষণ': {
    en: 'Practical hands-on training in Wudu, Salah, and personal cleanliness',
    ar: 'التدريب العملي على الطهارة والوضوء وأداء الصلاة الصحيحة',
  },
  'ব্রিটিশ ও আমেরিকান একসেন্টে ইংরেজিতে ছোট ছোট বাক্য বলা': {
    en: 'Speaking everyday English sentences with authentic British & American pronunciation',
    ar: 'التحدث بجمل إنجليزية يومية بنطق سليم وواضح',
  },
  'সুন্দর ও দ্রুত হাতের লেখা (Cursive & Print Handwriting)': {
    en: 'Neat and fluent handwriting mastery (Cursive & Print)',
    ar: 'إتقان الخط الجميل والكتابة السريعة المنظمة',
  },
  'প্রমিত বাংলা, গণিত ও আর্লি ক্রিয়েটিভ স্কিলস': {
    en: 'Standard Bengali, Mental Math & Early Creative Skills',
    ar: 'اللغة البنغالية المعيارية، الحساب الذهني، والمهارات الإبداعية',
  },
  'বিরামহীনভাবে প্রমিত বাংলায় কথা বলার দক্ষতা অর্জন': {
    en: 'Articulate and confident speaking in standard Bengali',
    ar: 'اكتساب طلاقة التحدث والإلقاء باللغة البنغالية المعيارية',
  },
  'Mental Math, সংখ্যার ধারণা ও আনন্দের সাথে গণিত অনুশীলন': {
    en: 'Mental Math, number sense, and joyful problem solving',
    ar: 'الحساب الذهني وفهم الأعداد والتدريب الممتع على الرياضيات',
  },
  'ড্রয়িং, ক্যালিগ্রাফি ও মৌলিক জীবনঘনিষ্ঠ অভ্যাস গঠন': {
    en: 'Drawing, calligraphy, and essential life-habit formation',
    ar: 'الرسم الهادف، الخط الفني، وبناء العادات اليومية الإيجابية',
  },
  'শ্রেণি: তৃতীয় (সমন্বিত একাডেমিক ও ভাষা শিক্ষা)': {
    en: 'Grade 3 (Integrated Academic & Trilingual Track)',
    ar: 'الصف الثالث الابتدائي (المنهج الأكاديمي واللغات)',
  },
  '৳ ৫,৫০০ / মাসিক বেতন': {
    en: 'BDT 5,500 / Monthly Tuition',
    ar: '٥,٥٠٠ تاكا / الرسوم الشهرية',
  },
  '৳ ২৪,০০০ (ভর্তি ফি)': {
    en: 'BDT 24,000 (Admission Fee)',
    ar: '٢٤,٠٠٠ تاكا (رسوم القبول)',
  },
  'জাতীয় শিক্ষাক্রমের সকল বিষয়ের পাশাপাশি কুরআন নাযেরা, তিন ভাষায় (বাংলা, ইংরেজি ও আরবি) প্রেজেন্টেশন স্কিল এবং কম্পিউটার ফান্ডামেন্টালস শেখার বিশেষায়িত কোর্স।': {
    en: 'Specialized program covering all National Curriculum subjects alongside Nazera Quran, trilingual presentation skills (Bengali, English & Arabic), and computer fundamentals.',
    ar: 'برنامج متخصص يشمل كافة مواد المنهج الوطني إلى جانب تلاوة القرآن نظراً، ومهارات العرض باللغات الثلاث، وأساسيات الحاسوب.',
  },
  'তাজবীদসহ নাযেরা কুরআন ও ইসলামীয়াৎ': {
    en: 'Nazera Quran with Tajweed & Islamic Studies',
    ar: 'تلاوة القرآن بالتجويد والتربية الإسلامية',
  },
  'তাজবীদসহ নাযেরা কুরআন ও ইসলামিয়াত': {
    en: 'Nazera Quran with Tajweed & Islamic Studies',
    ar: 'تلاوة القرآن بالتجويد والتربية الإسلامية',
  },
  'তাজবীদের নিয়মাবলি ও আমপারা অর্থসহ তিলাওয়াত': {
    en: 'Tajweed rules and recitation of Juz Amma with meaning',
    ar: 'أحكام التجويد وتلاوة جزء عمّ مع فهم المعاني',
  },
  'আকীদা, ফিকহ, সিরাতুন্নবী (সা.) ও ইসলামের ইতিহাস': {
    en: 'Aqeedah, Fiqh, Prophetic Seerah (PBUH), and Islamic History',
    ar: 'العقيدة، الفقه، السيرة النبوية الشريفة، والتاريخ الإسلامي',
  },
  'সাপ্তাহিক তারবিয়াহ ও আমল মূল্যায়ন': {
    en: 'Weekly moral Tarbiyah and practical Sunnah evaluation',
    ar: 'التقييم التربوي الأسبوعي ومتابعة الأعمال الصالحة',
  },
  'NCTB ও আন্তর্জাতিক মানের গণিত ও বিজ্ঞান অনুশীলন': {
    en: 'NCTB and international-standard Mathematics & Science practice',
    ar: 'تطبيقات الرياضيات والعلوم وفق المعايير الوطنية والدولية',
  },
  'ক্লাসের পড়া ক্লাসেই সম্পন্ন করার গাইডেড স্টাডি সেশন': {
    en: 'Guided study sessions ensuring all lessons are completed inside the classroom',
    ar: 'جلسات دراسية موجهة لإتمام كافة الواجبات والدروس داخل الفصل',
  },
  'কম্পিউটার পরিচিতি, টাইপিং ও Microsoft Office বেসিক': {
    en: 'Computer fundamentals, touch typing, and Microsoft Office basics',
    ar: 'مبادئ الحاسوب، الطباعة السريعة، وأساسيات برامج مايكروسوفت أوفيس',
  },
  'Time Management, ডায়েরি মেইনটেইন ও ক্রিটিক্যাল থিংকিং': {
    en: 'Time Management, academic diary maintenance, and critical thinking',
    ar: 'إدارة الوقت، تنظيم السجل الدراسي، والتفكير النقدي',
  },
  'চতুর্থ - অষ্টম শ্রেণি (একাডেমিক ও প্রফেশনাল স্কিলস)': {
    en: 'Grade 4 to Grade 8 (Academic & Professional Skills Mastery)',
    ar: 'من الصف الرابع إلى الثامن (التميز الأكاديمي والمهارات المهنية)',
  },
  '৳ ৮,০০০ – ৯,০০০ / মাসিক (টিউশনসহ)': {
    en: 'BDT 8,000 – 9,000 / Month (With Coaching)',
    ar: '٨,٠٠٠ – ٩,٠٠٠ تاكا / شهرياً (شامل المتابعة)',
  },
  '৳ ২৬,০০০ – ২৮,০০০ (ভর্তি ফি)': {
    en: 'BDT 26,000 – 28,000 (Admission Fee)',
    ar: '٢٦,٠٠٠ – ٢٨,٠٠٠ تاكا (رسوم القبول)',
  },
  'চতুর্থ-পঞ্চম শ্রেণি (ভর্তি ২৬,০০০/-, মাসিক ৮,০০০/-) এবং ষষ্ঠ-অষ্টম শ্রেণি (ভর্তি ২৮,০০০/-, মাসিক ৯,০০০/-)। বোর্ড কারিকুলামের পাশাপাশি আইটি স্কিলস, বিজনেস মাইন্ডসেট ও ৫০+ সফট ও হার্ড স্কিলসের পূর্ণাঙ্গ প্রস্তুতি।': {
    en: 'Grades 4–5 (Admission 26,000/-, Monthly 8,000/-) and Grades 6–8 (Admission 28,000/-, Monthly 9,000/-). Complete board curriculum paired with IT lab skills, entrepreneurial mindset, and 50+ soft & hard skills.',
    ar: 'الصفوف ٤–٥ (القبول ٢٦,٠٠٠، الشهري ٨,٠٠٠ تاكا) والصفوف ٦–٨ (القبول ٢٨,٠٠٠، الشهري ٩,٠٠٠ تاكا). يشمل المنهج الرسمي مع مختبر التقنية وريادة الأعمال وأكثر من ٥٠ مهارة حياتية.',
  },
  'পদার্থ, রসায়ন, জীববিজ্ঞান ও উচ্চতর গণিতের কনসেপ্ট ক্লিয়ারিং': {
    en: 'Concept mastery in Physics, Chemistry, Biology, and Higher Mathematics',
    ar: 'إتقان المفاهيم العلمية في الفيزياء والكيمياء والأحياء والرياضيات المتقدمة',
  },
  'প্রজেক্ট বেইসড লার্নিং ও সায়েন্স অলিম্পিয়াড প্রস্তুতি': {
    en: 'Project-based learning and Science Olympiad preparation',
    ar: 'التعلم القائم على المشاريع والاستعداد لأولمبياد العلوم',
  },
  'সৃজনশীল প্রশ্নোত্তর ও প্রেজেন্টেশন প্র্যাকটিস': {
    en: 'Creative question solving and presentation practice',
    ar: 'حل الأسئلة الإبداعية والتدريب على العروض التقديمية',
  },
  'আরবি ভাষা শিক্ষা (কথোপকথন ও কুরআনিক গ্রামার)': {
    en: 'Arabic language mastery (Spoken conversation & Quranic grammar)',
    ar: 'إتقان اللغة العربية (المحادثة وقواعد النحو القرآني)',
  },
  'বই, প্রবন্ধ, গল্প ও স্ক্রিপ্ট রাইটিং কর্মশালা': {
    en: 'Book, essay, story, and scriptwriting workshops',
    ar: 'ورش تدريبية في تأليف المقالات والقصص وكتابة السيناريو',
  },
  'Graphic Design, Video Editing & Web Development প্র্যাকটিক্যাল': {
    en: 'Hands-on Graphic Design, Video Editing & Web Development',
    ar: 'تطبيقات عملية في التصميم الجرافيكي والمونتاج وتطوير الويب',
  },
  'Artificial Intelligence (AI) প্রম্পট ইঞ্জিনিয়ারিং ও রোবটিক্স': {
    en: 'Artificial Intelligence (AI) prompt engineering & Robotics Lab',
    ar: 'الذكاء الاصطناعي وهندسة الأوامر ومختبر الروبوتات',
  },
  'হিফজুল কুরআন বিভাগ (নূরানী, নাযেরা, হিফয ও শুনানী)': {
    en: 'Hifzul Quran Department (Noorani, Nazera, Hifz & Shunani)',
    ar: 'قسم تحفيظ القرآن الكريم (النورانية، الناظرة، الحفظ، والتسميع)',
  },
  '৳ ২০,০০০ (ভর্তি ফি)': {
    en: 'BDT 20,000 (Admission Fee)',
    ar: '٢٠,٠٠٠ تاكا (رسوم القبول)',
  },
  'আন্তর্জাতিক মানের হাফেজ ও ক্বারীদের তত্ত্বাবধানে তাজবীদ ও তারতীলসহ পবিত্র কুরআন হিফজ সম্পন্ন করার পাশাপাশি বাংলা, ইংরেজি ও গণিতে সমমানের একাডেমিক দক্ষতা অর্জন। আবাসিক, অনাবাসিক ও ডে-কেয়ার সুবিধা।': {
    en: 'Complete memorization of the Holy Quran with Tajweed and Tarteel under internationally certified Huffaz and Qaris, alongside grade-level proficiency in Bengali, English, and Mathematics. Residential, Non-Residential, and Day-Care options available.',
    ar: 'حفظ القرآن الكريم كاملاً بالتجويد والترتيل بإشراف حفاظ وقراء مجازين، مع اكتساب الكفاءة الأكاديمية في البنغالية والإنجليزية والرياضيات (داخلي، نهاري، ورعاية نهارية).',
  },
  'নূরানী ও মাখরাজ শুদ্ধিকরণ পর্ব': {
    en: 'Phase 1: Noorani & Makhraj Perfection',
    ar: 'المرحلة الأولى: القاعدة النورانية وتصحيح المخارج',
  },
  'সিফাত ও মাখরাজ অনুযায়ী আরবি বর্ণমালা উচ্চারণ': {
    en: 'Articulation of Arabic letters according to Makhraj and Sifat',
    ar: 'نطق الحروف العربية وفق مخارجها وصفاتها الصحيحة',
  },
  'তাজবীদের সকল নিয়ম ও মশক অনুশীলন': {
    en: 'Complete Tajweed rules and vocal Mashq drills',
    ar: 'أحكام التجويد الكاملة وتدريبات المشق الصوتي',
  },
  'নামাজের প্রয়োজনীয় সূরা ও দোয়া হিফজ': {
    en: 'Memorization of essential Surahs and supplications for Salah',
    ar: 'حفظ السور القصيرة والأدعية الأساسية للصلاة',
  },
  'নাযেরা ও পূর্ণাঙ্গ হিফজুল কুরআন পর্ব': {
    en: 'Phase 2: Nazera & Complete Hifzul Quran',
    ar: 'المرحلة الثانية: التلاوة النظرية والحفظ الكامل للقرآن',
  },
  'দৈনিক সবক, সাত সবক ও আমুখতা নিয়মিত আদায়': {
    en: 'Daily Sabaq, Seven-Sabaq, and systematic Amukhta revision',
    ar: 'الالتزام اليومي بالدرس الجديد والسبع والمراجعة الكبرى',
  },
  'আন্তর্জাতিক ক্বারীদের লাহানে তিলাওয়াত ও ক্বিরাত প্রশিক্ষণ': {
    en: 'Recitation and Qira’at training in renowned international styles',
    ar: 'التدريب على التلاوة والأداء القرآني المتقن',
  },
  'জাতীয় ও আন্তর্জাতিক হিফজ প্রতিযোগিতার প্রস্তুতি': {
    en: 'Preparation for national and international Hifz competitions',
    ar: 'تأهيل الطلاب للمسابقات القرآنية الوطنية والدولية',
  },
  'শুনানী ও সমন্বিত জেনারেল শিক্ষা (বাংলা, ইংরেজি, গণিত)': {
    en: 'Phase 3: Shunani Retention & Integrated General Academics',
    ar: 'المرحلة الثالثة: التسميع الكامل والتعليم الأكاديمي المدمج',
  },
  'খতম পরবর্তী পূর্ণ কুরআন শুনানী ও ইয়াদ মজবুতকরণ': {
    en: 'Post-Khatm full Quran recitation (Shunani) and retention mastery',
    ar: 'تسميع المصحف كاملاً بعد الختم وتثبيت الحفظ',
  },
  'হাফেজ শিক্ষার্থীদের জন্য বিশেষ জেনারেল শিক্ষা মডিউল': {
    en: 'Accelerated General Education module tailored for Huffaz',
    ar: 'وحدة تعليمية أكاديمية خاصة لطلاب التحفيظ',
  },
  'কম্পিউটার বেসিক ও ইংরেজি স্পোকেন সেশন': {
    en: 'Computer fundamentals and Spoken English sessions',
    ar: 'أساسيات الحاسوب وجلسات المحادثة باللغة الإنجليزية',
  },
  'আইটি স্কিলস ও প্রযুক্তি ল্যাব (গ্রাফিক, ভিডিও, ওয়েব ও AI)': {
    en: 'IT Skills & Creative Technology Bootcamp (12 Modules)',
    ar: 'مختبر مهارات التقنية والذكاء الاصطناعي (١٢ وحدة)',
  },
  '৳ ৩,০০০ / বাৎসরিক সার্ভিস চার্জ': {
    en: 'BDT 3,000 / Annual Lab Charge',
    ar: '٣,٠٠٠ تاكا / رسوم المختبر السنوية',
  },
  'একাডেমিক কোর্সের অন্তর্ভুক্ত': {
    en: 'Included in Academic Program',
    ar: 'مشمول ضمن البرنامج الأكاديمي',
  },
  'আধুনিক প্রযুক্তির সাথে তাল মিলিয়ে শিক্ষার্থীদের দক্ষ করে তুলতে প্রজেক্টভিত্তিক ১২টি অত্যাধুনিক আইটি স্কিলস প্রোগ্রাম। আধুনিক কম্পিউটার ল্যাবে সরাসরি হাতে-কলমে প্রশিক্ষণ।': {
    en: 'Project-based training across 12 cutting-edge IT skills in our modern computer lab to prepare students for the future digital economy.',
    ar: 'برنامج تطبيقي يشمل ١٢ مهارة تقنية حديثة داخل مختبر الحاسوب لإعداد الطلاب لمستقبل الاقتصاد الرقمي.',
  },
  '৫০+ সফট, হার্ড ও বিজনেস স্কিলস ডেভেলপমেন্ট প্রোগ্রাম': {
    en: '50+ Soft, Hard & Business Skills Development Program',
    ar: 'برنامج تنمية ٥٠+ مهارة حياتية وقيادية وريادة أعمال',
  },
  '৳ ২,৫০০ / বাৎসরিক সার্ভিস চার্জ': {
    en: 'BDT 2,500 / Annual Co-Curricular Fee',
    ar: '٢,٥٠٠ تاكا / الرسوم السنوية للأنشطة',
  },
  'একজন পরিপূর্ণ ও সফল মানুষ হিসেবে গড়ে তুলতে পার্সোনাল ডেভেলপমেন্ট, কমিউনিকেশন, লিডারশিপ, ফ্যামিলি স্কিলস, সেফটি ও বিজনেস স্কিলসের সমন্বিত জীবনমুখী কারিকুলাম।': {
    en: 'A holistic life-skills curriculum covering personal development, trilingual communication, leadership, family etiquette, safety, and Islamic business ethics.',
    ar: 'منهج حياتي متكامل يشمل تطوير الذات، مهارات التواصل، القيادة، الآداب الأسرية، السلامة، وأخلاقيات التجارة الإسلامية.',
  },

  // WhatsApp Quick Topics
  'হোয়াটসঅ্যাপে সরাসরি কথা বলুন': {
    en: 'Chat Directly on WhatsApp',
    ar: 'تحدث معنا مباشرة عبر واتساب',
  },
  'হোয়াটসঅ্যাপ হেল্পডেস্ক ও কুইক ইনকোয়ারি': {
    en: 'WhatsApp Admission Helpdesk',
    ar: 'مكتب المساعدة والاستفسار عبر واتساب',
  },
  '২০২৭ সেশনে ভর্তি ও ছাড়ের তথ্য': {
    en: '2027 Admission & Discount Info',
    ar: 'معلومات القبول والخصومات لعام ٢٠٢٧',
  },
  'একাডেমিক ও হিফজ ফি তালিকা': {
    en: 'Academic & Hifz Fee Structure',
    ar: 'جدول رسوم القسم الأكاديمي والتحفيظ',
  },
  'আবাসিক ও ডে-কেয়ার সুবিধা': {
    en: 'Residential & Day-Care Facilities',
    ar: 'خدمات السكن الداخلي والرعاية النهارية',
  },
  'ক্যাম্পাস ভিজিট অ্যাপয়েন্টমেন্ট': {
    en: 'Book a Campus Visit Appointment',
    ar: 'حجز موعد لزيارة الحرم التعليمي',
  },
  // Seed News Ticker Items
  'ভর্তি চলছে ২০২৭! প্রথম ১০০ জনের জন্য বিশেষ ১০% ডিসকাউন্ট এবং অগ্রিম ভর্তিতে ২৫% বিশেষ ছাড়!': {
    en: 'Admissions Open for 2027! Special 10% discount for the first 100 students and 25% Early-Bird discount!',
    ar: 'التسجيل مفتوح لعام ٢٠٢٧! خصم خاص ١٠٪ لأول ١٠٠ طالب وخصم ٢٥٪ للتسجيل المبكر!',
  },
  'নার্সারি (প্রি-ওয়ান) থেকে ক্লাস এইট পর্যন্ত এবং হিফজুল কুরআন বিভাগে (নূরানী, নাযেরা, হিফয ও শুনানী) আবাসিক, অনাবাসিক ও ডে-কেয়ারে ভর্তি চলছে।': {
    en: 'Admissions open from Nursery (Pre-One) to Grade 8 and Hifzul Quran Department (Noorani, Nazera, Hifz & Shunani) in Residential, Non-Residential & Day-Care tracks.',
    ar: 'التسجيل مفتوح من مرحلة الروضة حتى الصف الثامن وفي قسم تحفيظ القرآن (النورانية، الناظرة، الحفظ والتسميع) بنظام السكن الداخلي والخارجي والرعاية النهارية.',
  },
  'পড়াশোনার পাশাপাশি গ্রাফিক ডিজাইন, ভিডিও এডিটিং, ওয়েব ডেভেলপমেন্ট, এআই (AI), রোবটিক্স এবং ৫০+ সফট ও হার্ড স্কিলস শেখার সুবর্ণ সুযোগ।': {
    en: 'Golden opportunity to learn Graphic Design, Video Editing, Web Development, AI, Robotics & 50+ Soft and Hard Skills alongside regular studies.',
    ar: 'فرصة ذهبية لتعلم التصميم الجرافيكي، المونتاج، تطوير الويب، الذكاء الاصطناعي، الروبوتات وأكثر من ٥٠ مهارة حياتية إلى جانب الدراسة الأكاديمية.',
  },
  'আগামী শুক্রবার সকাল ১০:০০ ঘটিকায় অভিভাবক সমাবেশ ও ফ্রি ডেমো ক্লাস মূল ক্যাম্পাসে অনুষ্ঠিত হবে।': {
    en: 'Guardian Assembly & Free Demo Class will be held at the Main Campus this Friday at 10:00 AM.',
    ar: 'سيُعقد لقاء أولياء الأمور والحصة التجريبية المجانية في الحرم الرئيسي يوم الجمعة القادم الساعة ١٠:٠٠ صباحاً.',
  },
  // Seed Admission Leads
  'মোহাম্মদ আবদুল্লাহ আল মামুন (Abdullah Al Mamun)': {
    en: 'Mohammad Abdullah Al Mamun',
    ar: 'محمد عبد الله المأمون (Abdullah Al Mamun)',
  },
  'আবাসিক হিফজ বিভাগে ভর্তি হতে আগ্রহী। হোস্টেল সিট খালি আছে কি?': {
    en: 'Interested in enrolling in the Residential Hifz department. Are hostel seats available?',
    ar: 'أرغب في التسجيل بقسم التحفيظ الداخلي، هل تتوفر مقاعد في السكن؟',
  },
  'তাসনুভা ইসলাম সারা (Tasnuva Islam Sara)': {
    en: 'Tasnuva Islam Sara',
    ar: 'تسنوفا إسلام سارة (Tasnuva Islam Sara)',
  },
  'Class Five এ অনাবাসিক বিভাগে ভর্তি করাতে চাই। ২৫% ছাড় কি এখনো চলছে?': {
    en: 'Would like to enroll in Grade 5 Non-Residential track. Is the 25% discount still active?',
    ar: 'أود التسجيل في الصف الخامس (غير داخلي)، هل خصم ٢٥٪ لا يزال متاحاً؟',
  },
  'রায়হান কবির (Rayhan Kabir)': {
    en: 'Rayhan Kabir',
    ar: 'ريحان كبير (Rayhan Kabir)',
  },
  'Pre-One (Nursery) ডে-কেয়ার সুবিধার ফি সম্পর্কে জানতে চাই।': {
    en: 'Would like to know the fee structure for Pre-One (Nursery) Day-Care program.',
    ar: 'أود الاستفسار عن رسوم برنامج الرعاية النهارية لمرحلة الروضة (Pre-One).',
  },
  'জুবায়ের আহমেদ (Zubayer Ahmed)': {
    en: 'Zubayer Ahmed',
    ar: 'زبير أحمد (Zubayer Ahmed)',
  },
  'সপ্তম শ্রেণির পাশাপাশি গ্রাফিক ডিজাইন ও রোবটিক্স ল্যাব করতে আগ্রহী।': {
    en: 'Interested in joining Grade 7 along with the Graphic Design & Robotics Lab.',
    ar: 'مهتم بالالتحاق بالصف السابع مع مختبر التصميم الجرافيكي والروبوتات.',
  },
  'সাদিয়া আফরিন (Sadia Afrin)': {
    en: 'Sadia Afrin',
    ar: 'سعدية آفرين (Sadia Afrin)',
  },
  'ক্লাস ৩ তে ভর্তি পরীক্ষার তারিখ কবে?': {
    en: 'When is the admission assessment date for Grade 3?',
    ar: 'متى موعد اختبار القبول للصف الثالث الابتدائي؟',
  },
  'মোঃ আবদুর রহমান': {
    en: 'Md. Abdur Rahman',
    ar: 'محمد عبد الرحمن',
  },
  'পিতা': {
    en: 'Father',
    ar: 'الأب',
  },
  // Chairman & Acting Principal Speeches + Maharat Context
  'ড. মো. নূরুল্লাহ': {
    en: 'Dr. Md. Nurullah',
    ar: 'الدكتور محمد نور الله',
  },
  'চেয়ারম্যান, মাহারাত ফাউন্ডেশন ও মাহারাত মডেল মাদ্রাসা': {
    en: 'Chairman, Maharat Foundation & Maharat Model Madrasah',
    ar: 'رئيس مؤسسة المهارات ومدرسة المهارات النموذجية',
  },
  'মুনকাদির সাদী আল-মাদানী': {
    en: 'Munkadir Sadi Al-Madani',
    ar: 'منكدر سادي المدني',
  },
  'ভারপ্রাপ্ত প্রিন্সিপাল, মাহারাত মডেল মাদ্রাসা': {
    en: 'Acting Principal, Maharat Model Madrasah',
    ar: 'المدير بالإنابة لمدرسة المهارات النموذجية',
  },
  'বাড়ি # ৬২/এ, রোড # ১৪, সেক্টর # ১৩, উত্তরা, ঢাকা-১২৩০': {
    en: 'House # 62/A, Road # 14, Sector # 13, Uttara, Dhaka-1230',
    ar: 'منزل ٦٢/أ، طريق ١٤، قطاع ١٣، أوتارا، دكا-١٢٣٠',
  },
  'সকাল ৮:০০ – রাত ৮:০০ (শুক্রবার জুমার পর অভিভাবক সাক্ষাৎ)': {
    en: '8:00 AM – 8:00 PM (Friday Guardian Visiting After Jummah)',
    ar: '٨:٠٠ صباحاً – ٨:٠٠ مساءً (زيارة أولياء الأمور يوم الجمعة بعد الصلاة)',
  },
  // AI Bot & Settings
  'আমি এই প্রতিষ্ঠানের সহকারী; প্রতিষ্ঠান সম্পর্কিত প্রশ্নে সাহায্য করতে পারি।': {
    en: 'I am the official assistant of Maharat Model Madrasah; I can help with questions regarding our programs, fees, and admissions.',
    ar: 'أنا المساعد الرسمي لمدرسة المهارات النموذجية؛ يمكنني المساعدة في الأسئلة المتعلقة بالبرامج والرسوم والقبول.',
  },
  'এটা প্রতিষ্ঠানের বিষয়ের বাইরের প্রশ্ন। আর {remaining} বার এমন করলে কিছুক্ষণের জন্য বার্তা পাঠানো বন্ধ হবে।': {
    en: 'This question is outside the scope of the institution. {remaining} more out-of-scope queries will temporarily lock chat.',
    ar: 'هذا السؤال خارج نطاق المعهد. متبقي {remaining} محاولات قبل الإغلاق المؤقت للمحادثة.',
  },
  'মাহারাত মডেল মাদ্রাসা (Maharat Model Madrasah | مدرسة المهارات النموذجية) — EIIN: 140630, Madrasah Code: 21023। স্লোগান: A Madrasah with Excellence (মাহারাত ফাউন্ডেশনের একটি প্রকল্প)। ঠিকানা: বাড়ি-৭, রোড-১৭/এ ও বাড়ি-১১, রোড-১৯, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০। ফোন: 01886-340308, 01901-631641।': {
    en: 'Maharat Model Madrasah (EIIN: 140630 | Madrasah Code: 21023) — Motto: A Madrasah with Excellence. Main Office & Girls Campus: House-7, Road-17/A, Sector-12; Boys Campus: House-11, Road-19, Sector-12, Uttara, Dhaka-1230. Phone: 01886-340308, 01901-631641.',
    ar: 'مدرسة المهارات النموذجية (EIIN: 140630 | Code: 21023) — المكتب الرئيسي وحرم البنات: منزل ٧، طريق ١٧/أ، قطاع ١٢؛ حرم البنين: منزل ١١، طريق ١٩، قطاع ١٢، أوتارا، دكا-١٢٣٠. هاتف: 01886-340308.',
  },
  'ভর্তি চলছে! মাহারাত মডেল মাদ্রাসায় (EIIN: 140630) প্রত্যেক শ্রেণির প্রথম ৫ জন শিক্ষার্থীর জন্য বিশেষ ছাড়!': {
    en: 'Admissions Open! Special discount for the first 5 students in every class at Maharat Model Madrasah (EIIN: 140630)!',
    ar: 'باب القبول مفتوح! خصم خاص لأول ٥ طلاب في كل صف في مدرسة المهارات النموذجية (EIIN: 140630)!',
  },
  'প্রি-প্লে ও প্লে থেকে ৯ম শ্রেণি/দাখিল (আরবি ও ইংলিশ ভার্সন) এবং তাহফিজুল কুরআন বিভাগে (+৪টি মৌলিক বিষয়) আবাসিক, অনাবাসিক ও ডে-কেয়ারে ভর্তি চলছে।': {
    en: 'Admissions open for Pre-Play & Play to Class 9/Dakhil (Arabic & English Version) and Tahfizul Quran (+4 core subjects) across Residential, Non-Residential, and Day-Care tracks.',
    ar: 'القبول مفتوح من التمهيدي حتى الصف التاسع/الداخل (بالنسختين العربية والإنجليزية) وقسم تحفيظ القرآن (+٤ مواد أساسية).',
  },
  'উত্তরা সেক্টর-১২ তে বালক ও বালিকাদের সম্পূর্ণ পৃথক ক্যাম্পাস, আইসিটি স্মার্ট ক্লাসরুম, ১০০% দাখিল পাস সাফল্য ও নিজস্ব পরিবহন সুবিধা।': {
    en: 'Separate Boys & Girls Campuses in Uttara Sector-12, ICT Smart Classrooms, 100% Dakhil Pass Result, and Own School Transport.',
    ar: 'حرم منفصل للبنين والبنات في أوتارا قطاع ١٢، فصول ذكية، نسبة نجاح ١٠٠٪ في شهادة الداخل، ونقل مدرسي خاص.',
  },
};

function normalizeBengaliKey(s: string): string {
  return s
    .trim()
    .normalize('NFC')
    .replace(/\u09AF\u09BC/g, '\u09DF')
    .replace(/\u09A1\u09BC/g, '\u09DC')
    .replace(/\u09A2\u09BC/g, '\u09DD')
    .replace(/\s+/g, ' ');
}

const NORMALIZED_EXACT_TEXT_MAP: Record<string, { en: string; ar: string }> = Object.fromEntries(
  Object.entries(EXACT_TEXT_MAP).map(([k, v]) => [normalizeBengaliKey(k), v])
);

export function localizeDynamicText(textBn: string | undefined | null, lang: AppLanguage): string {
  if (!textBn) return '';
  if (lang === 'bn') return textBn;
  const normalized = normalizeBengaliKey(textBn);
  const exact = NORMALIZED_EXACT_TEXT_MAP[normalized];
  if (exact) {
    return lang === 'ar' ? exact.ar : exact.en;
  }
  return localizeDigits(textBn.trim(), lang);
}

export type PublicPageId =
  | 'home'
  | 'about'
  | 'context'
  | 'hifz-tree'
  | 'gallery'
  | 'activities'
  | 'reviews'
  | 'education-method'
  | 'ten-year-plan'
  | 'curriculum'
  | 'syllabus'
  | 'daycare-routine'
  | 'fees'
  | 'admission-guide'
  | 'admission'
  | 'transport'
  | 'feedback'
  | 'notices'
  | 'blog'
  | 'career'
  | 'contact';

export const PAGE_PATH_MAP: Record<PublicPageId, string> = {
  home: '/',
  about: '/about',
  context: '/context',
  'hifz-tree': '/hifz-tree',
  gallery: '/gallery',
  activities: '/activities',
  reviews: '/reviews',
  'education-method': '/education-method',
  'ten-year-plan': '/ten-year-plan',
  curriculum: '/curriculum',
  syllabus: '/syllabus',
  'daycare-routine': '/daycare-routine',
  fees: '/fees',
  'admission-guide': '/admission-guide',
  admission: '/admission',
  transport: '/transport',
  feedback: '/feedback',
  notices: '/notices',
  blog: '/blog',
  career: '/career',
  contact: '/contact',
};

export function resolvePageFromPath(pathname: string): PublicPageId {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const entry = (Object.entries(PAGE_PATH_MAP) as [PublicPageId, string][]).find(
    ([, path]) => path === clean
  );
  return entry ? entry[0] : 'home';
}

export interface NavDropdownGroup {
  id: string;
  label: Record<AppLanguage, string>;
  directPage?: PublicPageId;
  items?: {
    page: PublicPageId;
    title: Record<AppLanguage, string>;
    subtitle: Record<AppLanguage, string>;
    badge?: Record<AppLanguage, string>;
  }[];
}

export const HEADER_NAV_GROUPS: NavDropdownGroup[] = [
  {
    id: 'home',
    label: { bn: 'হোম', en: 'Home', ar: 'الرئيسية' },
    directPage: 'home',
  },
  {
    id: 'about-group',
    label: { bn: 'আমাদের সম্পর্কে', en: 'About Us', ar: 'من نحن' },
    items: [
      {
        page: 'hifz-tree',
        title: {
          bn: 'হিফজুল কুরআন ট্রি (১ম–৩০তম হাফেজ)',
          en: 'Hifzul Quran Tree (1st–30th Huffaz)',
          ar: 'شجرة حفاظ القرآن الكريم (١–٣٠)',
        },
        subtitle: {
          bn: 'শুরু থেকে ধারাবাহিকভাবে কুরআন সম্পন্নকারী ৩০ জন হাফেজের বংশবৃক্ষ ও প্রোফাইল',
          en: 'Chronological lineage of 30 Huffaz who completed the Holy Quran',
          ar: 'السجل المتسلسل لـ ٣٠ حافظاً للقرآن الكريم في المدرسة',
        },
        badge: { bn: '৩০ জন হাফেজ', en: '30 Huffaz', ar: '٣٠ حافظاً' },
      },
      {
        page: 'gallery',
        title: {
          bn: 'ফটো গ্যালারি ও সাফল্য চিত্র (দাখিল ১০০% পাস)',
          en: 'Photo Gallery & Board Achievements',
          ar: 'معرض الصور وإنجازات الطلاب',
        },
        subtitle: {
          bn: 'দাখিল ফলাফল, সীরাত প্রতিযোগিতা, দেয়ালিকা, শিক্ষাসফর ও ত্রৈমাসিক পত্রিকা',
          en: 'Dakhil 100% pass results, Seerah fest, study tours & publications',
          ar: 'نتائج شهادة الداخل والرحلات العلمية والمسابقات',
        },
        badge: { bn: 'নতুন', en: 'New', ar: 'جديد' },
      },
      {
        page: 'about',
        title: {
          bn: 'আমাদের বিশেষত্ব ও লক্ষ্য',
          en: 'Our Specialties & Mission',
          ar: 'مميزاتنا ورسالتنا التعليمية',
        },
        subtitle: {
          bn: '১৫টি অনন্য বৈশিষ্ট্য ও একাডেমিক মানদণ্ড',
          en: '15 institutional pillars & quality standards',
          ar: '١٥ ميزة تنافسية ومعايير الجودة',
        },
      },
      {
        page: 'context',
        title: {
          bn: 'প্রতিষ্ঠার প্রেক্ষাপট ও ইউনিফর্ম গাইড',
          en: 'Institutional Context & Uniform Guide',
          ar: 'خلفية التأسيس ودليل الزي المدرسي',
        },
        subtitle: {
          bn: 'আমাদের দর্শন, লক্ষ্য-উদ্দেশ্য ও ড্রেস কোড',
          en: 'Philosophy, objectives & student dress code',
          ar: 'الفلسفة التربوية والأهداف والزي الرسمي',
        },
      },
      {
        page: 'activities',
        title: {
          bn: 'আমাদের কার্যক্রম (ভিডিও ও রিলস গ্যালারি)',
          en: 'Our Activities & Video Reels',
          ar: 'أنشطتنا ومعرض الفيديو',
        },
        subtitle: {
          bn: 'বিজ্ঞান মেলা, সুইমিং, সবক প্রদান ও বার্ষিক পুরস্কার বিতরণী ভিডিও',
          en: 'Science fest, swimming course, Sabak ceremony & annual awards',
          ar: 'معرض العلوم والتدريب وحفلات التكريم',
        },
      },
      {
        page: 'reviews',
        title: {
          bn: 'অভিভাবকদের রিভিউ ও প্রশ্নোত্তর (FAQ)',
          en: 'Guardian Video Reviews & FAQs',
          ar: 'آراء أولياء الأمور والأسئلة الشائعة',
        },
        subtitle: {
          bn: 'সম্মানিত অভিভাবকদের বাস্তব অনুভূতি ও সাধারণ জিজ্ঞাসা',
          en: 'Real parent testimonials & common questions',
          ar: 'شهادات أولياء الأمور وإجابات الأسئلة المتكررة',
        },
      },
    ],
  },
  {
    id: 'curriculum-group',
    label: { bn: 'কারিকুলাম ও পাঠ্যক্রম', en: 'Curriculum & Plan', ar: 'المنهج والخطة' },
    items: [
      {
        page: 'education-method',
        title: {
          bn: 'শিক্ষা পদ্ধতি ৫০/৫০ ও বিষয়ের ভারসাম্য',
          en: '50/50 Education Method & Subject Balance',
          ar: 'منهج التعليم ٥٠/٥٠ وتوازن المواد',
        },
        subtitle: {
          bn: 'প্রি-হিফজ, হিফজ ও আফটার হিফজ স্তরের বিষয় অনুপাত',
          en: 'Interactive subject ratio across 3 academic stages',
          ar: 'نسب المواد التفاعلية عبر المراحل الثلاث',
        },
        badge: { bn: 'জনপ্রিয়', en: 'Featured', ar: 'مميز' },
      },
      {
        page: 'ten-year-plan',
        title: {
          bn: '১০ বছরের পাঠ পরিকল্পনা (নার্সারি–একাদশ)',
          en: '10-Year Academic Roadmap (Nursery–11th)',
          ar: 'الخطة الدراسية لعشر سنوات (الروضة–١١)',
        },
        subtitle: {
          bn: 'কুরআন, আরবি, ইসলাম ও সাধারণ শিক্ষার পূর্ণাঙ্গ ছক',
          en: 'Complete matrix for Quran, Arabic, Islam & General tracks',
          ar: 'مصفوفة متكاملة للقرآن والعربية والعلوم العامة',
        },
      },
      {
        page: 'daycare-routine',
        title: {
          bn: 'হিফজ ডে-কেয়ারের পূর্ণাঙ্গ রুটিন',
          en: 'Hifz Day-Care Daily Routine',
          ar: 'الجدول اليومي لرعاية وتحفيظ القرآن',
        },
        subtitle: {
          bn: 'সকাল ৭:০০ থেকে রাত ৮:৩০ পর্যন্ত ৪ প্রহরের সময়সূচি',
          en: '7:00 AM to 8:30 PM structured 4-period schedule',
          ar: 'جدول متكامل من ٧:٠٠ صباحاً حتى ٨:٣٠ مساءً',
        },
      },
      {
        page: 'curriculum',
        title: {
          bn: '৬-স্তম্ভ কারিকুলাম, আইটি ও সফট স্কিলস',
          en: '6-Pillar Curriculum, IT & Life Skills',
          ar: 'المنهج السداسي ومهارات التقنية والحياة',
        },
        subtitle: {
          bn: '১২টি আইটি স্কিলস ও ৫০+ সফট ও বিজনেস স্কিলস',
          en: '12 IT tracks & 50+ personal and business skills',
          ar: '١٢ مساراً تقنياً وأكثر من ٥٠ مهارة حياتية',
        },
      },
      {
        page: 'syllabus',
        title: {
          bn: 'একাডেমিক শ্রেণি ও বিষয়ভিত্তিক সিলেবাস',
          en: 'Academic Classes & Subject Syllabus',
          ar: 'الصفوف الدراسية والمقررات التفصيلية',
        },
        subtitle: {
          bn: 'শ্রেণিভিত্তিক মডিউল, লেকচার ও পাঠ্যবইয়ের বিবরণ',
          en: 'Grade-wise modules, lecture counts & topics',
          ar: 'الوحدات الدراسية وعدد المحاضرات لكل صف',
        },
      },
    ],
  },
  {
    id: 'admission-group',
    label: { bn: 'ভর্তি ও ফি', en: 'Admission & Fees', ar: 'القبول والرسوم' },
    items: [
      {
        page: 'fees',
        title: {
          bn: 'ফি কাঠামো ও ইন্টারঅ্যাক্টিভ ফি ক্যালকুলেটর',
          en: 'Fee Structure & Interactive Calculator',
          ar: 'هيكل الرسوم والحاسبة التفاعلية',
        },
        subtitle: {
          bn: 'ডিসকাউন্ট, আবাসন ও পরিবহনসহ A4 অফিসিয়াল প্রাক্কলন',
          en: 'Calculate net fees with discounts & download A4 PDF',
          ar: 'احسب الرسوم مع الخصومات وحمّل كشف A4 الرسمي',
        },
        badge: { bn: 'ক্যালকুলেটর', en: 'Calculator', ar: 'حاسبة' },
      },
      {
        page: 'admission-guide',
        title: {
          bn: 'ডে-কেয়ার বনাম নিয়মিত ফি তুলনা ও বয়সসীমা',
          en: 'Day-Care vs. Regular Fee & Age Eligibility',
          ar: 'مقارنة الرسوم وشروط العمر والوثائق',
        },
        subtitle: {
          bn: 'সহোদর ছাড়, বয়স চার্ট ও প্রয়োজনীয় কাগজপত্রের তালিকা',
          en: 'Sibling discounts, age chart & required documents',
          ar: 'خصم الإخوة، جدول الأعمار، والمستندات المطلوبة',
        },
      },
      {
        page: 'admission',
        title: {
          bn: 'অনলাইন রেজিস্ট্রেশন ও ৬-ধাপের ভর্তি ফরম',
          en: 'Online Registration & 6-Step Admission Form',
          ar: 'التسجيل الإلكتروني واستمارة القبول',
        },
        subtitle: {
          bn: 'সরাসরি অনলাইনে আবেদন ও ক্যাম্পাস ভিজিট বুকিং',
          en: 'Instant online application & campus tour booking',
          ar: 'التقديم المباشر وحجز زيارة الحرم التعليمي',
        },
      },
    ],
  },
  {
    id: 'campus-group',
    label: { bn: 'ক্যাম্পাস ও পরিবহন', en: 'Campus & Transport', ar: 'الحرم والنقل' },
    items: [
      {
        page: 'transport',
        title: {
          bn: 'নিজস্ব পরিবহন রুট ও মেট্রোরেল দূরত্ব',
          en: 'Own Transport Routes & Metro Distance',
          ar: 'مسارات النقل الخاص والمسافة من المترو',
        },
        subtitle: {
          bn: 'উত্তরা ও মিরপুর রুটের স্টপেজ, দূরত্ব ও মাসিক ভাড়া',
          en: 'Stop-by-stop route map, distance & fare calculator',
          ar: 'خريطة المحطات والمسافات وحاسبة رسوم النقل',
        },
      },
      {
        page: 'feedback',
        title: {
          bn: 'অভিভাবক অভিযোগ ও পরামর্শ বক্স',
          en: 'Guardian Feedback & Suggestion Box',
          ar: 'صندوق مقترحات وشكاوى أولياء الأمور',
        },
        subtitle: {
          bn: 'মাদ্রাসা প্রশাসনের কাছে সরাসরি মতামত ও পরামর্শ পাঠান',
          en: 'Share direct feedback or suggestions with management',
          ar: 'أرسل ملاحظاتك ومقترحاتك مباشرة لإدارة المعهد',
        },
      },
    ],
  },
  {
    id: 'notices',
    label: { bn: 'নোটিশ বোর্ড', en: 'Notices', ar: 'الإعلانات' },
    directPage: 'notices',
  },
  {
    id: 'blog',
    label: { bn: 'ব্লগ', en: 'Blog', ar: 'المدونة' },
    directPage: 'blog',
  },
  {
    id: 'career',
    label: { bn: 'ক্যারিয়ার', en: 'Career', ar: 'الوظائف' },
    directPage: 'career',
  },
  {
    id: 'contact',
    label: { bn: 'যোগাযোগ', en: 'Contact', ar: 'اتصل بنا' },
    directPage: 'contact',
  },
];
