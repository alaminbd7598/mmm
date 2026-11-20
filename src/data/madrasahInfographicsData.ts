import {
  AdmissionExtraConfig,
  CMSState,
  DayCareRoutineConfig,
  EducationMethodConfig,
  GuardianComplaintItem,
  MadrasahContextConfig,
  TenYearPlanConfig,
  TransportAndLandmarkConfig,
  UniformGuideConfig,
} from '../types/cms';
import {
  DEFAULT_BOYS_CAMPUS_EMBED_URL,
  DEFAULT_BOYS_CAMPUS_MAP_URL,
  DEFAULT_GIRLS_CAMPUS_EMBED_URL,
  DEFAULT_GIRLS_CAMPUS_MAP_URL,
} from '../utils/careerAndMapsLogic';

export const DEFAULT_EDUCATION_METHOD_CONFIG: EducationMethodConfig = {
  enabled: true,
  sectionTitleBn: 'শিক্ষা পদ্ধতি',
  ratioLeftBn: '৫০',
  ratioRightBn: '৫০',
  islamicTitleBn: 'ইসলামি শিক্ষা',
  islamicSubjectsBn: 'কুরআন, আরবি, আকিদাহ, ফিকহ, হাদিস, সীরাহ',
  generalTitleBn: 'সাধারণ শিক্ষা',
  generalSubjectsBn: 'বাংলা মিডিয়াম NCTB, দাখিল পর্যন্ত',
  descriptionBn:
    'এটি এমন একটি শিক্ষাব্যবস্থা, যেখানে মাদরাসার কারিকুলাম, সিলেবাস ও রুটিনে ইসলামি শিক্ষা ও সাধারণ শিক্ষাকে সমান গুরুত্ব দেওয়া হয়।',
  balanceCardTitleBn: 'স্তরভেদে বিষয়ের ভারসাম্য',
  stages: [
    {
      id: 'stage-pre-hifz',
      stageNameBn: 'প্রি-হিফজ',
      classRangeBn: 'নার্সারি থেকে প্রথম',
      timingBn: 'সকাল ৯:০০ থেকে দুপুর ১:০০',
      quranPercent: 25,
      arabicPercent: 25,
      generalPercent: 50,
      noteBn: 'কায়দা, আম্মাপারা ও নাজেরার পাশাপাশি বাংলা, ইংরেজি ও গণিতের মৌলিক ভিত্তি।',
    },
    {
      id: 'stage-hifz',
      stageNameBn: 'হিফজ',
      classRangeBn: 'দ্বিতীয় থেকে পঞ্চম',
      timingBn: 'সকাল ৭:০০ থেকে রাত ৮:৩০',
      quranPercent: 60,
      arabicPercent: 15,
      generalPercent: 25,
      noteBn: 'পূর্ণাঙ্গ কুরআন হিফজ ও শুনানির পাশাপাশি প্রতিদিন আড়াই ঘণ্টা আরবি ও জেনারেল ক্লাস।',
    },
    {
      id: 'stage-after-hifz',
      stageNameBn: 'আফটার হিফজ',
      classRangeBn: 'ষষ্ঠ থেকে দশম (দাখিল)',
      timingBn: 'সকাল ৮:০০ থেকে দুপুর ১:০০',
      quranPercent: 15,
      arabicPercent: 35,
      generalPercent: 50,
      noteBn: 'হিফজ তিলাওয়াত সংরক্ষণ, আরবি ভাষায় উচ্চতর ইসলাম শিক্ষা এবং বোর্ড কারিকুলামের পূর্ণাঙ্গ প্রস্তুতি।',
    },
  ],
};

