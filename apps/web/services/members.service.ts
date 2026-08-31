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

export async function patchMemberApi(
  orgSlug: string,
  userId: string,
  input: { role: OrgRoleValue },
) {
  return api<{ member: OrgMember }>(`/orgs/${orgSlug}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteMemberApi(orgSlug: string, userId: string) {
  return api<{ id: string }>(`/orgs/${orgSlug}/members/${userId}`, {
    method: 'DELETE',
  });
}
