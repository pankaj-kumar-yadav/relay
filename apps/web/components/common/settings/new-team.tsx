'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { isTeamKey, normalizeTeamKey } from '@/constants/team.constant';
import { useCreateTeam } from '@/hooks/use-teams';
import { ApiError } from '@/lib/api';
import { teamHomePath } from '@/lib/paths';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { SettingsCard, SettingsSection, SettingsShell } from './shared';

function suggestedKey(name: string) {
  const compact = normalizeTeamKey(name.replace(/[^a-zA-Z0-9]/g, ''));
  if (compact.length >= 2) return compact.slice(0, 10);
  return compact;
}

/** "Join or create a team" settings page. */
export default function NewTeam() {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const createTeam = useCreateTeam();
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);

  const derivedKey = useMemo(() => suggestedKey(name), [name]);
  const teamKey = keyTouched ? normalizeTeamKey(key) : derivedKey;

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!isTeamKey(teamKey)) {
      toast.error('Key must be 2–10 letters or digits');
      return;
    }
    if (!orgId) return;
    try {
      const { team } = await createTeam.mutateAsync({
        name: name.trim(),
        key: teamKey,
      });
      toast.success('Team created');
      router.push(teamHomePath(orgId, team.key));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not create team');
    }
  };

  return (
    <SettingsShell
      title="Join or create a team"
      description="Teams organize issues, cycles and projects around the people working together"
    >
      <SettingsSection title="Create a new team">
        <SettingsCard>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <Input
              placeholder="Team name, e.g. Mobile"
              className="h-8 flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Key, e.g. MOB"
              className="h-8 w-28 uppercase"
              value={keyTouched ? key : derivedKey}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value.toUpperCase());
              }}
            />
            <Button size="xs" onClick={() => void submit()} disabled={createTeam.isPending}>
              Create team
            </Button>
          </div>
        </SettingsCard>
      </SettingsSection>
    </SettingsShell>
  );
}
