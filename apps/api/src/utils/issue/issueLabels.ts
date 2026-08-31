import type { Prisma } from '@/generated/prisma/client.js';

import { LABEL_IDS_MAX } from '@/constants/label.constant.js';
import { prisma } from '@/db.js';
import { ValidationError } from '@/utils/errors.js';

type Tx = Prisma.TransactionClient;

export type LabelRef = { id: string; name: string };

export async function loadOrgLabels(organizationId: string, labelIds: string[]) {
  const uniqueIds = [...new Set(labelIds)];
  if (uniqueIds.length > LABEL_IDS_MAX) {
    throw new ValidationError(`An issue can have at most ${LABEL_IDS_MAX} labels`);
  }

  const labels = await prisma.label.findMany({
    where: { organizationId, id: { in: uniqueIds } },
    select: { id: true, name: true },
  });
  if (labels.length !== uniqueIds.length) {
    throw new ValidationError('One or more labels were not found in this organization');
  }
  return labels;
}

export async function syncIssueLabels(
  tx: Tx,
  input: {
    organizationId: string;
    issueId: string;
    labels: LabelRef[];
  },
): Promise<{ added: LabelRef[]; removed: LabelRef[] }> {
  const current = await tx.issueLabel.findMany({
    where: { organizationId: input.organizationId, issueId: input.issueId },
    select: { label: { select: { id: true, name: true } } },
  });
  const currentById = new Map(current.map((row) => [row.label.id, row.label]));
  const nextById = new Map(input.labels.map((label) => [label.id, label]));

  const added = input.labels.filter((label) => !currentById.has(label.id));
  const removed = current
    .map((row) => row.label)
    .filter((label) => !nextById.has(label.id));

  if (removed.length > 0) {
    await tx.issueLabel.deleteMany({
      where: {
        organizationId: input.organizationId,
        issueId: input.issueId,
        labelId: { in: removed.map((label) => label.id) },
      },
    });
  }
  if (added.length > 0) {
    await tx.issueLabel.createMany({
      data: added.map((label) => ({
        organizationId: input.organizationId,
        issueId: input.issueId,
        labelId: label.id,
      })),
    });
  }

  return { added, removed };
}
