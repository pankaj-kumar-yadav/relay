import type { Prisma, PrismaClient } from '@/db.js';

import type { NotificationTypeValue } from '@relay/shared/constants/inbox.constant';

type Tx = Prisma.TransactionClient | PrismaClient;

export function shouldNotify(
  recipientId: string | null | undefined,
  actorId: string,
): recipientId is string {
  return Boolean(recipientId) && recipientId !== actorId;
}

export async function notifyIfRecipient(
  tx: Tx,
  input: {
    organizationId: string;
    issueId: string;
    actorId: string;
    recipientId: string | null | undefined;
    type: NotificationTypeValue;
  },
) {
  if (!shouldNotify(input.recipientId, input.actorId)) return;
  await tx.notification.create({
    data: {
      organizationId: input.organizationId,
      userId: input.recipientId,
      issueId: input.issueId,
      actorId: input.actorId,
      type: input.type,
    },
  });
}
