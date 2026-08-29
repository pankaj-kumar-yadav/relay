import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

type PublicView = {
  id: string;
  slug: string;
  name: string;
  filters: Record<string, string>;
  ownerId: string;
  owner: { id: string; name: string };
};

test(
  'views are org-scoped; owner CRUD, members can GET',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `view-a-${suffix}@relay.test`;
    const emailB = `view-b-${suffix}@relay.test`;
    const emailC = `view-c-${suffix}@relay.test`;
    const slugA = `view-a-${suffix}`;
    const slugB = `view-b-${suffix}`;
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

      const unauth = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views`);
      assert.equal(unauth.status, HttpStatus.UNAUTHORIZED);

      const crossOrg = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views`, {
        headers: { cookie: userB.cookies },
      });
      const crossOrgBody = (await crossOrg.json()) as Envelope<unknown>;
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);
      assert.equal(crossOrgBody.success, false);
      assert.equal(crossOrgBody.error?.code, ErrorCode.FORBIDDEN);

      const createRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({
          name: ' Active bugs ',
          filters: { statusCategory: 'started', labelId: crypto.randomUUID() },
        }),
      });
      const created = (await createRes.json()) as Envelope<{ view: PublicView }>;
      assert.equal(createRes.status, HttpStatus.CREATED, JSON.stringify(created));
      assert.equal(created.data!.view.name, 'Active bugs');
      assert.equal(created.data!.view.slug, 'active-bugs');
      assert.equal(created.data!.view.ownerId, userA.userId);
      assert.equal(created.data!.view.owner.name, 'User A');
      assert.equal(created.data!.view.filters.statusCategory, 'started');
      const viewId = created.data!.view.id;
      const viewSlug = created.data!.view.slug;

      const emptyFilters = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'All issues' }),
      });
      const emptyBody = (await emptyFilters.json()) as Envelope<{ view: PublicView }>;
      assert.equal(emptyFilters.status, HttpStatus.CREATED, JSON.stringify(emptyBody));
      assert.deepEqual(emptyBody.data!.view.filters, {});
      assert.equal(emptyBody.data!.view.slug, 'all-issues');

      const dupName = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Active bugs' }),
      });
      const dupBody = (await dupName.json()) as Envelope<{ view: PublicView }>;
      assert.equal(dupName.status, HttpStatus.CREATED, JSON.stringify(dupBody));
      assert.equal(dupBody.data!.view.slug, 'active-bugs-2');

      const meFilter = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Mine', filters: { assigneeId: 'me' } }),
      });
      assert.equal(meFilter.status, HttpStatus.BAD_REQUEST);

      const unknownKey = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Bad', filters: { cursor: 'x' } }),
      });
      assert.equal(unknownKey.status, HttpStatus.BAD_REQUEST);

      const memberGet = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views/${viewSlug}`, {
        headers: { cookie: userC.cookies },
      });
      const memberGot = (await memberGet.json()) as Envelope<{ view: PublicView }>;
      assert.equal(memberGet.status, HttpStatus.OK, JSON.stringify(memberGot));
      assert.equal(memberGot.data!.view.id, viewId);
      assert.equal(memberGot.data!.view.slug, viewSlug);

      const byUuid = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views/${viewId}`, {
        headers: { cookie: userA.cookies },
      });
      assert.equal(byUuid.status, HttpStatus.NOT_FOUND);

      const memberList = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views`, {
        headers: { cookie: userC.cookies },
      });
      const listed = (await memberList.json()) as Envelope<{ views: PublicView[] }>;
      assert.equal(memberList.status, HttpStatus.OK, JSON.stringify(listed));
      assert.equal(listed.data!.views.length, 3);

      const memberPatch = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views/${viewSlug}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userC.cookies },
        body: JSON.stringify({ name: 'Nope' }),
      });
      assert.equal(memberPatch.status, HttpStatus.FORBIDDEN);

      const memberDelete = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views/${viewSlug}`, {
        method: 'DELETE',
        headers: { cookie: userC.cookies },
      });
      assert.equal(memberDelete.status, HttpStatus.FORBIDDEN);

      const patchRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views/${viewSlug}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Bugs', filters: { status: 'blocked' } }),
      });
      const patched = (await patchRes.json()) as Envelope<{ view: PublicView }>;
      assert.equal(patchRes.status, HttpStatus.OK, JSON.stringify(patched));
      assert.equal(patched.data!.view.name, 'Bugs');
      assert.equal(patched.data!.view.slug, viewSlug);
      assert.deepEqual(patched.data!.view.filters, { status: 'blocked' });

      const deleteRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views/${viewSlug}`, {
        method: 'DELETE',
        headers: { cookie: userA.cookies },
      });
      const deleted = (await deleteRes.json()) as Envelope<{ id: string }>;
      assert.equal(deleteRes.status, HttpStatus.OK, JSON.stringify(deleted));
      assert.equal(deleted.data!.id, viewId);

      const missing = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/views/${viewSlug}`, {
        headers: { cookie: userA.cookies },
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