export const DEFAULT_TEN_YEAR_PLAN_CONFIG: TenYearPlanConfig = {
  enabled: true,
  headingBn: 'নার্সারি থেকে একাদশ, তিন স্তরে',
  subheadingBn:
    'আমাদের প্রধান উদ্দেশ্য হলো মাধ্যমিক পর্যায়ে একজন শিক্ষার্থীর এমন একটি শক্ত ভিত্তি গড়ে দেওয়া, যাতে সে ভবিষ্যতে মাদরাসা কিংবা কলেজ, উভয় ক্ষেত্রেই সফল হওয়ার পূর্ণ প্রস্তুতি অর্জন করতে পারে।',
  cardTitleBn: '১০ বছরের পাঠ পরিকল্পনা',
  cardSubtitleBn: '১ম শ্রেণি থেকে দাখিল, পূর্ণ বা আংশিক হিফজসহ। সাথে নার্সারি, কেজি ও একাদশ।',
  stageBanners: [
    {
      id: 'banner-pre-hifz',
      titleBn: 'প্রি-হিফজ',
      timingBn: 'সকাল ৯:০০ থেকে দুপুর ১:০০',
      colSpan: 3,
    },
    {
      id: 'banner-hifz',
      titleBn: 'হিফজ',
      timingBn: 'সকাল ৭:০০ থেকে রাত ৮:৩০',
      colSpan: 4,
    },
    {
      id: 'banner-after-hifz',
      titleBn: 'আফটার হিফজ',
      timingBn: 'সকাল ৮:০০ থেকে দুপুর ১:০০',
      colSpan: 6,
    },
  ],
  classColumns: [
    { id: 'col-nursery', classNameBn: 'নার্সারি', ageLabelBn: '৫+ বছর' },
    { id: 'col-kg', classNameBn: 'কেজি', ageLabelBn: '৬+' },
    { id: 'col-1', classNameBn: '১ম', ageLabelBn: '৭+' },
    { id: 'col-2', classNameBn: '২য়', ageLabelBn: '৮+' },
    { id: 'col-3', classNameBn: '৩য়', ageLabelBn: '৯+' },
    { id: 'col-4', classNameBn: '৪র্থ', ageLabelBn: '১০+' },
    { id: 'col-5', classNameBn: '৫ম', ageLabelBn: '১১+' },
    { id: 'col-6', classNameBn: '৬ষ্ঠ', ageLabelBn: '১২+' },
    { id: 'col-7', classNameBn: '৭ম', ageLabelBn: '১৩+' },
    { id: 'col-8', classNameBn: '৮ম', ageLabelBn: '১৪+' },
    { id: 'col-9', classNameBn: '৯ম', ageLabelBn: '১৫+' },
    { id: 'col-10', classNameBn: '১০ম', ageLabelBn: '১৬+' },
    { id: 'col-11', classNameBn: 'একাদশ', ageLabelBn: '১৭+' },
  ],
  tracks: [
    {
      id: 'track-quran',
      trackNameBn: 'কুরআন',
      dotColor: '#3b0764',
      bgColor: '#3b0764',
      textColor: '#FFFFFF',
      borderStyle: 'solid',
      blocks: [
        { id: 'qb-1', labelBn: 'কায়দা', colSpan: 1 },
        { id: 'qb-2', labelBn: 'আম্মাপারা', colSpan: 1 },
        { id: 'qb-3', labelBn: 'নাজেরা', colSpan: 1 },
        { id: 'qb-4', labelBn: 'হিফজ ১', colSpan: 1 },
        { id: 'qb-5', labelBn: 'হিফজ ২', colSpan: 1 },
        { id: 'qb-6', labelBn: 'হিফজ ৩', colSpan: 1 },
        { id: 'qb-7', labelBn: 'শুনানি', colSpan: 1 },
        { id: 'qb-8', labelBn: 'তিলাওয়াত ও ইয়াদ সংরক্ষণ', colSpan: 3 },
      ],
    },
    {
      id: 'track-arabic',
      trackNameBn: 'আরবি',
      dotColor: '#9333ea',
      bgColor: '#7e22ce',
      textColor: '#FFFFFF',
      borderStyle: 'solid',
      blocks: [
        { id: 'ab-1', labelBn: 'আরবি ভাষা (কথোপকথন, নাহু, সরফ ও সাহিত্য)', colSpan: 10 },
      ],
    },
    {
      id: 'track-islam',
      trackNameBn: 'ইসলাম',
      dotColor: '#f59e0b',
      bgColor: '#fef3c7',
      textColor: '#3b0764',
      borderStyle: 'solid',
      blocks: [
        { id: 'ib-1', labelBn: 'ইসলাম শিক্ষা', colSpan: 7 },
        { id: 'ib-2', labelBn: 'ইসলাম শিক্ষা, আরবিতে', colSpan: 3 },
      ],
    },
    {
      id: 'track-general',
      trackNameBn: 'সাধারণ',
      dotColor: '#4c0575',
      bgColor: '#faf5ff',
      textColor: '#2e0249',
      borderStyle: 'outline',
      blocks: [
        { id: 'gb-1', labelBn: 'বাংলা, ইংরেজি, গণিত', colSpan: 6 },
        { id: 'gb-2', labelBn: '+ বিজ্ঞান', colSpan: 1 },
        { id: 'gb-3', labelBn: '+ বিজিএস', colSpan: 3 },
      ],
    },
  ],
  dakhilTitleBn: 'দাখিল',
  dakhilSubtitleBn: 'বোর্ডের সিলেবাস',
  mutawassitahTitleBn: 'মুতাওয়াসসিতা',
  mutawassitahSubtitleBn: 'দাখিলের পর এক বছর',
  postDakhilOptionsBn: ['মুতাওয়াসসিতা', 'কলেজ'],
  footerNoteBn:
    'নার্সারি থেকে ৮ম শ্রেণি পর্যন্ত আরবি ও ইসলামি শিক্ষার বই আল কুরআনের ভাষা ইনস্টিটিউট (AQVI) ও সমন্বিত কারিকুলাম প্রণীত। ৬ষ্ঠ শ্রেণি থেকে ইসলাম শিক্ষা আরবি ভাষায়।',
  syllabusLinkTextBn: 'শ্রেণিভিত্তিক পূর্ণ পাঠ পরিকল্পনা',
};

