import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceLeadToNextStage,
  DEFAULT_BOYS_CAMPUS_EMBED_URL,
  DEFAULT_BOYS_CAMPUS_MAP_URL,
  DEFAULT_CAREER_JOBS,
  getLeadStageProgressPercent,
  resolveGoogleMapsEmbedUrl,
  validateCandidateRegistration,
  validateCareerApplication,
} from './careerAndMapsLogic';

test('Google Maps URL resolver: converts verified Maharat short link, @lat,lng, !3d!4d, and plain addresses into embed URLs', () => {
  // 1. User-supplied verified Maharat Boys & Main Campus link
  const maharatEmbed = resolveGoogleMapsEmbedUrl(DEFAULT_BOYS_CAMPUS_MAP_URL);
  assert.equal(maharatEmbed, DEFAULT_BOYS_CAMPUS_EMBED_URL);
  assert.ok(maharatEmbed.includes('23.8747771,90.3803319'));
  assert.ok(maharatEmbed.includes('output=embed'));

  // 2. Full Google Maps place URL with !3dLAT!4dLNG
  const pinEmbed = resolveGoogleMapsEmbedUrl(
    'https://www.google.com/maps/place/Test/@23.875,90.381,18z/data=!3d23.874123!4d90.380456'
  );
  assert.ok(pinEmbed.includes('23.874123,90.380456'));
  assert.ok(pinEmbed.includes('output=embed'));

  // 3. Plain campus address string
  const addrEmbed = resolveGoogleMapsEmbedUrl('House 7, Road 17/A, Sector 12, Uttara, Dhaka');
  assert.ok(addrEmbed.includes('output=embed'));
  assert.ok(addrEmbed.includes('Sector%2012'));
});

test('Career Portal: validates guest & registered job applications and candidate account registration', () => {
  assert.ok(DEFAULT_CAREER_JOBS.length >= 4);

  const invalidApp = validateCareerApplication({
    jobId: 'job-hifz-ustad',
    jobTitleBn: 'হিফজ শিক্ষক',
    applicantName: 'A',
    phone: '123',
    email: 'invalid-email',
    educationBn: '',
    experienceYearsBn: '1 year',
  });
  assert.equal(invalidApp.valid, false);

  const validApp = validateCareerApplication({
    jobId: 'job-hifz-ustad',
    jobTitleBn: 'সিনিয়র হিফজুল কুরআন শিক্ষক',
    applicantName: 'হাফেজ মাহমুদুল হাসান',
    phone: '01711-223344',
    email: 'mahmud@example.com',
    educationBn: 'হাফেজে কুরআন ও ফাজিল',
    experienceYearsBn: '৩ বছর',
  });
  assert.equal(validApp.valid, true);

  // Candidate account duplicate email prevention
  const existing = [
    {
      id: 'cand-1',
      fullName: 'Test User',
      email: 'teacher@maharat.edu.bd',
      phone: '01711223344',
      password: 'secret',
      createdAt: '2026-11-20',
    },
  ];
  const dupRes = validateCandidateRegistration(
    {
      fullName: 'Another User',
      email: 'TEACHER@maharat.edu.bd',
      phone: '01811223344',
      password: 'password123',
    },
    existing
  );
  assert.equal(dupRes.valid, false);

  const newRes = validateCandidateRegistration(
    {
      fullName: 'নতুন প্রার্থী',
      email: 'candidate@example.com',
      phone: '01811223344',
      password: 'pass123',
    },
    existing
  );
  assert.equal(newRes.valid, true);
});

test('Lead to Admission Pipeline: advances stage step-by-step and calculates progress percentage', () => {
  assert.equal(advanceLeadToNextStage('New'), 'Contacted');
  assert.equal(advanceLeadToNextStage('Contacted'), 'Interested');
  assert.equal(advanceLeadToNextStage('Interested'), 'Follow-up');
  assert.equal(advanceLeadToNextStage('Follow-up'), 'Campus Visit');
  assert.equal(advanceLeadToNextStage('Campus Visit'), 'Admitted');
  assert.equal(advanceLeadToNextStage('Admitted'), 'Admitted');
  assert.equal(getLeadStageProgressPercent('Admitted'), 100);
  assert.ok(getLeadStageProgressPercent('Campus Visit') > getLeadStageProgressPercent('New'));
});
