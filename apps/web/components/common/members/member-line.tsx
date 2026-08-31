'use client';

import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatJoinedLabel } from '@/constants/date.constant';
import { OrgRole, OrgRoleLabel, type OrgRoleValue, profilePath } from '@/constants/org.constant';
import { cn } from '@/lib/utils';
import { User } from '@/mock-data/users';
import { Check, MoreHorizontal, SquareUser } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type MouseEvent, type PointerEvent } from 'react';

interface MemberLineProps {
   user: User;
   role: OrgRoleValue;
   canManage: boolean;
   isLastAdmin: boolean;
   onRoleChange: (role: OrgRoleValue) => void;
   onRemove: () => void;
}

/** "mason.carter" → "Mason Carter" (Linear shows display name + handle). */
const displayNameOf = (user: User) =>
   user.name
      .split('.')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

const hashString = (value: string): number => {
   let hash = 0;
   for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
   return hash;
};

function stopRowClick(event: MouseEvent) {
   event.preventDefault();
   event.stopPropagation();
}

function stopRowPointer(event: PointerEvent) {
   event.stopPropagation();
}

export default function MemberLine({
   user,
   role,
   canManage,
   isLastAdmin,
   onRoleChange,
   onRemove,
}: MemberLineProps) {
   const { orgId } = useParams<{ orgId: string }>();
   const [confirmRemove, setConfirmRemove] = useState(false);
   const isApplication = user.role === 'Application';
   // Like Linear, some accounts show their e-mail as the primary line.
   const showEmailAsName = !isApplication && hashString(user.id) % 4 === 0;
   const roleLabel = OrgRoleLabel[role];
   const canDemote = !(isLastAdmin && role === OrgRole.ADMIN);

   return (
      <>
         <Link
            href={profilePath(orgId, user.id)}
            className="w-full flex items-center py-2.5 px-6 border-b hover:bg-sidebar/50 border-muted-foreground/5 text-sm last:border-b-0"
         >
            {/* Name */}
            <div className="flex-1 min-w-0 flex items-center gap-2.5">
               <Avatar className="size-8 shrink-0">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
               </Avatar>
               <div className="flex flex-col items-start overflow-hidden">
                  <span className="font-medium truncate w-full">
                     {showEmailAsName ? user.email : displayNameOf(user)}
                  </span>
                  <span className="text-xs text-muted-foreground truncate w-full">{user.name}</span>
               </div>
            </div>

            {/* Status (role) */}
            <div className="w-[110px] shrink-0" onClick={stopRowClick} onPointerDown={stopRowPointer}>
               {isApplication ? (
                  <span className="text-xs text-muted-foreground">Application</span>
               ) : canManage ? (
                  <DropdownMenu>
                     <DropdownMenuTrigger
                        className={cn(
                           'inline-flex items-center text-xs border rounded-md px-1.5 py-0.5 outline-none hover:bg-accent/60',
                           role === OrgRole.ADMIN
                              ? 'text-indigo-500 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/5'
                              : 'text-muted-foreground',
                        )}
                     >
                        {roleLabel}
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="start" className="min-w-32">
                        {([OrgRole.ADMIN, OrgRole.EMPLOYEE] as const).map((next) => (
                           <DropdownMenuItem
                              key={next}
                              disabled={!canDemote && next === OrgRole.EMPLOYEE}
                              onClick={() => {
                                 if (next === role) return;
                                 onRoleChange(next);
                              }}
                              className="flex items-center gap-2 text-sm"
                           >
                              <span className="flex-1">{OrgRoleLabel[next]}</span>
                              {role === next && <Check className="size-3.5" />}
                           </DropdownMenuItem>
                        ))}
                     </DropdownMenuContent>
                  </DropdownMenu>
               ) : (
                  <span
                     className={cn(
                        'inline-flex items-center text-xs border rounded-md px-1.5 py-0.5',
                        role === OrgRole.ADMIN
                           ? 'text-indigo-500 dark:text-indigo-400 border-indigo-500/30 bg-indigo-500/5'
                           : 'text-muted-foreground',
                     )}
                  >
                     {roleLabel}
                  </span>
               )}
            </div>

            {/* Joined */}
            <div className="hidden lg:block w-[100px] shrink-0 text-xs text-muted-foreground">
               {formatJoinedLabel(user.joinedDate)}
            </div>

            {/* Teams */}
            <div className="hidden md:flex w-[170px] shrink-0 items-center gap-1.5 text-xs text-muted-foreground min-w-0">
               {user.teamIds.length > 0 && (
                  <>
                     <SquareUser className="size-3.5 shrink-0" />
                     <span className="truncate">
                        {user.teamIds.slice(0, 2).join(', ')}
                        {user.teamIds.length > 2 && ` +${user.teamIds.length - 2}`}
                     </span>
                  </>
               )}
            </div>

            {/* Last seen (Linear only shows currently-online members) */}
            <div className="hidden sm:flex w-[90px] shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
               {user.status === 'online' && !isApplication && (
                  <>
                     <span className="size-1.5 rounded-full bg-[#00cc66]" />
                     Online
                  </>
               )}
            </div>

            {canManage && (
               <div
                  className="w-8 shrink-0 flex justify-end"
                  onClick={stopRowClick}
                  onPointerDown={stopRowPointer}
               >
                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button
                           size="icon"
                           variant="ghost"
                           className="size-7"
                           aria-label={`Member actions for ${user.name}`}
                        >
                           <MoreHorizontal className="size-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end">
                        <DropdownMenuItem
                           disabled={isLastAdmin}
                           className="text-red-500 focus:text-red-500"
                           onClick={() => {
                              if (isLastAdmin) return;
                              setConfirmRemove(true);
                           }}
                        >
                           Remove
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            )}
         </Link>

         <AlertDialog open={confirmRemove} onOpenChange={setConfirmRemove}>
            <AlertDialogContent>
               <AlertDialogHeader>
                  <AlertDialogTitle>Remove {user.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                     They will lose access to this workspace. This does not delete their account.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                     onClick={() => {
                        onRemove();
                        setConfirmRemove(false);
                     }}
                  >
                     Remove
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </>
   );
}
