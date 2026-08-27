# Shared — aliases, consts, NODE_ENV

Applies to `apps/web` and `apps/api`.

## Alias imports

**Default to path aliases.** Prefer `@/…` over relative `../` for anything outside the same folder.

| App | Alias | Maps to |
|-----|--------|---------|
| `apps/web` | `@/*` | app root (`./*`) |
| `apps/api` | `@/*` | `src/*` |

```ts
// ❌ BAD
import { Button } from '../../../components/ui/button';
import { prisma } from '../../db.js';

// ✅ GOOD
import { Button } from '@/components/ui/button';
import { prisma } from '@/db.js';
```

- New files and edits: use `@/` unless an exception below applies
- When touching a file with deep relatives, switch those imports to aliases
- Do not invent aliases that are missing from `tsconfig` / package config — add the path first

**Exceptions (only):** same-directory (`./tokens.js`), package names (`express`, `zod`, `@prisma/client`), one-level sibling only when tightly colocated — prefer `@/` when unsure.

## Consts by domain

Reusable strings, numbers, roles, statuses, codes, **app paths**, and **date/time formats** belong in `constants/*.constant.ts`. Split by **domain**, not one kitchen-sink file and not one file per value.

| App | Folder | File name |
|-----|--------|-----------|
| API | `apps/api/src/constants/` | `<domain>.constant.ts` |
| Web | `apps/web/constants/` | `<domain>.constant.ts` |

- **One domain per file**: `org`, `team`, `project`, `issue`, `auth`, `http`, `date`, `workspace`, `brand`, `seed`
- Path builders live **in that domain** (`teamHomePath` in `team.constant.ts`, not a catch-all `route.constant.ts`)
- Cross-cutting display formats live in `date.constant.ts`
- Circle leftovers (inbox, reviews, initiatives, views) share `workspace.constant.ts` until they are first-class domains

```ts
// ✅ GOOD — domain file
import { teamHomePath } from '@/constants/team.constant';
router.push(teamHomePath(orgSlug, teamKey));
```

```ts
// ❌ BAD — one mega constants / routes file
import { teamHomePath, DateFormat, OrgRole } from '@/constants/route.constant';
```

Do not inline roles, path strings (`router.push` / `replace` / `redirect` / `Link href`), or date-fns patterns. Do not invent a file per screen. `new Date()` for timestamps/sorting is fine. One-off UI copy stays inline.

Until `packages/shared` exists, values used on both sides are mirrored with the **same keys and values**. New files use `*.constant.ts`; rename older API files (`org.ts`) when you next touch them.

## NODE_ENV

`NODE_ENV` is **only** `development` or `production`. Never `test`, `staging`, or unset-as-a-third-mode.

- Local/dev and unit/integration tests run as `development`
- Production runtime and production builds use `production`
- Branch on `NodeEnv` from `constants/env.constant.ts` (`apps/api` and `apps/web`)
- Detect the Node test runner with `process.env.NODE_TEST_CONTEXT` if tests must skip rate limits — do **not** invent `NODE_ENV=test`

```ts
// ❌ BAD
process.env.NODE_ENV === 'test'
process.env.NODE_ENV = 'test'
```
