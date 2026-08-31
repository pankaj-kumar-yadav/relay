import type { Prisma, PrismaClient } from '@/generated/prisma/client.js';

import { DEFAULT_TEAM_KEY, DEFAULT_TEAM_NAME } from '@/constants/issue.js';
import { prisma } from '@/db.js';

type TeamDb = PrismaClient | Prisma.TransactionClient;

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const teamSelect = { id: true, key: true, name: true, icon: true } as const;

export function publicTeam(team: { id: string; key: string; name: string; icon: string }) {
  return { id: team.id, key: team.key, name: team.name, icon: team.icon };
}

export async function findTeam(organizationId: string, teamId: string) {
  if (UUID_RE.test(teamId)) {
    return prisma.team.findFirst({
      where: { id: teamId, organizationId },
      select: teamSelect,
    });
  }
  return prisma.team.findFirst({
    where: { organizationId, key: teamId.toUpperCase() },
    select: teamSelect,
  });
}

export async function ensureDefaultTeam(db: TeamDb, organizationId: string) {
  const existing = await db.team.findFirst({
    where: { organizationId },
    orderBy: { createdAt: 'asc' },
    select: teamSelect,
  });
  if (existing) return existing;

  return db.team.create({
    data: {
      organizationId,
      key: DEFAULT_TEAM_KEY,
      name: DEFAULT_TEAM_NAME,
    },
    select: teamSelect,
  });
}

export async function createDefaultTeam(db: TeamDb, organizationId: string) {
  return db.team.create({
    data: {
      organizationId,
      key: DEFAULT_TEAM_KEY,
      name: DEFAULT_TEAM_NAME,
    },
    select: teamSelect,
  });
}
