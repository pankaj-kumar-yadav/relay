import { api } from '@/lib/api';
import type { TeamSummary } from '@/services/teams.service';

export type ApiProject = {
  id: string;
  name: string;
  status: string;
  health: string;
  startDate: string | null;
  targetDate: string | null;
  team: TeamSummary;
  createdAt: string;
  updatedAt: string;
};

export type ProjectListQuery = {
  teamId?: string;
};

export type CreateProjectInput = {
  name: string;
  teamId: string;
  status?: string;
  health?: string;
  startDate?: string | null;
  targetDate?: string | null;
};

export type PatchProjectInput = {
  name?: string;
  teamId?: string;
  status?: string;
  health?: string;
  startDate?: string | null;
  targetDate?: string | null;
};

function toQuery(params: ProjectListQuery) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export async function listProjectsApi(orgSlug: string, query: ProjectListQuery = {}) {
  return api<{ projects: ApiProject[] }>(`/orgs/${orgSlug}/projects${toQuery(query)}`);
}

export async function getProjectApi(orgSlug: string, projectId: string) {
  return api<{ project: ApiProject }>(`/orgs/${orgSlug}/projects/${projectId}`);
}

export async function createProjectApi(orgSlug: string, input: CreateProjectInput) {
  return api<{ project: ApiProject }>(`/orgs/${orgSlug}/projects`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function patchProjectApi(
  orgSlug: string,
  projectId: string,
  input: PatchProjectInput,
) {
  return api<{ project: ApiProject }>(`/orgs/${orgSlug}/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteProjectApi(orgSlug: string, projectId: string) {
  return api<{ id: string }>(`/orgs/${orgSlug}/projects/${projectId}`, {
    method: 'DELETE',
  });
}
