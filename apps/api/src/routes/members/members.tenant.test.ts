import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

type PublicMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

test(
  'members role/remove are admin-only; last admin is protected; org-scoped',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `mem-a-${suffix}@relay.test`;
    const emailB = `mem-b-${suffix}@relay.test`;
    const emailC = `mem-c-${suffix}@relay.test`;
    const emailD = `mem-d-${suffix}@relay.test`;
    const slugA = `mem-a-${suffix}`;
    const slugB = `mem-b-${suffix}`;
    const password = 'password1';
    const { server, origin } = await listen();

    try {
      const userA = await register(origin, {
        name: 'Admin A',
        email: emailA,
        password,
      });
      const userB = await register(origin, {
        name: 'Outsider B',
        email: emailB,
        password,
      });
      const userC = await register(origin, {
        name: 'Employee C',
        email: emailC,
        password,
      });
      const userD = await register(origin, {
        name: 'Admin D',
        email: emailD,
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
        `${origin}${API_PREFIX}/orgs/${slugA}/members/${userC.userId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ role: OrgRole.ADMIN }),
        },
      );
      assert.equal(unauth.status, HttpStatus.UNAUTHORIZED);

      const crossOrg = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/members/${userC.userId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: userB.cookies },
          body: JSON.stringify({ role: OrgRole.ADMIN }),
        },
      );
      const crossOrgBody = (await crossOrg.json()) as Envelope<unknown>;
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);
      assert.equal(crossOrgBody.error?.code, ErrorCode.FORBIDDEN);

      const employeePatch = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/members/${userA.userId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: userC.cookies },
          body: JSON.stringify({ role: OrgRole.EMPLOYEE }),
        },
      );
      assert.equal(employeePatch.status, HttpStatus.FORBIDDEN);

      const employeeDelete = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/members/${userA.userId}`,
        {
          method: 'DELETE',
          headers: { cookie: userC.cookies },
        },
      );
      assert.equal(employeeDelete.status, HttpStatus.FORBIDDEN);

      const lastAdminDemote = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/members/${userA.userId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ role: OrgRole.EMPLOYEE }),
        },
      );
      const lastAdminDemoteBody = (await lastAdminDemote.json()) as Envelope<unknown>;
      assert.equal(lastAdminDemote.status, HttpStatus.FORBIDDEN);
      assert.equal(lastAdminDemoteBody.error?.code, ErrorCode.FORBIDDEN);

      const lastAdminRemove = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/members/${userA.userId}`,
        {
          method: 'DELETE',
          headers: { cookie: userA.cookies },
        },
      );
      assert.equal(lastAdminRemove.status, HttpStatus.FORBIDDEN);

      const missing = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/members/${userB.userId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ role: OrgRole.ADMIN }),
        },
      );
      assert.equal(missing.status, HttpStatus.NOT_FOUND);

      const invalidRole = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/members/${userC.userId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ role: 'owner' }),
        },
      );
      assert.equal(invalidRole.status, HttpStatus.BAD_REQUEST);

      const promote = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/members/${userC.userId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ role: OrgRole.ADMIN }),
        },
      );
      const promoted = (await promote.json()) as Envelope<{ member: PublicMember }>;
      assert.equal(promote.status, HttpStatus.OK, JSON.stringify(promoted));
      assert.equal(promoted.data!.member.role, OrgRole.ADMIN);
      assert.equal(promoted.data!.member.id, userC.userId);

      await prisma.membership.create({
        data: {
          organizationId: orgAId,
          userId: userD.userId,
          role: OrgRole.EMPLOYEE,
        },
      });

      const demote = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/members/${userC.userId}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({ role: OrgRole.EMPLOYEE }),
        },
      );
      const demoted = (await demote.json()) as Envelope<{ member: PublicMember }>;
      assert.equal(demote.status, HttpStatus.OK, JSON.stringify(demoted));
      assert.equal(demoted.data!.member.role, OrgRole.EMPLOYEE);

      const removed = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/members/${userD.userId}`,
        {
          method: 'DELETE',
          headers: { cookie: userA.cookies },
        },
      );
      const removedBody = (await removed.json()) as Envelope<{ id: string }>;
      assert.equal(removed.status, HttpStatus.OK, JSON.stringify(removedBody));
      assert.equal(removedBody.data!.id, userD.userId);

      const list = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/members`, {
        headers: { cookie: userA.cookies },
      });
      const listBody = (await list.json()) as Envelope<{ members: PublicMember[] }>;
      assert.equal(list.status, HttpStatus.OK);
      const ids = listBody.data!.members.map((m) => m.id).sort();
      assert.deepEqual(ids, [userA.userId, userC.userId].sort());
    } finally {
      await prisma.organization.deleteMany({ where: { slug: { in: [slugA, slugB] } } });
      await prisma.user.deleteMany({
        where: { email: { in: [emailA, emailB, emailC, emailD] } },
      });
      await close(server);
    }
  },
);
