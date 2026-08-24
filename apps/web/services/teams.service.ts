import { api } from '@/lib/api';

export type TeamSummary = {
  id: string;
  key: string;
  name: string;
};

export async function listTeamsApi(orgSlug: string) {
  return api<{ teams: TeamSummary[] }>(`/orgs/${orgSlug}/teams`);
}
