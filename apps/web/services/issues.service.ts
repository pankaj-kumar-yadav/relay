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
  status: string;
  priority: string;
  rank: string;
  projectId: string | null;
  team: { id: string; key: string; name: string };
  assignee: ApiAssignee;
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
  cursor?: string;
  limit?: number;
};

export type CreateIssueInput = {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  teamId?: string;
};

export type PatchIssueInput = {
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  rank?: string;
  beforeIssueId?: string;
  afterIssueId?: string;
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
