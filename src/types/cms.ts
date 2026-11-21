export type LeadStatus =
  | 'Pending'
  | 'New'
  | 'Contacted'
  | 'Interested'
  | 'Follow-up'
  | 'Campus Visit'
  | 'Document Verification'
  | 'Interview Scheduled'
  | 'Offer Extended'
  | 'Admitted'
  | 'Enrolled'
  | 'Rejected'
  | 'Not Now';

export const LEAD_STATUS_OPTIONS: LeadStatus[] = [
  'New',
  'Contacted',
  'Interested',
  'Follow-up',
  'Campus Visit',
  'Document Verification',
  'Interview Scheduled',
  'Offer Extended',
  'Admitted',
  'Enrolled',
  'Not Now',
  'Rejected',
];

export type LeadPriority = 'Hot' | 'Warm' | 'Cold';

export interface LeadCallLog {
  id: string;
  callerName: string;
  callOutcome: 'Connected' | 'No answer' | 'Busy' | 'Wrong number' | 'Scheduled callback';
  durationText?: string;
  timestamp: string;
  note?: string;
}

export interface LeadNoteItem {
  id: string;
  authorName: string;
  timestamp: string;
  text: string;
}

export interface GoogleSheetSyncConfig {
  sheetUrl: string;
  sheetName?: string;
  autoSyncIntervalMinutes?: number;
  lastSyncedAt?: string;
  lastSyncedCount?: number;
}

export type AdminRole =
  | 'Super Admin'
  | 'Chairman / Managing Director'
  | 'Principal / Vice Principal'
  | 'Coordinators / Teachers'
  | 'Content Managers';

export const ADMIN_ROLES_LIST: AdminRole[] = [
  'Super Admin',
  'Chairman / Managing Director',
  'Principal / Vice Principal',
  'Coordinators / Teachers',
  'Content Managers',
];

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'view' | 'edit';

export interface ResourcePermission {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  view: boolean;
  edit: boolean;
  delete: boolean;
}

export type ConfigurableRole = AdminRole;

export type RolePermissionMatrix = Record<AdminRole, Record<string, ResourcePermission>>;

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface TeacherLeaveRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherUsername: string;
  designation: string;
  department: string;
  leaveType: string;
  reasonCategory: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  substituteTeacher: string;
  detailsNote?: string;
  reasonDetails?: string;
  emergencyPhone?: string;
  phone?: string;
  status: LeaveStatus;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerComment?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  email: string;
  role: AdminRole;
  designation?: string;
  department?: string;
  phone?: string;
  bio?: string;
  photoUrl?: string;
  signatureDataUrl?: string;
  signatorySlot?: 'chairman' | 'principal' | 'coordinator' | 'none';
  googleEmail?: string;
  createdAt: string;
}

export interface NewsItem {
  id: string;
  text: string;
  active: boolean;
  createdAt: string;
}

export type NoticeCategory = 'Admission' | 'Exam' | 'Academic' | 'Holiday';

export interface NoticeItem {
  id: string;
  title: string;
  category: NoticeCategory;
  publishDate: string;
  description: string;
  attachmentUrl?: string;
}

export interface ClassModule {
  id: string;
  moduleNumber: number;
  title: string;
  lectureCount: number;
  topics: string[];
}

export type CourseCategory =
  | 'Academic'
  | 'Hifzul Quran'
  | 'IT Skills'
  | 'Languages'
  | 'Soft & Hard Skills'
  | 'Business Skills';

export interface CourseItem {
  id: string;
  title: string;
  titleBn?: string;
  category: CourseCategory;
  duration: string;
  totalClasses: number;
  fee: string;
  admissionFee?: string;
  overview: string;
  modules: ClassModule[];
}

export interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  type: 'On-Campus' | 'Online Seminar' | 'Workshop';
  description: string;
  registrationOpen: boolean;
}

export interface DetailedAdmissionData {
  // Step 1: Student Info (শিক্ষার্থীর তথ্য)
  studentPhotoUrl?: string;
  studentNameBn?: string;
  studentNameEn?: string;
  dob?: string;
  age?: string;
  gender?: string;
  department?: string;
  targetClass?: string;
  academicCategory?: string;
  session?: string;
  nidOrBirthReg?: string;
  bloodGroup?: string;
  nationality?: string;

