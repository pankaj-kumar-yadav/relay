'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import type { CSSProperties } from 'react';
import type { EmojiClickData, EmojiStyle, Theme } from 'emoji-picker-react';

const Picker = dynamic(() => import('emoji-picker-react'), {
  ssr: false,
  loading: () => (
    <div
      className="text-muted-foreground flex items-center justify-center text-xs"
      style={{ width: 320, height: 360 }}
    >
      Loading emoji…
    </div>
  ),
});

const pickerStyle = {
  '--epr-bg-color': 'var(--popover)',
  '--epr-category-label-bg-color': 'var(--popover)',
  '--epr-text-color': 'var(--popover-foreground)',
  '--epr-search-input-bg-color': 'var(--background)',
  '--epr-search-border-color': 'var(--border)',
  '--epr-picker-border-color': 'var(--border)',
  '--epr-hover-bg-color': 'var(--accent)',
  '--epr-highlight-color': 'var(--accent)',
  '--epr-category-icon-active-color': 'var(--foreground)',
} as CSSProperties;

export function EmojiPicker({
  onSelect,
}: {
  onSelect: (emoji: string, unified: string) => void;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <div className="overflow-hidden rounded-md">
      <Picker
        onEmojiClick={(data: EmojiClickData) => onSelect(data.emoji, data.unified)}
        theme={(resolvedTheme === 'dark' ? 'dark' : 'light') as Theme}
        emojiStyle={'native' as EmojiStyle}
        lazyLoadEmojis
        autoFocusSearch
        searchPlaceholder="Search emoji"
        previewConfig={{ showPreview: false }}
        width={320}
        height={360}
        style={pickerStyle}
      />
    </div>
  );
}
