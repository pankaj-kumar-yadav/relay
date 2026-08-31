import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isSmtpConfigured, sendMail } from '@/utils/mailer.js';

test('sendMail logs the body when SMTP is unset', async (t) => {
  if (isSmtpConfigured()) {
    t.skip('SMTP_HOST is set');
    return;
  }

  const lines: string[] = [];
  const original = console.log;
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  };

  try {
    await sendMail({
      to: 'invitee@relay.test',
      subject: "You're invited to Acme",
      text: 'http://localhost:3000/invite/raw-token-value',
    });
  } finally {
    console.log = original;
  }

  const logged = lines.join('\n');
  assert.match(logged, /\[mail\]/);
  assert.match(logged, /invitee@relay.test/);
  assert.match(logged, /http:\/\/localhost:3000\/invite\/raw-token-value/);
});
