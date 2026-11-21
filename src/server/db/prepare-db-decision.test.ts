import test from 'node:test';
import assert from 'node:assert/strict';
import { schemaSyncDecision } from '../../../scripts/prepare-db-decision.mjs';

const DATABASE_URL = 'mysql://user:pw@db.example.test:3306/site';

test('without DATABASE_URL the build never touches a database', () => {
  assert.equal(schemaSyncDecision({}).sync, false);
  assert.equal(schemaSyncDecision({ VERCEL_ENV: 'production' }).sync, false);
});

test('production and non-Vercel builds sync the tables; SKIP_DB_PUSH=1 turns that off', () => {
  assert.deepEqual(schemaSyncDecision({ DATABASE_URL }), { sync: true });
  assert.deepEqual(schemaSyncDecision({ DATABASE_URL, VERCEL_ENV: 'production' }), { sync: true });
  assert.deepEqual(schemaSyncDecision({ DATABASE_URL, VERCEL_ENV: 'development' }), { sync: true });
  assert.equal(schemaSyncDecision({ DATABASE_URL, SKIP_DB_PUSH: '1' }).sync, false);
});

test('a Vercel preview build does not change the tables unless explicitly allowed', () => {
  const preview = schemaSyncDecision({ DATABASE_URL, VERCEL_ENV: 'preview' });
  assert.equal(preview.sync, false);
  assert.match(preview.sync ? '' : preview.message, /ALLOW_PREVIEW_DB_PUSH=1/);
  assert.equal(schemaSyncDecision({ DATABASE_URL, VERCEL_ENV: 'preview', ALLOW_PREVIEW_DB_PUSH: 'true' }).sync, false);
  assert.deepEqual(schemaSyncDecision({ DATABASE_URL, VERCEL_ENV: 'preview', ALLOW_PREVIEW_DB_PUSH: '1' }), { sync: true });
  // SKIP_DB_PUSH still wins.
  assert.equal(schemaSyncDecision({ DATABASE_URL, VERCEL_ENV: 'preview', ALLOW_PREVIEW_DB_PUSH: '1', SKIP_DB_PUSH: '1' }).sync, false);
});
