# Agent guide — Relay

Read these before changing code:

1. [docs/SCOPE.md](docs/SCOPE.md) — then [SCOPE-V1.md](docs/SCOPE-V1.md) (current) or [SCOPE-MVP.md](docs/SCOPE-MVP.md) (shipped)
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system shape and tenancy rules
3. [docs/STEPS.md](docs/STEPS.md) — then [STEPS-V1.md](docs/STEPS-V1.md); only the **current** file under [docs/steps/](docs/steps/)
4. [docs/README.md](docs/README.md) — docs index
5. [docs/project-rules/](docs/project-rules/) — coding conventions (git, shared, web, api)

## Workspace

- Monorepo: pnpm workspaces + Turborepo
- `apps/web` — Next.js UI (Circle + API wiring)
- `apps/api` — Express API
- `packages/*` — shared code (add when needed)
- Product docs live at **repo root** / `docs/`, not inside one app

## Rules

Follow [docs/project-rules/](docs/project-rules/). Cursor injects `.cursor/rules/<domain>-rules.mdc` by domain (git + shared always; web/api when those app files are in play).

- Treat `apps/web` as UI-only; business data comes from the API
- Never trust `orgId` from the URL alone — scope by authenticated membership
- Do not add billing, SSO, or AI agent features until they appear in SCOPE
- Prefer small, focused changes; match existing stack choices

### Circle UI (non-negotiable)

Frontend is [Circle](https://github.com/ln-dev7/circle) dropped into `apps/web`. We add the Express API behind that UI.

- **Do not delete** Circle components, screens, nav, or chrome — even if unused this step
- **Do not rewrite** a Circle screen from scratch. Wire API data into the existing layout
- Hide or comment out leftover chrome; leave the files in place
- Write new frontend **only** where Circle has no component for that surface
- Details: [docs/project-rules/web-rules.md](docs/project-rules/web-rules.md)

### Git / commits (non-negotiable)

- **Never commit unless the user explicitly asks** in that turn
- **Never commit docs** (`docs/**`, `AGENTS.md`, `README.md`, `.cursor/**`, specs, plans, step guides) unless the user **explicitly** asks to commit those paths
- Writing a design/plan/spec does **not** mean commit it — leave docs uncommitted until asked
- Details: [docs/project-rules/git-rules.md](docs/project-rules/git-rules.md)

## Commands

```bash
pnpm install
pnpm dev
pnpm --filter @relay/web dev
pnpm --filter @relay/api dev
pnpm db:studio
```
