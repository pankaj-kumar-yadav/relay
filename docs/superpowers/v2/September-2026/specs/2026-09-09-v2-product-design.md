# Relay v2 — team daily — design

**Date:** 2026-09-09  
**Status:** Approved for planning  
**Canonical product docs:** [SCOPE-V2.md](../../../../SCOPE-V2.md), [STEPS-V2.md](../../../../STEPS-V2.md), [ARCHITECTURE.md](../../../../ARCHITECTURE.md)

## Goal

v1 is a self-hosted Linear-lite: comments, labels, inbox (in-app), cycles, views, SMTP for invite/reset, Docker for web + API + Postgres.

**v2** is the daily-team layer on that stack: persist issue subscribe, email the same inbox events, and store profile avatars plus issue files. It is **not** Circle-complete Linear.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Delivery | Sequential STEPS 18–20; one domain per step; spec → plan → build each slice |
| Theme | Team daily (subscribe + inbox email + avatars/issue files). Not documents, initiatives, or reviews |
| Reactions | **Already shipped.** Not a v2 step |
| Realtime | **None.** Inbox stays TanStack Query polling. No Redis, no WebSockets |
| Email | Same SMTP as v1. One mail per inbox notification after the DB transaction commits. Mail failure does not roll back the mutation |
| Inbox types | Unchanged: `comment` \| `assignee` \| `status` |
| Storage | **S3-compatible** API (AWS or Backblaze via env). Compose adds **MinIO**. Unset storage → uploads fail with a named error; the rest of the app still runs |
| Upload | Browser **presigned PUT**. Bytes never go through Express. `JSON_BODY_LIMIT` stays 256kb |
| Read | Short-lived **presigned GET**. Client never supplies object keys |
| Leftover Circle | **Keep files.** Hide from nav. Do not delete. Do not change `apps/web/mock-data/**` |
| Super-admin UI | **Out** |
| First code slice | Step 18 (subscribe), after its own spec/plan |

## In (v2)

- Issue subscribe (join table; expand inbox recipients)
- Inbox email for comment / assignee / status (plus subscribers)
- Profile avatars (replace Dicebear when a photo exists)
- Issue file attachments
- MinIO in Docker Compose; documented S3 env for AWS / Backblaze

## Out (v3+)

- Billing / plans, SSO / SAML, realtime / WebSockets
- AI agent, code reviews, documents, initiatives
- SLAs, issue templates, integrations, Pulse, Asks, customer requests, releases
- Super-admin console
- Comment-only uploads, image pipeline, virus scan
- Email digest, per-type mute, unsubscribe headers
- `issues.created_by` / My issues **Created** and **Activity** tabs (Assigned + Subscribed only)
- Burn-up chart APIs

## Success criteria

- A member can subscribe, get in-app **and** email on comment/assignee/status (never the actor), upload an avatar, and attach a file to an issue
- Org A cannot read org B’s subscriptions, notifications, or issue files
- `docker compose up` still brings up web, API, and Postgres; MinIO is in that stack so uploads work without a cloud account
- Dicebear remains the avatar when the user has no photo
- Hidden Circle routes do not appear in live nav

## Architecture

```text
Browser → Next.js :3000 → Express :4000 → Prisma → PostgreSQL
Email: API → nodemailer SMTP (after notify commit)
Files: Browser ─presigned PUT/GET─► MinIO / S3 / Backblaze
         Express signs URLs and stores attachment metadata only
Inbox: TanStack Query polling (unchanged interval)
```

- Tenancy: `requireAuth` → `requireOrgMember` → query with `req.org.id` (avatars: the user’s own photo; visible to members who can see that user)
- Web HTTP: `apps/web/services/<domain>.service.ts` named `*Api`; UI uses TanStack Query
- Envelope: `{ success, message, data, error }`
- Constants: `packages/shared/src/constants/<domain>.constant.ts`; app-only extras stay in API/web `constants/`

## Slice sequence

```text
18 Subscribe ──► 19 Inbox email ──► 20 Avatars + issue files
```

Subscribe first so email reuses one recipient helper. Email before files so SMTP works without a bucket.

Each step gets a thin file under `docs/steps/v2/`. Implementation still needs a per-slice spec/plan before code.

### 18 — Issue subscribe

