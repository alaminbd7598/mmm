import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canAccessAdminResource,
  hasRolePermission,
  DEFAULT_RBAC_MATRIX,
  CONFIGURABLE_ADMIN_ROLES,
  buildCRUDPermission,
  applyRolePermissionToggle,
  normalizeAdminRole,
  addLogoToSettings,
  deleteLogoFromSettings,
  computeLeaveEndDate,
  validateLeaveRequestInput,
  filterLeaveRequests,
  buildAdminNewInquiryEmail,
  buildStudentStatusUpdateEmail,
  filterNotices,
  filterLeads,
  resolveCourseTitle,
  validateInquiryInput,
  calculateAdmissionFeeSummary,
  calculateTransportFeeByDistance,
  computeStageBalanceWidths,
  evaluateNoorBotQuery,
  toBengaliDigits,
  getYouTubeEmbedUrl,
  hasValidVideoUrl,
  validateAndMergeCMSBackup,
  extractInstitutionFromTextHeuristic,
  mergeLiveCMSState,
  enableAllPublicSections,
  filterHifzGraduates,
  filterPhotoGallery,
  buildHafizSocialShareLinks,
  buildUnifiedMediaHubItems,
  filterUnifiedMediaItems,
  filterExamSchedules,
  DEFAULT_EXAM_SCHEDULES,
  normalizePhoneNumber,
  findMatchingLeadByPhone,
  parseBulkLeadsCsvText,
  CRM_PIPELINE_STAGES,
  localizeLeadStatus,
} from './cmsLogic';
import { AdmissionLead, CourseItem, NoticeItem, RolePermissionMatrix } from '../types/cms';
import { INITIAL_CMS_STATE } from '../data/seedData';
import { buildMaharatModelMadrasahPreset } from '../data/madrasahInfographicsData';
import {
  localizeDigits,
  localizeDynamicText,
  formatCurrencyByLang,
  resolvePageFromPath,
  PAGE_PATH_MAP,
  HEADER_NAV_GROUPS,
} from './i18nContent';

test('RBAC: Super Admin has full access to all tabs including branding, leaves, madrasah-infographics, videos, backup-ai, settings and users', () => {
  assert.equal(canAccessAdminResource('Super Admin', 'overview'), true);
  assert.equal(canAccessAdminResource('Super Admin', 'branding'), true);
  assert.equal(canAccessAdminResource('Super Admin', 'leaves'), true);
  assert.equal(canAccessAdminResource('Super Admin', 'madrasah-infographics'), true);
  assert.equal(canAccessAdminResource('Super Admin', 'popup-ai-fees'), true);
  assert.equal(canAccessAdminResource('Super Admin', 'videos'), true);
  assert.equal(canAccessAdminResource('Super Admin', 'backup-ai'), true);
  assert.equal(canAccessAdminResource('Super Admin', 'courses'), true);
  assert.equal(canAccessAdminResource('Super Admin', 'settings'), true);
  assert.equal(canAccessAdminResource('Super Admin', 'users'), true);
  assert.equal(CONFIGURABLE_ADMIN_ROLES.length, 5);
});

