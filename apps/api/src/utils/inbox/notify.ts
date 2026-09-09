import type { Prisma, PrismaClient } from '@/db.js';

import type { NotificationTypeValue } from '@relay/shared/constants/inbox.constant';
import type { InboxMailJob } from '@/utils/inbox/inboxMail.js';

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
): Promise<InboxMailJob | null> {
  if (!shouldNotify(input.recipientId, input.actorId)) return null;
  await tx.notification.create({
    data: {
      organizationId: input.organizationId,
      issueId: input.issueId,
      actorId: input.actorId,
      userId: input.recipientId,
      type: input.type,
    },
  });
  return { userId: input.recipientId, type: input.type };
}
