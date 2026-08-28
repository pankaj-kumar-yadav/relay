import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { createApp } from '@/app.js';
import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';

const canRun = Boolean(
  process.env.DATABASE_URL &&
    process.env.TOKEN_SECRET &&
    process.env.TOKEN_ISSUER &&
    process.env.TOKEN_AUDIENCE,
);

async function listen(): Promise<{ server: Server; origin: string }> {
  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return { server, origin: `http://127.0.0.1:${port}` };
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

function cookieHeader(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((part) => part.split(';')[0])
    .join('; ');
}

async function register(
  origin: string,
  input: { name: string; email: string; password: string },
) {
  const res = await fetch(`${origin}${API_PREFIX}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  assert.equal(res.status, HttpStatus.CREATED, await res.text());
  return cookieHeader(res);
}

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
      const cookiesA = await register(origin, {
        name: 'User A',
        email: emailA,
        password,
      });
      const cookiesB = await register(origin, {
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
