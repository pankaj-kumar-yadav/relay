# JWT Auth + Postgres Implementation Plan

> **Status:** Partially historical — Postgres/`users`/basic auth landed; single `jwt` cookie was later replaced by dual JWT + KeyStore. See [access-refresh-keystore plan](./2026-08-21-access-refresh-keystore.md) and [ARCHITECTURE.md](../../ARCHITECTURE.md).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Postgres + Prisma `users` table and ekalakar-style JWT HttpOnly cookie auth on the API; wire web login/register to replace dummy localStorage auth.

**Architecture:** Express API uses Prisma against Docker Postgres. JWT signed with `JWT_SECRET`, stored in HttpOnly cookie `jwt`. Web calls API with `credentials: 'include'`. Orgs/memberships deferred.

**Tech Stack:** PostgreSQL 16, Prisma, Express 5, `jsonwebtoken`, `bcryptjs`, `cookie-parser`, `zod`, Next.js 15

**Spec:** [docs/superpowers/specs/2026-08-21-jwt-auth-postgres-design.md](../specs/2026-08-21-jwt-auth-postgres-design.md)

## Global Constraints

- Cookie name: `jwt`; payload `{ userId: string }`; expiry `30d`
- Local cookie: `httpOnly: true`, `secure: false`, `sameSite: 'lax'`
- Prod cookie: `secure: true`, `sameSite: 'none'`
- Passwords: `bcryptjs`; never return `passwordHash`
- Error shape: `{ error: { code, message } }`
- Success auth body: `{ user: { id, email, name, isSuperAdmin } }`
- Seed: `owner@relay.local` / `password` / `isSuperAdmin: true`
- No orgs/memberships/issues in this plan
- Do not commit unless the user explicitly asks

---

## File map

| Path | Responsibility |
|------|----------------|
| `docker-compose.yml` | Local Postgres |
| `apps/api/prisma/schema.prisma` | User model |
| `apps/api/prisma/seed.ts` | Demo super-admin |
| `apps/api/src/db.ts` | PrismaClient |
| `apps/api/src/config.ts` | Env |
| `apps/api/src/utils/tokens.ts` | Set/clear JWT cookie |
| `apps/api/src/utils/passwords.ts` | hash/compare |
| `apps/api/src/middleware/requireAuth.ts` | Protect routes |
| `apps/api/src/routes/auth.ts` | Auth endpoints |
| `apps/api/src/types/express.d.ts` | `req.user` |
| `apps/api/src/index.ts` | Wire app |
| `apps/web/lib/api.ts` | Fetch + credentials |
| `apps/web/lib/auth.ts` | Auth client helpers |
| `apps/web/app/login/page.tsx` | Real login |
| `apps/web/app/register/page.tsx` | Real register |
| `apps/web/app/page.tsx` | Session redirect |
| Delete `apps/web/lib/dummy-auth.ts` | |

---

### Task 1: Postgres + Prisma User model

**Files:**
- Create: `docker-compose.yml`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/db.ts`
- Create: `apps/api/src/config.ts`
- Modify: `apps/api/package.json`
- Modify: `apps/api/.env`, `apps/api/.env.example`

**Interfaces:**
- Produces: `prisma` export from `src/db.ts`; `config` with `databaseUrl`, `jwtSecret`, `webOrigin`, `port`, `isProduction`

- [ ] **Step 1: Add docker-compose.yml at repo root**

```yaml
services:
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: relay
      POSTGRES_PASSWORD: relay
      POSTGRES_DB: relay
    volumes:
      - relay_pg:/var/lib/postgresql/data

volumes:
  relay_pg:
```

- [ ] **Step 2: Install API deps**

```bash
pnpm --filter @relay/api add @prisma/client bcryptjs cookie-parser jsonwebtoken zod
pnpm --filter @relay/api add -D prisma @types/bcryptjs @types/cookie-parser @types/jsonwebtoken
```

- [ ] **Step 3: Write schema + config + db**

`apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(uuid()) @db.Uuid
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String
  isSuperAdmin Boolean  @default(false) @map("is_super_admin")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

`apps/api/src/config.ts`:

```ts
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not defined`);
  return value;
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  webOrigin: process.env.WEB_ORIGIN || 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? '',
  isProduction: process.env.NODE_ENV === 'production',
};

export function assertAuthConfig() {
  required('JWT_SECRET');
  required('DATABASE_URL');
}
```

`apps/api/src/db.ts`:

```ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

- [ ] **Step 4: Env + scripts**

`.env` / `.env.example` add:

```env
DATABASE_URL=postgresql://relay:relay@localhost:5432/relay
JWT_SECRET=dev-relay-jwt-secret-change-me
```

`package.json` scripts:

```json
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:seed": "tsx prisma/seed.ts"
```

prisma seed config in package.json:

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 5: Start DB and migrate**

```bash
docker compose up -d
pnpm --filter @relay/api exec prisma migrate dev --name init_users
```

Expected: migration applied; `users` table exists.

- [ ] **Step 6: Verify**

```bash
pnpm --filter @relay/api exec prisma db execute --stdin <<< "SELECT 1"
```

Or: `docker compose exec db psql -U relay -d relay -c '\dt'`

Expected: `users` listed.

---

### Task 2: Auth utilities + middleware + routes

**Files:**
- Create: `apps/api/src/utils/tokens.ts`
- Create: `apps/api/src/utils/passwords.ts`
- Create: `apps/api/src/utils/errors.ts`
- Create: `apps/api/src/middleware/requireAuth.ts`
- Create: `apps/api/src/routes/auth.ts`
- Create: `apps/api/src/types/express.d.ts`
- Create: `apps/api/prisma/seed.ts`
- Modify: `apps/api/src/index.ts`

