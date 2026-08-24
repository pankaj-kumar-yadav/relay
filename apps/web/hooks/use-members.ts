'use client';

import { queryKeys } from '@/lib/query-keys';
import { listMembersApi } from '@/services/members.service';
import { useQuery } from '@tanstack/react-query';

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
