import assert from 'node:assert/strict';
import { test } from 'node:test';

import { renderInviteEmail } from '@/utils/email-templates/invite.js';

const url = 'http://localhost:3000/invite/raw-token-value';

test('invite email includes org name, CTA url, and expiry in text and html', () => {
  const mail = renderInviteEmail({ orgName: 'Acme', url });

  assert.match(mail.subject, /Acme/);
  assert.match(mail.text, /Acme/);
  assert.match(mail.text, /raw-token-value/);
  assert.match(mail.text, /7 days/);
  assert.match(mail.html, /Acme/);
  assert.match(mail.html, /href="http:\/\/localhost:3000\/invite\/raw-token-value"/);
  assert.match(mail.html, /Accept invite/);
  assert.match(mail.html, /7 days/);
});

test('invite email HTML-escapes the organization name', () => {
  const mail = renderInviteEmail({
    orgName: '<script>alert(1)</script>',
    url,
  });

  assert.equal(mail.html.includes('<script>'), false);
  assert.match(mail.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(mail.text, /<script>alert\(1\)<\/script>/);
});
