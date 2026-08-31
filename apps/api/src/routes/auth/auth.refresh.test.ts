import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { config } from '@/config.js';
import { COOKIE_ACCESS, COOKIE_REFRESH } from '@/constants/auth.js';
import { API_PREFIX, HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import { canRun, close, cookieHeader, listen, register } from '@/test/http.js';
import JWT, { JWTPayload } from '@/utils/jwt.js';

function cookieMaxAgeSec(res: Response, name: string): number | undefined {
  const line = res.headers.getSetCookie().find((part) => part.startsWith(`${name}=`));
  const attr = line
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith('max-age='));
  if (!attr) return undefined;
  return Number(attr.slice('max-age='.length));
}

function cookieValue(cookies: string, name: string): string | undefined {
  return cookies
    .split('; ')
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

test(
  'access cookie lives as long as the refresh JWT so refresh can still run',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `refresh-maxage-${suffix}@relay.test`;
    const { server, origin } = await listen();
    try {
      const res = await fetch(`${origin}${API_PREFIX}/auth/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Refresh MaxAge', email, password: 'password1' }),
      });
      assert.equal(res.status, HttpStatus.CREATED);
      assert.equal(cookieMaxAgeSec(res, COOKIE_ACCESS), config.tokenInfo.refreshTokenValidity);
      assert.equal(cookieMaxAgeSec(res, COOKIE_REFRESH), config.tokenInfo.refreshTokenValidity);
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await close(server);
    }
  },
);

test(
  'refresh succeeds with an expired access JWT still in the cookie jar',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `refresh-expired-access-${suffix}@relay.test`;
    const { server, origin } = await listen();
    try {
      const user = await register(origin, {
        name: 'Refresh Expired Access',
        email,
        password: 'password1',
      });
      const access = cookieValue(user.cookies, COOKIE_ACCESS);
      const refresh = cookieValue(user.cookies, COOKIE_REFRESH);
      assert.ok(access);
      assert.ok(refresh);

      const decoded = await JWT.decode(access);
      const expiredAccess = await JWT.encode(
        new JWTPayload(
          config.tokenInfo.issuer,
          config.tokenInfo.audience,
          decoded.sub,
          decoded.prm,
          -60,
        ),
        config.tokenInfo.secret,
      );

      const refreshRes = await fetch(`${origin}${API_PREFIX}/auth/refresh`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          cookie: `${COOKIE_ACCESS}=${expiredAccess}; ${COOKIE_REFRESH}=${refresh}`,
        },
        body: '{}',
      });
      const refreshBody = (await refreshRes.json()) as { success: boolean };
      assert.equal(refreshRes.status, HttpStatus.OK, JSON.stringify(refreshBody));
      assert.equal(refreshBody.success, true);

      const sessionRes = await fetch(`${origin}${API_PREFIX}/auth/session`, {
        headers: { cookie: cookieHeader(refreshRes) },
      });
      assert.equal(sessionRes.status, HttpStatus.OK);
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await close(server);
    }
  },
);

test(
  'parallel refreshes leave at least one valid session',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const email = `refresh-race-${suffix}@relay.test`;
    const { server, origin } = await listen();
    try {
      const user = await register(origin, {
        name: 'Refresh Race',
        email,
        password: 'password1',
      });

      const results = await Promise.all(
        Array.from({ length: 3 }, () =>
          fetch(`${origin}${API_PREFIX}/auth/refresh`, {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              cookie: user.cookies,
            },
            body: '{}',
          }),
        ),
      );

      const bodies = await Promise.all(
        results.map(async (res) => ({
          status: res.status,
          cookies: cookieHeader(res),
          body: (await res.json()) as { success: boolean },
        })),
      );

      const winners = bodies.filter((item) => item.status === HttpStatus.OK && item.body.success);
      assert.ok(winners.length >= 1, JSON.stringify(bodies));

      const sessionRes = await fetch(`${origin}${API_PREFIX}/auth/session`, {
        headers: { cookie: winners[0]?.cookies || user.cookies },
      });
      assert.equal(sessionRes.status, HttpStatus.OK);
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await close(server);
    }
  },
);
