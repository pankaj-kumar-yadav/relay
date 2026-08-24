# Relay — product scope

## Goal

Multi-tenant project management for teams: issues, projects, and org membership — with a Linear-inspired UI and a custom Node backend.

## MVP (in)

- Auth (register / login / logout / me / refresh; dual JWT HttpOnly cookies + KeyStore)
- Organizations + memberships (multi-tenant)
- Roles:
  - **Super-admin** — single SaaS-owner role (platform-level; not an org membership)
  - **Org roles** — each organization can have multiple **admins** and **employee** members
- Issues CRUD (status, priority, assignee, ordering)
- Projects (basic)
- Teams (basic, if needed for Circle UI routes)
- Wire Circle UI to real API (replace mock/Zustand data)

## Out of MVP (later)

- Billing / plans
- SSO / SAML
- Real-time collaboration
- File uploads / attachments storage
- AI agent features
- Cycles, documents, burn-up charts (UI may exist; API later)
- Email polish beyond invite/reset basics

## Success criteria (v1)

- User can create an org, invite a member, and create/edit issues scoped to that org
- Data from org A is never visible to org B
- Web talks only to Express API (no production reliance on mock-data)

## Stack (locked)

- Web: Next.js + TypeScript (+ Circle / shadcn UI) + TanStack Query
- API: Node.js + Express + TypeScript
- DB: PostgreSQL

## Web API client (locked)

- Endpoint wrappers live only in `apps/web/services/<domain>.service.ts` (single source of truth)
- HTTP functions are named with an `Api` suffix (`listIssuesApi`, `createOrgApi`) — not hooks, stores, or local helpers
- UI (components, pages, hooks) calls those services via TanStack Query (`useQuery` / `useMutation`)
- Do not `fetch` / `api()` from components, pages, or Zustand stores — Zustand is UI state only

## Constants (locked)

- Reused consts/enums (`as const` objects or enums) live **only** in a `constants/` folder, in files named `*.constant.ts`
- API: `apps/api/src/constants/<domain>.constant.ts`
- Web: `apps/web/constants/<domain>.constant.ts` — frontend imports these; do not hardcode roles, statuses, or other domain codes in components, hooks, or services
- Until `packages/shared` exists, domain values used on both sides are mirrored with the same keys and values

## Agent process constraints

- Do **not** create git commits unless the human explicitly asks
- Do **not** commit documentation (`docs/**`, specs, plans, `AGENTS.md`, README, Cursor rules) unless the human explicitly asks to commit those files — drafting specs/plans is fine; committing them is not automatic
- Product scope above still governs *what* to build; this section governs *how* agents may touch git
