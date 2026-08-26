'use client';

import { queryKeys } from '@/lib/query-keys';
import {
  createTeamApi,
  getTeamApi,
  listTeamsApi,
  patchTeamApi,
  type CreateTeamInput,
  type PatchTeamInput,
} from '@/services/teams.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

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

export function useTeam(orgSlug: string | undefined, teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.team(orgSlug ?? '', teamId ?? ''),
    queryFn: async () => {
      const { team } = await getTeamApi(orgSlug!, teamId!);
      return team;
    },
    enabled: Boolean(orgSlug && teamId),
  });
}

export function useCreateTeam() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTeamInput) => {
      if (!orgSlug) throw new Error('No organization selected');
      return createTeamApi(orgSlug, input);
    },
    onSuccess: () => {
      if (orgSlug) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.teams(orgSlug) });
      }
    },
  });
}

export function usePatchTeam() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, input }: { teamId: string; input: PatchTeamInput }) => {
      if (!orgSlug) throw new Error('No organization selected');
      return patchTeamApi(orgSlug, teamId, input);
    },
    onSuccess: (_data, vars) => {
      if (!orgSlug) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.teams(orgSlug) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.team(orgSlug, vars.teamId),
      });
    },
  });
}
