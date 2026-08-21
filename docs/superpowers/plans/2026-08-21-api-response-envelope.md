# API Response Envelope Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make every JSON API response use `{ success, message, data, error }`, migrate auth/health + web client, and encode the contract in agent/project docs.

**Architecture:** Shared `sendSuccess` / updated `sendError` helpers build one envelope. Routes never call `res.json` with ad-hoc bodies. Web `api()` unwraps `data` on success and throws from `error` on failure. Cursor rule + AGENTS/ARCHITECTURE/step docs keep agents aligned.

**Tech Stack:** Express 5, TypeScript, existing `ApiError` / `ErrorCode` / `HttpStatus`, Next.js fetch client

**Spec:** [docs/superpowers/specs/2026-08-21-api-response-envelope-design.md](../specs/2026-08-21-api-response-envelope-design.md)

## Global Constraints

- Envelope always has four keys: `success`, `message`, `data`, `error`
- Success: `data` is a non-null object; `error` is `null`
- Failure: `data` is `null`; `error` is `{ code: string, message: string }`
- Top-level `message` is always a string; on failure it matches `error.message`
- HTTP status codes stay meaningful; envelope does not replace status
- Use path aliases (`@/…`); shared consts for status/codes (existing `HttpStatus` / `ErrorCode`)
- Do not commit unless the user explicitly asks

---

## File map

| Path | Responsibility |
|------|----------------|
| `apps/api/src/utils/response.ts` | Types + `sendSuccess` |
| `apps/api/src/utils/errors.ts` | Update `sendError` to full envelope |
| `apps/api/src/routes/auth.ts` | Use `sendSuccess` |
| `apps/api/src/index.ts` | Health uses `sendSuccess` |
| `apps/web/lib/api.ts` | Parse envelope; return `data` |
| `apps/web/lib/auth.ts` | Logout type: drop `{ ok }` assumption |
| `.cursor/rules/api-response-envelope.mdc` | Agent rule |
| `AGENTS.md` | Point at rule |
| `docs/ARCHITECTURE.md` | Document shape |
| `docs/steps/04-auth.md` | Update convention |
| `docs/steps/09-hardening.md` | Update error section |

---

### Task 1: Envelope helpers (`sendSuccess` + `sendError`)

**Files:**
- Create: `apps/api/src/utils/response.ts`
- Modify: `apps/api/src/utils/errors.ts`

**Interfaces:**
- Produces:
  - `ApiErrorBody = { code: string; message: string }`
  - `ApiResponse<T extends object> = { success: boolean; message: string; data: T | null; error: ApiErrorBody | null }`
  - `sendSuccess<T extends object>(res, { status?, message, data }): Response`
  - `sendError(res, err): Response` (updated body shape; same call signature)

- [x] **Step 1: Create `apps/api/src/utils/response.ts`**

```ts
import type { Response } from 'express';

import { HttpStatus } from '@/constants/http.js';

export type ApiErrorBody = {
  code: string;
  message: string;
};

export type ApiResponse<T extends object = Record<string, unknown>> = {
  success: boolean;
  message: string;
  data: T | null;
  error: ApiErrorBody | null;
};

type SendSuccessOptions<T extends object> = {
  status?: number;
  message?: string;
  data: T;
};

export function sendSuccess<T extends object>(
  res: Response,
  { status = HttpStatus.OK, message = 'OK', data }: SendSuccessOptions<T>,
) {
  const body: ApiResponse<T> = {
    success: true,
    message,
    data,
    error: null,
  };
  return res.status(status).json(body);
}
```

- [x] **Step 2: Update `sendError` in `apps/api/src/utils/errors.ts`**

Replace the two `res.status(...).json(...)` bodies so they emit the full envelope. Keep imports and `ApiError` classes unchanged. Final `sendError`:

```ts
export function sendError(res: Response, err: unknown) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      data: null,
      error: { code: err.code, message: err.message },
    });
  }

  console.error(err);
  return res.status(HttpStatus.INTERNAL).json({
    success: false,
    message: 'Internal server error',
    data: null,
    error: { code: ErrorCode.INTERNAL, message: 'Internal server error' },
  });
}
```

