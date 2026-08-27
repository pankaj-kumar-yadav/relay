import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { createApp } from '@/app.js';
import { ErrorCode, HttpStatus, JSON_BODY_LIMIT } from '@/constants/http.js';

async function listen(): Promise<{ server: Server; origin: string }> {
  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return { server, origin: `http://127.0.0.1:${port}` };
}

async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

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
    const res = await fetch(`${origin}/auth/login`, {
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
