import { Router } from 'express';

import { INBOX_LIST_LIMIT } from '@/constants/inbox.constant.js';
import { prisma } from '@/db.js';
import { requireAuth } from '@/middleware/auth/requireAuth.js';
import { requireOrgMember } from '@/middleware/org/requireOrgMember.js';
import { NotFoundError, sendError } from '@/utils/errors.js';
import { issueIdentifier } from '@/utils/issue/issueRef.js';
import { sendSuccess } from '@/utils/response.js';

export const notificationsRouter: Router = Router({ mergeParams: true });

notificationsRouter.use(requireAuth, requireOrgMember);

const notificationSelect = {
  id: true,
  type: true,
  readAt: true,
  createdAt: true,
  actor: { select: { id: true, name: true } },
  issue: {
    select: {
      id: true,
      number: true,
      title: true,
      status: true,
      team: { select: { key: true } },
    },
  },
} as const;

function publicNotification(
  row: {
    id: string;
    type: string;
    readAt: Date | null;
    createdAt: Date;
    actor: { id: string; name: string };
    issue: {
      id: string;
      number: number;
      title: string;
      status: string;
      team: { key: string };
    };
  },
) {
  return {
    id: row.id,
    type: row.type,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    actor: { id: row.actor.id, name: row.actor.name },
    issue: {
      id: row.issue.id,
      identifier: issueIdentifier(row.issue.team.key, row.issue.number),
      title: row.issue.title,
      status: row.issue.status,
    },
  };
}

notificationsRouter.get('/', async (req, res) => {
  try {
    const organizationId = req.org!.id;
    const userId = req.user!.id;

    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { organizationId, userId },
        select: notificationSelect,
        orderBy: { createdAt: 'desc' },
        take: INBOX_LIST_LIMIT,
      }),
      prisma.notification.count({
        where: { organizationId, userId, readAt: null },
      }),
    ]);

    sendSuccess(res, {
      data: {
        notifications: rows.map(publicNotification),
        unreadCount,
      },
    });
  } catch (err) {
    sendError(res, err);
  }
});

notificationsRouter.post('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: {
        organizationId: req.org!.id,
        userId: req.user!.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    sendSuccess(res, {
      message: 'Notifications marked read',
      data: { unreadCount: 0 },
    });
  } catch (err) {
    sendError(res, err);
  }
});

notificationsRouter.post('/:notificationId/read', async (req, res) => {
  try {
    const existing = await prisma.notification.findFirst({
      where: {
        id: req.params.notificationId,
        organizationId: req.org!.id,
        userId: req.user!.id,
      },
      select: notificationSelect,
    });
    if (!existing) {
      throw new NotFoundError('Notification not found');
    }

    const row = existing.readAt
      ? existing
      : await prisma.notification.update({
          where: { id: existing.id },
          data: { readAt: new Date() },
          select: notificationSelect,
        });

    sendSuccess(res, {
      message: 'Notification marked read',
      data: { notification: publicNotification(row) },
    });
  } catch (err) {
    sendError(res, err);
  }
});
