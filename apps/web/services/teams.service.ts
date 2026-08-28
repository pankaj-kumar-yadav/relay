import { api } from '@/lib/api';

export type TeamSummary = {
  id: string;
  key: string;
  name: string;
  icon: string;
};

export type CreateTeamInput = {
  name: string;
  key: string;
  icon?: string;
};

export type PatchTeamInput = {
  name?: string;
  key?: string;
  icon?: string;
};

export async function listTeamsApi(orgSlug: string) {
  return api<{ teams: TeamSummary[] }>(`/orgs/${orgSlug}/teams`);
}

export async function getTeamApi(orgSlug: string, teamId: string) {
  return api<{ team: TeamSummary }>(`/orgs/${orgSlug}/teams/${teamId}`);
}

export async function createTeamApi(orgSlug: string, input: CreateTeamInput) {
  return api<{ team: TeamSummary }>(`/orgs/${orgSlug}/teams`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function patchTeamApi(orgSlug: string, teamId: string, input: PatchTeamInput) {
  return api<{ team: TeamSummary }>(`/orgs/${orgSlug}/teams/${teamId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
