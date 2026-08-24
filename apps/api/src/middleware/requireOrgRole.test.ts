import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { NextFunction, Request, Response } from 'express';

import { OrgRole } from '@/constants/org.js';
import { ForbiddenError } from '@/utils/errors.js';

import { requireOrgRole } from './requireOrgRole.js';

function mockRes() {
  return {} as Response;
}

test('requireOrgRole allows matching membership role', async () => {
  const mw = requireOrgRole(OrgRole.ADMIN);
  const req = {
    membership: {
      id: 'm1',
      role: OrgRole.ADMIN,
      organizationId: 'o1',
      userId: 'u1',
    },
  } as Request;

  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };

  await mw(req, mockRes(), next);
  assert.equal(nextCalled, true);
});

test('requireOrgRole forbids non-matching role', async () => {
  const mw = requireOrgRole(OrgRole.ADMIN);
  const req = {
    membership: {
      id: 'm1',
      role: OrgRole.EMPLOYEE,
      organizationId: 'o1',
      userId: 'u1',
    },
  } as Request;

  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  let nextCalled = false;
  await mw(req, res as unknown as Response, (() => {
    nextCalled = true;
  }) as NextFunction);

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.equal(
    (res.body as { error: { code: string } }).error.code,
    'FORBIDDEN',
  );
});

test('requireOrgRole forbids missing membership', async () => {
  const mw = requireOrgRole(OrgRole.ADMIN);
  const req = {} as Request;

  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  await mw(req, res as unknown as Response, (() => {}) as NextFunction);
  assert.equal(res.statusCode, 403);
});

test('ForbiddenError is the failure type for role checks', () => {
  const err = new ForbiddenError('Admin role required');
  assert.equal(err.status, 403);
  assert.equal(err.code, 'FORBIDDEN');
});
