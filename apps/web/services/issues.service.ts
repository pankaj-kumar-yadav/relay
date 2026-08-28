import type {
  IssuePriorityValue,
  IssueStatusValue,
} from '@/constants/issue.constant';
import { api } from '@/lib/api';

export type ApiAssignee = {
  id: string;
  name: string;
  email: string;
} | null;

export type ApiIssue = {
  id: string;
  identifier: string;
  number: number;
  title: string;
  description: string | null;
  status: IssueStatusValue;
  priority: IssuePriorityValue;
  rank: string;
  projectId: string | null;
  project: { id: string; name: string } | null;
  team: { id: string; key: string; name: string; icon: string };
  assignee: ApiAssignee;
  labels: { id: string; name: string; color: string }[];
  cycleId: string | null;
  cycle: { id: string; name: string; status: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type IssueListQuery = {
  teamId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  projectId?: string;
  q?: string;
  statusCategory?: string;
  cycleId?: string;
  cursor?: string;
  limit?: number;
};

export type CreateIssueInput = {
  title: string;
  description?: string | null;
  status?: IssueStatusValue;
  priority?: IssuePriorityValue;
  assigneeId?: string | null;
  teamId?: string;
  projectId?: string | null;
  labelIds?: string[];
  cycleId?: string | null;
};

export type PatchIssueInput = {
  title?: string;
  description?: string | null;
  status?: IssueStatusValue;
  priority?: IssuePriorityValue;
  assigneeId?: string | null;
  rank?: string;
  beforeIssueId?: string;
  afterIssueId?: string;
  teamId?: string;
  projectId?: string | null;
  cycleId?: string | null;
};

function toQuery(params: IssueListQuery) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listIssuesApi(orgSlug: string, query: IssueListQuery = {}) {
  return api<{ issues: ApiIssue[]; nextCursor: string | null }>(
    `/orgs/${orgSlug}/issues${toQuery(query)}`,
  );
}

export async function getIssueApi(orgSlug: string, issueId: string) {
  return api<{ issue: ApiIssue }>(`/orgs/${orgSlug}/issues/${issueId}`);
}

export async function createIssueApi(orgSlug: string, input: CreateIssueInput) {
  return api<{ issue: ApiIssue }>(`/orgs/${orgSlug}/issues`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function patchIssueApi(orgSlug: string, issueId: string, input: PatchIssueInput) {
  return api<{ issue: ApiIssue }>(`/orgs/${orgSlug}/issues/${issueId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteIssueApi(orgSlug: string, issueId: string) {
  return api<{ id: string }>(`/orgs/${orgSlug}/issues/${issueId}`, {
    method: 'DELETE',
  });
}

export type ApiIssueReaction = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export async function listIssueReactionsApi(orgSlug: string, issueId: string) {
  return api<{ reactions: ApiIssueReaction[] }>(
    `/orgs/${orgSlug}/issues/${issueId}/reactions`,
  );
}

export async function toggleIssueReactionApi(
  orgSlug: string,
  issueId: string,
  emoji: string,
) {
  return api<{ reactions: ApiIssueReaction[] }>(
    `/orgs/${orgSlug}/issues/${issueId}/reactions`,
    {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    },
  );
}