- [x] **Step 3: Typecheck API**

Run: `pnpm --filter @relay/api lint`

Expected: exit 0 (no errors). Routes still compile; they will still emit old success shapes until Task 2.

---

### Task 2: Migrate auth routes + health

**Files:**
- Modify: `apps/api/src/routes/auth.ts`
- Modify: `apps/api/src/index.ts`

**Interfaces:**
- Consumes: `sendSuccess` from `@/utils/response.js`; existing `sendError`
- Produces: JSON bodies matching the envelope for `/auth/*` and `/health`

- [x] **Step 1: Update `apps/api/src/routes/auth.ts`**

Add import:

```ts
import { sendSuccess } from '@/utils/response.js';
```

Replace success responses:

**register** (after `generateToken`):

```ts
sendSuccess(res, {
  status: HttpStatus.CREATED,
  message: 'Registered',
  data: { user: publicUser(user) },
});
```

**login** (after `generateToken`):

```ts
sendSuccess(res, {
  message: 'Logged in',
  data: {
    user: publicUser({
      id: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
    }),
  },
});
```

**logout:**

```ts
authRouter.post('/logout', (_req, res) => {
  clearToken(res);
  sendSuccess(res, { message: 'Logged out', data: {} });
});
```

**me:**

```ts
authRouter.get('/me', requireAuth, (req, res) => {
  sendSuccess(res, { data: { user: req.user } });
});
```

Remove unused direct `res.status(...).json(...)` success calls. Keep `try/catch` + `sendError` on register/login.

- [x] **Step 2: Update health in `apps/api/src/index.ts`**

```ts
import { sendSuccess } from '@/utils/response.js';

// ...

app.get('/health', (_req, res) => {
  sendSuccess(res, {
    message: 'OK',
    data: { service: 'relay-api' },
  });
});
```

- [x] **Step 3: Smoke-test with API running (`pnpm --filter @relay/api dev`)**

```bash
curl -s http://localhost:4000/health
```

Expected JSON shape (values may vary):

```json
{
  "success": true,
  "message": "OK",
  "data": { "service": "relay-api" },
  "error": null
}
```

```bash
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bad@example.com","password":"nope"}'
```

Expected:

```json
{
  "success": false,
  "message": "Invalid email or password",
  "data": null,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

```bash
curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -c /tmp/relay-cookies.txt \
  -d '{"email":"owner@relay.local","password":"password"}'
```

Expected: `success: true`, `data.user` with seed user fields, `error: null`.

```bash
curl -s http://localhost:4000/auth/me -b /tmp/relay-cookies.txt
```

Expected: `success: true`, `data.user` present.

---

### Task 3: Update web API client

**Files:**
- Modify: `apps/web/lib/api.ts`
- Modify: `apps/web/lib/auth.ts`

**Interfaces:**
- Consumes: envelope from API
- Produces: `api<T>(): Promise<T>` where `T` is the **inner `data`** payload (callers keep `api<{ user: AuthUser }>`)

- [x] **Step 1: Replace `apps/web/lib/api.ts` with envelope-aware client**

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T | null;
  error: { code: string; message: string } | null;
};

export async function api<T extends object>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const body = (await res.json().catch(() => ({}))) as Partial<ApiEnvelope<T>>;

  if (!res.ok || body.success === false) {
    throw new ApiError(
      res.status,
      body.error?.code || 'ERROR',
      body.error?.message || body.message || res.statusText,
    );
  }

  if (body.data == null) {
    throw new ApiError(res.status, 'ERROR', body.message || 'Empty response data');
  }

  return body.data;
}
```

- [x] **Step 2: Fix logout typing in `apps/web/lib/auth.ts`**

Change:

```ts
await api<{ ok: boolean }>('/auth/logout', { method: 'POST' });
```

to:

```ts
await api('/auth/logout', { method: 'POST' });
```

(or `await api<Record<string, never>>('/auth/logout', { method: 'POST' });`)

Leave `login` / `register` / `getMe` as-is — they already expect `{ user }` which is now inside `data`, and `api()` returns `data`.

