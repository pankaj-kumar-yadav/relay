'use client';

import { cn } from '@/lib/utils';
import { Emoji, EmojiStyle } from 'emoji-picker-react';

const UNIFIED_RE = /^[0-9a-f]{4,}(-[0-9a-f]{4,})*$/i;

export function ProjectIcon({
  icon,
  name,
  className,
  size = 16,
}: {
  icon: string;
  name: string;
  className?: string;
  size?: number;
}) {
  const fallback = name.slice(0, 1);

  return (
    <div
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted/50 text-sm',
        className,
      )}
    >
      {UNIFIED_RE.test(icon) ? (
        <Emoji unified={icon} size={size} emojiStyle={EmojiStyle.NATIVE} />
      ) : (
        <span className="leading-none">{icon || fallback}</span>
      )}
    </div>
  );
}
