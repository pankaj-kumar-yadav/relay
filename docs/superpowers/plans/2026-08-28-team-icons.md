# Team Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist an optional native emoji on each team and show it in Your teams, the teams list, team header, and team settings, with a picker to change or clear it.

**Architecture:** `teams.icon` text column (default `''`). Included on `publicTeam`. Optional on create/patch. Web: `TeamSummary.icon`, shared `TeamIcon` + `EmojiPicker`, settings popover `PATCH`es immediately.

**Tech Stack:** Express, Prisma, PostgreSQL, Zod, TanStack Query, `emoji-picker-react`, existing envelope + `requireAuth` + `requireOrgMember`

**Spec:** [docs/superpowers/specs/2026-08-28-team-icons-design.md](../specs/2026-08-28-team-icons-design.md)

## Global Constraints

- Tenancy: `requireAuth` → `requireOrgMember` → `req.org.id` — never authorize from URL alone
- Envelope: `{ success, message, data, error }` via `sendSuccess` / `sendError`
- Path aliases `@/` in API and web
- Constants in `*.constant.ts` (domain `team`); mirror API and web keys/values (`TEAM_ICON_MAX = 32`)
- Web HTTP only in `apps/web/services/*.service.ts` named `*Api`; UI uses TanStack Query
- Empty `icon` is `''`; UI falls back to first character of `key`
- Any org member may patch icon (same as name/key today)
- Do not commit unless the user explicitly asks
- Do not implement steps 14–17 or leftover Circle team-icon surfaces

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/src/constants/team.constant.ts` | `TEAM_ICON_MAX` |
| `apps/api/src/constants/team.constant.test.ts` | Assert max |
| `apps/api/prisma/schema.prisma` | `Team.icon` |
| `apps/api/prisma/migrations/20260828190000_add_team_icon/migration.sql` | `ALTER TABLE` |
| `apps/api/src/utils/teams.ts` | `teamSelect` + `publicTeam` include `icon` |
| `apps/api/src/routes/teams.ts` | Optional `icon` on create/patch; select `icon` |
| `apps/api/src/routes/teams.tenant.test.ts` | Icon CRUD + tenant + max length |
| `apps/api/src/utils/projects.ts` | Nested team select includes `icon` |
| `apps/api/src/routes/issues/issues.ts` | Nested team select includes `icon` |
| `apps/api/src/openapi/resources.ts` | `publicTeamSchema.icon` |
| `apps/api/prisma/seed.ts` | Distinct emoji per seeded team |
| `apps/web/constants/team.constant.ts` | Mirrored `TEAM_ICON_MAX` |
| `apps/web/services/teams.service.ts` | `icon` on types + create/patch input |
| `apps/web/components/common/emoji-picker.tsx` | Shared picker (move from comments) |
| `apps/web/components/common/issues/details/comment-emoji-picker.tsx` | Re-export `EmojiPicker` as `CommentEmojiPicker` |
| `apps/web/components/common/teams/team-icon.tsx` | Letter fallback |
| `apps/web/components/common/teams/team-icon-picker.tsx` | Popover picker + clear |
| `apps/web/components/layout/sidebar/nav-teams.tsx` | `TeamIcon` |
| `apps/web/components/common/teams/teams.tsx` | Pass API `icon` |
| `apps/web/components/common/settings/team-settings.tsx` | Picker → `usePatchTeam` |
| `apps/web/components/common/settings/new-team.tsx` | Optional picker on create |
| `apps/web/components/layout/headers/team/header-nav.tsx` | API `useTeam` + `TeamIcon` |
| `apps/web/components/layout/headers/cycle/header-nav.tsx` | `TeamIcon` |
| `apps/web/components/layout/headers/cycles/header-nav.tsx` | `TeamIcon` |

---

### Task 1: Constants + schema + migration

**Files:**
- Modify: `apps/api/src/constants/team.constant.ts`
- Modify: `apps/api/src/constants/team.constant.test.ts`
- Modify: `apps/web/constants/team.constant.ts`
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/20260828190000_add_team_icon/migration.sql`

**Interfaces:**
- Consumes: none
- Produces: `TEAM_ICON_MAX = 32` (API + web). Prisma `Team.icon String @default("")`

- [ ] **Step 1: Add `TEAM_ICON_MAX` on API and web**

`apps/api/src/constants/team.constant.ts` — add after `TEAM_KEY_PATTERN`:

```ts
export const TEAM_ICON_MAX = 32;
```

`apps/web/constants/team.constant.ts` — same constant next to `TEAM_KEY_PATTERN`.

