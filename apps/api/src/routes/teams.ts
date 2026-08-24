import { Router } from 'express';

import { requireAuth } from '@/middleware/requireAuth.js';
import { requireOrgMember } from '@/middleware/requireOrgMember.js';
import { prisma } from '@/db.js';
import { sendError } from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';
import { ensureDefaultTeam, publicTeam } from '@/utils/teams.js';

export const teamsRouter: Router = Router({ mergeParams: true });

teamsRouter.use(requireAuth, requireOrgMember);

teamsRouter.get('/', async (req, res) => {
  try {
    const organizationId = req.org!.id;
    await ensureDefaultTeam(prisma, organizationId);

    const teams = await prisma.team.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, key: true, name: true },
    });

    sendSuccess(res, { data: { teams: teams.map(publicTeam) } });
  } catch (err) {
    sendError(res, err);
  }
});
