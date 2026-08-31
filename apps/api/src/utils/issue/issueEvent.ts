import type { Prisma } from '@/generated/prisma/client.js';

import {
  IssueEventType,
  type IssueEventTypeValue,
} from '@/constants/activity.constant.js';

export type LabelEventItem = { id: string; name: string };

export function eventPayload(
  type: IssueEventTypeValue,
  from?: string | null,
  to?: string | null,
): Prisma.InputJsonValue {
  if (type === IssueEventType.CREATED) return {};
  return { from: from ?? null, to: to ?? null };
}

export function labelEventPayload(
  added: LabelEventItem[],
  removed: LabelEventItem[],
): Prisma.InputJsonValue {
  return { added, removed };
}

type Tx = Prisma.TransactionClient;

export async function recordIssueEvent(
  tx: Tx,
  input: {
    organizationId: string;
    issueId: string;
    actorId: string;
    type: IssueEventTypeValue;
    payload?: Prisma.InputJsonValue;
  },
) {
  await tx.issueEvent.create({
    data: {
      organizationId: input.organizationId,
      issueId: input.issueId,
      actorId: input.actorId,
      type: input.type,
      payload: input.payload ?? {},
    },
  });
}