- [ ] **Step 2: Extend the constant unit test**

In `apps/api/src/constants/team.constant.test.ts`, import `TEAM_ICON_MAX` and add:

```ts
test('TEAM_ICON_MAX is 32', () => {
  assert.equal(TEAM_ICON_MAX, 32);
});
```

Run: `pnpm --filter @relay/api test -- src/constants/team.constant.test.ts`

Expected: PASS

- [ ] **Step 3: Schema + migration**

On `model Team` in `apps/api/prisma/schema.prisma`, after `name`:

```prisma
  icon           String       @default("")
```

Create `apps/api/prisma/migrations/20260828190000_add_team_icon/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "teams" ADD COLUMN "icon" TEXT NOT NULL DEFAULT '';
```

Do not run `prisma migrate` against a shared DB unless this environment needs it; follow the repo’s existing migrate-on-dev pattern.

---

### Task 2: Teams API — failing tests, then implement

**Files:**
- Create: `apps/api/src/routes/teams.tenant.test.ts`
- Modify: `apps/api/src/utils/teams.ts`
- Modify: `apps/api/src/routes/teams.ts`
- Modify: `apps/api/src/utils/projects.ts`
- Modify: `apps/api/src/routes/issues/issues.ts`
- Modify: `apps/api/src/openapi/resources.ts`

**Interfaces:**
- Consumes: `TEAM_ICON_MAX`
- Produces: `publicTeam({ id, key, name, icon })` → `{ id, key, name, icon }`. Create/patch body optional `icon` (trimmed, max 32). Nested project/issue `team` includes `icon`.

- [ ] **Step 1: Write the failing tenant / icon tests**

Create `apps/api/src/routes/teams.tenant.test.ts` (same harness as `labels.tenant.test.ts`):

