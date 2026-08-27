'use client';

import { queryKeys } from '@/lib/query-keys';
import {
  createCommentApi,
  listActivityApi,
  toggleCommentReactionApi,
  type ApiActivityItem,
  type ApiCommentReaction,
} from '@/services/activity.service';
import { ApiError } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useIssueActivity(orgSlug: string | undefined, issueId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.issues.activity(orgSlug ?? '', issueId ?? ''),
    queryFn: () => listActivityApi(orgSlug!, issueId!),
    enabled: Boolean(orgSlug && issueId),
  });
}

export function useCreateComment(orgSlug: string | undefined, issueId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => {
      if (!orgSlug || !issueId) throw new Error('No issue selected');
      return createCommentApi(orgSlug, issueId, { body });
    },
    onSuccess: () => {
      if (!orgSlug || !issueId) return;
      void queryClient.invalidateQueries({
        queryKey: queryKeys.issues.activity(orgSlug, issueId),
      });
    },
  });
}

function toggleLocalReaction(
  items: ApiActivityItem[],
  commentId: string,
  emoji: string,
): ApiActivityItem[] {
  return items.map((item) => {
    if (item.kind !== 'comment' || item.id !== commentId) return item;
    const current = item.reactions ?? [];
    const existing = current.find((reaction) => reaction.emoji === emoji);
    let reactions: ApiCommentReaction[];
    if (existing?.reacted) {
      reactions =
        existing.count <= 1
          ? current.filter((reaction) => reaction.emoji !== emoji)
          : current.map((reaction) =>
              reaction.emoji === emoji
                ? { ...reaction, count: reaction.count - 1, reacted: false }
                : reaction,
            );
    } else if (existing) {
      reactions = current.map((reaction) =>
        reaction.emoji === emoji
          ? { ...reaction, count: reaction.count + 1, reacted: true }
          : reaction,
      );
    } else {
      reactions = [...current, { emoji, count: 1, reacted: true }];
    }
    return { ...item, reactions };
  });
}

export function useToggleCommentReaction(
  orgSlug: string | undefined,
  issueId: string | undefined,
) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.issues.activity(orgSlug ?? '', issueId ?? '');

  return useMutation({
    mutationFn: ({ commentId, emoji }: { commentId: string; emoji: string }) => {
      if (!orgSlug || !issueId) throw new Error('No issue selected');
      return toggleCommentReactionApi(orgSlug, issueId, commentId, emoji);
    },
    onMutate: async ({ commentId, emoji }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ items: ApiActivityItem[] }>(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, {
          ...previous,
          items: toggleLocalReaction(previous.items, commentId, emoji),
        });
      }
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(err instanceof ApiError ? err.message : 'Could not update reaction');
    },
    onSettled: () => {
      if (!orgSlug || !issueId) return;
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
