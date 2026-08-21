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
   const [email, setEmail] = useState(DEMO_EMAIL);
   const [password, setPassword] = useState(DEMO_PASSWORD);
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
