# Implementation steps — Relay

Follow these steps **in order**. Do not skip tenancy/auth before wiring the UI to real data.

Full detail for each step lives under [`docs/steps/`](./steps/).

## Roadmap

```text
1. Monorepo          ✅  (done)
2. Circle UI         ✅  (done)
3. Database          →   Postgres + migrations + core tables
4. Auth              →   register / login / session
5. Multi-tenant      →   orgs, memberships, tenant middleware
6. Core API          →   issues (+ labels/statuses) CRUD
7. Wire UI           →   replace Circle mocks with API
8. Projects/Teams    →   expand domain to match UI routes
9. Hardening         →   validation, errors, seed, basic tests
```

## Rules while executing steps

1. Stay inside [SCOPE.md](./SCOPE.md) — no billing, SSO, AI, realtime in MVP.
2. Respect [ARCHITECTURE.md](./ARCHITECTURE.md) — web is UI-only; API owns auth + DB.
3. Every org-owned query must be scoped by membership, never by URL alone.
4. Prefer small PRs/commits per step; verify the step’s “Done when” before moving on.

## Quick status checklist

- [x] Step 1 — Monorepo (pnpm + Turborepo + `apps/web` + `apps/api`)
- [x] Step 2 — Circle UI in `apps/web`
- [ ] Step 3 — PostgreSQL schema + migrations
- [ ] Step 4 — Auth endpoints + web login flow
- [ ] Step 5 — Organizations + memberships + tenant guard
- [ ] Step 6 — Issues API (CRUD, filters, rank)
- [ ] Step 7 — UI wired to API (no mock dependence for MVP screens)
- [ ] Step 8 — Projects + teams API + UI wiring
- [ ] Step 9 — Hardening (seed, errors, CORS/prod notes, smoke tests)

## Suggested order of reading for a new agent

1. [SCOPE.md](./SCOPE.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. This file
4. The **current** step file under `steps/` (do not implement future steps early)
