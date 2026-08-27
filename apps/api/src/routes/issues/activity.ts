import { Router } from 'express';
import { z } from 'zod';

import {
  ACTIVITY_LIST_LIMIT,
  COMMENT_BODY_MAX,
  COMMENT_REACTION_EMOJI_MAX,
} from '@/constants/activity.constant.js';
import { HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import {
  ForbiddenError,
  NotFoundError,
  sendError,
  ValidationError,
} from '@/utils/errors.js';
import { aggregateCommentReactions, isCommentReactionEmoji } from '@/utils/issue/commentReaction.js';
import { parseIssueRef } from '@/utils/issue/issueRef.js';
import { sendSuccess } from '@/utils/response.js';

export const activityRouter: Router = Router({ mergeParams: true });

const createCommentSchema = z.object({
  body: z.string().trim().min(1).max(COMMENT_BODY_MAX),
});

const toggleReactionSchema = z.object({
  emoji: z
    .string()
    .trim()
    .min(1)
    .max(COMMENT_REACTION_EMOJI_MAX)
    .refine(isCommentReactionEmoji, 'Invalid emoji'),
});

const actorSelect = { id: true, name: true } as const;
const reactionSelect = { emoji: true, userId: true } as const;

async function findIssueInOrg(organizationId: string, rawId: string) {
  const ref = parseIssueRef(rawId);
  if (!ref) return null;

  if (ref.kind === 'id') {
    return prisma.issue.findFirst({
      where: { id: ref.id, organizationId },
      select: { id: true },
    });
  }

  return prisma.issue.findFirst({
    where: {
      organizationId,
      number: ref.number,
      team: { key: ref.teamKey, organizationId },
    },
    select: { id: true },
  });
}

function publicActor(user: { id: string; name: string }) {
  return { id: user.id, name: user.name };
}

async function findCommentInIssue(
  organizationId: string,
  issueId: string,
  commentId: string,
) {
  return prisma.comment.findFirst({
    where: { id: commentId, organizationId, issueId },
    select: { id: true, authorId: true },
  });
}

activityRouter.get('/:issueId/activity', async (req, res) => {
  try {
    const organizationId = req.org!.id;
    const issue = await findIssueInOrg(organizationId, req.params.issueId);
    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    const [comments, events] = await Promise.all([
      prisma.comment.findMany({
        where: { organizationId, issueId: issue.id },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: actorSelect },
          reactions: {
            select: reactionSelect,
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.issueEvent.findMany({
        where: { organizationId, issueId: issue.id },
        select: {
          id: true,
          type: true,
          payload: true,
          createdAt: true,
          actor: { select: actorSelect },
        },
      }),
    ]);

    const items = [
      ...events.map((event) => ({
        kind: 'event' as const,
        id: event.id,
        type: event.type,
        actor: publicActor(event.actor),
        payload: (event.payload ?? {}) as Record<string, unknown>,
        createdAt: event.createdAt.toISOString(),
      })),
      ...comments.map((comment) => ({
        kind: 'comment' as const,
        id: comment.id,
        body: comment.body,
        author: publicActor(comment.author),
        createdAt: comment.createdAt.toISOString(),
        reactions: aggregateCommentReactions(comment.reactions, req.user!.id),
      })),
    ].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    const page =
      items.length > ACTIVITY_LIST_LIMIT
        ? items.slice(-ACTIVITY_LIST_LIMIT)
        : items;

    sendSuccess(res, { data: { items: page } });
  } catch (err) {
    sendError(res, err);
  }
});

activityRouter.post('/:issueId/comments', async (req, res) => {
  try {
    const parsed = createCommentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const organizationId = req.org!.id;
    const issue = await findIssueInOrg(organizationId, req.params.issueId);
    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    const comment = await prisma.comment.create({
      data: {
        organizationId,
        issueId: issue.id,
        authorId: req.user!.id,
        body: parsed.data.body,
      },
      select: {
        id: true,
        body: true,
        createdAt: true,
        author: { select: actorSelect },
      },
    });

    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'Comment created',
      data: {
        comment: {
          id: comment.id,
          body: comment.body,
          author: publicActor(comment.author),
          createdAt: comment.createdAt.toISOString(),
          reactions: [],
        },
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});

activityRouter.delete('/:issueId/comments/:commentId', async (req, res) => {
  try {
    const organizationId = req.org!.id;
    const issue = await findIssueInOrg(organizationId, req.params.issueId);
    if (!issue) {
      throw new NotFoundError('Issue not found');
    }

    const comment = await findCommentInIssue(
      organizationId,
      issue.id,
      req.params.commentId,
    );
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }
    if (comment.authorId !== req.user!.id) {
      throw new ForbiddenError('You can only delete your own comment');
    }

    await prisma.comment.delete({ where: { id: comment.id } });
    sendSuccess(res, {
      message: 'Comment deleted',
      data: { id: comment.id },
    });
  } catch (err) {
    sendError(res, err);
  }
});

activityRouter.post(
  '/:issueId/comments/:commentId/reactions',
  async (req, res) => {
    try {
      const parsed = toggleReactionSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(
          parsed.error.issues[0]?.message ?? 'Invalid input',
        );
      }

      const organizationId = req.org!.id;
      const userId = req.user!.id;
      const issue = await findIssueInOrg(organizationId, req.params.issueId);
      if (!issue) {
        throw new NotFoundError('Issue not found');
      }

      const comment = await findCommentInIssue(
        organizationId,
        issue.id,
        req.params.commentId,
      );
      if (!comment) {
        throw new NotFoundError('Comment not found');
      }

      const { emoji } = parsed.data;
      const existing = await prisma.commentReaction.findUnique({
        where: {
          commentId_userId_emoji: {
            commentId: comment.id,
            userId,
            emoji,
          },
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.commentReaction.delete({ where: { id: existing.id } });
      } else {
        await prisma.commentReaction.create({
          data: {
            organizationId,
            commentId: comment.id,
            userId,
            emoji,
          },
        });
      }

      const rows = await prisma.commentReaction.findMany({
        where: { organizationId, commentId: comment.id },
        select: reactionSelect,
        orderBy: { createdAt: 'asc' },
      });

      sendSuccess(res, {
        status: existing ? HttpStatus.OK : HttpStatus.CREATED,
        message: existing ? 'Reaction removed' : 'Reaction added',
        data: { reactions: aggregateCommentReactions(rows, userId) },
      });
    } catch (err) {
      sendError(res, err);
    }
  },
);
