# Step 7 — Wire Circle UI to the API

**Status:** Pending

## Goal

MVP screens load and mutate **real API data**. Mock-data/Zustand must not be the source of truth for issues (and auth/org).

## Prerequisites

- Steps 2, 4, 5, 6 done
- Circle running under `@relay/web`

## Strategy

Replace **store by store**, starting with the highest-value path:

1. Auth + current org
2. Issues list / board / create / update status
3. Issue detail (title, status, priority, assignee)
4. Leave cycles/docs/agent on mocks or hide routes until later

Circle’s own guide describes mock → API migration — follow that structure when present (`AI_GUIDE.md`).

## Suggested web layout

```text
apps/web/
  lib/api/          # fetch wrappers (credentials, base URL, errors)
  lib/mappers/      # API JSON → Circle component props
  store/            # keep UI state (filters via nuqs); remove mock CRUD
```

### API client rules

- Base URL: `process.env.NEXT_PUBLIC_API_URL`
- `credentials: 'include'` if cookie auth
- Centralize 401 → redirect to login
- Centralize 403 → “no access” UI

### Data fetching

Prefer one clear pattern for the app:

- React Query / SWR **or**
- Server components fetching API (if cookies forward cleanly)

Avoid mixing three patterns in MVP.

## Zustand migration pattern

Before (mock):

```ts
addIssue(localIssue) // mutates in-memory array
```

After:

```ts
await api.createIssue(orgId, payload)
await queryClient.invalidateQueries(['issues', orgId])
```

Keep Zustand only for ephemeral UI (sidebar open, modal open), not server entities.

## URL org segment

- Use real `org.slug` in `[orgId]`
- On load, verify membership via `GET /orgs/:slug` or issues call
- Remove hardcoded mock org id (`lndev-ui`) from redirects

## Feature flags / progressive cutover

If needed, temporary:

```env
NEXT_PUBLIC_USE_API_ISSUES=true
```

Remove flags once stable.

## Manual test plan

1. Register / login  
2. Create org (or use seeded demo)  
3. Open issues list — data from API  
4. Create issue — appears after reload  
5. Change status on board — persists  
6. Second browser/user without access — cannot see org  

## Done when

- [ ] Issues list + create + status/priority/assignee updates hit the API
- [ ] Hard refresh shows the same data
- [ ] Mock issues path unused for those screens
- [ ] Login required for app shell (or org routes)

## Out of scope

- Perfect parity with every Circle mock page
- Cycles, documents, agent chat

## Next

[08-projects-teams.md](./08-projects-teams.md)
