import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_PHOTO_BYTES,
  MAX_SYNC_OPS,
  parseDataUrl,
  parsePublicSubmit,
  parseSyncRequest,
} from './validate';

const base64OfSize = (bytes: number) => 'A'.repeat(Math.ceil(bytes / 3) * 4);

test('parseDataUrl reports mime and decoded size', () => {
  assert.deepEqual(parseDataUrl('data:image/png;base64,AAAA'), { mime: 'image/png', bytes: 3 });
  assert.deepEqual(parseDataUrl('data:application/pdf;name=cv.pdf;base64,AA=='), { mime: 'application/pdf', bytes: 1 });
  assert.equal(parseDataUrl('data:image/png;base64,AAA'), null);
  assert.equal(parseDataUrl('javascript:alert(1)'), null);
});

test('sync: malformed envelope fails, malformed ops are reported individually', () => {
  assert.equal(parseSyncRequest({ ops: 'x' }).ok, false);
  assert.equal(parseSyncRequest({ ops: new Array(MAX_SYNC_OPS + 1).fill({}) }).ok, false);
  const r = parseSyncRequest({
    baseVersion: 3,
    ops: [
      { op: 'set', key: 'settings', value: { a: 1 } },
      { op: 'set', key: 'leads', value: {} },
      { op: 'upsert', key: 'notices', item: { id: '' } },
      { op: 'upsert', key: 'notices', item: { id: 'x'.repeat(129) } },
      { op: 'upsert', key: 'notices', item: { id: 'n1', title: 'kept' } },
      { op: 'delete', key: 'nope', id: 'a' },
      { op: 'set', key: 'settings', value: [1, 2] },
    ],
  });
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.value.baseVersion, 3);
  assert.deepEqual(r.value.ops.map((o) => o.index), [0, 4]);
  assert.deepEqual(r.value.invalid.map((o) => o.index), [1, 2, 3, 5, 6]);
  const upsert = r.value.ops[1].op;
  assert.equal(upsert.op === 'upsert' && upsert.item.title, 'kept');
});

test('public lead: admin-only fields are stripped and unknown sources refused', () => {
  const r = parsePublicSubmit({
    items: [
      {
        key: 'leads',
        item: {
          id: 'client-id',
          name: 'Student',
          phone: '01711-000000',
          email: 'g@x.test',
          courseId: 'c1',
          message: 'hi',
          source: 'Quick Inquiry',
          status: 'Enrolled',
          priority: 'Hot',
          notes: [{ id: 'x', text: 'fake' }],
          callLogs: [],
          assignedCounselor: 'Me',
        },
      },
    ],
  });
  assert.ok(r.ok);
  if (!r.ok) return;
  const item = r.items[0].item as Record<string, unknown>;
  for (const k of ['id', 'status', 'priority', 'notes', 'callLogs', 'assignedCounselor']) assert.equal(k in item, false, k);
  assert.equal(item.name, 'Student');

  const bad = parsePublicSubmit({ items: [{ key: 'leads', item: { name: 'S', phone: '01711000000', source: 'Excel Import' } }] });
  assert.equal(bad.ok, false);
});

test('public lead: oversized or non-image student photo is rejected', () => {
  const lead = (photo: string) => ({
    items: [
      {
        key: 'leads',
        item: { name: 'S', phone: '01711000000', source: 'Full Admission Form', detailedData: { studentPhotoUrl: photo } },
      },
    ],
  });
  assert.equal(parsePublicSubmit(lead(`data:image/jpeg;base64,${base64OfSize(1024)}`)).ok, true);
  assert.equal(parsePublicSubmit(lead('https://example.test/p.jpg')).ok, true);
  const big = parsePublicSubmit(lead(`data:image/jpeg;base64,${base64OfSize(MAX_PHOTO_BYTES + 3)}`));
  assert.equal(big.ok, false);
  assert.equal(parsePublicSubmit(lead('data:text/html;base64,AAAA')).ok, false);
});

test('public career application: CV limited to documents of at most 3 MB', () => {
  const app = (cv: string) => ({
    items: [
      {
        key: 'careerApplications',
        item: {
          jobId: 'job-1', applicantName: 'Ali', phone: '01711000000', email: 'a@x.test', educationBn: 'BA',
          cvFileDataUrl: cv, status: 'Selected', hrNote: 'x',
        },
      },
    ],
  });
  const ok = parsePublicSubmit(app(`data:application/pdf;base64,${base64OfSize(2 * 1024 * 1024)}`));
  assert.ok(ok.ok);
  if (ok.ok) assert.equal('hrNote' in ok.items[0].item, false);
  assert.equal(parsePublicSubmit(app(`data:application/pdf;base64,${base64OfSize(3 * 1024 * 1024 + 3)}`)).ok, false);
});

test('public submit caps item count and validates complaints', () => {
  const complaint = { guardianName: 'G', phone: '01711000000', category: 'পরামর্শ (Suggestion)', message: 'm' };
  assert.equal(parsePublicSubmit({ items: [{ key: 'complaints', item: complaint }] }).ok, true);
  assert.equal(parsePublicSubmit({ items: [{ key: 'complaints', item: { ...complaint, category: 'Other' } }] }).ok, false);
  assert.equal(parsePublicSubmit({ items: new Array(11).fill({ key: 'complaints', item: complaint }) }).ok, false);
  assert.equal(parsePublicSubmit({ items: [{ key: 'users', item: {} }] }).ok, false);
});
