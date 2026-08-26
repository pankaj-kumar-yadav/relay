import { prisma } from '@/db.js';
import { NotFoundError, ValidationError } from '@/utils/errors.js';
import { publicTeam } from '@/utils/teams.js';

const projectSelect = {
  id: true,
  name: true,
  status: true,
  health: true,
  startDate: true,
  targetDate: true,
  createdAt: true,
  updatedAt: true,
  team: { select: { id: true, key: true, name: true } },
} as const;

export type ProjectRow = {
  id: string;
  name: string;
  status: string;
  health: string;
  startDate: Date | null;
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  team: { id: string; key: string; name: string };
};

export function publicProject(project: ProjectRow) {
  return {
    id: project.id,
    name: project.name,
    status: project.status,
    health: project.health,
    startDate: project.startDate?.toISOString() ?? null,
    targetDate: project.targetDate?.toISOString() ?? null,
    team: publicTeam(project.team),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

export { projectSelect };

export async function findProject(organizationId: string, projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: projectSelect,
  });
}

export async function assertProjectOnTeam(
  organizationId: string,
  projectId: string,
  teamId: string,
) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, organizationId },
    select: { id: true, teamId: true, name: true },
  });
  if (!project) {
    throw new NotFoundError('Project not found');
  }
  if (project.teamId !== teamId) {
    throw new ValidationError('Project must belong to the issue team');
  }
  return project;
}
