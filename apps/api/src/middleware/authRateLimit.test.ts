import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AddressInfo } from 'node:net';
import express from 'express';
import type { Server } from 'node:http';

import { createAuthRateLimiter } from './authRateLimit.js';

async function listen(app: express.Express): Promise<{ server: Server; origin: string }> {
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

async function post(url: string): Promise<number> {
  const res = await fetch(url, { method: 'POST' });
  return res.status;
}

test('login and register limiters do not share a bucket', async () => {
  const loginLimit = createAuthRateLimiter({ windowMs: 60_000, max: 2 });
  const registerLimit = createAuthRateLimiter({ windowMs: 60_000, max: 5 });

  const app = express();
  app.post('/login', loginLimit, (_req, res) => {
    res.status(401).json({ ok: false });
  });
  app.post('/register', registerLimit, (_req, res) => {
    res.status(201).json({ ok: true });
  });

  const { server, origin } = await listen(app);
  try {
    assert.equal(await post(`${origin}/login`), 401);
    assert.equal(await post(`${origin}/login`), 401);
    assert.equal(await post(`${origin}/login`), 429);
    assert.equal(await post(`${origin}/register`), 201);
  } finally {
    await close(server);
  }
});

test('successful logins do not consume the login budget', async () => {
  const loginLimit = createAuthRateLimiter({
    windowMs: 60_000,
    max: 1,
    skipSuccessfulRequests: true,
  });

  const app = express();
  app.post('/login', loginLimit, (req, res) => {
    const ok = req.headers['x-ok'] === '1';
    res.status(ok ? 200 : 401).json({ ok });
  });

  const { server, origin } = await listen(app);
  try {
    const ok = () =>
      fetch(`${origin}/login`, { method: 'POST', headers: { 'x-ok': '1' } }).then((r) => r.status);
    const bad = () => fetch(`${origin}/login`, { method: 'POST' }).then((r) => r.status);

    assert.equal(await ok(), 200);
    assert.equal(await ok(), 200);
    assert.equal(await bad(), 401);
    assert.equal(await bad(), 429);
  } finally {
    await close(server);
  }
});