export const DEFAULT_DAY_CARE_ROUTINE_CONFIG: DayCareRoutineConfig = {
  enabled: true,
  headingBn: 'হিফজ ডে-কেয়ারের একটি দিন',
  subheadingBn:
    'সকাল ৭টা থেকে রাত ৮:৩০, খাবারসহ পূর্ণ দিনের তত্ত্বাবধানে। কুরআনের পাশাপাশি প্রতিদিন আরবি, ইসলাম ও সাধারণ ক্লাস, দুপুরে বিশ্রাম, আর আসরের পর খেলা।',
  periods: [
    {
      id: 'period-morning',
      periodNameBn: 'সকাল',
      iconType: 'morning',
      items: [
        {
          id: 'rt-m1',
          timeBn: '৭:০০',
          titleBn: 'সবক ও সাত সবক',
          subtitleBn: 'সবক: নতুন পড়া। সাত সবক: গত কয়েক দিনের পড়া।',
          iconType: 'book',
        },
        {
          id: 'rt-m2',
          timeBn: '৮:৩০',
          titleBn: 'নাশতা',
          subtitleBn: 'স্বাস্থ্যসম্মত সকালের খাবার।',
          iconType: 'food',
        },
        {
          id: 'rt-m3',
          timeBn: '৯:০০',
          titleBn: 'সাত সবক, আমুখতার প্রস্তুতি ও মাশক',
          subtitleBn: 'আমুখতা: পুরোনো পড়ার পুনরাবৃত্তি।',
          iconType: 'book',
        },
      ],
    },
    {
      id: 'period-noon',
      periodNameBn: 'দুপুর',
      iconType: 'noon',
      items: [
        {
          id: 'rt-n1',
          timeBn: '১০:০০',
          titleBn: 'আরবি, ইসলাম ও সাধারণ ক্লাস',
          subtitleBn: 'প্রতিদিন আড়াই ঘণ্টা',
          iconType: 'class',
        },
        {
          id: 'rt-n2',
          timeBn: '১২:৩০',
          titleBn: 'সালাত, গোসল, দুপুরের খাবার ও ঘুম',
          subtitleBn: 'পৌনে ৩টা পর্যন্ত',
          iconType: 'bed',
        },
      ],
    },
    {
      id: 'period-afternoon',
      periodNameBn: 'বিকাল',
      iconType: 'afternoon',
      items: [
        {
          id: 'rt-a1',
          timeBn: '৩:০০',
          titleBn: 'আমুখতা, তিলাওয়াত ও নতুন সবকের নাজেরা',
          subtitleBn: 'আসর পর্যন্ত',
          iconType: 'book',
        },
        {
          id: 'rt-a2',
          timeBn: 'আসরের পর',
          titleBn: 'খেলা',
          subtitleBn: 'শারীরিক কসরত ও বিনোদন',
          iconType: 'play',
        },
      ],
    },
    {
      id: 'period-night',
      periodNameBn: 'সন্ধ্যা ও রাত',
      iconType: 'night',
      items: [
        {
          id: 'rt-e1',
          timeBn: 'সন্ধ্যা',
          titleBn: 'আজকার ও মাগরিবের সালাত',
          subtitleBn: 'মাসনুন দোয়া ও যিকির',
          iconType: 'prayer',
        },
        {
          id: 'rt-e2',
          timeBn: 'মাগরিবের পর',
          titleBn: 'নতুন সবক মুখস্থ',
          subtitleBn: 'উস্তাদের তত্ত্বাবধানে আগামীকালের সবক প্রস্তুতি',
          iconType: 'book',
        },
        {
          id: 'rt-e3',
          timeBn: '৮:২০',
          titleBn: 'ইশার সালাত',
          subtitleBn: 'জামাতের সাথে সালাত আদায়',
          iconType: 'prayer',
        },
        {
          id: 'rt-e4',
          timeBn: '৮:৩০',
          titleBn: 'ছুটি',
          subtitleBn: 'অভিভাবকের সাথে বাসায় ফেরা',
          iconType: 'home',
        },
      ],
    },
  ],
  seasonalNoteBn:
    'সকালের সময় সারা বছর একই। বিকাল ও সন্ধ্যার পড়া সালাতের ওয়াক্ত ধরে চলে, তাই শীতে বিকালের কিছু পড়া সন্ধ্যায় হয়। ছুটি সবসময় রাত ৮:৩০-এ।',
  durationHeadingBn: 'ধাপভেদে মাদরাসার সময়',
  durationBars: [
    {
      id: 'dur-pre-hifz',
      stageNameBn: 'প্রি-হিফজ',
      timingLabelBn: 'সকাল ৯:০০ থেকে দুপুর ১:০০',
      startPercent: 15,
      widthPercent: 30,
      isFullDay: false,
    },
    {
      id: 'dur-hifz',
      stageNameBn: 'হিফজ',
      timingLabelBn: 'সকাল ৭:০০ থেকে রাত ৮:৩০',
      startPercent: 0,
      widthPercent: 100,
      isFullDay: true,
    },
    {
      id: 'dur-after-hifz',
      stageNameBn: 'আফটার হিফজ',
      timingLabelBn: 'সকাল ৮:০০ থেকে দুপুর ১:০০',
      startPercent: 7,
      widthPercent: 38,
      isFullDay: false,
    },
  ],
  timelineLabelsBn: ['সকাল ৭টা', 'দুপুর ১টা', 'রাত ৮:৩০'],
};

