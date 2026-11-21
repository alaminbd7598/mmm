import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeedState } from '../server/db/seed';
import { findUnsafeString, isAllowedUrlFieldValue, isUnsafeStoredString } from './safeUrl';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const PDF = 'data:application/pdf;base64,JVBERi0=';

test('script and HTML data URLs are unsafe in any field', () => {
  assert.equal(isUnsafeStoredString('javascript:alert(1)'), true);
  assert.equal(isUnsafeStoredString(' \tJavaScript:alert(1)'), true);
  assert.equal(isUnsafeStoredString('data:text/html,<script>1</script>'), true);
  assert.equal(isUnsafeStoredString('data:image/svg+xml;base64,PHN2Zz4='), true);
  assert.equal(isUnsafeStoredString(PNG), false);
  assert.equal(isUnsafeStoredString('A note: javascript is fun'), false);
});

test('URL fields accept http(s), mailto, tel and scheme-less values only', () => {
  for (const ok of ['https://example.org/a', 'HTTP://example.org', 'mailto:a@b.org', 'tel:+8801700000000', '/assets/x.png', '#top', 'CV_Name.pdf', '']) {
    assert.equal(isAllowedUrlFieldValue('attachmentUrl', ok), true, ok);
  }
  for (const bad of ['file:///etc/passwd', 'ftp://example.org/x', 'blob:https://example.org/1', 'intent://x', 'vbscript:x', ' javascript:alert(1)']) {
    assert.equal(isAllowedUrlFieldValue('attachmentUrl', bad), false, bad);
  }
});

test('inline data is limited to images in image fields and documents in file fields', () => {
  assert.equal(isAllowedUrlFieldValue('logoUrl', PNG), true);
  assert.equal(isAllowedUrlFieldValue('url', PNG), true);
  assert.equal(isAllowedUrlFieldValue('signatureDataUrl', PNG), true);
  assert.equal(isAllowedUrlFieldValue('logoUrl', PDF), false);
  assert.equal(isAllowedUrlFieldValue('cvFileDataUrl', PDF), true);
  assert.equal(isAllowedUrlFieldValue('attachmentUrl', PDF), true);
  for (const field of ['videoUrl', 'boysCampusMapEmbedUrl', 'groupLink', 'facebookPostUrl', 'roomUrl']) {
    assert.equal(isAllowedUrlFieldValue(field, PNG), false, field);
    assert.equal(isAllowedUrlFieldValue(field, 'data:video/mp4;base64,AAAA'), false, field);
  }
});

test('findUnsafeString reports the path of the offending value', () => {
  assert.equal(findUnsafeString({ title: 'x', attachmentUrl: 'javascript:alert(1)' }), 'attachmentUrl');
  assert.equal(findUnsafeString({ items: [{ videoUrl: 'https://www.youtube.com/embed/x' }, { videoUrl: 'file:///x' }] }), 'items[1].videoUrl');
  assert.equal(findUnsafeString({ imageUrls: ['/a.png', 'ftp://x/y.png'] }), 'imageUrls[1]');
  assert.equal(findUnsafeString({ note: 'file: see the attached form', photoUrl: PNG }), null);
});

test('the seed content passes the storage rules', () => {
  assert.equal(findUnsafeString(buildSeedState()), null);
});
