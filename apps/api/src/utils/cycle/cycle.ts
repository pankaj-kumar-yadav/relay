import { Prisma } from '@/generated/prisma/client.js';

import { CycleStatus } from '@/constants/cycle.constant.js';
import { prisma } from '@/db.js';
import { ValidationError } from '@/utils/errors.js';

export function parseCycleInstant(raw: string, field: string): Date {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ${field}`);
  }
  return date;
}

export function assertCycleRange(startsAt: Date, endsAt: Date) {
  if (!(endsAt.getTime() > startsAt.getTime())) {
    throw new ValidationError('endsAt must be after startsAt');
  }
}

export async function findCycleOnTeam(input: {
  organizationId: string;
  teamId: string;
  cycleId: string;
}) {
  return prisma.cycle.findFirst({
    where: {
      id: input.cycleId,
      organizationId: input.organizationId,
      teamId: input.teamId,
    },
    select: { id: true, name: true, status: true, teamId: true },
  });
}

export async function assertCycleOnTeam(input: {
  organizationId: string;
  teamId: string;
  cycleId: string;
}) {
  const cycle = await findCycleOnTeam(input);
  if (!cycle) {
    throw new ValidationError('Cycle must belong to the issue team');
  }
  return cycle;
}

export function isActiveCycleConflict(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

export function activeCycleConflictError() {
  return new ValidationError('Team already has an active cycle');
}

export async function assertNoOtherActiveCycle(input: {
  teamId: string;
  exceptId?: string;
  nextStatus?: string;
}) {
  if (input.nextStatus !== CycleStatus.ACTIVE) return;
  const existing = await prisma.cycle.findFirst({
    where: {
      teamId: input.teamId,
      status: CycleStatus.ACTIVE,
      ...(input.exceptId ? { id: { not: input.exceptId } } : {}),
    },
    select: { id: true },
  });
  if (existing) {
    throw activeCycleConflictError();
  }
}
