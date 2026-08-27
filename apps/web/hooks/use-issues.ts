'use client';

import { mapApiIssue } from '@/lib/mappers';
import { queryKeys } from '@/lib/query-keys';
import type { Issue } from '@/mock-data/issues';
import type { Priority } from '@/mock-data/priorities';
import type { Status } from '@/mock-data/status';
import type { User } from '@/mock-data/users';
import {
  createIssueApi,
  getIssueApi,
  listIssuesApi,
  patchIssueApi,
  type CreateIssueInput,
  type IssueListQuery,
  type PatchIssueInput,
} from '@/services/issues.service';
import { setIssueLabelsApi } from '@/services/labels.service';
import type { LabelInterface } from '@/mock-data/labels';
import { useIssuesStore } from '@/store/issues-store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export function useIssuesList(orgSlug: string | undefined, query: IssueListQuery = {}) {
  const setIssues = useIssuesStore((s) => s.setIssues);
  const result = useQuery({
    queryKey: queryKeys.issues.list(orgSlug ?? '', query),
    queryFn: async () => {
      const { issues } = await listIssuesApi(orgSlug!, query);
      return issues.map(mapApiIssue);
    },
    enabled: Boolean(orgSlug),
  });

  useEffect(() => {
    if (result.data) setIssues(result.data);
  }, [result.data, setIssues]);

  return result;
}

export function useIssue(orgSlug: string | undefined, issueId: string | undefined) {
  const addIssue = useIssuesStore((s) => s.addIssue);
  const existing = useIssuesStore((s) =>
    issueId
      ? s.issues.find((item) => item.identifier === issueId || item.id === issueId)
      : undefined,
  );
  const result = useQuery({
    queryKey: queryKeys.issues.detail(orgSlug ?? '', issueId ?? ''),
    queryFn: async () => {
      const { issue } = await getIssueApi(orgSlug!, issueId!);
      return mapApiIssue(issue);
    },
    enabled: Boolean(orgSlug && issueId) && !existing,
  });

  useEffect(() => {
    if (result.data) addIssue(result.data);
  }, [result.data, addIssue]);

  return {
    ...result,
    data: existing ?? result.data,
    isLoading: !existing && result.isLoading,
  };
}

export function useCreateIssue() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const addIssue = useIssuesStore((s) => s.addIssue);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateIssueInput) => {
      if (!orgSlug) throw new Error('No organization selected');
      return createIssueApi(orgSlug, input);
    },
    onSuccess: ({ issue }) => {
      addIssue(mapApiIssue(issue));
      if (orgSlug) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(orgSlug) });
      }
    },
  });
}

export function useIssueMutations() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();
  const updateIssue = useIssuesStore((s) => s.updateIssue);

  const patch = useMutation({
    mutationFn: ({ issueId, input }: { issueId: string; input: PatchIssueInput }) => {
      if (!orgSlug) throw new Error('No organization selected');
      return patchIssueApi(orgSlug, issueId, input);
    },
    onSettled: (_data, _error, vars) => {
      if (!orgSlug) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(orgSlug) });
      if (vars?.issueId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.issues.detail(orgSlug, vars.issueId),
        });
      }
    },
  });

  const setLabels = useMutation({
    mutationFn: ({ issueId, labelIds }: { issueId: string; labelIds: string[] }) => {
      if (!orgSlug) throw new Error('No organization selected');
      return setIssueLabelsApi(orgSlug, issueId, labelIds);
    },
    onSettled: (_data, _error, vars) => {
      if (!orgSlug) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.issues.all(orgSlug) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.labels(orgSlug) });
      if (vars?.issueId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.issues.detail(orgSlug, vars.issueId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.issues.activity(orgSlug, vars.issueId),
        });
      }
    },
  });

  return {
    updateIssueStatus: (issueId: string, status: Status) => {
      updateIssue(issueId, { status });
      patch.mutate({ issueId, input: { status: status.id } });
    },
    updateIssuePriority: (issueId: string, priority: Priority) => {
      updateIssue(issueId, { priority });
      patch.mutate({ issueId, input: { priority: priority.id } });
    },
    updateIssueAssignee: (issueId: string, assignee: User | null) => {
      updateIssue(issueId, { assignee });
      patch.mutate({ issueId, input: { assigneeId: assignee?.id ?? null } });
    },
    updateIssueProject: (issueId: string, project: Issue['project']) => {
      updateIssue(issueId, { project });
      patch.mutate({ issueId, input: { projectId: project?.id ?? null } });
    },
    updateIssueTeam: (issueId: string, teamId: string) => {
      patch.mutate({ issueId, input: { teamId } });
    },
    patchIssueFields: (issueId: string, fields: Partial<Issue>, input: PatchIssueInput) => {
      updateIssue(issueId, fields);
      patch.mutate({ issueId, input });
    },
    updateIssueLabels: (issueId: string, labels: LabelInterface[]) => {
      updateIssue(issueId, { labels });
      setLabels.mutate({ issueId, labelIds: labels.map((label) => label.id) });
    },
  };
}
