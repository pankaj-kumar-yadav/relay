import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.constant.js';
import { NotificationType } from '@relay/shared/constants/inbox.constant';
import { IssueStatus } from '@relay/shared/constants/issue.constant';
import { OrgRole } from '@relay/shared/constants/org.constant';
import { SUBSCRIBED_ME } from '@relay/shared/constants/subscribe.constant';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

type PublicIssue = {
  id: string;
  subscribed: boolean;
};

type PublicNotification = {
  id: string;
  type: string;
  actor: { id: string };
};

async function listInbox(origin: string, slug: string, cookies: string) {
  const res = await fetch(`${origin}${API_PREFIX}/orgs/${slug}/notifications`, {
    headers: { cookie: cookies },
  });
  const body = (await res.json()) as Envelope<{
    notifications: PublicNotification[];
    unreadCount: number;
  }>;
  return { res, body };
}

test(
  'issue subscribe auto-watches, toggles, lists, and fans out comment/status',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const password = 'password1';
    const slugA = `sub-a-${suffix}`;
    const slugB = `sub-b-${suffix}`;
    const { server, origin } = await listen();

    try {
      const userA = await register(origin, {
        name: 'User A',
        email: `sub-a-${suffix}@relay.test`,
        password,
      });
      const userB = await register(origin, {
        name: 'User B',
        email: `sub-b-${suffix}@relay.test`,
        password,
      });
      const userC = await register(origin, {
        name: 'User C',
        email: `sub-c-${suffix}@relay.test`,
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

      const unauth = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/x/subscription`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ subscribed: true }),
        },
      );
      assert.equal(unauth.status, HttpStatus.UNAUTHORIZED);

      const createdRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ title: 'Watched issue' }),
      });
      const created = (await createdRes.json()) as Envelope<{ issue: PublicIssue }>;
      assert.equal(createdRes.status, HttpStatus.CREATED, JSON.stringify(created));
      const issueId = created.data!.issue.id;
      assert.equal(created.data!.issue.subscribed, true);

      const asC = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}`, {
        headers: { cookie: userC.cookies },
      });
      const asCBody = (await asC.json()) as Envelope<{ issue: PublicIssue }>;
      assert.equal(asC.status, HttpStatus.OK, JSON.stringify(asCBody));
      assert.equal(asCBody.data!.issue.subscribed, false);

      const crossOrg = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/subscription`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json', cookie: userB.cookies },
          body: JSON.stringify({ subscribed: true }),
        },
      );
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);

      const subscribeC = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/subscription`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json', cookie: userC.cookies },
          body: JSON.stringify({ subscribed: true }),
        },
      );
      const subscribeCBody = (await subscribeC.json()) as Envelope<{ issue: PublicIssue }>;
      assert.equal(subscribeC.status, HttpStatus.OK, JSON.stringify(subscribeCBody));
      assert.equal(subscribeCBody.data!.issue.subscribed, true);

      const listed = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues?subscribed=${SUBSCRIBED_ME}`,
        { headers: { cookie: userC.cookies } },
      );
      const listedBody = (await listed.json()) as Envelope<{ issues: PublicIssue[] }>;
      assert.equal(listed.status, HttpStatus.OK, JSON.stringify(listedBody));
      assert.equal(listedBody.data!.issues.length, 1);
      assert.equal(listedBody.data!.issues[0]?.id, issueId);

      const listedA = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues?subscribed=${SUBSCRIBED_ME}`,
        { headers: { cookie: userA.cookies } },
      );
      const listedABody = (await listedA.json()) as Envelope<{ issues: PublicIssue[] }>;
      assert.equal(listedABody.data!.issues.length, 1);

      const commentRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/comments`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ body: 'Ping watchers' }),
        },
      );
      assert.equal(commentRes.status, HttpStatus.CREATED, await commentRes.text());

      const inboxA = await listInbox(origin, slugA, userA.cookies);
      assert.equal(inboxA.body.data!.notifications.length, 0);

      const inboxC = await listInbox(origin, slugA, userC.cookies);
      assert.equal(inboxC.body.data!.notifications.length, 1);
      assert.equal(inboxC.body.data!.notifications[0]?.type, NotificationType.COMMENT);

      const unsubscribeC = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/subscription`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json', cookie: userC.cookies },
          body: JSON.stringify({ subscribed: false }),
        },
      );
      const unsubBody = (await unsubscribeC.json()) as Envelope<{ issue: PublicIssue }>;
      assert.equal(unsubscribeC.status, HttpStatus.OK);
      assert.equal(unsubBody.data!.issue.subscribed, false);

      const statusRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ status: IssueStatus.DONE }),
      });
      assert.equal(statusRes.status, HttpStatus.OK, await statusRes.text());
      const afterUnsubStatus = await listInbox(origin, slugA, userC.cookies);
      assert.equal(afterUnsubStatus.body.data!.notifications.length, 1);

      const assignC = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ assigneeId: userC.userId }),
      });
      assert.equal(assignC.status, HttpStatus.OK, await assignC.text());
      const afterAssign = await listInbox(origin, slugA, userC.cookies);
      assert.equal(afterAssign.body.data!.notifications.length, 2);
      assert.ok(
        afterAssign.body.data!.notifications.some((row) => row.type === NotificationType.ASSIGNEE),
      );

      const otherSub = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/subscription`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ subscribed: true }),
        },
      );
      assert.equal(otherSub.status, HttpStatus.OK);

      const assignAgain = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ assigneeId: userA.userId }),
      });
      assert.equal(assignAgain.status, HttpStatus.OK);
      const inboxCAfterReassign = await listInbox(origin, slugA, userC.cookies);
      assert.equal(inboxCAfterReassign.body.data!.notifications.length, 2);

      const missing = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/00000000-0000-4000-8000-000000000000/subscription`,
        {
          method: 'PUT',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ subscribed: true }),
        },
      );
      const missingBody = (await missing.json()) as Envelope<unknown>;
      assert.equal(missing.status, HttpStatus.NOT_FOUND);
      assert.equal(missingBody.error?.code, ErrorCode.NOT_FOUND);
    } finally {
      await close(server);
    }
  },
);
