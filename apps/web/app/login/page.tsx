'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api';
import { getSession, login } from '@/lib/auth';

const APP_HOME = '/lndev-ui/team/CORE/all';
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

const DEFAULT_SEED = SEED_ACCOUNTS[2];

export default function LoginPage() {
   const router = useRouter();
   const [email, setEmail] = useState(DEFAULT_SEED.email);
   const [password, setPassword] = useState(DEFAULT_SEED.password);
   const [error, setError] = useState<string | null>(null);
   const [submitting, setSubmitting] = useState(false);
   const [checking, setChecking] = useState(true);

   useEffect(() => {
      let cancelled = false;
      getSession()
         .then((user) => {
            if (cancelled) return;
            if (user) {
               router.replace(APP_HOME);
               return;
            }
            setChecking(false);
         })
         .catch(() => {
            if (!cancelled) setChecking(false);
         });
      return () => {
         cancelled = true;
      };
   }, [router]);

   async function onSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      setSubmitting(true);
      try {
         await login(email, password);
         router.push(APP_HOME);
      } catch (err) {
         const message =
            err instanceof ApiError ? err.message : 'Invalid email or password';
         setError(message);
         setSubmitting(false);
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
