'use client';

import { EmojiPicker } from '@/components/common/emoji-picker';
import { TeamIcon } from '@/components/common/teams/team-icon';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePatchTeam } from '@/hooks/use-teams';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { MouseEvent, PointerEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

function stopRowEvents(event: MouseEvent | PointerEvent) {
  event.stopPropagation();
}

export function TeamIconPicker({
  icon,
  teamKey,
  onChange,
  disabled,
  className,
}: {
  icon: string;
  teamKey: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Change team icon"
          aria-disabled={disabled}
          className={cn(
            'inline-flex cursor-pointer rounded-md hover:opacity-80',
            disabled && 'pointer-events-none opacity-50',
          )}
          onPointerDown={stopRowEvents}
          onClick={stopRowEvents}
        >
          <TeamIcon icon={icon} teamKey={teamKey} className={className} />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0" onOpenAutoFocus={(event) => event.preventDefault()}>
        {open ? (
          <div>
            <EmojiPicker
              onSelect={(emoji) => {
                onChange(emoji);
                setOpen(false);
              }}
            />
            {icon ? (
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="w-full"
                  onClick={() => {
                    onChange('');
                    setOpen(false);
                  }}
                >
                  Remove icon
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function TeamEmojiButton({
  teamId,
  icon,
  teamKey,
  className,
}: {
  teamId: string;
  icon: string;
  teamKey: string;
  className?: string;
}) {
  const patchTeam = usePatchTeam();

  return (
    <TeamIconPicker
      icon={icon}
      teamKey={teamKey}
      className={className}
      disabled={!teamId || patchTeam.isPending}
      onChange={(next) => {
        patchTeam.mutate(
          { teamId, input: { icon: next } },
          {
            onError: (err) => {
              toast.error(err instanceof ApiError ? err.message : 'Could not update team');
            },
          },
        );
      }}
    />
  );
}
