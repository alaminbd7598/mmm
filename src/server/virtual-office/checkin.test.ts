import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { VirtualOfficeConfig } from '../../types/cms';
import { DEFAULT_VIRTUAL_OFFICE_CONFIG } from '../../utils/virtualOfficeLogic';
import {
  MAX_VIRTUAL_OFFICE_SESSIONS,
  checkinOps,
  checkinResponse,
  getEffectiveVirtualOfficeConfig,
  planVirtualOfficeCheckin,
} from './checkin';

const input = { fullName: 'Abdullah', phone: '01886340308', email: 'a@example.com', deskId: 'desk-principal' };
const now = new Date('2026-11-21T06:00:00Z');
const cfg = (manualStatus: VirtualOfficeConfig['manualStatus']) =>
  getEffectiveVirtualOfficeConfig({ ...DEFAULT_VIRTUAL_OFFICE_CONFIG, manualStatus });

test('effective config falls back to default desks', () => {
  assert.equal(getEffectiveVirtualOfficeConfig(undefined), DEFAULT_VIRTUAL_OFFICE_CONFIG);
  const c = getEffectiveVirtualOfficeConfig({ ...DEFAULT_VIRTUAL_OFFICE_CONFIG, desks: [], roomUrl: 'https://x.test' });
  assert.equal(c.desks, DEFAULT_VIRTUAL_OFFICE_CONFIG.desks);
  assert.equal(c.roomUrl, 'https://x.test');
});

test('live check-in unlocks the desk room and records session + lead', () => {
  const plan = planVirtualOfficeCheckin(input, cfg('ONLINE_LIVE'), now);
  assert.equal(plan.session.sessionStatus, 'Joined');
  assert.equal(plan.session.deskMode, 'ONLINE_LIVE');
  assert.equal(plan.lead.status, 'New');
  assert.match(plan.lead.message, /^\[Virtual Office Live Join\]/);
  const res = checkinResponse(plan);
  assert.equal(res.unlocked, true);
  assert.ok(res.unlocked && res.join.roomUrl.startsWith('https://zoom.us/'));
});

test('offline / busy check-in never returns room links', () => {
  for (const mode of ['OFFLINE', 'BUSY_IN_SESSION'] as const) {
    const plan = planVirtualOfficeCheckin(input, cfg(mode), now);
    assert.equal(plan.session.sessionStatus, 'Missed — Call Back');
    const res = checkinResponse(plan);
    assert.equal(res.unlocked, false);
    assert.equal(JSON.stringify(res).includes('zoom.us'), false);
    assert.equal(JSON.stringify(res).includes('MMM2027'), false);
  }
});

test('ops put the session and lead first and cap sessions at 200', () => {
  const plan = planVirtualOfficeCheckin(input, cfg('OFFLINE'), now);
  const existing = Array.from({ length: MAX_VIRTUAL_OFFICE_SESSIONS + 5 }, (_, i) => `s${i}`);
  const ops = checkinOps(plan, existing);
  const deletes = ops.filter((o) => o.op === 'delete').map((o) => (o.op === 'delete' ? o.id : ''));
  assert.deepEqual(deletes, existing.slice(MAX_VIRTUAL_OFFICE_SESSIONS - 1));
  assert.equal(existing.length + 1 - deletes.length, MAX_VIRTUAL_OFFICE_SESSIONS);
  assert.deepEqual(ops[1], { op: 'order', key: 'virtualOfficeSessions', ids: [plan.session.id] });
  assert.deepEqual(ops.at(-1), { op: 'order', key: 'leads', ids: [plan.lead.id] });
  assert.equal(checkinOps(plan, ['a', 'b']).filter((o) => o.op === 'delete').length, 0);
});