```ts
import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { API_PREFIX, ErrorCode, HttpStatus } from '@/constants/http.js';
import { DEFAULT_TEAM_KEY } from '@/constants/issue.js';
import { TEAM_ICON_MAX } from '@/constants/team.constant.js';
import { canRun, close, type Envelope, listen, register } from '@/test/http.js';

type PublicTeam = {
  id: string;
  key: string;
  name: string;
  icon: string;
};

test(
  'team icons persist; empty by default; tenant scoped',
  { skip: !canRun },
  async () => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const emailA = `ticon-a-${suffix}@relay.test`;
    const emailB = `ticon-b-${suffix}@relay.test`;
    const slugA = `ticon-a-${suffix}`;
    const slugB = `ticon-b-${suffix}`;
    const password = 'password1';
    const { server, origin } = await listen();
    const teamsUrl = (slug: string) => `${origin}${API_PREFIX}/orgs/${slug}/teams`;

    try {
      const userA = await register(origin, {
        name: 'User A',
        email: emailA,
        password,
      });
      const userB = await register(origin, {
        name: 'User B',
        email: emailB,
        password,
      });

      const orgARes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Org A', slug: slugA }),
      });
      const orgABody = (await orgARes.json()) as Envelope<{
        team: PublicTeam;
      }>;
      assert.equal(orgARes.status, HttpStatus.CREATED, JSON.stringify(orgABody));
      assert.equal(orgABody.data!.team.icon, '');

      const orgBRes = await fetch(`${origin}${API_PREFIX}/orgs`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userB.cookies },
        body: JSON.stringify({ name: 'Org B', slug: slugB }),
      });
      assert.equal(orgBRes.status, HttpStatus.CREATED, await orgBRes.text());

      const unauth = await fetch(teamsUrl(slugA));
      assert.equal(unauth.status, HttpStatus.UNAUTHORIZED);

      const crossOrg = await fetch(teamsUrl(slugA), {
        headers: { cookie: userB.cookies },
      });
      const crossOrgBody = (await crossOrg.json()) as Envelope<unknown>;
      assert.equal(crossOrg.status, HttpStatus.FORBIDDEN);
      assert.equal(crossOrgBody.error?.code, ErrorCode.FORBIDDEN);

      const listRes = await fetch(teamsUrl(slugA), {
        headers: { cookie: userA.cookies },
      });
      const listed = (await listRes.json()) as Envelope<{ teams: PublicTeam[] }>;
      assert.equal(listRes.status, HttpStatus.OK, JSON.stringify(listed));
      const core = listed.data!.teams.find((team) => team.key === DEFAULT_TEAM_KEY);
      assert.ok(core);
      assert.equal(core!.icon, '');

      const createRes = await fetch(teamsUrl(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Design', key: 'DES', icon: ' 🎨 ' }),
      });
      const created = (await createRes.json()) as Envelope<{ team: PublicTeam }>;
      assert.equal(createRes.status, HttpStatus.CREATED, JSON.stringify(created));
      assert.equal(created.data!.team.icon, '🎨');

      const createEmpty = await fetch(teamsUrl(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Web', key: 'WEB' }),
      });
      const emptyTeam = (await createEmpty.json()) as Envelope<{ team: PublicTeam }>;
      assert.equal(createEmpty.status, HttpStatus.CREATED, JSON.stringify(emptyTeam));
      assert.equal(emptyTeam.data!.team.icon, '');

      const tooLong = await fetch(teamsUrl(slugA), {
        method: 'POST',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ name: 'Long', key: 'LNG', icon: 'x'.repeat(TEAM_ICON_MAX + 1) }),
      });
      const tooLongBody = (await tooLong.json()) as Envelope<unknown>;
      assert.equal(tooLong.status, HttpStatus.BAD_REQUEST);
      assert.equal(tooLongBody.error?.code, ErrorCode.VALIDATION_ERROR);

      const patchRes = await fetch(`${teamsUrl(slugA)}/${DEFAULT_TEAM_KEY}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ icon: '🛠️' }),
      });
      const patched = (await patchRes.json()) as Envelope<{ team: PublicTeam }>;
      assert.equal(patchRes.status, HttpStatus.OK, JSON.stringify(patched));
      assert.equal(patched.data!.team.icon, '🛠️');

      const getRes = await fetch(`${teamsUrl(slugA)}/${DEFAULT_TEAM_KEY}`, {
        headers: { cookie: userA.cookies },
      });
      const got = (await getRes.json()) as Envelope<{ team: PublicTeam }>;
      assert.equal(getRes.status, HttpStatus.OK, JSON.stringify(got));
      assert.equal(got.data!.team.icon, '🛠️');

      const clearRes = await fetch(`${teamsUrl(slugA)}/${DEFAULT_TEAM_KEY}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userA.cookies },
        body: JSON.stringify({ icon: '' }),
      });
      const cleared = (await clearRes.json()) as Envelope<{ team: PublicTeam }>;
      assert.equal(clearRes.status, HttpStatus.OK, JSON.stringify(cleared));
      assert.equal(cleared.data!.team.icon, '');

      const crossPatch = await fetch(`${teamsUrl(slugA)}/${DEFAULT_TEAM_KEY}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', cookie: userB.cookies },
        body: JSON.stringify({ icon: '🧠' }),
      });
      assert.equal(crossPatch.status, HttpStatus.FORBIDDEN);
    } finally {
      await close(server);
    }
  },
);
```

- [ ] **Step 2: Run tests — they must fail**

Run: `pnpm --filter @relay/api test -- src/routes/teams.tenant.test.ts`

Expected: FAIL (Prisma select / `publicTeam` missing `icon`, or validation not applied). Do not edit the test to pass.

- [ ] **Step 3: `publicTeam` + selects include `icon`**

In `apps/api/src/utils/teams.ts`:

```ts
const teamSelect = { id: true, key: true, name: true, icon: true } as const;

export function publicTeam(team: { id: string; key: string; name: string; icon: string }) {
  return { id: team.id, key: team.key, name: team.name, icon: team.icon };
}
```

Keep using `teamSelect` in `findTeam`, `ensureDefaultTeam`, and `createDefaultTeam`. Do not set `icon` in `createDefaultTeam` / `ensureDefaultTeam` data — DB default `''`.

In `apps/api/src/routes/teams.ts`, import `TEAM_ICON_MAX` and change schemas:

```ts
import { TEAM_ICON_MAX, isTeamKey, normalizeTeamKey } from '@/constants/team.constant.js';

const teamIconSchema = z.string().trim().max(TEAM_ICON_MAX);

export const createTeamBodySchema = z.object({
  name: z.string().trim().min(1),
  key: z.string().trim().min(1),
  icon: teamIconSchema.optional(),
});

