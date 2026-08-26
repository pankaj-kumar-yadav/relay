'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DEFAULT_PROJECT_HEALTH,
  DEFAULT_PROJECT_STATUS,
  ProjectHealth,
  ProjectStatus,
  projectIssuesPath,
} from '@/constants/project.constant';
import { useCreateProject } from '@/hooks/use-projects';
import { useTeams } from '@/hooks/use-teams';
import { ApiError } from '@/lib/api';
import { Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { id: ProjectStatus.TO_DO, label: 'To Do' },
  { id: ProjectStatus.IN_PROGRESS, label: 'In Progress' },
  { id: ProjectStatus.DONE, label: 'Done' },
  { id: ProjectStatus.CANCELED, label: 'Canceled' },
];

const HEALTH_OPTIONS = [
  { id: ProjectHealth.NO_UPDATE, label: 'No update' },
  { id: ProjectHealth.ON_TRACK, label: 'On track' },
  { id: ProjectHealth.AT_RISK, label: 'At risk' },
  { id: ProjectHealth.OFF_TRACK, label: 'Off track' },
];

export function CreateProjectButton({ defaultTeamKey }: { defaultTeamKey?: string }) {
  const { orgId, teamId } = useParams<{ orgId: string; teamId?: string }>();
  const router = useRouter();
  const { data: teams = [] } = useTeams(orgId);
  const createProject = useCreateProject();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [teamKey, setTeamKey] = useState(defaultTeamKey ?? teamId ?? '');
  const [status, setStatus] = useState<string>(DEFAULT_PROJECT_STATUS);
  const [health, setHealth] = useState<string>(DEFAULT_PROJECT_HEALTH);

  useEffect(() => {
    if (!open) return;
    setTeamKey(defaultTeamKey ?? teamId ?? teams[0]?.key ?? '');
    setStatus(DEFAULT_PROJECT_STATUS);
    setHealth(DEFAULT_PROJECT_HEALTH);
    setName('');
  }, [open, defaultTeamKey, teamId, teams]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!teamKey) {
      toast.error('Select a team');
      return;
    }
    try {
      const { project } = await createProject.mutateAsync({
        name: name.trim(),
        teamId: teamKey,
        status,
        health,
      });
      toast.success('Project created');
      setOpen(false);
      if (orgId) router.push(projectIssuesPath(orgId, project.id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not create project');
    }
  };

  return (
    <>
      <Button className="relative" size="xs" variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        <span className="hidden sm:inline ml-1">Create project</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Team</Label>
              <Select value={teamKey} onValueChange={setTeamKey}>
                <SelectTrigger>
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.key}>
                      {team.name} ({team.key})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Health</Label>
                <Select value={health} onValueChange={setHealth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HEALTH_OPTIONS.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" onClick={() => void submit()} disabled={createProject.isPending}>
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
