'use client';

import { ReactionBar } from '@/components/common/issues/details/reaction-bar';
import { useIssueReactions, useToggleIssueReaction } from '@/hooks/use-issues';

export function IssueReactions({
  orgSlug,
  issueId,
}: {
  orgSlug: string;
  issueId: string;
}) {
  const { data } = useIssueReactions(orgSlug, issueId);
  const toggle = useToggleIssueReaction(orgSlug, issueId);

  return (
    <ReactionBar
      reactions={data ?? []}
      onToggle={(emoji) => toggle.mutate(emoji)}
      pickerSide="bottom"
      iconClassName="size-4"
    />
  );
}