  // Step 2: Previous Academic Info (পূর্ববর্তী একাডেমিক তথ্য)
  prevInstitute?: string;
  prevClass?: string;
  prevGpa?: string;

  // Step 3: Parents & Guardian Info (অভিভাবকের তথ্য)
  fatherNameBn?: string;
  fatherNameEn?: string;
  fatherOccupation?: string;
  fatherEducation?: string;
  fatherMobile?: string;
  fatherWhatsapp?: string;
  fatherWhatsappSame?: boolean;

  motherNameBn?: string;
  motherNameEn?: string;
  motherOccupation?: string;
  motherEducation?: string;
  motherMobile?: string;
  motherWhatsapp?: string;
  motherWhatsappSame?: boolean;

  guardianNameBn?: string;
  guardianNameEn?: string;
  guardianRelation?: string;
  guardianMobile?: string;
  guardianWhatsapp?: string;
  guardianOccupation?: string;
  guardianAddress?: string;

  // Step 4: Family Environment (পারিবারিক পরিবেশ)
  halalIncome?: string;
  regularPrayer?: string;
  drugAddictionInFamily?: string;
  hasTelevision?: string;
  quranRecitation?: string;
  purdahMaintenance?: string;

  // Step 5: Behavior & Skills (আচরণ ও দক্ষতা)
  mobileUsageHours?: string;
  generalBehavior?: string;
  obeysParents?: string;
  behaviorWithElders?: string;
  behaviorWithYoungers?: string;
  liesOrStubborn?: string;
  studyInterest?: string;
  religiousInterest?: string;
  angerControl?: string;
  behaviorWithParents?: string;

  // Step 6: Address & Documents (ঠিকানা ও ডকুমেন্টস)
  permanentVillage?: string;
  permanentPost?: string;
  permanentPostCode?: string;
  permanentThana?: string;
  permanentDistrict?: string;
  presentAddressSame?: boolean;
  presentVillage?: string;
  presentPost?: string;
  presentPostCode?: string;
  presentThana?: string;
  presentDistrict?: string;
  submittedDocuments?: string[];
  agreedToPledge?: boolean;
}

export interface AdmissionLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  courseId: string;
  courseTitle: string;
  message: string;
  status: LeadStatus;
  submittedAt: string;
  source: 'Quick Inquiry' | 'Full Admission Form' | 'Registration Form' | 'Facebook Ads' | 'Google Sheet' | 'Excel Import';
  detailedData?: DetailedAdmissionData;
  guardianName?: string;
  guardianRelation?: string;
  preferredDepartment?: string;
  targetClass?: string;
  preferredAccommodation?: string;
  campusVisitDate?: string;
  // CRM Lifecycle & Marketing Attributes
  priority?: LeadPriority;
  assignedStaff?: string;
  nextCallDate?: string;
  nextCallTime?: string;
  admissionChancePercent?: number;
  marketingSourceTag?: string;
  callLogs?: LeadCallLog[];
  notes?: LeadNoteItem[];
  lastContactedAt?: string;
  isStarred?: boolean;
  assignedCounselor?: string;
  checklist?: {
    birthCert?: boolean;
    photos?: boolean;
    parentNid?: boolean;
    assessmentDone?: boolean;
    feePaid?: boolean;
  };
}

export type CareerApplicationStatus =
  | 'Received'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Selected'
  | 'Rejected';

export interface CareerJobCircular {
  id: string;
  titleBn: string;
  titleEn: string;
  departmentBn: string;
  campusBn: string;
  employmentTypeBn: string;
  salaryRangeBn: string;
  vacancies: number;
  deadline: string;
  summaryBn: string;
  requirementsBn: string[];
  responsibilitiesBn: string[];
  ageLimitBn?: string;
  priorityBn?: string;
  subjectBreakdownBn?: string;
  applicationFeeBDT?: number;
  examDateNoteBn?: string;
  active: boolean;
  featured?: boolean;
  createdAt: string;
}

export interface CareerApplicationItem {
  id: string;
  jobId: string;
  jobTitleBn: string;
  applicantName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  educationBn: string;
  experienceYearsBn: string;
  expectedSalaryBn?: string;
  paymentTrxId?: string;
  cvLinkOrFileName?: string;
  cvFileName?: string;
  cvFileDataUrl?: string;
  coverLetterBn?: string;
  applicantAccountEmail?: string;
  isGuestApplication: boolean;
  status: CareerApplicationStatus;
  hrNote?: string;
  submittedAt: string;
}