export const DEFAULT_TRANSPORT_CONFIG: TransportAndLandmarkConfig = {
  enabled: true,
  headingBn: 'নিজস্ব পরিবহন',
  subheadingBn: 'অভিজ্ঞ চালক ও দায়িত্বশীল সহকারীর মাধ্যমে পরিচালিত।',
  vehicleImageUrl: '/assets/maharat/transport-van.png',
  vehicleCaptionBn: 'মাদরাসার নিজস্ব গাড়ি।',
  perKmRate: 600,
  routes: [
    {
      id: 'route-uttara-micro-1',
      routeNameBn: 'উত্তরা মাইক্রো ১',
      vehicleTypeBn: 'মাইক্রো',
      monthlyFee: 5000,
      distanceKm: 7.5,
      stopsBn: ['হাউস বিল্ডিং', 'সেক্টর ৭', 'সেক্টর ১১', 'সেক্টর ১৩', 'খালপাড়'],
      destinationBn: 'মাহারাত / মাদরাসা ক্যাম্পাস',
    },
    {
      id: 'route-uttara-micro-2',
      routeNameBn: 'উত্তরা মাইক্রো ২',
      vehicleTypeBn: 'মাইক্রো',
      monthlyFee: 5000,
      distanceKm: 6.8,
      stopsBn: ['জসীমউদ্দীন রোড', 'সেক্টর ১৪', 'সেক্টর ১২', 'সেক্টর ১৫'],
      destinationBn: 'মাহারাত / মাদরাসা ক্যাম্পাস',
    },
    {
      id: 'route-uttara-auto',
      routeNameBn: 'উত্তরা অটো',
      vehicleTypeBn: 'অটো',
      monthlyFee: 2500,
      distanceKm: 2.5,
      stopsBn: ['সেক্টর ১৮'],
      destinationBn: 'মাহারাত / মাদরাসা ক্যাম্পাস',
    },
    {
      id: 'route-mirpur-micro',
      routeNameBn: 'মিরপুর মাইক্রো',
      vehicleTypeBn: 'মাইক্রো',
      monthlyFee: 5000,
      distanceKm: 9.2,
      stopsBn: [
        'মিরপুর ১০',
        'মিরপুর ১৩',
        'মিরপুর ১১',
        'কালশী',
        'শাগুফতা',
        'মিরপুর ডিওএইচএস',
      ],
      destinationBn: 'মাহারাত / মাদরাসা ক্যাম্পাস',
    },
    {
      id: 'route-mirpur-auto',
      routeNameBn: 'মিরপুর অটো',
      vehicleTypeBn: 'অটো',
      monthlyFee: 2500,
      distanceKm: 4.5,
      stopsBn: ['রূপনগর আবাসিক এলাকা', 'পল্লবী', 'মিরপুর সাড়ে ১১', 'মিরপুর ১২ (বি/সি ব্লক)'],
      destinationBn: 'মাহারাত / মাদরাসা ক্যাম্পাস',
    },
  ],
  landmarkHeadingBn: 'মেট্রোরেল ও প্রধান ল্যান্ডমার্ক থেকে ক্যাম্পাসের দূরত্ব',
  primaryLandmarkBannerBn: 'উত্তরা সেন্টার মেট্রো স্টেশন থেকে ৬০০ মিটার পূর্বে (সেক্টর ১২ সংলগ্ন)',
  landmarks: [
    {
      id: 'lm-1',
      landmarkNameBn: 'উত্তরা সেন্টার মেট্রোরেল স্টেশন',
      distanceTextBn: '৬০০ মিটার',
      distanceMeters: 600,
      directionBn: 'পূর্বে (হাঁটা পথ ৬ মিনিট)',
    },
    {
      id: 'lm-2',
      landmarkNameBn: 'উত্তরা সেক্টর ১২ (খালপাড় / রবীন্দ্র সরণি)',
      distanceTextBn: '৪০০ মিটার',
      distanceMeters: 400,
      directionBn: 'মূল ক্যাম্পাস সংলগ্ন',
    },
    {
      id: 'lm-3',
      landmarkNameBn: 'উত্তরা দক্ষিণ মেট্রোরেল স্টেশন',
      distanceTextBn: '২.৮ কিমি',
      distanceMeters: 2800,
      directionBn: 'রিসেপশন রুট',
    },
    {
      id: 'lm-4',
      landmarkNameBn: 'মিরপুর ডিওএইচএস (Mirpur DOHS)',
      distanceTextBn: '২.৫ কিমি',
      distanceMeters: 2500,
      directionBn: 'সংযোগ সড়ক হয়ে ১০ মিনিট',
    },
    {
      id: 'lm-5',
      landmarkNameBn: 'হাউস বিল্ডিং / আজমপুর বাস স্ট্যান্ড',
      distanceTextBn: '৩.২ কিমি',
      distanceMeters: 3200,
      directionBn: 'উত্তরা মাইক্রো রুট ১',
    },
  ],
};

