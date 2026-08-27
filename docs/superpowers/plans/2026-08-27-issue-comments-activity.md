# Issue Comments + Activity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist issue comments and change events, and show them on issue detail instead of an in-memory mock.

**Architecture:** `comments` + `issue_events` are org-scoped. Nested routes on the existing issues router (`GET …/activity`, `POST …/comments`, `DELETE …/comments/:commentId`). `recordIssueEvent` writes events in the same transaction as create/patch. Web: `activity.service.ts` `*Api` functions + TanStack Query; mount `ActivityFeed` on issue detail.

**Tech Stack:** Express, Prisma, PostgreSQL, Zod, TanStack Query, existing envelope + dual JWT `requireAuth` + `requireOrgMember`

**Spec:** [docs/superpowers/specs/2026-08-27-issue-comments-activity-design.md](../specs/2026-08-27-issue-comments-activity-design.md)

## Global Constraints

- Tenancy: `requireAuth` → `requireOrgMember` → `req.org.id` — never authorize from URL alone
- Envelope: `{ success, message, data, error }` via `sendSuccess` / `sendError`
- Path aliases `@/` in API and web
- Constants in `*.constant.ts` (new domain `activity`); mirror API and web keys/values
- Web HTTP only in `apps/web/services/*.service.ts` named `*Api`; UI uses TanStack Query
- Comment body is a markdown string (max 16_000); no Circle ContentBlocks
- Delete own comment only; hide Subscribe and reactions
- Event types this step: `created` | `status` | `priority` | `assignee` only
- Do not commit unless the user explicitly asks (git rules override frequent-commit steps)
- Do not commit docs/specs/plans unless the user explicitly asks to commit those paths
- Do not implement steps 11–17 in this plan

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/prisma/schema.prisma` | `Comment`, `IssueEvent` + relations |
| `apps/api/prisma/migrations/20260827120000_add_comments_activity/migration.sql` | Tables + indexes |
| `apps/api/src/constants/activity.constant.ts` | Event types, body max, list limit |
| `apps/api/src/utils/issue/issueEvent.ts` | `recordIssueEvent` |
| `apps/api/src/utils/issue/issueEvent.test.ts` | Unit tests for payload helper |
| `apps/api/src/routes/issues/activity.ts` | Activity + comment routes |
| `apps/api/src/routes/issues/issues.ts` | Mount activity router; emit events on create/patch |
| `apps/api/src/routes/issues/activity.tenant.test.ts` | Tenant + author-delete + event tests |
| `apps/api/prisma/seed.ts` | Two comments on Acme first issue |
| `apps/web/constants/activity.constant.ts` | Mirrored consts |
| `apps/web/constants/date.constant.ts` | `formatRelativeTime` |
| `apps/web/services/activity.service.ts` | `listActivityApi`, `createCommentApi`, `deleteCommentApi` |
| `apps/web/lib/query-keys.ts` | `issues.activity` |
| `apps/web/hooks/use-activity.ts` | Query + create/delete mutations |
| `apps/web/components/common/issues/details/activity-feed.tsx` | API-backed feed |
| `apps/web/components/common/issues/details/issue-details.tsx` | Mount feed |

---

### Task 1: Schema, constants, `recordIssueEvent`

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260827120000_add_comments_activity/migration.sql`
- Create: `apps/api/src/constants/activity.constant.ts`
- Create: `apps/web/constants/activity.constant.ts`
- Create: `apps/api/src/utils/issue/issueEvent.ts`
- Test: `apps/api/src/utils/issue/issueEvent.test.ts`

**Interfaces:**
- Produces: Prisma `Comment`, `IssueEvent`; `IssueEventType`, `COMMENT_BODY_MAX`, `ACTIVITY_LIST_LIMIT`; `recordIssueEvent(tx, input)`
- Consumes: existing `Issue`, `Organization`, `User`

- [ ] **Step 1: Write unit test for assignee payload shape**

Create `apps/api/src/utils/issue/issueEvent.test.ts`:

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { IssueEventType } from '@/constants/activity.constant.js';
import { eventPayload } from '@/utils/issue/issueEvent.js';