- Table: `issue_subscriptions` (`organization_id`, `issue_id`, `user_id`, unique `(issue_id, user_id)`). Cascade delete with issue, org, and user
- Auto-subscribe (upsert in the same mutation): issue **creator** on create, **new assignee** on assign, **comment author** on comment. Unassign does **not** remove the row
- Inbox recipients: **assignee ∪ subscribers**, **one notification row per user**, never the actor. Today’s types and “same request as the mutation” stay
- API: `PUT` subscribe / unsubscribe; issue payloads include `subscribed` for the current user; list filter `subscribed=me`
- UI: wire existing context-menu toggle and Activity “Subscribe” control. My issues **Subscribed** uses `subscribed=me`. **Assigned** stays `assigneeId=me`. **Created** / **Activity** unchanged
- Issues still have no `created_by` column in this step

### 19 — Inbox email

- After the Prisma transaction that inserts notification rows **commits**, send **one** SMTP email per row
- Template: subject + issue title + link `{WEB_ORIGIN}/{orgSlug}/issue/{identifier}` (reuse `issuePath` shape)
- Unset SMTP: log in development, warn in production (existing `sendMail`)
- Mail throw → log, HTTP success for the comment/patch
- No digest, mute, or actor mail

### 20 — Avatars + issue files

- Client: `@aws-sdk/client-s3`. Env: `S3_ENDPOINT` (API → bucket), `S3_PUBLIC_ENDPOINT` (browser PUT/GET host, e.g. `http://localhost:9000` while the API uses `http://minio:9000`), `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_FORCE_PATH_STYLE`
- Compose: `minio` (+ bucket init). AWS / Backblaze = same env, different endpoint. No MinIO required for `pnpm dev` if S3 env is unset — uploads return `STORAGE_UNCONFIGURED`
- Flow: `POST intent` (kind, content-type, size, file name, issue id when kind is issue) → pending `attachments` row + presigned PUT → browser upload → `POST complete` (`HeadObject`, mark `ready`). Reads: presigned GET
- Keys: `avatars/{userId}/{attachmentId}`, `orgs/{orgId}/issues/{issueId}/{attachmentId}`. Client never chooses the key
- Table: `attachments` (`id`, `organization_id` nullable for avatars, `issue_id` nullable, `user_id` uploader, `kind` `avatar` \| `issue`, `status` `pending` \| `ready`, `content_type`, `byte_size`, `file_name`, `object_key`, timestamps)
- `users.avatar_attachment_id` nullable FK. Replacing an avatar completes a new row and drops the old object. Clearing the avatar nulls the FK (Dicebear fallback)
- Limits: avatar jpeg/png/webp, 2MB; issue files those plus pdf/txt/zip, 25MB; max 20 ready files per issue. PUT URL TTL 15 minutes; GET TTL 5 minutes
- Who: avatar upload/delete = that user. Issue attach/delete = any org member
- UI: wire Profile picture row; attach on the existing issue-details surface. Do not edit mock-data
- Tests mock the S3 SDK; unit tests do not require MinIO

## Leftover Circle

Keep component files (web rule). Do not reintroduce mock issue lists on wired routes. Direct URLs for out-of-v2 Circle screens stay hidden.

## Constants

New domains as slices land:

| Domain | File | When |
|--------|------|------|
| Subscribe | `subscribe.constant.ts` | step 18 |
| Mail (inbox subjects/paths) | extend `mail.constant.ts` | step 19 |
| Storage / attachment | `attachment.constant.ts` | step 20 |

Path builders stay in the matching domain. Shared package first.

## Testing

Per slice, minimum:

- Tenant isolation (subscriptions, notifications, issue files)
- Auth: unauthenticated → 401
- Subscribe: auto-subscribe, toggle, notify union + dedupe, actor skipped
- Email: `sendMail` once per recipient after commit; throw does not 500
- Uploads: intent validation, complete without object, storage unset, org isolation; S3 mocked

Do not block a slice on full UI coverage.

## Docs this spec owns

- [SCOPE-V2.md](../../../../SCOPE-V2.md) — v2 in/out
- [STEPS-V2.md](../../../../STEPS-V2.md) — steps 18–20
- Thin `docs/steps/v2/18-*.md` … `20-*.md`
- Step 18 detailed spec (separate file) before any subscribe code

Do not commit these files unless the human explicitly asks.

## Out of this spec’s implementation

No application code in the v2 product-spec pass. First implementation is step 18, after that slice’s spec and plan are written.
