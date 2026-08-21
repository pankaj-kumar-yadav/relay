# Access + Refresh Keystore Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Relay’s single 30d `jwt` cookie with HRMS-shaped dual JWT (`accessToken` 15m + `refreshToken` 1d) backed by a Prisma `KeyStore`, plus web one-shot auto-refresh.

**Architecture:** On login/register, generate random primary/secondary keys, persist a `KeyStore` row, embed keys as JWT `prm`, set HttpOnly cookies. `requireAuth` validates access JWT and looks up an active keystore. `POST /auth/refresh` decodes (possibly expired) access + validates refresh, matches keystore, deletes it, and re-issues. Web `api.ts` retries once after refresh on `401`/`TOKEN_EXPIRED`.

**Tech Stack:** Express 5, Prisma, PostgreSQL, `jsonwebtoken`, `cookie-parser`, Next.js fetch client, existing `{ success, message, data, error }` envelope

**Spec:** [docs/superpowers/specs/2026-08-21-access-refresh-keystore-design.md](../specs/2026-08-21-access-refresh-keystore-design.md)

## Global Constraints

- Access TTL: **900** seconds (15m); refresh TTL: **86400** seconds (1d)
- Cookies: `accessToken`, `refreshToken` (HttpOnly); stop issuing `jwt`
- Local cookie: `secure: false`, `sameSite: 'lax'`; prod: `secure: true`, `sameSite: 'none'`
- JWT payload: `iss`, `aud`, `sub`, `prm`, `iat`, `exp` (HS256)
- Env: `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE` (clean cut off `JWT_SECRET`)
- Envelope: `{ success, message, data, error }` via `sendSuccess` / `sendError`
- Never return `passwordHash` or keystore keys
- Path aliases `@/` in API and web
- Cookie / env names as shared consts where reused
- Do not commit unless the user explicitly asks

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/prisma/schema.prisma` | Add `KeyStore` + User relation |
| `apps/api/src/config.ts` | `tokenInfo` + assert env |
| `apps/api/.env` / `.env.example` | Token env vars |
| `apps/api/src/constants/auth.ts` | Cookie names, default TTLs |
| `apps/api/src/utils/jwt.ts` | `JWTPayload`, encode/decode/validate |
| `apps/api/src/auth/authUtils.ts` | `createTokens`, `validateTokenData` |
| `apps/api/src/auth/keyStore.ts` | Prisma keystore CRUD helpers |
| `apps/api/src/auth/tokenHelpers.ts` | `createAndSetTokens`, `clearAuthCookies` |
| `apps/api/src/middleware/requireAuth.ts` | Access + keystore gate |
| `apps/api/src/routes/auth.ts` | register/login/logout/me/refresh |
| `apps/api/src/types/express.d.ts` | `req.user`, `req.keyStore` |
| Delete `apps/api/src/utils/tokens.ts` | Replaced by tokenHelpers |
| `apps/web/lib/api.ts` | Refresh-once + retry |
| `docs/ARCHITECTURE.md` | Dual-token auth note |
| `docs/steps/04-auth.md` | Refresh endpoint + TTLs |

---

### Task 1: Prisma KeyStore + token config

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/src/config.ts`
- Modify: `apps/api/.env.example`
- Modify: `apps/api/.env` (local only; do not commit secrets)
- Create: `apps/api/src/constants/auth.ts`

**Interfaces:**
- Produces: `KeyStore` model; `config.tokenInfo` = `{ secret, issuer, audience, accessTokenValidity, refreshTokenValidity }`; `COOKIE_ACCESS` / `COOKIE_REFRESH`; `assertAuthConfig()` requires token env + `DATABASE_URL`

- [ ] **Step 1: Add auth constants**

Create `apps/api/src/constants/auth.ts`:

```ts
export const COOKIE_ACCESS = 'accessToken';
export const COOKIE_REFRESH = 'refreshToken';
export const LEGACY_COOKIE_JWT = 'jwt';

/** seconds */
export const DEFAULT_ACCESS_TOKEN_VALIDITY_SEC = 900;
/** seconds */
export const DEFAULT_REFRESH_TOKEN_VALIDITY_SEC = 86400;
```

- [ ] **Step 2: Extend Prisma schema**

Update `User` and add `KeyStore` in `apps/api/prisma/schema.prisma`:

