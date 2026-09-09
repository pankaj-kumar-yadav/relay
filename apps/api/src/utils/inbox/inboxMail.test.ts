import assert from 'node:assert/strict';
import { test } from 'node:test';

import { NotificationType } from '@relay/shared/constants/inbox.constant';
import { issueMailPath } from '@/constants/mail.constant.js';
import { renderInboxNotificationEmail } from '@/utils/email-templates/inbox-notification.js';
import { deliverInboxMails } from '@/utils/inbox/inboxMail.js';

test('issueMailPath matches the web issue URL shape', () => {
  assert.equal(issueMailPath('acme', 'ENG-1'), '/acme/issue/ENG-1');
});

test('inbox notification email includes actor copy, title, and issue URL', () => {
  const mail = renderInboxNotificationEmail({
    actorName: 'Ada',
    type: NotificationType.COMMENT,
    issueTitle: 'Fix login',
    issueUrl: 'http://localhost:3000/acme/issue/ENG-1',
    identifier: 'ENG-1',
  });
  assert.match(mail.subject, /ENG-1/);
  assert.match(mail.subject, /commented/);
  assert.match(mail.text, /Fix login/);
  assert.match(mail.text, /http:\/\/localhost:3000\/acme\/issue\/ENG-1/);
  assert.match(mail.html, /Open issue/);
});

test('deliverInboxMails sends one mail per job and swallows send failures', async () => {
  const sent: { to: string; subject: string }[] = [];
  let calls = 0;
  await deliverInboxMails({
    orgSlug: 'acme',
    identifier: 'ENG-1',
    issueTitle: 'Fix login',
    actorName: 'Ada',
    jobs: [
      { userId: 'user-1', type: NotificationType.COMMENT },
      { userId: 'user-2', type: NotificationType.STATUS },
    ],
    loadRecipients: async () => [
      { id: 'user-1', email: 'one@relay.test' },
      { id: 'user-2', email: 'two@relay.test' },
    ],
    send: async (message) => {
      calls += 1;
      if (calls === 1) throw new Error('smtp down');
      sent.push({ to: message.to, subject: message.subject });
    },
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.to, 'two@relay.test');
});
