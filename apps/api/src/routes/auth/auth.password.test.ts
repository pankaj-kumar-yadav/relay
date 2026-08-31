import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from '@/auth/passwordResetToken.js';
import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import { canRun, close, cookieHeader, type Envelope, listen, register } from '@/test/http.js';
import { verifyPassword } from '@/utils/passwords.js';

test(
  'forgot-password always 200; reset updates hash and revokes sessions',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const email = `reset-${suffix}@relay.test`;
    const unknown = `missing-${suffix}@relay.test`;
    const oldPassword = 'password1';
    const newPassword = 'password2';
    const { server, origin } = await listen();

    try {
      const user = await register(origin, {
        name: 'Reset User',
        email,
        password: oldPassword,
      });

      const unknownRes = await fetch(`${origin}${API_PREFIX}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: unknown }),
      });
      const unknownBody = (await unknownRes.json()) as Envelope<Record<string, never>>;
      assert.equal(unknownRes.status, HttpStatus.OK, JSON.stringify(unknownBody));
      assert.equal(unknownBody.success, true);
      assert.equal(await prisma.passwordReset.count({ where: { user: { email: unknown } } }), 0);

      const forgot = await fetch(`${origin}${API_PREFIX}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const forgotBody = (await forgot.json()) as Envelope<Record<string, never>>;
      assert.equal(forgot.status, HttpStatus.OK, JSON.stringify(forgotBody));
      assert.equal(forgotBody.success, true);

      const row = await prisma.passwordReset.findFirst({
        where: { userId: user.userId },
      });
      assert.ok(row);
      assert.equal(row!.usedAt, null);
      assert.ok(row!.expiresAt.getTime() > Date.now());

      const token = generatePasswordResetToken();
      await prisma.passwordReset.update({
        where: { id: row!.id },
        data: { tokenHash: hashPasswordResetToken(token) },
      });

      const badToken = await fetch(`${origin}${API_PREFIX}/auth/reset-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: 'not-a-real-token', password: newPassword }),
      });
      const badTokenBody = (await badToken.json()) as Envelope<unknown>;
      assert.equal(badToken.status, HttpStatus.BAD_REQUEST);
      assert.equal(badTokenBody.error?.code, ErrorCode.VALIDATION_ERROR);

      const expiredToken = generatePasswordResetToken();
      await prisma.passwordReset.create({
        data: {
          userId: user.userId,
          tokenHash: hashPasswordResetToken(expiredToken),
          expiresAt: new Date(Date.now() - 1000),
        },
      });
      const expiredRes = await fetch(`${origin}${API_PREFIX}/auth/reset-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: expiredToken, password: newPassword }),
      });
      assert.equal(expiredRes.status, HttpStatus.BAD_REQUEST);

      const reset = await fetch(`${origin}${API_PREFIX}/auth/reset-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password: newPassword }),
      });
      const resetBody = (await reset.json()) as Envelope<Record<string, never>>;
      assert.equal(reset.status, HttpStatus.OK, JSON.stringify(resetBody));
      assert.equal(resetBody.success, true);

      const session = await fetch(`${origin}${API_PREFIX}/auth/session`, {
        headers: { cookie: user.cookies },
      });
      assert.equal(session.status, HttpStatus.UNAUTHORIZED);

      const stored = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { passwordHash: true },
      });
      assert.ok(stored);
      assert.equal(await verifyPassword(newPassword, stored!.passwordHash), true);
      assert.equal(await verifyPassword(oldPassword, stored!.passwordHash), false);

      const reused = await fetch(`${origin}${API_PREFIX}/auth/reset-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password: 'password3x' }),
      });
      assert.equal(reused.status, HttpStatus.BAD_REQUEST);

      const login = await fetch(`${origin}${API_PREFIX}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword }),
      });
      assert.equal(login.status, HttpStatus.OK);
      assert.ok(cookieHeader(login).includes('accessToken'));
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await close(server);
    }
  },
);

test(
  'change-password requires current password and revokes other sessions',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const email = `change-${suffix}@relay.test`;
    const password = 'password1';
    const next = 'password2';
    const { server, origin } = await listen();

    try {
      const unauth = await fetch(`${origin}${API_PREFIX}/auth/change-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword: password, newPassword: next }),
      });
      assert.equal(unauth.status, HttpStatus.UNAUTHORIZED);

      const first = await register(origin, {
        name: 'Change User',
        email,
        password,
      });

      const secondLogin = await fetch(`${origin}${API_PREFIX}/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      assert.equal(secondLogin.status, HttpStatus.OK);
      const secondCookies = cookieHeader(secondLogin);

      const wrong = await fetch(`${origin}${API_PREFIX}/auth/change-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: first.cookies },
        body: JSON.stringify({ currentPassword: 'nope-nope', newPassword: next }),
      });
      const wrongBody = (await wrong.json()) as Envelope<unknown>;
      assert.equal(wrong.status, HttpStatus.UNAUTHORIZED);
      assert.equal(wrongBody.error?.code, ErrorCode.INVALID_CREDENTIALS);

      const short = await fetch(`${origin}${API_PREFIX}/auth/change-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: first.cookies },
        body: JSON.stringify({ currentPassword: password, newPassword: 'short' }),
      });
      assert.equal(short.status, HttpStatus.BAD_REQUEST);

      const changed = await fetch(`${origin}${API_PREFIX}/auth/change-password`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: first.cookies },
        body: JSON.stringify({ currentPassword: password, newPassword: next }),
      });
      const changedBody = (await changed.json()) as Envelope<Record<string, never>>;
      assert.equal(changed.status, HttpStatus.OK, JSON.stringify(changedBody));
      const newCookies = cookieHeader(changed);
      assert.ok(newCookies.includes('accessToken'));

      const stillHere = await fetch(`${origin}${API_PREFIX}/auth/session`, {
        headers: { cookie: newCookies },
      });
      assert.equal(stillHere.status, HttpStatus.OK);

      const otherDead = await fetch(`${origin}${API_PREFIX}/auth/session`, {
        headers: { cookie: secondCookies },
      });
      assert.equal(otherDead.status, HttpStatus.UNAUTHORIZED);

      const stored = await prisma.user.findUnique({
        where: { id: first.userId },
        select: { passwordHash: true },
      });
      assert.ok(stored);
      assert.equal(await verifyPassword(next, stored!.passwordHash), true);
    } finally {
      await prisma.user.deleteMany({ where: { email } });
      await close(server);
    }
  },
);
