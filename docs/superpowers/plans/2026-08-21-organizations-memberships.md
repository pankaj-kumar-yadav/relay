# Organizations + Memberships Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-tenant organizations and memberships (no org FK on `User`), plus create/list/get org APIs and `requireOrgMember` middleware.

**Architecture:** `organizations` + `memberships` join table link users to orgs with role `admin` | `employee`. Public route param is **slug only**. `requireOrgMember` loads org by slug, verifies membership, sets `req.org` / `req.membership`. Invites and web UI are out of scope.

**Tech Stack:** Express 5, Prisma, PostgreSQL, Zod, existing `{ success, message, data, error }` envelope, dual JWT `requireAuth`

**Spec:** [docs/superpowers/specs/2026-08-21-organizations-memberships-design.md](../specs/2026-08-21-organizations-memberships-design.md)

## Global Constraints

- No `organization_id` on `users` — tenancy via `memberships` only
- Route `:orgId` is **slug** (not UUID)
- Roles: `admin` | `employee` via `OrgRole` const; creator is `admin`
- Envelope: `{ success, message, data, error }` via `sendSuccess` / `sendError`
- Path aliases `@/` in API
- Never trust URL slug alone — always verify membership
- No invites, no auto-org on register, no web UI changes
- Do not commit unless the user explicitly asks
- Do not commit docs/specs/plans unless the user explicitly asks to commit those paths (see AGENTS.md / SCOPE)

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/prisma/schema.prisma` | `Organization`, `Membership`, User relations |
| `apps/api/src/constants/org.ts` | `OrgRole` |
| `apps/api/src/constants/http.ts` | `ErrorCode.SLUG_TAKEN` |
| `apps/api/src/utils/errors.ts` | `SlugTakenError` |
| `apps/api/src/types/express.d.ts` | `req.org`, `req.membership` |
| `apps/api/src/middleware/requireOrgMember.ts` | Slug + membership gate |
| `apps/api/src/routes/orgs.ts` | `POST/GET /orgs`, `GET /orgs/:orgId` |
| `apps/api/src/index.ts` | Mount `/orgs` |
| `apps/api/prisma/seed.ts` | Org `demo` + owner membership |
| `docs/steps/05-multi-tenant.md` | Mark progress; note invites deferred |
| `docs/ARCHITECTURE.md` | Point at orgs/memberships when done |
| `docs/STEPS.md` | Check step 5 when done |

---

### Task 1: Prisma models + org constants + slug error

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/constants/org.ts`
- Modify: `apps/api/src/constants/http.ts`
- Modify: `apps/api/src/utils/errors.ts`

**Interfaces:**
- Produces: Prisma `Organization`, `Membership`; `OrgRole`; `ErrorCode.SLUG_TAKEN`; `SlugTakenError`
- Consumes: existing `User`, `HttpStatus.CONFLICT`

- [ ] **Step 1: Add `OrgRole` constant**

Create `apps/api/src/constants/org.ts`:

```ts
export const OrgRole = {
  ADMIN: 'admin',
  EMPLOYEE: 'employee',
} as const;

export type OrgRoleValue = (typeof OrgRole)[keyof typeof OrgRole];
```

- [ ] **Step 2: Add `SLUG_TAKEN` error code + class**

In `apps/api/src/constants/http.ts`, add to `ErrorCode`:

```ts
  SLUG_TAKEN: 'SLUG_TAKEN',
```

In `apps/api/src/utils/errors.ts`, add:

```ts
export class SlugTakenError extends ApiError {
  constructor(message = 'Organization slug already taken') {
    super(HttpStatus.CONFLICT, ErrorCode.SLUG_TAKEN, message);
  }
}
```

- [ ] **Step 3: Extend Prisma schema**

Update `apps/api/prisma/schema.prisma` — add relations on `User` and new models:

```prisma
model User {
  id           String       @id @default(uuid()) @db.Uuid
  email        String       @unique
  passwordHash String       @map("password_hash")
  name         String
  isSuperAdmin Boolean      @default(false) @map("is_super_admin")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")
  keyStores    KeyStore[]
  memberships  Membership[]

  @@map("users")
}

model Organization {
  id          String       @id @default(uuid()) @db.Uuid
  name        String
  slug        String       @unique
  createdAt   DateTime     @default(now()) @map("created_at")
  updatedAt   DateTime     @updatedAt @map("updated_at")
  memberships Membership[]

  @@map("organizations")
}

model Membership {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  userId         String       @map("user_id") @db.Uuid
  role           String
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@index([userId])
  @@map("memberships")
}
```

Keep existing `KeyStore` model unchanged.

- [ ] **Step 4: Migrate**

```bash
pnpm --filter @relay/api db:migrate
```

When prompted, name migration `add_organizations_memberships`. Expected: migration applied, client generated.

- [ ] **Step 5: Lint**

```bash
pnpm --filter @relay/api lint
```

Expected: no errors.

- [ ] **Step 6: Commit** (only if user asked)

```bash
git add apps/api/prisma apps/api/src/constants/org.ts apps/api/src/constants/http.ts apps/api/src/utils/errors.ts
git commit -m "$(cat <<'EOF'
feat(api): add organizations and memberships schema

EOF
)"
```

---

### Task 2: Seed demo org + owner membership

**Files:**
- Modify: `apps/api/prisma/seed.ts`

**Interfaces:**
- Consumes: Prisma `Organization`, `Membership`; `OrgRole.ADMIN`
- Produces: seeded org slug `demo` with `owner@relay.local` as admin

- [ ] **Step 1: Update seed**

Replace `apps/api/prisma/seed.ts` with:

```ts
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

import { OrgRole } from '../src/constants/org.js';

const prisma = new PrismaClient();

async function main() {
  const email = 'owner@relay.local';
  const passwordHash = await bcrypt.hash('password', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Relay Owner',
      passwordHash,
      isSuperAdmin: true,
    },
  });

  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo',
      slug: 'demo',
    },
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: org.id,
        userId: user.id,
      },
    },
    update: { role: OrgRole.ADMIN },
    create: {
      organizationId: org.id,
      userId: user.id,
      role: OrgRole.ADMIN,
    },
  });

  console.log(`Seeded user ${email} / password (is_super_admin=true)`);
  console.log(`Seeded org slug=demo with ${email} as ${OrgRole.ADMIN}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 2: Run seed**

```bash
pnpm --filter @relay/api db:seed
```

Expected: both console lines printed; no error.

- [ ] **Step 3: Commit** (only if user asked)

```bash
git add apps/api/prisma/seed.ts
git commit -m "$(cat <<'EOF'
chore(api): seed demo org and owner membership

EOF
)"
```

---

### Task 3: `requireOrgMember` + Express types

**Files:**
- Modify: `apps/api/src/types/express.d.ts`
- Create: `apps/api/src/middleware/requireOrgMember.ts`

**Interfaces:**
- Consumes: `requireAuth` already set `req.user`; Prisma org + membership
- Produces: `req.org = { id, name, slug }`; `req.membership = { id, role, organizationId, userId }`; middleware `requireOrgMember`

- [ ] **Step 1: Extend Express request types**

Replace `apps/api/src/types/express.d.ts` with:

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
      org?: {
        id: string;
        name: string;
        slug: string;
      };
      membership?: {
        id: string;
        role: string;
        organizationId: string;
        userId: string;
      };
    }
  }
}
```

- [ ] **Step 2: Implement middleware**

Create `apps/api/src/middleware/requireOrgMember.ts`:

```ts
import type { RequestHandler } from 'express';

import { prisma } from '@/db.js';
import {
  ForbiddenError,
  NotFoundError,
  sendError,
  UnauthorizedError,
} from '@/utils/errors.js';