export interface CareerCandidateAccount {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  createdAt: string;
}

export interface EmailNotificationLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  recipientType: 'Admin' | 'Student';
  subject: string;
  body: string;
  sentAt: string;
  triggerEvent: string;
  status: 'Dispatched (Simulated)';
}

export interface PopupNoticeConfig {
  enabled: boolean;
  badgeText: string;
  headline: string;
  discountText: string;
  description: string;
  countdownDays: number;
  countdownHours: number;
  countdownMinutes: number;
  countdownSeconds: number;
  ctaText: string;
  topBarText: string;
  topBarCtaText: string;
}

export interface BotQAItem {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  category: string;
  active?: boolean;
  answerBn?: string;
}

export interface AIBotConfig {
  botName: string;
  enabled: boolean;
  welcomeMessage: string;
  welcomeMessageBn?: string;
  refusalMessage: string;
  warningTemplate: string;
  maxWarnings: number;
  cooldownSeconds: number;
  customKnowledgeBase: string;
  suggestedQuestions?: string[];
  qaItems?: BotQAItem[];
}

export interface WhatsAppQuickTopic {
  id: string;
  label: string;
  labelBn?: string;
  message: string;
  prefilledMessage?: string;
  active?: boolean;
}

export interface WhatsAppBotConfig {
  enabled: boolean;
  phoneNumber: string;
  defaultMessage: string;
  groupLink: string;
  floatingTooltip: string;
  floatingTooltipBn?: string;
  welcomeHeadline: string;
  quickTopics: WhatsAppQuickTopic[];
}

export interface CampusVideoConfig {
  badge?: string;
  badgeText?: string;
  title?: string;
  titleEn?: string;
  titleBn?: string;
  headlineBn?: string;
  subtitle?: string;
  subtitleBn?: string;
  playLabel?: string;
  videoUrl: string;
  thumbnailUrl: string;
  active?: boolean;
}

export interface DepartmentVideoItem {
  id: string;
  department: 'Academic' | 'Hifz';
  departmentKey?: 'Academic' | 'Hifz';
  badge?: string;
  badgeText?: string;
  title?: string;
  titleEn?: string;
  titleBn?: string;
  subtitle?: string;
  subtitleEn?: string;
  description?: string;
  descriptionBn?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration?: string;
  ctaText?: string;
}

export interface ActivityVideoItem {
  id: string;
  title?: string;
  titleEn?: string;
  titleBn?: string;
  department: 'Academic' | 'Hifz';
  videoUrl: string;
  thumbnailUrl: string;
  categoryLabel?: string;
  categoryBn?: string;
  duration?: string;
  dateBn?: string;
  descriptionBn?: string;
  active?: boolean;
}

export interface GuardianReelItem {
  id: string;
  guardianName?: string;
  guardianNameBn?: string;
  guardianRelationBn?: string;
  studentRelationBn?: string;
  relationOrTitle?: string;
  titleBn?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration?: string;
  quoteBn?: string;
  rating?: number;
  viewsCount?: string;
  active?: boolean;
}

export type AccommodationMode = 'non-residential' | 'residential' | 'daycare';

export interface FeeStructureItem {
  id: string;
  department: 'General' | 'Hifz';
  classNameBn: string;
  classNameEn: string;
  admissionFee: number;
  monthlyTuition: number;
  annualServiceCharge: number;
  descriptionBn: string;
}

export interface FeeCalculatorConfig {
  titleBn: string;
  subtitleBn: string;
  residentialMonthlyFee: number;
  residentialBreakdownBn: string;
  dayCareMonthlyFee: number;
  dayCareBreakdownBn: string;
  nonResidentialMonthlyFee: number;
  discount25Percent: number;
  discount10Percent: number;
  discount5Percent: number;
  items: FeeStructureItem[];
}

export type PhotoGalleryCategory =
  | 'Hifz & Sabak'
  | 'Board & Exam Results'
  | 'Study Tour & Events'
  | 'Seerah & Publications'
  | 'Teacher Training & Campus';

