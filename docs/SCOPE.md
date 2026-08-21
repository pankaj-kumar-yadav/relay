# Relay — product scope

## Goal

Multi-tenant project management for teams: issues, projects, and org membership — with a Linear-inspired UI and a custom Node backend.

## MVP (in)

- Auth (register / login / session or JWT)
- Organizations + memberships (multi-tenant)
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

- Web: Next.js + TypeScript (+ Circle / shadcn UI)
- API: Node.js + Express + TypeScript
- DB: PostgreSQL
