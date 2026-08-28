import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import { canRun, close, cookieHeader, listen } from '@/test/http.js';

test(
  'register then login returns the success envelope',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `harden-auth-${suffix}@relay.test`;
    const password = 'password1';
    const { server, origin } = await listen();
    try {
      const registerRes = await fetch(`${origin}${API_PREFIX}/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Harden Auth', email, password }),
      });
      const registered = (await registerRes.json()) as {
        success: boolean;
        message: string;
        data: { user: { email: string } } | null;
        error: unknown;
      };
      assert.equal(registerRes.status, HttpStatus.CREATED);
      assert.equal(registered.success, true);
      assert.equal(registered.error, null);
      assert.equal(registered.data?.user.email, email);

      const loginRes = await fetch(`${origin}${API_PREFIX}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const loggedIn = (await loginRes.json()) as {
        success: boolean;
        data: { user: { email: string } } | null;
        error: unknown;
      };
      assert.equal(loginRes.status, HttpStatus.OK);
      assert.equal(loggedIn.success, true);
      assert.equal(loggedIn.error, null);
      assert.equal(loggedIn.data?.user.email, email);
      assert.ok(cookieHeader(loginRes).includes('accessToken'));
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await close(server);
    }
  },
);

test(
  'invalid login returns the error envelope',
  { skip: !canRun },
  async () => {
    const { server, origin } = await listen();
    try {
      const res = await fetch(`${origin}${API_PREFIX}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'missing@relay.test', password: 'nope' }),
      });
      const body = (await res.json()) as {
        success: boolean;
        message: string;
        data: unknown;
        error: { code: string } | null;
      };
      assert.equal(res.status, HttpStatus.UNAUTHORIZED);
      assert.equal(body.success, false);
      assert.equal(body.data, null);
      assert.equal(body.error?.code, ErrorCode.INVALID_CREDENTIALS);
    } finally {
      await close(server);
    }
  },
);
