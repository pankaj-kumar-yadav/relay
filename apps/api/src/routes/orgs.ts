import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';

import { HttpStatus } from '@/constants/http.js';
import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/auth/requireAuth.js';
import { requireOrgMember } from '@/middleware/org/requireOrgMember.js';
import { issuesRouter } from '@/routes/issues/issues.js';
import { labelsRouter } from '@/routes/labels.js';
import { membersRouter } from '@/routes/members.js';
import { orgsInvitesRouter } from '@/routes/invites.js';
import { projectsRouter } from '@/routes/projects.js';
import { teamsRouter } from '@/routes/teams.js';
import { createDefaultTeam, publicTeam } from '@/utils/teams.js';
import {
  sendError,
  SlugTakenError,
  ValidationError,
} from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';

export const orgsRouter: Router = Router();

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug');

const createOrgSchema = z.object({
  name: z.string().trim().min(1),
  slug: slugSchema,
});

function publicOrg(org: { id: string; name: string; slug: string }) {
  return { id: org.id, name: org.name, slug: org.slug };
}

orgsRouter.use(requireAuth);

orgsRouter.post('/', async (req, res) => {
  try {
    const parsed = createOrgSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { name, slug } = parsed.data;
    const userId = req.user!.id;

    const { org, team } = await prisma.$transaction(async (tx) => {
      try {
        const created = await tx.organization.create({
          data: { name, slug },
          select: { id: true, name: true, slug: true },
        });
        await tx.membership.create({
          data: {
            organizationId: created.id,
            userId,
            role: OrgRole.ADMIN,
          },
        });
        const defaultTeam = await createDefaultTeam(tx, created.id);
        return { org: created, team: defaultTeam };
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          throw new SlugTakenError();
        }
        throw err;
      }
    });

    sendSuccess(res, {
      status: HttpStatus.CREATED,
      message: 'Organization created',
      data: {
        organization: publicOrg(org),
        role: OrgRole.ADMIN,
        team: publicTeam(team),
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});

orgsRouter.get('/', async (req, res) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { userId: req.user!.id },
      select: {
        role: true,
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    sendSuccess(res, {
      data: {
        organizations: memberships.map((m) => ({
          ...publicOrg(m.organization),
          role: m.role,
        })),
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});

orgsRouter.get('/:orgId', requireOrgMember, (req, res) => {
  sendSuccess(res, {
    data: {
      organization: publicOrg(req.org!),
      role: req.membership!.role,
    },
  });
});

orgsRouter.use('/:orgId/invites', orgsInvitesRouter);
orgsRouter.use('/:orgId/teams', teamsRouter);
orgsRouter.use('/:orgId/projects', projectsRouter);
orgsRouter.use('/:orgId/members', membersRouter);
orgsRouter.use('/:orgId/labels', labelsRouter);
orgsRouter.use('/:orgId/issues', issuesRouter);
