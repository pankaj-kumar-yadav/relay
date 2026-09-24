# Relay — v2 scope

**Status:** Done (steps 18–20)  
**Roadmap:** [STEPS-V2.md](./STEPS-V2.md)  
**Design:** [superpowers/v2/September-2026/specs/2026-09-09-v2-product-design.md](./superpowers/v2/September-2026/specs/2026-09-09-v2-product-design.md)  
**Index:** [SCOPE.md](./SCOPE.md)

## Goal

The daily-team layer on shipped v1: subscribe, inbox email, avatars, and issue files. Not Circle-complete Linear.

v1 (self-host, comments, labels, inbox, cycles, views, invite/reset SMTP, Docker) is done — [SCOPE-V1.md](./SCOPE-V1.md).

## In

- Issue subscribe (persist watchers; expand inbox recipients)
- Inbox email for the existing notification types (comment / assignee / status), including subscribers
- Profile avatars (Dicebear fallback)
- Issue file attachments
- S3-compatible storage (AWS / Backblaze via `apps/api/.env`; optional MinIO Compose profile)

## Circle frontend

v2 still uses the [Circle](https://github.com/ln-dev7/circle) UI. Wire the API into existing screens. Do not delete Circle components. Do not rewrite a Circle page from scratch. New frontend only where Circle has no component. Wired vs leftover: [CIRCLE.md](./CIRCLE.md).

## Out (v3+)

- Billing / plans
- SSO / SAML
- Real-time collaboration (WebSockets / Redis)
- AI agent features
- Code reviews, documents, initiatives
- SLAs, issue templates, integrations
- Super-admin console
- Comment-only uploads, image pipeline, virus scan
- Email digest, per-type mute
- Issue creator field / My issues Created and Activity tabs
- Burn-up chart APIs

Comment and issue **reactions** already shipped in v1-era code; they are not a v2 step.

Unused Circle/UI is still in scope to **keep**: do not delete components, screens, or nav items that are out of the current step. Comment them out or hide them.

## Success criteria

- A member can subscribe, receive matching inbox email, set an avatar, and attach a file to an issue without mock data on those screens
- Data from org A is never visible to org B
- Uploads work with `S3_*` in `apps/api/.env` (or optional Compose MinIO profile)
- Hidden Circle routes do not appear in live nav
- Web talks only to Express API on wired v2 screens
