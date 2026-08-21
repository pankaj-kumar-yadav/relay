# Relay — architecture

## Shape

```text
Browser → apps/web (Next.js :3000)
                ↓ HTTP
         apps/api (Express :4000)
                ↓
            PostgreSQL
```

- **Monorepo**: pnpm workspaces + Turborepo at repo root
- **Web**: UI only; `NEXT_PUBLIC_API_URL` points at the API
- **API**: auth, tenancy, business logic, DB access
- **Shared packages**: optional later (`packages/shared` for Zod/types)

## Multi-tenant rules

- Every domain row that belongs to an org includes `organization_id`
- Resolve the current user from the session/token, then verify membership for the requested org
- Never authorize solely from URL `orgId` / client-supplied tenant IDs

## Auth (planned)

- Implemented on the API
- Web stores session cookie or token and sends it on API requests
- CORS: API allows the web origin with credentials when using cookies

## Local ports

| Service | Default |
|---------|---------|
| Web     | 3000    |
| API     | 4000    |

## Circle UI

`apps/web` starts as a placeholder. Replace/merge with [Circle](https://github.com/ln-dev7/circle) under `apps/web`, then swap `mock-data` / Zustand mutations for API calls.

## Implementation steps

Follow [STEPS.md](./STEPS.md) and the detailed guides in [steps/](./steps/). Do not skip auth/tenancy before wiring real issue data into the UI.
