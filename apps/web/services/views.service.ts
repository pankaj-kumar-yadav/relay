import { api } from '@/lib/api';
import type { IssueListQuery } from '@/services/issues.service';

export type ViewFilters = Omit<IssueListQuery, 'cursor' | 'limit'>;

export type ApiViewOwner = {
  id: string;
  name: string;
};

export type ApiView = {
  id: string;
  slug: string;
  name: string;
  filters: ViewFilters;
  ownerId: string;
  owner: ApiViewOwner;
  createdAt: string;
  updatedAt: string;
};

export type CreateViewInput = {
  name: string;
  filters?: ViewFilters;
};

export type PatchViewInput = {
  name?: string;
  filters?: ViewFilters;
};

export async function listViewsApi(orgSlug: string) {
  return api<{ views: ApiView[] }>(`/orgs/${orgSlug}/views`);
}

export async function getViewApi(orgSlug: string, viewSlug: string) {
  return api<{ view: ApiView }>(`/orgs/${orgSlug}/views/${viewSlug}`);
}

export async function createViewApi(orgSlug: string, input: CreateViewInput) {
  return api<{ view: ApiView }>(`/orgs/${orgSlug}/views`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function patchViewApi(
  orgSlug: string,
  viewSlug: string,
  input: PatchViewInput,
) {
  return api<{ view: ApiView }>(`/orgs/${orgSlug}/views/${viewSlug}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteViewApi(orgSlug: string, viewSlug: string) {
  return api<{ id: string }>(`/orgs/${orgSlug}/views/${viewSlug}`, {
    method: 'DELETE',
  });
}
