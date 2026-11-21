import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PHOTO_BYTES } from '../server/contracts';
import { PhotoTooLargeError, UPLOAD_PHOTO_TARGET_BYTES, dataUrlBytes, smallestAcceptable } from './imageResize';

/** A data URL whose decoded size is `bytes`. */
const photo = (bytes: number, tag = 'jpeg') => `data:image/${tag};base64,${'A'.repeat(Math.ceil((bytes * 4) / 3))}`;

test('dataUrlBytes measures the decoded size', () => {
  assert.equal(dataUrlBytes(photo(300_000)), 300_000);
  assert.equal(dataUrlBytes('data:image/png;base64,'), 0);
});

test('a picture that could not be shrunk is used only while the server would accept it', () => {
  const original = photo(MAX_PHOTO_BYTES - 10);
  assert.equal(smallestAcceptable([original], MAX_PHOTO_BYTES), original);
  // An undecodable 5 MB file is no longer passed on to be refused at submission.
  assert.throws(() => smallestAcceptable([photo(5 * 1024 * 1024)], MAX_PHOTO_BYTES), PhotoTooLargeError);
  assert.throws(() => smallestAcceptable([], MAX_PHOTO_BYTES), PhotoTooLargeError);
});

test('the smallest acceptable version wins when the target size was not reached', () => {
  const original = photo(4 * 1024 * 1024, 'png');
  const reencoded = photo(600_000);
  assert.ok(dataUrlBytes(reencoded) > UPLOAD_PHOTO_TARGET_BYTES);
  assert.equal(smallestAcceptable([reencoded, original], MAX_PHOTO_BYTES), reencoded);
  assert.equal(smallestAcceptable([photo(1_000_000), photo(900_000)], MAX_PHOTO_BYTES), photo(900_000));
  assert.throws(() => smallestAcceptable([photo(2_000_000), original], MAX_PHOTO_BYTES), PhotoTooLargeError);
});
