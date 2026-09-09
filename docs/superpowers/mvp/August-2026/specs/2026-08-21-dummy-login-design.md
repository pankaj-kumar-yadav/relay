# Dummy login screen — design

**Date:** 2026-08-21  
**Status:** Approved for planning  
**Scope:** UI-only login gate for `apps/web` (ahead of Step 4 real auth)

## Goal

Add a Circle-styled login screen so `/` no longer drops straight into the mock org. Use hardcoded John Doe credentials for local demos. No API, cookies, or real session.

## Decisions

| Topic | Choice |
|-------|--------|
| Scope | UI-only (option A) |
| Screens | Login only (`/login`) — no register |
| Layout | Centered Linear-style (no card, no split marketing) |
| Routing | `/` → `/login`; success → `lndev-ui/team/CORE/all` |
| Credentials | `john@doe.com` / `password` |
| Persistence | `localStorage` key `relay_dummy_session` |

## Behavior

1. Visiting `/` redirects to `/login` if not logged in; if logged in, redirects to `lndev-ui/team/CORE/all`.
2. Visiting `/login` while logged in redirects into the app.
3. Submit with correct credentials writes the localStorage flag and navigates to the mock board.
4. Wrong credentials show a single generic error: “Invalid email or password”.
5. Deep links under `[orgId]` are **not** protected in this pass (UI gate only).

## UI

- Full-viewport `bg-background`, centered column (~360px max width)
- Orange square mark (same language as org switcher) + **Relay** wordmark
- Subcopy: “Sign in to continue”
- Email + Password via existing shadcn `Label` / `Input`
- Full-width primary `Button`: “Continue”
- Muted demo hint under the form showing the dummy credentials
- Inherit root `ThemeProvider` (dark default); no extra theme controls on the page
- No cards, social OAuth, or “create account” link

## Structure

| File | Role |
|------|------|
| `apps/web/app/login/page.tsx` | Client login form + submit |
| `apps/web/lib/dummy-auth.ts` | `DEMO_EMAIL`, `DEMO_PASSWORD`, `isLoggedIn()`, `login(email, password)`, `logout()` |
| `apps/web/app/page.tsx` | Redirect based on dummy session |

### `dummy-auth` contract

- `login(email, password): boolean` — case-sensitive email/password match against demo constants; on success sets `localStorage.setItem('relay_dummy_session', '1')`
- `isLoggedIn(): boolean` — reads that key (safe for SSR: return `false` when `window` is undefined)
- `logout(): void` — removes the key (exported for later; no logout UI in this pass)

## Errors

- HTML `required` on fields; disable Continue while a submit is in flight
- Credential failure: inline text under the form (destructive/muted), no toast

## Out of scope

- Register / password reset
- API auth, cookies, CORS (Step 4)
- Middleware or layout guards on `[orgId]` routes
- Logout UI in the account menu
- Renaming Circle metadata / branding beyond the login wordmark

## Done when

- [ ] `/` shows the login screen when logged out
- [ ] `john@doe.com` / `password` enters `lndev-ui/team/CORE/all`
- [ ] Wrong password stays on `/login` with an error
- [ ] Refresh after success skips login (localStorage persists)
