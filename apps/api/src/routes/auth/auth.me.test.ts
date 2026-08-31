import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

test(
  'PATCH /auth/me updates name; unauthenticated and blank name fail',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const email = `me-${suffix}@relay.test`;
    const { server, origin } = await listen();

    try {
      const user = await register(origin, {
        name: 'Before',
        email,
        password: 'password1',
      });

      const unauth = await fetch(`${origin}${API_PREFIX}/auth/me`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Nope' }),
      });
      const unauthBody = (await unauth.json()) as Envelope<unknown>;
      assert.equal(unauth.status, HttpStatus.UNAUTHORIZED);
      assert.equal(unauthBody.success, false);
      assert.equal(unauthBody.error?.code, ErrorCode.UNAUTHORIZED);

      const blank = await fetch(`${origin}${API_PREFIX}/auth/me`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: user.cookies },
        body: JSON.stringify({ name: '   ' }),
      });
      const blankBody = (await blank.json()) as Envelope<unknown>;
      assert.equal(blank.status, HttpStatus.BAD_REQUEST);
      assert.equal(blankBody.error?.code, ErrorCode.VALIDATION_ERROR);

      const patched = await fetch(`${origin}${API_PREFIX}/auth/me`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: user.cookies },
        body: JSON.stringify({ name: '  After  ' }),
      });
      const patchedBody = (await patched.json()) as Envelope<{
        user: { id: string; name: string; email: string };
      }>;
      assert.equal(patched.status, HttpStatus.OK, JSON.stringify(patchedBody));
      assert.equal(patchedBody.success, true);
      assert.equal(patchedBody.data!.user.name, 'After');
      assert.equal(patchedBody.data!.user.email, email);

      const session = await fetch(`${origin}${API_PREFIX}/auth/session`, {
        headers: { cookie: user.cookies },
      });
      const sessionBody = (await session.json()) as Envelope<{
        user: { name: string };
      }>;
      assert.equal(session.status, HttpStatus.OK);
      assert.equal(sessionBody.data!.user.name, 'After');
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await close(server);
    }
  },
);
