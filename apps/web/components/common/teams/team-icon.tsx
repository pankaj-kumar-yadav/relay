'use client';

import { cn } from '@/lib/utils';

export function TeamIcon({
  icon,
  teamKey,
  className,
}: {
  icon: string;
  teamKey: string;
  className?: string;
}) {
  const label = icon || teamKey.slice(0, 1);

  return (
    <div
      className={cn(
        'inline-flex size-6 shrink-0 items-center justify-center rounded bg-muted/50 text-sm',
        className,
      )}
    >
      <span className="leading-none">{label}</span>
    </div>
  );
}