export const patchTeamBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  key: z.string().trim().min(1).optional(),
  icon: teamIconSchema.optional(),
});
```

List/create/update `select` must be `{ id: true, key: true, name: true, icon: true }` (or import `teamSelect` if you export it).

Create: pass `icon: parsed.data.icon ?? ''` (or omit and rely on default).

Patch: treat `icon` as a field. Replace the “no fields” guard:

```ts
const name = parsed.data.name;
const key = parsed.data.key !== undefined ? parseTeamKey(parsed.data.key) : undefined;
const icon = parsed.data.icon;
if (name === undefined && key === undefined && icon === undefined) {
  throw new ValidationError('No fields to update');
}
```

Update `data`:

```ts
data: {
  ...(name !== undefined ? { name } : {}),
  ...(key !== undefined ? { key } : {}),
  ...(icon !== undefined ? { icon } : {}),
},
```

- [ ] **Step 4: Nested team selects + OpenAPI**

`apps/api/src/utils/projects.ts` — `projectSelect.team.select` and `ProjectRow.team` add `icon: true` / `icon: string`.

`apps/api/src/routes/issues/issues.ts` — nested `team: { select: { id: true, key: true, name: true, icon: true } }` (and the local `IssueRow` team type if it lists fields).

`apps/api/src/openapi/resources.ts`:

```ts
export const publicTeamSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  icon: z.string(),
});
```

- [ ] **Step 5: Run tests — they must pass**

Run: `pnpm --filter @relay/api test -- src/routes/teams.tenant.test.ts`

Expected: PASS

Then: `pnpm --filter @relay/api test`

Expected: PASS (existing tenant tests still compile against `publicTeam`)

---

### Task 3: Seed distinct emojis

**Files:**
- Modify: `apps/api/prisma/seed.ts`

**Interfaces:**
- Consumes: `upsertTeam` / `syncTeams` `{ key, name }`
- Produces: each seeded team has a non-empty `icon`; re-seed updates existing rows

- [ ] **Step 1: Add `icon` to seed team records**

Change `PRODUCT_TEAMS` to:

```ts
const PRODUCT_TEAMS = [
  { key: 'LMS', name: 'LMS', icon: '📚' },
  { key: 'CONT', name: 'Continuum App', icon: '📱' },
  { key: 'EXG', name: 'EXG', icon: '🔌' },
  { key: 'PULSE', name: 'Pulse', icon: '💓' },
  { key: 'ATLAS', name: 'Atlas', icon: '🗺️' },
] as const;
```

Acme default team at the `syncTeams(acme.id, …)` call:

```ts
{ key: DEFAULT_TEAM_KEY, name: DEFAULT_TEAM_NAME, icon: '🛠️' },
```

- [ ] **Step 2: Persist icon on upsert**

```ts
async function upsertTeam(input: {
  organizationId: string;
  key: string;
  name: string;
  icon: string;
}) {
  return prisma.team.upsert({
    where: {
      organizationId_key: {
        organizationId: input.organizationId,
        key: input.key,
      },
    },
    update: { name: input.name, icon: input.icon },
    create: input,
  });
}

async function syncTeams(
  organizationId: string,
  teams: readonly { key: string; name: string; icon: string }[],
) {
```

Pass `icon: team.icon` into `upsertTeam`.

---

### Task 4: Web — types, TeamIcon, picker, surfaces

**Files:** listed in the file map (web rows)

**Interfaces:**
- Consumes: `TeamSummary.icon: string`; `CreateTeamInput.icon?`; `PatchTeamInput.icon?`; `TEAM_ICON_MAX`
- Produces: `TeamIcon({ icon, teamKey, className? })`; `EmojiPicker({ onSelect })`; `TeamIconPicker({ icon, teamKey, onChange, disabled? })`

- [ ] **Step 1: Service types**

`apps/web/services/teams.service.ts`:

```ts
export type TeamSummary = {
  id: string;
  key: string;
  name: string;
  icon: string;
};

export type CreateTeamInput = {
  name: string;
  key: string;
  icon?: string;
};

export type PatchTeamInput = {
  name?: string;
  key?: string;
  icon?: string;
};
```

No new HTTP functions. `usePatchTeam` / `useCreateTeam` already pass the input through.

- [ ] **Step 2: Shared `EmojiPicker`**

Create `apps/web/components/common/emoji-picker.tsx` with the current body of `comment-emoji-picker.tsx`, renamed:

```ts
export function EmojiPicker({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
```

In `comment-emoji-picker.tsx`, replace the implementation with:

```ts
export { EmojiPicker as CommentEmojiPicker } from '@/components/common/emoji-picker';
```

Keep `comment-reactions.tsx` importing `CommentEmojiPicker` unchanged.

- [ ] **Step 3: `TeamIcon`**

Create `apps/web/components/common/teams/team-icon.tsx`:

```tsx
'use client';

import { cn } from '@/lib/utils';

export function TeamIcon({
  icon,
  teamKey,
  className,
}: {
  icon: string;
  teamKey: string;
  className?: string;
}) {
  const label = icon || teamKey.slice(0, 1);

  return (
    <div
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted/50',
        className,
      )}
    >
      <span className="text-sm leading-none">{label}</span>
    </div>
  );
}
```

- [ ] **Step 4: `TeamIconPicker`**

Create `apps/web/components/common/teams/team-icon-picker.tsx`:

```tsx
'use client';

import { EmojiPicker } from '@/components/common/emoji-picker';
import { TeamIcon } from '@/components/common/teams/team-icon';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState } from 'react';