**Interfaces:**
- Consumes: `prisma`, `config`
- Produces:
  - `hashPassword(password: string): Promise<string>`
  - `verifyPassword(password: string, hash: string): Promise<boolean>`
  - `generateToken(res: Response, userId: string): void`
  - `clearToken(res: Response): void`
  - `requireAuth` middleware
  - Routes mounted at `/auth`

- [ ] **Step 1: Implement passwords + tokens + errors**

`passwords.ts`: bcrypt salt rounds 10.

`tokens.ts`: sign `{ userId }`, set/clear cookie `jwt` per Global Constraints.

`errors.ts`:

```ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function sendError(res: Response, err: unknown) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message },
    });
  }
  console.error(err);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: 'Internal server error' },
  });
}
```

- [ ] **Step 2: express.d.ts + requireAuth**

```ts
// types/express.d.ts
import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      name: string;
      isSuperAdmin: boolean;
    };
  }
}
```

`requireAuth`: read cookie → verify → load user → `req.user` or 401 `UNAUTHORIZED` / `TOKEN_EXPIRED`.

- [ ] **Step 3: auth routes**

Zod schemas:

- register: `name` min 1, `email` email, `password` min 8
- login: `email`, `password` min 1

Handlers:

- register → lowercase email → if exists `EMAIL_TAKEN` 409 → create → generateToken → 201 `{ user }`
- login → find by email → verify → else `INVALID_CREDENTIALS` 401 → generateToken → 200 `{ user }`
- logout → clearToken → 200 `{ ok: true }`
- me → requireAuth → 200 `{ user: req.user }`

Map Prisma user to public user (camelCase `isSuperAdmin`).

- [ ] **Step 4: Wire index.ts**

```ts
import cookieParser from 'cookie-parser';
import { authRouter } from './routes/auth.js';

app.use(cookieParser());
app.use('/auth', authRouter);
```

Keep `/health`. Load dotenv if needed — use `tsx` with env from shell or add `dotenv` package and `import 'dotenv/config'` at top of index.

Prefer adding `dotenv` dependency and loading at startup.

- [ ] **Step 5: Seed**

```ts
// prisma/seed.ts
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'owner@relay.local';
  const passwordHash = await bcrypt.hash('password', 10);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Relay Owner',
      passwordHash,
      isSuperAdmin: true,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Run: `pnpm --filter @relay/api db:seed`

- [ ] **Step 6: Manual API test**

```bash
pnpm --filter @relay/api dev
# separate shell:
curl -c /tmp/relay.jar -H 'Content-Type: application/json' \
  -d '{"email":"owner@relay.local","password":"password"}' \
  http://localhost:4000/auth/login
curl -b /tmp/relay.jar http://localhost:4000/auth/me
curl -b /tmp/relay.jar -X POST http://localhost:4000/auth/logout
curl -b /tmp/relay.jar http://localhost:4000/auth/me
```

Expected: login 200 + Set-Cookie; me 200 user; after logout me 401.

---

### Task 3: Web auth client + pages

**Files:**
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/lib/auth.ts`
- Create: `apps/web/app/register/page.tsx`
- Modify: `apps/web/app/login/page.tsx`
- Modify: `apps/web/app/page.tsx`
- Create: `apps/web/.env.local` / `.env.example` with `NEXT_PUBLIC_API_URL=http://localhost:4000`
- Delete: `apps/web/lib/dummy-auth.ts`

**Interfaces:**
- Consumes: API `/auth/*`
- Produces:
  - `api<T>(path, init?): Promise<T>`
  - `login(email, password)`, `register({name,email,password})`, `logout()`, `getMe(): Promise<User | null>`

- [ ] **Step 1: api.ts + auth.ts**

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.code || 'ERROR',
      body?.error?.message || res.statusText,
    );
  }
  return body as T;
}
```

`auth.ts`: wrappers for login/register/logout/getMe; `getMe` returns `null` on 401.

- [ ] **Step 2: Update login page**

- Remove DEMO constants / dummy-auth
- On mount: `getMe()` → if user, redirect APP_HOME
- Submit: `login` then `router.push(APP_HOME)`; on error show message
- Hint: seed credentials `owner@relay.local` / `password`
- Link to `/register`

- [ ] **Step 3: Register page**

Same layout as login; fields name, email, password; submit `register`; link to `/login`.

- [ ] **Step 4: Home page**

`getMe()` → APP_HOME or `/login`.

- [ ] **Step 5: Delete dummy-auth.ts; grep for imports**

```bash
rg dummy-auth apps/web
```

Expected: no matches.

- [ ] **Step 6: Smoke web**

With API + web running: login with seed user, refresh stays in app, logout if wired (optional this pass — logout API exists; UI logout can wait if not in account menu).

---

### Task 4: Docs update

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/STEPS.md`
- Modify: `docs/steps/03-database.md` (status / ORM)
- Modify: `docs/steps/04-auth.md` (status / JWT cookie choice)

- [ ] **Step 1: ARCHITECTURE** — document Prisma + JWT HttpOnly cookie auth (replace “planned”).
- [ ] **Step 2: Mark steps 3–4 progress in STEPS.md (users-only schema done; auth done; orgs still pending).
- [ ] **Step 3: Note in 03-database that full org tables remain for later / step 5.

---

## Self-review

| Spec item | Task |
|-----------|------|
| Docker Postgres | 1 |
| Prisma User + is_super_admin | 1 |
| JWT cookie auth endpoints | 2 |
| requireAuth | 2 |
| Seed owner@relay.local | 2 |
| Web wire + remove dummy | 3 |
| Docs | 4 |
| No orgs | respected |

No placeholders remaining.