test('RBAC: 5-Role System (Super Admin, Chairman / Managing Director, Principal / Vice Principal, Coordinators / Teachers, Content Managers) enforces strict Super Admin control over users and granular CRUD permissions', () => {
  // Content Managers CRUD check
  assert.equal(canAccessAdminResource('Content Managers', 'branding'), true);
  assert.equal(hasRolePermission('Content Managers', 'notices', 'create'), true);
  assert.equal(hasRolePermission('Content Managers', 'notices', 'read'), true);
  assert.equal(hasRolePermission('Content Managers', 'notices', 'update'), true);
  assert.equal(hasRolePermission('Content Managers', 'notices', 'delete'), true);
  assert.equal(canAccessAdminResource('Content Managers', 'madrasah-infographics'), true);
  assert.equal(canAccessAdminResource('Content Managers', 'popup-ai-fees'), true);
  assert.equal(canAccessAdminResource('Content Managers', 'videos'), true);
  assert.equal(canAccessAdminResource('Content Managers', 'courses'), true);
  assert.equal(canAccessAdminResource('Content Managers', 'events'), true);
  assert.equal(canAccessAdminResource('Content Managers', 'leads'), true);
  assert.equal(canAccessAdminResource('Content Managers', 'settings'), false);
  assert.equal(canAccessAdminResource('Content Managers', 'users'), false);

  // Chairman / Managing Director & Principal / Vice Principal have CRUD on leaves, no access to users
  assert.equal(hasRolePermission('Chairman / Managing Director', 'leaves', 'read'), true);
  assert.equal(hasRolePermission('Chairman / Managing Director', 'leaves', 'update'), true);
  assert.equal(hasRolePermission('Chairman / Managing Director', 'branding', 'update'), true);
  assert.equal(hasRolePermission('Chairman / Managing Director', 'users', 'read'), false);

  assert.equal(hasRolePermission('Principal / Vice Principal', 'leaves', 'create'), true);
  assert.equal(hasRolePermission('Principal / Vice Principal', 'leaves', 'read'), true);
  assert.equal(hasRolePermission('Principal / Vice Principal', 'leaves', 'update'), true);
  assert.equal(hasRolePermission('Principal / Vice Principal', 'leaves', 'delete'), true);
  assert.equal(hasRolePermission('Principal / Vice Principal', 'users', 'read'), false);

  // Coordinators / Teachers have create/read/update on leaves (to submit leave requests), read-only on notices/events, and no access to settings/users
  assert.equal(hasRolePermission('Coordinators / Teachers', 'leaves', 'create'), true);
  assert.equal(hasRolePermission('Coordinators / Teachers', 'leaves', 'read'), true);
  assert.equal(hasRolePermission('Coordinators / Teachers', 'leaves', 'update'), true);
  assert.equal(hasRolePermission('Coordinators / Teachers', 'leaves', 'delete'), false);
  assert.equal(hasRolePermission('Coordinators / Teachers', 'notices', 'read'), true);
  assert.equal(hasRolePermission('Coordinators / Teachers', 'notices', 'create'), false);
  assert.equal(hasRolePermission('Coordinators / Teachers', 'notices', 'update'), false);
  assert.equal(hasRolePermission('Coordinators / Teachers', 'settings', 'read'), false);
  assert.equal(hasRolePermission('Coordinators / Teachers', 'users', 'read'), false);

  // applyRolePermissionToggle: enabling 'create' automatically enables 'read'
  const matrixAfterCreate = applyRolePermissionToggle(
    DEFAULT_RBAC_MATRIX,
    'Coordinators / Teachers',
    'settings',
    'create',
    true
  );
  assert.equal(hasRolePermission('Coordinators / Teachers', 'settings', 'create', matrixAfterCreate), true);
  assert.equal(hasRolePermission('Coordinators / Teachers', 'settings', 'read', matrixAfterCreate), true);

  // applyRolePermissionToggle: disabling 'read' automatically clears 'create', 'update', and 'delete'
  const matrixAfterDisableRead = applyRolePermissionToggle(
    matrixAfterCreate,
    'Coordinators / Teachers',
    'settings',
    'read',
    false
  );
  assert.equal(hasRolePermission('Coordinators / Teachers', 'settings', 'read', matrixAfterDisableRead), false);
  assert.equal(hasRolePermission('Coordinators / Teachers', 'settings', 'create', matrixAfterDisableRead), false);

  // Super Admin root protection on 'users' module cannot be disabled
  const attemptedSuperAdminLockout = applyRolePermissionToggle(
    DEFAULT_RBAC_MATRIX,
    'Super Admin',
    'users',
    'read',
    false
  );
  assert.equal(hasRolePermission('Super Admin', 'users', 'read', attemptedSuperAdminLockout), true);

  // Even if customMatrix attempts to grant 'users' to a non-Super Admin role, 'users' remains strictly Super Admin only
  const attemptedUsersOverride: RolePermissionMatrix = {
    ...DEFAULT_RBAC_MATRIX,
    'Chairman / Managing Director': {
      ...DEFAULT_RBAC_MATRIX['Chairman / Managing Director'],
      users: buildCRUDPermission(true, true, true, true),
    },
  };
  assert.equal(
    hasRolePermission('Chairman / Managing Director', 'users', 'read', attemptedUsersOverride),
    false
  );

  // Role normalization
  assert.equal(normalizeAdminRole('Principal'), 'Principal / Vice Principal');
  assert.equal(normalizeAdminRole('Teacher'), 'Coordinators / Teachers');
  assert.equal(normalizeAdminRole('Content Manager'), 'Content Managers');
});

test('Branding Logo Vault: addLogoToSettings and deleteLogoFromSettings store and persist active header logos', () => {
  const initialSettings = INITIAL_CMS_STATE.settings;
  const updated = addLogoToSettings(
    initialSettings,
    {
      name: 'New Custom Header Logo',
      url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      variant: 'banner-transparent',
    },
    true
  );

  assert.equal(
    updated.logoUrl,
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  );
  assert.equal((updated.storedLogos || []).length, (initialSettings.storedLogos || []).length + 1);

  const newlyAddedId = updated.storedLogos![0].id;
  const afterDelete = deleteLogoFromSettings(updated, newlyAddedId);
  assert.equal((afterDelete.storedLogos || []).length, (initialSettings.storedLogos || []).length);
  // Active logoUrl falls back to the first remaining stored logo
  assert.equal(afterDelete.logoUrl, afterDelete.storedLogos![0].url);
});

