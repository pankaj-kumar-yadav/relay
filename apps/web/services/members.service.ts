import type { OrgRoleValue } from '@/constants/org.constant';
import { api } from '@/lib/api';

export type OrgMember = {
  id: string;
  name: string;
  email: string;
  role: OrgRoleValue;
  joinedAt: string;
};

export async function listMembersApi(orgSlug: string) {
  return api<{ members: OrgMember[] }>(`/orgs/${orgSlug}/members`);
}
