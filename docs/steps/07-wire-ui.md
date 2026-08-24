# Step 7 — Leftover Circle routes

**Status:** Pending

## Goal

After [step 6](./06-core-api.md), MVP screens (login, org shell, issues, members) already talk to the API. This step cleans **remaining Circle pages**: hide out-of-MVP nav, or leave them on mocks without breaking the wired path.

## Prerequisites

- Steps 2, 4, 5, 6 done (step 6 includes API **and** UI for Must-complete screens)
- Circle running under `@relay/web`

## Strategy

Do **not** re-wire issues/auth/org — that is step 6.

1. Confirm step 6 screens still hit the API after a hard refresh
2. Hide or disable nav for Out of MVP routes (cycles, documents, agent, initiatives)
3. Inbox / reviews / views: hide or keep mock; do not block MVP
4. Settings: keep a working back-to-app + org slug in URLs; leave the rest mock

Circle’s own guide describes mock → API migration — follow that structure when present (`AI_GUIDE.md`). HTTP lives in `apps/web/services/*.service.ts` as `*Api` functions; transport is `apps/web/lib/api` (credentials, 401 → refresh). UI consumes services via TanStack Query.

## Work

- Sweep remaining hardcoded `lndev-ui` links in nav/settings
- Hide Out of MVP sidebar items (cycles, documents, agent, initiatives)
- Inbox / reviews / views: hide or leave mock; do not reintroduce mock issues on step 6 routes
- Settings: slug-aware back-to-app; rest can stay mock

## Done when

- [ ] Step 6 screens still hit the API after a hard refresh
- [ ] Out of MVP nav items hidden or clearly inert
- [ ] No remaining `lndev-ui` in live nav links

## Out of scope

- Perfect parity with every Circle mock page
- Cycles, documents, agent chat
- Full teams/projects CRUD (step 8)

## Next

[08-projects-teams.md](./08-projects-teams.md)
