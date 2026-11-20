import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildIcsCalendarFile,
  calculateOfficial2027TokenFees,
  classifyContentDeterministically,
  findCareerApplicationsByContact,
  findHafizByCertificateCode,
  getNextLanguage,
  matchAdmissionTokenByContact,
  recomputeTokenTotals,
} from './admissionToken2027Logic.ts';
import {
  DEFAULT_VIRTUAL_OFFICE_CONFIG,
  computeVirtualOfficeAnalytics,
  evaluateVirtualOfficeLiveStatus,
  sanitizeVirtualOfficeForPublic,
  virtualOfficeCheckinSchema,
} from './virtualOfficeLogic.ts';
import { compareSemver, resolveVersionManagerConfig } from './versionLogic.ts';
import type { AdmissionToken2027, CareerApplicationItem, HafizGraduateItem } from '../types/cms.ts';

test('Official 2027 Fee Guide: Class 6 Hifz Hostel New Student matches PDF worked example', () => {
  const res = calculateOfficial2027TokenFees({
    classKey: 'class-6-8',
    studentType: 'new',
    section: 'Hifz',
    stayMode: 'hostel',
    firstTimeStay: true,
    transport: false,
  });
  // New base = 34,500, Lab = 0 (Hifz has no lab fee), First-time Hostel = 18,500 -> Part A = 53,000
  assert.equal(res.baseOneTime, 34500);
  assert.equal(res.labFee, 0);
  assert.equal(res.hostelAdmissionFee, 18500);
  assert.equal(res.subtotalA, 53000);
  // Monthly Tuition Class 6-8 Hifz = 7,000 + Hostel 14,500 -> Part B = 21,500
  assert.equal(res.monthlyTuition, 7000);
  assert.equal(res.monthlyStayFee, 14500);
  assert.equal(res.subtotalB, 21500);
  assert.equal(res.grandTotal, 74500);
});

test('Official 2027 Fee Guide: Class 6-8 General New Non-Residential includes Lab Fee (+2,000)', () => {
  const res = calculateOfficial2027TokenFees({
    classKey: 'class-6-8',
    studentType: 'new',
    section: 'General',
    stayMode: 'non-residential',
    firstTimeStay: false,
    transport: true,
    transportAmount: 5500,
  });
  assert.equal(res.labFee, 2000);
  assert.equal(res.subtotalA, 36500);
  assert.equal(res.monthlyTuition, 6000);
  assert.equal(res.monthlyTransportFee, 5500);
  assert.equal(res.subtotalB, 11500);
  assert.equal(res.grandTotal, 48000);
});

test('Official 2027 Fee Guide: Old Re-admission Play/Class 3-5 omits Form & Admission Fee', () => {
  const res = calculateOfficial2027TokenFees({
    classKey: 'class-3-5',
    studentType: 'old',
    section: 'General',
    stayMode: 'day-care',
    firstTimeStay: false,
    transport: false,
  });
  assert.equal(res.baseOneTime, 24000);
  assert.equal(res.hostelAdmissionFee, 0);
  assert.equal(res.subtotalA, 24000);
  assert.equal(res.monthlyTuition, 5500);
  assert.equal(res.monthlyStayFee, 12500);
  assert.equal(res.subtotalB, 18000);

  // Verify custom payable discount recalculation
  const discounted = res.lineItems.map((it) =>
    it.no === 3 ? { ...it, payableAmount: 9000, comment: 'Principal 3k waiver' } : it
  );
  const totals = recomputeTokenTotals(discounted);
  assert.equal(totals.subtotalA, 21000);
  assert.equal(totals.totalDiscount, 3000);
});

test('Admission Token 2027 auto-matches Active tokens by normalized Phone or Email', () => {
  const baseFees = calculateOfficial2027TokenFees({
    classKey: 'play',
    studentType: 'new',
    section: 'General',
    stayMode: 'non-residential',
    firstTimeStay: false,
    transport: false,
  });
  const tokens: AdmissionToken2027[] = [
    {
      id: 'tok-1',
      tokenCode: 'MMM-2027-001',
      studentName: 'Abdullah Al-Mahmud',
      studentIdNo: 'MMM-2701',
      admissionDate: '2026-11-20',
      classKey: 'play',
      classNameLabel: 'Play Group',
      studentType: 'new',
      section: 'General',
      stayMode: 'non-residential',
      firstTimeStay: false,
      transport: false,
      transportAmount: 0,
      guardianPhone: '+880 1711-223344',
      guardianEmail: 'Guardian@Example.com',
      lineItems: baseFees.lineItems,
      subtotalA: baseFees.subtotalA,
      subtotalB: baseFees.subtotalB,
      grandTotal: baseFees.grandTotal,
      status: 'Active',
      issuedBy: 'Principal',
      createdAt: '2026-11-20',
    },
  ];

  assert.equal(matchAdmissionTokenByContact(tokens, { phone: '01711223344' })?.tokenCode, 'MMM-2027-001');
  assert.equal(
    matchAdmissionTokenByContact(tokens, { email: 'guardian@example.com' })?.tokenCode,
    'MMM-2027-001'
  );
  assert.equal(matchAdmissionTokenByContact(tokens, { phone: '01999999999' }), null);
});

test('Language cycling transitions bn -> en -> ar -> bn directly', () => {
  assert.equal(getNextLanguage('bn'), 'en');
  assert.equal(getNextLanguage('en'), 'ar');
  assert.equal(getNextLanguage('ar'), 'bn');
});

