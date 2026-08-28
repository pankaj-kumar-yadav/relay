import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { DEFAULT_TEAM_KEY } from '@/constants/issue.js';
import { TEAM_ICON_MAX } from '@/constants/team.constant.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

type PublicTeam = {
  id: string;
  key: string;
  name: string;
  icon: string;
};

test(
  'team icons persist; empty by default; tenant scoped',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `ticon-a-${suffix}@relay.test`;
    const emailB = `ticon-b-${suffix}@relay.test`;
    const slugA = `ticon-a-${suffix}`;
    const slugB = `ticon-b-${suffix}`;
    const password = 'password1';
    const { server, origin } = await listen();
    const teamsUrl = (slug: string) => `${origin}${API_PREFIX}/orgs/${slug}/teams`;

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
        team: PublicTeam;
      }>;
      assert.equal(orgARes.status, HttpStatus.CREATED, JSON.stringify(orgABody));
      assert.equal(orgABody.data!.team.icon, '');

      const orgBRes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userB.cookies },
        body: JSON.stringify({ name: 'Org B', slug: slugB }),
      });
      assert.equal(orgBRes.status, HttpStatus.CREATED, await orgBRes.text());

      const unauth = await fetch(teamsUrl(slugA));
      assert.equal(unauth.status, HttpStatus.UNAUTHORIZED);

      const crossOrg = await fetch(teamsUrl(slugA), {
        headers: { cookie: userB.cookies },
      });
      const crossOrgBody = (await crossOrg.json()) as Envelope<unknown>;
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);
      assert.equal(crossOrgBody.error?.code, ErrorCode.FORBIDDEN);

      const listRes = await fetch(teamsUrl(slugA), {
        headers: { cookie: userA.cookies },
      });
      const listed = (await listRes.json()) as Envelope<{ teams: PublicTeam[] }>;
      assert.equal(listRes.status, HttpStatus.OK, JSON.stringify(listed));
      const core = listed.data!.teams.find((team) => team.key === DEFAULT_TEAM_KEY);
      assert.ok(core);
      assert.equal(core!.icon, '');

      const createRes = await fetch(teamsUrl(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Design', key: 'DES', icon: ' 🎨 ' }),
      });
      const created = (await createRes.json()) as Envelope<{ team: PublicTeam }>;
      assert.equal(createRes.status, HttpStatus.CREATED, JSON.stringify(created));
      assert.equal(created.data!.team.icon, '🎨');

      const createEmpty = await fetch(teamsUrl(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Web', key: 'WEB' }),
      });
      const emptyTeam = (await createEmpty.json()) as Envelope<{ team: PublicTeam }>;
      assert.equal(createEmpty.status, HttpStatus.CREATED, JSON.stringify(emptyTeam));
      assert.equal(emptyTeam.data!.team.icon, '');

      const tooLong = await fetch(teamsUrl(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Long', key: 'LNG', icon: 'x'.repeat(TEAM_ICON_MAX + 1) }),
      });
      const tooLongBody = (await tooLong.json()) as Envelope<unknown>;
      assert.equal(tooLong.status, HttpStatus.BAD_REQUEST);
      assert.equal(tooLongBody.error?.code, ErrorCode.VALIDATION_ERROR);

      const patchRes = await fetch(`${teamsUrl(slugA)}/${DEFAULT_TEAM_KEY}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ icon: '🛠️' }),
      });
      const patched = (await patchRes.json()) as Envelope<{ team: PublicTeam }>;
      assert.equal(patchRes.status, HttpStatus.OK, JSON.stringify(patched));
      assert.equal(patched.data!.team.icon, '🛠️');

      const getRes = await fetch(`${teamsUrl(slugA)}/${DEFAULT_TEAM_KEY}`, {
        headers: { cookie: userA.cookies },
      });
      const got = (await getRes.json()) as Envelope<{ team: PublicTeam }>;
      assert.equal(getRes.status, HttpStatus.OK, JSON.stringify(got));
      assert.equal(got.data!.team.icon, '🛠️');

      const clearRes = await fetch(`${teamsUrl(slugA)}/${DEFAULT_TEAM_KEY}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ icon: '' }),
      });
      const cleared = (await clearRes.json()) as Envelope<{ team: PublicTeam }>;
      assert.equal(clearRes.status, HttpStatus.OK, JSON.stringify(cleared));
      assert.equal(cleared.data!.team.icon, '');

      const crossPatch = await fetch(`${teamsUrl(slugA)}/${DEFAULT_TEAM_KEY}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userB.cookies },
        body: JSON.stringify({ icon: '🧠' }),
      });
      assert.equal(crossPatch.status, HttpStatus.FORBIDDEN);
    } finally {
      await close(server);
    }
  },
);
