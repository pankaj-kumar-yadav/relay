'use client';

import { OrgRole } from '@/constants/org.constant';
import { useDeleteMember, useMembers, usePatchMember } from '@/hooks/use-members';
import { useOrgs } from '@/hooks/use-orgs';
import MemberLine from './member-line';
import { mapMemberToUser } from '@/lib/mappers';
import { useMembersFilterStore } from '@/store/members-filter-store';
import { ArrowDown } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { toast } from 'sonner';

export default function Members() {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: members = [] } = useMembers(orgId);
   const { data: orgs } = useOrgs();
   const patchMember = usePatchMember();
   const deleteMember = useDeleteMember();
   const { filters, sort } = useMembersFilterStore();

   const isAdmin = orgs?.some(
      (org) => org.slug === orgId && org.role === OrgRole.ADMIN,
   ) ?? false;
   const adminCount = members.filter((member) => member.role === OrgRole.ADMIN).length;

   const displayed = useMemo(() => {
      let list = members.map((member) => ({
         member,
         user: mapMemberToUser(member),
      }));

      if (filters.role.length > 0) {
         const roles = new Set(filters.role);
         list = list.filter((row) => roles.has(row.user.role));
      }

      const compare = (a: (typeof list)[number], b: (typeof list)[number]) => {
         switch (sort) {
            case 'name-asc':
               return a.user.name.localeCompare(b.user.name);
            case 'name-desc':
               return b.user.name.localeCompare(a.user.name);
            case 'joined-asc':
               return new Date(a.user.joinedDate).getTime() - new Date(b.user.joinedDate).getTime();
            case 'joined-desc':
               return new Date(b.user.joinedDate).getTime() - new Date(a.user.joinedDate).getTime();
            default:
               return 0;
         }
      };

      return list.sort(compare);
   }, [members, filters, sort]);

   return (
      <div className="w-full">
         <div className="bg-container px-6 py-1.5 text-sm flex items-center text-muted-foreground border-b sticky top-0 z-10">
            <div className="flex-1 min-w-0 flex items-center gap-1">
               Name
               <ArrowDown className="size-3" />
            </div>
            <div className="w-[110px] shrink-0">Status</div>
            <div className="hidden lg:block w-[100px] shrink-0">Joined</div>
            <div className="hidden md:block w-[170px] shrink-0">Teams</div>
            <div className="hidden sm:block w-[90px] shrink-0">Last seen</div>
            {isAdmin && <div className="w-8 shrink-0" />}
         </div>

         <div className="w-full">
            {displayed.map(({ member, user }) => (
               <MemberLine
                  key={user.id}
                  user={user}
                  role={member.role}
                  canManage={isAdmin}
                  isLastAdmin={member.role === OrgRole.ADMIN && adminCount <= 1}
                  onRoleChange={(role) => {
                     patchMember.mutate(
                        { userId: member.id, role },
                        {
                           onError: () => toast.error('Could not update role'),
                        },
                     );
                  }}
                  onRemove={() => {
                     deleteMember.mutate(member.id, {
                        onError: () => toast.error('Could not remove member'),
                     });
                  }}
               />
            ))}
         </div>
      </div>
   );
}