export const DEFAULT_ADMISSION_EXTRA_CONFIG: AdmissionExtraConfig = {
  enabled: true,
  comparisonHeadingBn: 'নন-ডে-কেয়ার বনাম হিফজ ডে-কেয়ার ফি তুলনা',
  comparisonSubtitleBn:
    'সকাল থেকে দুপুর ১টা পর্যন্ত নিয়মিত ক্লাস এবং সকাল ৭টা থেকে রাত ৮:৩০ পর্যন্ত পূর্ণাঙ্গ ডে-কেয়ার ব্যবস্থার খরচের তুলনামূলক বিবরণী।',
  feeComparisonRows: [
    {
      id: 'fc-row-1',
      labelBn: 'মাসিক টিউশন ফি (পাঠদান ও তত্ত্বাবধান)',
      nonDayCareValueBn: '৳ ৬,০০০/-',
      dayCareValueBn: '৳ ১০,০০০/-',
    },
    {
      id: 'fc-row-2',
      labelBn: 'মাসিক খাবার ফি (সকালের নাশতা, দুপুরের খাবার ও বিকালের নাস্তা)',
      nonDayCareValueBn: 'প্রযোজ্য নয়',
      dayCareValueBn: '৳ ৪,৫০০/-',
    },
    {
      id: 'fc-row-3',
      labelBn: 'এককালীন ভর্তি ফি (Admission Fee)',
      nonDayCareValueBn: '৳ ২০,০০০/-',
      dayCareValueBn: '৳ ২৫,০০০/-',
    },
    {
      id: 'fc-row-4',
      labelBn: 'বার্ষিক সেশন ও শিক্ষা উপকরণ ফি (Annual Session Fee)',
      nonDayCareValueBn: '৳ ১৫,০০০/-',
      dayCareValueBn: '৳ ২০,০০০/-',
    },
    {
      id: 'fc-row-5',
      labelBn: 'মাদ্রাসায় অবস্থানকাল (Daily Campus Timing)',
      nonDayCareValueBn: 'সকাল ৮:০০/৯:০০ — দুপুর ১:০০',
      dayCareValueBn: 'সকাল ৭:০০ — রাত ৮:৩০',
    },
  ],
  siblingDiscountTitleBn: 'সহোদর / ভাইবোন ছাড় (Sibling Discount Policy)',
  siblingDiscountDescriptionBn:
    'একই পরিবারের একাধিক সন্তান অধ্যয়ন করলে ২য় ও পরবর্তী সন্তানের ভর্তি ফিতে ২৫% এবং মাসিক টিউশন বেতনে ১০% বিশেষ সহোদর ছাড় প্রদান করা হয়।',
  siblingAdmissionDiscountPercent: 25,
  siblingTuitionDiscountPercent: 10,
  ageChartHeadingBn: 'শ্রেণিভিত্তিক ভর্তির বয়সসীমা (Age Eligibility)',
  ageEligibilityList: [
    { id: 'age-play', classNameBn: 'প্লে (Play Group)', minAgeBn: '৪+ বছর', stageBn: 'প্রি-হিফজ ফাউন্ডেশন' },
    { id: 'age-nursery', classNameBn: 'নার্সারি (Nursery)', minAgeBn: '৫+ বছর', stageBn: 'প্রি-হিফজ (কায়দা)' },
    { id: 'age-kg', classNameBn: 'কেজি (KG)', minAgeBn: '৬+ বছর', stageBn: 'প্রি-হিফজ (আম্মাপারা)' },
    { id: 'age-1', classNameBn: '১ম শ্রেণি (Class 1)', minAgeBn: '৭+ বছর', stageBn: 'প্রি-হিফজ (নাজেরা)' },
    { id: 'age-2-5', classNameBn: '২য় থেকে ৫ম শ্রেণি', minAgeBn: '৮+ থেকে ১১+ বছর', stageBn: 'হিফজ ও শুনানি স্তর' },
    { id: 'age-6-10', classNameBn: '৬ষ্ঠ থেকে ১০ম (দাখিল)', minAgeBn: '১২+ থেকে ১৬+ বছর', stageBn: 'আফটার হিফজ স্তর' },
  ],
  documentsHeadingBn: 'ভর্তির জন্য প্রয়োজনীয় কাগজপত্র (Required Documents)',
  requiredDocumentsBn: [
    'শিক্ষার্থীর জন্ম নিবন্ধন সনদের ফটোকপি (Online Birth Certificate)।',
    'শিক্ষার্থীর পাসপোর্ট সাইজের ৪ কপি রঙিন ছবি।',
    'পিতা ও মাতার জাতীয় পরিচয়পত্রের (NID) ফটোকপি।',
    'পিতা ও মাতার পাসপোর্ট সাইজের ২ কপি করে ছবি।',
    'পূর্ববর্তী প্রতিষ্ঠানের ছাড়পত্র / মার্কশিট (২য় শ্রেণি থেকে তদূর্ধ্ব শ্রেণির জন্য)।',
  ],
};

export const DEFAULT_UNIFORM_CONFIG: UniformGuideConfig = {
  enabled: true,
  headingBn: 'মাদ্রাসা ইউনিফর্ম ও ড্রেস কোড (Madrasah Uniform)',
  subheadingBn:
    'সুন্নাহসম্মত, শালীন ও পরিচ্ছন্ন পোশাক পরিধান আমাদের তারবিয়াহ ও আদব শিক্ষার অন্যতম অংশ।',
  boysTitleBn: 'বালক শিক্ষার্থীদের পোশাক (Boys Uniform)',
  boysItemsBn: [
    'নির্ধারিত রঙের সুন্নতি পাঞ্জাবি বা জুব্বা (হাঁটুর নিচে পর্যন্ত লম্বা)।',
    'সাদা ঢোলা পায়জামা (টাখনুর ওপরে)।',
    'সাদা পাঁচকলি বা গোল সুন্নতি টুপি।',
    'শীতকালে মাদ্রাসা নির্ধারিত নেভি-ব্লু সোয়েটার বা ব্লেজার এবং কালো জুতা ও সাদা মোজা।',
  ],
  girlsTitleBn: 'বালিকা শিক্ষার্থীদের পোশাক (Girls Uniform)',
  girlsItemsBn: [
    'নির্ধারিত রঙের ঢিলেঢালা ম্যাক্সি/গাউন ও সাদা সালোয়ার।',
    'পূর্ণাঙ্গ হিজাব বা স্কার্ফ (বয়সভেদে নিকাব ও আবায়া)।',
    'শীতকালে মাদ্রাসা নির্ধারিত কার্ডিগান বা সোয়েটার এবং কালো কাপড়ের জুতা ও মোজা।',
  ],
  noteBn:
    'বিশেষ দ্রষ্টব্য: ভর্তির পর মাদ্রাসার নির্দিষ্ট টেইলার্স বা স্টোর থেকে কাপড়ের নমুনা ও মাপ অনুযায়ী ইউনিফর্ম সংগ্রহ করা যাবে।',
  uniformImageUrl: '/assets/maharat/maharat-uniform.png',
};

