import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyContentDeterministically } from '../../utils/admissionToken2027Logic';
import { parseModelJson } from './json';
import { mergeSmartPublishSuggestion, smartPublishRequestSchema } from './smart-publish';

const ctx = { sourceUrl: 'https://facebook.com/p/1', nextHafizSerial: 32, year: '2026' };

test('request requires text or a source URL', () => {
  assert.equal(smartPublishRequestSchema.safeParse({ rawText: ' ', sourceUrl: '' }).success, false);
  assert.equal(smartPublishRequestSchema.safeParse({ sourceUrl: 'https://x.test' }).success, true);
});

test('parseModelJson tolerates code fences and rejects garbage', () => {
  assert.deepEqual(parseModelJson('```json\n{"a":1}\n```'), { a: 1 });
  assert.equal(parseModelJson('not json'), null);
  assert.equal(parseModelJson(undefined), null);
});

test('merge maps model fields onto the suggestion shape', () => {
  const fallback = classifyContentDeterministically('A long article '.repeat(20), '', 31);
  const merged = mergeSmartPublishSuggestion(
    fallback,
    {
      targetSection: 'event',
      confidencePercent: 92,
      reasonBn: 'কারণ',
      suggestedTitleBn: 'শিরোনাম',
      suggestedTitleEn: 'Title',
      suggestedSummaryBn: 'সারাংশ',
      suggestedDate: '2026-12-01',
    },
    ctx
  );
  assert.equal(merged.targetSection, 'event');
  assert.equal(merged.confidence, 0.92);
  assert.equal(merged.rationaleBn, 'কারণ');
  assert.equal(merged.rationaleEn, fallback.rationaleEn);
  assert.equal(merged.suggestedBodyBn, 'সারাংশ');
  assert.equal(merged.eventDate, '2026-12-01');
  assert.equal(merged.sourceUrl, ctx.sourceUrl);
});

test('merge keeps fallback for invalid target and builds a Hafez candidate when needed', () => {
  const fallback = classifyContentDeterministically('Short news', '', 31);
  const invalid = mergeSmartPublishSuggestion(fallback, { targetSection: 'homepage', confidencePercent: 'x' }, ctx);
  assert.equal(invalid.targetSection, fallback.targetSection);
  assert.equal(invalid.confidence, fallback.confidence);

  const hifz = mergeSmartPublishSuggestion(fallback, { targetSection: 'hifz-tree', hafizNameBn: 'আব্দুল্লাহ' }, ctx);
  assert.equal(hifz.hafizCandidate?.serialNumber, 32);
  assert.equal(hifz.hafizCandidate?.nameBn, 'আব্দুল্লাহ');
  assert.equal(hifz.hafizCandidate?.nameEn, 'আব্দুল্লাহ');
  assert.equal(hifz.hafizCandidate?.facebookPostUrl, ctx.sourceUrl);

  assert.deepEqual(mergeSmartPublishSuggestion(fallback, 'nope', ctx), { ...fallback, sourceUrl: ctx.sourceUrl });
});