export function TeamIconPicker({
  icon,
  teamKey,
  onChange,
  disabled,
  className,
}: {
  icon: string;
  teamKey: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Change team icon"
          className="rounded-md hover:opacity-80 disabled:opacity-50"
        >
          <TeamIcon icon={icon} teamKey={teamKey} className={className} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        {open ? (
          <div>
            <EmojiPicker
              onSelect={(emoji) => {
                onChange(emoji);
                setOpen(false);
              }}
            />
            {icon ? (
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="w-full"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  Remove icon
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 5: Wire surfaces**

`nav-teams.tsx` — replace the letter `div` with:

```tsx
<TeamIcon icon={item.icon} teamKey={item.key} />
```

`teams.tsx` — stop hardcoding `icon: '🛠️'`. Pass `icon: team.icon` into the mock-shaped object (keep other mock fields as they are).

`team-settings.tsx` — drop hardcoded `icon: '🛠️'`. Use `apiTeam.icon` / `apiTeam.key`. Replace the static `<span>…{team.icon}</span>` with:

```tsx
<TeamIconPicker
  icon={apiTeam.icon}
  teamKey={apiTeam.key}
  className="size-9 text-lg"
  disabled={patchTeam.isPending}
  onChange={(icon) => {
    patchTeam.mutate({ teamId: apiTeam.id, input: { icon } });
  }}
/>
```

Import `usePatchTeam`. On error, `toast.error` with `ApiError` message (same pattern as `new-team.tsx`).

`new-team.tsx` — add `const [icon, setIcon] = useState('')`. Render `TeamIconPicker` left of the name input (`teamKey` can be `teamKey || 'TE'` so the letter fallback has two chars to slice). Pass `icon: icon || undefined` into `createTeam.mutateAsync`.

`headers/team/header-nav.tsx` — stop using `mock-data/teams`. Use `useTeam(orgId, teamId)` like cycle headers:

```tsx
const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
const { data: team } = useTeam(orgId, teamId);
// …
<TeamIcon icon={team?.icon ?? ''} teamKey={team?.key ?? teamId} className="size-5 text-xs" />
<span className="text-sm font-medium truncate">{team?.name ?? teamId}</span>
```

`headers/cycle/header-nav.tsx` and `headers/cycles/header-nav.tsx` — replace `{team?.key.slice(0, 1) ?? '•'}` with `TeamIcon`.

Do not change `nav-teams-settings.tsx`, initiatives, documents, or other mock leftover screens.

---

### Task 5: Verify

- [ ] **Step 1: API tests**

Run: `pnpm --filter @relay/api test`

Expected: PASS, including `teams.tenant.test.ts`

- [ ] **Step 2: Browser**

If seed has not been re-run since Task 3, run the repo’s usual seed command so existing teams get emojis.

1. Sidebar **Your teams** shows seeded emojis, not only letters.
2. Open a team with empty icon (or Remove icon) — letter fallback appears.
3. Settings → that team → click icon → pick an emoji → sidebar and team header update without a full reload.
4. Remove icon → letter fallback again.
5. Create team with an optional emoji → it appears in the sidebar.
6. Comment reaction picker still opens and works (shared `EmojiPicker`).
7. Logged-out / other-org is already covered by API tests; do not add settings chrome, avatars, or step 14–17 work.

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| `teams.icon` default `''`, max 32 | 1 |
| `publicTeam` includes `icon` | 2 |
| Optional create / patch; `''` clears | 2 |
| Nested team on projects/issues | 2 |
| Tenant + too-long 400 | 2 |
| Seed distinct emojis, idempotent | 3 |
| `TeamIcon` letter fallback | 4 |
| Shared emoji picker; comments reuse | 4 |
| Settings picker PATCH; create optional | 4 |
| Sidebar, list, headers | 4 |
| Browser verify | 5 |
| Out: avatars, step 15, leftover Circle | skipped |
