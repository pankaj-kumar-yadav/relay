# Issue comments + activity — design

**Date:** 2026-08-27  
**Status:** Implemented  
**Step:** [10-comments-activity.md](../../steps/10-comments-activity.md)  
**Parent:** [2026-08-27-v1-product-design.md](./2026-08-27-v1-product-design.md)

## Goal

Persist issue comments and change events. Replace the in-memory activity composer. `IssueDetails` currently has no activity feed mounted — add one that talks to the API.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Comment body | Markdown **string**, max **16_000** chars |
| Delete | **Own comment only** (author `user_id`). Admins cannot delete others in this step |
| Activity order | Chronological **ascending** (oldest first) |
| Activity cap | Last **200** items (comments + events merged). No cursor in this step |
| Event types (this step) | `created`, `status`, `priority`, `assignee` |
| Event payload | JSON `{ from, to }` for changes; `{}` for `created`. `from`/`to` for assignee are user ids or `null` |
| Write path | Same DB transaction as the issue mutation when possible |
| Reactions / Subscribe | Hidden. Do not wire |
| `:issueId` | Existing `parseIssueRef` (UUID or `TEAM-123`) |
| Relative time | `formatRelativeTime` in `apps/web/constants/date.constant.ts` |

## Data model

### `comments`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `organization_id` | FK → organizations, cascade |
| `issue_id` | FK → issues, cascade |
| `author_id` | FK → users, restrict |
| `body` | text, 1–16_000 after trim |
| `created_at` / `updated_at` | timestamptz |

Indexes: `(organization_id, issue_id, created_at)`.

### `issue_events`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `organization_id` | FK → organizations, cascade |
| `issue_id` | FK → issues, cascade |
| `actor_id` | FK → users, restrict |
| `type` | `created` \| `status` \| `priority` \| `assignee` |
| `payload` | JSON |
| `created_at` | timestamptz |

Indexes: `(organization_id, issue_id, created_at)`.

Prisma relations on `Issue`, `Organization`, `User` (`commentsAuthored`, `issueEventsActed`).

## Constants

`apps/api/src/constants/activity.constant.ts` and `apps/web/constants/activity.constant.ts` — same keys/values:

```ts
export const IssueEventType = {
  CREATED: 'created',
  STATUS: 'status',
  PRIORITY: 'priority',
  ASSIGNEE: 'assignee',
} as const;

export const COMMENT_BODY_MAX = 16_000;
export const ACTIVITY_LIST_LIMIT = 200;
```

Event types for labels/cycle are **not** added until those steps.

## API

All routes: `requireAuth` + `requireOrgMember`. Query with `req.org.id`. Envelope unchanged.

Mounted on existing issues router (`/orgs/:orgId/issues`):

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/:issueId/activity` | Merge comments + events for that issue, sort by `createdAt` asc, take last `ACTIVITY_LIST_LIMIT`. 404 if issue not in org |
| `POST` | `/:issueId/comments` | Body `{ body }`. Trim; empty → 400. 201 `{ comment }` |
| `DELETE` | `/:issueId/comments/:commentId` | Author only → 200 `{ id }`. Other member → 403. Missing → 404 |

### Response shapes

Actor:

```ts
{ id: string; name: string }
```

Comment:

```ts
{
  id: string;
  body: string;
  author: { id: string; name: string };
  createdAt: string; // ISO
}
```

Activity item (discriminated union):

```ts
| {
    kind: 'event';
    id: string;
    type: 'created' | 'status' | 'priority' | 'assignee';
    actor: { id: string; name: string };
    payload: Record<string, unknown>;
    createdAt: string;
  }
| {
    kind: 'comment';
    id: string;
    body: string;
    author: { id: string; name: string };
    createdAt: string;
  }
```

`GET …/activity` → `{ items: ActivityItem[] }`.

### Events on issue writes

Helper `recordIssueEvent` in `apps/api/src/utils/issue/issueEvent.ts`:

```ts
recordIssueEvent(tx, {
  organizationId: string;
  issueId: string;
  actorId: string;
  type: IssueEventTypeValue;
  payload?: Prisma.InputJsonValue;
}): Promise<void>
```

- `POST /issues` → `created` with `{}` (same transaction as create)
- `PATCH /issues/:id` → one event per changed field among status, priority, assignee (skip if value unchanged). Title/description/rank/team/project do **not** emit events in this step

## Web

- `apps/web/services/activity.service.ts`: `listActivityApi`, `createCommentApi`, `deleteCommentApi`
- `apps/web/hooks/use-activity.ts` via TanStack Query
- Query key: `queryKeys.issues.activity(orgSlug, issueId)`
- Mount `ActivityFeed` in `issue-details.tsx` below the description
- Feed: no mock `users`, no in-memory-only comments, no Subscribe, no reactions
- Comment body rendered as plain text with newlines preserved (`whitespace-pre-wrap`). Do not parse Circle `ContentBlocks`
- Event row copy from `type` + `payload` (constants for the verb; status/priority values shown as stored ids)

## Seed

On Acme’s first issue, after issues exist: one `created` event (if missing) and two comments from the owner. Idempotent upsert-or-skip so re-seed does not duplicate forever — delete comments for that issue then re-insert, or skip if any comments already exist.

## Tests

- Tenant: user B cannot `GET` activity or `POST` comment on org A’s issue (403 or 404 consistent with existing issue tenant test)
- Author-only delete: other member in the **same** org gets 403
- Create issue → activity includes `created`
- Patch status → activity includes `status` with `{ from, to }`
- Empty comment body → 400

Run: `pnpm --filter @relay/api test`

## Out of scope

- Inbox notifications (step 12)
- Label / cycle events (steps 11 / 13)
- Comment edit, reactions, subscribe
- Markdown rendering beyond preserved newlines
- Cursor pagination
