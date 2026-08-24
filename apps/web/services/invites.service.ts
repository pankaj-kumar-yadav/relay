import type { OrgRoleValue } from '@/constants/org.constant';
import { api } from '@/lib/api';

export async function createInviteApi(
  orgSlug: string,
  input: { email: string; role?: OrgRoleValue },
) {
  return api<{ invite: { id: string; email: string; role: string; expiresAt: string }; token: string }>(
    `/orgs/${orgSlug}/invites`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function acceptInviteApi(token: string) {
  return api<{ organization: { id: string; name: string; slug: string }; role: string }>(
    `/invites/${token}/accept`,
    { method: 'POST' },
  );
}
