'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { useAcceptInvite } from '@/hooks/use-invites';
import { useTeams } from '@/hooks/use-teams';
import { DEFAULT_TEAM_KEY, teamHomePath } from '@/lib/paths';

export default function AcceptInvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const { data: user, isFetched } = useSession();
  const acceptInvite = useAcceptInvite();
  const [orgSlug, setOrgSlug] = useState<string | undefined>();
  const { data: teams } = useTeams(orgSlug);

  useEffect(() => {
    if (!isFetched) return;
    if (!user) {
      router.replace(`/login?next=/invite/${token}`);
    }
  }, [isFetched, user, router, token]);

  useEffect(() => {
    if (!orgSlug || !teams) return;
    const key = teams[0]?.key ?? DEFAULT_TEAM_KEY;
    router.replace(teamHomePath(orgSlug, key));
  }, [orgSlug, teams, router]);

  async function onAccept() {
    setError(null);
    try {
      const data = await acceptInvite.mutateAsync(token);
      setOrgSlug(data.organization.slug);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not accept invite');
    }
  }

  if (!isFetched || !user) {
    return <div className="min-h-svh bg-background" />;
  }

  const accepting = acceptInvite.isPending || Boolean(orgSlug);

  return (
    <div className="min-h-svh bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-[360px] flex flex-col gap-4">
        <h1 className="text-lg font-semibold tracking-tight">Join organization</h1>
        <p className="text-sm text-muted-foreground">
          Accept this invite to join the workspace.
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button onClick={() => void onAccept()} disabled={accepting}>
          Accept invite
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Wrong account?{' '}
          <Link href="/login" className="underline">
            Sign in with another
          </Link>
        </p>
      </div>
    </div>
  );
}