export const DEFAULT_MADRASAH_CONTEXT_CONFIG: MadrasahContextConfig = {
  enabled: true,
  activePresetId: 'maharat',
  badgeBn: 'মাদ্রাসা প্রতিষ্ঠার প্রেক্ষাপট ও লক্ষ্য (Maharat Model Madrasah)',
  headingBn: 'মাদ্রাসা প্রতিষ্ঠার প্রেক্ষাপট ও আমাদের আদর্শিক অঙ্গীকার',
  paragraphsBn: [
    'আদর্শ ও পরিকল্পিত শিক্ষার মাধ্যমেই একজন মানুষ সত্যিকারের মানুষে পরিণত হয়। বাংলাদেশের ত্রিমুখী শিক্ষাধারার (জেনারেল, মাদ্রাসা ও কারিগরি) মধ্যে আলিয়া মাদ্রাসার শিক্ষাধারা একটি ভারসাম্যপূর্ণ ও অনন্য শিক্ষাধারা। এতে একদিকে বৈষয়িক দক্ষতা অর্জনের জন্য বাংলা, আরবি, গণিত, ইংরেজি, বিজ্ঞান ও আইসিটির মতো গুরুত্বপূর্ণ বিষয়সমূহ যেমন রয়েছে, তেমনি সৎ, চরিত্রবান, বিনয়ী ও যোগ্য আলেম তৈরির জন্য রয়েছে কুরআন, হাদিস, আকাইদ ও ফিকহের মতো গুরুত্বপূর্ণ বিষয়ের সমাহার।',
    'অ্যাডভান্সড এডুকেশন অ্যান্ড রিসার্চ ফাউন্ডেশনের উদ্যোগে প্রতিষ্ঠিত মাহারাত মডেল মাদ্রাসা (EIIN: 140630 | কোড: ২১০২৩) জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (NCTB) এবং বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ডের সিলেবাসের আলোকে বাংলা, ইংরেজি ও আরবি ভার্সনে পরিচালিত আলিয়া ধারার একটি আধুনিক দ্বীনি শিক্ষা প্রতিষ্ঠান। আমরা এমন প্রজন্ম গড়ছি যারা একদিকে যোগ্য আলেম, মুফতি, মুহাদ্দিস ও ইমাম হতে পারবে, অন্যদিকে ডাক্তার, প্রকৌশলী, বিচারক ও দক্ষ প্রশাসক হিসেবে দেশ ও জাতির কল্যাণে নেতৃত্ব দেবে।',
  ],
  missionTitleBn: 'আমাদের লক্ষ্য ও উদ্দেশ্য (Our Mission)',
  missionPointsBn: [
    'বিশুদ্ধ তাজবীদ ও তারতীলসহ পবিত্র কুরআন তিলাওয়াত ও ক্লাসভিত্তিক হিফজ সম্পন্ন করানো।',
    'মাতৃভাষা বাংলার পাশাপাশি আন্তর্জাতিক ভাষা আরবি ও ইংরেজিতে সাবলীল দক্ষতা অর্জন।',
    'কোমলমতি শিশুদের জন্য মায়ের যত্নে মহিলা শিক্ষক দ্বারা পরিচালিত প্রি-প্লে, প্লে ও নার্সারি ক্লাস।',
    'ডিজিটাল কনটেন্ট ও স্মার্ট ক্লাসরুমের মাধ্যমে আনন্দময় শিক্ষাদান ও আমলি তারবিয়াহ নিশ্চিত করা।',
  ],
  visionTitleBn: 'আমাদের ভবিষ্যৎ রূপকল্প (Our Vision)',
  visionPointsBn: [
    'মাধ্যমিক (দাখিল) পর্যায়ে এমন মজবুত ভিত্তি তৈরি করা যাতে শিক্ষার্থী উচ্চশিক্ষায় দেশ-বিদেশের শীর্ষ বিশ্ববিদ্যালয় ও মাদ্রাসায় সাফল্য অর্জন করতে পারে।',
    'প্রাইভেট টিউটর ছাড়াই ক্লাসের পড়া ক্লাসেই সম্পন্ন করার আধুনিক ও যোগ্যতাভিত্তিক শিক্ষাপদ্ধতি।',
    'উত্তরা ও ঢাকা অঞ্চলের অভিভাবকদের জন্য সবচেয়ে নির্ভরযোগ্য, নিরাপদ ও আদর্শ দ্বীনি শিক্ষাপ্রতিষ্ঠান হিসেবে নিজেদের প্রতিষ্ঠিত করা।',
  ],
  approachTitleBn: 'আমাদের বিশেষ শিক্ষণ কৌশল (Our Approach)',
  approachSummaryBn:
    'অভিজ্ঞ হাফেজ, আলেম ও বিশ্ববিদ্যালয় গ্র্যাজুয়েট শিক্ষকদের সমন্বয়ে গঠিত ফ্যাকাল্টি; প্রজেক্টর, স্মার্ট টিভি ও স্মার্ট বোর্ড সমৃদ্ধ আইসিটি ক্লাসরুম; ড্রীম ডায়েরির মাধ্যমে নিয়মিত মোটিভেশন; ১ম শ্রেণি থেকেই হাদিস মুখস্থ ও বাস্তব আমল এবং দুর্বল শিক্ষার্থীদের জন্য স্পেশাল কেয়ার।',
  approachImageUrl: '/assets/maharat/maharat-approach.png',
  chairmanNameBn: 'ড. মো. নূরুল্লাহ — চেয়ারম্যান, পরিচালনা কমিটি, মাহারাত মডেল মাদ্রাসা',
  chairmanMessageBn:
    'বিসমিল্লাহির রাহমানির রাহীম। শিক্ষা মানুষের শ্রেষ্ঠ সম্পদ, যা তাকে স্রষ্টার পরিচয় লাভ এবং সৃষ্টির সেবায় নিয়োজিত হতে শেখায়। অ্যাডভান্সড এডুকেশন অ্যান্ড রিসার্চ ফাউন্ডেশনের উদ্যোগে প্রতিষ্ঠিত মাহারাত মডেল মাদ্রাসায় আমরা কুরআন ও সুন্নাহর শাশ্বত আলোর সাথে আধুনিক জ্ঞান-বিজ্ঞান ও তথ্যপ্রযুক্তির সার্থক সমন্বয় ঘটিয়েছি। আমাদের লক্ষ্য—নতুন প্রজন্মকে ঈমানদার, চরিত্রবান ও যুগোপযোগী দক্ষ নাগরিক হিসেবে গড়ে তোলা।',
  chairmanImageUrl: '/assets/maharat/chairman-dr-nurullah.jpg',
  principalNameBn: 'মুনকাদির সাদী আল-মাদানী — অধ্যক্ষ (ভারপ্রাপ্ত), মাহারাত মডেল মাদ্রাসা',
  principalMessageBn:
    'আস্সালামু আলাইকুম ওয়া রাহমাতুল্লাহ। আদর্শ ও পরিকল্পিত শিক্ষার মাধ্যমেই একজন মানুষ সত্যিকারের মানুষে পরিণত হয়। বাংলাদেশের ত্রিমুখী শিক্ষাধারার মধ্যে আলিয়া মাদ্রাসার শিক্ষাধারা একটি ভারসাম্যপূর্ণ শিক্ষাধারা। এতে একদিকে বৈষয়িক দক্ষতা অর্জনের জন্য বাংলা, আরবি, গণিত, ইংরেজি, বিজ্ঞান ও আইসিটির মতো গুরুত্বপূর্ণ বিষয়সমূহ যেমন রয়েছে, তেমনি সৎ, চরিত্রবান, বিনয়ী ও যোগ্য আলেম তৈরির জন্য রয়েছে কুরআন, হাদিস, আকাইদ ও ফিকহের মতো গুরুত্বপূর্ণ বিষয়ের সমাহার। মাহারাত মডেল মাদ্রাসা জাতীয় শিক্ষাক্রম ও পাঠ্যপুস্তক বোর্ড (এনসিটিবি) এবং বাংলাদেশ মাদ্রাসা শিক্ষা বোর্ডের সিলেবাসের আলোকে বাংলা, ইংরেজি ও আরবি ভার্সনে পরিচালিত আলিয়া ধারার একটি আধুনিক দ্বীনি শিক্ষা প্রতিষ্ঠান। এখানে থাকছে কোমলমতি শিশুদের জন্য মায়ের যত্নে মহিলা শিক্ষক দ্বারা পরিচালিত প্লে ও নার্সারি ক্লাস, মাতৃভাষার পাশাপাশি আন্তর্জাতিক ভাষা আরবি ও ইংরেজির ওপর বিশেষ গুরুত্বারোপ, ডিজিটাল কন্টেন্টের মাধ্যমে শিক্ষাদান ও ক্লাসভিত্তিক হিফজ পরিকল্পনা।',
  principalImageUrl: '/assets/maharat/principal-munkadir-sadi.jpg',
  prospectusUrl: '/assets/maharat/maharat-prospectus-2026.pdf',
};

