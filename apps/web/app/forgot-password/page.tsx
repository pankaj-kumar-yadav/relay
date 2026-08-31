'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { AuthShell } from '@/components/common/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppRoute } from '@/constants/auth.constant';
import { BRAND_NAME } from '@/constants/brand.constant';
import { ApiError } from '@/lib/api';
import { useForgotPassword } from '@/hooks/use-session';

export default function ForgotPasswordPage() {
   const [email, setEmail] = useState('');
   const [error, setError] = useState<string | null>(null);
   const [sent, setSent] = useState(false);
   const forgot = useForgotPassword();

   async function onSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      try {
         await forgot.mutateAsync(email);
         setSent(true);
      } catch (err) {
         setError(err instanceof ApiError ? err.message : 'Could not send reset email');
      }
   }

   return (
      <AuthShell>
         <div className="w-full max-w-sm">
            <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm sm:p-8">
               <div className="mb-6 flex size-8 items-center justify-center rounded-md bg-foreground text-sm font-semibold text-background">
                  {BRAND_NAME[0]}
               </div>
               <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
               <p className="text-muted-foreground mt-1.5 text-sm">
                  Enter your email and we&apos;ll send a reset link if an account exists.
               </p>

               {sent ? (
                  <p className="mt-6 text-sm">
                     If that email exists, we sent a reset link. Check your inbox (or the API log in
                     development).
                  </p>
               ) : (
                  <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
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
                     {error ? <p className="text-sm text-destructive">{error}</p> : null}
                     <Button type="submit" className="w-full" disabled={forgot.isPending}>
                        Send reset link
                     </Button>
                  </form>
               )}
            </div>
            <p className="text-muted-foreground mt-6 text-center text-sm">
               <Link
                  href={AppRoute.LOGIN}
                  className="text-foreground font-medium underline-offset-4 hover:underline"
               >
                  Back to sign in
               </Link>
            </p>
         </div>
      </AuthShell>
   );
}
