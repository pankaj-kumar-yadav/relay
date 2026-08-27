'use client';

import { CommentEmojiPicker } from '@/components/common/issues/details/comment-emoji-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToggleCommentReaction } from '@/hooks/use-activity';
import { cn } from '@/lib/utils';
import type { ApiCommentReaction } from '@/services/activity.service';
import { SmilePlus } from 'lucide-react';
import { useState } from 'react';

export function CommentReactions({
  orgSlug,
  issueId,
  commentId,
  reactions,
}: {
  orgSlug: string;
  issueId: string;
  commentId: string;
  reactions: ApiCommentReaction[];
}) {
  const [open, setOpen] = useState(false);
  const toggle = useToggleCommentReaction(orgSlug, issueId);

  const onToggle = (emoji: string) => {
    toggle.mutate({ commentId, emoji });
    setOpen(false);
  };

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
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
                <SmilePlus className="size-3.5" />
              </button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>Add reaction</TooltipContent>
        </Tooltip>
        <PopoverContent align="start" className="w-auto p-0" side="top">
          {open ? <CommentEmojiPicker onSelect={onToggle} /> : null}
        </PopoverContent>
      </Popover>
    </div>
  );
}
