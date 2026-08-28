import { Prisma } from '@prisma/client';
import { Router } from 'express';

import {
  DEFAULT_ISSUE_PRIORITY,
  DEFAULT_ISSUE_STATUS,
  IssueStatusCategory,
  isIssuePriority,
  isIssueStatus,
  statusesForCategories,
  type IssueStatusCategoryValue,
} from '@/constants/issue.js';
import { IssueEventType } from '@/constants/activity.constant.js';
import { HttpStatus } from '@/constants/http.js';
import { NotificationType } from '@/constants/inbox.constant.js';
import { ListLimit } from '@/constants/list.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/auth/requireAuth.js';
import { requireOrgMember } from '@/middleware/org/requireOrgMember.js';
import { activityRouter } from '@/routes/issues/activity.js';
import {
  createIssueBodySchema,
  patchIssueBodySchema,
  setIssueLabelsBodySchema,
} from '@/routes/issues/issues.schema.js';
import {
  NotFoundError,
  sendError,
  ValidationError,
} from '@/utils/errors.js';
import { notifyIfRecipient } from '@/utils/inbox/notify.js';
import { assertCycleOnTeam } from '@/utils/cycle/cycle.js';
import { eventPayload, labelEventPayload, recordIssueEvent } from '@/utils/issue/issueEvent.js';
import { loadOrgLabels, syncIssueLabels } from '@/utils/issue/issueLabels.js';
import { rankBetween } from '@/utils/issue/issueRank.js';
import { issueIdentifier, parseIssueRef } from '@/utils/issue/issueRef.js';
import { sendSuccess } from '@/utils/response.js';
import { assertProjectOnTeam } from '@/utils/projects.js';
import { ensureDefaultTeam, findTeam, UUID_RE } from '@/utils/teams.js';

export const issuesRouter: Router = Router({ mergeParams: true });

issuesRouter.use(requireAuth, requireOrgMember);
issuesRouter.use(activityRouter);

