import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

import { DEFAULT_ISSUE_PRIORITY, DEFAULT_ISSUE_STATUS, DEFAULT_TEAM_KEY, DEFAULT_TEAM_NAME } from '../src/constants/issue.js';
import { OrgRole } from '../src/constants/org.js';
import { rankBetween } from '../src/utils/issueRank.js';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'password';

async function upsertUser(input: {
  email: string;
  name: string;
  isSuperAdmin?: boolean;
}) {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      passwordHash,
      isSuperAdmin: input.isSuperAdmin ?? false,
    },
    create: {
      email: input.email,
      name: input.name,
      passwordHash,
      isSuperAdmin: input.isSuperAdmin ?? false,
    },
  });
}

async function upsertOrg(input: { name: string; slug: string }) {
  return prisma.organization.upsert({
    where: { slug: input.slug },
    update: { name: input.name },
    create: input,
  });
}

async function upsertTeam(input: {
  organizationId: string;
  key: string;
  name: string;
}) {
  return prisma.team.upsert({
    where: {
      organizationId_key: {
        organizationId: input.organizationId,
        key: input.key,
      },
    },
    update: { name: input.name },
    create: input,
  });
}

async function upsertMembership(input: {
  organizationId: string;
  userId: string;
  role: string;
}) {
  return prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: input.organizationId,
        userId: input.userId,
      },
    },
    update: { role: input.role },
    create: input,
  });
}

async function main() {
  const owner = await upsertUser({
    email: 'owner@relay.local',
    name: 'Relay Owner',
    isSuperAdmin: true,
  });

  const acme = await upsertOrg({ name: 'Acme', slug: 'acme' });
  await upsertMembership({
    organizationId: acme.id,
    userId: owner.id,
    role: OrgRole.ADMIN,
  });
  await upsertTeam({
    organizationId: acme.id,
    key: DEFAULT_TEAM_KEY,
    name: DEFAULT_TEAM_NAME,
  });

  const techapAdmin = await upsertUser({
    email: 'admin@techap.local',
    name: 'Techap Admin',
  });
  const techapEmployee = await upsertUser({
    email: 'employee@techap.local',
    name: 'Techap Employee',
  });

  const techap = await upsertOrg({
    name: 'Techap Solutions',
    slug: 'techap-solutions',
  });
  await upsertMembership({
    organizationId: techap.id,
    userId: techapAdmin.id,
    role: OrgRole.ADMIN,
  });
  await upsertMembership({
    organizationId: techap.id,
    userId: techapEmployee.id,
    role: OrgRole.EMPLOYEE,
  });
  const techapTeam = await upsertTeam({
    organizationId: techap.id,
    key: DEFAULT_TEAM_KEY,
    name: DEFAULT_TEAM_NAME,
  });

  const existingIssue = await prisma.issue.findFirst({
    where: { teamId: techapTeam.id, number: 1 },
    select: { id: true },
  });
  if (!existingIssue) {
    await prisma.issue.create({
      data: {
        organizationId: techap.id,
        teamId: techapTeam.id,
        number: 1,
        title: 'Welcome to Relay',
        description: 'This is a seeded issue. Edit or create more from the UI.',
        status: DEFAULT_ISSUE_STATUS,
        priority: DEFAULT_ISSUE_PRIORITY,
        assigneeId: techapEmployee.id,
        rank: rankBetween(null, null),
      },
    });
  }

  console.log(`Seeded owner@relay.local / ${SEED_PASSWORD} (is_super_admin=true) → acme (${OrgRole.ADMIN})`);
  console.log(`Seeded admin@techap.local / ${SEED_PASSWORD} → techap-solutions (${OrgRole.ADMIN})`);
  console.log(`Seeded employee@techap.local / ${SEED_PASSWORD} → techap-solutions (${OrgRole.EMPLOYEE})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
