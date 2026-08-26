'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppRoute } from '@/constants/auth.constant';
import { ApiError } from '@/lib/api';
import { useRegister, useSession } from '@/hooks/use-session';
import { useResolveHomePath } from '@/hooks/use-orgs';

export default function RegisterPage() {
   const router = useRouter();
   const [name, setName] = useState('');
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState<string | null>(null);
   const { data: user, isFetched } = useSession();
   const registerMutation = useRegister();
   const { mutateAsync: resolveHomePath, isPending: resolvingHome } = useResolveHomePath();
   const submitting = registerMutation.isPending || resolvingHome;
   const checking = !isFetched || Boolean(user);

   useEffect(() => {
      if (!isFetched || !user) return;
      let cancelled = false;
      resolveHomePath()
         .then((path) => {
            if (!cancelled) router.replace(path);
         })
         .catch(() => {
            if (!cancelled) router.replace(AppRoute.NEW);
         });
      return () => {
         cancelled = true;
      };
   }, [isFetched, user, router, resolveHomePath]);

   async function onSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      try {
         await registerMutation.mutateAsync({ name, email, password });
         router.push(await resolveHomePath());
      } catch (err) {
         const message =
            err instanceof ApiError ? err.message : 'Could not create account';
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
               <p className="text-sm text-muted-foreground">Create an account</p>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
               <div className="flex flex-col gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                     id="name"
                     type="text"
                     autoComplete="name"
                     required
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                  />
               </div>
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
                     autoComplete="new-password"
                     required
                     minLength={8}
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                  />
               </div>

               {error ? <p className="text-sm text-destructive">{error}</p> : null}

               <Button type="submit" className="w-full" disabled={submitting}>
                  Create account
               </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
               Already have an account?{' '}
               <Link href={AppRoute.LOGIN} className="text-foreground underline-offset-4 hover:underline">
                  Sign in
               </Link>
            </p>
         </div>
      </div>
   );
}
