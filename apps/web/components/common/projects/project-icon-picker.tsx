'use client';

import { EmojiPicker } from '@/components/common/emoji-picker';
import { ProjectIcon } from './project-icon';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePatchProject } from '@/hooks/use-projects';
import { ApiError } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { MouseEvent, PointerEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

function stopRowEvents(event: MouseEvent | PointerEvent) {
  event.stopPropagation();
}

export function ProjectIconPicker({
  icon,
  name,
  onChange,
  disabled,
  className,
  size,
}: {
  icon: string;
  name: string;
  onChange: (icon: string) => void;
  disabled?: boolean;
  className?: string;
  size?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label="Change project icon"
          aria-disabled={disabled}
          className={cn(
            'inline-flex cursor-pointer rounded-md hover:opacity-80',
            disabled && 'pointer-events-none opacity-50',
          )}
          onPointerDown={stopRowEvents}
          onClick={stopRowEvents}
        >
          <ProjectIcon icon={icon} name={name} className={className} size={size} />
        </span>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {open ? (
          <div>
            <EmojiPicker
              onSelect={(_emoji, unified) => {
                onChange(unified);
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

export function ProjectEmojiButton({
  projectId,
  icon,
  name,
  className,
  size,
}: {
  projectId: string;
  icon: string;
  name: string;
  className?: string;
  size?: number;
}) {
  const patchProject = usePatchProject();

  return (
    <ProjectIconPicker
      icon={icon}
      name={name}
      className={className}
      size={size}
      disabled={!projectId || patchProject.isPending}
      onChange={(next) => {
        patchProject.mutate(
          { projectId, input: { icon: next } },
          {
            onError: (err) => {
              toast.error(err instanceof ApiError ? err.message : 'Could not update project');
            },
          },
        );
      }}
    />
  );
}
