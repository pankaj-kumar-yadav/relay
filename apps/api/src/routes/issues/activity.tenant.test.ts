import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IssueEventType } from '@/constants/activity.constant.js';
import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { IssueStatus } from '@/constants/issue.js';
import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

test(
  'activity is tenant-scoped; comments and status events persist',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `act-a-${suffix}@relay.test`;
    const emailB = `act-b-${suffix}@relay.test`;
    const emailC = `act-c-${suffix}@relay.test`;
    const slugA = `act-a-${suffix}`;
    const slugB = `act-b-${suffix}`;
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

      const orgARes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Org A', slug: slugA }),
      });
      const orgABody = (await orgARes.json()) as Envelope<{
        organization: { id: string };
      }>;
      assert.equal(orgARes.status, HttpStatus.CREATED, JSON.stringify(orgABody));
      const orgAId = orgABody.data!.organization.id;

      const orgBRes = await fetch(`${origin}${API_PREFIX}/orgs`, {
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

      const issueRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ title: 'Activity issue' }),
      });
      const created = (await issueRes.json()) as Envelope<{
        issue: { id: string };
      }>;
      assert.equal(issueRes.status, HttpStatus.CREATED, JSON.stringify(created));
      const issueId = created.data!.issue.id;

      const crossOrg = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/activity`,
        { headers: { cookie: userB.cookies } },
      );
      const crossOrgBody = (await crossOrg.json()) as Envelope<unknown>;
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);
      assert.equal(crossOrgBody.success, false);
      assert.equal(crossOrgBody.error?.code, ErrorCode.FORBIDDEN);

      const crossId = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugB}/issues/${issueId}/activity`,
        { headers: { cookie: userB.cookies } },
      );
      const crossIdBody = (await crossId.json()) as Envelope<unknown>;
      assert.equal(crossId.status, HttpStatus.NOT_FOUND);
      assert.equal(crossIdBody.success, false);
      assert.equal(crossIdBody.error?.code, ErrorCode.NOT_FOUND);

      const emptyRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/comments`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ body: '   ' }),
        },
      );
      assert.equal(emptyRes.status, HttpStatus.BAD_REQUEST);

      const commentRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/comments`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ body: 'Kickoff notes' }),
        },
      );
      const commentBody = (await commentRes.json()) as Envelope<{
        comment: { id: string; body: string };
      }>;
      assert.equal(commentRes.status, HttpStatus.CREATED, JSON.stringify(commentBody));
      const commentId = commentBody.data!.comment.id;

      const forbiddenDelete = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/comments/${commentId}`,
        { method: 'DELETE', headers: { cookie: userC.cookies } },
      );
      const forbiddenDeleteBody = (await forbiddenDelete.json()) as Envelope<unknown>;
      assert.equal(forbiddenDelete.status, HttpStatus.FORBIDDEN);
      assert.equal(forbiddenDeleteBody.error?.code, ErrorCode.FORBIDDEN);

      const patchRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ status: IssueStatus.DONE }),
      });
      assert.equal(patchRes.status, HttpStatus.OK, await patchRes.text());

      const activityRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/activity`,
        { headers: { cookie: userA.cookies } },
      );
      const activity = (await activityRes.json()) as Envelope<{
        items: Array<{
          kind: string;
          type?: string;
          body?: string;
          payload?: { from?: unknown; to?: unknown };
        }>;
      }>;
      assert.equal(activityRes.status, HttpStatus.OK, JSON.stringify(activity));
      const items = activity.data!.items;
      assert.ok(items.some((item) => item.kind === 'event' && item.type === IssueEventType.CREATED));
      assert.ok(items.some((item) => item.kind === 'comment' && item.body === 'Kickoff notes'));
      const statusEvent = items.find(
        (item) => item.kind === 'event' && item.type === IssueEventType.STATUS,
      );
      assert.ok(statusEvent);
      assert.equal(statusEvent?.payload?.to, IssueStatus.DONE);

      const deleteRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/comments/${commentId}`,
        { method: 'DELETE', headers: { cookie: userA.cookies } },
      );
      assert.equal(deleteRes.status, HttpStatus.OK, await deleteRes.text());
    } finally {
      await prisma.organization.deleteMany({ where: { slug: { in: [slugA, slugB] } } });
      await prisma.user.deleteMany({
        where: { email: { in: [emailA, emailB, emailC] } },
      });
      await close(server);
    }
  },
);
