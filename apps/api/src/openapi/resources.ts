import { z } from '@/openapi/zod.js';

export const publicOrgSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

export const publicTeamSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  icon: z.string(),
});

export const publicActorSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const publicMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  joinedAt: z.string(),
});

export const publicInviteSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.string(),
  expiresAt: z.string(),
});

export const publicLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  createdAt: z.string(),
  issueCount: z.number().int(),
});

export const publicCycleSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  teamId: z.string(),
  issueCount: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const publicProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  health: z.string(),
  startDate: z.string().nullable(),
  targetDate: z.string().nullable(),
  team: publicTeamSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const issueLabelSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
});

export const publicIssueSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  number: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  priority: z.string(),
  rank: z.string(),
  projectId: z.string().nullable(),
  project: z.object({ id: z.string(), name: z.string() }).nullable(),
  cycleId: z.string().nullable(),
  cycle: z
    .object({
      id: z.string(),
      name: z.string(),
      status: z.string(),
    })
    .nullable(),
  team: publicTeamSchema,
  assignee: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
    })
    .nullable(),
  labels: z.array(issueLabelSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const reactionAggregateSchema = z.object({
  emoji: z.string(),
  count: z.number().int(),
  reacted: z.boolean(),
});

export const publicCommentSchema = z.object({
  id: z.string(),
  body: z.string(),
  author: publicActorSchema,
  createdAt: z.string(),
  reactions: z.array(reactionAggregateSchema),
});

export const publicNotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
  actor: publicActorSchema,
  issue: z.object({
    id: z.string(),
    identifier: z.string(),
    title: z.string(),
    status: z.string(),
  }),
});
