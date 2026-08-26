import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import {
  DEFAULT_ISSUE_PRIORITY,
  DEFAULT_ISSUE_STATUS,
  IssueStatusCategory,
  isIssuePriority,
  isIssueStatus,
  statusesForCategories,
  type IssueStatusCategoryValue,
} from '@/constants/issue.js';
import { HttpStatus } from '@/constants/http.js';
import { ListLimit } from '@/constants/list.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requireOrgMember } from '@/middleware/requireOrgMember.js';
import {
  NotFoundError,
  sendError,
  ValidationError,
} from '@/utils/errors.js';
import { rankBetween } from '@/utils/issueRank.js';
import { issueIdentifier, parseIssueRef } from '@/utils/issueRef.js';
import { sendSuccess } from '@/utils/response.js';
import { assertProjectOnTeam } from '@/utils/projects.js';
import { ensureDefaultTeam, findTeam } from '@/utils/teams.js';

export const issuesRouter: Router = Router({ mergeParams: true });

issuesRouter.use(requireAuth, requireOrgMember);

const issueSelect = {
  id: true,
  number: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  rank: true,
  projectId: true,
  createdAt: true,
  updatedAt: true,
  team: { select: { id: true, key: true, name: true } },
  project: { select: { id: true, name: true, teamId: true } },
  assignee: { select: { id: true, name: true, email: true } },
} satisfies Prisma.IssueSelect;

type IssueRow = Prisma.IssueGetPayload<{ select: typeof issueSelect }>;

function publicIssue(issue: IssueRow) {
  return {
    id: issue.id,
    identifier: issueIdentifier(issue.team.key, issue.number),
    number: issue.number,
    title: issue.title,
    description: issue.description,
    status: issue.status,
    priority: issue.priority,
    rank: issue.rank,
    projectId: issue.projectId,
    project: issue.project
      ? { id: issue.project.id, name: issue.project.name }
      : null,
    team: issue.team,
    assignee: issue.assignee,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  };
}

async function loadIssue(organizationId: string, rawId: string) {
  const ref = parseIssueRef(rawId);
  if (!ref) return null;

  if (ref.kind === 'id') {
    return prisma.issue.findFirst({
      where: { id: ref.id, organizationId },
      select: issueSelect,
    });
  }

  return prisma.issue.findFirst({
    where: {
      organizationId,
      number: ref.number,
      team: { key: ref.teamKey, organizationId },
    },
    select: issueSelect,
  });
}

const createIssueSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  teamId: z.string().optional(),
  projectId: z.string().uuid().optional().nullable(),
});

const patchIssueSchema = z.object({
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
});

function parseLimit(raw: unknown): number {
  if (raw == null || raw === '') return ListLimit.DEFAULT;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new ValidationError('limit must be a positive integer');
  }
  return Math.min(n, ListLimit.MAX);
}

function parseStatusCategories(raw: unknown): IssueStatusCategoryValue[] | undefined {
  if (raw == null || raw === '') return undefined;
  const values = String(raw)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  const allowed = new Set<string>(Object.values(IssueStatusCategory));
  for (const value of values) {
    if (!allowed.has(value)) {
      throw new ValidationError(`Invalid statusCategory: ${value}`);
    }
  }
  return values as IssueStatusCategoryValue[];
}

async function assertAssigneeInOrg(organizationId: string, assigneeId: string | null | undefined) {
  if (!assigneeId) return;
  const membership = await prisma.membership.findUnique({
    where: {
      organizationId_userId: { organizationId, userId: assigneeId },
    },
    select: { id: true },
  });
  if (!membership) {
    throw new ValidationError('Assignee must belong to this organization');
  }
}

