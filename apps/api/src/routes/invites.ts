import { Router } from 'express';
import { z } from 'zod';

import { HttpStatus } from '@/constants/http.js';
import { OrgRole } from '@/constants/org.js';
import { config } from '@/config.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/requireAuth.js';
import { requireOrgMember } from '@/middleware/requireOrgMember.js';
import { requireOrgRole } from '@/middleware/requireOrgRole.js';
import {
  AlreadyMemberError,
  ForbiddenError,
  NotFoundError,
  sendError,
  ValidationError,
} from '@/utils/errors.js';
import {
  generateInviteToken,
  hashInviteToken,
  inviteExpiresAt,
} from '@/utils/inviteToken.js';
import { sendSuccess } from '@/utils/response.js';

export const orgsInvitesRouter: Router = Router({ mergeParams: true });
export const invitesRouter: Router = Router();

const createInviteSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  role: z
    .enum([OrgRole.ADMIN, OrgRole.EMPLOYEE])
    .optional()
    .default(OrgRole.EMPLOYEE),
});

function publicInvite(invite: {
  id: string;
  email: string;
  role: string;
  expiresAt: Date;
}) {
  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt.toISOString(),
  };
}

orgsInvitesRouter.post(
  '/',
  requireAuth,
  requireOrgMember,
  requireOrgRole(OrgRole.ADMIN),
  async (req, res) => {
    try {
      const parsed = createInviteSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
      }

      const { email, role } = parsed.data;
      const org = req.org!;
      const userId = req.user!.id;

      const existingMember = await prisma.membership.findFirst({
        where: {
          organizationId: org.id,
          user: { email },
        },
        select: { id: true },
      });
      if (existingMember) {
        throw new AlreadyMemberError('User is already a member of this organization');
      }

      const token = generateInviteToken();
      const invite = await prisma.invite.create({
        data: {
          organizationId: org.id,
          email,
          role,
          tokenHash: hashInviteToken(token),
          expiresAt: inviteExpiresAt(),
          invitedById: userId,
        },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
        },
      });

      const invitePath = `/invite/${token}`;
      if (!config.isProduction) {
        console.log(
          `[invite] ${email} → ${config.webOrigin}${invitePath} (POST /invites/${token}/accept)`,
        );
      }

      sendSuccess(res, {
        status: HttpStatus.CREATED,
        message: 'Invite created',
        data: {
          invite: publicInvite(invite),
          // Raw token returned once so clients can share the link without email.
          token,
        },
      });
    } catch (err) {
      sendError(res, err);
    }
  },
);

invitesRouter.post('/:token/accept', requireAuth, async (req, res) => {
  try {
    const token = req.params.token;
    if (!token || typeof token !== 'string') {
      throw new NotFoundError('Invite not found');
    }

    const invite = await prisma.invite.findUnique({
      where: { tokenHash: hashInviteToken(token) },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        organizationId: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!invite || invite.acceptedAt) {
      throw new NotFoundError('Invite not found');
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      throw new NotFoundError('Invite not found');
    }

    const user = req.user!;
    if (user.email.toLowerCase() !== invite.email) {
      throw new ForbiddenError('Invite email does not match your account');
    }

    const existing = await prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: invite.organizationId,
          userId: user.id,
        },
      },
      select: { id: true, role: true },
    });
    if (existing) {
      throw new AlreadyMemberError();
    }

    const membership = await prisma.$transaction(async (tx) => {
      const created = await tx.membership.create({
        data: {
          organizationId: invite.organizationId,
          userId: user.id,
          role: invite.role,
        },
        select: { id: true, role: true },
      });
      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return created;
    });

    sendSuccess(res, {
      message: 'Invite accepted',
      data: {
        organization: invite.organization,
        role: membership.role,
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});
