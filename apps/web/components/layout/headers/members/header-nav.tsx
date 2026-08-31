'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NodeEnv } from '@/constants/env.constant';
import { useCreateInvite } from '@/hooks/use-invites';
import { useMembers } from '@/hooks/use-members';
import { Plus } from 'lucide-react';
import { useParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

export default function HeaderNav() {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: members = [] } = useMembers(orgId);
   const createInvite = useCreateInvite(orgId);
   const [open, setOpen] = useState(false);
   const [email, setEmail] = useState('');
   const [inviteUrl, setInviteUrl] = useState<string | null>(null);

   async function onInvite(e: FormEvent) {
      e.preventDefault();
      if (!orgId || !email) return;
      try {
         const data = await createInvite.mutateAsync({ email });
         const url = `${window.location.origin}/invite/${data.token}`;
         setInviteUrl(url);
         setEmail('');
         toast.success('Invite email sent');
      } catch {
         toast.error('Could not create invite');
      }
   }

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2">
            <SidebarTrigger className="" />
            <div className="flex items-center gap-1">
               <span className="text-sm font-medium">Members</span>
               <span className="text-xs bg-accent rounded-md px-1.5 py-1">{members.length}</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            {open ? (
               <form onSubmit={onInvite} className="flex items-center gap-2">
                  <Input
                     type="email"
                     required
                     placeholder="email@example.com"
                     className="h-7 w-56 text-sm"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                  />
                  <Button type="submit" size="xs" variant="secondary">
                     Send
                  </Button>
                  <Button type="button" size="xs" variant="ghost" onClick={() => setOpen(false)}>
                     Cancel
                  </Button>
               </form>
            ) : (
               <Button className="relative" size="xs" variant="secondary" onClick={() => setOpen(true)}>
                  <Plus className="size-4" />
                  Invite
               </Button>
            )}
            {process.env.NODE_ENV === NodeEnv.DEVELOPMENT && inviteUrl ? (
               <button
                  type="button"
                  className="text-xs text-muted-foreground underline max-w-[220px] truncate"
                  onClick={() => {
                     void navigator.clipboard.writeText(inviteUrl);
                     toast.success('Invite link copied');
                  }}
               >
                  Copy invite link
               </button>
            ) : null}
         </div>
      </div>
   );
}
