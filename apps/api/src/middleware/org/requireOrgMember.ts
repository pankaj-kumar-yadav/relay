import type { RequestHandler } from 'express';

import { prisma } from '@/db.js';
import {
  ForbiddenError,
  NotFoundError,
  sendError,
  UnauthorizedError,
} from '@/utils/errors.js';

export const requireOrgMember: RequestHandler = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const slug = req.params.orgId;
    if (!slug || typeof slug !== 'string') {
      throw new NotFoundError('Organization not found');
    }

    const org = await prisma.organization.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true },
    });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const membership = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: req.user.id,
        },
      },
      select: {
        id: true,
        role: true,
        organizationId: true,
        userId: true,
      },
    });
    if (!membership) {
      throw new ForbiddenError('You are not a member of this organization');
    }

    req.org = org;
    req.membership = membership;
    next();
  } catch (err) {
    sendError(res, err);
  }
};
