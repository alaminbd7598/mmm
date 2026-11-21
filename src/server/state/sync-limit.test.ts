import test from 'node:test';
import assert from 'node:assert/strict';
import { SYNC_MAX_BYTES, SYNC_MAX_REQUESTS, SYNC_WINDOW_MS, allowStaffSync } from './sync-limit';

const MB = 1024 * 1024;

test('continuous editing for the whole window stays far below the ceiling', () => {
  const t0 = 1_000_000;
  // One 20 KB save every 400 ms (the debounce plus a round trip) for ten minutes.
  const saves = Math.floor(SYNC_WINDOW_MS / 400);
  assert.ok(saves <= SYNC_MAX_REQUESTS / 2, 'at most half of the ceiling');
  for (let i = 0; i < saves; i += 1) assert.equal(allowStaffSync('editor', 20_000, t0 + i * 400), true);
});

test('a full backup restore in 8 MB chunks fits several times over', () => {
  const t0 = 2_000_000;
  // 200 MB of state (more than MAX_STORED_UPLOAD_MB allows) restored three times in a row.
  for (let i = 0; i < 3 * 25; i += 1) assert.equal(allowStaffSync('restorer', 8 * MB, t0 + i * 1000), true);
  assert.ok(3 * 25 * 8 * MB < SYNC_MAX_BYTES / 3);
});

test('a flood of requests is cut off, per account, until the window ends', () => {
  const t0 = 3_000_000;
  for (let i = 0; i < SYNC_MAX_REQUESTS; i += 1) assert.equal(allowStaffSync('flood', 100, t0), true);
  assert.equal(allowStaffSync('flood', 100, t0 + 1), false);
  assert.equal(allowStaffSync('someone-else', 100, t0 + 1), true);
  assert.equal(allowStaffSync('flood', 100, t0 + SYNC_WINDOW_MS + 1), true);
});

test('large bodies are cut off by total size', () => {
  const t0 = 4_000_000;
  const full = Math.floor(SYNC_MAX_BYTES / (12 * MB));
  for (let i = 0; i < full; i += 1) assert.equal(allowStaffSync('bulk', 12 * MB, t0 + i), true);
  assert.equal(allowStaffSync('bulk', 12 * MB, t0 + full), false);
});
