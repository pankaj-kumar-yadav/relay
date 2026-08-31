import assert from 'node:assert/strict';
import { test } from 'node:test';

import { renderResetPasswordEmail } from '@/utils/email-templates/reset-password.js';

const url = 'http://localhost:3000/reset-password/raw-reset-token';

test('reset email includes url and one-hour expiry in text and html', () => {
  const mail = renderResetPasswordEmail({ url });

  assert.match(mail.subject, /Reset your password/i);
  assert.match(mail.text, /raw-reset-token/);
  assert.match(mail.text, /1 hour/);
  assert.match(mail.html, /href="http:\/\/localhost:3000\/reset-password\/raw-reset-token"/);
  assert.match(mail.html, /Reset password/);
  assert.match(mail.html, /1 hour/);
});