```prisma
model User {
  id           String     @id @default(uuid()) @db.Uuid
  email        String     @unique
  passwordHash String     @map("password_hash")
  name         String
  isSuperAdmin Boolean    @default(false) @map("is_super_admin")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")
  keyStores    KeyStore[]

  @@map("users")
}

model KeyStore {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  primaryKey   String   @map("primary_key")
  secondaryKey String   @map("secondary_key")
  status       Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, primaryKey, status])
  @@index([userId, primaryKey, secondaryKey])
  @@map("key_stores")
}
```

- [ ] **Step 3: Migrate**

```bash
pnpm --filter @relay/api db:migrate
```

When prompted, name migration `add_key_stores`. Expected: migration applied, client generated.

- [ ] **Step 4: Update config + env**

Replace `apps/api/src/config.ts` with:

```ts
import {
  DEFAULT_ACCESS_TOKEN_VALIDITY_SEC,
  DEFAULT_REFRESH_TOKEN_VALIDITY_SEC,
} from '@/constants/auth.js';

export const config = {
  port: Number(process.env.PORT) || 4000,
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL ?? '',
  isProduction: process.env.NODE_ENV === 'production',
  tokenInfo: {
    secret: process.env.TOKEN_SECRET ?? '',
    issuer: process.env.TOKEN_ISSUER ?? '',
    audience: process.env.TOKEN_AUDIENCE ?? '',
    accessTokenValidity:
      Number(process.env.ACCESS_TOKEN_VALIDITY_SEC) || DEFAULT_ACCESS_TOKEN_VALIDITY_SEC,
    refreshTokenValidity:
      Number(process.env.REFRESH_TOKEN_VALIDITY_SEC) || DEFAULT_REFRESH_TOKEN_VALIDITY_SEC,
  },
};

export function assertAuthConfig() {
  if (!config.tokenInfo.secret) {
    throw new Error('TOKEN_SECRET is not defined');
  }
  if (!config.tokenInfo.issuer) {
    throw new Error('TOKEN_ISSUER is not defined');
  }
  if (!config.tokenInfo.audience) {
    throw new Error('TOKEN_AUDIENCE is not defined');
  }
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not defined');
  }
}
```

Update `.env.example` (and local `.env`):

```env
PORT=4000
WEB_ORIGIN=http://localhost:3000
DATABASE_URL=postgresql://relay:relay@localhost:5432/relay
TOKEN_SECRET=change-me-to-long-random
TOKEN_ISSUER=relay
TOKEN_AUDIENCE=relay-web

# Seed user (pnpm --filter @relay/api db:seed):
# owner@relay.local / password
```

Remove `JWT_SECRET` from both files.

- [ ] **Step 5: Verify API still boots after env update**

Restart or check `pnpm --filter @relay/api` via existing `pnpm dev`. Expected: API listens without `TOKEN_*` / `DATABASE_URL` errors.

---

### Task 2: JWT core + keystore + token helpers

**Files:**
- Create: `apps/api/src/utils/jwt.ts`
- Create: `apps/api/src/auth/authUtils.ts`
- Create: `apps/api/src/auth/keyStore.ts`
- Create: `apps/api/src/auth/tokenHelpers.ts`
- Delete: `apps/api/src/utils/tokens.ts` (after nothing imports it)

**Interfaces:**
- Consumes: `config.tokenInfo`, `COOKIE_*`, `prisma`
- Produces:
  - `JWTPayload` class; `jwt.encode` / `jwt.decode` / `jwt.validate`
  - `createTokens(userId, primaryKey, secondaryKey): Promise<{ accessToken, refreshToken }>`
  - `validateTokenData(payload): void` (throws `UnauthorizedError`)
  - `createKeyStore(userId, primaryKey, secondaryKey)`
  - `findActiveKeyStore(userId, primaryKey)`
  - `findKeyStoreByKeys(userId, primaryKey, secondaryKey)`
  - `deleteKeyStoreById(id)`
  - `createAndSetTokens(res, userId): Promise<void>`
  - `clearAuthCookies(res): void`

- [ ] **Step 1: Implement `utils/jwt.ts`**