test('eventPayload omits unchanged fields and records from/to', () => {
  assert.deepEqual(eventPayload(IssueEventType.CREATED), {});
  assert.deepEqual(eventPayload(IssueEventType.STATUS, 'to-do', 'done'), {
    from: 'to-do',
    to: 'done',
  });
  assert.deepEqual(eventPayload(IssueEventType.ASSIGNEE, null, 'user-1'), {
    from: null,
    to: 'user-1',
  });
});
```

- [ ] **Step 2: Run test — expect FAIL (module missing)**

Run: `pnpm --filter @relay/api test -- src/utils/issue/issueEvent.test.ts`

Expected: FAIL, cannot find module.

- [ ] **Step 3: Add Prisma models**

On `User` add:

```prisma
  commentsAuthored Comment[]     @relation("CommentAuthor")
  issueEventsActed IssueEvent[]  @relation("IssueEventActor")
```

On `Organization` add:

```prisma
  comments    Comment[]
  issueEvents IssueEvent[]
```

On `Issue` add:

```prisma
  comments Comment[]
  events   IssueEvent[]
```

Append:

```prisma
model Comment {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  issueId        String       @map("issue_id") @db.Uuid
  authorId       String       @map("author_id") @db.Uuid
  body           String
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  issue          Issue        @relation(fields: [issueId], references: [id], onDelete: Cascade)
  author         User         @relation("CommentAuthor", fields: [authorId], references: [id], onDelete: Restrict)

  @@index([organizationId, issueId, createdAt])
  @@map("comments")
}

model IssueEvent {
  id             String       @id @default(uuid()) @db.Uuid
  organizationId String       @map("organization_id") @db.Uuid
  issueId        String       @map("issue_id") @db.Uuid
  actorId        String       @map("actor_id") @db.Uuid
  type           String
  payload        Json
  createdAt      DateTime     @default(now()) @map("created_at")
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  issue          Issue        @relation(fields: [issueId], references: [id], onDelete: Cascade)
  actor          User         @relation("IssueEventActor", fields: [actorId], references: [id], onDelete: Restrict)

  @@index([organizationId, issueId, createdAt])
  @@map("issue_events")
}
```

- [ ] **Step 4: Add migration SQL**

Create `apps/api/prisma/migrations/20260827120000_add_comments_activity/migration.sql`:

```sql
-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "issue_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issue_events" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "issue_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issue_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "comments_organization_id_issue_id_created_at_idx" ON "comments"("organization_id", "issue_id", "created_at");

-- CreateIndex
CREATE INDEX "issue_events_organization_id_issue_id_created_at_idx" ON "issue_events"("organization_id", "issue_id", "created_at");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_events" ADD CONSTRAINT "issue_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_events" ADD CONSTRAINT "issue_events_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "issues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issue_events" ADD CONSTRAINT "issue_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

- [ ] **Step 5: Constants + helper**

`apps/api/src/constants/activity.constant.ts` and the same file under `apps/web/constants/`:

```ts
export const IssueEventType = {
  CREATED: 'created',
  STATUS: 'status',
  PRIORITY: 'priority',
  ASSIGNEE: 'assignee',
} as const;

export type IssueEventTypeValue =
  (typeof IssueEventType)[keyof typeof IssueEventType];

export const COMMENT_BODY_MAX = 16_000;
export const ACTIVITY_LIST_LIMIT = 200;
```

`apps/api/src/utils/issue/issueEvent.ts`:

```ts
import type { Prisma } from '@prisma/client';

import {
  IssueEventType,
  type IssueEventTypeValue,
} from '@/constants/activity.constant.js';

export function eventPayload(
  type: IssueEventTypeValue,
  from?: string | null,
  to?: string | null,
): Prisma.InputJsonValue {
  if (type === IssueEventType.CREATED) return {};
  return { from: from ?? null, to: to ?? null };
}

type Tx = Prisma.TransactionClient;

export async function recordIssueEvent(
  tx: Tx,
  input: {
    organizationId: string;
    issueId: string;
    actorId: string;
    type: IssueEventTypeValue;
    payload?: Prisma.InputJsonValue;
  },
) {
  await tx.issueEvent.create({
    data: {
      organizationId: input.organizationId,
      issueId: input.issueId,
      actorId: input.actorId,
      type: input.type,
      payload: input.payload ?? {},
    },
  });
}
```

- [ ] **Step 6: Generate client, migrate, re-run unit test**

```bash
pnpm --filter @relay/api db:generate
pnpm --filter @relay/api exec prisma migrate deploy
pnpm --filter @relay/api test -- src/utils/issue/issueEvent.test.ts
```

Expected: PASS.

- [ ] **Step 7: Leave uncommitted** (do not git commit unless the user asks)

---

### Task 2: Activity routes + tenant tests

