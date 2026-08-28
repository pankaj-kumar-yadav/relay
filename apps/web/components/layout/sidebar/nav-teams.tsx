'use client';

import { teamCyclesPath, teamHomePath, teamOverviewPath } from '@/constants/team.constant';
import { CyclePlayIcon } from '@/components/common/cycles/cycle-line';
import { TeamEmojiButton } from '@/components/common/teams/team-icon-picker';
import { ChevronRight, CopyMinus, Home, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuAction,
   SidebarMenuButton,
   SidebarMenuItem,
   SidebarMenuSub,
   SidebarMenuSubButton,
   SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useTeams } from '@/hooks/use-teams';

export function NavTeams() {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: teams = [] } = useTeams(orgId);

   return (
      <SidebarGroup>
         <SidebarGroupLabel>Your teams</SidebarGroupLabel>
         <SidebarMenu>
            {teams.map((item, index) => (
               <Collapsible
                  key={item.id}
                  asChild
                  defaultOpen={index === 0}
                  className="group/collapsible"
               >
                  <SidebarMenuItem>
                     <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.name}>
                           <TeamEmojiButton
                              teamId={item.id}
                              icon={item.icon}
                              teamKey={item.key}
                           />
                           <span className="text-sm">{item.name}</span>
                           <span className="w-3 shrink-0">
                              <ChevronRight className="w-full transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                           </span>
                           <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                 <SidebarMenuAction asChild showOnHover>
                                    <div>
                                       <MoreHorizontal />
                                       <span className="sr-only">More</span>
                                    </div>
                                 </SidebarMenuAction>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                 className="w-48 rounded-lg"
                                 side="right"
                                 align="start"
                              >
                                 <DropdownMenuItem asChild>
                                    <Link href={teamOverviewPath(orgId, item.key)}>
                                       Team home
                                    </Link>
                                 </DropdownMenuItem>
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </SidebarMenuButton>
                     </CollapsibleTrigger>
                     <CollapsibleContent>
                        <SidebarMenuSub>
                           <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                 <Link href={teamOverviewPath(orgId, item.key)}>
                                    <Home size={14} />
                                    <span>Home</span>
                                 </Link>
                              </SidebarMenuSubButton>
                           </SidebarMenuSubItem>
                           <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                 <Link href={teamHomePath(orgId, item.key)}>
                                    <CopyMinus size={14} />
                                    <span>Issues</span>
                                 </Link>
                              </SidebarMenuSubButton>
                           </SidebarMenuSubItem>
                           <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild>
                                 <Link href={teamCyclesPath(orgId, item.key)}>
                                    <CyclePlayIcon className="size-3.5" />
                                    <span>Cycles</span>
                                 </Link>
                              </SidebarMenuSubButton>
                           </SidebarMenuSubItem>
                        </SidebarMenuSub>
                     </CollapsibleContent>
                  </SidebarMenuItem>
               </Collapsible>
            ))}
         </SidebarMenu>
      </SidebarGroup>
   );
}
