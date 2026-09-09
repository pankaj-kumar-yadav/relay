# Relay docs

Canonical documentation for humans and agents. Read in this order when starting work.

| Doc | Purpose |
|-----|---------|
| [SCOPE.md](./SCOPE.md) | Scope index + locked stack / conventions |
| [SCOPE-MVP.md](./SCOPE-MVP.md) | MVP in/out (shipped) |
| [SCOPE-V1.md](./SCOPE-V1.md) | v1 in/out (shipped) |
| [SCOPE-V2.md](./SCOPE-V2.md) | v2 in/out (current) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System shape, tenancy, auth, ports |
| [CIRCLE.md](./CIRCLE.md) | Wired vs leftover Circle UI |
| [STEPS.md](./STEPS.md) | Steps index + current phase |
| [STEPS-MVP.md](./STEPS-MVP.md) | MVP roadmap (steps 1–9, done) |
| [STEPS-V1.md](./STEPS-V1.md) | v1 roadmap (steps 10–17, done) |
| [STEPS-V2.md](./STEPS-V2.md) | v2 roadmap (steps 18–20) |
| [steps/](./steps/) | Per-step instructions ([MVP](./steps/mvp/), [v1](./steps/v1/), [v2](./steps/v2/)) |
| [project-rules/](./project-rules/) | Coding conventions (git, shared, web, api) |
| [../AGENTS.md](../AGENTS.md) | Agent entrypoint and commands |
| [superpowers/](./superpowers/) | Specs and plans ([MVP](./superpowers/mvp/), [v1](./superpowers/v1/), [v2](./superpowers/v2/)) |

## Step files

### MVP (done)

| Step | File | Status |
|------|------|--------|
| 0 | [00-overview.md](./steps/mvp/00-overview.md) | Reference |
| 1 | [01-monorepo.md](./steps/mvp/01-monorepo.md) | Done |
| 2 | [02-circle-ui.md](./steps/mvp/02-circle-ui.md) | Done |
| 3 | [03-database.md](./steps/mvp/03-database.md) | Done (users; KeyStore via step 4) |
| 4 | [04-auth.md](./steps/mvp/04-auth.md) | Done |
| 5 | [05-multi-tenant.md](./steps/mvp/05-multi-tenant.md) | Done |
| 6 | [06-core-api.md](./steps/mvp/06-core-api.md) | Done |
| 7 | [07-wire-ui.md](./steps/mvp/07-wire-ui.md) | Done |
| 8 | [08-projects-teams.md](./steps/mvp/08-projects-teams.md) | Done |
| 9 | [09-hardening.md](./steps/mvp/09-hardening.md) | Done |

### v1

| Step | File | Status |
|------|------|--------|
| 10 | [10-comments-activity.md](./steps/v1/10-comments-activity.md) | Done |
| 11 | [11-labels.md](./steps/v1/11-labels.md) | Done |
| 12 | [12-inbox.md](./steps/v1/12-inbox.md) | Done |
| 12a | [12a-api-docs.md](./steps/v1/12a-api-docs.md) | Done |
| 13 | [13-cycles.md](./steps/v1/13-cycles.md) | Done |
| 14 | [14-saved-views.md](./steps/v1/14-saved-views.md) | Done |
| 15 | [15-settings-chrome.md](./steps/v1/15-settings-chrome.md) | Done |
| 16 | [16-email-auth.md](./steps/v1/16-email-auth.md) | Done |
| 17 | [17-self-host.md](./steps/v1/17-self-host.md) | Done |

### v2

| Step | File | Status |
|------|------|--------|
| 18 | [18-subscribe.md](./steps/v2/18-subscribe.md) | Done |
| 19 | [19-inbox-email.md](./steps/v2/19-inbox-email.md) | Done |
| 20 | [20-uploads.md](./steps/v2/20-uploads.md) | Done |

## v1 design

- [v1 product](./superpowers/v1/August-2026/specs/2026-08-27-v1-product-design.md)
- [Comments + activity (step 10)](./superpowers/v1/August-2026/specs/2026-08-27-issue-comments-activity-design.md)
- [Issue labels (step 11)](./superpowers/v1/August-2026/specs/2026-08-27-issue-labels-design.md)
- [Self-host pack (step 17)](./superpowers/v1/September-2026/specs/2026-09-08-self-host-design.md)

## v2 design

- [v2 product](./superpowers/v2/September-2026/specs/2026-09-09-v2-product-design.md)
- [Issue subscribe (step 18)](./superpowers/v2/September-2026/specs/2026-09-09-issue-subscribe-design.md)
- [Inbox email (step 19)](./superpowers/v2/September-2026/specs/2026-09-09-inbox-email-design.md)
- [Avatars + issue files (step 20)](./superpowers/v2/September-2026/specs/2026-09-09-uploads-design.md)
