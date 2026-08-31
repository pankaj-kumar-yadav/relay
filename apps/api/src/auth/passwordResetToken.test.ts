import assert from 'node:assert/strict';
import { test } from 'node:test';

import { RESET_PASSWORD_TTL_MS } from '@/constants/mail.constant.js';
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  passwordResetExpiresAt,
} from '@/auth/passwordResetToken.js';

test('generatePasswordResetToken returns a non-empty url-safe string', () => {
  const token = generatePasswordResetToken();
  assert.ok(token.length >= 32);
  assert.match(token, /^[A-Za-z0-9_-]+$/);
});

test('generatePasswordResetToken values differ', () => {
  assert.notEqual(generatePasswordResetToken(), generatePasswordResetToken());
});

test('hashPasswordResetToken is stable and does not equal the raw token', () => {
  const token = 'test-reset-token-value';
  const hash = hashPasswordResetToken(token);
  assert.equal(hashPasswordResetToken(token), hash);
  assert.notEqual(hash, token);
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test('passwordResetExpiresAt is about one hour from now', () => {
  const before = Date.now();
  const expires = passwordResetExpiresAt();
  const after = Date.now();
  assert.ok(expires.getTime() >= before + RESET_PASSWORD_TTL_MS - 1000);
  assert.ok(expires.getTime() <= after + RESET_PASSWORD_TTL_MS + 1000);
});
