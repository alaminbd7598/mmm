import test from 'node:test';
import assert from 'node:assert/strict';
import type { CMSState } from '../../types/cms';
import type { SyncOp } from '../contracts';
import { MAX_USER_IMAGE_CHARS, contentRejection, singletonValueReason, userImageReason } from './document-rules';

const state = {
  settings: { instituteName: 'MMM', phone: '1', email: 'a@x.test', address: 'x', logoUrl: '/logo.png' },
} as unknown as CMSState;
const PNG = 'data:image/png;base64,iVBORw0KGgo=';

test('script, HTML-data and non-web links are refused in upserts, sets and replaces', () => {
  const bad: SyncOp[] = [
    { op: 'upsert', key: 'notices', item: { id: 'n1', attachmentUrl: 'javascript:alert(1)' } },
    { op: 'upsert', key: 'departmentVideos', item: { id: 'v1', videoUrl: 'data:text/html,<script>1</script>' } },
    { op: 'upsert', key: 'departmentVideos', item: { id: 'v2', videoUrl: 'file:///etc/passwd' } },
    { op: 'upsert', key: 'departmentVideos', item: { id: 'v3', videoUrl: PNG } },
    { op: 'replace', key: 'photoGallery', items: [{ id: 'g1', imageUrl: '/a.jpg' }, { id: 'g2', imageUrl: 'ftp://x/a.jpg' }] },
    { op: 'set', key: 'settings', value: { ...state.settings, boysCampusMapEmbedUrl: 'data:image/svg+xml;base64,PHN2Zz4=' } },
  ];
  for (const op of bad) assert.match(contentRejection(op, state) ?? '', /cannot be stored/, JSON.stringify(op).slice(0, 80));
});

test('ordinary content with web links, site paths and uploaded images passes', () => {
  const good: SyncOp[] = [
    { op: 'upsert', key: 'notices', item: { id: 'n1', title: 'Note: javascript club', attachmentUrl: '/assets/notice.pdf' } },
    { op: 'upsert', key: 'departmentVideos', item: { id: 'v1', videoUrl: 'https://www.youtube.com/watch?v=abc', thumbnailUrl: PNG } },
    { op: 'set', key: 'settings', value: { ...state.settings, logoUrl: PNG, email: 'office@x.test', facebookUrl: 'https://facebook.com/x' } },
    { op: 'delete', key: 'notices', id: 'n1' },
    { op: 'order', key: 'notices', ids: ['n1'] },
  ];
  for (const op of good) assert.equal(contentRejection(op, state), null, JSON.stringify(op).slice(0, 80));
});

test('profile photo and signature must be bounded raster images or web links', () => {
  assert.equal(userImageReason({ photoUrl: '/assets/a.jpg', signatureDataUrl: PNG }), null);
  assert.equal(userImageReason({ photoUrl: '', signatureDataUrl: undefined }), null);
  assert.match(userImageReason({ photoUrl: 'data:application/pdf;base64,JVBERi0=' }) ?? '', /photoUrl/);
  assert.match(userImageReason({ signatureDataUrl: 'mailto:a@b.c' }) ?? '', /signatureDataUrl/);
  assert.match(userImageReason({ photoUrl: `data:image/png;base64,${'A'.repeat(MAX_USER_IMAGE_CHARS)}` }) ?? '', /too large/);
  const op: SyncOp = { op: 'upsert', key: 'users', item: { id: 'u1', photoUrl: 'https://x.test/a b.png' } };
  assert.match(contentRejection(op, state) ?? '', /photoUrl/);
});

test('singleton documents may not arrive empty or truncated', () => {
  assert.match(singletonValueReason('settings', {}, state) ?? '', /empty/);
  assert.match(singletonValueReason('settings', { instituteName: 'PWNED' }, state) ?? '', /missing most/);
  assert.match(singletonValueReason('settings', { ...state.settings, instituteName: ' ' }, state) ?? '', /instituteName/);
  assert.equal(singletonValueReason('settings', { ...state.settings, instituteName: 'New name' }, state), null);
});
