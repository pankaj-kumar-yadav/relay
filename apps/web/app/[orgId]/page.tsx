'use client';

import { useTeams } from '@/hooks/use-teams';
import { DEFAULT_TEAM_KEY, teamHomePath } from '@/constants/team.constant';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OrgIdPage() {
   const { orgId } = useParams<{ orgId: string }>();
   const router = useRouter();
   const { data: teams, isFetched } = useTeams(orgId);

   useEffect(() => {
      if (!orgId || !isFetched) return;
      const key = teams?.[0]?.key ?? DEFAULT_TEAM_KEY;
      router.replace(teamHomePath(orgId, key));
   }, [orgId, isFetched, teams, router]);

   return <div className="h-full" />;
}
