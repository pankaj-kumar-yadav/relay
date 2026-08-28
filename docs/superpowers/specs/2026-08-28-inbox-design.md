# Inbox — design

**Date:** 2026-08-28  
**Status:** Implemented  
**Step:** [12-inbox.md](../../steps/12-inbox.md)  
**Parent:** [2026-08-27-v1-product-design.md](./2026-08-27-v1-product-design.md)

## Goal

In-app notifications for comment, assignee, and status changes. Polling only. Each user sees only their own rows in the current org.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Recipients | One person per event. Never the actor |
| Comment | Assignee, if set and not the author |
| Assignee change | New assignee only (not unassign, not previous assignee) |
| Status change | Assignee after the patch, if set |
| Same request, both status + assignee | Up to two rows (status to next assignee, plus assignee if new) |
| Unassigned issue | No comment or status row |
| Labels / priority / created | No inbox rows in v1 |
| Timing | Insert in the **same request** (same Prisma transaction) as the comment or patch |
| Email | None |
| Transport | TanStack Query `refetchInterval` 5 mins. No WebSockets / Redis |
| Reviews inbox | Stays hidden |

## Data model

### `notifications`

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `organization_id` | FK → organizations, cascade |
| `user_id` | Recipient. FK → users, cascade |
| `issue_id` | FK → issues, cascade |
| `actor_id` | FK → users, restrict |
| `type` | `comment` \| `assignee` \| `status` |
| `read_at` | timestamptz, null = unread |
| `created_at` | timestamptz |

Indexes: `(user_id, organization_id, created_at)`, `(organization_id)`.

No payload column. List copy is derived from `type` on the client.

Prisma relations on `User` (recipient + actor), `Issue`, `Organization`.

## Constants

`apps/api/src/constants/inbox.constant.ts` and `apps/web/constants/inbox.constant.ts` — same keys/values for types and list limit:

```ts
export const NotificationType = {
  COMMENT: 'comment',
  ASSIGNEE: 'assignee',
  STATUS: 'status',
} as const;

export const INBOX_LIST_LIMIT = 100;
```

Web also has:

```ts
export const INBOX_POLL_INTERVAL_MS = 300_000;
export const INBOX_UNREAD_BADGE_MAX = 99;
export const InboxPath = { INBOX: '/inbox' } as const;
export function inboxPath(orgSlug: string): string;
```

`WorkspacePath.INBOX` moves to this domain. Reviews stay in `workspace.constant.ts`.

## API

Envelope unchanged. `requireAuth` + `requireOrgMember`. Queries use `req.user.id` **and** `req.org.id`.

Mounted at `/orgs/:orgId/notifications`.

| Method | Path | Who | Behavior |
|--------|------|------|----------|
| `GET` | `/orgs/:orgId/notifications` | member | `{ notifications, unreadCount }`. Newest first. Cap `INBOX_LIST_LIMIT`. Only the current user’s rows |
| `POST` | `/orgs/:orgId/notifications/read-all` | member | Sets `read_at` on that user’s unread rows in this org. 200 `{ unreadCount: 0 }` |
| `POST` | `/orgs/:orgId/notifications/:notificationId/read` | member | Sets `read_at` if unread. Missing / other user’s id → **404**. 200 `{ notification }` |

Unauthenticated → 401. Non-member → 403. Never return another user’s row (404 on mark-read, empty list on GET).

### Notification shape

```ts
{
  id: string;
  type: 'comment' | 'assignee' | 'status';
  readAt: string | null;
  createdAt: string;
  actor: { id: string; name: string };
  issue: {
    id: string;
    identifier: string;
    title: string;
    status: string;
  };
}
```

### Emit helper

`shouldNotify(recipientId, actorId)` is true only when `recipientId` is a non-empty string and not the actor.

`notifyIfRecipient(tx, { organizationId, issueId, actorId, recipientId, type })` inserts one row when `shouldNotify` is true. Called from:

- `POST …/issues/:issueId/comments` — `recipientId` = issue `assigneeId` at write time
- `PATCH …/issues/:issueId` — status change uses assignee **after** the update; assignee change uses the new `assigneeId`

## Web

- `apps/web/services/inbox.service.ts`: `listNotificationsApi`, `markNotificationReadApi`, `markAllNotificationsReadApi`
- `apps/web/hooks/use-inbox.ts` via TanStack Query; `queryKeys.inbox(orgSlug)`; `refetchInterval: INBOX_POLL_INTERVAL_MS`
- Inbox page uses the query (not `notifications-store` / mock `inboxItems`)
- Selecting an unread row opens it; the check button marks it read
- Preview: actor, type copy, issue title, Open → `issuePath`. No mock `issue-details` / composer
- `nav-inbox.tsx`: restore Inbox (badge = unread count) + Search + My issues. Reviews stay hidden
- Sidebar default: inbox `always`; personal order `inbox`, `my-issues`. Persist migrate so stored `never` from MVP becomes `always`
- `notifications-store.ts` and `mock-data/inbox.ts` stay on disk, unused by the wired page

Copy:

| Type | Copy |
|------|------|
| `comment` | commented on this issue |
| `assignee` | assigned this issue to you |
| `status` | changed the status |

## Seed

On Techap / StratXG: every **employee** gets `comment`, `assignee`, and `status` rows from an admin (creates an assigned issue if needed). Idempotent per user/type. Acme stays comment-only (author = assignee → no row).

## Tests

- Unauthenticated GET → 401
- User B cannot `GET` org A’s notifications (403)
- Same org: user A’s comment on an issue assigned to C creates a row for C only
- Author-is-assignee comment writes none
- Assignee change notifies the new assignee, not self-assign, not unassign
- Status change notifies the assignee; unassigned issue writes none
- Mark one read / mark all read; mark-read of another user’s id → 404

Run: `pnpm --filter @relay/api test`

## Out of scope

- WebSockets / Redis
- Email per notification
- Reviews inbox
- Mentions, subscribe, label / priority inbox rows
- Delete / snooze notifications
