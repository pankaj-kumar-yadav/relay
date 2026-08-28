import 'dotenv/config';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Express } from 'express';

import { createApp } from '@/app.js';
import { API_PREFIX, HttpStatus } from '@/constants/http.js';

export const canRun = Boolean(
  process.env.DATABASE_URL &&
    process.env.TOKEN_SECRET &&
    process.env.TOKEN_ISSUER &&
    process.env.TOKEN_AUDIENCE,
);

export type Envelope<T> = {
  success: boolean;
  data: T | null;
  error: { code: string } | null;
};

export async function listen(app: Express = createApp()): Promise<{
  server: Server;
  origin: string;
}> {
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const { port } = server.address() as AddressInfo;
  return { server, origin: `http://127.0.0.1:${port}` };
}

export async function close(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

export function cookieHeader(res: Response): string {
  return res.headers
    .getSetCookie()
    .map((part) => part.split(';')[0])
    .join('; ');
}

export async function register(
  origin: string,
  input: { name: string; email: string; password: string },
): Promise<{ cookies: string; userId: string }> {
  const res = await fetch(`${origin}${API_PREFIX}/auth/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  });
  const body = (await res.json()) as Envelope<{ user: { id: string } }>;
  assert.equal(res.status, HttpStatus.CREATED, JSON.stringify(body));
  return { cookies: cookieHeader(res), userId: body.data!.user.id };
}
