import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHafizBiography,
  buildHafizCertificateCode,
  DEFAULT_EXTERNAL_PORTALS,
  isValidExternalPortalUrl,
  MAHARAT_LOGO_COLORS,
  removeBotQAItem,
  reorderSuggestedQuestions,
  resolveExternalPortals,
  sortHifzLineage,
  upsertBotQAItem,
} from './portalAndHifzLogic';
import { BotQAItem, HafizGraduateItem } from '../types/cms';

test('External ERP Portals: resolves verified live student & admin ERP links and validates URLs', () => {
  const defaults = resolveExternalPortals(undefined);
  assert.equal(defaults.length, 2);
  assert.equal(defaults[0].url, 'http://103.166.74.212:2020/student_login.aspx');
  assert.equal(defaults[1].url, 'http://103.166.74.212:2020/login.aspx');
  assert.equal(isValidExternalPortalUrl('http://103.166.74.212:2020/login.aspx'), true);
  assert.equal(isValidExternalPortalUrl('javascript:alert(1)'), false);
  assert.equal(MAHARAT_LOGO_COLORS.navyPrimary, '#192f64');
  assert.equal(MAHARAT_LOGO_COLORS.tealPrimary, '#005a6e');
  assert.equal(MAHARAT_LOGO_COLORS.goldPrimary, '#9c7a32');
});

test('Hifz Lineage Timeline: sorts 1st->30th or 30th->1st and builds certificate codes & biographies', () => {
  const sample: HafizGraduateItem[] = [
    {
      id: 'h-30',
      serialNumber: 30,
      serialLabelBn: '৩০তম হাফেজ',
      nameBn: 'আব্দুল্লাহ',
      nameEn: 'Abdullah',
      classNameBn: 'হিফজ বিভাগ',
      completionDate: '২০২৬',
      completionYear: '2026',
      durationNoteBn: '২ বছর',
      badgeTextBn: '৩০তম',
      descriptionBn: 'সফলভাবে হিফজ সম্পন্ন করেছে।',
      photoUrl: '/test.jpg',
    },
    {
      id: 'h-1',
      serialNumber: 1,
      serialLabelBn: '১ম হাফেজ',
      nameBn: 'আহমাদ',
      nameEn: 'Ahmad',
      classNameBn: 'হিফজ বিভাগ',
      completionDate: '২০২২',
      completionYear: '2022',
      durationNoteBn: '২.৫ বছর',
      badgeTextBn: '১ম',
      descriptionBn: 'প্রতিষ্ঠানের প্রথম হাফেজ।',
      photoUrl: '/test1.jpg',
      biographyBn: 'কাস্টম বায়োগ্রাফি টেক্সট।',
      certificateCode: 'CUSTOM-001',
    },
  ];

  const asc = sortHifzLineage(sample, 'asc');
  assert.equal(asc[0].serialNumber, 1);
  assert.equal(asc[1].serialNumber, 30);

  const desc = sortHifzLineage(sample, 'desc');
  assert.equal(desc[0].serialNumber, 30);

  assert.equal(buildHafizCertificateCode(sample[0]), 'MMM-HIFZ-2026-030');
  assert.equal(buildHafizCertificateCode(sample[1]), 'CUSTOM-001');
  assert.equal(buildHafizBiography(sample[1]), 'কাস্টম বায়োগ্রাফি টেক্সট।');
  assert.ok(buildHafizBiography(sample[0]).includes('হাফেজ আব্দুল্লাহ'));
  const prefixedBio = buildHafizBiography({ ...sample[0], nameBn: 'হাফেজ মাহির আসহাব' });
  assert.ok(prefixedBio.startsWith('হাফেজ মাহির আসহাব'));
  assert.equal(prefixedBio.includes('হাফেজ হাফেজ'), false);
});

test('Chatbot Q&A Organizer: reorders suggested questions and upserts/removes Q&A records immutably', () => {
  const reordered = reorderSuggestedQuestions(['Q1', 'Q2', 'Q3'], 1, 'up');
  assert.deepEqual(reordered, ['Q2', 'Q1', 'Q3']);

  const initial: BotQAItem[] = [
    { id: 'qa-1', question: 'ভর্তি ফি?', keywords: ['ফি'], answer: 'বিস্তারিত', category: 'Admission', active: true },
  ];
  const added = upsertBotQAItem(initial, {
    id: 'qa-2',
    question: 'হোস্টেল আছে?',
    keywords: ['হোস্টেল'],
    answer: 'হ্যাঁ, আবাসিক সুবিধা রয়েছে।',
    category: 'Hostel',
    active: true,
  });
  assert.equal(added.length, 2);

  const updated = upsertBotQAItem(added, { ...added[0], answer: 'আপডেটেড উত্তর' });
  assert.equal(updated.length, 2);
  assert.equal(updated[0].answer, 'আপডেটেড উত্তর');

  const afterRemove = removeBotQAItem(updated, 'qa-1');
  assert.equal(afterRemove.length, 1);
  assert.equal(afterRemove[0].id, 'qa-2');
});
