# Relay docs

Canonical documentation for humans and agents. Read in this order when starting work.

| Doc | Purpose |
|-----|---------|
| [SCOPE.md](./SCOPE.md) | MVP in/out, success criteria, locked stack |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System shape, tenancy, auth, ports |
| [STEPS.md](./STEPS.md) | End-to-end implementation roadmap |
| [steps/](./steps/) | Detailed instructions for each step |
| [project-rules/](./project-rules/) | Coding conventions (git, shared, web, api) |
| [../AGENTS.md](../AGENTS.md) | Agent entrypoint and commands |
| [superpowers/specs/](./superpowers/specs/) | Design specs (auth KeyStore; orgs/memberships) |

## Step files

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
