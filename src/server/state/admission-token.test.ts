import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AdmissionToken2027, CMSState } from '../../types/cms';
import { findPublicTokenMatch, planTokenApply } from './admission-token';

const token = {
  id: 'tok-1',
  tokenCode: 'MMM-2027-001',
  studentName: 'Abdullah Al Mamun',
  studentIdNo: 'S-1',
  admissionDate: '',
  guardianPhone: '01711-000000',
  guardianEmail: 'guardian@x.test',
  classKey: 'c',
  classNameLabel: 'Class 1',
  studentType: 'new',
  section: 'General',
  stayMode: 'hostel',
  firstTimeStay: true,
  transport: false,
  lineItems: [],
  subtotalA: 100,
  subtotalB: 50,
  grandTotal: 150,
  totalDiscount: 20,
  status: 'Active',
  createdAt: '',
} satisfies AdmissionToken2027;

const state = (overrides: Partial<AdmissionToken2027> = {}): CMSState =>
  ({
    admissionTokens2027: [{ ...token, ...overrides }],
    leads: [
      { id: 'lead-own', phone: '01711000000' },
      { id: 'lead-other', phone: '01999999999' },
    ],
  }) as unknown as CMSState;

test('match returns only minimal fields with the first name', () => {
  assert.deepEqual(findPublicTokenMatch(state(), { phone: '+8801711000000' }), {
    id: 'tok-1',
    tokenCode: 'MMM-2027-001',
    studentName: 'Abdullah',
    classNameLabel: 'Class 1',
    subtotalA: 100,
    subtotalB: 50,
    grandTotal: 150,
    totalDiscount: 20,
  });
  assert.equal(findPublicTokenMatch(state(), { phone: '01800000000' }), null);
  assert.equal(findPublicTokenMatch(state({ status: 'Applied' }), { phone: '01711000000' }), null);
});

test('apply needs the matching contact and links only the guardian own lead', () => {
  assert.equal(planTokenApply(state(), { tokenId: 'tok-1', phone: '01800000000' }, 'now').ok, false);
  assert.equal(planTokenApply(state(), { tokenId: 'nope', phone: '01711000000' }, 'now').ok, false);

  const own = planTokenApply(state(), { tokenId: 'tok-1', phone: '01711000000', leadId: 'lead-own' }, 'T');
  assert.ok(own.ok);
  if (own.ok && own.op.op === 'upsert') {
    assert.equal(own.op.item.status, 'Applied');
    assert.equal(own.op.item.appliedAt, 'T');
    assert.equal(own.op.item.appliedLeadId, 'lead-own');
  }
  const other = planTokenApply(state(), { tokenId: 'tok-1', phone: '01711000000', leadId: 'lead-other' }, 'T');
  assert.ok(other.ok);
  if (other.ok && other.op.op === 'upsert') assert.equal(other.op.item.appliedLeadId, undefined);
});
