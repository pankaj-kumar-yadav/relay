'use client';

import Link from 'next/link';
import { PlusIcon } from 'lucide-react';

import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import { settingsNewTeamPath, settingsTeamPath } from '@/constants/org.constant';
import { Button } from '@/components/ui/button';
import { useTeams } from '@/hooks/use-teams';
import { useParams } from 'next/navigation';

export function NavTeamsSettings() {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: teams = [] } = useTeams(orgId);
   return (
      <SidebarGroup>
         <SidebarGroupLabel>Your teams</SidebarGroupLabel>
         <SidebarMenu>
            {teams.map((team) => (
               <SidebarMenuItem key={team.id}>
                  <SidebarMenuButton asChild>
                     <Link href={settingsTeamPath(orgId, team.key)}>
                        <div className="inline-flex size-6 bg-muted/50 items-center justify-center rounded shrink-0">
                           <div className="text-sm">{team.icon}</div>
                        </div>
                        <span>{team.name}</span>
                     </Link>
                  </SidebarMenuButton>
               </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
               <SidebarMenuButton asChild>
                  <Button variant="ghost" className="w-full justify-start gap-2 px-2" asChild>
                     <Link href={settingsNewTeamPath(orgId)}>
                        <PlusIcon className="size-4" />
                        <span>Join or create a team</span>
                     </Link>
                  </Button>
               </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarGroup>
   );
}
