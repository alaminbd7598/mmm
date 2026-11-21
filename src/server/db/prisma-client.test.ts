import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withPoolDefaults } from './prisma-client';

test('withPoolDefaults shortens the connection wait and keeps the rest of the URL', () => {
  const url = new URL(withPoolDefaults('mysql://user:p%40ss@db.example.com:3306/site?ssl=true'));
  assert.equal(url.searchParams.get('acquireTimeout'), '4000');
  assert.equal(url.searchParams.get('ssl'), 'true');
  assert.equal(url.password, 'p%40ss');
  assert.equal(url.host, 'db.example.com:3306');
  assert.equal(url.pathname, '/site');
});

test('withPoolDefaults keeps an acquireTimeout chosen by the owner and tolerates odd values', () => {
  assert.match(withPoolDefaults('mysql://u:p@h/db?acquireTimeout=9000'), /acquireTimeout=9000/);
  assert.equal(withPoolDefaults('not a url'), 'not a url');
});
