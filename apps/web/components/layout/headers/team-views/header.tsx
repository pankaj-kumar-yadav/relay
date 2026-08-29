'use client';

import { CreateViewButton } from '@/components/common/views/create-view-dialog';
import { teamOverviewPath } from '@/constants/team.constant';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTeam } from '@/hooks/use-teams';
import { ChevronRight, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function Header() {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const { data: team } = useTeam(orgId, teamId);

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger />
            <Link
               href={teamOverviewPath(orgId, teamId)}
               className="flex items-center gap-1.5 min-w-0 hover:opacity-80"
            >
               <div className="inline-flex size-5 bg-muted/50 items-center justify-center rounded shrink-0 text-xs">
                  {team?.icon || (team?.key ?? teamId).slice(0, 1)}
               </div>
               <span className="text-sm font-medium truncate">{team?.name ?? teamId}</span>
            </Link>
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Views</span>
            <Star className="size-3.5 text-muted-foreground shrink-0 ml-1" />
         </div>
         <CreateViewButton
            defaultTeamId={team?.id}
            trigger={
               <Button size="xs" variant="ghost">
                  <Plus className="size-4" />
               </Button>
            }
         />
      </div>
   );
}
