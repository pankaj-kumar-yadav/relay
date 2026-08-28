import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

type Reaction = { emoji: string; count: number; reacted: boolean };

test(
  'issue reactions toggle, aggregate, and stay tenant-scoped',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `irxn-a-${suffix}@relay.test`;
    const emailB = `irxn-b-${suffix}@relay.test`;
    const emailC = `irxn-c-${suffix}@relay.test`;
    const slugA = `irxn-a-${suffix}`;
    const slugB = `irxn-b-${suffix}`;
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
      const reactionUrl = `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/reactions`;

      const empty = await fetch(reactionUrl, { headers: { cookie: userA.cookies } });
      const emptyBody = (await empty.json()) as Envelope<{ reactions: Reaction[] }>;
      assert.equal(empty.status, HttpStatus.OK, JSON.stringify(emptyBody));
      assert.deepEqual(emptyBody.data!.reactions, []);

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
      const pickerBody = (await pickerEmoji.json()) as Envelope<{ reactions: Reaction[] }>;
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
      const addBody = (await addRes.json()) as Envelope<{ reactions: Reaction[] }>;
      assert.equal(addRes.status, HttpStatus.CREATED, JSON.stringify(addBody));
      assert.deepEqual(addBody.data!.reactions, [
        { emoji: '👍', count: 1, reacted: true },
      ]);

      const second = await fetch(reactionUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userC.cookies },
        body: JSON.stringify({ emoji: '👍' }),
      });
      const secondBody = (await second.json()) as Envelope<{ reactions: Reaction[] }>;
      assert.equal(second.status, HttpStatus.CREATED, JSON.stringify(secondBody));
      assert.deepEqual(secondBody.data!.reactions, [
        { emoji: '👍', count: 2, reacted: true },
      ]);

      const asA = await fetch(reactionUrl, { headers: { cookie: userA.cookies } });
      const asABody = (await asA.json()) as Envelope<{ reactions: Reaction[] }>;
      assert.deepEqual(asABody.data!.reactions, [
        { emoji: '👍', count: 2, reacted: true },
      ]);

      const asC = await fetch(reactionUrl, { headers: { cookie: userC.cookies } });
      const asCBody = (await asC.json()) as Envelope<{ reactions: Reaction[] }>;
      assert.equal(asCBody.data!.reactions[0]?.reacted, true);

      const toggleOff = await fetch(reactionUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ emoji: '👍' }),
      });
      const toggleBody = (await toggleOff.json()) as Envelope<{ reactions: Reaction[] }>;
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
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/00000000-0000-4000-8000-000000000000/reactions`,
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
