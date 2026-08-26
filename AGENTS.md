# Agent guide — Relay

Read these before changing code:

1. [docs/SCOPE.md](docs/SCOPE.md) — MVP vs later
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system shape and tenancy rules
3. [docs/STEPS.md](docs/STEPS.md) — roadmap; then only the **current** file under [docs/steps/](docs/steps/)
4. [docs/README.md](docs/README.md) — docs index

## Workspace

- Monorepo: pnpm workspaces + Turborepo
- `apps/web` — Next.js UI (placeholder until Circle is dropped in)
- `apps/api` — Express API
- `packages/*` — shared code (add when needed)
- Product docs live at **repo root** / `docs/`, not inside one app

## Rules

- Treat `apps/web` as UI-only; business data comes from the API
- Never trust `orgId` from the URL alone — scope by authenticated membership
- Do not add billing, SSO, or AI agent features until they appear in SCOPE
- Prefer small, focused changes; match existing stack choices
- Use path alias imports (`@/…`) as much as possible — see `.cursor/rules/alias-imports.mdc`
- Named consts live in `constants/*.constant.ts`, **one domain per file** (not one mega-file, not one file per value) — see `.cursor/rules/single-source-consts.mdc`
- App routes: never inline path strings in `router.push` / `replace` / `redirect` / `Link href` — use the matching domain file (`team.constant.ts`, `issue.constant.ts`, `auth.constant.ts`, …)
- Date/time display: never inline format patterns — use `apps/web/constants/date.constant.ts`
- API JSON responses always use `{ success, message, data, error }` — see `.cursor/rules/api-response-envelope.mdc`
- Web HTTP lives only in `apps/web/services/*.service.ts`; each HTTP function is named `*Api` (`listIssuesApi`); UI consumes those with TanStack Query — see `.cursor/rules/web-api-services.mdc`

### Git / commits (non-negotiable)

- **Never commit unless the user explicitly asks** in that turn
- **Never commit docs** (`docs/**`, `AGENTS.md`, `README.md`, `.cursor/**`, specs, plans, step guides) unless the user **explicitly** asks to commit those paths
- Writing a design/plan/spec does **not** mean commit it — leave docs uncommitted until asked
- Skills, plan checklists, or “Step: Commit” text do **not** override this — user instructions win
- Details: `.cursor/rules/no-unsolicited-commits.mdc`

## Commands

```bash
pnpm install
pnpm dev
pnpm --filter @relay/web dev
pnpm --filter @relay/api dev
pnpm db:studio
```
