'use client';

import { queryKeys } from '@/lib/query-keys';
import {
  createViewApi,
  deleteViewApi,
  getViewApi,
  listViewsApi,
  patchViewApi,
  type CreateViewInput,
  type PatchViewInput,
} from '@/services/views.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export function useViews(orgSlug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.views.list(orgSlug ?? ''),
    queryFn: async () => {
      const { views } = await listViewsApi(orgSlug!);
      return views;
    },
    enabled: Boolean(orgSlug),
  });
}

export function useView(orgSlug: string | undefined, viewSlug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.views.detail(orgSlug ?? '', viewSlug ?? ''),
    queryFn: async () => {
      const { view } = await getViewApi(orgSlug!, viewSlug!);
      return view;
    },
    enabled: Boolean(orgSlug && viewSlug),
  });
}

export function useCreateView() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateViewInput) => {
      if (!orgSlug) throw new Error('No organization selected');
      return createViewApi(orgSlug, input);
    },
    onSuccess: () => {
      if (orgSlug) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.views.all(orgSlug) });
      }
    },
  });
}

export function usePatchView() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ viewSlug, input }: { viewSlug: string; input: PatchViewInput }) => {
      if (!orgSlug) throw new Error('No organization selected');
      return patchViewApi(orgSlug, viewSlug, input);
    },
    onSuccess: (_data, vars) => {
      if (!orgSlug) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.views.all(orgSlug) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.views.detail(orgSlug, vars.viewSlug),
      });
    },
  });
}

export function useDeleteView() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (viewSlug: string) => {
      if (!orgSlug) throw new Error('No organization selected');
      return deleteViewApi(orgSlug, viewSlug);
    },
    onSuccess: () => {
      if (orgSlug) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.views.all(orgSlug) });
      }
    },
  });
}
