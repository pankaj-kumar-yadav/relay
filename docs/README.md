# Relay docs

Canonical documentation for humans and agents. Read in this order when starting work.

| Doc | Purpose |
|-----|---------|
| [SCOPE.md](./SCOPE.md) | Scope index + locked stack / conventions |
| [SCOPE-MVP.md](./SCOPE-MVP.md) | MVP in/out (shipped) |
| [SCOPE-V1.md](./SCOPE-V1.md) | v1 in/out (current) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System shape, tenancy, auth, ports |
| [STEPS.md](./STEPS.md) | Steps index + current phase |
| [STEPS-MVP.md](./STEPS-MVP.md) | MVP roadmap (steps 1–9, done) |
| [STEPS-V1.md](./STEPS-V1.md) | v1 roadmap (steps 10–17) |
| [steps/](./steps/) | Per-step instructions |
| [project-rules/](./project-rules/) | Coding conventions (git, shared, web, api) |
| [../AGENTS.md](../AGENTS.md) | Agent entrypoint and commands |
| [superpowers/specs/](./superpowers/specs/) | Design specs |

## Step files

### MVP (done)

| Step | File | Status |
|------|------|--------|
| 0 | [00-overview.md](./steps/00-overview.md) | Reference |
| 1 | [01-monorepo.md](./steps/01-monorepo.md) | Done |
| 2 | [02-circle-ui.md](./steps/02-circle-ui.md) | Done |
| 3 | [03-database.md](./steps/03-database.md) | Done (users; KeyStore via step 4) |
| 4 | [04-auth.md](./steps/04-auth.md) | Done |
| 5 | [05-multi-tenant.md](./steps/05-multi-tenant.md) | Done |
| 6 | [06-core-api.md](./steps/06-core-api.md) | Done |
| 7 | [07-wire-ui.md](./steps/07-wire-ui.md) | Done |
| 8 | [08-projects-teams.md](./steps/08-projects-teams.md) | Done |
| 9 | [09-hardening.md](./steps/09-hardening.md) | Done |

### v1

| Step | File | Status |
|------|------|--------|
| 10 | [10-comments-activity.md](./steps/10-comments-activity.md) | Done |
| 11 | [11-labels.md](./steps/11-labels.md) | Done |
| 12 | [12-inbox.md](./steps/12-inbox.md) | Done |
| 12a | [12a-api-docs.md](./steps/12a-api-docs.md) | Done |
| 13 | [13-cycles.md](./steps/13-cycles.md) | Current |
| 14 | [14-saved-views.md](./steps/14-saved-views.md) | Planned |
| 15 | [15-settings-chrome.md](./steps/15-settings-chrome.md) | Planned |
| 16 | [16-email-auth.md](./steps/16-email-auth.md) | Planned |
| 17 | [17-self-host.md](./steps/17-self-host.md) | Planned |

## v1 design

- [v1 product](./superpowers/specs/2026-08-27-v1-product-design.md)
- [Comments + activity (step 10)](./superpowers/specs/2026-08-27-issue-comments-activity-design.md)
- [Issue labels (step 11)](./superpowers/specs/2026-08-27-issue-labels-design.md)
