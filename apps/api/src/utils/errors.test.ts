import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Response } from 'express';

import { ErrorCode, HttpStatus } from '@/constants/http.js';
import {
  ForbiddenError,
  InternalError,
  NotFoundError,
  sendError,
  SlugTakenError,
  TeamKeyTakenError,
  UnauthorizedError,
  ValidationError,
} from '@/utils/errors.js';

function mockRes() {
  return {
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
}

test('sendError uses the API envelope for mapped statuses', () => {
  const cases = [
    { err: new ValidationError('bad'), status: HttpStatus.BAD_REQUEST, code: ErrorCode.VALIDATION_ERROR },
    { err: new UnauthorizedError(), status: HttpStatus.UNAUTHORIZED, code: ErrorCode.UNAUTHORIZED },
    { err: new ForbiddenError('You are not a member of this organization'), status: HttpStatus.FORBIDDEN, code: ErrorCode.FORBIDDEN },
    { err: new NotFoundError(), status: HttpStatus.NOT_FOUND, code: ErrorCode.NOT_FOUND },
    { err: new SlugTakenError(), status: HttpStatus.CONFLICT, code: ErrorCode.SLUG_TAKEN },
    { err: new TeamKeyTakenError(), status: HttpStatus.CONFLICT, code: ErrorCode.TEAM_KEY_TAKEN },
    { err: new InternalError(), status: HttpStatus.INTERNAL, code: ErrorCode.INTERNAL },
  ];

  for (const { err, status, code } of cases) {
    const res = mockRes();
    sendError(res as unknown as Response, err);
    const body = res.body as {
      success: boolean;
      message: string;
      data: unknown;
      error: { code: string; message: string } | null;
    };
    assert.equal(res.statusCode, status, code);
    assert.equal(body.success, false);
    assert.equal(typeof body.message, 'string');
    assert.equal(body.data, null);
    assert.equal(body.error?.code, code);
    assert.equal(body.error?.message, body.message);
  }
});

test('sendError hides unexpected errors as INTERNAL', () => {
  const res = mockRes();
  const logged: unknown[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    logged.push(args);
  };
  try {
    sendError(res as unknown as Response, new Error('secret db url'));
  } finally {
    console.error = original;
  }
  const body = res.body as {
    success: boolean;
    message: string;
    data: unknown;
    error: { code: string; message: string };
  };
  assert.equal(res.statusCode, HttpStatus.INTERNAL);
  assert.equal(body.success, false);
  assert.equal(body.data, null);
  assert.equal(body.error.code, ErrorCode.INTERNAL);
  assert.equal(body.error.message, 'Internal server error');
  assert.equal(body.message, 'Internal server error');
  assert.equal(logged.length, 1);
});
