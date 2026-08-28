# Team icons — design

**Date:** 2026-08-28  
**Status:** Approved  
**Step:** Teams add-on (not a numbered v1 step; settings chrome stays [15-settings-chrome.md](../../steps/15-settings-chrome.md))  
**Parent:** [2026-08-27-v1-product-design.md](./2026-08-27-v1-product-design.md)

## Goal

Each team has an optional native emoji icon, persisted on the API and shown in **Your teams**, the teams list, team header, and team settings. Members can pick or clear it. Empty icon falls back to the first letter of the team key.

## Decisions locked

| Topic | Choice |
|-------|--------|
| Storage | Native emoji string on `teams.icon`. Not Lucide keys, not image URLs |
| Empty | `''` means no custom icon. UI shows first character of `key` |
| Max | `TEAM_ICON_MAX` = 32 (ZWJ sequences). Trimmed. No grapheme-cluster validation |
| Create | Optional `icon`. Omitted or `''` → empty |
| Patch | Optional `icon`. `''` clears. Same auth as today: any **member** |
| Default team | `ensureDefaultTeam` / `createDefaultTeam` leave `icon` empty |
| Picker | Shared component wrapping existing `emoji-picker-react`; comments reuse it |
| Change UI | Team settings: click icon → popover → `PATCH`. Create-team: optional picker |
| Surfaces | Sidebar **Your teams**, teams list, team settings, new-team, team page header |
| Leftover Circle | Stay mock. Do not wire initiatives / documents / etc. |
| Settings chrome | Out. Profile, members, nav hide stay step 15 |

## Data model

### `teams.icon`

| Column | Notes |
|--------|--------|
| `icon` | `text` NOT NULL DEFAULT `''` |

No index. Existing rows get `''` via the default.

## Constants

`apps/api/src/constants/team.constant.ts` and `apps/web/constants/team.constant.ts` — same keys/values:

```ts
export const TEAM_ICON_MAX = 32;
```

## API

Envelope unchanged. `requireAuth` + `requireOrgMember`. `publicTeam` always includes `icon`.

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/orgs/:orgId/teams` | Each team includes `icon` |
| `GET` | `/orgs/:orgId/teams/:teamId` | Includes `icon` |
| `POST` | `/orgs/:orgId/teams` | Optional `icon` (string, 0–32 after trim) |
| `PATCH` | `/orgs/:orgId/teams/:teamId` | Optional `icon`. Empty string clears. Still 400 if no fields to update |

Nested `team` on projects / issues uses the same `publicTeam` shape.

Too-long icon → 400 `VALIDATION_ERROR`. Unauthenticated → 401. Non-member → 403.

### Team shape

```ts
{
  id: string;
  key: string;
  name: string;
  icon: string; // '' when unset
}
```

## Web

- `TeamSummary.icon`; create/patch input include optional `icon`
- Shared `TeamIcon`: emoji when `icon` is non-empty, else first character of `key`
- `nav-teams.tsx`, teams list, team settings, new-team, team header: API icon (drop hardcoded `🛠️` / mock `teams` on those screens)
- Team settings: click icon opens popover picker; select → `patchTeamApi`; no extra save button
- New team: optional picker; omitted icon stays empty
- `queryKeys.teams` invalidation already covers list + detail after patch
- `mock-data/teams.ts` stays on disk; leftover Circle screens may keep using it

## Seed

Each seeded team gets a distinct emoji (e.g. CORE `🛠️`, LMS `📚`). Re-seed updates `icon` so existing DBs pick it up. Idempotent.

## Tests

- List/get include `icon`
- Create with icon; create without icon → `''`
- Patch icon; patch `''` clears
- Icon longer than 32 → 400
- Non-member cannot patch another org’s team (existing tenant coverage)

Run: `pnpm --filter @relay/api test`

## Out of scope

- Custom uploaded images / avatars
- Admin-only icon edits
- Full settings chrome (step 15)
- Wiring leftover Circle team-icon surfaces
- Emoji picker on the sidebar row itself (settings is enough)