test('Leave Management: computes end date, validates dropdown inputs, and filters leave requests accurately', () => {
  // 3-day leave starting 2026-11-10 ends on 2026-11-12 (inclusive)
  assert.equal(computeLeaveEndDate('2026-11-10', 3), '2026-11-12');
  assert.equal(computeLeaveEndDate('2026-11-10', 1), '2026-11-10');

  const validLeave = validateLeaveRequestInput({
    teacherName: 'হাফেজ ক্বারী সাইফুল্লাহ আল-মাদানী',
    department: 'হিফজুল কুরআন ও ক্বিরাত বিভাগ',
    designation: 'প্রধান হাফেজ ও ক্বারী',
    leaveType: 'অসুস্থতাজনিত ছুটি (Medical / Sick Leave)',
    startDate: '2026-11-10',
    totalDays: 3,
    reasonCategory: 'শারীরিক অসুস্থতা বা ডাক্তারি পরীক্ষা (Medical Treatment)',
    substituteTeacher: 'মাওলানা জুবায়ের আহমদ (আরবি ও হাদিস)',
    phone: '01711-223344',
  });
  assert.equal(validLeave.valid, true);

  const invalidLeave = validateLeaveRequestInput({
    teacherName: '',
    department: 'হিফজুল কুরআন ও ক্বিরাত বিভাগ',
    designation: 'প্রধান হাফেজ ও ক্বারী',
    leaveType: 'অসুস্থতাজনিত ছুটি (Medical / Sick Leave)',
    startDate: '2026-11-10',
    totalDays: 0,
    reasonCategory: '',
    substituteTeacher: '',
    phone: '123',
  });
  assert.equal(invalidLeave.valid, false);

  const allLeaves = INITIAL_CMS_STATE.leaveRequests;
  assert.equal(filterLeaveRequests(allLeaves, 'Approved', 'All', '').length, 1);
  assert.equal(filterLeaveRequests(allLeaves, 'Pending', 'All', '').length, 1);
});

test('YouTube & Facebook Reel Embed Parser: converts YouTube watch/Shorts and Facebook Reel/Video URLs into widescreen 16:9 in-frame embed URLs', () => {
  assert.equal(
    getYouTubeEmbedUrl('https://www.youtube.com/watch?v=r2t21s1mU6I').embedUrl,
    'https://www.youtube.com/embed/r2t21s1mU6I?autoplay=1&rel=0'
  );
  assert.equal(
    getYouTubeEmbedUrl('https://youtu.be/Kqd64a1-2-k').embedUrl,
    'https://www.youtube.com/embed/Kqd64a1-2-k?autoplay=1&rel=0'
  );
  assert.equal(
    getYouTubeEmbedUrl('https://www.youtube.com/shorts/o-c9R5KB4hE').embedUrl,
    'https://www.youtube.com/embed/o-c9R5KB4hE?autoplay=1&rel=0'
  );
  assert.equal(
    getYouTubeEmbedUrl('https://www.youtube.com/shorts/o-c9R5KB4hE').isVerticalShort,
    false
  );

  // Facebook Reel embed parser uses widescreen horizontal computer/tablet mode (width=1280, isVerticalShort=false)
  const fbReel = getYouTubeEmbedUrl('https://www.facebook.com/reel/2103437697080464');
  assert.equal(fbReel.platform, 'facebook');
  assert.equal(fbReel.isVerticalShort, false);
  assert.ok(fbReel.embedUrl.includes('https://www.facebook.com/plugins/video.php'));
  assert.ok(fbReel.embedUrl.includes('width=1280'));
  assert.ok(fbReel.embedUrl.includes(encodeURIComponent('https://www.facebook.com/reel/2103437697080464')));
});

test('JSON Backup & Restore Validator: validates and merges partial or complete CMS JSON backups safely', () => {
  const backupJson = JSON.stringify({
    exportedAt: '2026-10-30T00:00:00Z',
    data: {
      settings: {
        ...INITIAL_CMS_STATE.settings,
        instituteName: 'Al-Hikmah International Madrasah',
        instituteNameBn: 'আল-হিকমাহ ইন্টারন্যাশনাল মাদ্রাসা',
      },
      activityVideos: INITIAL_CMS_STATE.activityVideos.slice(0, 3),
    },
  });

  const result = validateAndMergeCMSBackup(backupJson, INITIAL_CMS_STATE);
  assert.equal(result.valid, true);
  assert.equal(result.state?.settings.instituteName, 'Al-Hikmah International Madrasah');
  assert.equal(result.state?.activityVideos.length, 3);
  assert.equal(result.state?.guardianReels.length, INITIAL_CMS_STATE.guardianReels.length);

  const invalidResult = validateAndMergeCMSBackup('{ broken json', INITIAL_CMS_STATE);
  assert.equal(invalidResult.valid, false);
});

