import { Router } from 'express';

import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/auth/requireAuth.js';
import { requireOrgMember } from '@/middleware/org/requireOrgMember.js';
import { sendError } from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';

export const membersRouter: Router = Router({ mergeParams: true });

membersRouter.use(requireAuth, requireOrgMember);

membersRouter.get('/', async (req, res) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { organizationId: req.org!.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    sendSuccess(res, {
      data: {
        members: memberships.map((m) => ({
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
          role: m.role,
          joinedAt: m.createdAt.toISOString(),
        })),
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});