const issueSelect = {
  id: true,
  number: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  rank: true,
  projectId: true,
  cycleId: true,
  createdAt: true,
  updatedAt: true,
  team: { select: { id: true, key: true, name: true } },
  project: { select: { id: true, name: true, teamId: true } },
  cycle: { select: { id: true, name: true, status: true, teamId: true } },
  assignee: { select: { id: true, name: true, email: true } },
  issueLabels: {
    select: { label: { select: { id: true, name: true, color: true } } },
    orderBy: { label: { name: 'asc' } },
  },
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
    cycleId: issue.cycleId,
    cycle: issue.cycle
      ? { id: issue.cycle.id, name: issue.cycle.name, status: issue.cycle.status }
      : null,
    team: issue.team,
    assignee: issue.assignee,
    labels: issue.issueLabels.map((row) => row.label),
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
    const cycleIdRaw = typeof req.query.cycleId === 'string' ? req.query.cycleId : undefined;
    if (cycleIdRaw) {
      if (!UUID_RE.test(cycleIdRaw)) {
        sendSuccess(res, {
          data: { issues: [], nextCursor: null },
        });
        return;
      }
      const cycle = await prisma.cycle.findFirst({
        where: { id: cycleIdRaw, organizationId },
        select: { id: true },
      });
      if (!cycle) {
        sendSuccess(res, {
          data: { issues: [], nextCursor: null },
        });
        return;
      }
      where.cycleId = cycle.id;
    }
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
    const parsed = createIssueBodySchema.safeParse(req.body);
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
      labelIds,
      cycleId,
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

    const labels = labelIds ? await loadOrgLabels(organizationId, labelIds) : [];

    let resolvedCycleId: string | null = null;
    let createdCycleName: string | null = null;
    if (cycleId) {
      const cycle = await assertCycleOnTeam({
        organizationId,
        teamId: team.id,
        cycleId,
      });
      resolvedCycleId = cycle.id;
      createdCycleName = cycle.name;
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

      const created = await tx.issue.create({
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
          cycleId: resolvedCycleId,
          rank: rankBetween(lastRanked?.rank ?? null, null),
        },
        select: { id: true },
      });
      await recordIssueEvent(tx, {
        organizationId,
        issueId: created.id,
        actorId: req.user!.id,
        type: IssueEventType.CREATED,
        payload: eventPayload(IssueEventType.CREATED),
      });
      if (labels.length > 0) {
        const { added } = await syncIssueLabels(tx, {
          organizationId,
          issueId: created.id,
          labels,
        });
        await recordIssueEvent(tx, {
          organizationId,
          issueId: created.id,
          actorId: req.user!.id,
          type: IssueEventType.LABEL,
          payload: labelEventPayload(added, []),
        });
      }
      if (createdCycleName) {
        await recordIssueEvent(tx, {
          organizationId,
          issueId: created.id,
          actorId: req.user!.id,
          type: IssueEventType.CYCLE,
          payload: eventPayload(IssueEventType.CYCLE, null, createdCycleName),
        });
      }
      return tx.issue.findFirstOrThrow({
        where: { id: created.id },
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

issuesRouter.put('/:issueId/labels', async (req, res) => {
  try {
    const parsed = setIssueLabelsBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const organizationId = req.org!.id;
    const existing = await loadIssue(organizationId, req.params.issueId);
    if (!existing) {
      throw new NotFoundError('Issue not found');
    }

    const labels = await loadOrgLabels(organizationId, parsed.data.labelIds);
    const issue = await prisma.$transaction(async (tx) => {
      const { added, removed } = await syncIssueLabels(tx, {
        organizationId,
        issueId: existing.id,
        labels,
      });
      if (added.length > 0 || removed.length > 0) {
        await recordIssueEvent(tx, {
          organizationId,
          issueId: existing.id,
          actorId: req.user!.id,
          type: IssueEventType.LABEL,
          payload: labelEventPayload(added, removed),
        });
      }
      return tx.issue.findFirstOrThrow({
        where: { id: existing.id },
        select: issueSelect,
      });
    });

    sendSuccess(res, {
      message: 'Labels updated',
      data: { issue: publicIssue(issue) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

issuesRouter.patch('/:issueId', async (req, res) => {
  try {
    const parsed = patchIssueBodySchema.safeParse(req.body);
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

    let nextCycleId: string | null | undefined;
    let nextCycleName: string | null | undefined;
    if (data.cycleId !== undefined) {
      if (data.cycleId === null) {
        nextCycleId = null;
        nextCycleName = null;
      } else {
        const cycle = await assertCycleOnTeam({
          organizationId,
          teamId: effectiveTeamId,
          cycleId: data.cycleId,
        });
        nextCycleId = cycle.id;
        nextCycleName = cycle.name;
      }
    } else if (teamId && existing.cycle && existing.cycle.teamId !== teamId) {
      nextCycleId = null;
      nextCycleName = null;
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

    const issue = await prisma.$transaction(async (tx) => {
      const updated = await tx.issue.update({
        where: { id: existing.id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.priority !== undefined ? { priority: data.priority } : {}),
          ...(data.assigneeId !== undefined ? { assigneeId: data.assigneeId } : {}),
          ...(nextProjectId !== undefined ? { projectId: nextProjectId } : {}),
          ...(nextCycleId !== undefined ? { cycleId: nextCycleId } : {}),
          ...(teamId ? { teamId } : {}),
          ...(nextNumber !== undefined ? { number: nextNumber } : {}),
          ...(rank ? { rank } : {}),
        },
        select: issueSelect,
      });

      const actorId = req.user!.id;
      if (data.status !== undefined && data.status !== existing.status) {
        await recordIssueEvent(tx, {
          organizationId,
          issueId: existing.id,
          actorId,
          type: IssueEventType.STATUS,
          payload: eventPayload(IssueEventType.STATUS, existing.status, data.status),
        });
      }
      if (data.priority !== undefined && data.priority !== existing.priority) {
        await recordIssueEvent(tx, {
          organizationId,
          issueId: existing.id,
          actorId,
          type: IssueEventType.PRIORITY,
          payload: eventPayload(
            IssueEventType.PRIORITY,
            existing.priority,
            data.priority,
          ),
        });
      }
      const previousAssigneeId = existing.assignee?.id ?? null;
      if (data.assigneeId !== undefined && data.assigneeId !== previousAssigneeId) {
        await recordIssueEvent(tx, {
          organizationId,
          issueId: existing.id,
          actorId,
          type: IssueEventType.ASSIGNEE,
          payload: eventPayload(
            IssueEventType.ASSIGNEE,
            previousAssigneeId,
            data.assigneeId,
          ),
        });
        await notifyIfRecipient(tx, {
          organizationId,
          issueId: existing.id,
          actorId,
          recipientId: data.assigneeId,
          type: NotificationType.ASSIGNEE,
        });
      }

      const nextAssigneeId = updated.assignee?.id ?? null;
      if (data.status !== undefined && data.status !== existing.status) {
        await notifyIfRecipient(tx, {
          organizationId,
          issueId: existing.id,
          actorId,
          recipientId: nextAssigneeId,
          type: NotificationType.STATUS,
        });
      }

      const previousCycleId = existing.cycleId;
      if (nextCycleId !== undefined && nextCycleId !== previousCycleId) {
        await recordIssueEvent(tx, {
          organizationId,
          issueId: existing.id,
          actorId,
          type: IssueEventType.CYCLE,
          payload: eventPayload(
            IssueEventType.CYCLE,
            existing.cycle?.name ?? null,
            nextCycleName ?? null,
          ),
        });
      }

      return updated;
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
