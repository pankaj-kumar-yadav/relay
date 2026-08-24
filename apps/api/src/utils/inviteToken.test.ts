import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  generateInviteToken,
  hashInviteToken,
  inviteExpiresAt,
} from './inviteToken.js';

test('generateInviteToken returns a non-empty url-safe string', () => {
  const token = generateInviteToken();
  assert.ok(token.length >= 32);
  assert.match(token, /^[A-Za-z0-9_-]+$/);
});

test('generateInviteToken values differ', () => {
  assert.notEqual(generateInviteToken(), generateInviteToken());
});

test('hashInviteToken is stable and does not equal the raw token', () => {
  const token = 'test-invite-token-value';
  const hash = hashInviteToken(token);
  assert.equal(hashInviteToken(token), hash);
  assert.notEqual(hash, token);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test('inviteExpiresAt is about 7 days from now', () => {
  const before = Date.now();
  const expires = inviteExpiresAt();
  const after = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  assert.ok(expires.getTime() >= before + sevenDays - 1000);
  assert.ok(expires.getTime() <= after + sevenDays + 1000);
});