export const requireOrgMember: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const slug = req.params.orgId;
    if (!slug || typeof slug !== 'string') {
      throw new NotFoundError('Organization not found');
    }

    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const membership = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        role: true,
        organizationId: true,
        userId: true,
      },
    });
    if (!membership) {
      throw new ForbiddenError('You are not a member of this organization');
    }

    req.org = org;
    req.membership = membership;
    next();
  } catch (err) {
    sendError(res, err);
  }
};
```

- [ ] **Step 3: Lint**

```bash
pnpm --filter @relay/api lint
```

Expected: no errors.

- [ ] **Step 4: Commit** (only if user asked)

```bash
git add apps/api/src/types/express.d.ts apps/api/src/middleware/requireOrgMember.ts
git commit -m "$(cat <<'EOF'
feat(api): add requireOrgMember middleware

EOF
)"
```

---

### Task 4: Org routes (create, list, get)

**Files:**
- Create: `apps/api/src/routes/orgs.ts`
- Modify: `apps/api/src/index.ts`

**Interfaces:**
- Consumes: `requireAuth`, `requireOrgMember`, `OrgRole`, `SlugTakenError`, Prisma
- Produces: `orgsRouter` mounted at `/orgs`

- [ ] **Step 1: Create org router**

Create `apps/api/src/routes/orgs.ts`:

```ts
import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { HttpStatus } from '@/constants/http.js';
import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requireOrgMember } from '@/middleware/requireOrgMember.js';
import {
  sendError,
  SlugTakenError,
  ValidationError,
} from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';

export const orgsRouter: Router = Router();

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug');

const createOrgSchema = z.object({
  name: z.string().trim().min(1),
  slug: slugSchema,
});

function publicOrg(org: { id: string; name: string; slug: string }) {
  return { id: org.id, name: org.name, slug: org.slug };
}

orgsRouter.use(requireAuth);

orgsRouter.post('/', async (req, res) => {
  try {
    const parsed = createOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { name, slug } = parsed.data;
    const userId = req.user!.id;

    const org = await prisma.$transaction(async (tx) => {
      try {
        const created = await tx.organization.create({
          data: { name, slug },
          select: { id: true, name: true, slug: true },
        });
        await tx.membership.create({
          data: {
            organizationId: created.id,
            userId,
            role: OrgRole.ADMIN,
          },
        });
        return created;
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          throw new SlugTakenError();
        }
        throw err;
      }
    });

    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'Organization created',
      data: { organization: publicOrg(org), role: OrgRole.ADMIN },
    });
  } catch (err) {
    sendError(res, err);
  }
});

