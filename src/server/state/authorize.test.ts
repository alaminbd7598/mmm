import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AdminRole, AdminUser, CMSState } from '../../types/cms';
import { DEFAULT_RBAC_MATRIX } from '../../utils/cmsLogic';
import type { StaffSession, SyncOp } from '../contracts';
import { authoriseOps, changedUserFields } from './authorize';

const user = (id: string, role: AdminRole, extra: Partial<AdminUser> = {}): AdminUser => ({
  id,
  username: id,
  fullName: id.toUpperCase(),
  email: `${id}@x.test`,
  role,
  createdAt: '2026-01-01',
  ...extra,
});

function state(users: AdminUser[] = defaultUsers()): CMSState {
  return {
    users,
    notices: [{ id: 'n1', title: 'T', category: 'Exam', publishDate: '', description: '' }],
    leads: [],
    emails: [],
    rbacMatrix: DEFAULT_RBAC_MATRIX,
  } as unknown as CMSState;
}

function defaultUsers(): AdminUser[] {
  return [
    user('sa', 'Super Admin'),
    user('teacher', 'Coordinators / Teachers', { phone: '0171' }),
    user('cm', 'Content Managers'),
  ];
}

const session = (u: AdminUser): StaffSession => ({
  kind: 'staff',
  userId: u.id,
  username: u.username,
  role: u.role,
  mustChangePassword: false,
});

const asItem = (u: AdminUser) => u as unknown as { id: string } & Record<string, unknown>;

test('teacher with view-only virtual office access cannot write it', () => {
  const s = state();
  const ops: SyncOp[] = [
    { op: 'set', key: 'virtualOfficeConfig', value: { enabled: false } },
    { op: 'upsert', key: 'virtualOfficeSessions', item: { id: 'vs1' } },
  ];
  const r = authoriseOps(ops, session(s.users[1]), s);
  assert.equal(r.allowed.length, 0);
  assert.deepEqual(r.rejected.map((x) => x.index), [0, 1]);
});

test('content manager can create/edit/delete notices but not touch users or the matrix', () => {
  const s = state();
  const cm = session(s.users[2]);
  const ops: SyncOp[] = [
    { op: 'upsert', key: 'notices', item: { id: 'n1', title: 'edited' } },
    { op: 'upsert', key: 'notices', item: { id: 'n2', title: 'new' } },
    { op: 'delete', key: 'notices', id: 'n1' },
    { op: 'upsert', key: 'users', item: asItem(user('x', 'Super Admin')) },
    { op: 'delete', key: 'users', id: 'teacher' },
    { op: 'set', key: 'rbacMatrix', value: {} },
  ];
  const r = authoriseOps(ops, cm, s);
  assert.deepEqual(r.allowedIndexes, [0, 1, 2]);
  assert.deepEqual(r.rejected.map((x) => x.index), [3, 4, 5]);
});

test('teacher cannot edit notices (view only) and create vs update is distinguished', () => {
  const s = state();
  const t = session(s.users[1]);
  const r = authoriseOps(
    [
      { op: 'upsert', key: 'notices', item: { id: 'n1' } },
      { op: 'upsert', key: 'courses', item: { id: 'c-new' } },
      { op: 'delete', key: 'courses', id: 'c-new' },
    ],
    t,
    s
  );
  // courses: create + update but no delete for teachers
  assert.deepEqual(r.allowedIndexes, [1]);
  assert.match(r.rejected[0].reason, /update "notices"/);
  assert.match(r.rejected[1].reason, /delete "courses"/);
});

test('staff with leads access may log notification emails without emails create permission', () => {
  const s = state();
  const chairman = user('ch', 'Chairman / Managing Director');
  s.users.push(chairman);
  const r = authoriseOps([{ op: 'upsert', key: 'emails', item: { id: 'e1' } }], session(chairman), s);
  assert.equal(r.allowed.length, 1);
  const teacher = authoriseOps([{ op: 'upsert', key: 'emails', item: { id: 'e1' } }], session(s.users[1]), s);
  assert.equal(teacher.allowed.length, 0);
});