export const DEFAULT_COMPLAINTS: GuardianComplaintItem[] = [
  {
    id: 'comp-101',
    guardianName: 'মোঃ সাইফুল ইসলাম (অভিভাবক — ৩য় শ্রেণি)',
    studentName: 'আহনাফ ইসলাম',
    studentClass: '৩য় শ্রেণি (হিফজ বিভাগ)',
    phone: '01711-223344',
    category: 'পরামর্শ (Suggestion)',
    message:
      'উত্তরা সেক্টর ১২ এর মাইক্রোবাস রুট ২ এর গাড়িটি সকাল ৬:৪৫ এর পরিবর্তে ৬:৫০ এ সেক্টর ১৪ মোড়ে আসলে শিশুদের জন্য সুবিধা হয়।',
    submittedAt: '2026-10-25 09:15 AM',
    status: 'Reviewed',
    adminReply: 'জাযাকাল্লাহু খাইরান। আপনার পরামর্শটি পরিবহন শাখায় জানানো হয়েছে এবং সময় সমন্বয় করা হচ্ছে।',
  },
];

/**
 * Generates a full CMSState preset configured for the user's primary target project:
 * "মাহারাত মডেল মাদ্রাসা (Maharat Model Madrasah)" — https://maharatmadrasah.com
 */
