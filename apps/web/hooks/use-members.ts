'use client';

import type { OrgRoleValue } from '@/constants/org.constant';
import { queryKeys } from '@/lib/query-keys';
import {
  deleteMemberApi,
  listMembersApi,
  patchMemberApi,
} from '@/services/members.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export function useMembers(orgSlug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.members(orgSlug ?? ''),
    queryFn: async () => {
      const { members } = await listMembersApi(orgSlug!);
      return members;
    },
    enabled: Boolean(orgSlug),
  });
}

export function usePatchMember() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrgRoleValue }) => {
      if (!orgSlug) throw new Error('No organization selected');
      return patchMemberApi(orgSlug, userId, { role });
    },
    onSuccess: () => {
      if (!orgSlug) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.members(orgSlug) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orgs });
    },
  });
}

export function useDeleteMember() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => {
      if (!orgSlug) throw new Error('No organization selected');
      return deleteMemberApi(orgSlug, userId);
    },
    onSuccess: () => {
      if (!orgSlug) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.members(orgSlug) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.orgs });
    },
  });
}
