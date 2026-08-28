# Relay — MVP scope

**Status:** Shipped (steps 1–9)  
**Roadmap:** [STEPS-MVP.md](./STEPS-MVP.md)  
**Index:** [SCOPE.md](./SCOPE.md)

## Goal

A demoable multi-tenant core: auth, orgs, invites, issues, teams, and projects — Circle UI talking to the Express API.

## In

- Auth (register / login / logout / session / refresh; dual JWT HttpOnly cookies + KeyStore)
- Organizations + memberships (multi-tenant)
- Roles:
  - **Super-admin** — platform flag (`users.is_super_admin`); no console
  - **Org roles** — `admin` | `employee`
- Issues CRUD (status, priority, assignee, ordering)
- Projects (basic)
- Teams (basic)
- Invites (copy-link / server log; email is v1)
- Core Circle screens wired to the API (issues, members, teams, projects)

Circle is the frontend ([ln-dev7/circle](https://github.com/ln-dev7/circle)): do not delete its UI; do not rewrite screens that already exist; write new UI only where Circle has none.

## Out (deferred to v1 or later)

At MVP time these were out. **v1 takes some of them** (comments, labels, inbox, cycles, views, SMTP, Docker) — see [SCOPE-V1.md](./SCOPE-V1.md). Still later than v1: billing, SSO, realtime, uploads, AI, reviews, documents.

Unused Circle UI stays in the repo: hide or comment out; do not delete.

## Success criteria

- User can create an org, invite a member, and create/edit issues scoped to that org
- Data from org A is never visible to org B
- Wired screens talk only to the Express API (no production reliance on mock-data)

## Next

v1: [SCOPE-V1.md](./SCOPE-V1.md) / [STEPS-V1.md](./STEPS-V1.md).
