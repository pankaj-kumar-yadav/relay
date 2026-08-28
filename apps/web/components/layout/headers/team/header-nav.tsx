'use client';

import { TeamEmojiButton } from '@/components/common/teams/team-icon-picker';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTeam } from '@/hooks/use-teams';
import { Link2, MoreHorizontal, Star } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function HeaderNav() {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const { data: team } = useTeam(orgId, teamId);

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
            <span className="text-sm font-medium truncate">{team?.name ?? teamId}</span>
            <Star className="size-3.5 text-muted-foreground shrink-0 ml-1" />
            <MoreHorizontal className="size-3.5 text-muted-foreground shrink-0" />
         </div>
         <Link2 className="size-4 text-muted-foreground shrink-0" />
      </div>
   );
}
