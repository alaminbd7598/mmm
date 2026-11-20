export type AppLanguage = 'bn' | 'en' | 'ar';
export type FontSizeLevel = 'normal' | 'large' | 'larger';

export interface TranslationDictionary {
  // Top Bar & Accessibility
  admissionOffer: string;
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  applyNow: string;
  promoOffer: string;
  academic: string;
  hifz: string;
  latestUpdates: string;
  fontSize: string;
  themeToggle: string;
  languageSelect: string;
  newsMarquee: string[];

  // AI Assistant Floating Dialog
  aiAssistantTitle: string;
  aiAssistantGreeting: string;
  aiCommonQuestionsTitle: string;
  aiQuestion1: string;
  aiQuestion2: string;
  aiQuestion3: string;
  aiQuestion4: string;
  aiQuestion5: string;
  aiInputPlaceholder: string;
  aiResetChat: string;

  // Header Nav
  instituteName: string;
  navHome: string;
  navAdmission: string;
  navRegistration: string;
  navCurriculum: string;
  navFees: string;
  navAbout: string;
  navNotices: string;
  navContact: string;
  adminPanel: string;

  // Hero Section
  heroPreTitle: string;
  heroHeadingPart1: string;
  heroHeadingPart2: string;
  heroAcademicSub: string;
  heroHifzSub: string;
  heroBtnAdmission: string;
  heroBtnRegistration: string;
  heroBtnCalculator: string;
  heroBadgeClass: string;
  heroBadgeQuran: string;
  heroBadgeCare: string;
  heroRightOfferTitle: string;
  heroRightOfferSub: string;
  heroRightDiscount: string;
  heroRightDept1: string;
  heroRightDept2: string;
  heroRightDept3: string;
  heroRightDept4: string;
  heroDirectCall: string;
  heroOpenModalBtn: string;

  // Stats
  statStudents: string;
  statStudentsSub: string;
  statCurriculum: string;
  statCurriculumSub: string;
  statMastery: string;
  statMasterySub: string;
  statSatisfaction: string;
  statSatisfactionSub: string;

  // Campus & Departments
  ourCampus: string;
  campusSubtitle: string;
  campusDocTitle: string;
  campusDocDesc: string;
  campusFillBtn: string;
  campusBookBtn: string;
  ourDepartments: string;
  deptAcademicTitle: string;
  deptAcademicDesc: string;
  deptHifzTitle: string;
  deptHifzDesc: string;

  // 6-Pillar Curriculum
  curriculumTitle: string;
  curriculumPillar1: string;
  curriculumPillar1Desc: string;
  curriculumPillar2: string;
  curriculumPillar2Desc: string;
  curriculumPillar3: string;
  curriculumPillar3Desc: string;
  curriculumPillar4: string;
  curriculumPillar4Desc: string;
  curriculumPillar5: string;
  curriculumPillar5Desc: string;
  curriculumPillar6: string;
  curriculumPillar6Desc: string;

  // Skills
  itSkillsTitle: string;
  itSkillsSubtitle: string;
  softSkillsTitle: string;
  softSkillsSubtitle: string;

  // Activities
  activitiesTitle: string;
  activitiesSubtitle: string;

  // Registration Section
  regSectionBadge: string;
  regSectionTitle: string;
  regSectionSubtitle: string;
  regBannerTitle: string;
  regBannerSubtitle: string;
  regBannerBtn: string;
  regFormStudentName: string;
  regFormGuardianName: string;
  regFormRelation: string;
  regFormPhone: string;
  regFormEmail: string;
  regFormDepartment: string;
  regFormClass: string;
  regFormAccommodation: string;
  regFormVisitDate: string;
  regFormNotes: string;
  regFormSubmitBtn: string;
  regFormSuccess: string;

  // Fee Calculator
  feeOverviewTitle: string;
  feeOverviewSubtitle: string;
  calcDeptSelect: string;
  calcClassSelect: string;
  calcDiscountSelect: string;
  calcEarly25: string;
  calcFirst10: string;
  calcExtra5: string;
  calcAccommodationSelect: string;
  calcNonRes: string;
  calcRes: string;
  calcDayCare: string;
  calcResultTitle: string;
  calcOriginalAdmission: string;
  calcMonthlyTuition: string;
  calcTotalDiscount: string;
  calcNetAdmission: string;
  calcTotalFirstMonth: string;
  calcDownloadA4Pdf: string;
  calcDownloadA4Png: string;

  // About & Specialties
  aboutTitle: string;
  aboutSubtitle: string;
  aboutVision: string;
  aboutMission: string;

  // Notices
  noticesTitle: string;
  noticesSubtitle: string;
  noticesSearch: string;
  noticesAll: string;
  noticesViewPdf: string;

  // Contact
  contactTitle: string;
  contactSubtitle: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactOfficeHours: string;
  inquiryFormTitle: string;
  inquiryFormSubtitle: string;
  inquiryFormSendBtn: string;

