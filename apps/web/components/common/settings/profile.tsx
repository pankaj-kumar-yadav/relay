'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { dicebearAvatarUrl } from '@/constants/user.constant';
import { usePatchMe, useSession } from '@/hooks/use-session';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

/** Personal "Profile" settings. */
export default function Profile() {
   const { data: me } = useSession();
   const patchMe = usePatchMe();
   const [name, setName] = useState('');

   useEffect(() => {
      if (me?.name) setName(me.name);
   }, [me?.name]);

   async function persistName() {
      if (!me) return;
      const next = name.trim();
      if (!next) {
         setName(me.name);
         return;
      }
      if (next === me.name) return;
      try {
         await patchMe.mutateAsync({ name: next });
         toast.success('Name updated');
      } catch {
         setName(me.name);
         toast.error('Could not update name');
      }
   }

   return (
      <SettingsShell title="Profile">
         <SettingsSection>
            <SettingsCard>
               <SettingsRow
                  title="Profile picture"
                  trailing={
                     <Avatar className="size-9">
                        <AvatarImage
                           src={me ? dicebearAvatarUrl(me.id) : undefined}
                           alt={me?.name ?? 'Profile'}
                        />
                        <AvatarFallback>{me?.name?.[0] ?? '?'}</AvatarFallback>
                     </Avatar>
                  }
               />
               <SettingsRow
                  title="Email"
                  trailing={
                     <span className="text-foreground">{me?.email ?? ''}</span>
                  }
               />
               {/* Email pencil — out of v1; restore later */}
               <SettingsRow
                  title="Full name"
                  trailing={
                     <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        onBlur={() => {
                           void persistName();
                        }}
                        onKeyDown={(event) => {
                           if (event.key === 'Enter') event.currentTarget.blur();
                        }}
                        className="h-8 w-44"
                        disabled={!me || patchMe.isPending}
                     />
                  }
               />
               {/* Title / username — out of v1; restore later */}
            </SettingsCard>
         </SettingsSection>

         {/* Leave workspace — out of v1; restore later */}
      </SettingsShell>
   );
}