issuesRouter.get('/', async (req, res) => {
  try {
    const organizationId = req.org!.id;
    const limit = parseLimit(req.query.limit);
    const teamIdRaw = typeof req.query.teamId === 'string' ? req.query.teamId : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const priority = typeof req.query.priority === 'string' ? req.query.priority : undefined;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : undefined;
    const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
    const projectId =
      typeof req.query.projectId === 'string' ? req.query.projectId : undefined;
    let assigneeId =
      typeof req.query.assigneeId === 'string' ? req.query.assigneeId : undefined;
    if (assigneeId === 'me') assigneeId = req.user!.id;

    if (status && !isIssueStatus(status)) {
      throw new ValidationError('Invalid status');
    }
    if (priority && !isIssuePriority(priority)) {
      throw new ValidationError('Invalid priority');
    }

    const categories = parseStatusCategories(req.query.statusCategory);
    const statusIds = categories ? statusesForCategories(categories) : undefined;

    const where: Prisma.IssueWhereInput = { organizationId };
    if (teamIdRaw) {
      const team = await findTeam(organizationId, teamIdRaw);
      if (!team) {
        sendSuccess(res, {
          data: { issues: [], nextCursor: null },
        });
        return;
      }
      where.teamId = team.id;
    }
    if (status) where.status = status;
    else if (statusIds) where.status = { in: statusIds };
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (projectId) where.projectId = projectId;
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (cursor) {
      const cursorIssue = await prisma.issue.findFirst({
        where: { id: cursor, organizationId },
        select: { id: true, rank: true },
      });
      if (cursorIssue) {
        where.AND = [
          {
            OR: [
              { rank: { gt: cursorIssue.rank } },
              { rank: cursorIssue.rank, id: { gt: cursorIssue.id } },
            ],
          },
        ];
      }
    }

    const rows = await prisma.issue.findMany({
      where,
      orderBy: [{ rank: 'asc' }, { id: 'asc' }],
      take: limit + 1,
      select: issueSelect,
    });

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    sendSuccess(res, {
      data: {
        issues: page.map(publicIssue),
        nextCursor: hasMore ? page[page.length - 1]!.id : null,
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});

issuesRouter.post('/', async (req, res) => {
  try {
    const parsed = createIssueSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const organizationId = req.org!.id;
    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      teamId,
      projectId,
    } = parsed.data;

    if (status && !isIssueStatus(status)) {
      throw new ValidationError('Invalid status');
    }
    if (priority && !isIssuePriority(priority)) {
      throw new ValidationError('Invalid priority');
    }

    await assertAssigneeInOrg(organizationId, assigneeId);

    const team = teamId
      ? await findTeam(organizationId, teamId)
      : await ensureDefaultTeam(prisma, organizationId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    let resolvedProjectId: string | null = null;
    if (projectId) {
      const project = await assertProjectOnTeam(organizationId, projectId, team.id);
      resolvedProjectId = project.id;
    }

    const issue = await prisma.$transaction(async (tx) => {
      const last = await tx.issue.findFirst({
        where: { teamId: team.id },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      const lastRanked = await tx.issue.findFirst({
        where: { teamId: team.id },
        orderBy: [{ rank: 'desc' }, { id: 'desc' }],
        select: { rank: true },
      });

      return tx.issue.create({
        data: {
          organizationId,
          teamId: team.id,
          number: (last?.number ?? 0) + 1,
          title,
          description: description ?? null,
          status: status ?? DEFAULT_ISSUE_STATUS,
          priority: priority ?? DEFAULT_ISSUE_PRIORITY,
          assigneeId: assigneeId ?? null,
          projectId: resolvedProjectId,
          rank: rankBetween(lastRanked?.rank ?? null, null),
        },
        select: issueSelect,
      });
    });

    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'Issue created',
      data: { issue: publicIssue(issue) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

issuesRouter.get('/:issueId', async (req, res) => {
  try {
    const issue = await loadIssue(req.org!.id, req.params.issueId);
    if (!issue) {
      throw new NotFoundError('Issue not found');
    }
    sendSuccess(res, { data: { issue: publicIssue(issue) } });
  } catch (err) {
    sendError(res, err);
  }
});

issuesRouter.patch('/:issueId', async (req, res) => {
  try {
    const parsed = patchIssueSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const organizationId = req.org!.id;
    const existing = await loadIssue(organizationId, req.params.issueId);
    if (!existing) {
      throw new NotFoundError('Issue not found');
    }

    const data = parsed.data;
    if (data.status && !isIssueStatus(data.status)) {
      throw new ValidationError('Invalid status');
    }
    if (data.priority && !isIssuePriority(data.priority)) {
      throw new ValidationError('Invalid priority');
    }
    if (data.assigneeId !== undefined) {
      await assertAssigneeInOrg(organizationId, data.assigneeId);
    }

    let teamId: string | undefined;
    if (data.teamId) {
      const team = await findTeam(organizationId, data.teamId);
      if (!team) throw new NotFoundError('Team not found');
      teamId = team.id;
    }

    const effectiveTeamId = teamId ?? existing.team.id;
    let nextProjectId: string | null | undefined;
    if (data.projectId !== undefined) {
      if (data.projectId === null) {
        nextProjectId = null;
      } else {
        const project = await assertProjectOnTeam(
          organizationId,
          data.projectId,
          effectiveTeamId,
        );
        nextProjectId = project.id;
      }
    } else if (teamId && existing.project && existing.project.teamId !== teamId) {
      nextProjectId = null;
    }

    let nextNumber: number | undefined;
    if (teamId && teamId !== existing.team.id) {
      const last = await prisma.issue.findFirst({
        where: { teamId },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      nextNumber = (last?.number ?? 0) + 1;
    }

    let rank = data.rank;
    if (data.beforeIssueId || data.afterIssueId) {
      const before = data.beforeIssueId
        ? await loadIssue(organizationId, data.beforeIssueId)
        : null;
      const after = data.afterIssueId
        ? await loadIssue(organizationId, data.afterIssueId)
        : null;
      if (data.beforeIssueId && !before) {
        throw new NotFoundError('beforeIssueId not found');
      }
      if (data.afterIssueId && !after) {
        throw new NotFoundError('afterIssueId not found');
      }
      rank = rankBetween(before?.rank ?? null, after?.rank ?? null);
    }

    const issue = await prisma.issue.update({
      where: { id: existing.id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId } : {}),
        ...(nextProjectId !== undefined ? { projectId: nextProjectId } : {}),
        ...(teamId ? { teamId } : {}),
        ...(nextNumber !== undefined ? { number: nextNumber } : {}),
        ...(rank ? { rank } : {}),
      },
      select: issueSelect,
    });

    sendSuccess(res, {
      message: 'Issue updated',
      data: { issue: publicIssue(issue) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

issuesRouter.delete('/:issueId', async (req, res) => {
  try {
    const existing = await loadIssue(req.org!.id, req.params.issueId);
    if (!existing) {
      throw new NotFoundError('Issue not found');
    }
    await prisma.issue.delete({ where: { id: existing.id } });
    sendSuccess(res, {
      message: 'Issue deleted',
      data: { id: existing.id },
    });
  } catch (err) {
    sendError(res, err);
  }
});
