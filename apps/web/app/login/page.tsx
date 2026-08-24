'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { useLogin, useSession } from '@/hooks/use-session';
import { useResolveHomePath } from '@/hooks/use-orgs';

const SEED_PASSWORD = 'password';

const SEED_ACCOUNTS = [
   {
      label: 'Super-admin · acme',
      email: 'owner@relay.local',
      password: SEED_PASSWORD,
   },
   {
      label: 'Admin · techap-solutions',
      email: 'admin@techap.local',
      password: SEED_PASSWORD,
   },
   {
      label: 'Employee · techap-solutions',
      email: 'employee@techap.local',
      password: SEED_PASSWORD,
   },
] as const;

function nextPath() {
   if (typeof window === 'undefined') return null;
   const next = new URLSearchParams(window.location.search).get('next');
   if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
   return next;
}

const DEFAULT_SEED = SEED_ACCOUNTS[2];

export default function LoginPage() {
   const router = useRouter();
   const [email, setEmail] = useState<string>(DEFAULT_SEED.email);
   const [password, setPassword] = useState<string>(DEFAULT_SEED.password);
   const [error, setError] = useState<string | null>(null);
   const { data: user, isFetched } = useSession();
   const loginMutation = useLogin();
   const { mutateAsync: resolveHomePath, isPending: resolvingHome } = useResolveHomePath();
   const submitting = loginMutation.isPending || resolvingHome;
   const checking = !isFetched || Boolean(user);

   useEffect(() => {
      if (!isFetched || !user) return;
      let cancelled = false;
      resolveHomePath()
         .then((path) => {
            if (!cancelled) router.replace(nextPath() ?? path);
         })
         .catch(() => {
            if (!cancelled) router.replace('/new');
         });
      return () => {
         cancelled = true;
      };
   }, [isFetched, user, router, resolveHomePath]);

   async function onSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      try {
         await loginMutation.mutateAsync({ email, password });
         router.push(nextPath() ?? (await resolveHomePath()));
      } catch (err) {
         const message =
            err instanceof ApiError ? err.message : 'Invalid email or password';
         setError(message);
      }
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

            <div className="mt-6 flex flex-col gap-2">
               <p className="text-center text-xs text-muted-foreground">
                  Prefill seed account (password: {SEED_PASSWORD})
               </p>
               <div className="flex flex-col gap-1.5">
                  {SEED_ACCOUNTS.map((account) => (
                     <button
                        key={account.email}
                        type="button"
                        className="rounded-md border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        onClick={() => {
                           setEmail(account.email);
                           setPassword(account.password);
                           setError(null);
                        }}
                     >
                        <span className="font-medium text-foreground">{account.label}</span>
                        <span className="mt-0.5 block">{account.email}</span>
                     </button>
                  ))}
               </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
               No account?{' '}
               <Link href="/register" className="text-foreground underline-offset-4 hover:underline">
                  Register
               </Link>
            </p>
         </div>
      </div>
   );
}
