import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hostnameOf, sessionCookieOptions, shouldUseSecureCookie } from './cookies';

test('hostnameOf strips ports and handles IPv6', () => {
  assert.equal(hostnameOf('Example.com:3000'), 'example.com');
  assert.equal(hostnameOf('[::1]:3000'), '[::1]');
  assert.equal(hostnameOf('a.com, b.com'), 'a.com');
  assert.equal(hostnameOf(null), '');
});

test('cookies are Secure in production except on localhost', () => {
  assert.equal(shouldUseSecureCookie('production', 'mmm.edu.bd'), true);
  assert.equal(shouldUseSecureCookie('production', null), true);
  assert.equal(shouldUseSecureCookie('production', 'localhost:3000'), false);
  assert.equal(shouldUseSecureCookie('production', '127.0.0.1:3000'), false);
  assert.equal(shouldUseSecureCookie('production', 'app.localhost'), false);
  assert.equal(shouldUseSecureCookie('development', 'mmm.edu.bd'), false);
});

test('sessionCookieOptions', () => {
  assert.deepEqual(sessionCookieOptions(60, true), {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 60,
  });
});
