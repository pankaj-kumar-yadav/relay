# API — envelope, folders, and docs

## Layer folders, domain subfolders

Keep the layer (`middleware`, `routes`, `utils`, `constants`, `auth`, `openapi`). When a domain has **more than one file** in that layer (implementation, helpers, tests), nest them in a subdomain folder. Colocate tests next to the code they cover.

```text
# ✅ GOOD
middleware/auth/requireAuth.ts
middleware/auth/authRateLimit.ts
middleware/auth/authRateLimit.test.ts
middleware/org/requireOrgMember.ts
middleware/org/requireOrgRole.ts
middleware/org/requireOrgRole.test.ts
routes/auth/auth.ts
routes/auth/auth.schema.ts
routes/auth/auth.integration.test.ts
routes/issues/issues.ts
routes/issues/issues.schema.ts
openapi/paths/health.ts
openapi/paths/auth.ts
openapi/paths/orgs.ts
openapi/openapi.test.ts
utils/issue/issueRef.ts
utils/issue/issueRank.ts
utils/issue/issueRef.test.ts

# ❌ BAD — flat layer mixes domains and tests
middleware/requireAuth.ts
middleware/authRateLimit.ts
middleware/authRateLimit.test.ts
middleware/requireOrgRole.ts
routes/auth.ts
routes/auth.integration.test.ts
```

- A **single** standalone file may stay at the layer root (`utils/passwords.ts`, `utils/response.ts`)
- Do **not** invert the tree (`auth/middleware/…`)
- Do **not** invent a folder for one file (`utils/passwords/passwords.ts`)
- New files follow this. When you next touch a flat domain that already has 2+ files, nest them. Do not mass-move unrelated folders in the same change.

## Response envelope

Every JSON response from `apps/api` MUST use this shape (all four keys always present), except `GET /api/v1/openapi.json` (the OpenAPI document):

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

`apps/web/lib/api.ts` unwraps `data` on success and throws `ApiError` from `error` on failure. Callers type the **inner** payload (`api<{ user: AuthUser }>`), not the full envelope. It prepends `API_PREFIX` (`/api/v1`); services keep paths like `/orgs/...`.

## API docs

The contract lives in code, not a handwritten catalog. Auth, tenancy, and CORS stay in `docs/ARCHITECTURE.md` — do not copy them into every handler.

- **Source of truth:** Zod on the route (body/query), `sendSuccess` / `sendError` (envelope), `ErrorCode` in `constants/http.ts` (failure identity)
- **Generated OpenAPI:** register paths from those Zod schemas (`openapi/paths/`, `@asteasolutions/zod-to-openapi`). All HTTP routes live under `API_PREFIX` (`/api/v1`). OpenAPI `servers` is that prefix; path items are unprefixed (`/health`, `/auth/login`). Scalar at `GET /docs` and the spec at `GET /api/v1/openapi.json` in every environment (`createApp({ docs: false })` omits them)
- **No parallel catalog:** do not add `docs/api/*.md` per resource or a handwritten OpenAPI file
- **Versioned first-party API:** cookie session routes are `/api/v1/...` for `apps/web`. A later partner API (API keys / OAuth) is still a **new surface**, not a relabel of this one
- **Stable error codes:** `TOKEN_EXPIRED`, `VALIDATION_ERROR`, `EMAIL_TAKEN`, and the rest of `ErrorCode`. Messages may change; codes must not. New failures get a named `ErrorCode`, not an ad-hoc string. Do not model every code on every OpenAPI operation — one error envelope is enough
- **Named Zod schemas:** inline `const createIssueSchema = z.object(...)` is fine. When you touch a route, **export** the schema (same file, or `routes/<domain>/*.schema.ts` if that domain already has multiple files) and register the path. Do not mass-extract schemas in an unrelated change
- Import `z` from `@/openapi/zod.js` for schemas that feed OpenAPI (it calls `extendZodWithOpenApi`)
