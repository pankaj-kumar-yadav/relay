'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AuthShell } from '@/components/common/auth/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppRoute } from '@/constants/auth.constant';
import { BRAND_NAME } from '@/constants/brand.constant';
import { ApiError } from '@/lib/api';
import { useResetPassword } from '@/hooks/use-session';

export default function ResetPasswordPage() {
   const router = useRouter();
   const { token } = useParams<{ token: string }>();
   const [password, setPassword] = useState('');
   const [error, setError] = useState<string | null>(null);
   const reset = useResetPassword();

   async function onSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      if (!token) {
         setError('Missing reset token');
         return;
      }
      try {
         await reset.mutateAsync({ token, password });
         router.replace(AppRoute.LOGIN);
      } catch (err) {
         setError(err instanceof ApiError ? err.message : 'Could not reset password');
      }
   }

   return (
      <AuthShell>
         <div className="w-full max-w-sm">
            <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm sm:p-8">
               <div className="mb-6 flex size-8 items-center justify-center rounded-md bg-foreground text-sm font-semibold text-background">
                  {BRAND_NAME[0]}
               </div>
               <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
               <p className="text-muted-foreground mt-1.5 text-sm">
                  Choose a password with at least 8 characters.
               </p>

               <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="password">New password</Label>
                     <Input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                     />
                  </div>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  <Button type="submit" className="w-full" disabled={reset.isPending}>
                     Reset password
                  </Button>
               </form>
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
