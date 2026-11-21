import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AdmissionLead, CMSState } from '../../types/cms';
import type { SyncOp } from '../contracts';
import { countUploads, planPublicSubmit, storedUploadChars, type PublicSubmitContext } from './public-submit';
import { parsePublicSubmit, type PublicItemInput } from './validate';

function ctx(candidate: PublicSubmitContext['candidate'] = null): PublicSubmitContext {
  let n = 0;
  return { now: new Date('2026-01-01T00:00:00Z'), timestamp: 'Jan 01, 2026, 06:00 AM', newId: (p) => `${p}-${++n}`, candidate };
}

const existingLead = {
  id: 'lead-old',
  name: 'Old',
  phone: '+880 1711-000000',
  email: '',
  courseId: 'c1',
  courseTitle: 'Course',
  message: '',
  status: 'Contacted',
  submittedAt: '',
  source: 'Quick Inquiry',
  priority: 'Cold',
  notes: [{ id: 'n0', authorName: 'Staff', timestamp: '', text: 'called' }],
} satisfies AdmissionLead;

function state(): CMSState {
  return {
    leads: [existingLead],
    courses: [{ id: 'c1', title: 'Hifz Course' }],
    settings: { email: 'office@x.test', instituteName: 'MMM' },
    careerJobs: [
      { id: 'job-1', titleBn: 'শিক্ষক', active: true },
      { id: 'job-2', titleBn: 'বন্ধ', active: false },
    ],
  } as unknown as CMSState;
}

function items(raw: unknown[]): PublicItemInput[] {
  const r = parsePublicSubmit({ items: raw });
  assert.ok(r.ok, r.ok ? '' : r.error);
  return r.ok ? r.items : [];
}

const upserts = (ops: SyncOp[]) => ops.filter((o): o is Extract<SyncOp, { op: 'upsert' }> => o.op === 'upsert');

test('new lead gets server id, status New and the resolved course title', () => {
  const plan = planPublicSubmit(
    items([{ key: 'leads', item: { id: 'evil', name: 'New', phone: '01822000000', courseId: 'c1', source: 'Quick Inquiry', status: 'Enrolled' } }]),
    state(),
    ctx()
  );
  assert.ok(plan.ok);
  if (!plan.ok) return;
  const lead = upserts(plan.ops)[0].item as unknown as AdmissionLead;
  assert.equal(lead.status, 'New');
  assert.equal(lead.courseTitle, 'Hifz Course');
  assert.equal(lead.priority, 'Warm');
  assert.notEqual(lead.id, 'evil');
  assert.deepEqual(plan.ids, [lead.id]);
  assert.deepEqual(plan.ops.at(-1), { op: 'order', key: 'leads', ids: [lead.id] });
});

test('full admission form lead stays New but is marked Hot', () => {
  const plan = planPublicSubmit(
    items([{ key: 'leads', item: { name: 'S', phone: '01822000001', source: 'Full Admission Form', detailedData: { studentNameBn: 'স' } } }]),
    state(),
    ctx()
  );
  assert.ok(plan.ok);
  if (!plan.ok) return;
  const lead = upserts(plan.ops)[0].item as unknown as AdmissionLead;
  assert.equal(lead.status, 'New');
  assert.equal(lead.priority, 'Hot');
});

test('the same student on a known phone is merged as a note, keeping staff fields', () => {
  const plan = planPublicSubmit(
    items([
      { key: 'leads', item: { name: 'Old (অভিভাবক: Karim)', phone: '01711000000', message: 'second try', source: 'Registration Form' } },
      { key: 'leads', item: { name: ' old ', phone: '০১৭-১১০০-০০০০', source: 'Quick Inquiry' } },
    ]),
    state(),
    ctx()
  );
  assert.ok(plan.ok);
  if (!plan.ok) return;
  assert.deepEqual(plan.ids, ['lead-old', 'lead-old']);
  const writes = upserts(plan.ops);
  assert.equal(writes.length, 1);
  const lead = writes[0].item as unknown as AdmissionLead;
  assert.equal(lead.status, 'Contacted');
  assert.equal(lead.priority, 'Cold');
  assert.equal(lead.name, 'Old');
  assert.equal(lead.notes?.length, 3);
  assert.match(lead.notes?.[1].text || '', /second try/);
  assert.equal(plan.ops.some((o) => o.op === 'order'), false);
});

test('emails are addressed to the office, complaints forced to New', () => {
  const plan = planPublicSubmit(
    items([
      { key: 'emails', item: { subject: 'New lead', body: 'b', recipientEmail: 'attacker@evil.test' } },
      { key: 'complaints', item: { guardianName: 'G', phone: '01711000000', category: 'পরামর্শ (Suggestion)', message: 'm', status: 'Resolved', adminReply: 'x' } },
    ]),
    state(),
    ctx()
  );
  assert.ok(plan.ok);
  if (!plan.ok) return;
  const [email, complaint] = upserts(plan.ops).map((o) => o.item);
  assert.equal(email.recipientEmail, 'office@x.test');
  assert.equal(email.recipientType, 'Admin');
  assert.equal(complaint.status, 'New');
  assert.equal('adminReply' in complaint, false);
});