export interface PhotoGalleryItem {
  id: string;
  titleBn: string;
  titleEn?: string;
  category: PhotoGalleryCategory;
  dateBn: string;
  descriptionBn: string;
  imageUrl: string;
  facebookPostUrl?: string;
  badgeTextBn?: string;
  featured?: boolean;
  active?: boolean;
}

export interface HafizGraduateItem {
  id: string;
  serialNumber: number;
  serialLabelBn: string;
  serialBadgeBn?: string;
  nameBn: string;
  nameEn: string;
  classNameBn: string;
  completionDate: string;
  completionYear: string;
  durationNoteBn: string;
  badgeTextBn: string;
  descriptionBn: string;
  photoUrl: string;
  facebookPostUrl?: string;
  featured?: boolean;
  fatherNameBn?: string;
  teacherNameBn?: string;
  biographyBn?: string;
  biographyEn?: string;
  hometownBn?: string;
  certificateUrl?: string;
  certificateCode?: string;
}

export interface HifzTreeConfig {
  enabled: boolean;
  badgeBn: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  totalHuffazCount: number;
  airTourRewardTitleBn: string;
  airTourRewardDescBn: string;
  airTourRewardImageUrl: string;
  airTourRewardPostUrl: string;
  sabakCeremonyTitleBn: string;
  sabakCeremonyDescBn: string;
  sabakCeremonyImageUrl: string;
  sabakCeremonyPostUrl: string;
  graduates: HafizGraduateItem[];
}

export interface PageVisibilityConfig {
  hero?: boolean;
  highlights?: boolean;
  contact?: boolean;
  heroBanner: boolean;
  infographics: boolean;
  courses: boolean;
  campusVideo: boolean;
  departmentVideos: boolean;
  activityVideos: boolean;
  feeCalculator: boolean;
  notices: boolean;
  events: boolean;
  guardianReels: boolean;
  hifzTree?: boolean;
  photoGallery?: boolean;
  faq: boolean;
  contactInquiry: boolean;
  admissionModal: boolean;
}

export interface BrandLogoAsset {
  id: string;
  name: string;
  url: string;
  variant: 'banner-transparent' | 'banner-white' | 'emblem' | 'custom';
  uploadedAt: string;
  isSystemPreset?: boolean;
}

export interface SeoPageOverride {
  routePath: string;
  pageLabelBn: string;
  pageLabelEn: string;
  title: string;
  metaDescription: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
}

export interface SeoMetaConfig {
  documentTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  ogSiteName: string;
  ogType: 'website' | 'article' | 'profile';
  twitterCard: 'summary_large_image' | 'summary';
  twitterHandle?: string;
  canonicalBaseUrl: string;
  robotsDirective: 'index, follow' | 'noindex, nofollow' | 'index, nofollow';
  enableJsonLdSchema: boolean;
  syncOgWithMeta: boolean;
  pageOverrides: SeoPageOverride[];
  updatedAt?: string;
}

export interface SiteSettings {
  instituteName: string;
  instituteNameBn: string;
  instituteNameAr?: string;
  eiinNumber?: string;
  madrasahCode?: string;
  mottoEn?: string;
  foundationNameBn?: string;
  tagline: string;
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  phonePrimary: string;
  phoneSecondary: string;
  phoneTertiary: string;
  email: string;
  address: string;
  addressEn: string;
  officeHours?: string;
  facebookUrl: string;
  youtubeUrl: string;
  whatsappNumber: string;
  statsStudents: string;
  statsCourses: string;
  statsCertifications: string;
  statsSuccessRate: string;
  logoUrl?: string;
  secondaryLogoUrl?: string;
  headerLogoDisplayMode?: 'banner-only' | 'logo-with-text' | 'text-only';
  headerLogoHeightPx?: number;
  storedLogos?: BrandLogoAsset[];
  heroBannerUrl?: string;
  heroVideoUrl?: string;
  prospectusPdfUrl?: string;
  enableDirectMediaUpload?: boolean;
  defaultVideoFrameMode?: 'auto' | 'mobile' | 'desktop';
  pageVisibility?: PageVisibilityConfig;
  seoConfig?: SeoMetaConfig;
  showNewsTicker?: boolean;
  showHeroSection?: boolean;
  showStatsBanner?: boolean;
  showQuickExploreGrid?: boolean;
  showAboutSection?: boolean;
  showGallerySection?: boolean;
  showCoursesSection?: boolean;
  showFeeCalculator?: boolean;
  showSeminarsSection?: boolean;
  showCampusVideoSection?: boolean;
  showDepartmentVideosSection?: boolean;
  showActivityVideosSection?: boolean;
  showGuardianReviewsSection?: boolean;
  showNoticesSection?: boolean;
  showMadrasahInfographicsSection?: boolean;
  showSocialConnectSection?: boolean;
  showContactSection?: boolean;
  googleSheetSync?: GoogleSheetSyncConfig;
  // Admin-Controlled Dual Campus Google Maps URLs
  boysCampusMapUrl?: string;
  boysCampusMapEmbedUrl?: string;
  girlsCampusMapUrl?: string;
  girlsCampusMapEmbedUrl?: string;
  // Admin-Controlled External ERP Portal Links (Student / Guardian / Madrasah ERP)
  externalPortals?: ExternalPortalLink[];
}

