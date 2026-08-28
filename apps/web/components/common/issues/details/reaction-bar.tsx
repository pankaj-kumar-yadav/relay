'use client';

import { EmojiPicker } from '@/components/common/emoji-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { SmilePlus } from 'lucide-react';
import { useState } from 'react';

export type ReactionChip = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export function ReactionBar({
  reactions,
  onToggle,
  className,
  pickerSide = 'top',
  iconClassName,
}: {
  reactions: ReactionChip[];
  onToggle: (emoji: string) => void;
  className?: string;
  pickerSide?: 'top' | 'bottom';
  iconClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  const select = (emoji: string) => {
    onToggle(emoji);
    setOpen(false);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          aria-pressed={reaction.reacted}
          aria-label={`${reaction.reacted ? 'Remove' : 'Add'} ${reaction.emoji} reaction`}
          onClick={() => onToggle(reaction.emoji)}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
            reaction.reacted
              ? 'border-border bg-accent'
              : 'border-border/60 bg-accent/60 hover:bg-accent',
          )}
        >
          <span aria-hidden>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Add reaction"
                className="text-muted-foreground hover:text-foreground rounded-sm p-0.5"
              >
                <SmilePlus className={cn('size-3.5', iconClassName)} />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Add reaction</TooltipContent>
        </Tooltip>
        <PopoverContent align="start" className="w-auto p-0" side={pickerSide}>
          {open ? <EmojiPicker onSelect={select} /> : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
