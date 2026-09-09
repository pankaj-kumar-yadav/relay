# Step 2 — Drop Circle UI into `apps/web`

**Status:** Done

## Goal

Replace the Next placeholder with the [Circle](https://github.com/ln-dev7/circle) UI starter so Relay has a Linear-like front-end shell.

## Prerequisites

- Step 1 complete
- pnpm available
- Circle is MIT-licensed — keep license attribution

## Approach (recommended)

Do **not** replace the whole monorepo. Only replace contents of `apps/web`.

### Option A — Fresh clone into web (cleanest)

1. Backup current placeholder if you care about it (optional):

   ```bash
   mv apps/web apps/web-placeholder
   ```

2. Clone Circle into `apps/web`:

   ```bash
   git clone --depth 1 https://github.com/ln-dev7/circle.git apps/web
   rm -rf apps/web/.git
   ```

3. Fix package identity for the workspace:

   - Set `"name": "@relay/web"` in `apps/web/package.json`
   - Ensure scripts still include `dev`, `build`, `lint`
   - Keep Next on port **3000** (`next dev --port 3000` or root turbo default)

4. Reinstall from monorepo root:

   ```bash
   pnpm install
   ```

5. Add env:

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # ensure:
   # NEXT_PUBLIC_API_URL=http://localhost:4000
   ```

   If Circle has no `.env.example`, create `.env.local` with `NEXT_PUBLIC_API_URL`.

6. Run:

   ```bash
   pnpm --filter @relay/web dev
   ```

### Option B — Copy selected folders

If clone conflicts with workspace files, copy from Circle:

- `app/`, `components/`, `hooks/`, `lib/`, `mock-data/`, `store/`, `public/`
- Circle configs: `components.json`, Tailwind/PostCSS, `tsconfig` paths

Then merge carefully with Relay’s `@relay/web` `package.json` (name + workspace scripts).

## Keep / do not delete (Relay root)

Never move these into `apps/web`:

- Root `docs/`, `AGENTS.md`, `turbo.json`, `pnpm-workspace.yaml`
- `apps/api`

## After import — inventory (do not wire API yet)

Document or note for later steps:

| Circle area | Path | Later action |
|-------------|------|--------------|
| Mock data | `mock-data/` | Replace with API responses |
| Zustand stores | `store/` | Call API instead of in-memory CRUD |
| Org URL segment | `app/[orgId]/` | Map to real org slug/id |
| Issues board | issues components + DnD | Persist status/rank via API |

Read Circle’s `AI_GUIDE.md` / `llms.txt` inside `apps/web` if present — it explains mock → API migration.

## Indentation / tooling note

Circle often uses Prettier with **3-space** indent. Relay root Prettier may differ. Prefer:

- Format `apps/web` with Circle’s local Prettier config, **or**
- Gradually normalize to root Prettier in a dedicated cleanup PR (not during import)

## Done when

- [x] `pnpm --filter @relay/web dev` shows Circle UI
- [x] `pnpm --filter @relay/web build` succeeds
- [x] Package name is `@relay/web`
- [x] `NEXT_PUBLIC_API_URL` exists (even if unused yet)
- [x] Mock data still powers the UI (expected at this step)

## Out of scope for this step

- Auth screens wired to API
- Removing Zustand mocks
- Database

## Next

[03-database.md](./03-database.md)
