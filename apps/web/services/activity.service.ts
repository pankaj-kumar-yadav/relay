import type { IssueEventTypeValue } from '@/constants/activity.constant';
import { api } from '@/lib/api';

export type ApiActivityActor = {
  id: string;
  name: string;
};

export type ApiActivityEvent = {
  kind: 'event';
  id: string;
  type: IssueEventTypeValue;
  actor: ApiActivityActor;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type ApiCommentReaction = {
  emoji: string;
  count: number;
  reacted: boolean;
};

export type ApiActivityComment = {
  kind: 'comment';
  id: string;
  body: string;
  author: ApiActivityActor;
  createdAt: string;
  reactions: ApiCommentReaction[];
};

export type ApiActivityItem = ApiActivityEvent | ApiActivityComment;

export async function listActivityApi(orgSlug: string, issueId: string) {
  return api<{ items: ApiActivityItem[] }>(
    `/orgs/${orgSlug}/issues/${issueId}/activity`,
  );
}

export async function createCommentApi(
  orgSlug: string,
  issueId: string,
  input: { body: string },
) {
  return api<{ comment: ApiActivityComment }>(
    `/orgs/${orgSlug}/issues/${issueId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteCommentApi(
  orgSlug: string,
  issueId: string,
  commentId: string,
) {
  return api<{ id: string }>(
    `/orgs/${orgSlug}/issues/${issueId}/comments/${commentId}`,
    { method: 'DELETE' },
  );
}

export async function toggleCommentReactionApi(
  orgSlug: string,
  issueId: string,
  commentId: string,
  emoji: string,
) {
  return api<{ reactions: ApiCommentReaction[] }>(
    `/orgs/${orgSlug}/issues/${issueId}/comments/${commentId}/reactions`,
    {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    },
  );
}