```ts
import jwtLib, { type SignOptions } from 'jsonwebtoken';

import {
  InternalError,
  TokenExpiredError,
  UnauthorizedError,
} from '@/utils/errors.js';

export class JWTPayload {
  iss: string;
  aud: string;
  sub: string;
  prm: string;
  iat: number;
  exp: number;

  constructor(
    issuer: string,
    audience: string,
    subject: string,
    param: string,
    validitySec: number,
  ) {
    this.iss = issuer;
    this.aud = audience;
    this.sub = subject;
    this.prm = param;
    this.iat = Math.floor(Date.now() / 1000);
    this.exp = this.iat + validitySec;
  }
}

async function encode(payload: JWTPayload, secret: string): Promise<string> {
  if (!secret) throw new InternalError('Token generation failure');
  const options: SignOptions = { algorithm: 'HS256' };
  return new Promise((resolve, reject) => {
    jwtLib.sign({ ...payload }, secret, options, (err, token) => {
      if (err || !token) return reject(new InternalError('Token generation failure'));
      resolve(token);
    });
  });
}

async function decode(token: string): Promise<JWTPayload> {
  if (!token) throw new UnauthorizedError('Token decoding failure');
  const decoded = jwtLib.decode(token);
  if (!decoded || typeof decoded === 'string') {
    throw new UnauthorizedError('Invalid token');
  }
  return decoded as JWTPayload;
}

async function validate(token: string, secret: string): Promise<JWTPayload> {
  if (!token) throw new UnauthorizedError('Token validation failure');
  return new Promise((resolve, reject) => {
    jwtLib.verify(token, secret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return reject(new TokenExpiredError());
        }
        return reject(new UnauthorizedError('Invalid token'));
      }
      resolve(decoded as JWTPayload);
    });
  });
}

export default { encode, decode, validate };
```

- [ ] **Step 2: Implement `auth/authUtils.ts`**

```ts
import { z } from 'zod';

import { config } from '@/config.js';
import JWT, { JWTPayload } from '@/utils/jwt.js';
import { InternalError, UnauthorizedError } from '@/utils/errors.js';

export async function createTokens(
  userId: string,
  accessTokenKey: string,
  refreshTokenKey: string,
) {
  const { tokenInfo } = config;
  const accessPayload = new JWTPayload(
    tokenInfo.issuer,
    tokenInfo.audience,
    userId,
    accessTokenKey,
    tokenInfo.accessTokenValidity,
  );
  const accessToken = await JWT.encode(accessPayload, tokenInfo.secret);
  if (!accessToken) throw new InternalError('Failed to create access token');

  const refreshPayload = new JWTPayload(
    tokenInfo.issuer,
    tokenInfo.audience,
    userId,
    refreshTokenKey,
    tokenInfo.refreshTokenValidity,
  );
  const refreshToken = await JWT.encode(refreshPayload, tokenInfo.secret);
  if (!refreshToken) throw new InternalError('Failed to create refresh token');

  return { accessToken, refreshToken };
}

export function validateTokenData(payload: JWTPayload): void {
  const { tokenInfo } = config;
  const uuidOk = z.string().uuid().safeParse(payload?.sub).success;
  if (
    !payload ||
    payload.iss !== tokenInfo.issuer ||
    payload.aud !== tokenInfo.audience ||
    !payload.sub ||
    !payload.prm ||
    !uuidOk
  ) {
    throw new UnauthorizedError('Invalid access token');
  }
}
```

- [ ] **Step 3: Implement `auth/keyStore.ts`**

```ts
import { prisma } from '@/db.js';

export async function createKeyStore(
  userId: string,
  primaryKey: string,
  secondaryKey: string,
) {
  return prisma.keyStore.create({
    data: { userId, primaryKey, secondaryKey },
  });
}

export async function findActiveKeyStore(userId: string, primaryKey: string) {
  return prisma.keyStore.findFirst({
    where: { userId, primaryKey, status: true },
  });
}

export async function findKeyStoreByKeys(
  userId: string,
  primaryKey: string,
  secondaryKey: string,
) {
  return prisma.keyStore.findFirst({
    where: { userId, primaryKey, secondaryKey },
  });
}

export async function deleteKeyStoreById(id: string) {
  return prisma.keyStore.delete({ where: { id } });
}
```

- [ ] **Step 4: Implement `auth/tokenHelpers.ts`**

