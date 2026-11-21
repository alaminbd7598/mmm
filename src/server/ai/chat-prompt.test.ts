import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AIBotConfig, SiteSettings } from '../../types/cms';
import { KNOWLEDGE_BASE_MAX_CHARS, buildChatSystemPrompt, chatRequestSchema, collectPhones } from './chat-prompt';

const bot: Partial<AIBotConfig> = {
  botName: 'Noor',
  customKnowledgeBase: 'KB-FACT: Admission open.',
  qaItems: [
    { id: 'a', question: 'Fee?', keywords: [], answer: 'EN fee', answerBn: 'BN fee', category: 'x', active: true },
    { id: 'b', question: 'Hidden?', keywords: [], answer: 'secret', category: 'x', active: false },
  ],
};
const settings: Partial<SiteSettings> = {
  instituteNameBn: 'মাহারাত',
  instituteName: 'Maharat',
  address: 'Uttara',
  phonePrimary: '0188',
  phoneSecondary: ' ',
  phoneTertiary: '0188',
};

test('chat request: trims, defaults language, enforces 1000-char limit', () => {
  assert.deepEqual(chatRequestSchema.parse({ message: '  hi  ' }), { message: 'hi', language: 'bn' });
  assert.equal(chatRequestSchema.safeParse({ message: '   ' }).success, false);
  assert.equal(chatRequestSchema.safeParse({ message: 'x'.repeat(1001) }).success, false);
  assert.equal(chatRequestSchema.safeParse({ message: 'x', language: 'fr' }).success, false);
  // Fields the old client sent are ignored, not trusted.
  const parsed = chatRequestSchema.parse({ message: 'x', knowledgeBase: 'evil', language: 'en' });
  assert.deepEqual(parsed, { message: 'x', language: 'en' });
});

test('collectPhones drops blanks and duplicates', () => {
  assert.deepEqual(collectPhones(settings), ['0188']);
  assert.deepEqual(collectPhones(undefined), []);
});

test('system prompt uses stored config, active Q&A only, and the requested language', () => {
  const prompt = buildChatSystemPrompt({ aiBotConfig: bot, settings, language: 'en' });
  assert.match(prompt, /"Noor"/);
  assert.match(prompt, /"মাহারাত" \(Maharat\)/);
  assert.match(prompt, /KB-FACT/);
  assert.match(prompt, /BN fee/);
  assert.doesNotMatch(prompt, /secret/);
  assert.match(prompt, /হেল্পলাইন: 0188\n/);
  assert.match(prompt, /Reply in concise, polite and accurate English/);
});

test('system prompt falls back to defaults and caps the knowledge base', () => {
  const prompt = buildChatSystemPrompt({
    aiBotConfig: { customKnowledgeBase: 'k'.repeat(KNOWLEDGE_BASE_MAX_CHARS + 500) },
    settings: undefined,
    language: 'bn',
  });
  assert.match(prompt, /মাহারাত মডেল মাদ্রাসা/);
  assert.doesNotMatch(prompt, /হেল্পলাইন:/);
  assert.ok(!prompt.includes('k'.repeat(KNOWLEDGE_BASE_MAX_CHARS + 1)));
});
