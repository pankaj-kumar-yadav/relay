import type { Prisma, PrismaClient } from '@prisma/client';

import { DEFAULT_TEAM_KEY, DEFAULT_TEAM_NAME } from '@/constants/issue.js';
import { prisma } from '@/db.js';

type TeamDb = PrismaClient | Prisma.TransactionClient;

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const teamSelect = { id: true, key: true, name: true } as const;

export function publicTeam(team: { id: string; key: string; name: string }) {
  return { id: team.id, key: team.key, name: team.name };
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
