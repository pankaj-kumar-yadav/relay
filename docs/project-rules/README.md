# Project rules

Canonical coding conventions for Relay. Cursor loads the matching `.cursor/rules/<domain>-rules.mdc` — git and shared always; web/api only when those app files are in play.

| Domain | Doc | Cursor rule | When |
|--------|-----|-------------|------|
| Git | [git-rules.md](./git-rules.md) | `.cursor/rules/git-rules.mdc` | Always |
| Shared | [shared-rules.md](./shared-rules.md) | `.cursor/rules/shared-rules.mdc` | Always |
| Web | [web-rules.md](./web-rules.md) | `.cursor/rules/web-rules.mdc` | `apps/web/**` |
| API | [api-rules.md](./api-rules.md) | `.cursor/rules/api-rules.mdc` | `apps/api/**` (folders + envelope) |

Keep the `.md` and `.mdc` bodies in sync when you change a rule.
