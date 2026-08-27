import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { createApp } from '@/app.js';
import { IssueEventType } from '@/constants/activity.constant.js';
import { ErrorCode, HttpStatus } from '@/constants/http.js';
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

type IssueLabel = { id: string; name: string; color: string };

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
  'members can set issue labels; label events record added and removed',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `ilbl-a-${suffix}@relay.test`;
    const emailB = `ilbl-b-${suffix}@relay.test`;
    const emailC = `ilbl-c-${suffix}@relay.test`;
    const slugA = `ilbl-a-${suffix}`;
    const slugB = `ilbl-b-${suffix}`;
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

      const bugRes = await fetch(`${origin}/orgs/${slugA}/labels`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Bug', color: '#EB5757' }),
      });
      const bug = (await bugRes.json()) as Envelope<{ label: IssueLabel }>;
      assert.equal(bugRes.status, HttpStatus.CREATED, JSON.stringify(bug));

      const featureRes = await fetch(`${origin}/orgs/${slugA}/labels`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Feature', color: '#27AE60' }),
      });
      const feature = (await featureRes.json()) as Envelope<{ label: IssueLabel }>;
      assert.equal(featureRes.status, HttpStatus.CREATED, JSON.stringify(feature));

      const foreignRes = await fetch(`${origin}/orgs/${slugB}/labels`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userB.cookies },
        body: JSON.stringify({ name: 'Bug', color: '#EB5757' }),
      });
      const foreign = (await foreignRes.json()) as Envelope<{ label: IssueLabel }>;
      assert.equal(foreignRes.status, HttpStatus.CREATED, JSON.stringify(foreign));

      const issueRes = await fetch(`${origin}/orgs/${slugA}/issues`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({
          title: 'Labeled issue',
          labelIds: [bug.data!.label.id],
        }),
      });
      const created = (await issueRes.json()) as Envelope<{
        issue: { id: string; labels: IssueLabel[] };
      }>;
      assert.equal(issueRes.status, HttpStatus.CREATED, JSON.stringify(created));
      assert.deepEqual(
        created.data!.issue.labels.map((label) => label.name),
        ['Bug'],
      );
      const issueId = created.data!.issue.id;

      const crossOrg = await fetch(
        `${origin}/orgs/${slugA}/issues/${issueId}/labels`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json', cookie: userB.cookies },
          body: JSON.stringify({ labelIds: [feature.data!.label.id] }),
        },
      );
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);

      const foreignIds = await fetch(
        `${origin}/orgs/${slugA}/issues/${issueId}/labels`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ labelIds: [foreign.data!.label.id] }),
        },
      );
      const foreignIdsBody = (await foreignIds.json()) as Envelope<unknown>;
      assert.equal(foreignIds.status, HttpStatus.BAD_REQUEST);
      assert.equal(foreignIdsBody.error?.code, ErrorCode.VALIDATION_ERROR);

      const setRes = await fetch(
        `${origin}/orgs/${slugA}/issues/${issueId}/labels`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json', cookie: userC.cookies },
          body: JSON.stringify({ labelIds: [feature.data!.label.id] }),
        },
      );
      const setBody = (await setRes.json()) as Envelope<{
        issue: { labels: IssueLabel[] };
      }>;
      assert.equal(setRes.status, HttpStatus.OK, JSON.stringify(setBody));
      assert.deepEqual(
        setBody.data!.issue.labels.map((label) => label.name),
        ['Feature'],
      );

      const sameRes = await fetch(
        `${origin}/orgs/${slugA}/issues/${issueId}/labels`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json', cookie: userC.cookies },
          body: JSON.stringify({ labelIds: [feature.data!.label.id] }),
        },
      );
      assert.equal(sameRes.status, HttpStatus.OK);

      const activityRes = await fetch(
        `${origin}/orgs/${slugA}/issues/${issueId}/activity`,
        { headers: { cookie: userA.cookies } },
      );
      const activity = (await activityRes.json()) as Envelope<{
        items: Array<{
          kind: string;
          type?: string;
          payload?: {
            added?: Array<{ name: string }>;
            removed?: Array<{ name: string }>;
          };
        }>;
      }>;
      assert.equal(activityRes.status, HttpStatus.OK, JSON.stringify(activity));
      const labelEvents = activity.data!.items.filter(
        (item) => item.kind === 'event' && item.type === IssueEventType.LABEL,
      );
      assert.equal(labelEvents.length, 2);
      assert.deepEqual(
        labelEvents[0]?.payload?.added?.map((item) => item.name),
        ['Bug'],
      );
      assert.deepEqual(labelEvents[0]?.payload?.removed, []);
      assert.deepEqual(
        labelEvents[1]?.payload?.added?.map((item) => item.name),
        ['Feature'],
      );
      assert.deepEqual(
        labelEvents[1]?.payload?.removed?.map((item) => item.name),
        ['Bug'],
      );
    } finally {
      await prisma.organization.deleteMany({ where: { slug: { in: [slugA, slugB] } } });
      await prisma.user.deleteMany({
        where: { email: { in: [emailA, emailB, emailC] } },
      });
      await close(server);
    }
  },
);