orgsRouter.get('/', async (req, res) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user!.id },
      select: {
        role: true,
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    sendSuccess(res, {
      data: {
        organizations: memberships.map((m) => ({
          ...publicOrg(m.organization),
          role: m.role,
        })),
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});

orgsRouter.get('/:orgId', requireOrgMember, (req, res) => {
  sendSuccess(res, {
    data: {
      organization: publicOrg(req.org!),
      role: req.membership!.role,
    },
  });
});
```

- [ ] **Step 2: Mount router**

In `apps/api/src/index.ts`, add import and mount after auth:

```ts
import { orgsRouter } from '@/routes/orgs.js';
```

```ts
app.use('/auth', authRouter);
app.use('/orgs', orgsRouter);
```

- [ ] **Step 3: Lint**

```bash
pnpm --filter @relay/api lint
```

Expected: no errors.

- [ ] **Step 4: Commit** (only if user asked)

```bash
git add apps/api/src/routes/orgs.ts apps/api/src/index.ts
git commit -m "$(cat <<'EOF'
feat(api): add organization create/list/get routes

EOF
)"
```

---

### Task 5: Manual API verification

**Files:** none (runtime check)

**Interfaces:**
- Consumes: running API on `:4000`, seeded user, cookies from login

- [ ] **Step 1: Start API** (if not running)

```bash
pnpm --filter @relay/api dev
```

Expected: `API listening on http://localhost:4000`

- [ ] **Step 2: Login as owner (cookie jar)**

```bash
curl -s -c /tmp/relay-org-a.txt -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@relay.local","password":"password"}'
```

Expected: `"success":true` and Set-Cookie for access/refresh.

- [ ] **Step 3: List orgs (seeded demo)**

```bash
curl -s -b /tmp/relay-org-a.txt http://localhost:4000/orgs
```

Expected: `organizations` includes `{ "slug": "demo", "role": "admin", ... }`.

- [ ] **Step 4: Get demo org**

```bash
curl -s -b /tmp/relay-org-a.txt http://localhost:4000/orgs/demo
```

Expected: `"success":true`, organization slug `demo`, role `admin`.

- [ ] **Step 5: Create second org**

```bash
curl -s -b /tmp/relay-org-a.txt -X POST http://localhost:4000/orgs \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme","slug":"acme"}'
```

Expected: `201` envelope with `organization.slug` = `acme`, `role` = `admin`.

- [ ] **Step 6: Duplicate slug → 409**

```bash
curl -s -b /tmp/relay-org-a.txt -X POST http://localhost:4000/orgs \
  -H 'Content-Type: application/json' \
  -d '{"name":"Acme 2","slug":"acme"}'
```

Expected: `"success":false`, `"code":"SLUG_TAKEN"`, status 409.

- [ ] **Step 7: Register second user + prove 403**

```bash
curl -s -c /tmp/relay-org-b.txt -X POST http://localhost:4000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bob","email":"bob@relay.local","password":"password1"}'

curl -s -b /tmp/relay-org-b.txt http://localhost:4000/orgs/acme
```

Expected: `"success":false`, `"code":"FORBIDDEN"`, status 403.

- [ ] **Step 8: Unknown slug → 404**

```bash
curl -s -b /tmp/relay-org-a.txt http://localhost:4000/orgs/no-such-org
```

Expected: `"code":"NOT_FOUND"`, status 404.

---

### Task 6: Product docs

**Files:**
- Modify: `docs/steps/05-multi-tenant.md`
- Modify: `docs/ARCHITECTURE.md` (multi-tenant / auth-adjacent note if needed)
- Modify: `docs/STEPS.md`
- Modify: `docs/README.md` (link to new spec/plan if listed)

**Interfaces:**
- Produces: docs reflect shipped orgs/memberships; invites still pending

- [ ] **Step 1: Update step 5 status**

In `docs/steps/05-multi-tenant.md`:

- Set **Status:** to something like `In progress (orgs + memberships + requireOrgMember; invites deferred)`
- Check off done items that match this pass:
  - User can create an org and see it in `GET /orgs`
  - Second user without membership gets 403 on org routes
  - Creating org auto-creates owner membership
  - All new org-scoped handlers use `requireOrgMember`
- Leave invite-related checklist items unchecked
- Add a short note under API table that invite endpoints are deferred to a follow-up

- [ ] **Step 2: Update STEPS checklist**

In `docs/STEPS.md`, mark step 5 partially done or note “orgs/memberships done; invites pending” consistently with step file.

- [ ] **Step 3: Architecture touch**

In `docs/ARCHITECTURE.md` multi-tenant section, ensure it still says domain rows use `organization_id` and membership is verified — optionally link the new design spec under a “Detail” line similar to auth.

- [ ] **Step 4: Commit** (only if user asked)

```bash
git add docs/steps/05-multi-tenant.md docs/STEPS.md docs/ARCHITECTURE.md docs/README.md
git commit -m "$(cat <<'EOF'
docs: record organizations + memberships progress

EOF
)"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| No org FK on User; memberships join | Task 1 |
| `organizations` + `memberships` schema | Task 1 |
| `OrgRole` admin/employee | Task 1 |
| `SLUG_TAKEN` 409 | Task 1, 4 |
| Seed `demo` + owner admin | Task 2 |
| `requireOrgMember` + `req.org` / `req.membership` | Task 3 |
| `POST /orgs`, `GET /orgs`, `GET /orgs/:slug` | Task 4 |
| Slug-only public id | Task 3–4 |
| Creator = admin | Task 4 |
| Manual A/B 403 scenario | Task 5 |
| Invites / web UI out of scope | omitted intentionally |
| Docs update | Task 6 |

No placeholders left. Types/names consistent: `OrgRole`, `SlugTakenError`, `requireOrgMember`, `orgsRouter`, slug param `orgId`.
