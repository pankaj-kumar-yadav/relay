# Web — API services, TanStack Query, unused UI

## API services + TanStack Query

`apps/web` talks to the API through **service files only**. That is the single source of truth for HTTP paths, methods, and request/response types. Components, pages, and stores never call `api()` / `fetch` themselves.

| Kind | Home |
|------|------|
| HTTP wrappers | `apps/web/services/<domain>.service.ts` |
| Transport (envelope unwrap, cookies, `API_PREFIX`, refresh) | `apps/web/lib/api.ts` only |
| Server state | TanStack Query (`useQuery` / `useMutation`) |

One domain per file: `issues.service.ts`, `orgs.service.ts`, `members.service.ts`.

Every function that hits the network **must** end with `Api` (camelCase, not `API`): `listIssuesApi`, `createIssueApi`, `getSessionApi`.

Do **not** suffix hooks (`useCreateIssue`), store/UI helpers (`deleteIssue`, `getIssueById`), types, or non-HTTP utils (`teamHomePath`, `toQuery`).

```ts
// apps/web/services/issues.service.ts
import { api } from '@/lib/api';

export function listIssuesApi(orgSlug: string) {
  return api<{ issues: ApiIssue[] }>(`/orgs/${orgSlug}/issues`);
}
```

```ts
const { data } = useQuery({
  queryKey: ['issues', orgSlug],
  queryFn: () => listIssuesApi(orgSlug),
});
```

```ts
await api(`/orgs/${orgSlug}/issues`); // ❌ in a component, page, or store
export function listIssues() {}      // ❌ HTTP fn missing Api suffix
export function listIssuesAPI() {}   // ❌ shouty acronym — use Api
```

- New endpoint → `*.service.ts` function named `*Api`, then wire UI with TanStack Query
- Services stay HTTP-only (no React, no `useQuery`)
- Query keys include org/resource ids so caches stay tenant-scoped
- Zustand is for UI state only, not API caching
- Callers type the **inner** payload (`api<{ user: AuthUser }>`), not the full envelope — see [api-rules.md](./api-rules.md)

## Keep Circle UI (do not delete, do not rewrite)

`apps/web` is the [Circle](https://github.com/ln-dev7/circle) frontend. Relay wires the Express API into it.

- **Do not delete** Circle `.tsx` / screens / nav / mock widgets — even when unused this step
- **Do not rewrite** a Circle layout from scratch (e.g. replacing issue details with a custom form)
- Comment out or hide leftover chrome; leave the component **file** in place
- Write new frontend **only** where Circle has no component for that surface
- Only delete a UI file if the user **explicitly** asks to remove that file

```tsx
// ✅ GOOD — keep Circle chrome, wire API into it
<h1 className="text-3xl font-semibold leading-tight text-balance">{issue.title}</h1>
{/* <SubscribeButton /> — out of v1; restore later */}

// ❌ BAD — custom rewrite of a screen Circle already has
<div className="flex flex-col gap-4">
  <Input className="text-3xl" value={issue.title} />
  <Textarea className="min-h-40" value={issue.description} />
</div>
```
