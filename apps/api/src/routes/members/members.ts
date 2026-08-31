import { Router } from 'express';

import { OrgRole } from '@/constants/org.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/auth/requireAuth.js';
import { requireOrgMember } from '@/middleware/org/requireOrgMember.js';
import { requireOrgRole } from '@/middleware/org/requireOrgRole.js';
import { patchMemberBodySchema } from '@/routes/members/members.schema.js';
import { ForbiddenError, NotFoundError, sendError, ValidationError } from '@/utils/errors.js';
import { sendSuccess } from '@/utils/response.js';

export const membersRouter: Router = Router({ mergeParams: true });

membersRouter.use(requireAuth, requireOrgMember);

const memberSelect = {
  id: true,
  role: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

type MembershipRow = {
  id: string;
  role: string;
  createdAt: Date;
  user: { id: string; name: string; email: string };
};

function publicMember(m: MembershipRow) {
  return {
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    role: m.role,
    joinedAt: m.createdAt.toISOString(),
  };
}

async function findOrgMembership(organizationId: string, userId: string) {
  return prisma.membership.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: memberSelect,
  });
}

async function assertNotLastAdmin(
  organizationId: string,
  membership: MembershipRow,
  action: 'demote' | 'remove',
) {
  if (membership.role !== OrgRole.ADMIN) return;
  const adminCount = await prisma.membership.count({
    where: { organizationId, role: OrgRole.ADMIN },
  });
  if (adminCount > 1) return;
  throw new ForbiddenError(
    action === 'demote' ? 'Cannot demote the last admin' : 'Cannot remove the last admin',
  );
}

membersRouter.get('/', async (req, res) => {
  try {
    const memberships = await prisma.membership.findMany({
      where: { organizationId: req.org!.id },
      orderBy: { createdAt: 'asc' },
      select: memberSelect,
    });

    sendSuccess(res, {
      data: { members: memberships.map(publicMember) },
    });
  } catch (err) {
    sendError(res, err);
  }
});

membersRouter.patch('/:userId', requireOrgRole(OrgRole.ADMIN), async (req, res) => {
  try {
    const parsed = patchMemberBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const membership = await findOrgMembership(req.org!.id, String(req.params.userId));
    if (!membership) {
      throw new NotFoundError('Member not found');
    }

    if (parsed.data.role === OrgRole.EMPLOYEE) {
      await assertNotLastAdmin(req.org!.id, membership, 'demote');
    }

    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: { role: parsed.data.role },
      select: memberSelect,
    });

    sendSuccess(res, { message: 'Member updated', data: { member: publicMember(updated) } });
  } catch (err) {
    sendError(res, err);
  }
});

membersRouter.delete('/:userId', requireOrgRole(OrgRole.ADMIN), async (req, res) => {
  try {
    const membership = await findOrgMembership(req.org!.id, String(req.params.userId));
    if (!membership) {
      throw new NotFoundError('Member not found');
    }

    await assertNotLastAdmin(req.org!.id, membership, 'remove');

    await prisma.membership.delete({ where: { id: membership.id } });
    sendSuccess(res, { message: 'Member removed', data: { id: membership.user.id } });
  } catch (err) {
    sendError(res, err);
  }
});