```ts
import crypto from 'node:crypto';
import type { Response } from 'express';

import { createTokens } from '@/auth/authUtils.js';
import { createKeyStore } from '@/auth/keyStore.js';
import { config } from '@/config.js';
import {
  COOKIE_ACCESS,
  COOKIE_REFRESH,
  LEGACY_COOKIE_JWT,
} from '@/constants/auth.js';

function cookieBase() {
  return {
    httpOnly: true as const,
    secure: config.isProduction,
    sameSite: (config.isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };
}

export async function createAndSetTokens(res: Response, userId: string) {
  const primaryKey = crypto.randomBytes(64).toString('hex');
  const secondaryKey = crypto.randomBytes(64).toString('hex');

  await createKeyStore(userId, primaryKey, secondaryKey);
  const tokens = await createTokens(userId, primaryKey, secondaryKey);

  const accessMs = config.tokenInfo.accessTokenValidity * 1000;
  const refreshMs = config.tokenInfo.refreshTokenValidity * 1000;

  res.cookie(COOKIE_ACCESS, tokens.accessToken, {
    ...cookieBase(),
    maxAge: accessMs,
  });
  res.cookie(COOKIE_REFRESH, tokens.refreshToken, {
    ...cookieBase(),
    maxAge: refreshMs,
  });

  return tokens;
}

export function clearAuthCookies(res: Response) {
  const base = cookieBase();
  res.cookie(COOKIE_ACCESS, '', { ...base, expires: new Date(0) });
  res.cookie(COOKIE_REFRESH, '', { ...base, expires: new Date(0) });
  res.cookie(LEGACY_COOKIE_JWT, '', { ...base, expires: new Date(0) });
}
```

- [ ] **Step 5: Smoke-check TypeScript on new files**

```bash
pnpm --filter @relay/api lint
```

Expected: no errors from new modules (routes may still import old `tokens.ts` until Task 3).

---

### Task 3: requireAuth + auth routes (refresh / logout)

**Files:**
- Modify: `apps/api/src/types/express.d.ts`
- Modify: `apps/api/src/middleware/requireAuth.ts`
- Modify: `apps/api/src/routes/auth.ts`
- Delete: `apps/api/src/utils/tokens.ts`

**Interfaces:**
- Consumes: `createAndSetTokens`, `clearAuthCookies`, JWT helpers, keystore helpers
- Produces: `POST /auth/refresh`; logout requires auth and deletes keystore; register/login use `createAndSetTokens`

- [ ] **Step 1: Extend Express types**

```ts
export {};

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        isSuperAdmin: boolean;
      };
      keyStore?: {
        id: string;
        userId: string;
        primaryKey: string;
        secondaryKey: string;
        status: boolean;
      };
    }
  }
}
```

- [ ] **Step 2: Rewrite `requireAuth.ts`**

```ts
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { validateTokenData } from '@/auth/authUtils.js';
import { findActiveKeyStore } from '@/auth/keyStore.js';
import { config } from '@/config.js';
import { COOKIE_ACCESS } from '@/constants/auth.js';
import { prisma } from '@/db.js';
import {
  sendError,
  TokenExpiredError,
  UnauthorizedError,
} from '@/utils/errors.js';
import JWT from '@/utils/jwt.js';

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const token = req.cookies?.[COOKIE_ACCESS] as string | undefined;
    if (!token) {
      throw new UnauthorizedError('Not authorized, no token');
    }

    let payload;
    try {
      payload = await JWT.validate(token, config.tokenInfo.secret);
    } catch (error) {
      if (error instanceof TokenExpiredError) throw error;
      throw new UnauthorizedError('Not authorized, token failed');
    }

    validateTokenData(payload);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
      },
    });
    if (!user) {
      throw new UnauthorizedError('Not authorized, user not found');
    }

    const keyStore = await findActiveKeyStore(user.id, payload.prm);
    if (!keyStore) {
      throw new UnauthorizedError('Not authorized, invalid access token');
    }

    req.user = user;
    req.keyStore = {
      id: keyStore.id,
      userId: keyStore.userId,
      primaryKey: keyStore.primaryKey,
      secondaryKey: keyStore.secondaryKey,
      status: keyStore.status,
    };
    next();
  } catch (err) {
    sendError(res, err);
  }
};
```

- [ ] **Step 3: Update `routes/auth.ts`**

Replace token imports and handlers. Full file:

