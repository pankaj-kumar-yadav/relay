'use client';

import { teamCyclesPath, teamOverviewPath } from '@/constants/team.constant';
import { CyclePlayIcon } from '@/components/common/cycles/cycle-line';
import { TeamEmojiButton } from '@/components/common/teams/team-icon-picker';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CycleStatus } from '@/constants/cycle.constant';
import { useCycles } from '@/hooks/use-cycles';
import { useTeam } from '@/hooks/use-teams';
import { ChevronRight, MoreHorizontal, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CycleView } from '@/components/common/issues/cycle-issues';

export default function HeaderNav({ cycleView }: { cycleView: CycleView }) {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const { data: team } = useTeam(orgId, teamId);
   const { data: cycles = [] } = useCycles(orgId, teamId);
   const wanted = cycleView === 'active' ? CycleStatus.ACTIVE : CycleStatus.UPCOMING;
   const cycle = cycles.find((item) => item.status === wanted);

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger />
            {team ? (
               <TeamEmojiButton
                  teamId={team.id}
                  icon={team.icon}
                  teamKey={team.key}
                  className="size-5 text-xs"
               />
            ) : null}
            <Link
               href={teamOverviewPath(orgId, teamId)}
               className="min-w-0 hover:opacity-80"
            >
               <span className="text-sm font-medium truncate">{team?.name ?? teamId}</span>
            </Link>
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            <Link
               href={teamCyclesPath(orgId, teamId)}
               className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
               Cycles
            </Link>
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
               <CyclePlayIcon className="size-3.5" />
               <span className="text-sm font-medium truncate">{cycle?.name ?? 'Cycle'}</span>
            </div>
            <Star className="size-3.5 text-muted-foreground shrink-0 ml-1" />
            <MoreHorizontal className="size-3.5 text-muted-foreground shrink-0" />
         </div>
      </div>
   );
}