- [x] **Step 3: Manual web check**

With `pnpm dev` (web + api): open `/login`, sign in as `owner@relay.local` / `password`.

Expected: redirect to app home; wrong password shows API error message.

Run: `pnpm --filter @relay/web exec tsc --noEmit` (or project lint if defined)

Expected: exit 0.

---

### Task 4: Agent + project docs

**Files:**
- Create: `.cursor/rules/api-response-envelope.mdc`
- Modify: `AGENTS.md`
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/steps/04-auth.md`
- Modify: `docs/steps/09-hardening.md`

**Interfaces:**
- Produces: always-on agent guidance matching the live envelope

- [x] **Step 1: Create `.cursor/rules/api-response-envelope.mdc`**

```markdown
---
description: Standard JSON API response envelope for apps/api
alwaysApply: true
---

# API response envelope

Every JSON response from `apps/api` MUST use this shape (all four keys always present):

```ts
{
  success: boolean;
  message: string;
  data: object | null;  // non-null object when success; null when failure
  error: { code: string; message: string } | null;  // null when success
}
```

## Do

```ts
import { sendSuccess } from '@/utils/response.js';
import { sendError, ValidationError } from '@/utils/errors.js';

sendSuccess(res, { message: 'OK', data: { user } });
sendSuccess(res, { status: HttpStatus.CREATED, message: 'Created', data: { issue } });
// failures: throw ApiError subclass + sendError(res, err)
```

## Don't

```ts
res.json({ user });
res.json({ ok: true });
res.status(401).json({ error: { code, message } }); // missing success/message/data
```

## Web client

`apps/web/lib/api.ts` unwraps `data` on success and throws `ApiError` from `error` on failure. Callers type the **inner** payload (`api<{ user: AuthUser }>`), not the full envelope.
```

- [x] **Step 2: Update `AGENTS.md` Rules section**

Add bullet after the existing const/alias bullets:

```markdown
- API JSON responses always use `{ success, message, data, error }` — see `.cursor/rules/api-response-envelope.mdc`
```

- [x] **Step 3: Add section to `docs/ARCHITECTURE.md` after Auth**

```markdown
## API response shape

Every JSON body from `apps/api`:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "error": null
}
```

On failure, `success` is `false`, `data` is `null`, and `error` is `{ "code", "message" }`. Helpers: `sendSuccess` / `sendError`. Web client unwraps `data`.
```

- [x] **Step 4: Update step docs**

In `docs/steps/04-auth.md`, replace the bullet:

```markdown
- Consistent error shape, e.g. `{ "error": { "code": "INVALID_CREDENTIALS", "message": "..." } }`
```

with:

```markdown
- Envelope: `{ "success", "message", "data", "error" }` — on failure `error` is `{ "code", "message" }` and `data` is `null`
```

In `docs/steps/09-hardening.md`, replace the “Standardize API errors” JSON example with:

```json
{
  "success": false,
  "message": "You are not a member of this organization",
  "data": null,
  "error": {
    "code": "FORBIDDEN",
    "message": "You are not a member of this organization"
  }
}
```

Add one line above it: success responses use the same four keys with `error: null` and a non-null `data` object.

- [x] **Step 5: Done check**

Confirm files exist/updated; no remaining docs that claim success bodies are bare `{ user }` or errors are only `{ error }` without the envelope (optional: grep).

```bash
rg "error\": \\{ \"code\"" docs/steps AGENTS.md docs/ARCHITECTURE.md || true
rg "res\\.json\\(\\{ (user|ok)" apps/api/src || true
```

Expected: step docs show envelope; `apps/api/src` has no ad-hoc `res.json({ user` / `{ ok` success bodies.

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Four-key envelope with nulls | Task 1 |
| `sendSuccess` / updated `sendError` | Task 1 |
| Migrate auth + health | Task 2 |
| Web client unwrap + login works | Task 3 |
| `.cursor/rules`, AGENTS, ARCHITECTURE, step docs | Task 4 |
| Out of scope: shared package, status semantics | — not planned |