test('Heuristic AI Document Extractor: extracts phone, email, discount, and institution details from raw text', () => {
  const sampleDoc = `
    প্রতিষ্ঠানের নাম: দারুল উলুম ইন্টারন্যাশনাল একাডেমি
    Institute Name: Darul Uloom International Academy
    ঠিকানা: বাড়ি-১২, রোড-৫, ধানমন্ডি, ঢাকা
    ফোন: 01711-998877, 01819-223344
    ইমেইল: info@darululoom.edu.bd
    ভর্তি চলছে! সকল শ্রেণিতে ৩০% ছাড়।
  `;
  const extracted = extractInstitutionFromTextHeuristic(sampleDoc, INITIAL_CMS_STATE);
  assert.equal(extracted.instituteNameBn, 'দারুল উলুম ইন্টারন্যাশনাল একাডেমি');
  assert.equal(extracted.instituteName, 'Darul Uloom International Academy');
  assert.equal(extracted.phonePrimary, '01711-998877');
  assert.equal(extracted.email, 'info@darululoom.edu.bd');
  assert.ok(extracted.customKnowledgeBase.includes('দারুল উলুম ইন্টারন্যাশনাল একাডেমি'));
});

test('Interactive Fee Calculator: computes 25%, 10%, and extra 5% discounts and mutually exclusive accommodation', () => {
  const sampleItem = {
    id: 'fee-prep-2',
    department: 'General' as const,
    classNameBn: 'প্রেপ (নার্সারি) - দ্বিতীয় শ্রেণি',
    classNameEn: 'Prep (Nursery) to Class Two',
    admissionFee: 12000,
    monthlyTuition: 5000,
    annualServiceCharge: 3000,
    descriptionBn: 'প্রাথমিক একাডেমিক ও নূরানী ফাউন্ডেশন',
  };

  const res1 = calculateAdmissionFeeSummary({
    item: sampleItem,
    apply25Discount: true,
    apply10Discount: false,
    apply5ExtraDiscount: false,
    accommodationMode: 'non-residential',
    config: {
      residentialMonthlyFee: 9500,
      dayCareMonthlyFee: 4500,
      nonResidentialMonthlyFee: 0,
    },
  });
  assert.equal(res1.netAdmissionFee, 9000);
  assert.equal(res1.totalMonthlyFee, 5000);
  assert.equal(res1.totalPayableAtAdmission, 14000);

  const res2 = calculateAdmissionFeeSummary({
    item: sampleItem,
    apply25Discount: true,
    apply10Discount: false,
    apply5ExtraDiscount: true,
    accommodationMode: 'residential',
    config: {
      residentialMonthlyFee: 9500,
      dayCareMonthlyFee: 4500,
      nonResidentialMonthlyFee: 0,
    },
  });
  assert.equal(res2.totalDiscountPercent, 30);
  assert.equal(res2.netAdmissionFee, 8400);
  assert.equal(res2.accommodationMonthlyFee, 9500);
  assert.equal(res2.totalMonthlyFee, 14500);
  assert.equal(res2.totalPayableAtAdmission, 22900);

  const res3 = calculateAdmissionFeeSummary({
    item: sampleItem,
    apply25Discount: false,
    apply10Discount: true,
    apply5ExtraDiscount: false,
    accommodationMode: 'daycare',
    config: {
      residentialMonthlyFee: 9500,
      dayCareMonthlyFee: 4500,
      nonResidentialMonthlyFee: 0,
    },
  });
  assert.equal(res3.netAdmissionFee, 10800);
  assert.equal(res3.accommodationMonthlyFee, 4500);
  assert.equal(res3.totalMonthlyFee, 9500);
});

test('Noor AI Assistant Guardrail: answers custom Q&A items and denies out-of-scope questions with warning', () => {
  const botConfig = INITIAL_CMS_STATE.aiBotConfig;
  const settings = INITIAL_CMS_STATE.settings;

  // Valid institute question matched via custom qaItems
  const inScope = evaluateNoorBotQuery('হিফজ বিভাগের ভর্তি ফি কত?', 0, botConfig, settings);
  assert.equal(inScope.isOutOfScope, false);
  assert.equal(inScope.newWarningCount, 0);
  assert.ok(inScope.replyText.includes('হিফজ'));

  // Out-of-scope question 1 -> remaining warnings = 2
  const outScope1 = evaluateNoorBotQuery('আজকের ক্রিকেট খেলার খবর কি?', 0, botConfig, settings);
  assert.equal(outScope1.isOutOfScope, true);
  assert.equal(outScope1.newWarningCount, 1);
  assert.equal(outScope1.replyText, botConfig.refusalMessage);
  assert.ok(outScope1.warningText?.includes('আর 2 বার এমন করলে'));

  // Out-of-scope question 3 -> locks chat
  const outScope3 = evaluateNoorBotQuery('বিরিয়ানি রান্নার রেসিপি বলো', 2, botConfig, settings);
  assert.equal(outScope3.isOutOfScope, true);
  assert.equal(outScope3.shouldLock, true);
});

