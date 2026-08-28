import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import { canRun, close, listen, register } from '@/test/http.js';

test(
  'user B cannot read user A issue by org slug or by issue id',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `harden-a-${suffix}@relay.test`;
    const emailB = `harden-b-${suffix}@relay.test`;
    const slugA = `harden-a-${suffix}`;
    const slugB = `harden-b-${suffix}`;
    const password = 'password1';
    const { server, origin } = await listen();

    try {
      const { cookies: cookiesA } = await register(origin, {
        name: 'User A',
        email: emailA,
        password,
      });
      const { cookies: cookiesB } = await register(origin, {
        name: 'User B',
        email: emailB,
        password,
      });

      const orgARes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookiesA },
        body: JSON.stringify({ name: 'Org A', slug: slugA }),
      });
      assert.equal(orgARes.status, HttpStatus.CREATED, await orgARes.text());

      const orgBRes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookiesB },
        body: JSON.stringify({ name: 'Org B', slug: slugB }),
      });
      assert.equal(orgBRes.status, HttpStatus.CREATED, await orgBRes.text());

      const issueRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: cookiesA },
        body: JSON.stringify({ title: 'Org A only' }),
      });
      const created = (await issueRes.json()) as {
        data: { issue: { id: string } } | null;
      };
      assert.equal(issueRes.status, HttpStatus.CREATED, JSON.stringify(created));
      const issueId = created.data?.issue.id;
      assert.ok(issueId);

      const crossOrg = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}`, {
        headers: { cookie: cookiesB },
      });
      const crossOrgBody = (await crossOrg.json()) as {
        success: boolean;
        data: unknown;
        error: { code: string } | null;
      };
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);
      assert.equal(crossOrgBody.success, false);
      assert.equal(crossOrgBody.data, null);
      assert.equal(crossOrgBody.error?.code, ErrorCode.FORBIDDEN);

      const crossId = await fetch(`${origin}${API_PREFIX}/orgs/${slugB}/issues/${issueId}`, {
        headers: { cookie: cookiesB },
      });
      const crossIdBody = (await crossId.json()) as {
        success: boolean;
        data: unknown;
        error: { code: string } | null;
      };
      assert.equal(crossId.status, HttpStatus.NOT_FOUND);
      assert.equal(crossIdBody.success, false);
      assert.equal(crossIdBody.data, null);
      assert.equal(crossIdBody.error?.code, ErrorCode.NOT_FOUND);
    } finally {
      await prisma.organization.deleteMany({ where: { slug: { in: [slugA, slugB] } } });
      await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
      await close(server);
    }
  },
);
