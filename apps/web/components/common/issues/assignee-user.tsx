'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserStatusColor } from '@/constants/user.constant';
import { User } from '@/mock-data/users';
import { CheckIcon, CircleUserRound, UserIcon } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useMembers } from '@/hooks/use-members';
import { mapMemberToUser } from '@/lib/mappers';
import { useIssueMutations } from '@/hooks/use-issues';
import { useParams } from 'next/navigation';

interface AssigneeUserProps {
   user: User | null;
   issueId?: string;
}

export function AssigneeUser({ user, issueId }: AssigneeUserProps) {
   const [open, setOpen] = useState(false);
   const [currentAssignee, setCurrentAssignee] = useState<User | null>(user);
   const { orgId } = useParams<{ orgId: string }>();
   const { data: members = [] } = useMembers(orgId);
   const users = useMemo(() => members.map(mapMemberToUser), [members]);
   const { updateIssueAssignee } = useIssueMutations();

   useEffect(() => {
      setCurrentAssignee(user);
   }, [user]);

   const renderAvatar = () => {
      if (currentAssignee) {
         return (
            <Avatar className="size-6 shrink-0">
               <AvatarImage src={currentAssignee.avatarUrl} alt={currentAssignee.name} />
               <AvatarFallback>{currentAssignee.name[0]}</AvatarFallback>
            </Avatar>
         );
      } else {
         return (
            <div className="size-6 flex items-center justify-center">
               <CircleUserRound className="size-5 text-zinc-600" />
            </div>
         );
      }
   };

   return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
         <DropdownMenuTrigger asChild>
            <button className="relative w-fit focus:outline-none">
               {renderAvatar()}
               {currentAssignee && (
                  <span
                     className="border-background absolute -end-0.5 -bottom-0.5 size-2.5 rounded-full border-2"
                     style={{ backgroundColor: UserStatusColor[currentAssignee.status] }}
                  >
                     <span className="sr-only">{currentAssignee.status}</span>
                  </span>
               )}
            </button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="start" className="w-[206px]">
            <DropdownMenuLabel>Assign to...</DropdownMenuLabel>
            <DropdownMenuItem
               onClick={(e) => {
                  e.stopPropagation();
                  setCurrentAssignee(null);
                  if (issueId) updateIssueAssignee(issueId, null);
                  setOpen(false);
               }}
            >
               <div className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  <span>No assignee</span>
               </div>
               {!currentAssignee && <CheckIcon className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {users.map((user) => (
                  <DropdownMenuItem
                     key={user.id}
                     onClick={(e) => {
                        e.stopPropagation();
                        setCurrentAssignee(user);
                        if (issueId) updateIssueAssignee(issueId, user);
                        setOpen(false);
                     }}
                  >
                     <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                           <AvatarImage src={user.avatarUrl} alt={user.name} />
                           <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                     </div>
                     {currentAssignee?.id === user.id && <CheckIcon className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
               ))}
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
