import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { PROJECT_ICON_MAX } from '@/constants/project.constant.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

type PublicTeam = {
  id: string;
  key: string;
  name: string;
  icon: string;
};

type PublicProject = {
  id: string;
  name: string;
  icon: string;
  team: PublicTeam;
};

test(
  'project icons persist; empty by default; tenant scoped',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `picon-a-${suffix}@relay.test`;
    const emailB = `picon-b-${suffix}@relay.test`;
    const slugA = `picon-a-${suffix}`;
    const slugB = `picon-b-${suffix}`;
    const password = 'password1';
    const { server, origin } = await listen();
    const projectsUrl = (slug: string) => `${origin}${API_PREFIX}/orgs/${slug}/projects`;

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
      const teamKey = orgABody.data!.team.key;

      const orgBRes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userB.cookies },
        body: JSON.stringify({ name: 'Org B', slug: slugB }),
      });
      assert.equal(orgBRes.status, HttpStatus.CREATED, await orgBRes.text());

      const unauth = await fetch(projectsUrl(slugA));
      assert.equal(unauth.status, HttpStatus.UNAUTHORIZED);

      const crossOrg = await fetch(projectsUrl(slugA), {
        headers: { cookie: userB.cookies },
      });
      const crossOrgBody = (await crossOrg.json()) as Envelope<unknown>;
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);
      assert.equal(crossOrgBody.error?.code, ErrorCode.FORBIDDEN);

      const createRes = await fetch(projectsUrl(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'LMS Platform', teamId: teamKey, icon: ' 🚀 ' }),
      });
      const created = (await createRes.json()) as Envelope<{ project: PublicProject }>;
      assert.equal(createRes.status, HttpStatus.CREATED, JSON.stringify(created));
      assert.equal(created.data!.project.icon, '🚀');
      const projectId = created.data!.project.id;

      const createEmpty = await fetch(projectsUrl(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'LMS Mobile', teamId: teamKey }),
      });
      const emptyProject = (await createEmpty.json()) as Envelope<{ project: PublicProject }>;
      assert.equal(createEmpty.status, HttpStatus.CREATED, JSON.stringify(emptyProject));
      assert.equal(emptyProject.data!.project.icon, '');

      const tooLong = await fetch(projectsUrl(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({
          name: 'Too long',
          teamId: teamKey,
          icon: 'x'.repeat(PROJECT_ICON_MAX + 1),
        }),
      });
      const tooLongBody = (await tooLong.json()) as Envelope<unknown>;
      assert.equal(tooLong.status, HttpStatus.BAD_REQUEST);
      assert.equal(tooLongBody.error?.code, ErrorCode.VALIDATION_ERROR);

      const patchRes = await fetch(`${projectsUrl(slugA)}/${projectId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ icon: '📚' }),
      });
      const patched = (await patchRes.json()) as Envelope<{ project: PublicProject }>;
      assert.equal(patchRes.status, HttpStatus.OK, JSON.stringify(patched));
      assert.equal(patched.data!.project.icon, '📚');

      const getRes = await fetch(`${projectsUrl(slugA)}/${projectId}`, {
        headers: { cookie: userA.cookies },
      });
      const got = (await getRes.json()) as Envelope<{ project: PublicProject }>;
      assert.equal(getRes.status, HttpStatus.OK, JSON.stringify(got));
      assert.equal(got.data!.project.icon, '📚');

      const listRes = await fetch(projectsUrl(slugA), {
        headers: { cookie: userA.cookies },
      });
      const listed = (await listRes.json()) as Envelope<{ projects: PublicProject[] }>;
      assert.equal(listRes.status, HttpStatus.OK, JSON.stringify(listed));
      const listedProject = listed.data!.projects.find((project) => project.id === projectId);
      assert.ok(listedProject);
      assert.equal(listedProject!.icon, '📚');

      const clearRes = await fetch(`${projectsUrl(slugA)}/${projectId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ icon: '' }),
      });
      const cleared = (await clearRes.json()) as Envelope<{ project: PublicProject }>;
      assert.equal(clearRes.status, HttpStatus.OK, JSON.stringify(cleared));
      assert.equal(cleared.data!.project.icon, '');

      const crossPatch = await fetch(`${projectsUrl(slugA)}/${projectId}`, {
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