test('Bengali digit formatter converts numbers accurately', () => {
  assert.equal(toBengaliDigits('03'), '০৩');
  assert.equal(toBengaliDigits(2027), '২০২৭');
});

test('Email Notifications: builds admin notification email on new inquiry submission', () => {
  const email = buildAdminNewInquiryEmail(
    {
      name: 'Abdullah Al Mamun',
      phone: '01711223344',
      email: 'abdullah@example.com',
      courseTitle: 'Hifzul Quran & International Qirat',
      message: 'Interested in residential facility',
      source: 'Quick Inquiry',
    },
    'craftinstitutebd@gmail.com',
    'Craft International Institute',
    '2026-10-22T12:00:00.000Z'
  );

  assert.equal(email.recipientType, 'Admin');
  assert.equal(email.recipientEmail, 'craftinstitutebd@gmail.com');
  assert.ok(email.subject.includes('Abdullah Al Mamun'));
  assert.ok(email.body.includes('Hifzul Quran & International Qirat'));
  assert.equal(email.status, 'Dispatched (Simulated)');
});

test('Email Notifications: builds student notification email when status changes to granular status', () => {
  const email = buildStudentStatusUpdateEmail(
    {
      name: 'Fatema Tuz Zohra',
      email: 'fatema@example.com',
      courseTitle: 'Academic Class 4–8 (Integrated Skill Curriculum)',
    },
    'Interview Scheduled',
    'Craft International Institute',
    '01604-858100',
    '2026-10-22T12:05:00.000Z'
  );

  assert.equal(email.recipientType, 'Student');
  assert.equal(email.recipientEmail, 'fatema@example.com');
  assert.ok(email.subject.includes('Interview Scheduled'));
  assert.ok(email.body.includes('INTERVIEW SCHEDULED'));
  assert.ok(email.body.includes('01604-858100'));
});

test('Lead filtering: supports granular statuses and course association filters', () => {
  const sampleLeads: AdmissionLead[] = [
    {
      id: 'l1',
      name: 'Tanvir Hasan',
      phone: '01800112233',
      email: 'tanvir@example.com',
      courseId: 'c-hifz',
      courseTitle: 'Hifzul Quran Department',
      message: 'Need hostel seat',
      status: 'Document Verification',
      submittedAt: '2026-10-20',
      source: 'Quick Inquiry',
    },
    {
      id: 'l2',
      name: 'Sadia Islam',
      phone: '01900112233',
      email: 'sadia@example.com',
      courseId: 'c-it',
      courseTitle: 'IT Skills & Creative Media',
      message: 'Non-residential',
      status: 'Offer Extended',
      submittedAt: '2026-10-21',
      source: 'Full Admission Form',
    },
  ];

  const docLeads = filterLeads(sampleLeads, 'Document Verification', 'All', '');
  assert.equal(docLeads.length, 1);
  assert.equal(docLeads[0].name, 'Tanvir Hasan');

  const courseLeads = filterLeads(sampleLeads, 'All', 'c-it', '');
  assert.equal(courseLeads.length, 1);
  assert.equal(courseLeads[0].name, 'Sadia Islam');
});

test('Notice filtering and validation logic works accurately', () => {
  const notices: NoticeItem[] = [
    {
      id: 'n1',
      title: '2027 Session Admission Open',
      category: 'Admission',
      publishDate: '2026-10-15',
      description: '25% discount on early admission',
    },
    {
      id: 'n2',
      title: 'Annual Qirat Competition',
      category: 'Academic',
      publishDate: '2026-10-18',
      description: 'All Hifz students must register',
    },
  ];

  assert.equal(filterNotices(notices, 'Admission').length, 1);
  assert.equal(filterNotices(notices, 'All', 'Qirat').length, 1);

  const invalid = validateInquiryInput({
    name: 'A',
    phone: '01711000000',
    email: 'test@example.com',
    courseId: 'c-1',
  });
  assert.equal(invalid.valid, false);

  const valid = validateInquiryInput({
    name: 'Rayhan Kabir',
    phone: '01711000000',
    email: 'rayhan@example.com',
    courseId: 'c-1',
  });
  assert.equal(valid.valid, true);

  const courses: CourseItem[] = [
    {
      id: 'c-1',
      title: 'Pre-One to Class Two Foundation',
      category: 'Academic',
      duration: '1 Year',
      totalClasses: 240,
      fee: '৳ 5,000 / month',
      overview: 'Foundation course',
      modules: [],
    },
  ];
  assert.equal(resolveCourseTitle(courses, 'c-1'), 'Pre-One to Class Two Foundation');
});

