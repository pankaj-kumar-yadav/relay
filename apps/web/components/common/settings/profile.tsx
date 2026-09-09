'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { AVATAR_CONTENT_TYPES } from '@relay/shared/constants/attachment.constant';
import { userAvatarUrl } from '@/constants/user.constant';
import { useDeleteAvatar, usePatchMe, useSession, useUploadAvatar } from '@/hooks/use-session';
import { ApiError } from '@/lib/api';
import { ErrorCode } from '@relay/shared/constants/http.constant';
import { toast } from 'sonner';
import { useEffect, useRef, useState } from 'react';
import { SettingsCard, SettingsRow, SettingsSection, SettingsShell } from './shared';

/** Personal "Profile" settings. */
export default function Profile() {
   const { data: me } = useSession();
   const patchMe = usePatchMe();
   const uploadAvatar = useUploadAvatar();
   const deleteAvatar = useDeleteAvatar();
   const [name, setName] = useState('');
   const fileRef = useRef<HTMLInputElement>(null);

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

   async function onPickAvatar(file: File | undefined) {
      if (!file) return;
      try {
         await uploadAvatar.mutateAsync(file);
         toast.success('Photo updated');
      } catch (err) {
         const code = err instanceof ApiError ? err.code : '';
         toast.error(
            code === ErrorCode.STORAGE_UNCONFIGURED
               ? 'File storage is not configured'
               : 'Could not update photo',
         );
      }
   }

   return (
      <SettingsShell title="Profile">
         <SettingsSection>
            <SettingsCard>
               <SettingsRow
                  title="Profile picture"
                  trailing={
                     <div className="flex items-center gap-2">
                        {me?.avatarUrl ? (
                           <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-foreground"
                              disabled={deleteAvatar.isPending}
                              onClick={() => {
                                 void deleteAvatar.mutateAsync().then(
                                    () => toast.success('Photo removed'),
                                    () => toast.error('Could not remove photo'),
                                 );
                              }}
                           >
                              Remove
                           </button>
                        ) : null}
                        <input
                           ref={fileRef}
                           type="file"
                           accept={AVATAR_CONTENT_TYPES.join(',')}
                           className="sr-only"
                           onChange={(event) => {
                              const file = event.target.files?.[0];
                              event.target.value = '';
                              void onPickAvatar(file);
                           }}
                        />
                        <button
                           type="button"
                           className="rounded-full"
                           aria-label="Change profile picture"
                           disabled={!me || uploadAvatar.isPending}
                           onClick={() => fileRef.current?.click()}
                        >
                           <Avatar className="size-9">
                              <AvatarImage
                                 src={me ? userAvatarUrl(me) : undefined}
                                 alt={me?.name ?? 'Profile'}
                              />
                              <AvatarFallback>{me?.name?.[0] ?? '?'}</AvatarFallback>
                           </Avatar>
                        </button>
                     </div>
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
