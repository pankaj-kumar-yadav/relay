'use client';

import { ChevronsUpDown } from 'lucide-react';

import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuPortal,
   DropdownMenuSeparator,
   DropdownMenuShortcut,
   DropdownMenuSub,
   DropdownMenuSubContent,
   DropdownMenuSubTrigger,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { CreateNewIssue } from './create-new-issue';
import { ThemeToggle } from '../theme-toggle';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useLogout } from '@/hooks/use-session';
import { useOrgs } from '@/hooks/use-orgs';
import { useTeams } from '@/hooks/use-teams';
import { AppRoute } from '@/constants/auth.constant';
import { membersPath, settingsPath } from '@/constants/org.constant';
import { DEFAULT_TEAM_KEY, teamHomePath } from '@/constants/team.constant';

function initials(name: string) {
   return name
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
}

export function OrgSwitcher() {
   const router = useRouter();
   const { orgId } = useParams<{ orgId: string }>();
   const { data: teams = [] } = useTeams(orgId);
   const { data: orgs = [] } = useOrgs();
   const logout = useLogout();

   const current = orgs.find((org) => org.slug === orgId) ?? orgs[0];
   const defaultTeamKey = teams[0]?.key ?? DEFAULT_TEAM_KEY;

   async function handleLogout() {
      try {
         await logout.mutateAsync();
      } catch {
         // still leave the UI even if the API call fails
      }
      router.push(AppRoute.LOGIN);
   }

   return (
      <SidebarMenu>
         <SidebarMenuItem>
            <DropdownMenu>
               <div className="w-full flex gap-1 items-center pt-2">
                  <DropdownMenuTrigger asChild>
                     <SidebarMenuButton
                        size="lg"
                        className="h-8 p-1 data-[state-open]:bg-sidebar-accent data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                     >
                        <div className="flex aspect-square size-6 items-center justify-center rounded bg-orange-500 text-sidebar-primary-foreground text-xs font-semibold">
                           {current ? initials(current.name) : 'R'}
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                           <span className="truncate font-semibold">
                              {current?.name ?? 'Workspace'}
                           </span>
                        </div>
                        <ChevronsUpDown className="ml-auto" />
                     </SidebarMenuButton>
                  </DropdownMenuTrigger>

                  <ThemeToggle />

                  <CreateNewIssue />
               </div>
               <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-60 rounded-lg"
                  side="bottom"
                  align="end"
                  sideOffset={4}
               >
                  <DropdownMenuGroup>
                     <DropdownMenuItem asChild>
                        <Link href={settingsPath(orgId)}>
                           Settings
                           <DropdownMenuShortcut>G then S</DropdownMenuShortcut>
                        </Link>
                     </DropdownMenuItem>
                     <DropdownMenuItem asChild>
                        <Link href={membersPath(orgId)}>Invite and manage members</Link>
                     </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                     <DropdownMenuSubTrigger>Switch Workspace</DropdownMenuSubTrigger>
                     <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                           <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                           <DropdownMenuSeparator />
                           {orgs.map((org) => (
                              <DropdownMenuItem key={org.id} asChild>
                                 <Link href={teamHomePath(org.slug, defaultTeamKey)}>
                                    <div className="flex aspect-square size-6 items-center justify-center rounded bg-orange-500 text-sidebar-primary-foreground text-xs font-semibold">
                                       {initials(org.name)}
                                    </div>
                                    {org.name}
                                 </Link>
                              </DropdownMenuItem>
                           ))}
                           <DropdownMenuSeparator />
                           <DropdownMenuItem asChild>
                              <Link href={AppRoute.NEW}>Create workspace</Link>
                           </DropdownMenuItem>
                        </DropdownMenuSubContent>
                     </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuItem onSelect={handleLogout}>
                     Log out
                     <DropdownMenuShortcut>⌥⇧Q</DropdownMenuShortcut>
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>
         </SidebarMenuItem>
      </SidebarMenu>
   );
}
