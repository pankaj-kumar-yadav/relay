'use client';

import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Laptop, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { ApiError } from '@/lib/api';
import { useChangePassword } from '@/hooks/use-session';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

/** Personal "Security & access" settings (sessions, passkeys, API keys). */
export default function AccountSecurity() {
   const changePassword = useChangePassword();
   const [currentPassword, setCurrentPassword] = useState('');
   const [newPassword, setNewPassword] = useState('');
   const [error, setError] = useState<string | null>(null);

   async function onChangePassword(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      setError(null);
      try {
         await changePassword.mutateAsync({ currentPassword, newPassword });
         setCurrentPassword('');
         setNewPassword('');
         toast.success('Password updated');
      } catch (err) {
         const message =
            err instanceof ApiError ? err.message : 'Could not update password';
         setError(message);
         toast.error(message);
      }
   }

   return (
      <SettingsShell title="Security & access">
         <SettingsSection title="Password" description="Change the password for this account">
            <SettingsCard>
               <form onSubmit={onChangePassword} className="flex flex-col gap-4 p-4">
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="current-password">Current password</Label>
                     <Input
                        id="current-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="h-8 max-w-xs"
                     />
                  </div>
                  <div className="flex flex-col gap-2">
                     <Label htmlFor="new-password">New password</Label>
                     <Input
                        id="new-password"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-8 max-w-xs"
                     />
                  </div>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  <div>
                     <Button type="submit" size="xs" disabled={changePassword.isPending}>
                        Update password
                     </Button>
                  </div>
               </form>
            </SettingsCard>
         </SettingsSection>

         <SettingsSection title="Sessions" description="Devices logged into your account">
            <SettingsCard>
               <SettingsRow
                  icon={<Laptop className="size-4" />}
                  title="Chrome on macOS"
                  description={
                     <span className="inline-flex items-center gap-1.5">
                        <span className="size-1.5 rounded-full bg-[#00cc66]" />
                        <span className="text-[#00a05a]">Current session</span> · Paris, FR · (EN,
                        FR)
                     </span>
                  }
               />
            </SettingsCard>
            <SettingsCard>
               <SettingsRow
                  title="1 other session"
                  trailing={
                     <Button size="xs" variant="ghost">
                        Revoke all
                     </Button>
                  }
               />
               <SettingsRow
                  icon={<Smartphone className="size-4" />}
                  title="LNDev UI iOS"
                  description="Paris, FR · Last seen about 3 hours ago"
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection
            title="Passkeys"
            description="Passkeys are a secure way to sign in to your account"
         >
            <SettingsCard>
               <SettingsRow
                  title="No passkeys registered"
                  trailing={
                     <Button size="xs" variant="ghost">
                        New passkey
                     </Button>
                  }
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection
            title="Personal API keys"
            description="Use the GraphQL API to build your own integrations"
         >
            <SettingsCard>
               <SettingsRow
                  title="1 API key"
                  trailing={
                     <Button size="xs" variant="ghost">
                        New API key
                     </Button>
                  }
               />
               <SettingsRow
                  icon={<KeyRound className="size-4" />}
                  title={
                     <>
                        LNDEV_PERSONAL_API_KEY
                        <span className="text-xs text-muted-foreground font-normal">
                           · full access · public & private teams
                        </span>
                     </>
                  }
                  description="Created 2 months ago · last used on Jul 16, 2026"
               />
            </SettingsCard>
         </SettingsSection>

         <SettingsSection
            title="Commit signing key"
            description="Coding sessions use this key to sign your commits"
         >
            <SettingsCard>
               <SettingsRow
                  title="No signing key added"
                  trailing={
                     <Button size="xs" variant="ghost">
                        Add key
                     </Button>
                  }
               />
            </SettingsCard>
         </SettingsSection>
      </SettingsShell>
   );
}