export interface ExternalPortalLink {
  id: string;
  labelBn: string;
  labelEn: string;
  subtitleBn: string;
  subtitleEn: string;
  url: string;
  category: 'student' | 'guardian' | 'admin' | 'other';
  active: boolean;
}

// ============================================================================
// NEW INFOGRAPHIC & MADRASAH SPECIALIZED CONFIGS (4 SCREENSHOTS + MAHARAT PRESET)
// ============================================================================

export interface EducationStageBalance {
  id: string;
  stageNameBn: string;
  tabLabelBn?: string;
  classRangeBn: string;
  timingBn: string;
  quranPercent: number;
  arabicPercent: number;
  generalPercent: number;
  noteBn?: string;
}

export interface EducationMethodConfig {
  enabled: boolean;
  sectionTitleBn: string;
  ratioLeftBn: string;
  ratioRightBn: string;
  islamicTitleBn: string;
  islamicSubjectsBn: string;
  generalTitleBn: string;
  generalSubjectsBn: string;
  descriptionBn: string;
  balanceCardTitleBn: string;
  stages: EducationStageBalance[];
}

export interface TenYearStageBanner {
  id: string;
  titleBn: string;
  timingBn: string;
  colSpan: number;
}

export interface TenYearClassColumn {
  id: string;
  classNameBn: string;
  ageLabelBn: string;
}

export interface TenYearTrackBlock {
  id: string;
  labelBn: string;
  colSpan: number;
}

export interface TenYearSubjectTrack {
  id: string;
  trackNameBn: string;
  dotColor: string;
  bgColor: string;
  textColor: string;
  borderStyle?: 'solid' | 'outline';
  blocks: TenYearTrackBlock[];
}

export interface TenYearPlanConfig {
  enabled: boolean;
  headingBn: string;
  subheadingBn: string;
  cardTitleBn: string;
  cardSubtitleBn: string;
  stageBanners: TenYearStageBanner[];
  classColumns: TenYearClassColumn[];
  tracks: TenYearSubjectTrack[];
  dakhilTitleBn: string;
  dakhilSubtitleBn: string;
  mutawassitahTitleBn: string;
  mutawassitahSubtitleBn: string;
  postDakhilOptionsBn: string[];
  footerNoteBn: string;
  syllabusLinkTextBn: string;
}

export interface RoutineActivityItem {
  id: string;
  timeBn: string;
  titleBn: string;
  subtitleBn?: string;
  iconType: 'book' | 'food' | 'class' | 'bed' | 'play' | 'prayer' | 'home';
}

export interface RoutinePeriodColumn {
  id: string;
  periodNameBn: string;
  iconType: 'morning' | 'noon' | 'afternoon' | 'night';
  items: RoutineActivityItem[];
}

export interface StageDurationBar {
  id: string;
  stageNameBn: string;
  timingLabelBn: string;
  startPercent: number;
  widthPercent: number;
  isFullDay?: boolean;
}

export interface DayCareRoutineConfig {
  enabled: boolean;
  headingBn: string;
  subheadingBn: string;
  periods: RoutinePeriodColumn[];
  seasonalNoteBn: string;
  durationHeadingBn: string;
  durationBars: StageDurationBar[];
  timelineLabelsBn: [string, string, string];
}

