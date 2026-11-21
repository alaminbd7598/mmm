import assert from 'node:assert/strict';
import { test } from 'node:test';
import { describeSyncRejection } from './rejection';

const en = (_bn: string, e: string) => e;
const bn = (b: string) => b;

test('describeSyncRejection never shows the raw server text or code', () => {
  const reasons = [
    'TOO_LARGE',
    'RATE_LIMITED',
    'Password for "teacher1": Password must be at least 10 characters long.',
    'Password for "teacher1": This password is too common or a known default and cannot be used.',
    'This username is already in use.',
    'Your role cannot update "virtualOfficeConfig".',
    'Only Super Admins can manage user accounts.',
    'users.photoUrl must be an image link or an uploaded PNG/JPEG/WebP image.',
    'Invalid op: item.title: Too long',
  ];
  for (const reason of reasons) {
    for (const tr of [en, bn]) {
      const text = describeSyncRejection(reason, tr);
      assert.ok(text.length > 0, reason);
      assert.ok(!text.includes(reason), reason);
      assert.doesNotMatch(text, /[A-Z]{3,}_[A-Z]+|virtualOfficeConfig|teacher1/);
    }
  }
});

test('describeSyncRejection picks the matching explanation', () => {
  assert.match(describeSyncRejection('TOO_LARGE', en), /too large/);
  assert.match(describeSyncRejection('Password for "a": Password must contain both letters and digits.', en), /password does not meet/);
  assert.match(describeSyncRejection('Password for "a": This password is too common or a known default and cannot be used.', en), /too common/);
  assert.match(describeSyncRejection('This username is already in use.', en), /User ID/);
  assert.match(describeSyncRejection('Your role cannot delete "leads".', en), /not allowed/);
  assert.match(describeSyncRejection('Invalid op: item.x: bad', en), /not valid/);
  assert.equal(describeSyncRejection(undefined, en), '');
});
