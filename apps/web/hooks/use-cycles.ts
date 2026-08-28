'use client';

import { queryKeys } from '@/lib/query-keys';
import {
  createCycleApi,
  listCyclesApi,
  patchCycleApi,
  type CreateCycleInput,
  type PatchCycleInput,
} from '@/services/cycles.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export function useCycles(orgSlug: string | undefined, teamId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.cycles(orgSlug ?? '', teamId ?? ''),
    queryFn: async () => {
      const { cycles } = await listCyclesApi(orgSlug!, teamId!);
      return cycles;
    },
    enabled: Boolean(orgSlug && teamId),
  });
}

export function useCreateCycle() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateCycleInput) => {
      if (!orgId || !teamId) throw new Error('No team selected');
      return createCycleApi(orgId, teamId, input);
    },
    onSuccess: () => {
      if (orgId && teamId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.cycles(orgId, teamId) });
      }
    },
  });
}

export function usePatchCycle() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cycleId, input }: { cycleId: string; input: PatchCycleInput }) => {
      if (!orgId || !teamId) throw new Error('No team selected');
      return patchCycleApi(orgId, teamId, cycleId, input);
    },
    onSuccess: () => {
      if (orgId && teamId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.cycles(orgId, teamId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(orgId) });
      }
    },
  });
}
