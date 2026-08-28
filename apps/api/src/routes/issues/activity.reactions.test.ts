import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

type ActivityComment = {
  kind: string;
  id: string;
  reactions?: Array<{ emoji: string; count: number; reacted: boolean }>;
};

test(
  'comment reactions toggle, aggregate, and stay tenant-scoped',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `rxn-a-${suffix}@relay.test`;
    const emailB = `rxn-b-${suffix}@relay.test`;
    const emailC = `rxn-c-${suffix}@relay.test`;
    const slugA = `rxn-a-${suffix}`;
    const slugB = `rxn-b-${suffix}`;
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
        body: JSON.stringify({ title: 'Reaction issue' }),
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
          body: JSON.stringify({ body: 'Ship it' }),
        },
      );
      const commentBody = (await commentRes.json()) as Envelope<{
        comment: { id: string };
      }>;
      assert.equal(commentRes.status, HttpStatus.CREATED, JSON.stringify(commentBody));
      const commentId = commentBody.data!.comment.id;
      const reactionUrl = `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/comments/${commentId}/reactions`;

      const invalid = await fetch(reactionUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ emoji: 'not-an-emoji' }),
      });
      assert.equal(invalid.status, HttpStatus.BAD_REQUEST);

      const pickerEmoji = await fetch(reactionUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ emoji: '💜' }),
      });
      const pickerBody = (await pickerEmoji.json()) as Envelope<{
        reactions: Array<{ emoji: string; count: number; reacted: boolean }>;
      }>;
      assert.equal(pickerEmoji.status, HttpStatus.CREATED, JSON.stringify(pickerBody));
      assert.deepEqual(pickerBody.data!.reactions, [
        { emoji: '💜', count: 1, reacted: true },
      ]);

      const pickerOff = await fetch(reactionUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ emoji: '💜' }),
      });
      assert.equal(pickerOff.status, HttpStatus.OK);

      const addRes = await fetch(reactionUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ emoji: '👍' }),
      });
      const addBody = (await addRes.json()) as Envelope<{
        reactions: Array<{ emoji: string; count: number; reacted: boolean }>;
      }>;
      assert.equal(addRes.status, HttpStatus.CREATED, JSON.stringify(addBody));
      assert.deepEqual(addBody.data!.reactions, [
        { emoji: '👍', count: 1, reacted: true },
      ]);

      const second = await fetch(reactionUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userC.cookies },
        body: JSON.stringify({ emoji: '👍' }),
      });
      const secondBody = (await second.json()) as Envelope<{
        reactions: Array<{ emoji: string; count: number; reacted: boolean }>;
      }>;
      assert.equal(second.status, HttpStatus.CREATED, JSON.stringify(secondBody));
      assert.deepEqual(secondBody.data!.reactions, [
        { emoji: '👍', count: 2, reacted: true },
      ]);

      const activityRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/activity`,
        { headers: { cookie: userA.cookies } },
      );
      const activity = (await activityRes.json()) as Envelope<{
        items: ActivityComment[];
      }>;
      assert.equal(activityRes.status, HttpStatus.OK, JSON.stringify(activity));
      const comment = activity.data!.items.find(
        (item) => item.kind === 'comment' && item.id === commentId,
      );
      assert.deepEqual(comment?.reactions, [
        { emoji: '👍', count: 2, reacted: true },
      ]);

      const asC = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/activity`, {
        headers: { cookie: userC.cookies },
      });
      const asCBody = (await asC.json()) as Envelope<{ items: ActivityComment[] }>;
      const commentAsC = asCBody.data!.items.find(
        (item) => item.kind === 'comment' && item.id === commentId,
      );
      assert.equal(commentAsC?.reactions?.[0]?.reacted, true);

      const toggleOff = await fetch(reactionUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ emoji: '👍' }),
      });
      const toggleBody = (await toggleOff.json()) as Envelope<{
        reactions: Array<{ emoji: string; count: number; reacted: boolean }>;
      }>;
      assert.equal(toggleOff.status, HttpStatus.OK, JSON.stringify(toggleBody));
      assert.deepEqual(toggleBody.data!.reactions, [
        { emoji: '👍', count: 1, reacted: false },
      ]);

      const crossOrg = await fetch(reactionUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userB.cookies },
        body: JSON.stringify({ emoji: '👍' }),
      });
      const crossOrgBody = (await crossOrg.json()) as Envelope<unknown>;
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);
      assert.equal(crossOrgBody.error?.code, ErrorCode.FORBIDDEN);

      const missing = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/comments/00000000-0000-4000-8000-000000000000/reactions`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ emoji: '👍' }),
        },
      );
      assert.equal(missing.status, HttpStatus.NOT_FOUND);
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