test('career applications bind to the candidate session and refuse closed jobs', () => {
  const app = { jobId: 'job-1', applicantName: 'Ali', phone: '01711000000', email: 'a@x.test', educationBn: 'BA' };
  const guest = planPublicSubmit(items([{ key: 'careerApplications', item: app }]), state(), ctx());
  assert.ok(guest.ok);
  if (guest.ok) {
    const item = upserts(guest.ops)[0].item;
    assert.equal(item.isGuestApplication, true);
    assert.equal(item.status, 'Received');
    assert.equal(item.jobTitleBn, 'শিক্ষক');
  }
  const signedIn = planPublicSubmit(
    items([{ key: 'careerApplications', item: app }]),
    state(),
    ctx({ kind: 'candidate', candidateId: 'cand-1', email: 'me@x.test', sv: 0 })
  );
  assert.ok(signedIn.ok);
  if (signedIn.ok) {
    const item = upserts(signedIn.ops)[0].item;
    assert.equal(item.isGuestApplication, false);
    assert.equal(item.applicantAccountEmail, 'me@x.test');
  }
  const closed = planPublicSubmit(items([{ key: 'careerApplications', item: { ...app, jobId: 'job-2' } }]), state(), ctx());
  assert.equal(closed.ok, false);
});

test('a sibling on the same guardian phone gets a lead of its own, linked by a note', () => {
  const plan = planPublicSubmit(
    items([
      {
        key: 'leads',
        item: {
          name: 'Sibling Two',
          phone: '01711000000',
          source: 'Full Admission Form',
          detailedData: { studentNameEn: 'Sibling Two', fatherMobile: '01711000000', targetClass: 'Class 2' },
        },
      },
    ]),
    state(),
    ctx()
  );
  assert.ok(plan.ok);
  if (!plan.ok) return;
  const lead = upserts(plan.ops)[0].item as unknown as AdmissionLead;
  assert.notEqual(lead.id, 'lead-old');
  assert.equal(lead.detailedData?.targetClass, 'Class 2', 'the full form is kept, not reduced to a note');
  assert.match(lead.notes?.at(-1)?.text || '', /lead-old/);
  assert.deepEqual(plan.ops.at(-1), { op: 'order', key: 'leads', ids: [lead.id] });
});

test('a second, different full form for the same student never replaces or drops the first', () => {
  const withForm = {
    ...existingLead,
    detailedData: { studentNameEn: 'Old', targetClass: 'Class 1' },
  } as unknown as AdmissionLead;
  const base = { ...state(), leads: [withForm] } as CMSState;
  const resubmit = (targetClass: string) =>
    planPublicSubmit(
      items([{ key: 'leads', item: { name: 'Old', phone: '01711000000', source: 'Full Admission Form', detailedData: { studentNameEn: 'Old', targetClass } } }]),
      base,
      ctx()
    );
  const different = resubmit('Class 5');
  assert.ok(different.ok);
  if (different.ok) {
    const lead = upserts(different.ops)[0].item as unknown as AdmissionLead;
    assert.notEqual(lead.id, 'lead-old');
    assert.equal(lead.detailedData?.targetClass, 'Class 5');
  }
  const identical = resubmit('Class 1');
  assert.ok(identical.ok);
  if (identical.ok) assert.deepEqual(identical.ids, ['lead-old']);
});

test('phones in Bengali digits and landlines are accepted; junk is not', () => {
  const lead = (phone: string) => parsePublicSubmit({ items: [{ key: 'leads', item: { name: 'N', phone, source: 'Quick Inquiry' } }] });
  const bengali = lead('০১৭১২৩৪৫৬৭৮');
  assert.ok(bengali.ok);
  if (bengali.ok && bengali.items[0].key === 'leads') assert.equal(bengali.items[0].item.phone, '01712345678');
  assert.ok(lead('02-8912345').ok);
  assert.equal(lead('abcdef').ok, false);
  assert.equal(lead('12345').ok, false);
});

test('upload accounting counts inline files only', () => {
  const png = `data:image/png;base64,${'A'.repeat(400)}`;
  const pdf = `data:application/pdf;base64,${'A'.repeat(800)}`;
  const submitted = items([
    { key: 'leads', item: { name: 'A', phone: '01711000001', source: 'Full Admission Form', detailedData: { studentPhotoUrl: png } } },
    { key: 'leads', item: { name: 'B', phone: '01711000002', source: 'Quick Inquiry' } },
    { key: 'careerApplications', item: { jobId: 'job-1', applicantName: 'Ali', phone: '01711000003', email: 'a@x.test', educationBn: 'BA', cvFileDataUrl: pdf } },
    { key: 'careerApplications', item: { jobId: 'job-1', applicantName: 'Ali', phone: '01711000003', email: 'a@x.test', educationBn: 'BA', cvFileDataUrl: 'https://example.org/cv.pdf' } },
  ]);
  assert.deepEqual(countUploads(submitted), { files: 2, chars: png.length + pdf.length });

  const stored = {
    leads: [{ id: 'l1', detailedData: { studentPhotoUrl: png } }, { id: 'l2' }],
    careerApplications: [{ id: 'a1', cvFileDataUrl: pdf }, { id: 'a2', cvFileDataUrl: 'https://example.org/cv.pdf' }],
  } as unknown as CMSState;
  assert.equal(storedUploadChars(stored), png.length + pdf.length);
  assert.equal(storedUploadChars({} as CMSState), 0);
});
