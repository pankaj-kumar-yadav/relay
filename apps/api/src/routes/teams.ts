import { Prisma } from '@prisma/client';
import { Router } from 'express';

import { HttpStatus } from '@/constants/http.js';
import { TEAM_ICON_MAX, isTeamKey, normalizeTeamKey } from '@/constants/team.constant.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/auth/requireAuth.js';
import { requireOrgMember } from '@/middleware/org/requireOrgMember.js';
import { z } from '@/openapi/zod.js';
import { cyclesRouter } from '@/routes/cycles/cycles.js';
import {
  NotFoundError,
  sendError,
  TeamKeyTakenError,
  ValidationError,
} from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';
import { ensureDefaultTeam, findTeam, publicTeam, teamSelect } from '@/utils/teams.js';

export const teamsRouter: Router = Router({ mergeParams: true });

teamsRouter.use(requireAuth, requireOrgMember);
teamsRouter.use('/:teamId/cycles', cyclesRouter);

const teamIconSchema = z.string().trim().max(TEAM_ICON_MAX);

export const createTeamBodySchema = z.object({
  name: z.string().trim().min(1),
  key: z.string().trim().min(1),
  icon: teamIconSchema.optional(),
});

export const patchTeamBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  key: z.string().trim().min(1).optional(),
  icon: teamIconSchema.optional(),
});

function parseTeamKey(raw: string): string {
  const key = normalizeTeamKey(raw);
  if (!isTeamKey(key)) {
    throw new ValidationError('Team key must be 2–10 uppercase letters or digits');
  }
  return key;
}

function isUniqueTeamKeyError(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

teamsRouter.get('/', async (req, res) => {
  try {
    const organizationId = req.org!.id;
    await ensureDefaultTeam(prisma, organizationId);

    const teams = await prisma.team.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      select: teamSelect,
    });

    sendSuccess(res, { data: { teams: teams.map(publicTeam) } });
  } catch (err) {
    sendError(res, err);
  }
});

teamsRouter.post('/', async (req, res) => {
  try {
    const parsed = createTeamBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const organizationId = req.org!.id;
    const name = parsed.data.name;
    const key = parseTeamKey(parsed.data.key);

    try {
      const team = await prisma.team.create({
        data: { organizationId, name, key, icon: parsed.data.icon ?? '' },
        select: teamSelect,
      });
      sendSuccess(res, {
        status: HttpStatus.CREATED,
        message: 'Team created',
        data: { team: publicTeam(team) },
      });
    } catch (err) {
      if (isUniqueTeamKeyError(err)) {
        throw new TeamKeyTakenError();
      }
      throw err;
    }
  } catch (err) {
    sendError(res, err);
  }
});

teamsRouter.get('/:teamId', async (req, res) => {
  try {
    const team = await findTeam(req.org!.id, req.params.teamId);
    if (!team) {
      throw new NotFoundError('Team not found');
    }
    sendSuccess(res, { data: { team: publicTeam(team) } });
  } catch (err) {
    sendError(res, err);
  }
});

teamsRouter.patch('/:teamId', async (req, res) => {
  try {
    const parsed = patchTeamBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const existing = await findTeam(req.org!.id, req.params.teamId);
    if (!existing) {
      throw new NotFoundError('Team not found');
    }

    const name = parsed.data.name;
    const key = parsed.data.key !== undefined ? parseTeamKey(parsed.data.key) : undefined;
    const icon = parsed.data.icon;
    if (name === undefined && key === undefined && icon === undefined) {
      throw new ValidationError('No fields to update');
    }

    try {
      const team = await prisma.team.update({
        where: { id: existing.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(key !== undefined ? { key } : {}),
          ...(icon !== undefined ? { icon } : {}),
        },
        select: teamSelect,
      });
      sendSuccess(res, {
        message: 'Team updated',
        data: { team: publicTeam(team) },
      });
    } catch (err) {
      if (isUniqueTeamKeyError(err)) {
        throw new TeamKeyTakenError();
      }
      throw err;
    }
  } catch (err) {
    sendError(res, err);
  }
});
