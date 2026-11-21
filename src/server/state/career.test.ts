import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CMSState, CareerApplicationItem } from '../../types/cms';
import { MAX_STATUS_RESULTS, lookupApplicationStatus } from './career';

const application = (overrides: Partial<CareerApplicationItem> = {}): CareerApplicationItem => ({
  id: 'app-1',
  jobId: 'job-1',
  jobTitleBn: 'হিফজ শিক্ষক',
  applicantName: 'Abdur Rahman Khan',
  phone: '01711-223344',
  whatsapp: '01811-223344',
  email: 'Rahman@Example.test',
  educationBn: 'Kamil',
  experienceYearsBn: '5',
  expectedSalaryBn: '30000',
  paymentTrxId: 'TRX123',
  cvFileDataUrl: 'data:application/pdf;base64,AAAA',
  isGuestApplication: true,
  status: 'Shortlisted',
  hrNote: 'Interview on Saturday',
  submittedAt: 'Nov 21, 2026, 10:32 AM',
  ...overrides,
});

const stateWith = (apps: CareerApplicationItem[]): CMSState => ({ careerApplications: apps }) as unknown as CMSState;

test('status lookup matches phone, WhatsApp, email (case-insensitive) and application id', () => {
  const state = stateWith([application()]);
  for (const query of ['01711223344', '+880 1811-223344', 'rahman@example.test', 'APP-1']) {
    assert.equal(lookupApplicationStatus(state, query).length, 1, query);
  }
  assert.equal(lookupApplicationStatus(state, '01999999999').length, 0);
  assert.equal(lookupApplicationStatus(state, '   ').length, 0);
});

test('status lookup returns status fields only, with the first name', () => {
  const [entry] = lookupApplicationStatus(stateWith([application()]), 'rahman@example.test');
  assert.deepEqual(entry, {
    id: 'app-1',
    applicantName: 'Abdur',
    jobTitleBn: 'হিফজ শিক্ষক',
    status: 'Shortlisted',
    submittedAt: 'Nov 21, 2026, 10:32 AM',
    hrNote: 'Interview on Saturday',
  });
  const noNote = lookupApplicationStatus(stateWith([application({ hrNote: '' })]), 'app-1')[0];
  assert.equal('hrNote' in noNote, false);
});

test('status lookup caps the number of results', () => {
  const apps = Array.from({ length: MAX_STATUS_RESULTS + 5 }, (_, i) => application({ id: `app-${i}` }));
  assert.equal(lookupApplicationStatus(stateWith(apps), '01711223344').length, MAX_STATUS_RESULTS);
});