export function buildMaharatModelMadrasahPreset(currentState: CMSState): CMSState {
  return {
    ...currentState,
    settings: {
      ...currentState.settings,
      instituteName: 'Maharat Model Madrasah',
      instituteNameBn: 'মাহারাত মডেল মাদ্রাসা',
      instituteNameAr: 'مدرسة المهارات النموذجية',
      eiinNumber: '140630',
      madrasahCode: '21023',
      mottoEn: 'A Madrasah with Excellence',
      foundationNameBn: 'অ্যাডভান্সড এডুকেশন অ্যান্ড রিসার্চ ফাউন্ডেশন',
      tagline:
        'একটি আধুনিক মানসম্পন্ন ব্যতিক্রমী দ্বীনি শিক্ষা প্রতিষ্ঠান | মানসম্মত শিক্ষা, দক্ষ জাতি ও উন্নত দেশ । (A Madrasah with Excellence)',
      heroBadge: 'ADMISSION GOING ON — EIIN: 140630 | CODE: 21023',
      heroTitle: 'মানসম্মত শিক্ষা, দক্ষ জাতি ও',
      heroHighlight: 'উন্নত দেশ গড়ার প্রত্যয়..!!',
      heroSubtitle:
        'মাহারাত মডেল মাদ্রাসা (مدرسة المهارات النموذجية) — কুরআন-সুন্নাহর বিশুদ্ধ ইলম এবং আধুনিক জেনারেল শিক্ষার সমন্বয়ে প্রি-প্লে ও প্লে থেকে নবম/দাখিল (আরবি ও ইংলিশ ভার্সন) এবং তাহফিজুল কুরআন বিভাগে (আবাসিক/অনাবাসিক/ডে-কেয়ার) ভর্তি চলছে।',
      phonePrimary: '01886-340308 (ভর্তি ও তথ্য)',
      phoneSecondary: '01901-631641 (অফিসিয়াল)',
      phoneTertiary: '01901-631642 / 01901-631640',
      email: 'maharatmodelmadrasah2022@gmail.com',
      address:
        'প্রধান অফিস ও গার্লস ক্যাম্পাস: বাড়ি-৭, রোড-১৭/এ, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০ | বয়েস ক্যাম্পাস: বাড়ি-১১, রোড-১৯, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০',
      addressEn:
        'Main Office & Girls Campus: House#07, Road#17/A, Sector#12, Uttara, Dhaka-1230 | Boys Campus: House#11, Road#19, Sector#12, Uttara, Dhaka-1230',
      officeHours: 'শনিবার - শুক্রবার: সকাল ৭:৩০ - রাত ৯:০০ (Saturday - Friday: 7:30 AM to 9:00 PM)',
      facebookUrl: 'https://www.facebook.com/maharatmodelmadrasah',
      youtubeUrl: 'https://www.youtube.com/@maharatmodelmadrasa',
      whatsappNumber: '+8801886340308',
      statsStudents: '565+',
      statsCourses: '77 জন শিক্ষক',
      statsCertifications: '2 টি ক্যাম্পাস',
      statsSuccessRate: 'EIIN: 140630',
      logoUrl: '/assets/maharat/01-Branding_Logo-with-EIIN_02.svg',
      prospectusPdfUrl: '/assets/maharat/maharat-prospectus-2026.pdf',
      boysCampusMapUrl: DEFAULT_BOYS_CAMPUS_MAP_URL,
      boysCampusMapEmbedUrl: DEFAULT_BOYS_CAMPUS_EMBED_URL,
      girlsCampusMapUrl: DEFAULT_GIRLS_CAMPUS_MAP_URL,
      girlsCampusMapEmbedUrl: DEFAULT_GIRLS_CAMPUS_EMBED_URL,
    },
    madrasahContextConfig: {
      ...DEFAULT_MADRASAH_CONTEXT_CONFIG,
      activePresetId: 'maharat',
    },
    uniformConfig: {
      ...DEFAULT_UNIFORM_CONFIG,
    },
    transportConfig: {
      ...currentState.transportConfig,
      routes: currentState.transportConfig.routes.map((r) => ({
        ...r,
        destinationBn: 'মাহারাত মডেল মাদ্রাসা (উত্তরা সেক্টর ১২)',
      })),
    },
    aiBotConfig: {
      ...currentState.aiBotConfig,
      welcomeMessage:
        'আসসালামু আলাইকুম! আমি মাহারাত মডেল মাদ্রাসার (Maharat Model Madrasah | EIIN: 140630) এআই সহকারী Noor। আমাদের জেনারেল সেকশন (প্রি-প্লে/প্লে থেকে ৯ম শ্রেণি), তাহফিজ সেকশন (নূরানী, নাজেরা ও হিফজ), ৫০/৫০ কারিকুলাম, ডে-কেয়ার রুটিন, পরিবহন রুট বা ভর্তি ফি সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।',
      customKnowledgeBase:
        'মাহারাত মডেল মাদ্রাসা (Maharat Model Madrasah | مدرسة المهارات النموذجية) — EIIN: 140630, Madrasah Code: 21023। স্লোগান: মানসম্মত শিক্ষা, দক্ষ জাতি ও উন্নত দেশ (A Madrasah with Excellence)। প্রধান অফিস ও গার্লস ক্যাম্পাস: বাড়ি-৭, রোড-১৭/এ, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০। বয়েস ক্যাম্পাস: বাড়ি-১১, রোড-১৯, সেক্টর-১২, উত্তরা, ঢাকা-১২৩০। ফোন: 01886-340308, 01901-631641, 01901-631642, 01901-631640। ইমেইল: maharatmodelmadrasah2022@gmail.com, info@maharatmadrasah.com। বিভাগসমূহ: ১. Maharat General Section (Boys & Girls - আলাদা ক্যাম্পাস): Class Pre-Play / Play to Nine (Dakhil) [Arabic & English Version], ২. Maharat Tahfiz Section: Nurani, Nazera & Hifz [With 4 Fundamental Subjects]। সুবিধা: আবাসিক, অনাবাসিক ও ডে-কেয়ার এবং নিজস্ব পরিবহন ব্যবস্থা। ভর্তিতে বিশেষ ছাড়: প্রত্যেক শ্রেণির প্রথম ৫ জনের জন্য বিশেষ ডিসকাউন্ট!',
    },
  };
}
