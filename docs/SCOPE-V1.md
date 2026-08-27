# Relay — v1 scope

**Status:** In progress (steps 10–17; current: inbox)  
**Roadmap:** [STEPS-V1.md](./STEPS-V1.md)  
**Design:** [superpowers/specs/2026-08-27-v1-product-design.md](./superpowers/specs/2026-08-27-v1-product-design.md)  
**Index:** [SCOPE.md](./SCOPE.md)

## Goal

The first product a real team can self-host: Linear-lite on top of the shipped MVP. Not Circle-complete Linear.

MVP (auth, orgs, issues, teams, projects) is already done — [SCOPE-MVP.md](./SCOPE-MVP.md).

## In

- Issue comments + activity
- Org issue labels
- Inbox (in-app notifications; polling)
- Cycles (per-team timeboxes)
- Saved views
- Settings that persist: profile name, members (role/remove), teams, password change
- SMTP email: invites + password reset
- Docker Compose for web + API + Postgres
- Hide leftover Circle chrome (keep files; do not delete)

## Out (v2+)

- Billing / plans
- SSO / SAML
- Real-time collaboration (WebSockets / Redis)
- File uploads / attachments / avatars
- AI agent features
- Code reviews, documents, initiatives
- SLAs, issue templates, integrations
- Super-admin console
- Email for every inbox notification
- Comment reactions, issue subscribe, burn-up chart APIs

Unused Circle/UI is still in scope to **keep**: do not delete components, screens, or nav items that are out of the current step. Comment them out or hide them.

## Success criteria

- A team can self-host, invite via email, and run issues → comments → labels → cycles → inbox → saved views without mock data on those screens
- Data from org A is never visible to org B
- Hidden Circle routes do not appear in live nav
- Web talks only to Express API on wired v1 screens
