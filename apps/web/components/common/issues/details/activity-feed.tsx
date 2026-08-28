'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentReactions } from '@/components/common/issues/details/comment-reactions';
import { IssueEventType } from '@/constants/activity.constant';
import { formatRelativeTime } from '@/constants/date.constant';
import { useCreateComment, useIssueActivity } from '@/hooks/use-activity';
import { dicebearAvatarUrl } from '@/constants/user.constant';
import type { ApiActivityComment, ApiActivityEvent } from '@/services/activity.service';
import { CircleDot, PenLine, Plus, Repeat, Tag, UserRound } from 'lucide-react';
import { type ReactNode, useState } from 'react';

const EVENT_ICONS: Record<string, ReactNode> = {
  [IssueEventType.CREATED]: <PenLine className="size-3.5" />,
  [IssueEventType.STATUS]: <CircleDot className="size-3.5" />,
  [IssueEventType.PRIORITY]: <CircleDot className="size-3.5" />,
  [IssueEventType.ASSIGNEE]: <UserRound className="size-3.5" />,
  [IssueEventType.LABEL]: <Tag className="size-3.5" />,
  [IssueEventType.CYCLE]: <Repeat className="size-3.5" />,
};

function namesFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) =>
      item && typeof item === 'object' && 'name' in item ? String(item.name) : '',
    )
    .filter(Boolean);
}

function eventText(item: ApiActivityEvent): string {
  const to = item.payload.to;
  switch (item.type) {
    case IssueEventType.CREATED:
      return 'created the issue';
    case IssueEventType.STATUS:
      return `changed status to ${String(to ?? '')}`;
    case IssueEventType.PRIORITY:
      return `changed priority to ${String(to ?? '')}`;
    case IssueEventType.ASSIGNEE:
      return to == null ? 'unassigned the issue' : 'changed the assignee';
    case IssueEventType.LABEL: {
      const added = namesFrom(item.payload.added);
      const removed = namesFrom(item.payload.removed);
      const parts: string[] = [];
      if (added.length > 0) {
        parts.push(`added ${added.join(', ')}`);
      }
      if (removed.length > 0) {
        parts.push(`removed ${removed.join(', ')}`);
      }
      return parts.join('; ') || 'updated labels';
    }
    case IssueEventType.CYCLE:
      return to == null
        ? 'removed the issue from its cycle'
        : `added the issue to ${String(to)}`;
    default:
      return item.type;
  }
}

function EventRow({ item }: { item: ApiActivityEvent }) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-muted-foreground py-1.5">
      <span className="size-5 rounded-full bg-accent flex items-center justify-center shrink-0">
        {EVENT_ICONS[item.type] ?? <CircleDot className="size-3.5" />}
      </span>
      <span className="min-w-0 truncate">
        <span className="text-foreground/90 font-medium">{item.actor.name}</span> {eventText(item)}
      </span>
      <span className="shrink-0 text-xs">· {formatRelativeTime(item.createdAt)}</span>
    </div>
  );
}

function CommentCard({
  orgSlug,
  issueId,
  item,
}: {
  orgSlug: string;
  issueId: string;
  item: ApiActivityComment;
}) {
  return (
    <div className="my-2 rounded-lg border border-border/60 bg-container p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <Avatar className="size-5">
          <AvatarImage src={dicebearAvatarUrl(item.author.id)} alt={item.author.name} />
          <AvatarFallback>{item.author.name[0]}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{item.author.name}</span>
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>
      <p className="text-sm whitespace-pre-wrap">{item.body}</p>
      <CommentReactions
        orgSlug={orgSlug}
        issueId={issueId}
        commentId={item.id}
        reactions={item.reactions ?? []}
      />
    </div>
  );
}

export function ActivityFeed({
  orgSlug,
  issueId,
}: {
  orgSlug: string;
  issueId: string;
}) {
  const { data, isLoading } = useIssueActivity(orgSlug, issueId);
  const createComment = useCreateComment(orgSlug, issueId);
  const [draft, setDraft] = useState('');

  const submitComment = () => {
    const text = draft.trim();
    if (!text || createComment.isPending) return;
    createComment.mutate(text, {
      onSuccess: () => setDraft(''),
    });
  };

  const items = data?.items ?? [];
  const events = items.filter((item) => item.kind === 'event');
  const comments = items.filter((item) => item.kind === 'comment');

  return (
    <div className="mt-8 border-t border-border/60 pt-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold">Activity</h2>
        <button className="text-xs text-muted-foreground hover:text-foreground">
          Subscribe
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading activity…</p>
      ) : (
        <div className="flex flex-col">
          {events.map((item) => (
            <EventRow key={item.id} item={item} />
          ))}
          {comments.map((item) => (
            <CommentCard
              key={item.id}
              orgSlug={orgSlug}
              issueId={issueId}
              item={item}
            />
          ))}
        </div>
      )}

      <div className="mt-3 rounded-lg border border-border/60 bg-container p-3 flex flex-col gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              submitComment();
            }
          }}
          placeholder="Leave a comment..."
          rows={2}
          className="w-full resize-none bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between">
          <Plus className="size-4 text-muted-foreground" />
          <Button
            size="xs"
            onClick={submitComment}
            disabled={!draft.trim() || createComment.isPending}
          >
            Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
