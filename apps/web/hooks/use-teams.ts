'use client';

import { queryKeys } from '@/lib/query-keys';
import { listTeamsApi } from '@/services/teams.service';
import { useQuery } from '@tanstack/react-query';

export function useTeams(orgSlug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teams(orgSlug ?? ''),
    queryFn: async () => {
      const { teams } = await listTeamsApi(orgSlug!);
      return teams;
    },
    enabled: Boolean(orgSlug),
  });
}
