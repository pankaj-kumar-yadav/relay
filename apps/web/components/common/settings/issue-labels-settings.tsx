'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DateFormat, formatDate } from '@/constants/date.constant';
import { DEFAULT_LABEL_COLOR, LABEL_COLORS, LABEL_NAME_MAX } from '@/constants/label.constant';
import { OrgRole } from '@/constants/org.constant';
import { useCreateLabel, useDeleteLabel, useLabels, usePatchLabel } from '@/hooks/use-labels';
import { useOrgs } from '@/hooks/use-orgs';
import { cn } from '@/lib/utils';
import type { ApiLabel } from '@/services/labels.service';
import { Pencil, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';

function formatCount(count: number) {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);
}

function LabelFormDialog({
  open,
  title,
  initial,
  pending,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  initial?: Pick<ApiLabel, 'name' | 'color'>;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: { name: string; color: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? DEFAULT_LABEL_COLOR);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setColor(initial?.color ?? DEFAULT_LABEL_COLOR);
  }, [open, initial?.name, initial?.color]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setName(initial?.name ?? '');
          setColor(initial?.color ?? DEFAULT_LABEL_COLOR);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            placeholder="Label name"
            value={name}
            maxLength={LABEL_NAME_MAX}
            onChange={(event) => setName(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {LABEL_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={swatch}
                onClick={() => setColor(swatch)}
                className={cn(
                  'size-6 rounded-full border border-transparent',
                  color.toUpperCase() === swatch && 'ring-2 ring-offset-2 ring-ring',
                )}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onSubmit({ name: name.trim(), color })}
            disabled={!name.trim() || pending}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function IssueLabelsSettings() {
  const { orgId } = useParams<{ orgId: string }>();
  const { data: orgs } = useOrgs();
  const { data: labels = [], isLoading } = useLabels(orgId);
  const createLabel = useCreateLabel();
  const patchLabel = usePatchLabel();
  const deleteLabel = useDeleteLabel();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiLabel | null>(null);
  const [deleting, setDeleting] = useState<ApiLabel | null>(null);

  const isAdmin = orgs?.some(
    (org) => org.slug === orgId && org.role === OrgRole.ADMIN,
  );

  const rows = useMemo(
    () =>
      labels.filter((label) =>
        label.name.toLowerCase().includes(query.toLowerCase()),
      ),
    [labels, query],
  );

  return (
    <div className="w-full overflow-y-auto h-full">
      <div className="max-w-5xl mx-auto px-6 py-10 pb-20">
        <h1 className="text-2xl font-medium mb-6">Issue labels</h1>

        <div className="flex items-center justify-between gap-3 mb-6">
          <Input
            placeholder="Filter by name..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-64 h-8"
          />
          {isAdmin && (
            <Button size="xs" onClick={() => setCreating(true)}>
              New label
            </Button>
          )}
        </div>

        <div className="flex items-center px-2 py-1.5 text-xs text-muted-foreground border-b">
          <div className="flex-1 min-w-0">Name</div>
          <div className="w-[70px]">Issues</div>
          <div className="w-[110px]">Created</div>
          {isAdmin && <div className="w-[72px]" />}
        </div>

        {isLoading && (
          <p className="text-sm text-muted-foreground py-6">Loading labels…</p>
        )}
        {!isLoading &&
          rows.map((label) => (
            <div
              key={label.id}
              className="flex items-center px-2 py-2.5 text-sm border-b border-muted-foreground/5 hover:bg-sidebar/50"
            >
              <div className="flex-1 min-w-0 flex items-center gap-2.5">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="truncate">{label.name}</span>
              </div>
              <div className="w-[70px] text-xs text-muted-foreground">
                {label.issueCount > 0 && formatCount(label.issueCount)}
              </div>
              <div className="w-[110px] text-xs text-muted-foreground">
                {formatDate(label.createdAt, DateFormat.MONTH_YEAR)}
              </div>
              {isAdmin && (
                <div className="w-[72px] flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setEditing(label)}
                    aria-label={`Edit ${label.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setDeleting(label)}
                    aria-label={`Delete ${label.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        {!isLoading && rows.length === 0 && (
          <p className="text-sm text-muted-foreground py-6">
            {query ? 'No labels match your filter.' : 'No labels yet.'}
          </p>
        )}
      </div>

      <LabelFormDialog
        open={creating}
        title="New label"
        pending={createLabel.isPending}
        onOpenChange={setCreating}
        onSubmit={({ name, color }) => {
          createLabel.mutate(
            { name, color },
            { onSuccess: () => setCreating(false) },
          );
        }}
      />
      <LabelFormDialog
        key={editing?.id ?? 'edit'}
        open={Boolean(editing)}
        title="Edit label"
        initial={editing ?? undefined}
        pending={patchLabel.isPending}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
        onSubmit={({ name, color }) => {
          if (!editing) return;
          patchLabel.mutate(
            { labelId: editing.id, input: { name, color } },
            { onSuccess: () => setEditing(null) },
          );
        }}
      />
      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the label from every issue. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleting) return;
                deleteLabel.mutate(deleting.id, {
                  onSuccess: () => setDeleting(null),
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
