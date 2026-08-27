import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { createApp } from '@/app.js';
import { ErrorCode, HttpStatus } from '@/constants/http.js';
import { DEFAULT_LABEL_COLOR } from '@/constants/label.constant.js';
import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';

const canRun = Boolean(
  process.env.DATABASE_URL &&
    process.env.TOKEN_SECRET &&
    process.env.TOKEN_ISSUER &&
    process.env.TOKEN_AUDIENCE,
);

type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string } | null;
};

type PublicLabel = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  issueCount: number;
};

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
  const res = await fetch(`${origin}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as Envelope<{ user: { id: string } }>;
  assert.equal(res.status, HttpStatus.CREATED, JSON.stringify(body));
  return { cookies: cookieHeader(res), userId: body.data!.user.id };
}

test(
  'labels are org-scoped; CRUD is admin-only',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `lbl-a-${suffix}@relay.test`;
    const emailB = `lbl-b-${suffix}@relay.test`;
    const emailC = `lbl-c-${suffix}@relay.test`;
    const slugA = `lbl-a-${suffix}`;
    const slugB = `lbl-b-${suffix}`;
    const password = 'password1';
    const { server, origin } = await listen();

    try {
      const userA = await register(origin, {
        name: 'User A',
        email: emailA,
        password,
      });
      const userB = await register(origin, {
        name: 'User B',
        email: emailB,
        password,
      });
      const userC = await register(origin, {
        name: 'User C',
        email: emailC,
        password,
      });

      const orgARes = await fetch(`${origin}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Org A', slug: slugA }),
      });
      const orgABody = (await orgARes.json()) as Envelope<{
        organization: { id: string };
      }>;
      assert.equal(orgARes.status, HttpStatus.CREATED, JSON.stringify(orgABody));
      const orgAId = orgABody.data!.organization.id;

      const orgBRes = await fetch(`${origin}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userB.cookies },
        body: JSON.stringify({ name: 'Org B', slug: slugB }),
      });
      assert.equal(orgBRes.status, HttpStatus.CREATED, await orgBRes.text());

      await prisma.membership.create({
        data: {
          organizationId: orgAId,
          userId: userC.userId,
          role: OrgRole.EMPLOYEE,
        },
      });

      const crossOrg = await fetch(`${origin}/orgs/${slugA}/labels`, {
        headers: { cookie: userB.cookies },
      });
      const crossOrgBody = (await crossOrg.json()) as Envelope<unknown>;
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);
      assert.equal(crossOrgBody.success, false);
      assert.equal(crossOrgBody.error?.code, ErrorCode.FORBIDDEN);

      const createRes = await fetch(`${origin}/orgs/${slugA}/labels`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: ' Bug ', color: '#EB5757' }),
      });
      const created = (await createRes.json()) as Envelope<{ label: PublicLabel }>;
      assert.equal(createRes.status, HttpStatus.CREATED, JSON.stringify(created));
      assert.equal(created.data!.label.name, 'Bug');
      assert.equal(created.data!.label.color, '#EB5757');
      const labelId = created.data!.label.id;

      const defaultColorRes = await fetch(`${origin}/orgs/${slugA}/labels`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Feature' }),
      });
      const defaultColor = (await defaultColorRes.json()) as Envelope<{
        label: PublicLabel;
      }>;
      assert.equal(defaultColorRes.status, HttpStatus.CREATED, JSON.stringify(defaultColor));
      assert.equal(defaultColor.data!.label.color, DEFAULT_LABEL_COLOR);

      const dupRes = await fetch(`${origin}/orgs/${slugA}/labels`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'bug' }),
      });
      assert.equal(dupRes.status, HttpStatus.BAD_REQUEST);

      const employeeCreate = await fetch(`${origin}/orgs/${slugA}/labels`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userC.cookies },
        body: JSON.stringify({ name: 'Secret' }),
      });
      assert.equal(employeeCreate.status, HttpStatus.FORBIDDEN);

      const employeePatch = await fetch(`${origin}/orgs/${slugA}/labels/${labelId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userC.cookies },
        body: JSON.stringify({ name: 'Nope' }),
      });
      assert.equal(employeePatch.status, HttpStatus.FORBIDDEN);

      const employeeDelete = await fetch(
        `${origin}/orgs/${slugA}/labels/${labelId}`,
        { method: 'DELETE', headers: { cookie: userC.cookies } },
      );
      assert.equal(employeeDelete.status, HttpStatus.FORBIDDEN);

      const listAsMember = await fetch(`${origin}/orgs/${slugA}/labels`, {
        headers: { cookie: userC.cookies },
      });
      const listed = (await listAsMember.json()) as Envelope<{
        labels: PublicLabel[];
      }>;
      assert.equal(listAsMember.status, HttpStatus.OK, JSON.stringify(listed));
      assert.equal(listed.data!.labels.length, 2);
      assert.deepEqual(
        listed.data!.labels.map((label) => label.name),
        ['Bug', 'Feature'],
      );

      const patchRes = await fetch(`${origin}/orgs/${slugA}/labels/${labelId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Defect', color: '#4F4F4F' }),
      });
      const patched = (await patchRes.json()) as Envelope<{ label: PublicLabel }>;
      assert.equal(patchRes.status, HttpStatus.OK, JSON.stringify(patched));
      assert.equal(patched.data!.label.name, 'Defect');
      assert.equal(patched.data!.label.color, '#4F4F4F');

      const deleteRes = await fetch(`${origin}/orgs/${slugA}/labels/${labelId}`, {
        method: 'DELETE',
        headers: { cookie: userA.cookies },
      });
      const deleted = (await deleteRes.json()) as Envelope<{ id: string }>;
      assert.equal(deleteRes.status, HttpStatus.OK, JSON.stringify(deleted));
      assert.equal(deleted.data!.id, labelId);

      const missing = await fetch(`${origin}/orgs/${slugA}/labels/${labelId}`, {
        method: 'DELETE',
        headers: { cookie: userA.cookies },
      });
      assert.equal(missing.status, HttpStatus.NOT_FOUND);
    } finally {
      await prisma.organization.deleteMany({ where: { slug: { in: [slugA, slugB] } } });
      await prisma.user.deleteMany({
        where: { email: { in: [emailA, emailB, emailC] } },
      });
      await close(server);
    }
  },
);
