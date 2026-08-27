'use client';

import { queryKeys } from '@/lib/query-keys';
import {
  createLabelApi,
  deleteLabelApi,
  listLabelsApi,
  patchLabelApi,
  type CreateLabelInput,
  type PatchLabelInput,
} from '@/services/labels.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export function useLabels(orgSlug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.labels(orgSlug ?? ''),
    queryFn: async () => {
      const { labels } = await listLabelsApi(orgSlug!);
      return labels;
    },
    enabled: Boolean(orgSlug),
  });
}

export function useCreateLabel() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLabelInput) => {
      if (!orgSlug) throw new Error('No organization selected');
      return createLabelApi(orgSlug, input);
    },
    onSuccess: () => {
      if (orgSlug) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.labels(orgSlug) });
      }
    },
  });
}

export function usePatchLabel() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ labelId, input }: { labelId: string; input: PatchLabelInput }) => {
      if (!orgSlug) throw new Error('No organization selected');
      return patchLabelApi(orgSlug, labelId, input);
    },
    onSuccess: () => {
      if (!orgSlug) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.labels(orgSlug) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(orgSlug) });
    },
  });
}

export function useDeleteLabel() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (labelId: string) => {
      if (!orgSlug) throw new Error('No organization selected');
      return deleteLabelApi(orgSlug, labelId);
    },
    onSuccess: () => {
      if (!orgSlug) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.labels(orgSlug) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(orgSlug) });
    },
  });
}
