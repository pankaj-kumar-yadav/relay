import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus, JSON_BODY_LIMIT } from '@/constants/http.js';
import { close, listen } from '@/test/http.js';

test('GET /api/v1/health is versioned; unprefixed /health is not found', async () => {
  const { server, origin } = await listen();
  try {
    const versioned = await fetch(`${origin}${API_PREFIX}/health`);
    const versionedBody = (await versioned.json()) as {
      success: boolean;
      data: { service: string } | null;
    };
    assert.equal(versioned.status, HttpStatus.OK);
    assert.equal(versionedBody.success, true);
    assert.equal(versionedBody.data?.service, 'relay-api');

    const legacy = await fetch(`${origin}/health`);
    const legacyBody = (await legacy.json()) as {
      success: boolean;
      error: { code: string } | null;
    };
    assert.equal(legacy.status, HttpStatus.NOT_FOUND);
    assert.equal(legacyBody.success, false);
    assert.equal(legacyBody.error?.code, ErrorCode.NOT_FOUND);
  } finally {
    await close(server);
  }
});

test('unknown routes return the error envelope', async () => {
  const { server, origin } = await listen();
  try {
    const res = await fetch(`${origin}/does-not-exist`);
    const body = (await res.json()) as {
      success: boolean;
      message: string;
      data: unknown;
      error: { code: string; message: string } | null;
    };
    assert.equal(res.status, HttpStatus.NOT_FOUND);
    assert.equal(body.success, false);
    assert.equal(body.data, null);
    assert.equal(body.error?.code, ErrorCode.NOT_FOUND);
    assert.equal(body.message, body.error?.message);
  } finally {
    await close(server);
  }
});

test(`JSON bodies over ${JSON_BODY_LIMIT} are rejected as validation errors`, async () => {
  const { server, origin } = await listen();
  try {
    const res = await fetch(`${origin}${API_PREFIX}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: `${'a'.repeat(300_000)}@x.com`, password: 'password1' }),
    });
    const body = (await res.json()) as {
      success: boolean;
      data: unknown;
      error: { code: string } | null;
    };
    assert.equal(res.status, HttpStatus.BAD_REQUEST);
    assert.equal(body.success, false);
    assert.equal(body.data, null);
    assert.equal(body.error?.code, ErrorCode.VALIDATION_ERROR);
  } finally {
    await close(server);
  }
});
