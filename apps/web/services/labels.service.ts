import { api } from '@/lib/api';
import type { ApiIssue } from '@/services/issues.service';

export type ApiLabel = {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  issueCount: number;
};

export type ApiIssueLabel = {
  id: string;
  name: string;
  color: string;
};

export type CreateLabelInput = {
  name: string;
  color?: string;
};

export type PatchLabelInput = {
  name?: string;
  color?: string;
};

export async function listLabelsApi(orgSlug: string) {
  return api<{ labels: ApiLabel[] }>(`/orgs/${orgSlug}/labels`);
}

export async function createLabelApi(orgSlug: string, input: CreateLabelInput) {
  return api<{ label: ApiLabel }>(`/orgs/${orgSlug}/labels`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function patchLabelApi(
  orgSlug: string,
  labelId: string,
  input: PatchLabelInput,
) {
  return api<{ label: ApiLabel }>(`/orgs/${orgSlug}/labels/${labelId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteLabelApi(orgSlug: string, labelId: string) {
  return api<{ id: string }>(`/orgs/${orgSlug}/labels/${labelId}`, {
    method: 'DELETE',
  });
}

export async function setIssueLabelsApi(
  orgSlug: string,
  issueId: string,
  labelIds: string[],
) {
  return api<{ issue: ApiIssue }>(`/orgs/${orgSlug}/issues/${issueId}/labels`, {
    method: 'PUT',
    body: JSON.stringify({ labelIds }),
  });
}
