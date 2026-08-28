'use client';

import { ReactionBar } from '@/components/common/issues/details/reaction-bar';
import { useToggleCommentReaction } from '@/hooks/use-activity';
import type { ApiCommentReaction } from '@/services/activity.service';

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
  const toggle = useToggleCommentReaction(orgSlug, issueId);

  return (
    <ReactionBar
      className="mt-1"
      reactions={reactions}
      onToggle={(emoji) => toggle.mutate({ commentId, emoji })}
    />
  );
}