```ts
import { Router } from 'express';
import { z } from 'zod';

import { validateTokenData } from '@/auth/authUtils.js';
import {
  deleteKeyStoreById,
  findKeyStoreByKeys,
} from '@/auth/keyStore.js';
import { clearAuthCookies, createAndSetTokens } from '@/auth/tokenHelpers.js';
import { config } from '@/config.js';
import { COOKIE_ACCESS, COOKIE_REFRESH } from '@/constants/auth.js';
import { HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import {
  EmailTakenError,
  InvalidCredentialsError,
  sendError,
  UnauthorizedError,
  ValidationError,
} from '@/utils/errors.js';
import JWT from '@/utils/jwt.js';
import { hashPassword, verifyPassword } from '@/utils/passwords.js';
import { sendSuccess } from '@/utils/response.js';

export const authRouter: Router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

function publicUser(user: {
  id: string;
  email: string;
  name: string;
  isSuperAdmin: boolean;
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
  };
}

authRouter.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new EmailTakenError();
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
      },
    });

    await createAndSetTokens(res, user.id);
    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'Registered',
      data: { user: publicUser(user) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    await createAndSetTokens(res, user.id);
    sendSuccess(res, {
      message: 'Logged in',
      data: {
        user: publicUser({
          id: user.id,
          email: user.email,
          name: user.name,
          isSuperAdmin: user.isSuperAdmin,
        }),
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  try {
    if (req.keyStore) {
      await deleteKeyStoreById(req.keyStore.id);
    }
    clearAuthCookies(res);
    sendSuccess(res, { message: 'Logged out', data: {} });
  } catch (err) {
    sendError(res, err);
  }
});

authRouter.get('/me', requireAuth, (req, res) => {
  sendSuccess(res, { data: { user: req.user } });
});

authRouter.post('/refresh', async (req, res) => {
  try {
    const accessToken = req.cookies?.[COOKIE_ACCESS] as string | undefined;
    const refreshToken =
      (req.cookies?.[COOKIE_REFRESH] as string | undefined) ||
      (typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : undefined);

    if (!accessToken || !refreshToken) {
      throw new UnauthorizedError('Not authorized, missing tokens');
    }

    const accessPayload = await JWT.decode(accessToken);
    validateTokenData(accessPayload);

    const user = await prisma.user.findUnique({
      where: { id: accessPayload.sub },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedError('Not authorized, user not found');
    }

    const refreshPayload = await JWT.validate(refreshToken, config.tokenInfo.secret);
    validateTokenData(refreshPayload);

    if (accessPayload.sub !== refreshPayload.sub) {
      throw new UnauthorizedError('Invalid access token');
    }

    const keyStore = await findKeyStoreByKeys(
      user.id,
      accessPayload.prm,
      refreshPayload.prm,
    );
    if (!keyStore) {
      throw new UnauthorizedError('Invalid access token');
    }

    await deleteKeyStoreById(keyStore.id);
    await createAndSetTokens(res, user.id);

    sendSuccess(res, { message: 'Access token refreshed', data: {} });
  } catch (err) {
    sendError(res, err);
  }
});
```

- [ ] **Step 4: Delete `apps/api/src/utils/tokens.ts`**

Ensure no remaining imports of `@/utils/tokens.js`.

- [ ] **Step 5: Lint + curl smoke (API)**

```bash
pnpm --filter @relay/api lint
```

```bash
# login
curl -s -c /tmp/relay-cookies.txt -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@relay.local","password":"password"}'

# me
curl -s -b /tmp/relay-cookies.txt http://localhost:4000/auth/me

# refresh
curl -s -c /tmp/relay-cookies.txt -b /tmp/relay-cookies.txt \
  -X POST http://localhost:4000/auth/refresh

# logout
curl -s -c /tmp/relay-cookies.txt -b /tmp/relay-cookies.txt \
  -X POST http://localhost:4000/auth/logout

# me should 401
curl -s -b /tmp/relay-cookies.txt http://localhost:4000/auth/me
```

Expected: login/me/refresh success envelopes; after logout, `/auth/me` has `success: false` and `UNAUTHORIZED` (or similar 401).

---

### Task 4: Web auto-refresh in `api.ts`

**Files:**
- Modify: `apps/web/lib/api.ts`

**Interfaces:**
- Consumes: existing envelope + `ApiError`
- Produces: single refresh attempt then one retry; skip refresh for `/auth/refresh`, `/auth/login`, `/auth/register`

- [ ] **Step 1: Replace `apps/web/lib/api.ts`**

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  error: { code: string; message: string } | null;
};

