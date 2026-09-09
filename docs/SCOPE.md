# Relay — product scope

Multi-tenant project management for teams. Linear-inspired UI, custom Node API.

Scope is split by release so MVP, v1, and v2 stay readable:

| Release | File | Status |
|---------|------|--------|
| MVP | [SCOPE-MVP.md](./SCOPE-MVP.md) | Shipped (steps 1–9) |
| v1 | [SCOPE-V1.md](./SCOPE-V1.md) | Shipped (steps 10–17) |
| v2 | [SCOPE-V2.md](./SCOPE-V2.md) | Shipped (steps 18–20) |

Roadmaps: [STEPS.md](./STEPS.md) → [STEPS-MVP.md](./STEPS-MVP.md) / [STEPS-V1.md](./STEPS-V1.md) / [STEPS-V2.md](./STEPS-V2.md).

## Stack (locked)

- Web: Next.js + TypeScript (+ Circle / shadcn UI) + TanStack Query
- API: Node.js + Express + TypeScript
- DB: PostgreSQL
- Email (v1+): nodemailer SMTP (optional in development; log the link if unset)
- Files (v2): S3-compatible object store (MinIO in Compose; AWS or Backblaze via env)

## Web API client (locked)

- Endpoint wrappers live only in `apps/web/services/<domain>.service.ts`
- HTTP functions are named with an `Api` suffix (`listIssuesApi`, `createOrgApi`)
- UI calls those services via TanStack Query (`useQuery` / `useMutation`)
- Do not `fetch` / `api()` from components, pages, or Zustand stores — Zustand is UI state only

## Circle frontend (locked)

`apps/web` is the [Circle](https://github.com/ln-dev7/circle) UI. Relay adds the Express API behind it — it is not a new frontend.

- **Do not delete** Circle components, screens, nav items, or chrome
- **Do not replace** Circle layouts with a custom rewrite
- Hide or comment out unused pieces; leave the files in place
- Write new UI **only** where Circle has no component for that surface
- Detail: [project-rules/web-rules.md](./project-rules/web-rules.md)

## Constants (locked)

- Reused consts live only in `constants/*.constant.ts`, **one domain per file**
- Shared: `packages/shared/src/constants/<domain>.constant.ts` (group by kind — later `types/`, `components/`)
- API / web `constants/` files only for app-only extras; import shared values from `@relay/shared/constants/<domain>.constant`
- Path builders live in the matching domain. Date/time display lives in `date.constant.ts`

## API tests (locked)

- Runner: Node `node:test` + `node:assert/strict` — no Vitest, Jest, or Supertest
- HTTP tests share `apps/api/src/test/http.ts` (`listen`, `close`, `cookieHeader`, `register`, `canRun`)
- Import from `@/test/http.js`. Do not copy those helpers into each test file
- Detail: [project-rules/api-rules.md](./project-rules/api-rules.md)

## Agent process constraints

- Do **not** create git commits unless the human explicitly asks
- Do **not** commit documentation unless the human explicitly asks to commit those paths
- Do **not** delete unused UI components — comment out or hide them; see [project-rules/web-rules.md](./project-rules/web-rules.md)
