'use client';

import { queryKeys } from '@/lib/query-keys';
import { createOrgApi, listOrgsApi, resolveHomePathApi } from '@/services/orgs.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useOrgs() {
  return useQuery({
    queryKey: queryKeys.orgs,
    queryFn: async () => {
      const { organizations } = await listOrgsApi();
      return organizations;
    },
  });
}

export function useCreateOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createOrgApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orgs });
    },
  });
}

export function useResolveHomePath() {
  return useMutation({
    mutationFn: resolveHomePathApi,
  });
}
