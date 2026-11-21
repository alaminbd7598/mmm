import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CMSState } from '../../types/cms';
import { INITIAL_CMS_STATE } from '../../data/seedData';
import { DEFAULT_RBAC_MATRIX } from '../../utils/cmsLogic';
import { PRIVATE_KEYS } from '../contracts';
import { projectPublicState, projectStaffState, toPublicSignatories } from './project';

function fixture(): CMSState {
  const state = structuredClone(INITIAL_CMS_STATE) as CMSState;
  state.users = [
    { id: 'u-sa', username: 'admin', password: 'secret1', fullName: 'Super', email: 'sa@x.test', role: 'Super Admin', createdAt: '', signatorySlot: 'none' },
    { id: 'u-ch', username: 'chair', password: 'secret2', fullName: 'Chair Person', email: 'c@x.test', role: 'Chairman / Managing Director', createdAt: '', signatorySlot: 'chairman', designation: 'Chairman', signatureDataUrl: 'data:image/png;base64,AAAA' },
    { id: 'u-t', username: 'teacher', password: 'secret3', fullName: 'Teacher', email: 't@x.test', role: 'Coordinators / Teachers', createdAt: '', signatorySlot: 'coordinator', phone: '01700000000' },
  ];
  state.blogPosts = [
    { id: 'b1', slug: 'a', titleBn: '', titleEn: 'A', excerptBn: '', excerptEn: '', bodyMarkdownBn: '', bodyMarkdownEn: '', category: '', tags: [], authorName: '', publishedAt: '', status: 'Published' },
    { id: 'b2', slug: 'b', titleBn: '', titleEn: 'B', excerptBn: '', excerptEn: '', bodyMarkdownBn: '', bodyMarkdownEn: '', category: '', tags: [], authorName: '', publishedAt: '', status: 'Draft' },
    { id: 'b3', slug: 'c', titleBn: '', titleEn: 'C', excerptBn: '', excerptEn: '', bodyMarkdownBn: '', bodyMarkdownEn: '', category: '', tags: [], authorName: '', publishedAt: '', status: 'Scheduled' },
  ];
  state.blogAutomationConfig = { enabled: true, apiKey: 'blog-secret-key', defaultAuthorName: 'x', defaultCategory: 'y' };
  state.careerCandidates = [{ id: 'cand-1', fullName: 'C', email: 'c@x.test', phone: '0170', password: 'cpw', createdAt: '' }];
  state.virtualOfficeConfig = {
    enabled: true, manualStatus: 'AUTO', timezone: 'Asia/Dhaka', officeDays: [0], openTime: '08:00', closeTime: '20:00',
    primaryPlatform: 'Zoom', dutyOfficerNameBn: '', dutyOfficerNameEn: '', dutyOfficerTitleBn: '', dutyOfficerTitleEn: '',
    dutyOfficerPhone: '', dutyOfficerPhotoUrl: '', roomUrl: 'https://zoom.example/main', zoomMeetingId: '123', zoomPasscode: 'pw',
    desks: [{ id: 'd1', nameBn: '', nameEn: 'Desk', officerNameBn: '', officerNameEn: '', platform: 'Zoom', roomUrl: 'https://zoom.example/d1', zoomMeetingId: '9', zoomPasscode: 'x' }],
  };
  state.versionManager = {
    enabled: true, showInPublicFooter: true, showInAdminDashboard: true, activeVersion: '1.0.0',
    releases: [{ id: 'r1', version: '1.0.0', tag: 'v1', title: 't', notes: 'n', createdAt: '', createdBy: '', snapshot: { settings: state.settings } as never }],
  };
  return state;
}

test('public projection drops every private key', () => {
  const out = projectPublicState(fixture()) as Record<string, unknown>;
  for (const key of PRIVATE_KEYS) assert.equal(key in out, false, `${key} must not be public`);
  assert.equal('blogAutomationConfig' in out, false);
});

test('public projection reduces users to signatories without passwords', () => {
  const out = projectPublicState(fixture());
  assert.deepEqual(out.users, [
    { id: 'u-ch', fullName: 'Chair Person', role: 'Chairman / Managing Director', signatorySlot: 'chairman', designation: 'Chairman', signatureDataUrl: 'data:image/png;base64,AAAA' },
    { id: 'u-t', fullName: 'Teacher', role: 'Coordinators / Teachers', signatorySlot: 'coordinator' },
  ]);
  assert.doesNotMatch(JSON.stringify(out), /secret\d|cpw|blog-secret-key/);
});

test('public projection keeps only published posts and strips join details and snapshots', () => {
  const out = projectPublicState(fixture());
  assert.deepEqual(out.blogPosts?.map((p) => p.id), ['b1']);
  assert.equal(out.virtualOfficeConfig?.roomUrl, '');
  assert.equal(out.virtualOfficeConfig?.zoomPasscode, '');
  assert.equal(out.virtualOfficeConfig?.desks[0].roomUrl, '');
  assert.equal(out.virtualOfficeConfig?.desks[0].zoomMeetingId, '');
  assert.equal(out.versionManager?.releases[0].snapshot, undefined);
  assert.equal(out.versionManager?.releases[0].notes, 'n');
});

test('signatories skip disabled users and the none slot', () => {
  const users = fixture().users.map((u) => (u.id === 'u-ch' ? { ...u, disabled: true } : u));
  assert.deepEqual(toPublicSignatories(users).map((s) => s.id), ['u-t']);
});

test('super admin staff projection has everything except credentials', () => {
  const state = fixture();
  const out = projectStaffState(state, 'Super Admin', DEFAULT_RBAC_MATRIX, 'u-sa');
  assert.equal(out.users?.length, 3);
  assert.ok(out.users?.every((u) => !('password' in u)));
  assert.ok(out.careerCandidates?.every((c) => !('password' in c)));
  assert.deepEqual(out.blogPosts?.length, 3);
  assert.equal(out.virtualOfficeConfig?.roomUrl, 'https://zoom.example/main');
  assert.equal(out.blogAutomationConfig?.apiKey, 'blog-secret-key');
  assert.ok(out.leads && out.rbacMatrix);
  assert.doesNotMatch(JSON.stringify(out), /secret\d|cpw/);
});

test('teacher staff projection: own record, public fallbacks, no unviewable private keys', () => {
  const out = projectStaffState(fixture(), 'Coordinators / Teachers', DEFAULT_RBAC_MATRIX, 'u-t');
  // own full record first (phone included), other users only as signatories
  assert.equal(out.users?.[0].id, 'u-t');
  assert.equal(out.users?.[0].phone, '01700000000');
  assert.equal('password' in (out.users?.[0] || {}), false);
  assert.deepEqual(out.users?.map((u) => u.id), ['u-t', 'u-ch']);
  // teachers cannot view complaints or emails, and receive only their own row of the RBAC matrix
  assert.equal(out.complaints, undefined);
  assert.equal(out.emails, undefined);
  assert.deepEqual(Object.keys(out.rbacMatrix || {}), ['Coordinators / Teachers']);
  // leads need the leads permission; the tokens permission alone does not expose them
  assert.equal(out.leads, undefined);
  // settings are not viewable for teachers, but the public value is still sent for the website
  assert.ok(out.settings);
  // virtual-office view is allowed (full config); blog view without update gets a masked key
  assert.equal(out.virtualOfficeConfig?.roomUrl, 'https://zoom.example/main');
  assert.equal(out.blogAutomationConfig?.apiKey, '');
  // releases are not viewable: snapshots stay stripped
  assert.equal(out.versionManager?.releases[0].snapshot, undefined);
});
