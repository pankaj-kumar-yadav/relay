# Issue subscribe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist issue subscriptions, fan out comment/status inbox rows to assignee ∪ subscribers, and wire existing Circle subscribe UI.

**Architecture:** Join table `issue_subscriptions`. Upsert in the same mutation as create/assign/comment. `notifyWatchers` unions extra recipient (assignee) with subscriber user ids, then `notifyIfRecipient`. Assignee-change notifications stay new-assignee-only.

**Tech Stack:** Prisma/PostgreSQL, Express `/api/v1`, Node `node:test`, Next.js Circle UI, TanStack Query, `@relay/shared` constants.

## Global Constraints

- Path aliases `@/` (API `src/*`, web app root). No deep relatives.
- Envelope `{ success, message, data, error }`. Named `ErrorCode`.
- `NODE_ENV` is only `development` or `production`. Tests use `node:test` + `@/test/http.js`.
- Do not delete Circle files or edit `apps/web/mock-data/**`.
- Constants for subscribe live in `packages/shared/src/constants/subscribe.constant.ts`.
- Do not git commit unless the human asks.

---

### Task 1: HTTP tests (fail first)

**Files:**
- Create: `apps/api/src/routes/issues/issues.subscription.test.ts`

**Interfaces:**
- Consumes: `listen`, `close`, `register`, `canRun`, `API_PREFIX`
- Produces: coverage for auto-subscribe, PUT toggle, `subscribed=me`, comment/status fan-out, assignee-type not fanned out, tenant isolation

- [ ] **Step 1: Write the failing integration test** covering the cases in the slice spec.
- [ ] **Step 2: Run** `pnpm --filter @relay/api test src/routes/issues/issues.subscription.test.ts` — expect FAIL (404 / missing field).
- [ ] **Step 3: Schema + helpers + routes** until the test PASSES (Task 2–3).
- [ ] **Step 4: OpenAPI path + `DOCUMENTED_PATHS`**.
- [ ] **Step 5: Web services, mapper, context menu, activity Subscribe, My issues Subscribed tab.**
- [ ] **Step 6: Mark step 18 done in thin step / STEPS-V2 (docs only).**

No commit steps (repo git-rules).
