import type { Prisma, PrismaClient } from '@prisma/client';

import { DEFAULT_TEAM_KEY, DEFAULT_TEAM_NAME } from '@/constants/issue.js';

type TeamDb = PrismaClient | Prisma.TransactionClient;

export function publicTeam(team: { id: string; key: string; name: string }) {
  return { id: team.id, key: team.key, name: team.name };
}

export async function ensureDefaultTeam(db: TeamDb, organizationId: string) {
  const existing = await db.team.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, key: true, name: true },
  });
  if (existing) return existing;

  return db.team.create({
    data: {
      organizationId,
      key: DEFAULT_TEAM_KEY,
      name: DEFAULT_TEAM_NAME,
    },
    select: { id: true, key: true, name: true },
  });
}

export async function createDefaultTeam(db: TeamDb, organizationId: string) {
  return db.team.create({
    data: {
      organizationId,
      key: DEFAULT_TEAM_KEY,
      name: DEFAULT_TEAM_NAME,
    },
    select: { id: true, key: true, name: true },
  });
}