test('Madrasah Infographics: computes stage balance widths, transport distance fare, sibling discount, and Maharat preset', () => {
  // 1. Stage balance widths (Screenshot 1)
  const preHifzStage = INITIAL_CMS_STATE.educationMethodConfig.stages[0];
  const widths = computeStageBalanceWidths(preHifzStage);
  assert.equal(widths.quranWidth, 25);
  assert.equal(widths.arabicWidth, 25);
  assert.equal(widths.generalWidth, 50);

  // 2. Transport fare by distance (Screenshot 4)
  assert.equal(calculateTransportFeeByDistance(0, 400), 0);
  assert.equal(calculateTransportFeeByDistance(5, 400), 2000);
  // Minimum fare floor of 1000 BDT for very short distances
  assert.equal(calculateTransportFeeByDistance(1, 400), 1000);

  // 3. Fee calculator with Transport Route + Sibling Tuition Discount
  const sampleItem = INITIAL_CMS_STATE.feeCalculatorConfig.items[0]; // admission: 21000, tuition: 4500
  const summaryWithTransportAndSibling = calculateAdmissionFeeSummary({
    item: sampleItem,
    apply25Discount: true,
    apply10Discount: false,
    apply5ExtraDiscount: false,
    accommodationMode: 'non-residential',
    config: INITIAL_CMS_STATE.feeCalculatorConfig,
    transportMonthlyFee: 2200,
    transportLabelBn: 'উত্তরা মাইক্রো ১',
    applySiblingDiscount: true,
    siblingTuitionDiscountPercent: 25,
  });
  // Official 2027 Fee Guide: Nursery/Play tuition is 5000 -> 25% sibling discount = 1250 -> 3750 + 2200 transport = 5950 monthly
  const expectedDiscount = Math.round(sampleItem.monthlyTuition * 0.25);
  const expectedTuition = sampleItem.monthlyTuition - expectedDiscount;
  assert.equal(summaryWithTransportAndSibling.siblingTuitionDiscountAmount, expectedDiscount);
  assert.equal(summaryWithTransportAndSibling.monthlyTuitionFee, expectedTuition);
  assert.equal(summaryWithTransportAndSibling.transportMonthlyFee, 2200);
  assert.equal(summaryWithTransportAndSibling.totalMonthlyFee, expectedTuition + 2200);

  // 4. Maharat Model Madrasah 1-Click Target Preset
  const maharatState = buildMaharatModelMadrasahPreset(INITIAL_CMS_STATE);
  assert.equal(maharatState.settings.instituteNameBn, 'মাহারাত মডেল মাদ্রাসা');
  assert.equal(maharatState.madrasahContextConfig.activePresetId, 'maharat');
  assert.ok(maharatState.transportConfig.routes[0].destinationBn.includes('মাহারাত মডেল মাদ্রাসা'));
});

test('Multi-Language Localization (bn, en, ar) & Multi-Page URL Router: localizes digits, titles, and paths accurately', () => {
  // 1. Digit & Currency localization
  assert.equal(localizeDigits('৫০%', 'bn'), '৫০%');
  assert.equal(localizeDigits('৫০%', 'en'), '50%');
  assert.equal(localizeDigits('৫০%', 'ar'), '٥٠%');
  assert.equal(formatCurrencyByLang(4500, 'en'), 'BDT 4,500/-');
  assert.equal(formatCurrencyByLang(4500, 'ar'), '٤,٥٠٠ تاكا');

  // 2. Dynamic CMS text translation for Screenshots 1–4
  assert.equal(localizeDynamicText(INITIAL_CMS_STATE.educationMethodConfig.sectionTitleBn, 'en'), 'Education Methodology');
  assert.equal(localizeDynamicText(INITIAL_CMS_STATE.educationMethodConfig.sectionTitleBn, 'ar'), 'منهجية التعليم المتكامل');
  assert.equal(localizeDynamicText(INITIAL_CMS_STATE.tenYearPlanConfig.cardTitleBn, 'en'), '10-Year Master Academic Plan');
  assert.equal(localizeDynamicText(INITIAL_CMS_STATE.tenYearPlanConfig.cardTitleBn, 'ar'), 'الخطة الدراسية الشاملة لعشر سنوات');
  assert.equal(localizeDynamicText(INITIAL_CMS_STATE.dayCareRoutineConfig.headingBn, 'en'), 'A Day in Our Hifz Day-Care Program');
  assert.equal(localizeDynamicText(INITIAL_CMS_STATE.dayCareRoutineConfig.headingBn, 'ar'), 'يوم كامل في برنامج رعاية وتحفيظ القرآن الكريم');
  assert.equal(localizeDynamicText(INITIAL_CMS_STATE.transportConfig.headingBn, 'en'), 'Institute Own Transport Network');
  assert.equal(localizeDynamicText(INITIAL_CMS_STATE.transportConfig.headingBn, 'ar'), 'شبكة النقل المدرسي الخاصة بالمعهد');

  // 3. Multi-Page URL Router path resolution including /hifz-tree and /gallery
  assert.equal(resolvePageFromPath('/'), 'home');
  assert.equal(resolvePageFromPath('/education-method'), 'education-method');
  assert.equal(resolvePageFromPath('/ten-year-plan'), 'ten-year-plan');
  assert.equal(resolvePageFromPath('/daycare-routine'), 'daycare-routine');
  assert.equal(resolvePageFromPath('/transport'), 'transport');
  assert.equal(resolvePageFromPath('/fees'), 'fees');
  assert.equal(resolvePageFromPath('/hifz-tree'), 'hifz-tree');
  assert.equal(resolvePageFromPath('/gallery'), 'gallery');
  assert.equal(PAGE_PATH_MAP['hifz-tree'], '/hifz-tree');
  assert.equal(PAGE_PATH_MAP['gallery'], '/gallery');
  assert.ok(HEADER_NAV_GROUPS.length >= 6);
});

