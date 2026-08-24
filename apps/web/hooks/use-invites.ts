'use client';

import type { OrgRoleValue } from '@/constants/org.constant';
import { queryKeys } from '@/lib/query-keys';
import { acceptInviteApi, createInviteApi } from '@/services/invites.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateInvite(orgSlug: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role?: OrgRoleValue }) =>
      createInviteApi(orgSlug!, input),
    onSuccess: () => {
      if (orgSlug) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.members(orgSlug) });
      }
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptInviteApi,
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.orgs });
      void queryClient.invalidateQueries({ queryKey: queryKeys.teams(data.organization.slug) });
    },
  });
}
