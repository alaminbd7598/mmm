// Tests for the browser store's state helpers (src/store/sync/state-shape.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CMSState } from '../../types/cms';
import { INITIAL_CMS_STATE } from '../../data/seedData';
import { PRIVATE_KEYS, isCollectionKey } from '../../server/contracts';
import {
  buildClientFallbackState,
  hasSecrets,
  stripConfirmedSecrets,
  stripSecrets,
} from './state-shape';

test('client fallback state carries no accounts or personal collections', () => {
  const fallback = buildClientFallbackState();
  assert.deepEqual(fallback.users, []);
  for (const key of PRIVATE_KEYS) {
    if (isCollectionKey(key)) assert.deepEqual(fallback[key], [], key);
  }
  assert.equal(hasSecrets(fallback), false);
  assert.deepEqual(fallback.settings, INITIAL_CMS_STATE.settings);
});

const withUsers = (users: Array<Record<string, unknown>>) => ({ users } as unknown as Partial<CMSState>);

test('stripSecrets removes passwords and keeps identity when clean', () => {
  const clean = withUsers([{ id: 'u1', username: 'a' }]);
  assert.equal(stripSecrets(clean), clean);
  const dirty = withUsers([{ id: 'u1', username: 'a', password: 'secret1', passwordHash: 'h' }]);
  assert.deepEqual(stripSecrets(dirty), withUsers([{ id: 'u1', username: 'a' }]));
  assert.equal(hasSecrets(dirty), true);
});

test('stripConfirmedSecrets only strips passwords the server received', () => {
  const sent = withUsers([{ id: 'u1', password: 'first-pw1' }, { id: 'u2', password: 'two-pw22' }]);
  const current = withUsers([
    { id: 'u1', password: 'first-pw1' },
    { id: 'u2', password: 'changed-again3' },
    { id: 'u3', password: 'not-sent-yet4' },
  ]);
  assert.deepEqual(
    stripConfirmedSecrets(current, sent),
    withUsers([{ id: 'u1' }, { id: 'u2', password: 'changed-again3' }, { id: 'u3', password: 'not-sent-yet4' }])
  );
  const nothing = withUsers([{ id: 'u9' }]);
  assert.equal(stripConfirmedSecrets(nothing, sent), nothing);
});
