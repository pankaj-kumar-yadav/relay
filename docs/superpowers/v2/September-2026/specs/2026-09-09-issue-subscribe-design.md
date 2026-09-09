# Issue subscribe — design

**Date:** 2026-09-09  
**Status:** Implemented  
**Step:** [18-subscribe.md](../../../../steps/v2/18-subscribe.md)  
**Parent:** [2026-09-09-v2-product-design.md](./2026-09-09-v2-product-design.md)

## Goal

Persist issue watchers. Expand comment and status inbox rows to assignee ∪ subscribers. Wire existing Circle subscribe controls. No email (step 19).

## Decisions locked

| Topic | Choice |
|-------|--------|
| Table | `issue_subscriptions` unique `(issue_id, user_id)` |
| Auto-subscribe | Creator on create; new assignee on assign; comment author on comment |
| Unassign | Does **not** delete the row |
| COMMENT / STATUS recipients | `assigneeId ∪ subscribers`, one row per user, never the actor |
| ASSIGNEE recipients | New assignee only (copy is “assigned this issue to you”). Auto-subscribe them |
| Unsubscribed assignee | Still notified on comment/status (`∪ assignee`) |
| Toggle | `PUT /orgs/:orgId/issues/:issueId/subscription` `{ subscribed: boolean }` |
| List | `GET /issues?subscribed=me` |
| Payload | Every public issue includes `subscribed` for the current user |
| Created / Activity tabs | Unchanged |

## Data model

`issue_subscriptions`: `id`, `organization_id`, `issue_id`, `user_id`, `created_at`. FKs cascade on org, issue, user. Index `(organization_id, user_id)`.

## API

`requireAuth` + `requireOrgMember`. Missing issue → 404. Other org → 403/404 as today.

| Method | Path | Body / query | Result |
|--------|------|----------------|--------|
| `PUT` | `/orgs/:orgId/issues/:issueId/subscription` | `{ subscribed: boolean }` | `{ issue }` with updated `subscribed` |
| `GET` | `/orgs/:orgId/issues?subscribed=me` | — | Issues the current user watches |
| GET/POST/PATCH issue | — | — | `subscribed` boolean |

Helpers (same Prisma transaction as the mutation):

- `ensureSubscribed(tx, { organizationId, issueId, userId })` upsert
- `notifyWatchers(tx, { organizationId, issueId, actorId, type, extraRecipientId })` unique union then `notifyIfRecipient`

## Web

- `putIssueSubscriptionApi` + `subscribed?: 'me'` on list query
- Map `subscribed` on the API issue (do not edit `mock-data`)
- Context menu and Activity “Subscribe” call the API
- My issues **Subscribed** lists `subscribed=me`; **Assigned** stays `assigneeId=me`

## Tests

HTTP: auto-subscribe, toggle, list `subscribed=me`, comment/status fan-out + dedupe, actor skipped, assignee-type not fanned out to other subscribers, unauth 401, other-org isolated.

## Out of scope

Inbox email, uploads, `issues.created_by`, Created/Activity tabs.