test('Live Deployment Server Sync: mergeLiveCMSState and enableAllPublicSections preserve all 5 roles, logos, Hifz Tree, and Photo Gallery', () => {
  const hiddenSettings = {
    ...INITIAL_CMS_STATE.settings,
    showHeroSection: false,
    showCoursesSection: false,
    showNoticesSection: false,
  };
  const allVisible = enableAllPublicSections(hiddenSettings);
  assert.equal(allVisible.showHeroSection, true);
  assert.equal(allVisible.showCoursesSection, true);
  assert.equal(allVisible.showNoticesSection, true);
  assert.equal(allVisible.showMadrasahInfographicsSection, true);

  const partialServerState = {
    settings: {
      ...INITIAL_CMS_STATE.settings,
      instituteNameBn: 'মাহারাত মডেল মাদ্রাসা (লাইভ সার্ভার সিঙ্ক)',
    },
  };
  const merged = mergeLiveCMSState(partialServerState, INITIAL_CMS_STATE);
  assert.equal(merged.settings.instituteNameBn, 'মাহারাত মডেল মাদ্রাসা (লাইভ সার্ভার সিঙ্ক)');
  assert.equal(merged.users.length, 5);
  assert.equal(Boolean(merged.rbacMatrix['Super Admin']), true);
  assert.equal(merged.hifzTreeConfig.graduates.length, 30);
  assert.equal(merged.photoGallery.length, 17);
});

test('Facebook Media Integration, Hifzul Quran Tree (30 Huffaz) & Categorized Photo Gallery (17 Posts)', () => {
  // 1. All 10 Facebook Video Reels are wired into hero, campus, department, activity, and guardian reels
  assert.ok((INITIAL_CMS_STATE.settings.heroVideoUrl || '').includes('facebook.com/reel/'));
  assert.ok(INITIAL_CMS_STATE.campusVideo.videoUrl.includes('facebook.com/reel/'));
  assert.equal(hasValidVideoUrl(INITIAL_CMS_STATE.campusVideo.videoUrl), true);
  assert.equal(INITIAL_CMS_STATE.activityVideos.length, 10);
  assert.equal(INITIAL_CMS_STATE.guardianReels.length, 8);

  // 2. Hifzul Quran Tree has 30 Huffaz from serial 1 to 30 (including 24th Ahsanuddin & 30th Abrar)
  const graduates = INITIAL_CMS_STATE.hifzTreeConfig.graduates;
  assert.equal(graduates.length, 30);
  const featuredHuffaz = filterHifzGraduates(graduates, 'featured', '');
  assert.ok(featuredHuffaz.length >= 6);
  assert.equal(featuredHuffaz[0].serialNumber, 30);
  assert.ok(featuredHuffaz[0].nameBn.includes('আবরার'));

  const airTourHuffaz = filterHifzGraduates(graduates, 'air-tour', '');
  assert.ok(airTourHuffaz.length >= 2);

  const searchedHafiz = filterHifzGraduates(graduates, 'all', 'তাশরিফ সাদনান');
  assert.equal(searchedHafiz.length, 1);
  assert.equal(searchedHafiz[0].serialNumber, 21);

  // 3. Social share link builder for Hafez profile cards
  const shareLinks = buildHafizSocialShareLinks(featuredHuffaz[0], 'https://maharat.edu.bd');
  assert.ok(shareLinks.shareUrl.includes('/hifz-tree?hafiz=30'));
  assert.ok(shareLinks.facebookShareUrl.includes('facebook.com/sharer/sharer.php'));
  assert.ok(shareLinks.whatsappShareUrl.includes('wa.me/'));

  // 4. Categorized Photo Gallery has all 17 Facebook Photo Posts across 5 categories
  const gallery = INITIAL_CMS_STATE.photoGallery;
  assert.equal(gallery.length, 17);
  assert.equal(filterPhotoGallery(gallery, 'Hifz & Sabak', '').length, 5);
  assert.equal(filterPhotoGallery(gallery, 'Board & Exam Results', '').length, 4);
  assert.equal(filterPhotoGallery(gallery, 'Study Tour & Events', '').length, 2);
  assert.equal(filterPhotoGallery(gallery, 'Seerah & Publications', '').length, 5);
  assert.equal(filterPhotoGallery(gallery, 'Teacher Training & Campus', '').length, 1);

  // 5. Unified Media Hub combines all 17 Photos + 10 Videos into the same category system
  const unifiedMedia = buildUnifiedMediaHubItems(INITIAL_CMS_STATE);
  assert.equal(unifiedMedia.length, 27);
  assert.equal(filterUnifiedMediaItems(unifiedMedia, 'All', 'video', '').length, 10);
  assert.equal(filterUnifiedMediaItems(unifiedMedia, 'All', 'photo', '').length, 17);
  assert.ok(filterUnifiedMediaItems(unifiedMedia, 'Hifz & Sabak', 'all', '').length > 5);

  // 6. Exam Schedule filter by Class/Department and Session/Term
  assert.ok(DEFAULT_EXAM_SCHEDULES.length >= 15);
  const annualPlay2 = filterExamSchedules(DEFAULT_EXAM_SCHEDULES, 'play-2', '2026-annual');
  assert.equal(annualPlay2.length, 4);
  const hifzAnnual = filterExamSchedules(DEFAULT_EXAM_SCHEDULES, 'hifz-noorani', '2026-annual');
  assert.equal(hifzAnnual.length, 2);
});

