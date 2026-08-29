'use client';

import { mapApiProject } from '@/lib/mappers';
import { queryKeys } from '@/lib/query-keys';
import {
  createProjectApi,
  deleteProjectApi,
  getProjectApi,
  listProjectsApi,
  patchProjectApi,
  type CreateProjectInput,
  type PatchProjectInput,
  type ProjectListQuery,
} from '@/services/projects.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export function useProjects(orgSlug: string | undefined, query: ProjectListQuery = {}) {
  return useQuery({
    queryKey: queryKeys.projects.list(orgSlug ?? '', query.teamId),
    queryFn: async () => {
      const { projects } = await listProjectsApi(orgSlug!, query);
      return projects.map(mapApiProject);
    },
    enabled: Boolean(orgSlug),
  });
}

export function useProject(orgSlug: string | undefined, projectId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.projects.detail(orgSlug ?? '', projectId ?? ''),
    queryFn: async () => {
      const { project } = await getProjectApi(orgSlug!, projectId!);
      return mapApiProject(project);
    },
    enabled: Boolean(orgSlug && projectId),
  });
}

export function useCreateProject() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => {
      if (!orgSlug) throw new Error('No organization selected');
      return createProjectApi(orgSlug, input);
    },
    onSuccess: () => {
      if (orgSlug) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(orgSlug) });
      }
    },
  });
}

export function usePatchProject() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      input,
    }: {
      projectId: string;
      input: PatchProjectInput;
    }) => {
      if (!orgSlug) throw new Error('No organization selected');
      return patchProjectApi(orgSlug, projectId, input);
    },
    onSuccess: (_data, vars) => {
      if (!orgSlug) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(orgSlug) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(orgSlug, vars.projectId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(orgSlug) });
    },
  });
}

export function useDeleteProject() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => {
      if (!orgSlug) throw new Error('No organization selected');
      return deleteProjectApi(orgSlug, projectId);
    },
    onSuccess: (_data, projectId) => {
      if (!orgSlug) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects.all(orgSlug) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(orgSlug, projectId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(orgSlug) });
    },
  });
}
