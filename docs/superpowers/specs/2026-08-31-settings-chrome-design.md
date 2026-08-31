# Settings chrome — design

**Date:** 2026-08-31  
**Status:** Implemented  
**Step:** [15-settings-chrome.md](../../steps/15-settings-chrome.md)  
**Parent:** [2026-08-27-v1-product-design.md](./2026-08-27-v1-product-design.md)

## Goal

Persist the signed-in user’s **name**. Let an **admin** change a member’s role or remove them, without dropping the last admin. Hide leftover Circle settings nav; keep the files. Preferences stay client-only.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Profile name | `PATCH /auth/me` with `{ name }`. Trim, min 1. Same rules as register. Email/avatar/title stay out |
| Session | Response `{ user }` matches login/session. Web updates the session query cache |
| Member id | URL uses **user id** (`/orgs/:orgId/members/:userId`) — list already returns `id` as user id |
| Who mutates members | **Admin** only (`requireOrgRole(admin)`). Employees get 403 |
| Last admin | Cannot `DELETE` or PATCH role to `employee` when they are the only admin. 403 `FORBIDDEN` |
| Self | Admin may demote or remove themselves if another admin remains |
| Preferences | Client-only. No API |
| Security | Page stays in nav. Password change is step 16. Leave Circle mock sessions/passkeys in place |
| Teams | Keep `NavTeamsSettings` (wire to `useTeams`, not mock). Do not add a duplicate Teams item to `settingsNav` |
| Hide vs delete | Comment out leftover nav items. Do not delete Circle settings pages or mock-data |
| Notifications | Hidden (not in the keep list) |

## API

Envelope unchanged. `requireAuth` on `/auth/*`. Members: `requireAuth` → `requireOrgMember` → `req.org.id`. Role mutations also `requireOrgRole(admin)`.

| Method | Path | Who | Behavior |
|--------|------|-----|----------|
| `PATCH` | `/auth/me` | self | `{ name }`. 200 `{ user }`. Missing/blank name → 400. Unauthenticated → 401 |
| `PATCH` | `/orgs/:orgId/members/:userId` | admin | `{ role: "admin" \| "employee" }`. 200 `{ member }`. Unknown member → 404. Last-admin demote → 403 |
| `DELETE` | `/orgs/:orgId/members/:userId` | admin | `{ id }`. Unknown member → 404. Last-admin remove → 403 |

Unauthenticated → 401. Non-member → 403. Invalid role / empty PATCH → 400 `VALIDATION_ERROR`.

### User shape (unchanged)

```ts
{ id: string; email: string; name: string; isSuperAdmin: boolean }
```

### Member shape (unchanged from list)

```ts
{ id: string; name: string; email: string; role: string; joinedAt: string }
```

## Web

- `patchMeApi` in `auth.service.ts`; `usePatchMe` updates `queryKeys.session`
- Profile settings: session name + email. Persist name on blur. Comment out avatar upload, email pencil, title, username, leave-workspace
- `patchMemberApi` / `deleteMemberApi` in `members.service.ts`; TanStack mutations invalidate `queryKeys.members`
- Members list: admin sees role dropdown + remove. Last admin: demote/remove disabled
- `nav-settings.tsx` **keep:** Preferences, Profile, Security & access, Issue labels. **Hide** (comment out): Notifications, Code & reviews, Connected accounts, Agent personalization, Issue templates, SLAs, project templates/statuses/updates, and the whole Features group (AI, Initiatives, Documents, Customer requests, Releases, Pulse, Asks, Emojis, Integrations)
- `NavTeamsSettings` lists API teams. Mock `teams` stays on disk

## Tests

- Unauthenticated `PATCH /auth/me` → 401
- Authenticated `PATCH /auth/me` updates name; `GET /auth/session` returns it; blank name → 400
- Employee PATCH/DELETE member → 403
- Admin can change role and remove a non-last-admin
- Last admin PATCH-to-employee and DELETE → 403
- User B cannot mutate org A’s members (403)
- Unknown member → 404

Run: `pnpm --filter @relay/api test`

## Out of scope

- Password change / reset / SMTP (step 16)
- Avatar uploads
- Super-admin console
- Leave-workspace for employees
- Rewriting Circle security/preferences screens