export interface TransportRouteItem {
  id: string;
  routeNameBn: string;
  vehicleTypeBn: 'মাইক্রো' | 'অটো' | 'বাস' | string;
  monthlyFee: number;
  distanceKm: number;
  stopsBn: string[];
  destinationBn: string;
}

export interface LandmarkDistanceItem {
  id: string;
  landmarkNameBn: string;
  distanceTextBn: string;
  distanceMeters: number;
  directionBn?: string;
}

export interface TransportAndLandmarkConfig {
  enabled: boolean;
  headingBn: string;
  subheadingBn: string;
  vehicleImageUrl: string;
  vehicleCaptionBn: string;
  perKmRate: number;
  routes: TransportRouteItem[];
  landmarkHeadingBn: string;
  primaryLandmarkBannerBn: string;
  landmarks: LandmarkDistanceItem[];
}

export interface FeeComparisonRow {
  id: string;
  labelBn: string;
  nonDayCareValueBn: string;
  dayCareValueBn: string;
}

export interface AgeEligibilityItem {
  id: string;
  classNameBn: string;
  minAgeBn: string;
  stageBn: string;
}

export interface AdmissionExtraConfig {
  enabled: boolean;
  comparisonHeadingBn: string;
  comparisonSubtitleBn: string;
  feeComparisonRows: FeeComparisonRow[];
  siblingDiscountTitleBn: string;
  siblingDiscountDescriptionBn: string;
  siblingAdmissionDiscountPercent: number;
  siblingTuitionDiscountPercent: number;
  ageChartHeadingBn: string;
  ageEligibilityList: AgeEligibilityItem[];
  documentsHeadingBn: string;
  requiredDocumentsBn: string[];
}

export interface UniformGuideConfig {
  enabled: boolean;
  headingBn: string;
  subheadingBn: string;
  boysTitleBn: string;
  boysItemsBn: string[];
  girlsTitleBn: string;
  girlsItemsBn: string[];
  noteBn: string;
  uniformImageUrl?: string;
}

export interface MadrasahContextConfig {
  enabled: boolean;
  activePresetId: 'craft' | 'maharat';
  badgeBn: string;
  headingBn: string;
  paragraphsBn: string[];
  missionTitleBn: string;
  missionPointsBn: string[];
  visionTitleBn: string;
  visionPointsBn: string[];
  approachTitleBn: string;
  approachSummaryBn: string;
  approachImageUrl?: string;
  chairmanNameBn: string;
  chairmanRoleBn?: string;
  chairmanMessageBn: string;
  chairmanImageUrl?: string;
  principalNameBn: string;
  principalRoleBn?: string;
  principalMessageBn: string;
  principalImageUrl?: string;
  prospectusUrl: string;
  objectivesTitleBn?: string;
  objectivesListBn?: string[];
}

export interface GuardianComplaintItem {
  id: string;
  guardianName: string;
  studentName: string;
  studentClass: string;
  phone: string;
  category:
    | 'অভিযোগ (Complaint)'
    | 'পরামর্শ (Suggestion)'
    | 'পরিবহন (Transport)'
    | 'একাডেমিক/হিফজ (Academic)';
  message: string;
  submittedAt: string;
  status: 'New' | 'Reviewed' | 'Resolved';
  adminReply?: string;
}

export interface ReleaseSnapshotData {
  settings: SiteSettings;
  popupConfig: PopupNoticeConfig;
  aiBotConfig: AIBotConfig;
  whatsappConfig: WhatsAppBotConfig;
  feeCalculatorConfig: FeeCalculatorConfig;
  educationMethodConfig: EducationMethodConfig;
  tenYearPlanConfig: TenYearPlanConfig;
  dayCareRoutineConfig: DayCareRoutineConfig;
  transportConfig: TransportAndLandmarkConfig;
  admissionExtraConfig: AdmissionExtraConfig;
  uniformConfig: UniformGuideConfig;
  madrasahContextConfig: MadrasahContextConfig;
  hifzTreeConfig: HifzTreeConfig;
  news: NewsItem[];
  notices: NoticeItem[];
  courses: CourseItem[];
  events: EventItem[];
  photoGallery: PhotoGalleryItem[];
  campusVideo: CampusVideoConfig;
  departmentVideos: DepartmentVideoItem[];
  activityVideos: ActivityVideoItem[];
  guardianReels: GuardianReelItem[];
}