  // Footer
  footerAbout: string;
  footerQuickLinks: string;
  footerReferenceDocs: string;
  footerContact: string;
  footerRights: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationDictionary> = {
  bn: {
    // Top Bar & Accessibility
    admissionOffer: 'প্রত্যেক শ্রেণির প্রথম ৫ জনের জন্য বিশেষ ছাড়!',
    days: 'দিন',
    hours: 'ঘণ্টা',
    minutes: 'মিনিট',
    seconds: 'সেকেন্ড',
    applyNow: 'এখনই ভর্তি হোন',
    promoOffer: 'অফার পপআপ',
    academic: 'জেনারেল সেকশন',
    hifz: 'তাহফিজ সেকশন',
    latestUpdates: 'সর্বশেষ আপডেট:',
    fontSize: 'ফন্ট সাইজ',
    themeToggle: 'থিম পরিবর্তন',
    languageSelect: 'ভাষা নির্বাচন',
    newsMarquee: [
      'মাহারাত মডেল মাদ্রাসায় (EIIN: 140630 | Code: 21023) প্রি-প্লে ও প্লে থেকে নবম/দাখিল শ্রেণি (আরবি ও ইংলিশ ভার্সন) এবং তাহফিজুল কুরআন বিভাগে ভর্তি চলছে!',
      'ভর্তিতে বিশেষ ছাড় — প্রত্যেক শ্রেণির প্রথম ৫ জন শিক্ষার্থীর জন্য বিশেষ ডিসকাউন্ট ও উপহার!',
      'বালক ও বালিকাদের সম্পূর্ণ আলাদা ক্যাম্পাস (উত্তরা সেক্টর-১২) — আবাসিক, অনাবাসিক, ডে-কেয়ার ও নিজস্ব পরিবহন সুবিধা।',
      'প্রজেক্টর, স্মার্ট টিভি ও স্মার্ট বোর্ড সমৃদ্ধ আইসিটি স্মার্ট ক্লাসরুম এবং ৩ ভাষায় (বাংলা, আরবি ও ইংরেজি) কথোপকথনে বিশেষ দক্ষতা।',
    ],

    // AI Assistant Floating Dialog
    aiAssistantTitle: 'এমএমএম এআই এজেন্ট (MMM AI Agent)',
    aiAssistantGreeting:
      'আসসালামু আলাইকুম! আমি মাহারাত মডেল মাদ্রাসার (EIIN: 140630) এমএমএম এআই এজেন্ট। ভর্তি, ২০২৭ ফি গাইড, কারিকুলাম বা ক্যাম্পাস সংক্রান্ত যেকোনো তথ্যে আমি আপনাকে সাহায্য করতে পারি।',
    aiCommonQuestionsTitle: 'সাধারণ জিজ্ঞাসা:',
    aiQuestion1: 'আসসালামু আলাইকুম, আমি মাহারাত মডেল মাদ্রাসার বিভাগসমূহ সম্পর্কে জানতে চাই।',
    aiQuestion2: 'ভর্তি যোগ্যতা ও আবেদন পদ্ধতি কী?',
    aiQuestion3: 'মাসিক বেতন ও আবাসিক/ডে-কেয়ার সুবিধা কত?',
    aiQuestion4: 'তাহফিজুল কুরআন বিভাগের কারিকুলাম ও নিয়মাবলি',
    aiQuestion5: 'উত্তরা সেক্টর-১২ ক্যাম্পাসের ঠিকানা ও ফোন নম্বর কী?',
    aiInputPlaceholder: 'মেসেজ টাইপ করুন...',
    aiResetChat: 'নতুন কথোপকথন',

    // Header Nav
    instituteName: 'মাহারাত মডেল মাদ্রাসা',
    navHome: 'হোম',
    navAdmission: 'ভর্তি ফরম',
    navRegistration: 'রেজিস্ট্রেশন',
    navCurriculum: 'কারিকুলাম',
    navFees: 'ফিস ক্যালকুলেটর',
    navAbout: 'আমাদের বিশেষত্ব',
    navNotices: 'নোটিশ বোর্ড',
    navContact: 'যোগাযোগ',
    adminPanel: 'এডমিন লগইন',

    // Hero Section
    heroPreTitle: 'একটি আধুনিক মানসম্পন্ন ব্যতিক্রমী দ্বীনি শিক্ষা প্রতিষ্ঠান (EIIN: 140630)',
    heroHeadingPart1: 'মানসম্মত শিক্ষা, দক্ষ জাতি ও',
    heroHeadingPart2: 'উন্নত দেশ গড়ার প্রত্যয়..!!',
    heroAcademicSub:
      'মাহারাত মডেল মাদ্রাসা (مدرسة المهارات النموذجية) — কুরআন-সুন্নাহর বিশুদ্ধ ইলম এবং আধুনিক জেনারেল শিক্ষার সমন্বয়ে প্রি-প্লে ও প্লে থেকে নবম/দাখিল (আরবি ও ইংলিশ ভার্সন) এবং তাহফিজুল কুরআন বিভাগে আবাসিক, অনাবাসিক ও ডে-কেয়ারে ভর্তি চলছে।',
    heroHifzSub:
      'আন্তর্জাতিক মানের হাফেজ ও ক্বারীদের তত্ত্বাবধানে নূরানী, নাজেরা ও হিফজ বিভাগের পাশাপাশি ৪টি মৌলিক জেনারেল বিষয় (বাংলা, ইংরেজি, গণিত ও আরবি) এবং আইসিটি স্মার্ট ক্লাসরুমের সমন্বিত কারিকুলাম।',
    heroBtnAdmission: 'পূর্ণাঙ্গ ভর্তি ফরম',
    heroBtnRegistration: '১ মিনিটে রেজিস্ট্রেশন',
    heroBtnCalculator: 'ফি হিসাব',
    heroBadgeClass: 'প্রি-প্লে ও প্লে থেকে ৯ম শ্রেণি (দাখিল)',
    heroBadgeQuran: 'নূরানী, নাজেরা ও হিফজ (+৪টি মৌলিক বিষয়)',
    heroBadgeCare: 'আবাসিক, অনাবাসিক ও ডে-কেয়ার + পরিবহন',
    heroRightOfferTitle: 'ভর্তি চলছে — মাহারাত মডেল মাদ্রাসা',
    heroRightOfferSub: 'প্রত্যেক শ্রেণির প্রথম ৫ জনের জন্য',
    heroRightDiscount: 'বিশেষ ছাড়!',
    heroRightDept1: 'প্লে থেকে ৯ম শ্রেণি (আরবি ও ইংলিশ ভার্সন)',
    heroRightDept2: 'নূরানী · নাজেরা · হিফজ (+৪টি মৌলিক বিষয়)',
    heroRightDept3: 'বালক ও বালিকাদের পৃথক ক্যাম্পাস (সেক্টর-১২)',
    heroRightDept4: 'প্রজেক্টর ও স্মার্ট বোর্ড সমৃদ্ধ ক্লাসরুম',
    heroDirectCall: 'সরাসরি কথা বলুন:',
    heroOpenModalBtn: 'ভর্তি ফরম ওপেন করুন →',

    // Stats
    statStudents: '৫৬৫+',
    statStudentsSub: 'অধ্যয়নরত শিক্ষার্থী (আবাসিক, অনাবাসিক ও ডে-কেয়ার)',
    statCurriculum: '৭৭ জন শিক্ষক',
    statCurriculumSub: 'অভিজ্ঞ আলেম, হাফেজ ও বিশ্ববিদ্যালয় গ্র্যাজুয়েট ফ্যাকাল্টি',
    statMastery: '২ টি ক্যাম্পাস',
    statMasterySub: 'উত্তরা সেক্টর-১২ তে বালক ও বালিকাদের পৃথক ক্যাম্পাস',
    statSatisfaction: 'EIIN: 140630',
    statSatisfactionSub: 'মাদ্রাসা কোড: ২১০২৩ | সরকারি বোর্ড ও NCTB কারিকুলাম',

    // Campus & Departments
    ourCampus: 'আমাদের ক্যাম্পাস',
    campusSubtitle: 'মানসম্মত শিক্ষা, দক্ষ জাতি ও উন্নত দেশ — আপনার সন্তানের উজ্জ্বল ভবিষ্যৎ',
    campusDocTitle: 'মাহারাত মডেল মাদ্রাসা ক্যাম্পাস পরিচিতি (উত্তরা সেক্টর-১২)',
    campusDocDesc:
      'প্রজেক্টর, স্মার্ট টিভি ও স্মার্ট বোর্ড সমৃদ্ধ আইসিটি ক্লাসরুম, ২৪ ঘণ্টা সিসিটিভি নিরাপত্তা, হিফজুল কুরআন হলরুম এবং স্বাস্থ্যসম্মত আবাসিক ও ডে-কেয়ার ব্যবস্থাপনার এক ঝলক।',
    campusFillBtn: 'সরাসরি ভর্তি ফরম পূরণ করুন',
    campusBookBtn: 'ক্যাম্পাস ভিজিট বুক করুন',
    ourDepartments: 'আমাদের বিভাগসমূহ',
    deptAcademicTitle: 'মাহারাত জেনারেল সেকশন (BOYS & GIRLS)',
    deptAcademicDesc:
      'প্রি-প্লে ও প্লে থেকে নবম/দাখিল শ্রেণি (বিজ্ঞান ও মানবিক — আরবি ও ইংলিশ ভার্সন)। বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ড ও NCTB সিলেবাসের সাথে ৩ ভাষায় দক্ষতা ও আইসিটি শিক্ষার সমন্বয়।',
    deptHifzTitle: 'মাহারাত তাহফিজ সেকশন (TAHFIZ SECTION)',
    deptHifzDesc:
      'নূরানী, নাজেরা ও হিফজুল কুরআন বিভাগ (সাথে বাংলা, ইংরেজি, গণিত ও আরবি—৪টি মৌলিক জেনারেল বিষয়)। আন্তর্জাতিক মানের হাফেজ ও ক্বারীদের তত্ত্বাবধানে বিশুদ্ধ হিফজ ও তারবিয়াহ।',

    // 6-Pillar Curriculum
    curriculumTitle: 'আমাদের সমন্বিত শিক্ষা কারিকুলাম (OUR CURRICULUM PILLARS)',
    curriculumPillar1: '০১. আল-কুরআন ও হাদিস (QURAN & HADITH)',
    curriculumPillar1Desc:
      'ইসলামের মৌলিক আকীদা, তাজবীদসহ বিশুদ্ধ কুরআন তিলাওয়াত, ১ম শ্রেণি থেকেই হাদিস মুখস্থ, মাসনুন দোয়া ও সুন্নাহভিত্তিক আমলি জিন্দেগী গঠন।',
    curriculumPillar2: '০২. জেনারেল একাডেমিক (NCTB & DAKHIL)',
    curriculumPillar2Desc:
      'প্রি-প্লে থেকে নবম/দাখিল পর্যন্ত আরবি ও ইংলিশ ভার্সনে বিজ্ঞান, গণিত ও মানবিক বিষয়ে যোগ্যতাভিত্তিক শিক্ষা এবং ক্লাসের পড়া ক্লাসেই আদায়।',
    curriculumPillar3: '০৩. ত্রি-ভাষা দক্ষতা (3-LANGUAGE MASTERY)',
    curriculumPillar3Desc:
      'প্রমিত বাংলা, ইংরেজি এবং সাবলীল আরবি ভাষায় কথোপকথন, প্রেজেন্টেশন, বিতর্ক ও সুন্দর হাতের লেখায় বিশেষ গুরুত্ব প্রদান।',
    curriculumPillar4: '০৪. আইসিটি ও স্মার্ট ক্লাসরুম (ICT & SMART TECH)',
    curriculumPillar4Desc:
      'প্রজেক্টর, স্মার্ট টিভি ও স্মার্ট বোর্ড সমৃদ্ধ ক্লাসরুম এবং কম্পিউটার, গ্রাফিক ডিজাইন, কোডিং ও আধুনিক তথ্যপ্রযুক্তি শিক্ষা।',
    curriculumPillar5: '০৫. ড্রীম ডায়েরি ও তারবিয়াহ (DREAM DIARY & TARBIYAH)',
    curriculumPillar5Desc:
      'ড্রীম ডায়েরির মাধ্যমে শিক্ষার্থীদের জীবনের লক্ষ্য নির্ধারণ, নৈতিক চরিত্র গঠন, স্টুডেন্ট কাউন্সিল ও নেতৃত্বের বিকাশ।',
    curriculumPillar6: '০৬. সৃজনশীল সাহিত্য ও বিজ্ঞান মেলা (CREATIVE & SCIENCE)',
    curriculumPillar6Desc:
      'খুদে লেখকদের লেখার অভ্যাস গঠনে নিয়মিত দেয়ালিকা ও ত্রৈমাসিক পত্রিকা প্রকাশ, বার্ষিক বিজ্ঞান মেলা, ফল মেলা ও শিক্ষাসফর।',

    // Skills
    itSkillsTitle: 'আইসিটি ও প্র্যাকটিক্যাল টেকনোলজি স্কিলস (ICT & TECH SKILLS)',
    itSkillsSubtitle:
      'আধুনিক প্রযুক্তির যুগে শিক্ষার্থীদের এগিয়ে রাখতে আমাদের আইসিটি স্মার্ট ক্লাসরুম ও ল্যাবে শেখানো হয় যুগোপযোগী প্রযুক্তিগত দক্ষতা',
    softSkillsTitle: 'সফট স্কিলস, আদব-আখলাক ও নেতৃত্ব বিকাশ',
    softSkillsSubtitle:
      'পুঁথিগত বিদ্যার পাশাপাশি বাস্তব জীবনে আদর্শ, আত্মনির্ভরশীল ও দক্ষ নাগরিক হতে জীবনমুখী তারবিয়াহ ও সহশিক্ষা কার্যক্রম',

    // Activities
    activitiesTitle: 'আমাদের কার্যক্রম',
    activitiesSubtitle:
      'সন্তানের সুপ্ত প্রতিভা বিকাশে বিজ্ঞান মেলা, ফল মেলা, শিক্ষাসফর, স্টুডেন্ট কাউন্সিল ও সাংস্কৃতিক আয়োজন',

    // Registration Section
    regSectionBadge: 'অনলাইন রেজিস্ট্রেশন ও ক্যাম্পাস ভিজিট — EIIN: 140630',
    regSectionTitle: 'অনলাইন রেজিস্ট্রেশন ফরম',
    regSectionSubtitle:
      'সন্তানের দ্রুত রেজিস্ট্রেশন ও উত্তরা সেক্টর-১২ ক্যাম্পাস ভিজিটের জন্য নিচের সহজ ফরমটি পূরণ করুন। আমাদের প্রতিনিধি অবিলম্বে আপনার সাথে যোগাযোগ করবেন।',
    regBannerTitle: 'আপনি কি ৬-ধাপের পূর্ণাঙ্গ একাডেমিক ভর্তি ফরম পূরণ করতে চান?',
    regBannerSubtitle:
      'অভিভাবকের বিস্তারিত তথ্য, পারিবারিক পরিবেশ, আচরণগত রিপোর্ট ও পাসপোর্ট ছবি সম্বলিত অফিসিয়াল ফরম',
    regBannerBtn: '৬-ধাপের ভর্তি ফরম ওপেন করুন',
    regFormStudentName: 'শিক্ষার্থীর পূর্ণ নাম *',
    regFormGuardianName: 'অভিভাবকের নাম *',
    regFormRelation: 'সম্পর্ক *',
    regFormPhone: 'মোবাইল নম্বর *',
    regFormEmail: 'ইমেইল ঠিকানা *',
    regFormDepartment: 'বিভাগ নির্বাচন করুন *',
    regFormClass: 'কাঙ্ক্ষিত শ্রেণি / স্তর *',
    regFormAccommodation: 'আবাসন ব্যবস্থা *',
    regFormVisitDate: 'ক্যাম্পাস ভিজিটের সম্ভাব্য তারিখ',
    regFormNotes: 'বিশেষ কোনো জিজ্ঞাসা বা মন্তব্য',
    regFormSubmitBtn: 'অনলাইন রেজিস্ট্রেশন সম্পন্ন করুন',
    regFormSuccess: 'ধন্যবাদ! আপনার রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে।',

    // Fee Calculator
    feeOverviewTitle: 'আমাদের ফি কাঠামো (FEES OVERVIEW)',
    feeOverviewSubtitle:
      'মানসম্মত শিক্ষা এবং আধুনিক সুবিধার সমন্বয়ে আমাদের সাশ্রয়ী ফি তালিকা (মাহারাত মডেল মাদ্রাসা)',
    calcDeptSelect: 'বিভাগ নির্বাচন করুন:',
    calcClassSelect: 'শ্রেণি বা স্তর নির্বাচন করুন:',
    calcDiscountSelect: 'ভর্তি ফিতে ডিসকাউন্ট অপশন নির্বাচন করুন (ক্লিক করুন):',
    calcEarly25: 'অগ্রিম / প্রথম ৫ জনের বিশেষ ২৫% ছাড়',
    calcFirst10: 'স্পেশাল ১০% ভর্তি ছাড়',
    calcExtra5: 'এককালীন পরিশোধে এক্সট্রা ৫% ছাড়',
    calcAccommodationSelect: 'আবাসন ব্যবস্থা নির্বাচন করুন:',
    calcNonRes: 'অনাবাসিক (Non-Residential)',
    calcRes: 'আবাসিক (Residential - খাবারসহ)',
    calcDayCare: 'ডে-কেয়ার (Day Care)',
    calcResultTitle: 'ভর্তি ও মাসিক খরচের চূড়ান্ত হিসাব',
    calcOriginalAdmission: 'নির্ধারিত ভর্তি ফি:',
    calcMonthlyTuition: 'মাসিক বেতন ও টিউশন:',
    calcTotalDiscount: 'মোট ডিসকাউন্ট ছাড়:',
    calcNetAdmission: 'ছাড়ের পর চূড়ান্ত ভর্তি ফি:',
    calcTotalFirstMonth: 'ভর্তির সময় মোট প্রদেয়:',
    calcDownloadA4Pdf: 'অফিসিয়াল A4 PDF ডাউনলোড',
    calcDownloadA4Png: 'A4 ছবি (PNG) ডাউনলোড',

    // About & Specialties
    aboutTitle: 'আমাদের বিশেষত্ব (OUR SPECIALTIES)',
    aboutSubtitle:
      'যে ১৭টি অনন্য বৈশিষ্ট্যের কারণে মাহারাত মডেল মাদ্রাসা আপনার সন্তানের জন্য সর্বোত্তম পছন্দ',
    aboutVision: 'আমাদের ভিশন',
    aboutMission: 'আমাদের মিশন',

    // Notices
    noticesTitle: 'নোটিশ বোর্ড (NOTICE BOARD)',
    noticesSubtitle: 'ভর্তি, বিজ্ঞান মেলা, পরীক্ষা, ছুটির দিন ও প্রাতিষ্ঠানিক সকল সাম্প্রতিক বিজ্ঞপ্তি',
    noticesSearch: 'নোটিশ খুঁজুন...',
    noticesAll: 'সকল',
    noticesViewPdf: 'অফিসিয়াল পিডিএফ দেখুন',

    // Contact
    contactTitle: 'যোগাযোগ (CONTACT US)',
    contactSubtitle: 'উত্তরা সেক্টর-১২ ক্যাম্পাসে সরাসরি কথা বলুন অথবা আপনার বার্তা পাঠান',
    contactPhone: 'ভর্তি হটলাইন:',
    contactEmail: 'অফিসিয়াল ইমেইল:',
    contactAddress: 'ক্যাম্পাস ঠিকানা:',
    contactOfficeHours: 'অফিস সময়:',
    inquiryFormTitle: 'দ্রুত ভর্তি জিজ্ঞাসা ও বার্তা পাঠান',
    inquiryFormSubtitle:
      'সাবমিট করার সাথে সাথে এডমিন প্যানেলে লিড যুক্ত হবে এবং ইমেইল নোটিফিকেশন যাবে',
    inquiryFormSendBtn: 'বার্তা ও আবেদন পাঠান',

    // Footer
    footerAbout:
      'মাহারাত মডেল মাদ্রাসা (EIIN: 140630 | Madrasah Code: 21023) — কুরআনের নূর ও আধুনিক বিজ্ঞানের সমন্বয়ে আপনার সন্তানের উজ্জ্বল ভবিষ্যৎ গড়ার নির্ভরযোগ্য প্রতিষ্ঠান।',
    footerQuickLinks: 'প্রয়োজনীয় লিংক',
    footerReferenceDocs: 'অফিসিয়াল ই-প্রসপেক্টাস ও ডকুমেন্টস',
    footerContact: 'যোগাযোগের তথ্য (উত্তরা সেক্টর-১২)',
    footerRights: 'সর্বস্বত্ব সংরক্ষিত। মাহারাত মডেল মাদ্রাসা (Maharat Model Madrasah)।',
  },

  en: {
    // Top Bar & Accessibility
    admissionOffer: 'Special Discount for First 5 Students per Class!',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Mins',
    seconds: 'Secs',
    applyNow: 'Apply Now',
    promoOffer: 'Promo Offer',
    academic: 'General Section',
    hifz: 'Tahfiz Section',
    latestUpdates: 'Latest News:',
    fontSize: 'Font Size',
    themeToggle: 'Theme Mode',
    languageSelect: 'Select Language',
    newsMarquee: [
      'Admissions Open at Maharat Model Madrasah (EIIN: 140630 | Code: 21023): Pre-Play & Play to Class Nine (Dakhil) & Tahfizul Quran!',
      'Special Admission Discount for the first 5 enrolled students in every class!',
      'Separate Boys & Girls Campuses in Uttara Sector-12 — Residential, Non-Residential, Day-Care & Own Transport facilities.',
      'ICT Smart Classrooms with Projectors, Smart TVs & Smart Boards alongside 3-Language Fluency (Bangla, Arabic, English).',
    ],

    // AI Assistant Floating Dialog
    aiAssistantTitle: 'MMM AI Agent',
    aiAssistantGreeting:
      "Assalamu Alaikum! I am Maharat Model Madrasah's (EIIN: 140630) MMM AI Agent. How can I help you regarding admissions, 2027 fees, curriculum, or campus visits?",
    aiCommonQuestionsTitle: 'Frequently Asked Questions:',
    aiQuestion1: 'Assalamu Alaikum, I would like to learn about your General & Tahfiz sections.',
    aiQuestion2: 'What are the admission requirements and application process?',
    aiQuestion3: 'What are the monthly tuition and accommodation charges?',
    aiQuestion4: 'Tahfizul Quran department curriculum and guidelines',
    aiQuestion5: 'How can I contact or visit the Uttara Sector-12 campuses?',
    aiInputPlaceholder: 'Type your message...',
    aiResetChat: 'New Conversation',

    // Header Nav
    instituteName: 'Maharat Model Madrasah',
    navHome: 'Home',
    navAdmission: 'Admission Form',
    navRegistration: 'Registration',
    navCurriculum: 'Curriculum',
    navFees: 'Fees Calculator',
    navAbout: 'About Us',
    navNotices: 'Notice Board',
    navContact: 'Contact',
    adminPanel: 'Admin Login',

    // Hero Section
    heroPreTitle: 'A Madrasah with Excellence | EIIN: 140630 | Code: 21023',
    heroHeadingPart1: 'Quality Education, Skilled Nation &',
    heroHeadingPart2: 'Building a Prosperous Country!',
    heroAcademicSub:
      'Maharat Model Madrasah (مدرسة المهارات النموذجية) — Synthesizing authentic Quran-Sunnah scholarship with modern general academics. Admissions open from Pre-Play & Play to Class Nine (Dakhil) in Arabic & English Version and Tahfizul Quran.',
    heroHifzSub:
      'Complete Quran Hifz (Nurani, Nazera & Hifz) under certified Huffaz & Qaris alongside 4 fundamental general subjects (Bangla, English, Math & Arabic) and ICT smart classrooms.',
    heroBtnAdmission: 'Full Admission Form',
    heroBtnRegistration: '1-Min Registration',
    heroBtnCalculator: 'Fee Calculator',
    heroBadgeClass: 'Pre-Play & Play to Class Nine (Dakhil)',
    heroBadgeQuran: 'Nurani, Nazera & Hifz (+4 Core Subjects)',
    heroBadgeCare: 'Residential, Non-Residential, Day-Care & Transport',
    heroRightOfferTitle: 'Admission Open — Maharat Model Madrasah',
    heroRightOfferSub: 'For the First 5 Students of Each Class',
    heroRightDiscount: 'Special Off!',
    heroRightDept1: 'Play to Class 9 (Arabic & English Version)',
    heroRightDept2: 'Nurani · Nazera · Hifz (+4 Core Subjects)',
    heroRightDept3: 'Separate Boys & Girls Campuses (Sector-12)',
    heroRightDept4: 'ICT Smart Classrooms & Dream Diary',
    heroDirectCall: 'Call Helpline Directly:',
    heroOpenModalBtn: 'Open Admission Form →',

    // Stats
    statStudents: '565+',
    statStudentsSub: 'Active Students (Residential, Non-Residential & Day Care)',
    statCurriculum: '77 Teachers',
    statCurriculumSub: 'Certified Scholars, Huffaz & University Graduate Faculty',
    statMastery: '2 Campuses',
    statMasterySub: 'Separate Boys & Girls Campuses in Uttara Sector-12',
    statSatisfaction: 'EIIN: 140630',
    statSatisfactionSub: 'Madrasah Code: 21023 | NCTB & Madrasah Board Approved',

    // Campus & Departments
    ourCampus: 'OUR CAMPUS',
    campusSubtitle: 'Quality Education, Skilled Nation & Prosperous Country — Your Child’s Bright Future',
    campusDocTitle: 'Maharat Model Madrasah Campus Tour (Uttara Sector-12)',
    campusDocDesc:
      'A glimpse of ICT smart classrooms equipped with projectors, smart TVs, and smart boards, 24/7 CCTV security, Tahfiz halls, and hygienic residential & day-care facilities.',
    campusFillBtn: 'Fill Online Admission Form',
    campusBookBtn: 'Schedule Campus Visit',
    ourDepartments: 'OUR DEPARTMENTS',
    deptAcademicTitle: 'MAHARAT GENERAL SECTION (BOYS & GIRLS)',
    deptAcademicDesc:
      'Class Pre-Play & Play to Nine / Dakhil (Science & Humanities — Arabic & English Version). Blending NCTB & Madrasah Board curriculum with trilingual fluency and ICT mastery.',
    deptHifzTitle: 'MAHARAT TAHFIZ SECTION',
    deptHifzDesc:
      'Nurani, Nazera & Hifz with 4 Fundamental Subjects (Bangla, English, Mathematics & Arabic). Pure Hifz under certified Qaris paired seamlessly with general schooling.',

    // 6-Pillar Curriculum
    curriculumTitle: 'OUR INTEGRATED CURRICULUM PILLARS',
    curriculumPillar1: '01. AL-QURAN & HADITH',
    curriculumPillar1Desc:
      'Foundations of Aqeedah, pure Quran recitation with Tajweed, Hadith memorization from Class 1, Masnoon Duas, and Sunnah character building.',
    curriculumPillar2: '02. GENERAL ACADEMICS (NCTB & DAKHIL)',
    curriculumPillar2Desc:
      'Competency-based excellence in Science, Mathematics, and Humanities (Arabic & English Version) with daily lessons mastered inside the classroom.',
    curriculumPillar3: '03. 3-LANGUAGE MASTERY',
    curriculumPillar3Desc:
      'Flawless Bengali, fluent English, and spoken Arabic conversation, calligraphy, presentation, and stage speaking.',
    curriculumPillar4: '04. ICT SMART CLASSROOMS',
    curriculumPillar4Desc:
      'Classrooms equipped with Projectors, Smart TVs & Smart Boards alongside hands-on Computer, Graphic Design, and Digital Literacy labs.',
    curriculumPillar5: '05. DREAM DIARY & MORAL TARBIYAH',
    curriculumPillar5Desc:
      'Goal setting and daily motivation via the Maharat Dream Diary, Student Council leadership, and maternal care for early learners.',
    curriculumPillar6: '06. SCIENCE FAIRS & PUBLICATIONS',
    curriculumPillar6Desc:
      'Regular Wall Magazines and Quarterly Publications for young writers, Annual Science Fairs, Fruit Festivals, and Educational Study Tours.',

    // Skills
    itSkillsTitle: 'ICT & PRACTICAL TECHNOLOGY SKILLS',
    itSkillsSubtitle:
      'Equipping young learners for the digital age with ICT smart classrooms and hands-on computer lab training',
    softSkillsTitle: 'SOFT SKILLS, MORAL TARBIYAH & LEADERSHIP',
    softSkillsSubtitle:
      'Transforming theoretical education into practical life leadership, Islamic etiquette, and self-reliance',

    // Activities
    activitiesTitle: 'OUR ACTIVITIES & CO-CURRICULAR',
    activitiesSubtitle:
      'Science Fairs, Fruit Festivals, Study Tours, Student Council, Wall Magazines, and Quran Competitions throughout the year',

    // Registration Section
    regSectionBadge: 'Online Registration & Campus Visit — EIIN: 140630',
    regSectionTitle: 'Online Registration Form',
    regSectionSubtitle:
      'Complete the short form below for prompt registration and Uttara Sector-12 campus visit scheduling. Our admission officer will reach out immediately.',
    regBannerTitle: 'Looking to submit the 6-Step Comprehensive Academic Admission Form?',
    regBannerSubtitle:
      'Official application dossier with student photo upload, detailed family background, and behavioral evaluation.',
    regBannerBtn: 'Launch 6-Step Admission Form',
    regFormStudentName: 'Student Full Name *',
    regFormGuardianName: 'Guardian Name *',
    regFormRelation: 'Relation *',
    regFormPhone: 'Mobile Phone *',
    regFormEmail: 'Email Address *',
    regFormDepartment: 'Select Academic Department *',
    regFormClass: 'Target Class / Track *',
    regFormAccommodation: 'Accommodation Type *',
    regFormVisitDate: 'Preferred Campus Visit Date',
    regFormNotes: 'Special Inquiries or Remarks',
    regFormSubmitBtn: 'Submit Online Registration',
    regFormSuccess: 'Thank you! Your registration has been submitted successfully.',

    // Fee Calculator
    feeOverviewTitle: 'FEES STRUCTURE OVERVIEW',
    feeOverviewSubtitle:
      'Transparent, high-value fee breakdown blending world-class education with affordable cost (Maharat Model Madrasah)',
    calcDeptSelect: 'Select Department:',
    calcClassSelect: 'Select Class or Track:',
    calcDiscountSelect: 'Select Applicable Discount Offers (Click to Toggle):',
    calcEarly25: 'Early Bird / First 5 Students 25% Discount',
    calcFirst10: 'Special 10% Admission Discount',
    calcExtra5: 'Extra 5% One-Time Payment Discount',
    calcAccommodationSelect: 'Select Accommodation Mode:',
    calcNonRes: 'Non-Residential',
    calcRes: 'Residential (Full Meals & Care)',
    calcDayCare: 'Day Care Facility',
    calcResultTitle: 'Final Admission & Monthly Cost Calculation',
    calcOriginalAdmission: 'Standard Admission Fee:',
    calcMonthlyTuition: 'Monthly Tuition & Academic Fee:',
    calcTotalDiscount: 'Total Discount Savings:',
    calcNetAdmission: 'Net Admission Fee (After Discount):',
    calcTotalFirstMonth: 'Total Payable at Admission:',
    calcDownloadA4Pdf: 'Download Official A4 PDF',
    calcDownloadA4Png: 'Download A4 PNG Image',

    // About & Specialties
    aboutTitle: 'OUR 17 SPECIALTIES & VISION (ABOUT US)',
    aboutSubtitle:
      'Key institutional pillars that make Maharat Model Madrasah (EIIN: 140630) the prime choice for your child',
    aboutVision: 'Our Vision',
    aboutMission: 'Our Mission',

    // Notices
    noticesTitle: 'OFFICIAL NOTICE BOARD',
    noticesSubtitle:
      'Stay updated with the latest institutional notices, Science Fair updates, exam schedules, and announcements',
    noticesSearch: 'Search notices...',
    noticesAll: 'All',
    noticesViewPdf: 'View Official PDF',

    // Contact
    contactTitle: 'CONTACT US & CAMPUS INQUIRY',
    contactSubtitle: 'Reach out to our Uttara Sector-12 admission counselors or send an instant inquiry message',
    contactPhone: 'Admission Hotline:',
    contactEmail: 'Official Email:',
    contactAddress: 'Campus Address:',
    contactOfficeHours: 'Office Hours:',
    inquiryFormTitle: 'Send Instant Admission Inquiry',
    inquiryFormSubtitle: 'Your inquiry will be logged directly into the Admin CRM with instant email dispatch',
    inquiryFormSendBtn: 'Send Inquiry Message',

    // Footer
    footerAbout:
      'Maharat Model Madrasah (EIIN: 140630 | Madrasah Code: 21023) — A Madrasah with Excellence blending pure Islamic teachings and modern science.',
    footerQuickLinks: 'Quick Links',
    footerReferenceDocs: 'Official e-Prospectus & Documents',
    footerContact: 'Contact Details (Uttara Sector-12)',
    footerRights: 'All rights reserved. Maharat Model Madrasah.',
  },

  ar: {
    // Top Bar & Accessibility
    admissionOffer: 'خصم خاص لأول ٥ طلاب في كل صف!',
    days: 'يوم',
    hours: 'ساعة',
    minutes: 'دقيقة',
    seconds: 'ثانية',
    applyNow: 'سجّل الآن',
    promoOffer: 'عرض خاص',
    academic: 'القسم العام',
    hifz: 'قسم التحفيظ',
    latestUpdates: 'آخر الأخبار:',
    fontSize: 'حجم الخط',
    themeToggle: 'تغيير المظهر',
    languageSelect: 'اختر اللغة',
    newsMarquee: [
      'باب القبول والتسجيل مفتوح في مدرسة المهارات النموذجية (EIIN: 140630 | Code: 21023) من التمهيدي إلى الصف التاسع (الداخل) وقسم تحفيظ القرآن الكريم!',
      'خصم خاص لأول ٥ طلاب مسجلين في كل صف دراسي!',
      'حرم منفصل للبنين والبنات في أوتارا قطاع ١٢ — إقامة داخلية وخارجية ورعاية نهارية ونقل مدرسي خاص.',
      'فصول ذكية مجهزة بأحدث التقنيات مع إتقان ٣ لغات (العربية والإنجليزية والبنغالية).',
    ],

    // AI Assistant Floating Dialog
    aiAssistantTitle: 'وكيل مهارات الذكي (MMM AI Agent)',
    aiAssistantGreeting:
      'السلام عليكم ورحمة الله وبركاته! أنا وكيل مهارات الذكي (MMM AI Agent) لمدرسة المهارات النموذجية (EIIN: 140630). كيف يمكنني مساعدتكم بخصوص القبول والمناهج والرسوم الدراسية؟',
    aiCommonQuestionsTitle: 'الأسئلة الشائعة:',
    aiQuestion1: 'السلام عليكم، أرغب في التعرف على الأقسام والبرامج التعليمية.',
    aiQuestion2: 'ما هي شروط القبول وإجراءات التقديم؟',
    aiQuestion3: 'ما هي تكاليف الرسوم الشهرية ونظام الإقامة؟',
    aiQuestion4: 'تفاصيل وضوابط قسم تحفيظ القرآن الكريم',
    aiQuestion5: 'كيف يمكنني التواصل وزيارة مقر المدرسة في أوتارا قطاع ١٢؟',
    aiInputPlaceholder: 'اكتب رسالتك هنا...',
    aiResetChat: 'محادثة جديدة',

    // Header Nav
    instituteName: 'مدرسة المهارات النموذجية',
    navHome: 'الرئيسية',
    navAdmission: 'استمارة القبول',
    navRegistration: 'التسجيل',
    navCurriculum: 'المنهج التعليمي',
    navFees: 'حاسبة الرسوم',
    navAbout: 'مميزاتنا',
    navNotices: 'لوحة الإعلانات',
    navContact: 'اتصل بنا',
    adminPanel: 'دخول الإدارة',

    // Hero Section
    heroPreTitle: 'مؤسسة تعليمية دينية عصرية متميزة | EIIN: 140630 | Code: 21023',
    heroHeadingPart1: 'تعليم متميز، جيل كفؤ،',
    heroHeadingPart2: 'ووطن متقدم ومزدهر!',
    heroAcademicSub:
      'مدرسة المهارات النموذجية (Maharat Model Madrasah) — الجمع المتوازن بين علوم القرآن والسنة والتعليم العام الحديث. القبول مفتوح من مرحلة ما قبل الروضة إلى الصف التاسع (الداخل) بالنسختين العربية والإنجليزية وقسم تحفيظ القرآن.',
    heroHifzSub:
      'تحفيظ القرآن الكريم (النورانية، الناظرة، والحفظ) بإشراف نخبة من الحفاظ والقراء بالتوازي مع دراسة ٤ مواد أكاديمية أساسية والفصول الذكية.',
    heroBtnAdmission: 'استمارة القبول الكاملة',
    heroBtnRegistration: 'التسجيل خلال دقيقة',
    heroBtnCalculator: 'حاسبة الرسوم',
    heroBadgeClass: 'من التمهيدي إلى الصف التاسع (الداخل)',
    heroBadgeQuran: 'النورانية، الناظرة، والحفظ (+٤ مواد أساسية)',
    heroBadgeCare: 'داخلي، خارجي، رعاية نهارية ونقل مدرسي',
    heroRightOfferTitle: 'بدء القبول — مدرسة المهارات النموذجية',
    heroRightOfferSub: 'لأول ٥ طلاب في كل صف دراسي',
    heroRightDiscount: 'خصم خاص!',
    heroRightDept1: 'القسم العام (بالنسختين العربية والإنجليزية)',
    heroRightDept2: 'نورانية · ناظرة · حفظ كامل (+٤ مواد أساسية)',
    heroRightDept3: 'حرم منفصل للبنين والبنات (أوتارا قطاع ١٢)',
    heroRightDept4: 'فصول ذكية وسجل الطموحات اليومي',
    heroDirectCall: 'اتصل بمكتب القبول مباشرة:',
    heroOpenModalBtn: 'فتح استمارة القبول ←',

    // Stats
    statStudents: '+٥٦٥',
    statStudentsSub: 'طالب وطالبة (داخلي وخارجي ورعاية نهارية)',
    statCurriculum: '٧٧ معلماً',
    statCurriculumSub: 'نخبة من العلماء والحفاظ وخريجي الجامعات',
    statMastery: 'حرمان تعليميان',
    statMasterySub: 'مبنى مستقل للبنين ومبنى مستقل للبنات في أوتارا قطاع ١٢',
    statSatisfaction: 'EIIN: 140630',
    statSatisfactionSub: 'كود المدرسة: ٢١٠٢٣ | معتمد من مجلس التعليم',

    // Campus & Departments
    ourCampus: 'حرم المدرسة (OUR CAMPUS)',
    campusSubtitle: 'تعليم متميز، جيل كفؤ، ووطن متقدم — لمستقبل واعد لأبنائكم',
    campusDocTitle: 'جولة تعريفية في مدرسة المهارات النموذجية (أوتارا قطاع ١٢)',
    campusDocDesc:
      'فصول دراسية ذكية مزودة بأجهزة العرض والشاشات التفاعلية، مراقبة بالكاميرات على مدار الساعة، قاعات تحفيظ قرآن رحبة، وإقامة صحية وآمنة.',
    campusFillBtn: 'تعبئة استمارة القبول الآن',
    campusBookBtn: 'حجز موعد لزيارة الحرم',
    ourDepartments: 'أقسامنا التعليمية (OUR DEPARTMENTS)',
    deptAcademicTitle: 'القسم العام بمدرسة المهارات (BOYS & GIRLS)',
    deptAcademicDesc:
      'من مرحلة ما قبل الروضة إلى الصف التاسع / الداخل (علمي وأدبي — بالنسختين العربية والإنجليزية) مع إتقان اللغات الثلاث والتقنية.',
    deptHifzTitle: 'قسم تحفيظ القرآن الكريم (TAHFIZ SECTION)',
    deptHifzDesc:
      'النورانية، الناظرة، والحفظ الكامل مع ٤ مواد أساسية (البنغالية، الإنجليزية، الرياضيات، والعربية) تحت إشراف قراء مجازين.',

    // 6-Pillar Curriculum
    curriculumTitle: 'منهجنا التعليمي المتكامل',
    curriculumPillar1: '٠١. القرآن الكريم والحديث الشريف',
    curriculumPillar1Desc:
      'العقيدة الصحيحة، وتلاوة القرآن الكريم بالتجويد، وحفظ الحديث الشريف منذ الصف الأول، والأدعية المأثورة، وبناء الشخصية الإسلامية.',
    curriculumPillar2: '٠٢. التميز الأكاديمي (NCTB & DAKHIL)',
    curriculumPillar2Desc:
      'التعليم القائم على الكفاءة في العلوم والرياضيات بالنسختين العربية والإنجليزية مع استيعاب الدروس بالكامل داخل الفصل.',
    curriculumPillar3: '٠٣. إتقان ٣ لغات (3-LANGUAGE MASTERY)',
    curriculumPillar3Desc:
      'إتقان تام للغة البنغالية، والإنجليزية، والتحدث باللغة العربية بطلاقة مع تحسين الخط والخطابة.',
    curriculumPillar4: '٠٤. الفصول الذكية والتقنية (ICT SMART TECH)',
    curriculumPillar4Desc:
      'فصول مجهزة بأجهزة العرض والألواح الذكية مع تدريب عملي على الحاسوب والتصميم والتقنية الحديثة.',
    curriculumPillar5: '٠٥. سجل الطموحات والتربية (DREAM DIARY)',
    curriculumPillar5Desc:
      'تحفيز الطلاب وتحديد أهدافهم عبر سجل الطموحات، وتنمية القيادة عبر مجلس الطلاب والرعاية التربوية.',
    curriculumPillar6: '٠٦. المعارض العلمية والإصدارات الأدبية',
    curriculumPillar6Desc:
      'إصدار المجلات الحائطية والدورية لتنمية مهارات الكتابة، وإقامة معرض العلوم السنوي ومهرجان الفواكه والرحلات العلمية.',

    // Skills
    itSkillsTitle: 'مهارات التقنية والفصول الذكية',
    itSkillsSubtitle:
      'تأهيل الطلاب للمستقبل الرقمي من خلال الفصول التفاعلية الذكية والتدريب العملي في مختبرات الحاسوب',
    softSkillsTitle: 'المهارات الحياتية والقيادية والآداب الإسلامية',
    softSkillsSubtitle:
      'تحويل التعليم النظري إلى مهارات قيادية وتطبيقية تبني الثقة والاعتماد على النفس والأخلاق النبيلة',

    // Activities
    activitiesTitle: 'أنشطتنا اللاصفية (OUR ACTIVITIES)',
    activitiesSubtitle:
      'معرض العلوم، مهرجان الفواكه، الرحلات العلمية، مجلس الطلاب، المجلات الحائطية والمسابقات القرآنية',

    // Registration Section
    regSectionBadge: 'التسجيل الإلكتروني وزيارة الحرم — EIIN: 140630',
    regSectionTitle: 'استمارة التسجيل الأولي',
    regSectionSubtitle:
      'يرجى ملء النموذج القصير أدناه لتسجيل رغبتكم وحجز موعد لزيارة الحرم في أوتارا قطاع ١٢. سيتواصل معكم مسؤول القبول فوراً.',
    regBannerTitle: 'هل ترغب في تعبئة استمارة القبول الأكاديمية الشاملة المكونة من ٦ مراحل؟',
    regBannerSubtitle:
      'ملف تقديم رسمي يتضمن تحميل صورة الطالب، والبيانات العائلية المفصلة، والتقرير السلوكي، والتعهد الأكاديمي.',
    regBannerBtn: 'فتح استمارة القبول الشاملة',
    regFormStudentName: 'اسم الطالب بالكامل *',
    regFormGuardianName: 'اسم ولي الأمر *',
    regFormRelation: 'صلة القرابة *',
    regFormPhone: 'رقم الهاتف المحمول *',
    regFormEmail: 'البريد الإلكتروني *',
    regFormDepartment: 'اختر القسم التعليمي *',
    regFormClass: 'الصف / المسار المطلوب *',
    regFormAccommodation: 'نظام الإقامة *',
    regFormVisitDate: 'تاريخ الزيارة المقترح للحرم',
    regFormNotes: 'أي استفسار أو ملاحظات خاصة',
    regFormSubmitBtn: 'تأكيد وإرسال التسجيل الأولي',
    regFormSuccess: 'شكراً لكم! تم استلام طلب التسجيل بنجاح وسيتواصل معكم فريق القبول.',

    // Fee Calculator
    feeOverviewTitle: 'جدول الرسوم المدرسية (FEES OVERVIEW)',
    feeOverviewSubtitle:
      'رسوم شفافة ومناسبة تجمع بين أعلى جودة تعليمية وتكاليف ميسرة (مدرسة المهارات النموذجية)',
    calcDeptSelect: 'اختر القسم:',
    calcClassSelect: 'اختر الصف أو المستوى:',
    calcDiscountSelect: 'خيارات الخصم المتاحة (انقر للتفعيل):',
    calcEarly25: 'خصم ٢٥٪ للتسجيل المبكر / أول ٥ طلاب',
    calcFirst10: 'خصم خاص ١٠٪ للقبول',
    calcExtra5: 'خصم إضافي ٥٪ عند السداد الفوري دفعة واحدة',
    calcAccommodationSelect: 'اختر نظام الإقامة:',
    calcNonRes: 'خارجي (بدون إقامة)',
    calcRes: 'داخلي (إقامة كاملة مع الوجبات)',
    calcDayCare: 'رعاية نهارية',
    calcResultTitle: 'البيان النهائي لتكاليف القبول والرسوم الشهرية',
    calcOriginalAdmission: 'رسوم القبول المقررة:',
    calcMonthlyTuition: 'القسط الشهري والتعليمي:',
    calcTotalDiscount: 'إجمالي مبلغ الخصم:',
    calcNetAdmission: 'رسوم القبول الصافية (بعد الخصم):',
    calcTotalFirstMonth: 'إجمالي المبلغ المستحق عند القبول:',
    calcDownloadA4Pdf: 'تحميل كشف الحساب الرسمي (A4 PDF)',
    calcDownloadA4Png: 'تحميل كصورة عالية الدقة (A4 PNG)',

    // About & Specialties
    aboutTitle: 'مميزاتنا الـ ١٧ ورؤيتنا (ABOUT US)',
    aboutSubtitle:
      'الركائز التربوية التي تجعل مدرسة المهارات النموذجية (EIIN: 140630) الخيار الأمثل لأبنائكم',
    aboutVision: 'رؤيتنا',
    aboutMission: 'رسالتنا',

    // Notices
    noticesTitle: 'لوحة الإعلانات الرسمية',
    noticesSubtitle:
      'متابعة أحدث الإعلانات الرسمية ومعرض العلوم وجداول الامتحانات والعطلات المدرسية',
    noticesSearch: 'البحث في الإعلانات...',
    noticesAll: 'الكل',
    noticesViewPdf: 'عرض وتحميل الإعلان الرسمي (PDF)',

    // Contact
    contactTitle: 'تواصل معنا واستفسر عن الحرم',
    contactSubtitle: 'تحدث مباشرة مع مستشاري القبول في أوتارا قطاع ١٢ أو أرسل استفسارك وسنرد عليك فوراً',
    contactPhone: 'هاتف القبول والتسجيل:',
    contactEmail: 'البريد الإلكتروني الرسمي:',
    contactAddress: 'عنوان الحرم:',
    contactOfficeHours: 'ساعات العمل:',
    inquiryFormTitle: 'إرسال استفسار فوري عن القبول',
    inquiryFormSubtitle:
      'سيتم تسجيل استفسارك مباشرة في نظام الإدارة مع إشعار فوري عبر البريد الإلكتروني',
    inquiryFormSendBtn: 'إرسال الرسالة والاستفسار',

    // Footer
    footerAbout:
      'مدرسة المهارات النموذجية (EIIN: 140630 | Code: 21023) — صرح تعليمي رائد يجمع بين القرآن الكريم والعلوم الحديثة لبناء مستقبل مشرق لأبنائكم.',
    footerQuickLinks: 'روابط هامة',
    footerReferenceDocs: 'الدليل التعريفي والوثائق الرسمية',
    footerContact: 'معلومات الاتصال (أوتارا قطاع ١٢)',
    footerRights: 'جميع الحقوق محفوظة. مدرسة المهارات النموذجية (Maharat Model Madrasah).',
  },
};
