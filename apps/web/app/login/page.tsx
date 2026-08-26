'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/common/auth/auth-shell';
import { SocialProviderIcon } from '@/components/common/auth/social-provider-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select';
import { ApiError } from '@/lib/api';
import { AppRoute, AUTH_SOCIAL_PROVIDERS, nextPathFromSearch } from '@/constants/auth.constant';
import { BRAND_NAME } from '@/constants/brand.constant';
import { SEED_ACCOUNTS, SEED_PASSWORD } from '@/constants/seed.constant';
import { useLogin, useSession } from '@/hooks/use-session';
import { useResolveHomePath } from '@/hooks/use-orgs';

export default function LoginPage() {
   const router = useRouter();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [showPassword, setShowPassword] = useState(false);
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
            if (!cancelled) router.replace(nextPathFromSearch() ?? path);
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
         await loginMutation.mutateAsync({ email, password });
         router.push(nextPathFromSearch() ?? (await resolveHomePath()));
      } catch (err) {
         const message =
            err instanceof ApiError ? err.message : 'Invalid email or password';
         setError(message);
      }
   }

   function onUnavailable(message: string) {
      toast.message(message);
   }

   if (checking) {
      return <div className="min-h-svh bg-background" />;
   }

   return (
      <AuthShell>
         <div className="w-full max-w-sm">
            <div className="bg-card text-card-foreground rounded-xl border p-6 shadow-sm sm:p-8">
               <div className="mb-6 flex size-8 items-center justify-center rounded-md bg-foreground text-sm font-semibold text-background">
                  {BRAND_NAME[0]}
               </div>
               <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
               <p className="text-muted-foreground mt-1.5 text-sm">Continue to your workspace.</p>

               <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="email">Email or username</Label>
                     <Input
                        id="email"
                        type="email"
                        autoComplete="username"
                        placeholder="Email or username"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                     />
                  </div>
                  <div className="flex flex-col gap-2">
                     <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="password">Password</Label>
                        <button
                           type="button"
                           className="text-muted-foreground hover:text-foreground text-xs transition-colors"
                           onClick={() => onUnavailable('Password reset is not available yet')}
                        >
                           Forgot password?
                        </button>
                     </div>
                     <div className="relative">
                        <Input
                           id="password"
                           type={showPassword ? 'text' : 'password'}
                           autoComplete="current-password"
                           placeholder="Enter your password"
                           required
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           className="pr-10"
                        />
                        <button
                           type="button"
                           className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3"
                           onClick={() => setShowPassword((visible) => !visible)}
                           aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                           {showPassword ? (
                              <EyeOff className="size-4" />
                           ) : (
                              <Eye className="size-4" />
                           )}
                        </button>
                     </div>
                  </div>

                  {error ? <p className="text-sm text-destructive">{error}</p> : null}

                  <Button type="submit" className="w-full" disabled={submitting}>
                     Sign in
                  </Button>
               </form>

               <div className="relative my-6">
                  <Separator />
                  <span className="bg-card text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
                     Or continue with
                  </span>
               </div>

               <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {AUTH_SOCIAL_PROVIDERS.map((provider) => (
                     <Button
                        key={provider.id}
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => onUnavailable('Social sign-in is not available yet')}
                     >
                        <SocialProviderIcon provider={provider.id} className="size-4" />
                        {provider.label}
                     </Button>
                  ))}
               </div>
            </div>

            <p className="text-muted-foreground mt-6 text-center text-sm">
               Need an account?{' '}
               <Link
                  href={AppRoute.REGISTER}
                  className="text-foreground font-medium underline-offset-4 hover:underline"
               >
                  Sign up
               </Link>
            </p>

            {process.env.NODE_ENV === 'development' ? (
               <div className="mt-6">
                  <Select
                     onValueChange={(value) => {
                        setEmail(value);
                        setPassword(SEED_PASSWORD);
                        setError(null);
                     }}
                  >
                     <SelectTrigger className="text-muted-foreground h-8 text-xs">
                        <SelectValue placeholder="Prefill a seed account" />
                     </SelectTrigger>
                     <SelectContent>
                        {SEED_ACCOUNTS.map((account) => (
                           <SelectItem key={account.email} value={account.email}>
                              {account.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
            ) : null}
         </div>
      </AuthShell>
   );
}
