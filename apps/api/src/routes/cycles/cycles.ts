import { Prisma } from '@prisma/client';
import { Router } from 'express';

import {
  CycleStatus,
  DEFAULT_CYCLE_STATUS,
  isCycleStatus,
} from '@/constants/cycle.constant.js';
import { HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/auth/requireAuth.js';
import { requireOrgMember } from '@/middleware/org/requireOrgMember.js';
import {
  createCycleBodySchema,
  patchCycleBodySchema,
} from '@/routes/cycles/cycles.schema.js';
import {
  activeCycleConflictError,
  assertCycleRange,
  assertNoOtherActiveCycle,
  isActiveCycleConflict,
  parseCycleInstant,
} from '@/utils/cycle/cycle.js';
import { NotFoundError, sendError, ValidationError } from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';
import { findTeam } from '@/utils/teams.js';

export const cyclesRouter: Router = Router({ mergeParams: true });

cyclesRouter.use(requireAuth, requireOrgMember);

const cycleSelect = {
  id: true,
  name: true,
  status: true,
  startsAt: true,
  endsAt: true,
  teamId: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { issues: true } },
} satisfies Prisma.CycleSelect;

type CycleRow = Prisma.CycleGetPayload<{ select: typeof cycleSelect }>;

function publicCycle(cycle: CycleRow) {
  return {
    id: cycle.id,
    name: cycle.name,
    status: cycle.status,
    startsAt: cycle.startsAt.toISOString(),
    endsAt: cycle.endsAt.toISOString(),
    teamId: cycle.teamId,
    issueCount: cycle._count.issues,
    createdAt: cycle.createdAt.toISOString(),
    updatedAt: cycle.updatedAt.toISOString(),
  };
}

async function loadTeam(organizationId: string, teamId: string) {
  const team = await findTeam(organizationId, teamId);
  if (!team) {
    throw new NotFoundError('Team not found');
  }
  return team;
}

function teamIdParam(req: { params: Record<string, string | undefined> }) {
  return String(req.params.teamId ?? '');
}

function parseStatus(raw: string | undefined, fallback = DEFAULT_CYCLE_STATUS) {
  const status = raw ?? fallback;
  if (!isCycleStatus(status)) {
    throw new ValidationError('Invalid status');
  }
  return status;
}

cyclesRouter.get('/', async (req, res) => {
  try {
    const organizationId = req.org!.id;
    const team = await loadTeam(organizationId, teamIdParam(req));
    const cycles = await prisma.cycle.findMany({
      where: { organizationId, teamId: team.id },
      orderBy: { startsAt: 'desc' },
      select: cycleSelect,
    });
    sendSuccess(res, { data: { cycles: cycles.map(publicCycle) } });
  } catch (err) {
    sendError(res, err);
  }
});

cyclesRouter.post('/', async (req, res) => {
  try {
    const parsed = createCycleBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const organizationId = req.org!.id;
    const team = await loadTeam(organizationId, teamIdParam(req));
    const name = parsed.data.name;
    const startsAt = parseCycleInstant(parsed.data.startsAt, 'startsAt');
    const endsAt = parseCycleInstant(parsed.data.endsAt, 'endsAt');
    assertCycleRange(startsAt, endsAt);
    const status = parseStatus(parsed.data.status);

    await assertNoOtherActiveCycle({ teamId: team.id, nextStatus: status });

    try {
      const cycle = await prisma.cycle.create({
        data: {
          organizationId,
          teamId: team.id,
          name,
          startsAt,
          endsAt,
          status,
        },
        select: cycleSelect,
      });
      sendSuccess(res, {
        status: HttpStatus.CREATED,
        message: 'Cycle created',
        data: { cycle: publicCycle(cycle) },
      });
    } catch (err) {
      if (isActiveCycleConflict(err) && status === CycleStatus.ACTIVE) {
        throw activeCycleConflictError();
      }
      throw err;
    }
  } catch (err) {
    sendError(res, err);
  }
});

cyclesRouter.patch('/:cycleId', async (req, res) => {
  try {
    const parsed = patchCycleBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }
    if (
      parsed.data.name === undefined &&
      parsed.data.startsAt === undefined &&
      parsed.data.endsAt === undefined &&
      parsed.data.status === undefined
    ) {
      throw new ValidationError('No fields to update');
    }

    const organizationId = req.org!.id;
    const team = await loadTeam(organizationId, teamIdParam(req));
    const existing = await prisma.cycle.findFirst({
      where: {
        id: String(req.params.cycleId),
        organizationId,
        teamId: team.id,
      },
      select: cycleSelect,
    });
    if (!existing) {
      throw new NotFoundError('Cycle not found');
    }

    const startsAt =
      parsed.data.startsAt !== undefined
        ? parseCycleInstant(parsed.data.startsAt, 'startsAt')
        : existing.startsAt;
    const endsAt =
      parsed.data.endsAt !== undefined
        ? parseCycleInstant(parsed.data.endsAt, 'endsAt')
        : existing.endsAt;
    assertCycleRange(startsAt, endsAt);
    const status =
      parsed.data.status !== undefined
        ? parseStatus(parsed.data.status)
        : existing.status;

    await assertNoOtherActiveCycle({
      teamId: team.id,
      exceptId: existing.id,
      nextStatus: status,
    });

    try {
      const cycle = await prisma.cycle.update({
        where: { id: existing.id },
        data: {
          ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
          ...(parsed.data.startsAt !== undefined ? { startsAt } : {}),
          ...(parsed.data.endsAt !== undefined ? { endsAt } : {}),
          ...(parsed.data.status !== undefined ? { status } : {}),
        },
        select: cycleSelect,
      });
      sendSuccess(res, {
        message: 'Cycle updated',
        data: { cycle: publicCycle(cycle) },
      });
    } catch (err) {
      if (isActiveCycleConflict(err) && status === CycleStatus.ACTIVE) {
        throw activeCycleConflictError();
      }
      throw err;
    }
  } catch (err) {
    sendError(res, err);
  }
});
