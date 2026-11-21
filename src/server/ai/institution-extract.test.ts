import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXTRACT_MAX_FILES, buildExtractionParts, extractRequestSchema } from './institution-extract';

test('no content yields no parts', () => {
  assert.deepEqual(buildExtractionParts(extractRequestSchema.parse({ rawText: '  ', files: [{ name: 'a' }] })), []);
});

test('text, PDFs and text files become parts followed by the instruction', () => {
  const parts = buildExtractionParts(
    extractRequestSchema.parse({
      rawText: 'hello',
      files: [
        { name: 'p.pdf', mimeType: 'application/pdf', base64: 'QUJD\nREVG' },
        { name: 'n.txt', mimeType: 'text/plain', textContent: 'notes' },
        { name: 'img.png', mimeType: 'image/png', base64: 'QUJD' },
      ],
    })
  );
  assert.equal(parts.length, 4);
  assert.match(parts[0].text || '', /hello/);
  assert.deepEqual(parts[1].inlineData, { mimeType: 'application/pdf', data: 'QUJDREVG' });
  assert.match(parts[2].text || '', /n\.txt/);
  assert.match(parts[3].text || '', /Q&A/);
});

test('rejects invalid base64 and too many files', () => {
  assert.equal(extractRequestSchema.safeParse({ files: [{ base64: 'not base64!' }] }).success, false);
  const files = Array.from({ length: EXTRACT_MAX_FILES + 1 }, () => ({ textContent: 'x' }));
  assert.equal(extractRequestSchema.safeParse({ files }).success, false);
});
