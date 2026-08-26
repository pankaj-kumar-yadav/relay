'use client';

import { CreateProjectButton } from '@/components/common/projects/create-project-modal';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTeams } from '@/hooks/use-teams';
import { ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function Header() {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const { data: teams = [] } = useTeams(orgId);
   const team = teams.find((item) => item.key === teamId);

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger />
            <Link
               href={`/${orgId}/team/${teamId}/overview`}
               className="flex items-center gap-1.5 min-w-0 hover:opacity-80"
            >
               <div className="inline-flex size-5 bg-muted/50 items-center justify-center rounded shrink-0 text-xs">
                  {(team?.key ?? teamId).slice(0, 1)}
               </div>
               <span className="text-sm font-medium truncate">{team?.name ?? teamId}</span>
            </Link>
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">Projects</span>
            <Star className="size-3.5 text-muted-foreground shrink-0 ml-1" />
         </div>
         <CreateProjectButton defaultTeamKey={teamId} />
      </div>
   );
}
