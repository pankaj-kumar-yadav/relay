import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { NotificationType } from '@/constants/inbox.constant.js';
import { IssueStatus } from '@/constants/issue.js';
import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

type PublicNotification = {
  id: string;
  type: string;
  readAt: string | null;
  actor: { id: string };
  issue: { id: string };
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
  'inbox is tenant-scoped; comment assignee and status emit for the recipient only',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `inb-a-${suffix}@relay.test`;
    const emailB = `inb-b-${suffix}@relay.test`;
    const emailC = `inb-c-${suffix}@relay.test`;
    const slugA = `inb-a-${suffix}`;
    const slugB = `inb-b-${suffix}`;
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

      const unauth = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/notifications`);
      assert.equal(unauth.status, HttpStatus.UNAUTHORIZED);

      const crossOrg = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/notifications`, {
        headers: { cookie: userB.cookies },
      });
      const crossOrgBody = (await crossOrg.json()) as Envelope<unknown>;
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);
      assert.equal(crossOrgBody.error?.code, ErrorCode.FORBIDDEN);

      const issueRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({
          title: 'Inbox issue',
          assigneeId: userC.userId,
        }),
      });
      const created = (await issueRes.json()) as Envelope<{
        issue: { id: string };
      }>;
      assert.equal(issueRes.status, HttpStatus.CREATED, JSON.stringify(created));
      const issueId = created.data!.issue.id;

      const commentRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/comments`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ body: 'Please take a look' }),
        },
      );
      assert.equal(commentRes.status, HttpStatus.CREATED, await commentRes.text());

      const inboxA = await listInbox(origin, slugA, userA.cookies);
      assert.equal(inboxA.res.status, HttpStatus.OK, JSON.stringify(inboxA.body));
      assert.equal(inboxA.body.data!.notifications.length, 0);
      assert.equal(inboxA.body.data!.unreadCount, 0);

      const inboxC = await listInbox(origin, slugA, userC.cookies);
      assert.equal(inboxC.res.status, HttpStatus.OK, JSON.stringify(inboxC.body));
      assert.equal(inboxC.body.data!.notifications.length, 1);
      assert.equal(inboxC.body.data!.unreadCount, 1);
      assert.equal(inboxC.body.data!.notifications[0]?.type, NotificationType.COMMENT);
      assert.equal(inboxC.body.data!.notifications[0]?.actor.id, userA.userId);
      const commentNotificationId = inboxC.body.data!.notifications[0]!.id;

      const selfComment = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/comments`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: userC.cookies },
          body: JSON.stringify({ body: 'Working on it' }),
        },
      );
      assert.equal(selfComment.status, HttpStatus.CREATED);
      const afterSelf = await listInbox(origin, slugA, userC.cookies);
      assert.equal(afterSelf.body.data!.notifications.length, 1);

      const statusRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ status: IssueStatus.DONE }),
      });
      assert.equal(statusRes.status, HttpStatus.OK, await statusRes.text());
      const afterStatus = await listInbox(origin, slugA, userC.cookies);
      assert.equal(afterStatus.body.data!.notifications.length, 2);
      assert.equal(afterStatus.body.data!.unreadCount, 2);
      assert.ok(
        afterStatus.body.data!.notifications.some(
          (row) => row.type === NotificationType.STATUS,
        ),
      );

      const unassignRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ assigneeId: null }),
      });
      assert.equal(unassignRes.status, HttpStatus.OK);
      const afterUnassign = await listInbox(origin, slugA, userC.cookies);
      assert.equal(afterUnassign.body.data!.notifications.length, 2);

      const statusUnassigned = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ status: IssueStatus.IN_PROGRESS }),
        },
      );
      assert.equal(statusUnassigned.status, HttpStatus.OK);
      const afterUnassignedStatus = await listInbox(origin, slugA, userC.cookies);
      assert.equal(afterUnassignedStatus.body.data!.notifications.length, 2);

      const assignSelf = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ assigneeId: userA.userId }),
      });
      assert.equal(assignSelf.status, HttpStatus.OK);
      const inboxAAfterSelf = await listInbox(origin, slugA, userA.cookies);
      assert.equal(inboxAAfterSelf.body.data!.notifications.length, 0);

      const assignC = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ assigneeId: userC.userId }),
      });
      assert.equal(assignC.status, HttpStatus.OK, await assignC.text());
      const afterAssign = await listInbox(origin, slugA, userC.cookies);
      assert.equal(afterAssign.body.data!.notifications.length, 3);
      assert.ok(
        afterAssign.body.data!.notifications.some(
          (row) => row.type === NotificationType.ASSIGNEE,
        ),
      );

      const markOther = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/notifications/${commentNotificationId}/read`,
        {
          method: 'POST',
          headers: { cookie: userA.cookies },
        },
      );
      assert.equal(markOther.status, HttpStatus.NOT_FOUND);

      const markOne = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/notifications/${commentNotificationId}/read`,
        {
          method: 'POST',
          headers: { cookie: userC.cookies },
        },
      );
      const markOneBody = (await markOne.json()) as Envelope<{
        notification: PublicNotification;
      }>;
      assert.equal(markOne.status, HttpStatus.OK, JSON.stringify(markOneBody));
      assert.ok(markOneBody.data!.notification.readAt);

      const afterMarkOne = await listInbox(origin, slugA, userC.cookies);
      assert.equal(afterMarkOne.body.data!.unreadCount, 2);

      const markAll = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/notifications/read-all`, {
        method: 'POST',
        headers: { cookie: userC.cookies },
      });
      const markAllBody = (await markAll.json()) as Envelope<{
        unreadCount: number;
      }>;
      assert.equal(markAll.status, HttpStatus.OK, JSON.stringify(markAllBody));
      assert.equal(markAllBody.data!.unreadCount, 0);
      const afterAll = await listInbox(origin, slugA, userC.cookies);
      assert.equal(afterAll.body.data!.unreadCount, 0);
      assert.equal(afterAll.body.data!.notifications.length, 3);
      assert.ok(afterAll.body.data!.notifications.every((row) => row.readAt));
    } finally {
      await prisma.organization.deleteMany({
        where: { slug: { in: [slugA, slugB] } },
      });
      await prisma.user.deleteMany({
        where: { email: { in: [emailA, emailB, emailC] } },
      });
      await close(server);
    }
  },
);