test('self profile edit is allowed for whitelisted fields only', () => {
  const s = state();
  const t = s.users[1];
  const ok = authoriseOps(
    [{ op: 'upsert', key: 'users', item: asItem({ ...t, bio: 'Hello', signatureDataUrl: 'data:image/png;base64,AA', mustChangePassword: false } as AdminUser) }],
    session(t),
    s
  );
  assert.equal(ok.allowed.length, 1);

  const roleChange = authoriseOps([{ op: 'upsert', key: 'users', item: asItem({ ...t, role: 'Super Admin' }) }], session(t), s);
  assert.equal(roleChange.allowed.length, 0);
  assert.match(roleChange.rejected[0].reason, /role/);

  const rename = authoriseOps([{ op: 'upsert', key: 'users', item: asItem({ ...t, username: 'boss' }) }], session(t), s);
  assert.match(rename.rejected[0].reason, /username/);

  const other = authoriseOps([{ op: 'upsert', key: 'users', item: asItem({ ...s.users[2], bio: 'x' }) }], session(t), s);
  assert.equal(other.allowed.length, 0);

  const pw = authoriseOps([{ op: 'upsert', key: 'users', item: asItem({ ...t, password: 'newpass123' }) }], session(t), s);
  assert.match(pw.rejected[0].reason, /change-password/);
});

test('last Super Admin and self are protected', () => {
  const s = state();
  const sa = session(s.users[0]);
  const r = authoriseOps(
    [
      { op: 'delete', key: 'users', id: 'sa' },
      { op: 'upsert', key: 'users', item: asItem({ ...s.users[0], role: 'Content Managers' }) },
      { op: 'upsert', key: 'users', item: asItem({ ...s.users[0], disabled: true } as AdminUser) },
      { op: 'replace', key: 'users', items: [asItem(s.users[1])] },
    ],
    sa,
    s
  );
  assert.equal(r.allowed.length, 0);
  assert.match(r.rejected[0].reason, /own account/);
  assert.match(r.rejected[1].reason, /own Super Admin role/);
});

test('a Super Admin may demote or delete another Super Admin only while one remains', () => {
  const s = state([user('sa', 'Super Admin'), user('sa2', 'Super Admin'), user('t', 'Coordinators / Teachers')]);
  const sa = session(s.users[0]);
  const r = authoriseOps(
    [
      { op: 'upsert', key: 'users', item: asItem({ ...s.users[1], role: 'Content Managers' }) },
      { op: 'upsert', key: 'users', item: asItem(user('new', 'Principal / Vice Principal')) },
      { op: 'upsert', key: 'users', item: asItem(user('dup', 'Content Managers', { username: 'T' })) },
    ],
    sa,
    s
  );
  assert.deepEqual(r.allowedIndexes, [0, 1]);
  assert.match(r.rejected[0].reason, /already in use/);

  // with sa2 the only other Super Admin, sa (requester) still remains: deleting sa2 is fine
  const del = authoriseOps([{ op: 'delete', key: 'users', id: 'sa2' }], sa, s);
  assert.equal(del.allowed.length, 1);
});

test('the requester is the only active Super Admin: demoting the other remaining one is impossible', () => {
  // sa2 is the only Super Admin; requester "sa" is a Super Admin with a stale session after being demoted
  const s = state([user('sa', 'Content Managers'), user('sa2', 'Super Admin')]);
  const stale: StaffSession = { kind: 'staff', userId: 'sa', username: 'sa', role: 'Super Admin', mustChangePassword: false };
  const r = authoriseOps([{ op: 'delete', key: 'users', id: 'sa2' }], stale, s);
  assert.match(r.rejected[0].reason, /last Super Admin/);
});

test('wildcard restore permission allows replace but not single deletes without delete rights', () => {
  const s = state();
  // Content Managers: backup-ai read+update (wildcard edit), no delete on courses
  const cm = session(s.users[2]);
  const r = authoriseOps(
    [
      { op: 'replace', key: 'leads', items: [] },
      { op: 'replace', key: 'users', items: [] },
      { op: 'delete', key: 'leaveRequests', id: 'l1' },
    ],
    cm,
    s
  );
  assert.deepEqual(r.allowedIndexes, [0]);
});

test('changedUserFields ignores credential fields and undefined values', () => {
  assert.deepEqual(changedUserFields({ a: 1, b: undefined }, { a: 1, password: 'x', mustChangePassword: true }), []);
  assert.deepEqual(changedUserFields({ a: { x: 1, y: 2 } }, { a: { y: 2, x: 1 }, c: 3 }), ['c']);
});
