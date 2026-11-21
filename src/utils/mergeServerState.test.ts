// mergeLiveCMSState with `authoritative: true` is how the browser applies GET /api/state: the
// server's lists are final, and built-in content only fills keys the server did not send.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_CMS_STATE } from '../data/seedData';
import { COLLECTION_KEYS } from '../server/contracts';
import { mergeLiveCMSState } from './cmsLogic';

const seed = INITIAL_CMS_STATE;
const fromServer = (raw: Record<string, unknown>) => mergeLiveCMSState(raw, seed, { authoritative: true });

test('emptied collections stay empty (no built-in items come back)', () => {
  const empty = Object.fromEntries(COLLECTION_KEYS.map((key) => [key, []]));
  const merged = fromServer(empty) as unknown as Record<string, unknown[]>;
  for (const key of COLLECTION_KEYS) assert.deepEqual(merged[key], [], key);
});

test('a key the server did not send falls back to the built-in content', () => {
  const merged = fromServer({ news: [] });
  assert.deepEqual(merged.news, []);
  assert.equal(merged.notices, seed.notices);
  assert.equal(merged.careerJobs, seed.careerJobs);
  assert.equal(merged.hifzTreeConfig.graduates, seed.hifzTreeConfig.graduates);
});

test('deleted Hifz graduates stay deleted and a new graduate is kept', () => {
  const kept = seed.hifzTreeConfig.graduates.slice(2);
  const added = { ...seed.hifzTreeConfig.graduates[0], id: 'hafiz-new', nameBn: 'নতুন হাফেজ' };
  const merged = fromServer({
    hifzTreeConfig: { ...seed.hifzTreeConfig, graduates: [...kept, added], totalHuffazCount: kept.length + 1 },
  });
  assert.deepEqual(merged.hifzTreeConfig.graduates.map((g) => g.id), [...kept.map((g) => g.id), 'hafiz-new']);
  assert.equal(merged.hifzTreeConfig.totalHuffazCount, kept.length + 1);

  const none = fromServer({ hifzTreeConfig: { ...seed.hifzTreeConfig, graduates: [], totalHuffazCount: 0 } });
  assert.deepEqual(none.hifzTreeConfig.graduates, []);
  assert.equal(none.hifzTreeConfig.totalHuffazCount, 0);
});

test('nested lists and the logo vault are taken as stored', () => {
  const merged = fromServer({
    settings: { ...seed.settings, storedLogos: [], externalPortals: [], seoConfig: { ...seed.settings.seoConfig, pageOverrides: [] } },
    aiBotConfig: { ...seed.aiBotConfig, qaItems: [], suggestedQuestions: [] },
    feeCalculatorConfig: { ...seed.feeCalculatorConfig, items: [] },
    transportConfig: { ...seed.transportConfig, routes: [], landmarks: [] },
  });
  assert.deepEqual(merged.settings.storedLogos, []);
  assert.deepEqual(merged.settings.externalPortals, []);
  assert.deepEqual(merged.settings.seoConfig?.pageOverrides, []);
  assert.deepEqual(merged.aiBotConfig.qaItems, []);
  assert.deepEqual(merged.feeCalculatorConfig.items, []);
  assert.deepEqual(merged.transportConfig.routes, []);
});

test('backups and seed content (not authoritative) are still topped up with the defaults', () => {
  const merged = mergeLiveCMSState(
    { careerJobs: [], settings: { ...seed.settings, storedLogos: [] }, hifzTreeConfig: { ...seed.hifzTreeConfig, graduates: [] } },
    seed
  );
  assert.equal(merged.careerJobs, seed.careerJobs);
  assert.equal(merged.settings.storedLogos?.length, seed.settings.storedLogos?.length);
  assert.equal(merged.hifzTreeConfig.graduates, seed.hifzTreeConfig.graduates);
});
