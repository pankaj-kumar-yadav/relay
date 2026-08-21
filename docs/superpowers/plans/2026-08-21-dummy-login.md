# Dummy Login Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Circle-styled `/login` page with hardcoded John Doe credentials and gate `/` behind a localStorage dummy session.

**Architecture:** Pure client-side auth stub in `lib/dummy-auth.ts`. Login page validates against demo constants and sets `relay_dummy_session`. Home page redirects based on that flag. No API involvement.

**Tech Stack:** Next.js 15 App Router, React 19, existing shadcn `Input` / `Label` / `Button`, localStorage.

## Global Constraints

- Credentials exactly: `john@doe.com` / `password` (case-sensitive)
- localStorage key exactly: `relay_dummy_session`
- Success redirect exactly: `/lndev-ui/team/CORE/all`
- Centered Linear-style layout — no cards, no OAuth, no register link
- Match Circle indent (3-space) and existing component imports from `@/components/ui/*`
- No new test runner — verify manually + `pnpm --filter @relay/web build`
- Do not commit unless the user asks

---

## File map

| File | Responsibility |
|------|----------------|
| `apps/web/lib/dummy-auth.ts` | Demo constants + session helpers |
| `apps/web/app/login/page.tsx` | Login UI + submit |
| `apps/web/app/page.tsx` | Logged-out → `/login`; logged-in → app |

---

### Task 1: Dummy auth helper

**Files:**
- Create: `apps/web/lib/dummy-auth.ts`

**Interfaces:**
- Produces:
  - `DEMO_EMAIL: string` (`'john@doe.com'`)
  - `DEMO_PASSWORD: string` (`'password'`)
  - `SESSION_KEY: string` (`'relay_dummy_session'`) — can be unexported if preferred; export if used in tests later
  - `isLoggedIn(): boolean`
  - `login(email: string, password: string): boolean`
  - `logout(): void`

- [x] **Step 1: Create `apps/web/lib/dummy-auth.ts`**

```ts
const SESSION_KEY = 'relay_dummy_session';

export const DEMO_EMAIL = 'john@doe.com';
export const DEMO_PASSWORD = 'password';

export function isLoggedIn(): boolean {
   if (typeof window === 'undefined') return false;
   return window.localStorage.getItem(SESSION_KEY) === '1';
}

export function login(email: string, password: string): boolean {
   if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) return false;
   window.localStorage.setItem(SESSION_KEY, '1');
   return true;
}

export function logout(): void {
   if (typeof window === 'undefined') return;
   window.localStorage.removeItem(SESSION_KEY);
}
```

- [x] **Step 2: Sanity-check in Node REPL or skip** — logic is trivial; full verify in Task 3.

---

### Task 2: Login page

**Files:**
- Create: `apps/web/app/login/page.tsx`

**Interfaces:**
- Consumes: `DEMO_EMAIL`, `DEMO_PASSWORD`, `isLoggedIn`, `login` from `@/lib/dummy-auth`
- Consumes: `Button`, `Input`, `Label` from `@/components/ui/*`

- [x] **Step 1: Create client login page**

```tsx
'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEMO_EMAIL, DEMO_PASSWORD, isLoggedIn, login } from '@/lib/dummy-auth';

const APP_HOME = '/lndev-ui/team/CORE/all';

export default function LoginPage() {
   const router = useRouter();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState<string | null>(null);
   const [submitting, setSubmitting] = useState(false);
   const [checking, setChecking] = useState(true);

   useEffect(() => {
      if (isLoggedIn()) {
         router.replace(APP_HOME);
         return;
      }
      setChecking(false);
   }, [router]);

   function onSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      setSubmitting(true);
      const ok = login(email, password);
      if (!ok) {
         setError('Invalid email or password');
         setSubmitting(false);
         return;
      }
      router.push(APP_HOME);
   }

   if (checking) {
      return <div className="min-h-svh bg-background" />;
   }

   return (
      <div className="min-h-svh bg-background flex items-center justify-center px-4">
         <div className="w-full max-w-[360px]">
            <div className="flex flex-col items-center gap-2 mb-8">
               <div className="flex aspect-square size-8 items-center justify-center rounded bg-orange-500 text-sm font-semibold text-sidebar-primary-foreground">
                  R
               </div>
               <h1 className="text-lg font-semibold tracking-tight">Relay</h1>
               <p className="text-sm text-muted-foreground">Sign in to continue</p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
               <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                     id="email"
                     type="email"
                     autoComplete="email"
                     required
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                  />
               </div>
               <div className="flex flex-col gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                     id="password"
                     type="password"
                     autoComplete="current-password"
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                  />
               </div>

               {error ? <p className="text-sm text-destructive">{error}</p> : null}

               <Button type="submit" className="w-full" disabled={submitting}>
                  Continue
               </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
               Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}
            </p>
         </div>
      </div>
   );
}
```

- [x] **Step 2: Confirm route exists** — file at `apps/web/app/login/page.tsx` maps to `/login`.

---

### Task 3: Gate home redirect

**Files:**
- Modify: `apps/web/app/page.tsx`

**Interfaces:**
- Consumes: `isLoggedIn` from `@/lib/dummy-auth`

- [x] **Step 1: Replace server redirect with client gate**

`localStorage` is unavailable on the server, so home must be a client page (same pattern as login):

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/dummy-auth';

const APP_HOME = '/lndev-ui/team/CORE/all';

export default function Home() {
   const router = useRouter();

   useEffect(() => {
      router.replace(isLoggedIn() ? APP_HOME : '/login');
   }, [router]);

   return <div className="min-h-svh bg-background" />;
}
```

- [x] **Step 2: Build**

Run: `pnpm --filter @relay/web build`  
Expected: success (no type errors). ✅ exit 0

- [ ] **Step 3: Manual verify** (run locally)

1. Clear site data / localStorage for localhost:3000
2. `pnpm --filter @relay/web dev` → open `/` → lands on `/login`
3. Wrong password → error stays on login
4. `john@doe.com` / `password` → `lndev-ui/team/CORE/all`
5. Refresh `/` → skips login into app
6. Clear `relay_dummy_session` → `/` → login again

---

## Spec coverage checklist

| Spec item | Task |
|-----------|------|
| `/login` only | Task 2 |
| Dummy credentials | Task 1 |
| localStorage session | Task 1 |
| Centered UI + demo hint | Task 2 |
| `/` gate | Task 3 |
| Success redirect path | Tasks 2–3 |
| Generic error copy | Task 2 |
| No `[orgId]` middleware | (intentionally omitted) |
| Logout export, no UI | Task 1 |