**Files:**
- Create: `apps/api/src/routes/issues/activity.ts`
- Modify: `apps/api/src/routes/issues/issues.ts` (mount + emit events)
- Test: `apps/api/src/routes/issues/activity.tenant.test.ts`

**Interfaces:**
- Consumes: `loadIssue` from issues (export it), `recordIssueEvent`, `IssueEventType`
- Produces: `GET /orgs/:orgId/issues/:issueId/activity`, `POST …/comments`, `DELETE …/comments/:commentId`

- [ ] **Step 1: Write failing tenant + comment tests**

Create `apps/api/src/routes/issues/activity.tenant.test.ts` modeled on `issues.tenant.test.ts` (`listen`, `register`, cookie helper, skip if no `DATABASE_URL`). Cases:

1. User B `GET /orgs/{slugA}/issues/{id}/activity` → 403 `FORBIDDEN`
2. User B `GET /orgs/{slugB}/issues/{id}/activity` → 404 `NOT_FOUND`
3. Member A `POST` comment → 201; `GET` activity includes `created` event + comment
4. Empty `{ body: "   " }` → 400
5. Second member in org A cannot `DELETE` A’s comment → 403; author delete → 200
6. `PATCH` status → activity includes `type: "status"` with `{ from, to }`

Register a second user into org A via invite accept or by creating membership through a second register + … actually easiest: user A invites is heavier. Create user C, then use prisma in the test to insert membership, OR have user A’s org and add C by posting if there’s no endpoint.

Simplest: in the test after creating org A, use `prisma.membership.create` for user C (registered) so we have two members. That’s acceptable in an integration test that already uses prisma for cleanup.

- [ ] **Step 2: Run tests — expect FAIL (404 Not found on activity path)**

Run: `pnpm --filter @relay/api test -- src/routes/issues/activity.tenant.test.ts`

- [ ] **Step 3: Export `loadIssue` from `issues.ts` and mount activity router**

At the bottom of issue-route setup, `issuesRouter.use(activityRouter)` where `activityRouter` is `Router({ mergeParams: true })` with `GET /:issueId/activity` etc.

Define activity routes **before** they could be shadowed. Existing `GET /:issueId` stays; more specific `/:issueId/activity` works on the same router if registered. Put activity routes on a child router:

```ts
// issues.ts
import { activityRouter } from '@/routes/issues/activity.js';
issuesRouter.use(activityRouter);
```

`activity.ts` uses `mergeParams: true` and paths `/:issueId/activity`, `/:issueId/comments`, `/:issueId/comments/:commentId`.

Export `loadIssue` from `issues.ts` (currently file-private).

- [ ] **Step 4: Implement activity handlers**

`GET`: load issue; if missing 404. Query comments + events with `organizationId` + `issueId`, include author/actor `{ id, name }`. Map to union, sort by `createdAt` asc, slice last `ACTIVITY_LIST_LIMIT`.

`POST`: zod `body` trim min 1 max `COMMENT_BODY_MAX`. Create comment. 201 `{ comment }`.

`DELETE`: find comment by id + organizationId + issueId. Missing → 404. `authorId !== req.user.id` → 403. Delete. `{ id }`.

- [ ] **Step 5: Emit events on create/patch**

Create: inside existing `$transaction`, after `tx.issue.create`, `recordIssueEvent(tx, { type: IssueEventType.CREATED, actorId: req.user!.id, … })`.

Patch: wrap `prisma.issue.update` in `$transaction`. If `data.status` defined and !== `existing.status`, record status event with `eventPayload(STATUS, existing.status, data.status)`. Same for priority and assignee (`existing.assignee?.id ?? null`).

- [ ] **Step 6: Re-run tests — expect PASS**

Run: `pnpm --filter @relay/api test -- src/routes/issues/activity.tenant.test.ts src/routes/issues/issues.tenant.test.ts src/utils/issue/issueEvent.test.ts`

- [ ] **Step 7: Leave uncommitted**

---

### Task 3: Seed

**Files:**
- Modify: `apps/api/prisma/seed.ts`

**Interfaces:**
- Consumes: `IssueEventType` from activity constants
- Produces: two comments on Acme’s first issue if that issue has none

- [ ] **Step 1: After `syncTeamIssues` for Acme, ensure activity**