test('Career No-Login Status Tracker matches by Phone, WhatsApp, or Email', () => {
  const apps: CareerApplicationItem[] = [
    {
      id: 'APP-901',
      jobId: 'job-1',
      jobTitleBn: 'সহকারী শিক্ষক (ইংরেজি)',
      applicantName: 'Md. Karim',
      phone: '01812-345678',
      whatsapp: '+8801912345678',
      email: 'karim.teacher@example.com',
      educationBn: 'MA English',
      experienceYearsBn: '4 years',
      isGuestApplication: true,
      status: 'Shortlisted',
      hrNote: 'Invited for Saturday written & viva test at 9 AM.',
      submittedAt: '2026-11-18',
    },
  ];
  assert.equal(findCareerApplicationsByContact(apps, '01812345678').length, 1);
  assert.equal(findCareerApplicationsByContact(apps, '01912-345678').length, 1);
  assert.equal(findCareerApplicationsByContact(apps, 'KARIM.TEACHER@example.com').length, 1);
  assert.equal(findCareerApplicationsByContact(apps, '01700000000').length, 0);
});

test('QR Certificate verifier resolves Hafez graduate by certificate code', () => {
  const grads: HafizGraduateItem[] = [
    {
      id: 'hafiz-30',
      serialNumber: 30,
      serialLabelBn: '৩০তম হাফেজ',
      nameBn: 'মোঃ তানজীম ইসলাম',
      nameEn: 'Md. Tanzim Islam',
      classNameBn: 'হিফজ বিভাগ',
      completionDate: '2026-10-01',
      completionYear: '2026',
      durationNoteBn: '১ বছর ৬ মাস',
      badgeTextBn: '৩০তম হাফেজ',
      descriptionBn: 'সফলভাবে হিফজ সম্পন্ন',
      photoUrl: '/assets/maharat/hafez-30.jpg',
    },
  ];
  assert.equal(findHafizByCertificateCode(grads, 'MMM-HFZ-2026-30')?.serialNumber, 30);
  assert.equal(findHafizByCertificateCode(grads, 'INVALID-CODE'), null);
});

test('AI Smart Publisher classifies new Hafez Facebook post as 31st Hafez in Hifz Tree', () => {
  const res = classifyContentDeterministically(
    'আলহামদুলিল্লাহ! মাহারাত মডেল মাদ্রাসার নতুন হাফেজ মোঃ ইউসুফ আলী সফলভাবে ৩০ পারা কুরআন হিফজ সম্পন্ন করেছে।',
    'https://facebook.com/maharatmodelmadrasah/posts/12345',
    30
  );
  assert.equal(res.targetSection, 'hifz-tree');
  assert.equal(res.hafizCandidate?.serialNumber, 31);
  assert.ok(res.hafizCandidate?.facebookPostUrl?.includes('facebook.com'));
});

test('ICS calendar builder exports valid RFC-5545 calendar', () => {
  const ics = buildIcsCalendarFile([
    {
      id: 'ev-1',
      titleBn: 'বিজয় দিবস',
      titleEn: 'Victory Day',
      date: '2026-12-16',
      category: 'govt-holiday',
      source: 'govt',
    },
  ]);
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261216'));
  assert.ok(ics.includes('SUMMARY:Victory Day'));
});

test('Virtual Office: Zod gate enforces Full Name, Phone, Email and sanitizer NEVER leaks URLs', () => {
  const invalid = virtualOfficeCheckinSchema.safeParse({
    fullName: 'A',
    phone: '123',
    email: 'not-an-email',
  });
  assert.equal(invalid.success, false);

  const valid = virtualOfficeCheckinSchema.safeParse({
    fullName: 'Haji Abdur Rahman',
    phone: '01886-340308',
    email: 'rahman@example.com',
    topic: 'Admission Counseling',
  });
  assert.equal(valid.success, true);

  const publicStatus = sanitizeVirtualOfficeForPublic(DEFAULT_VIRTUAL_OFFICE_CONFIG);
  const serialized = JSON.stringify(publicStatus);
  assert.equal(serialized.includes('meet.google.com'), false);
  assert.equal(serialized.includes('zoom.us'), false);
  assert.equal(serialized.includes('MMM2027'), false);

  assert.equal(
    evaluateVirtualOfficeLiveStatus({ ...DEFAULT_VIRTUAL_OFFICE_CONFIG, manualStatus: 'BUSY_IN_SESSION' }),
    'BUSY_IN_SESSION'
  );

  const analytics = computeVirtualOfficeAnalytics([
    {
      id: 'vo-1',
      fullName: 'Test Guardian',
      phone: '01886340308',
      email: 't@e.com',
      deskId: 'desk-admission',
      deskNameBn: 'ভর্তি ও একাডেমিক ডেস্ক',
      deskName: 'Admission',
      topic: 'Fee',
      platform: 'Google Meet',
      deskMode: 'ONLINE_LIVE',
      sessionStatus: 'Enrolled',
      checkedInAt: '2026-11-20T10:30:00.000Z',
    },
  ]);
  assert.equal(analytics.totalVisits, 1);
  assert.equal(analytics.conversionRate, 100);
});

test('Version Manager auto-upgrades persisted v1.0.0 state to v2.2.0 with structured release notes', () => {
  assert.equal(compareSemver('2.2.0', '1.0.0'), 1);
  const resolved = resolveVersionManagerConfig({
    enabled: true,
    showInPublicFooter: true,
    showInAdminDashboard: true,
    activeVersion: '1.0.0',
    releases: [
      {
        id: 'old-1',
        version: '1.0.0',
        tag: 'v1.0.0',
        title: 'Old',
        notes: 'Old notes',
        createdAt: '2026-01-01',
        createdBy: 'Admin',
      },
    ],
  });
  assert.equal(resolved.activeVersion, '2.2.0');
  assert.equal(resolved.releases[0].version, '2.2.0');
  assert.ok((resolved.releases[0].added?.length || 0) >= 5);
});
