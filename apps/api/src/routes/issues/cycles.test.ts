import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IssueEventType } from '@/constants/activity.constant.js';
import { CycleStatus } from '@/constants/cycle.constant.js';
import { API_PREFIX, HttpStatus } from '@/constants/http.js';
import { DEFAULT_TEAM_KEY } from '@/constants/issue.js';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

type PublicIssue = {
  id: string;
  cycleId: string | null;
  cycle: { id: string; name: string; status: string } | null;
};

test(
  'issues can be filtered and patched by cycleId; cycle events record names',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `icyc-a-${suffix}@relay.test`;
    const emailB = `icyc-b-${suffix}@relay.test`;
    const slugA = `icyc-a-${suffix}`;
    const slugB = `icyc-b-${suffix}`;
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

      const orgARes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Org A', slug: slugA }),
      });
      const orgABody = (await orgARes.json()) as Envelope<{
        organization: { id: string };
        team: { id: string };
      }>;
      assert.equal(orgARes.status, HttpStatus.CREATED, JSON.stringify(orgABody));

      const orgBRes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userB.cookies },
        body: JSON.stringify({ name: 'Org B', slug: slugB }),
      });
      assert.equal(orgBRes.status, HttpStatus.CREATED, await orgBRes.text());

      const extraTeamRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/teams`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Design', key: 'DES' }),
      });
      assert.equal(extraTeamRes.status, HttpStatus.CREATED, await extraTeamRes.text());

      const cycleRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/teams/${DEFAULT_TEAM_KEY}/cycles`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({
            name: 'Cycle 1',
            startsAt: '2026-08-03T00:00:00.000Z',
            endsAt: '2026-08-16T00:00:00.000Z',
            status: CycleStatus.ACTIVE,
          }),
        },
      );
      const cycle = (await cycleRes.json()) as Envelope<{ cycle: { id: string } }>;
      assert.equal(cycleRes.status, HttpStatus.CREATED, JSON.stringify(cycle));
      const cycleId = cycle.data!.cycle.id;

      const otherTeamCycleRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/teams/DES/cycles`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({
            name: 'Design Cycle',
            startsAt: '2026-08-03T00:00:00.000Z',
            endsAt: '2026-08-16T00:00:00.000Z',
          }),
        },
      );
      const otherTeamCycle = (await otherTeamCycleRes.json()) as Envelope<{
        cycle: { id: string };
      }>;
      assert.equal(otherTeamCycleRes.status, HttpStatus.CREATED, JSON.stringify(otherTeamCycle));

      const otherOrgCycleRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugB}/teams/${DEFAULT_TEAM_KEY}/cycles`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: userB.cookies },
          body: JSON.stringify({
            name: 'Org B Cycle',
            startsAt: '2026-08-03T00:00:00.000Z',
            endsAt: '2026-08-16T00:00:00.000Z',
          }),
        },
      );
      const otherOrgCycle = (await otherOrgCycleRes.json()) as Envelope<{
        cycle: { id: string };
      }>;
      assert.equal(otherOrgCycleRes.status, HttpStatus.CREATED, JSON.stringify(otherOrgCycle));

      const createInCycle = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ title: 'In cycle', cycleId }),
      });
      const inCycle = (await createInCycle.json()) as Envelope<{ issue: PublicIssue }>;
      assert.equal(createInCycle.status, HttpStatus.CREATED, JSON.stringify(inCycle));
      assert.equal(inCycle.data!.issue.cycleId, cycleId);
      assert.equal(inCycle.data!.issue.cycle?.name, 'Cycle 1');
      const inCycleId = inCycle.data!.issue.id;

      const backlogRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ title: 'Backlog' }),
      });
      const backlog = (await backlogRes.json()) as Envelope<{ issue: PublicIssue }>;
      assert.equal(backlogRes.status, HttpStatus.CREATED, JSON.stringify(backlog));
      assert.equal(backlog.data!.issue.cycleId, null);
      const backlogId = backlog.data!.issue.id;

      const listed = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues?cycleId=${cycleId}`,
        { headers: { cookie: userA.cookies } },
      );
      const listedBody = (await listed.json()) as Envelope<{ issues: PublicIssue[] }>;
      assert.equal(listed.status, HttpStatus.OK, JSON.stringify(listedBody));
      assert.equal(listedBody.data!.issues.length, 1);
      assert.equal(listedBody.data!.issues[0]?.id, inCycleId);

      const crossTeam = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${backlogId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ cycleId: otherTeamCycle.data!.cycle.id }),
        },
      );
      assert.equal(crossTeam.status, HttpStatus.BAD_REQUEST);

      const crossOrg = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${backlogId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ cycleId: otherOrgCycle.data!.cycle.id }),
      });
      assert.equal(crossOrg.status, HttpStatus.BAD_REQUEST);

      const patchRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${backlogId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ cycleId }),
      });
      const patched = (await patchRes.json()) as Envelope<{ issue: PublicIssue }>;
      assert.equal(patchRes.status, HttpStatus.OK, JSON.stringify(patched));
      assert.equal(patched.data!.issue.cycleId, cycleId);

      const clearRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${backlogId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ cycleId: null }),
      });
      const cleared = (await clearRes.json()) as Envelope<{ issue: PublicIssue }>;
      assert.equal(clearRes.status, HttpStatus.OK, JSON.stringify(cleared));
      assert.equal(cleared.data!.issue.cycleId, null);

      const same = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues/${inCycleId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ cycleId }),
      });
      assert.equal(same.status, HttpStatus.OK);

      const activityRes = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${backlogId}/activity`,
        { headers: { cookie: userA.cookies } },
      );
      const activity = (await activityRes.json()) as Envelope<{
        items: Array<{ type: string; payload: { from?: string | null; to?: string | null } }>;
      }>;
      assert.equal(activityRes.status, HttpStatus.OK, JSON.stringify(activity));
      const cycleEvents = activity.data!.items.filter(
        (item) => item.type === IssueEventType.CYCLE,
      );
      assert.equal(cycleEvents.length, 2);
      assert.equal(cycleEvents[0]?.payload.to, 'Cycle 1');
      assert.equal(cycleEvents[1]?.payload.from, 'Cycle 1');
      assert.equal(cycleEvents[1]?.payload.to, null);

      const inCycleActivity = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${inCycleId}/activity`,
        { headers: { cookie: userA.cookies } },
      );
      const inCycleItems = (await inCycleActivity.json()) as Envelope<{
        items: Array<{ type: string }>;
      }>;
      const unchanged = inCycleItems.data!.items.filter(
        (item) => item.type === IssueEventType.CYCLE,
      );
      assert.equal(unchanged.length, 1);
    } finally {
      await prisma.organization.deleteMany({ where: { slug: { in: [slugA, slugB] } } });
      await prisma.user.deleteMany({
        where: { email: { in: [emailA, emailB] } },
      });
      await close(server);
    }
  },
);
