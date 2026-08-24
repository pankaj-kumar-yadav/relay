'use client';

import { useMembers } from '@/hooks/use-members';
import { useTeams } from '@/hooks/use-teams';
import { useParams } from 'next/navigation';

export function OrgDataLoader() {
  const { orgId } = useParams<{ orgId: string }>();
  useTeams(orgId);
  useMembers(orgId);
  return null;
}
