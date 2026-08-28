import { AppRoute } from '@/constants/auth.constant';
import { DEFAULT_TEAM_KEY, teamHomePath } from '@/constants/team.constant';
import { api } from '@/lib/api';
import { listTeamsApi } from '@/services/teams.service';

export type OrgSummary = {
  id: string;
  name: string;
  slug: string;
  role: string;
};

export async function listOrgsApi() {
  return api<{ organizations: OrgSummary[] }>('/orgs');
}

export async function createOrgApi(input: { name: string; slug: string }) {
  return api<{ organization: OrgSummary; role: string; team: { id: string; key: string; name: string; icon: string } }>(
    '/orgs',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function getOrgApi(slug: string) {
  return api<{ organization: Omit<OrgSummary, 'role'>; role: string }>(`/orgs/${slug}`);
}

export async function resolveHomePathApi(): Promise<string> {
  const { organizations } = await listOrgsApi();
  if (organizations.length === 0) return AppRoute.NEW;
  const org = organizations[0]!;
  const { teams } = await listTeamsApi(org.slug);
  const key = teams[0]?.key ?? DEFAULT_TEAM_KEY;
  return teamHomePath(org.slug, key);
}
