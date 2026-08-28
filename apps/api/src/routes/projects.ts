import { Router } from 'express';

import {
  DEFAULT_PROJECT_HEALTH,
  DEFAULT_PROJECT_STATUS,
  isProjectHealth,
  isProjectStatus,
} from '@/constants/project.constant.js';
import { HttpStatus } from '@/constants/http.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/auth/requireAuth.js';
import { requireOrgMember } from '@/middleware/org/requireOrgMember.js';
import { z } from '@/openapi/zod.js';
import { NotFoundError, sendError, ValidationError } from '@/utils/errors.js';
import { findProject, projectSelect, publicProject } from '@/utils/projects.js';
import { sendSuccess } from '@/utils/response.js';
import { findTeam } from '@/utils/teams.js';

export const projectsRouter: Router = Router({ mergeParams: true });

projectsRouter.use(requireAuth, requireOrgMember);

export const optionalDateSchema = z.string().trim().min(1).optional().nullable();

export const createProjectBodySchema = z.object({
  name: z.string().trim().min(1),
  teamId: z.string().trim().min(1),
  status: z.string().optional(),
  health: z.string().optional(),
  startDate: optionalDateSchema,
  targetDate: optionalDateSchema,
});

export const patchProjectBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  teamId: z.string().trim().min(1).optional(),
  status: z.string().optional(),
  health: z.string().optional(),
  startDate: optionalDateSchema,
  targetDate: optionalDateSchema,
});

export const listProjectsQuerySchema = z.object({
  teamId: z.string().optional(),
});

function parseOptionalDate(raw: string | null | undefined): Date | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === null || raw === '') return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError('Invalid date');
  }
  return date;
}

function assertStatusHealth(status?: string, health?: string) {
  if (status !== undefined && !isProjectStatus(status)) {
    throw new ValidationError('Invalid status');
  }
  if (health !== undefined && !isProjectHealth(health)) {
    throw new ValidationError('Invalid health');
  }
}

projectsRouter.get('/', async (req, res) => {
  try {
    const organizationId = req.org!.id;
    const teamIdRaw = typeof req.query.teamId === 'string' ? req.query.teamId : undefined;

    const where: { organizationId: string; teamId?: string } = { organizationId };
    if (teamIdRaw) {
      const team = await findTeam(organizationId, teamIdRaw);
      if (!team) {
        sendSuccess(res, { data: { projects: [] } });
        return;
      }
      where.teamId = team.id;
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: projectSelect,
    });

    sendSuccess(res, { data: { projects: projects.map(publicProject) } });
  } catch (err) {
    sendError(res, err);
  }
});

projectsRouter.post('/', async (req, res) => {
  try {
    const parsed = createProjectBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const organizationId = req.org!.id;
    const { name, teamId: teamIdRaw, status, health, startDate, targetDate } = parsed.data;
    assertStatusHealth(status, health);

    const team = await findTeam(organizationId, teamIdRaw);
    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const project = await prisma.project.create({
      data: {
        organizationId,
        teamId: team.id,
        name,
        status: status ?? DEFAULT_PROJECT_STATUS,
        health: health ?? DEFAULT_PROJECT_HEALTH,
        startDate: parseOptionalDate(startDate) ?? null,
        targetDate: parseOptionalDate(targetDate) ?? null,
      },
      select: projectSelect,
    });

    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'Project created',
      data: { project: publicProject(project) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

projectsRouter.get('/:projectId', async (req, res) => {
  try {
    const project = await findProject(req.org!.id, req.params.projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    sendSuccess(res, { data: { project: publicProject(project) } });
  } catch (err) {
    sendError(res, err);
  }
});

projectsRouter.patch('/:projectId', async (req, res) => {
  try {
    const parsed = patchProjectBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const organizationId = req.org!.id;
    const existing = await findProject(organizationId, req.params.projectId);
    if (!existing) {
      throw new NotFoundError('Project not found');
    }

    const { name, teamId: teamIdRaw, status, health, startDate, targetDate } = parsed.data;
    assertStatusHealth(status, health);

    let teamId: string | undefined;
    if (teamIdRaw) {
      const team = await findTeam(organizationId, teamIdRaw);
      if (!team) throw new NotFoundError('Team not found');
      teamId = team.id;
    }

    const project = await prisma.project.update({
      where: { id: existing.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(teamId ? { teamId } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(health !== undefined ? { health } : {}),
        ...(startDate !== undefined ? { startDate: parseOptionalDate(startDate) } : {}),
        ...(targetDate !== undefined ? { targetDate: parseOptionalDate(targetDate) } : {}),
      },
      select: projectSelect,
    });

    sendSuccess(res, {
      message: 'Project updated',
      data: { project: publicProject(project) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

projectsRouter.delete('/:projectId', async (req, res) => {
  try {
    const existing = await findProject(req.org!.id, req.params.projectId);
    if (!existing) {
      throw new NotFoundError('Project not found');
    }
    await prisma.project.delete({ where: { id: existing.id } });
    sendSuccess(res, {
      message: 'Project deleted',
      data: { id: existing.id },
    });
  } catch (err) {
    sendError(res, err);
  }
});