```ts
const first = await prisma.issue.findFirst({
  where: { organizationId: acme.id },
  orderBy: { number: 'asc' },
});
if (first) {
  const existingComments = await prisma.comment.count({
    where: { issueId: first.id },
  });
  if (existingComments === 0) {
    const hasCreated = await prisma.issueEvent.findFirst({
      where: { issueId: first.id, type: IssueEventType.CREATED },
    });
    if (!hasCreated) {
      await prisma.issueEvent.create({
        data: {
          organizationId: acme.id,
          issueId: first.id,
          actorId: owner.id,
          type: IssueEventType.CREATED,
          payload: {},
        },
      });
    }
    await prisma.comment.createMany({
      data: [
        {
          organizationId: acme.id,
          issueId: first.id,
          authorId: owner.id,
          body: 'Seed comment: kickoff notes for Launch.',
        },
        {
          organizationId: acme.id,
          issueId: first.id,
          authorId: owner.id,
          body: 'Seed comment: follow up after the first cycle.',
        },
      ],
    });
  }
}
```

- [ ] **Step 2: Run `pnpm --filter @relay/api db:seed`** — expect success, no duplicate comments on re-run

- [ ] **Step 3: Leave uncommitted**

---

### Task 4: Web service, hook, feed UI

**Files:**
- Create: `apps/web/services/activity.service.ts`
- Create: `apps/web/hooks/use-activity.ts`
- Modify: `apps/web/lib/query-keys.ts`
- Modify: `apps/web/constants/date.constant.ts`
- Modify: `apps/web/components/common/issues/details/activity-feed.tsx`
- Modify: `apps/web/components/common/issues/details/issue-details.tsx`

**Interfaces:**
- Consumes: `listActivityApi(orgSlug, issueId)` → `{ items: ApiActivityItem[] }`
- Produces: live feed on issue detail

- [ ] **Step 1: Add `formatRelativeTime`**

In `apps/web/constants/date.constant.ts`:

```ts
import { formatDistanceToNowStrict, parseISO } from 'date-fns';

export function formatRelativeTime(iso: string, now = new Date()): string {
  return formatDistanceToNowStrict(toDate(iso), { addSuffix: true });
}
```

(`toDate` already exists; `now` unused except for tests — omit `now` if unused, or pass as `formatDistanceToNowStrict` baseDate via date-fns `now` option: `{ addSuffix: true }` only is fine.)

- [ ] **Step 2: Service + query key + hook**

`listActivityApi`, `createCommentApi`, `deleteCommentApi` in `activity.service.ts`.

Query key: `issues.activity: (orgSlug, issueId) => ['issues', orgSlug, 'activity', issueId]`.

Hook: `useIssueActivity(orgSlug, issueId)` + `useCommentMutations` that invalidate that key.

- [ ] **Step 3: Rewrite `ActivityFeed`**

Props: `{ orgSlug: string; issueId: string }`. Load via hook. Render events/comments. Composer calls `createCommentApi`. No mock users, no Subscribe, no reactions. Body: `whitespace-pre-wrap`. Event text from `type` + `payload`.

Event copy:

- `created` → `{actor} created the issue`
- `status` → `{actor} changed status to {payload.to}`
- `priority` → `{actor} changed priority to {payload.to}`
- `assignee` → `{actor} assigned` / `unassigned` based on `payload.to`

- [ ] **Step 4: Mount in `issue-details.tsx`** below the description `Textarea`, still inside the max-w-3xl column:

```tsx
<ActivityFeed orgSlug={orgId} issueId={issue.identifier} />
```

Use identifier so URLs stay `TEAM-123`.

- [ ] **Step 5: Typecheck**

```bash
pnpm --filter @relay/api exec tsc --noEmit
pnpm --filter @relay/web exec tsc --noEmit
```

Expected: PASS (or only pre-existing errors unrelated to this slice).

- [ ] **Step 6: Manual check** (if `pnpm dev` is running): open an Acme issue, see seed comments, post a comment, change status, confirm an event appears after refresh.

- [ ] **Step 7: Leave uncommitted**

---

### Task 5: Mark step 10 done in docs

**Files:**
- Modify: `docs/steps/10-comments-activity.md` — Status Done, check Done when
- Modify: `docs/STEPS.md` — mark step 10 complete; current becomes 11
- Modify: `docs/README.md` — step 10 Done
- Modify: `docs/ARCHITECTURE.md` — current step 11
- Modify: `docs/steps/00-overview.md` — next is step 11 only after 10 is actually done

- [ ] **Step 1: Update statuses only after tests pass**
- [ ] **Step 2: Leave uncommitted**