export interface AppReleaseEntry {
  id: string;
  version: string;
  tag: string;
  title: string;
  notes: string;
  added?: string[];
  improved?: string[];
  removed?: string[];
  createdAt: string;
  createdBy: string;
  isAutoBackup?: boolean;
  snapshot?: ReleaseSnapshotData;
}

export interface AppVersionManagerConfig {
  enabled: boolean;
  showInPublicFooter: boolean;
  showInAdminDashboard: boolean;
  activeVersion: string;
  currentVersion?: string;
  releases: AppReleaseEntry[];
}

// ============================================================================
// v2.2.0 PRODUCTION SUITE: ADMISSION TOKEN 2027, BLOG, CALENDAR, MOBILE BAR & VIRTUAL OFFICE
// ============================================================================

export interface AdmissionTokenLineItem {
  no: number;
  part: 'A' | 'B';
  labelEn: string;
  labelBn: string;
  fixedAmount: number;
  payableAmount: number;
  comment: string;
}

export interface AdmissionToken2027 {
  id: string;
  tokenCode: string;
  studentName: string;
  studentIdNo: string;
  admissionDate: string;
  guardianPhone: string;
  guardianEmail?: string;
  classKey: string;
  classNameLabel: string;
  studentType: 'new' | 'old';
  section: 'General' | 'Hifz';
  stayMode: 'non-residential' | 'day-care' | 'hostel';
  firstTimeStay: boolean;
  transport: boolean;
  transportAmount?: number;
  lineItems: AdmissionTokenLineItem[];
  subtotalA: number;
  subtotalB: number;
  grandTotal: number;
  totalDiscount?: number;
  generalNote?: string;
  status: 'Active' | 'Applied' | 'Cancelled';
  createdAt: string;
  createdBy?: string;
  issuedBy?: string;
  appliedLeadId?: string;
  appliedAt?: string;
}

export type BlogPostStatus = 'Published' | 'Scheduled' | 'Draft';

export interface BlogPostItem {
  id: string;
  slug: string;
  titleBn: string;
  titleEn: string;
  titleAr?: string;
  excerptBn: string;
  excerptEn: string;
  excerptAr?: string;
  bodyMarkdownBn: string;
  bodyMarkdownEn: string;
  bodyMarkdownAr?: string;
  category: string;
  tags: string[];
  coverImageUrl?: string;
  authorName: string;
  publishedAt: string;
  status: BlogPostStatus;
  source?: 'manual' | 'api' | 'api-webhook' | 'ai-publisher' | 'ai-assistant';
}

export interface BlogAutomationConfig {
  enabled: boolean;
  apiKey: string;
  defaultAuthorName: string;
  defaultCategory: string;
}

export type InstitutionalCalendarCategory =
  | 'govt-holiday'
  | 'islamic-holiday'
  | 'academic'
  | 'institutional'
  | 'google-sync';

export interface InstitutionalCalendarEvent {
  id: string;
  titleBn: string;
  titleEn: string;
  date: string;
  time?: string;
  category: InstitutionalCalendarCategory;
  descriptionBn?: string;
  source: 'local' | 'google' | 'govt' | 'islamic';
  googleEventId?: string;
  googleHtmlLink?: string;
  htmlLink?: string;
}

export type MobileBottomBarSlotTarget =
  | 'home'
  | 'courses'
  | 'admission'
  | 'blog'
  | 'contact'
  | 'hifz-tree'
  | 'notices'
  | 'careers'
  | 'fees';

export interface MobileBottomBarSlot {
  id: string;
  target: MobileBottomBarSlotTarget;
  labelBn: string;
  labelEn: string;
  labelAr?: string;
  highlighted?: boolean;
}

export interface MobileBottomBarConfig {
  enabled: boolean;
  slots: MobileBottomBarSlot[];
}

export type VirtualOfficePlatform = 'Google Meet' | 'Zoom' | 'WhatsApp Video' | 'Jitsi';

export type VirtualOfficeStatusMode = 'AUTO' | 'ONLINE_LIVE' | 'BUSY_IN_SESSION' | 'OFFLINE';

