import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ErrorCode, HttpStatus, API_PREFIX } from '@/constants/http.constant.js';
import { OrgRole } from '@relay/shared/constants/org.constant';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';
import {
  createMemoryStorage,
  setStorageClientForTest,
} from '@/utils/storage/storage.js';

test(
  'uploads reject unset storage, complete without object, and stay org-scoped',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const password = 'password1';
    const slugA = `up-a-${suffix}`;
    const slugB = `up-b-${suffix}`;
    const emailA = `up-a-${suffix}@relay.test`;
    const emailB = `up-b-${suffix}@relay.test`;
    const emailC = `up-c-${suffix}@relay.test`;
    const { server, origin } = await listen();

    try {
      setStorageClientForTest(null);
      const userA = await register(origin, {
        name: 'User A',
        email: emailA,
        password,
      });

      const orgARes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Org A', slug: slugA }),
      });
      const orgA = (await orgARes.json()) as Envelope<{ organization: { id: string } }>;
      assert.equal(orgARes.status, HttpStatus.CREATED, JSON.stringify(orgA));

      const unset = await fetch(`${origin}${API_PREFIX}/auth/me/avatar/intent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({
          contentType: 'image/png',
          byteSize: 12,
          fileName: 'me.png',
        }),
      });
      const unsetBody = (await unset.json()) as Envelope<unknown>;
      assert.equal(unset.status, HttpStatus.SERVICE_UNAVAILABLE);
      assert.equal(unsetBody.error?.code, ErrorCode.STORAGE_UNCONFIGURED);

      const storage = createMemoryStorage();
      setStorageClientForTest(storage);

      const intent = await fetch(`${origin}${API_PREFIX}/auth/me/avatar/intent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({
          contentType: 'image/png',
          byteSize: 12,
          fileName: 'me.png',
        }),
      });
      const intentBody = (await intent.json()) as Envelope<{
        attachment: { id: string };
        uploadUrl: string;
      }>;
      assert.equal(intent.status, HttpStatus.CREATED, JSON.stringify(intentBody));
      assert.match(intentBody.data!.uploadUrl, /^http:\/\/s3\.test\//);

      const missing = await fetch(`${origin}${API_PREFIX}/auth/me/avatar/complete`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ attachmentId: intentBody.data!.attachment.id }),
      });
      const missingBody = (await missing.json()) as Envelope<unknown>;
      assert.equal(missing.status, HttpStatus.BAD_REQUEST);
      assert.equal(missingBody.error?.code, ErrorCode.VALIDATION_ERROR);

      const userB = await register(origin, {
        name: 'User B',
        email: emailB,
        password,
      });
      const orgBRes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userB.cookies },
        body: JSON.stringify({ name: 'Org B', slug: slugB }),
      });
      assert.equal(orgBRes.status, HttpStatus.CREATED, await orgBRes.text());

      const userC = await register(origin, {
        name: 'User C',
        email: emailC,
        password,
      });
      await prisma.membership.create({
        data: {
          organizationId: orgA.data!.organization.id,
          userId: userC.userId,
          role: OrgRole.EMPLOYEE,
        },
      });

      const createdRes = await fetch(`${origin}${API_PREFIX}/orgs/${slugA}/issues`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ title: 'File issue' }),
      });
      const created = (await createdRes.json()) as Envelope<{
        issue: { id: string };
      }>;
      assert.equal(createdRes.status, HttpStatus.CREATED, JSON.stringify(created));
      const issueId = created.data!.issue.id;

      const issueIntent = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/attachments/intent`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', cookie: userA.cookies },
          body: JSON.stringify({
            contentType: 'application/pdf',
            byteSize: 8,
            fileName: 'spec.pdf',
          }),
        },
      );
      const issueIntentBody = (await issueIntent.json()) as Envelope<{
        attachment: { id: string };
        uploadUrl: string;
      }>;
      assert.equal(issueIntent.status, HttpStatus.CREATED, JSON.stringify(issueIntentBody));
      const attachmentId = issueIntentBody.data!.attachment.id;
      const objectKey = decodeURIComponent(
        new URL(issueIntentBody.data!.uploadUrl).pathname.replace('/put/', ''),
      );
      storage.objects.set(objectKey, { size: 8, contentType: 'application/pdf' });

      const complete = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/attachments/${attachmentId}/complete`,
        { method: 'POST', headers: { cookie: userA.cookies } },
      );
      assert.equal(complete.status, HttpStatus.OK, await complete.text());

      const listC = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/attachments`,
        { headers: { cookie: userC.cookies } },
      );
      const listCBody = (await listC.json()) as Envelope<{
        attachments: { fileName: string }[];
      }>;
      assert.equal(listC.status, HttpStatus.OK, JSON.stringify(listCBody));
      assert.equal(listCBody.data!.attachments.length, 1);
      assert.equal(listCBody.data!.attachments[0]?.fileName, 'spec.pdf');

      const cross = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/attachments`,
        { headers: { cookie: userB.cookies } },
      );
      const crossBody = (await cross.json()) as Envelope<unknown>;
      assert.equal(cross.status, HttpStatus.FORBIDDEN);
      assert.equal(crossBody.error?.code, ErrorCode.FORBIDDEN);

      const unauth = await fetch(
        `${origin}${API_PREFIX}/orgs/${slugA}/issues/${issueId}/attachments`,
      );
      assert.equal(unauth.status, HttpStatus.UNAUTHORIZED);
    } finally {
      setStorageClientForTest(undefined);
      await close(server);
    }
  },
);
