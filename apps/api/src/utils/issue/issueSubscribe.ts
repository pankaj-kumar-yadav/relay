import type { Prisma, PrismaClient } from '@/db.js';

import type { NotificationTypeValue } from '@relay/shared/constants/inbox.constant';
import type { InboxMailJob } from '@/utils/inbox/inboxMail.js';
import { notifyIfRecipient } from '@/utils/inbox/notify.js';

type Tx = Prisma.TransactionClient | PrismaClient;

export async function ensureSubscribed(
  tx: Tx,
  input: { organizationId: string; issueId: string; userId: string },
) {
  await tx.issueSubscription.upsert({
    where: {
      issueId_userId: { issueId: input.issueId, userId: input.userId },
    },
    create: {
      organizationId: input.organizationId,
      issueId: input.issueId,
      userId: input.userId,
    },
    update: {},
  });
}

export async function notifyWatchers(
  tx: Tx,
  input: {
    organizationId: string;
    issueId: string;
    actorId: string;
    type: NotificationTypeValue;
    extraRecipientId?: string | null;
  },
): Promise<InboxMailJob[]> {
  const rows = await tx.issueSubscription.findMany({
    where: { organizationId: input.organizationId, issueId: input.issueId },
    select: { userId: true },
  });
  const recipientIds = new Set(rows.map((row) => row.userId));
  if (input.extraRecipientId) recipientIds.add(input.extraRecipientId);
  const jobs: InboxMailJob[] = [];
  for (const recipientId of recipientIds) {
    const job = await notifyIfRecipient(tx, {
      organizationId: input.organizationId,
      issueId: input.issueId,
      actorId: input.actorId,
      recipientId,
      type: input.type,
    });
    if (job) jobs.push(job);
  }
  return jobs;
}
