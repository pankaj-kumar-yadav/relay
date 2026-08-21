# Relay — architecture

## Shape

```text
Browser → apps/web (Next.js :3000)
                ↓ HTTP (credentials: include)
         apps/api (Express :4000)
                ↓ Prisma
            PostgreSQL
```

- **Monorepo**: pnpm workspaces + Turborepo at repo root
- **Web**: UI only; `NEXT_PUBLIC_API_URL` points at the API
- **API**: auth, tenancy, business logic, DB access
- **ORM**: Prisma (PostgreSQL)
- **Shared packages**: optional later (`packages/shared` for Zod/types)

## Multi-tenant rules

- Every domain row that belongs to an org includes `organization_id`
- Resolve the current user from the session/token, then verify membership for the requested org
- Never authorize solely from URL `orgId` / client-supplied tenant IDs

## Roles

- **Super-admin**: platform SaaS owner (`users.is_super_admin`)
- **Org membership roles**: `admin` | `employee` — an org may have many admins and many employees (step 5)

## Auth

- JWT in HttpOnly cookie named `jwt` (payload `{ userId }`, 30d)
- Endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- Web sends `credentials: 'include'`; CORS allows `WEB_ORIGIN` with credentials
- Passwords hashed with `bcryptjs`

## API response shape

Every JSON body from `apps/api`:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "error": null
}
```

On failure, `success` is `false`, `data` is `null`, and `error` is `{ "code", "message" }`. Helpers: `sendSuccess` / `sendError`. Web client unwraps `data`.

## Local ports

| Service | Default |
|---------|---------|
| Web     | 3000    |
| API     | 4000    |
| Postgres| 5432 (`docker compose up -d`) |

## Circle UI

`apps/web` starts as a placeholder. Replace/merge with [Circle](https://github.com/ln-dev7/circle) under `apps/web`, then swap `mock-data` / Zustand mutations for API calls.

## Implementation steps

Follow [STEPS.md](./STEPS.md) and the detailed guides in [steps/](./steps/). Do not skip auth/tenancy before wiring real issue data into the UI.