test('Educational CRM Pipeline: phone normalization, lead deduplication, bulk import parser & 7-stage workflow', () => {
  // 1. Phone number normalization
  assert.equal(normalizePhoneNumber('+8801711223344'), '01711223344');
  assert.equal(normalizePhoneNumber('8801811223344'), '01811223344');
  assert.equal(normalizePhoneNumber('01604-858100'), '01604858100');
  assert.equal(normalizePhoneNumber('01555 123 456'), '01555123456');

  // 2. 7 Core Pipeline Stages definition
  assert.equal(CRM_PIPELINE_STAGES.length, 7);
  const stageIds = CRM_PIPELINE_STAGES.map((s) => s.id);
  assert.deepEqual(stageIds, [
    'New',
    'Contacted',
    'Interested',
    'Follow-up',
    'Campus Visit',
    'Admitted',
    'Not Now',
  ]);

  // 3. Status localization
  assert.equal(localizeLeadStatus('New', 'bn'), 'নতুন আবেদন');
  assert.equal(localizeLeadStatus('Admitted', 'bn'), 'ভর্তি সম্পন্ন 🎓');
  assert.equal(localizeLeadStatus('Campus Visit', 'en'), 'Campus Visit');

  // 4. Phone lookup & deduplication against existing leads
  const testLeads: AdmissionLead[] = [
    {
      id: 'lead-test-1',
      name: 'ফারহান সাদিক',
      phone: '01711-998877',
      email: 'farhan@test.com',
      courseId: 'course-prep-2',
      courseTitle: 'হিফজ বিভাগ',
      message: 'Quick Inquiry',
      status: 'New',
      submittedAt: '2026-11-10 10:00',
      source: 'Registration Form',
    },
  ];

  // Matches formatted or raw number
  const matched = findMatchingLeadByPhone(testLeads, '01711998877');
  assert.ok(matched);
  assert.equal(matched?.id, 'lead-test-1');

  // Non-matching returns undefined
  assert.equal(findMatchingLeadByPhone(testLeads, '01899001122'), undefined);

  // 5. Bulk CSV text parser with deduplication
  const sampleCsv = `Name, Phone, Email, Department, Source, Notes
আব্দুল্লাহ আল মাহমুদ, 01711223344, mahmud@gmail.com, হিফজ বিভাগ, Facebook Campaign, নার্সারি উত্তীর্ণ
ফারহান সাদিক, 01711998877, farhan@test.com, হিফজ বিভাগ, Facebook Ads, বিদ্যমান ফোন নম্বর
invalid row without phone`;

  const parseResult = parseBulkLeadsCsvText(sampleCsv, testLeads, 'General Academic & Hifz', 'Facebook Ads 2027');
  assert.equal(parseResult.newLeads.length, 1);
  assert.equal(parseResult.newLeads[0].name, 'আব্দুল্লাহ আল মাহমুদ');
  assert.equal(parseResult.newLeads[0].phone, '01711223344');
  assert.equal(parseResult.newLeads[0].marketingSourceTag, 'Facebook Ads 2027');
  assert.equal(parseResult.duplicatesCount, 1); // 01711998877 matched
  assert.equal(parseResult.invalidCount, 1); // invalid row skipped
});



