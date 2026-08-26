'use client';

import { teamOverviewPath } from '@/constants/team.constant';
import { Team } from '@/mock-data/teams';
import { useTeams } from '@/hooks/use-teams';
import { useMemo } from 'react';
import TeamLine from './team-line';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function Teams() {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: apiTeams = [] } = useTeams(orgId);

   const displayed = useMemo<Team[]>(
      () =>
         apiTeams.map((team) => ({
            id: team.key,
            name: team.name,
            icon: '🛠️',
            joined: true,
            color: '#FF0000',
            members: [],
            projects: [],
         })),
      [apiTeams],
   );

   return (
      <div className="w-full">
         <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10 sticky top-0 bg-container z-20">
            <span className="text-sm text-muted-foreground">
               {displayed.length} {displayed.length === 1 ? 'team' : 'teams'}
            </span>
         </div>
         <div className="w-full">
            {displayed.map((team) => (
               <Link key={team.id} href={teamOverviewPath(orgId, team.id)} className="block">
                  <TeamLine team={team} />
               </Link>
            ))}
         </div>
      </div>
   );
}
