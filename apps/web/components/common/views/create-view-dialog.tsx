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
import { IssueStatusCategory } from '@/constants/issue.constant';
import { VIEW_NAME_MAX, viewPath } from '@/constants/view.constant';
import { useLabels } from '@/hooks/use-labels';
import { useTeams } from '@/hooks/use-teams';
import { useCreateView, usePatchView } from '@/hooks/use-views';
import { ApiError } from '@/lib/api';
import { priorities } from '@/mock-data/priorities';
import { status as statuses } from '@/mock-data/status';
import type { ApiView, ViewFilters } from '@/services/views.service';
import { Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { toast } from 'sonner';

const ANY = '__any__';

const CATEGORY_OPTIONS = [
  { id: IssueStatusCategory.TRIAGE, label: 'Triage' },
  { id: IssueStatusCategory.BACKLOG, label: 'Backlog' },
  { id: IssueStatusCategory.UNSTARTED, label: 'Unstarted' },
  { id: IssueStatusCategory.STARTED, label: 'Started' },
  { id: IssueStatusCategory.COMPLETED, label: 'Completed' },
  { id: IssueStatusCategory.CANCELED, label: 'Canceled' },
];

function compactFilters(filters: ViewFilters): ViewFilters {
  const next: ViewFilters = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value) next[key as keyof ViewFilters] = value;
  }
  return next;
}

export function CreateViewButton({
  defaultTeamId,
  view,
  trigger,
  open: openProp,
  onOpenChange,
}: {
  defaultTeamId?: string;
  view?: ApiView;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { orgId } = useParams<{ orgId: string }>();
  const router = useRouter();
  const { data: teams = [] } = useTeams(orgId);
  const { data: labels = [] } = useLabels(orgId);
  const createView = useCreateView();
  const patchView = usePatchView();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState(ANY);
  const [status, setStatus] = useState(ANY);
  const [priority, setPriority] = useState(ANY);
  const [statusCategory, setStatusCategory] = useState(ANY);
  const [labelId, setLabelId] = useState(ANY);

  useEffect(() => {
    if (!open) return;
    const filters = view?.filters ?? {};
    setName(view?.name ?? '');
    setTeamId(filters.teamId ?? defaultTeamId ?? ANY);
    setStatus(filters.status ?? ANY);
    setPriority(filters.priority ?? ANY);
    setStatusCategory(filters.statusCategory ?? ANY);
    setLabelId(filters.labelId ?? ANY);
  }, [open, view, defaultTeamId]);

  const saving = createView.isPending || patchView.isPending;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Name is required');
      return;
    }
    const filters = compactFilters({
      teamId: teamId === ANY ? undefined : teamId,
      status: status === ANY ? undefined : status,
      priority: priority === ANY ? undefined : priority,
      statusCategory: statusCategory === ANY ? undefined : statusCategory,
      labelId: labelId === ANY ? undefined : labelId,
    });
    try {
      if (view) {
        await patchView.mutateAsync({ viewSlug: view.slug, input: { name: trimmed, filters } });
        toast.success('View updated');
        setOpen(false);
        return;
      }
      const { view: created } = await createView.mutateAsync({ name: trimmed, filters });
      toast.success('View created');
      setOpen(false);
      if (orgId) router.push(viewPath(orgId, created.slug));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not save view');
    }
  };

  return (
    <>
      {trigger !== undefined ? (
        trigger ? (
          <span onClick={() => setOpen(true)}>{trigger}</span>
        ) : null
      ) : (
        <Button size="xs" variant="ghost" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{view ? 'Edit view' : 'Create view'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="view-name">Name</Label>
              <Input
                id="view-name"
                value={name}
                maxLength={VIEW_NAME_MAX}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void submit();
                }}
              />
            </div>
            <FilterSelect
              label="Team"
              value={teamId}
              onChange={setTeamId}
              options={teams.map((team) => ({ id: team.id, label: team.name }))}
            />
            <FilterSelect
              label="Status"
              value={status}
              onChange={setStatus}
              options={statuses.map((item) => ({ id: item.id, label: item.name }))}
            />
            <FilterSelect
              label="Priority"
              value={priority}
              onChange={setPriority}
              options={priorities.map((item) => ({ id: item.id, label: item.name }))}
            />
            <FilterSelect
              label="Status category"
              value={statusCategory}
              onChange={setStatusCategory}
              options={CATEGORY_OPTIONS}
            />
            <FilterSelect
              label="Label"
              value={labelId}
              onChange={setLabelId}
              options={labels.map((item) => ({ id: item.id, label: item.name }))}
            />
          </div>
          <DialogFooter>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => void submit()} disabled={saving}>
              {view ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string }>;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Any ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any {label.toLowerCase()}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
