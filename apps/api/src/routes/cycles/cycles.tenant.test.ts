import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CycleStatus } from '@/constants/cycle.constant.js';
import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { DEFAULT_TEAM_KEY } from '@/constants/issue.js';
import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

type PublicCycle = {
  id: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string;
  teamId: string;
  issueCount: number;
};

function cycleBody(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Cycle 1',
    startsAt: '2026-08-03T00:00:00.000Z',
    endsAt: '2026-08-16T00:00:00.000Z',
    status: CycleStatus.UPCOMING,
    ...overrides,
  };
}

test(
  'cycles are org-scoped; one active cycle per team',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `cyc-a-${suffix}@relay.test`;
    const emailB = `cyc-b-${suffix}@relay.test`;
    const emailC = `cyc-c-${suffix}@relay.test`;
    const slugA = `cyc-a-${suffix}`;
    const slugB = `cyc-b-${suffix}`;
    const password = 'password1';
    const { server, origin } = await listen();
    const teamPath = (slug: string) =>
      `${origin}${API_PREFIX}/orgs/${slug}/teams/${DEFAULT_TEAM_KEY}/cycles`;

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
        team: { id: string; key: string };
      }>;
      assert.equal(orgARes.status, HttpStatus.CREATED, JSON.stringify(orgABody));
      const orgAId = orgABody.data!.organization.id;
      const teamAId = orgABody.data!.team.id;

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

      const unauth = await fetch(teamPath(slugA));
      assert.equal(unauth.status, HttpStatus.UNAUTHORIZED);

      const crossOrg = await fetch(teamPath(slugA), {
        headers: { cookie: userB.cookies },
      });
      const crossOrgBody = (await crossOrg.json()) as Envelope<unknown>;
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);
      assert.equal(crossOrgBody.success, false);
      assert.equal(crossOrgBody.error?.code, ErrorCode.FORBIDDEN);

      const createRes = await fetch(teamPath(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify(cycleBody({ name: ' Cycle 1 ', status: CycleStatus.ACTIVE })),
      });
      const created = (await createRes.json()) as Envelope<{ cycle: PublicCycle }>;
      assert.equal(createRes.status, HttpStatus.CREATED, JSON.stringify(created));
      assert.equal(created.data!.cycle.name, 'Cycle 1');
      assert.equal(created.data!.cycle.status, CycleStatus.ACTIVE);
      assert.equal(created.data!.cycle.teamId, teamAId);
      assert.equal(created.data!.cycle.issueCount, 0);
      const cycleId = created.data!.cycle.id;

      const secondActive = await fetch(teamPath(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify(
          cycleBody({
            name: 'Cycle 2',
            startsAt: '2026-08-17T00:00:00.000Z',
            endsAt: '2026-08-30T00:00:00.000Z',
            status: CycleStatus.ACTIVE,
          }),
        ),
      });
      const secondActiveBody = (await secondActive.json()) as Envelope<unknown>;
      assert.equal(secondActive.status, HttpStatus.BAD_REQUEST, JSON.stringify(secondActiveBody));
      assert.equal(secondActiveBody.error?.code, ErrorCode.VALIDATION_ERROR);

      const upcomingRes = await fetch(teamPath(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userC.cookies },
        body: JSON.stringify(
          cycleBody({
            name: 'Cycle 2',
            startsAt: '2026-08-17T00:00:00.000Z',
            endsAt: '2026-08-30T00:00:00.000Z',
          }),
        ),
      });
      const upcoming = (await upcomingRes.json()) as Envelope<{ cycle: PublicCycle }>;
      assert.equal(upcomingRes.status, HttpStatus.CREATED, JSON.stringify(upcoming));
      assert.equal(upcoming.data!.cycle.status, CycleStatus.UPCOMING);

      const badRange = await fetch(teamPath(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify(
          cycleBody({
            name: 'Bad',
            startsAt: '2026-08-30T00:00:00.000Z',
            endsAt: '2026-08-17T00:00:00.000Z',
          }),
        ),
      });
      assert.equal(badRange.status, HttpStatus.BAD_REQUEST);

      const listRes = await fetch(teamPath(slugA), {
        headers: { cookie: userC.cookies },
      });
      const listed = (await listRes.json()) as Envelope<{ cycles: PublicCycle[] }>;
      assert.equal(listRes.status, HttpStatus.OK, JSON.stringify(listed));
      assert.deepEqual(
        listed.data!.cycles.map((cycle) => cycle.name),
        ['Cycle 2', 'Cycle 1'],
      );

      const patchRes = await fetch(`${teamPath(slugA)}/${cycleId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userC.cookies },
        body: JSON.stringify({ name: 'Cycle One', status: CycleStatus.COMPLETED }),
      });
      const patched = (await patchRes.json()) as Envelope<{ cycle: PublicCycle }>;
      assert.equal(patchRes.status, HttpStatus.OK, JSON.stringify(patched));
      assert.equal(patched.data!.cycle.name, 'Cycle One');
      assert.equal(patched.data!.cycle.status, CycleStatus.COMPLETED);

      const activateSecond = await fetch(`${teamPath(slugA)}/${upcoming.data!.cycle.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ status: CycleStatus.ACTIVE }),
      });
      const activated = (await activateSecond.json()) as Envelope<{ cycle: PublicCycle }>;
      assert.equal(activateSecond.status, HttpStatus.OK, JSON.stringify(activated));
      assert.equal(activated.data!.cycle.status, CycleStatus.ACTIVE);

      const missing = await fetch(`${teamPath(slugA)}/00000000-0000-4000-8000-000000000000`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Nope' }),
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
