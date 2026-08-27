import { COMMENT_REACTION_EMOJI_MAX } from '@/constants/activity.constant.js';

const EMOJI_CORE =
  /\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1F1E6}-\u{1F1FF}]|[#*0-9]\uFE0F?\u20E3/u;

const graphemes = new Intl.Segmenter('en', { granularity: 'grapheme' });

export function isCommentReactionEmoji(value: string): boolean {
  if (!value || value.length > COMMENT_REACTION_EMOJI_MAX) return false;
  const parts = [...graphemes.segment(value)];
  if (parts.length !== 1) return false;
  return EMOJI_CORE.test(value);
}

export function aggregateCommentReactions(
  rows: Array<{ emoji: string; userId: string }>,
  currentUserId: string,
) {
  const counts = new Map<string, { count: number; reacted: boolean }>();
  const order: string[] = [];
  for (const row of rows) {
    const current = counts.get(row.emoji);
    if (!current) {
      counts.set(row.emoji, {
        count: 1,
        reacted: row.userId === currentUserId,
      });
      order.push(row.emoji);
      continue;
    }
    current.count += 1;
    if (row.userId === currentUserId) current.reacted = true;
  }
  return order.map((emoji) => ({ emoji, ...counts.get(emoji)! }));
}