const NO_REFRESH_PATHS = new Set(['/auth/refresh', '/auth/login', '/auth/register']);

function shouldAttemptRefresh(path: string, status: number, code: string) {
  if (NO_REFRESH_PATHS.has(path)) return false;
  return status === 401 || code === 'TOKEN_EXPIRED' || code === 'UNAUTHORIZED';
}

async function parseEnvelope<T>(res: Response): Promise<{
  res: Response;
  body: Partial<ApiEnvelope<T>>;
}> {
  const body = (await res.json().catch(() => ({}))) as Partial<ApiEnvelope<T>>;
  return { res, body };
}

async function rawFetch(path: string, init?: RequestInit) {
  return fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
}

async function refreshSession(): Promise<boolean> {
  const res = await rawFetch('/auth/refresh', { method: 'POST', body: '{}' });
  const { body } = await parseEnvelope(res);
  return res.ok && body.success !== false;
}

export async function api<T extends object>(path: string, init?: RequestInit): Promise<T> {
  const first = await parseEnvelope<T>(await rawFetch(path, init));
  let { res, body } = first;

  const code = body.error?.code || 'ERROR';
  if (!res.ok || body.success === false) {
    if (shouldAttemptRefresh(path, res.status, code)) {
      const refreshed = await refreshSession();
      if (refreshed) {
        ({ res, body } = await parseEnvelope<T>(await rawFetch(path, init)));
      }
    }
  }

  if (!res.ok || body.success === false) {
    throw new ApiError(
      res.status,
      body.error?.code || 'ERROR',
      body.error?.message || body.message || res.statusText,
    );
  }

  if (body.data == null) {
    throw new ApiError(res.status, 'ERROR', body.message || 'Empty response data');
  }

  return body.data;
}
```

- [ ] **Step 2: Manual browser check**

1. Log in at `/login`
2. Confirm app loads (calls `/auth/me`)
3. Optionally shorten `ACCESS_TOKEN_VALIDITY_SEC=30` in API `.env`, restart API, wait >30s, navigate/refresh — session should survive via refresh without re-login
4. Logout → land on login; `/auth/me` fails cleanly

---

### Task 5: Docs

**Files:**
- Modify: `docs/ARCHITECTURE.md` (Auth section)
- Modify: `docs/steps/04-auth.md` (endpoints + decision notes)

**Interfaces:** none

- [ ] **Step 1: Update ARCHITECTURE Auth section**

Replace the Auth bullet list with:

```markdown
## Auth

- Dual JWT HttpOnly cookies: `accessToken` (15m) + `refreshToken` (1d)
- Payload: `{ iss, aud, sub, prm, iat, exp }`; `prm` ties to Prisma `KeyStore` (primary/secondary keys)
- Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, `POST /auth/refresh`
- Web sends `credentials: 'include'`; client auto-calls `/auth/refresh` once on expired access
- CORS allows `WEB_ORIGIN` with credentials
- Passwords hashed with `bcryptjs`
- Env: `TOKEN_SECRET`, `TOKEN_ISSUER`, `TOKEN_AUDIENCE`
```

- [ ] **Step 2: Update `docs/steps/04-auth.md`**

- Status note: upgraded to access/refresh + KeyStore
- Add `POST /auth/refresh` to the endpoints table
- Cookie decision: dual cookies (not single `jwt`)
- Env example: `TOKEN_*` instead of `SESSION_SECRET` / `JWT_SECRET`
- Done-when: tick refresh + keystore revocation

- [ ] **Step 3: Final API lint**

```bash
pnpm --filter @relay/api lint
```

Expected: clean.

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| KeyStore model + indexes | 1 |
| tokenInfo / TOKEN_* env | 1 |
| JWTPayload encode/decode/validate | 2 |
| createTokens / validateTokenData | 2 |
| createAndSetTokens / clear cookies | 2 |
| requireAuth + keystore | 3 |
| register/login/logout/me/refresh | 3 |
| Remove legacy `jwt` issuance | 3 (+ clear legacy on logout) |
| Web auto-refresh once | 4 |
| ARCHITECTURE + 04-auth | 5 |
| Access 15m / refresh 1d | 1 constants + config |
| Rotation on refresh | 3 |

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-21-access-refresh-keystore.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — execute tasks in this session with checkpoints  

Which approach?
