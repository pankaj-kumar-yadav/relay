import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, HttpStatus } from '@/constants/http.constant.js';
import { OrgRole } from '@relay/shared/constants/org.constant';
import { isSmtpConfigured } from '@/utils/mailer.js';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

test(
  'comment notifies subscriber by email after commit; actor is not mailed',
  { skip: !canRun || isSmtpConfigured() },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const password = 'password1';
    const slug = `mail-${suffix}`;
    const emailC = `mail-c-${suffix}@relay.test`;
    const emailA = `mail-a-${suffix}@relay.test`;
    const { server, origin } = await listen();

    const lines: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => {
      lines.push(args.map(String).join(' '));
    };

    try {
      const userA = await register(origin, {
        name: 'User A',
        email: emailA,
        password,
      });
      const userC = await register(origin, {
        name: 'User C',
        email: emailC,
        password,
      });

      const orgRes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Org Mail', slug }),
      });
      const orgBody = (await orgRes.json()) as Envelope<{
        organization: { id: string };
      }>;
      assert.equal(orgRes.status, HttpStatus.CREATED, JSON.stringify(orgBody));

      await prisma.membership.create({
        data: {
          organizationId: orgBody.data!.organization.id,
          userId: userC.userId,
          role: OrgRole.EMPLOYEE,
        },
      });

      const createdRes = await fetch(`${origin}${API_PREFIX}/orgs/${slug}/issues`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ title: 'Mailed issue' }),
      });
      const created = (await createdRes.json()) as Envelope<{
        issue: { id: string; identifier: string };
      }>;
      assert.equal(createdRes.status, HttpStatus.CREATED, JSON.stringify(created));
      const issueId = created.data!.issue.id;
      const identifier = created.data!.issue.identifier;

      const subscribe = await fetch(
        `${origin}${API_PREFIX}/orgs/${slug}/issues/${issueId}/subscription`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json', cookie: userC.cookies },
          body: JSON.stringify({ subscribed: true }),
        },
      );
      assert.equal(subscribe.status, HttpStatus.OK, await subscribe.text());

      lines.length = 0;
      const commentRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slug}/issues/${issueId}/comments`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ body: 'Please look' }),
        },
      );
      assert.equal(commentRes.status, HttpStatus.CREATED, await commentRes.text());

      const logged = lines.join('\n');
      assert.match(logged, /\[mail\]/);
      assert.match(logged, new RegExp(emailC.replace('.', '\\.')));
      assert.match(logged, new RegExp(`${slug}/issue/${identifier}`));
      assert.doesNotMatch(logged, new RegExp(emailA.replace('.', '\\.')));

      lines.length = 0;
      const assignRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slug}/issues/${issueId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ assigneeId: userC.userId }),
        },
      );
      assert.equal(assignRes.status, HttpStatus.OK, await assignRes.text());
      const assignLogged = lines.join('\n');
      assert.match(assignLogged, /\[mail\]/);
      assert.match(assignLogged, new RegExp(emailC.replace('.', '\\.')));
      assert.doesNotMatch(assignLogged, new RegExp(emailA.replace('.', '\\.')));
    } finally {
      console.log = original;
      await close(server);
    }
  },
);
