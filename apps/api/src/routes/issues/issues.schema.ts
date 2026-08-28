import { LABEL_IDS_MAX } from '@/constants/label.constant.js';
import { z } from '@/openapi/zod.js';

export const createIssueBodySchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  teamId: z.string().optional(),
  projectId: z.string().uuid().optional().nullable(),
  labelIds: z.array(z.string().uuid()).max(LABEL_IDS_MAX).optional(),
  cycleId: z.string().uuid().optional().nullable(),
});

export const patchIssueBodySchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  teamId: z.string().optional(),
  projectId: z.string().uuid().optional().nullable(),
  rank: z.string().min(1).optional(),
  beforeIssueId: z.string().optional(),
  afterIssueId: z.string().optional(),
  cycleId: z.string().uuid().optional().nullable(),
});

export const setIssueLabelsBodySchema = z.object({
  labelIds: z.array(z.string().uuid()).max(LABEL_IDS_MAX),
});

export const listIssuesQuerySchema = z.object({
  limit: z.string().optional(),
  teamId: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  statusCategory: z.string().optional(),
  cycleId: z.string().optional(),
});
