# Relay — product scope

Multi-tenant project management for teams. Linear-inspired UI, custom Node API.

Scope is split by release so MVP (shipped) and v1 (in progress) stay readable:

| Release | File | Status |
|---------|------|--------|
| MVP | [SCOPE-MVP.md](./SCOPE-MVP.md) | Shipped (steps 1–9) |
| v1 | [SCOPE-V1.md](./SCOPE-V1.md) | In progress (steps 10–17) |

Roadmaps: [STEPS.md](./STEPS.md) → [STEPS-MVP.md](./STEPS-MVP.md) / [STEPS-V1.md](./STEPS-V1.md).

## Stack (locked)

- Web: Next.js + TypeScript (+ Circle / shadcn UI) + TanStack Query
- API: Node.js + Express + TypeScript
- DB: PostgreSQL
- Email (v1): nodemailer SMTP (optional in development; log the link if unset)

## Web API client (locked)

- Endpoint wrappers live only in `apps/web/services/<domain>.service.ts`
- HTTP functions are named with an `Api` suffix (`listIssuesApi`, `createOrgApi`)
- UI calls those services via TanStack Query (`useQuery` / `useMutation`)
- Do not `fetch` / `api()` from components, pages, or Zustand stores — Zustand is UI state only

## Constants (locked)

- Reused consts live only in `constants/*.constant.ts`, **one domain per file**
- API: `apps/api/src/constants/<domain>.constant.ts`
- Web: `apps/web/constants/<domain>.constant.ts`
- Path builders live in the matching domain. Date/time display lives in `date.constant.ts`
- Until `packages/shared` exists, values used on both sides are mirrored with the same keys and values

## Agent process constraints

- Do **not** create git commits unless the human explicitly asks
- Do **not** commit documentation unless the human explicitly asks to commit those paths
- Do **not** delete unused UI components — comment out or hide them; see [project-rules/web-rules.md](./project-rules/web-rules.md)