export interface VirtualOfficeDesk {
  id: string;
  nameBn: string;
  nameEn: string;
  nameAr?: string;
  officerNameBn: string;
  officerNameEn: string;
  platform: VirtualOfficePlatform;
  roomUrl: string;
  zoomMeetingId?: string;
  zoomPasscode?: string;
  active?: boolean;
}

export interface VirtualOfficeConfig {
  enabled: boolean;
  manualStatus: VirtualOfficeStatusMode;
  timezone: string;
  officeDays: number[];
  openTime: string;
  closeTime: string;
  primaryPlatform: VirtualOfficePlatform;
  dutyOfficerNameBn: string;
  dutyOfficerNameEn: string;
  dutyOfficerTitleBn: string;
  dutyOfficerTitleEn: string;
  dutyOfficerPhone: string;
  dutyOfficerPhotoUrl: string;
  roomUrl: string;
  zoomMeetingId?: string;
  zoomPasscode?: string;
  desks: VirtualOfficeDesk[];
}

export interface PublicVirtualOfficeStatus {
  enabled: boolean;
  status: VirtualOfficeStatusMode;
  isOpen: boolean;
  platform: VirtualOfficePlatform;
  timezone: string;
  openTime: string;
  closeTime: string;
  dutyOfficerNameBn: string;
  dutyOfficerNameEn: string;
  dutyOfficerTitleBn: string;
  dutyOfficerTitleEn: string;
  dutyOfficerPhotoUrl: string;
  dutyOfficerPhone: string;
  desks: Array<{
    id: string;
    nameBn: string;
    nameEn: string;
    nameAr?: string;
    officerNameBn: string;
    officerNameEn: string;
    platform: VirtualOfficePlatform;
  }>;
}

export type VirtualOfficeSessionStatus =
  | 'Joined'
  | 'Counseled'
  | 'Enrolled'
  | 'Missed — Call Back';

export interface VirtualOfficeSession {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  deskId?: string;
  deskNameBn: string;
  deskName?: string;
  platform?: VirtualOfficePlatform;
  topic?: string;
  department?: string;
  preferredCallbackTime?: string;
  deskMode: 'ONLINE_LIVE' | 'BUSY_IN_SESSION' | 'OFFLINE';
  sessionStatus: VirtualOfficeSessionStatus;
  checkedInAt: string;
}

export interface CMSState {
  news: NewsItem[];
  notices: NoticeItem[];
  courses: CourseItem[];
  events: EventItem[];
  leads: AdmissionLead[];
  users: AdminUser[];
  emails: EmailNotificationLog[];
  settings: SiteSettings;
  popupConfig: PopupNoticeConfig;
  aiBotConfig: AIBotConfig;
  whatsappConfig: WhatsAppBotConfig;
  campusVideo: CampusVideoConfig;
  departmentVideos: DepartmentVideoItem[];
  activityVideos: ActivityVideoItem[];
  guardianReels: GuardianReelItem[];
  feeCalculatorConfig: FeeCalculatorConfig;
  // Infographic & Institution Configs
  educationMethodConfig: EducationMethodConfig;
  tenYearPlanConfig: TenYearPlanConfig;
  dayCareRoutineConfig: DayCareRoutineConfig;
  transportConfig: TransportAndLandmarkConfig;
  admissionExtraConfig: AdmissionExtraConfig;
  uniformConfig: UniformGuideConfig;
  madrasahContextConfig: MadrasahContextConfig;
  hifzTreeConfig: HifzTreeConfig;
  photoGallery: PhotoGalleryItem[];
  complaints: GuardianComplaintItem[];
  rbacMatrix: RolePermissionMatrix;
  leaveRequests: TeacherLeaveRequest[];
  versionManager?: AppVersionManagerConfig;
  careerJobs?: CareerJobCircular[];
  careerApplications?: CareerApplicationItem[];
  careerCandidates?: CareerCandidateAccount[];
  admissionTokens2027?: AdmissionToken2027[];
  blogPosts?: BlogPostItem[];
  blogAutomationConfig?: BlogAutomationConfig;
  calendarEvents?: InstitutionalCalendarEvent[];
  mobileBottomBar?: MobileBottomBarConfig;
  virtualOfficeConfig?: VirtualOfficeConfig;
  virtualOfficeSessions?: VirtualOfficeSession[];
}
