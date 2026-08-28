import {
  COMMENT_BODY_MAX,
  COMMENT_REACTION_EMOJI_MAX,
} from '@/constants/activity.constant.js';
import { z } from '@/openapi/zod.js';
import { isCommentReactionEmoji } from '@/utils/issue/commentReaction.js';

export const createCommentBodySchema = z.object({
  body: z.string().trim().min(1).max(COMMENT_BODY_MAX),
});

export const toggleReactionBodySchema = z.object({
  emoji: z
    .string()
    .trim()
    .min(1)
    .max(COMMENT_REACTION_EMOJI_MAX)
    .refine(isCommentReactionEmoji, 'Invalid emoji'),
});
