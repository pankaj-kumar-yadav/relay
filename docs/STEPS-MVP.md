# Implementation steps — MVP

**Status:** Done  
**Scope:** [SCOPE-MVP.md](./SCOPE-MVP.md)  
**Index:** [STEPS.md](./STEPS.md)

Shipped core: monorepo, Circle UI, auth, tenancy, issues, teams, projects, hardening.

## Roadmap

```text
1. Monorepo          ✅  (done)
2. Circle UI         ✅  (done)
3. Database          ✅  (users + key_stores; orgs/memberships in step 5)
4. Auth              ✅  (access+refresh JWT, KeyStore, web login/register + auto-refresh)
5. Multi-tenant      ✅  (orgs + memberships + requireOrgMember + invites)
6. Core screens      ✅  (shell + issues + members; API+UI)
7. Wire UI           ✅  (leftover Circle routes hidden or left mock)
8. Projects/Teams    ✅  (teams + projects CRUD; sidebar, lists, issue selectors)
9. Hardening         ✅  (seed, errors, env, smoke tests)
```

## Checklist

- [x] Step 1 — Monorepo (pnpm + Turborepo + `apps/web` + `apps/api`)
- [x] Step 2 — Circle UI in `apps/web`
- [x] Step 3 — PostgreSQL + Prisma `users` + `key_stores` (orgs/memberships deferred to step 5)
- [x] Step 4 — Auth endpoints + web login/register (dual JWT + KeyStore)
- [x] Step 5 — Organizations + memberships + tenant guard + invites
- [x] Step 6 — Core screens (login/org shell, issues list/detail, members)
- [x] Step 7 — Leftover Circle routes (hide or keep mock)
- [x] Step 8 — Projects + teams API + remaining pages
- [x] Step 9 — Hardening (seed, errors, CORS/prod notes, smoke tests)

Step files: [01](./steps/01-monorepo.md) … [09](./steps/09-hardening.md). Overview: [00-overview.md](./steps/00-overview.md).

## Next

v1: [STEPS-V1.md](./STEPS-V1.md).
