import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

import {
  DEFAULT_ISSUE_PRIORITY,
  DEFAULT_ISSUE_STATUS,
  DEFAULT_TEAM_KEY,
  DEFAULT_TEAM_NAME,
} from '../src/constants/issue.js';
import { OrgRole, type OrgRoleValue } from '../src/constants/org.js';
import { SEED_PASSWORD, SeedEmail, SeedOrgSlug } from '../src/constants/seed.constant.js';
import { rankBetween } from '../src/utils/issueRank.js';
import { hashPassword } from '../src/utils/passwords.js';

const prisma = new PrismaClient();

const PRODUCT_TEAMS = [
  { key: 'LMS', name: 'LMS' },
  { key: 'CONT', name: 'Continuum App' },
  { key: 'EXG', name: 'EXG' },
  { key: 'PULSE', name: 'Pulse' },
  { key: 'ATLAS', name: 'Atlas' },
] as const;

type SeedMember = {
  email: string;
  name: string;
  role: OrgRoleValue;
};

const TECHAP_MEMBERS: SeedMember[] = [
  { email: SeedEmail.TECHAP_ADMIN, name: 'Asha Patel', role: OrgRole.ADMIN },
  { email: SeedEmail.TECHAP_ADMIN_2, name: 'Vikram Shah', role: OrgRole.ADMIN },
  { email: SeedEmail.TECHAP_ADMIN_3, name: 'Meera Rao', role: OrgRole.ADMIN },
  { email: SeedEmail.TECHAP_EMPLOYEE, name: 'Rohan Das', role: OrgRole.EMPLOYEE },
  { email: SeedEmail.TECHAP_EMPLOYEE_2, name: 'Kavya Iyer', role: OrgRole.EMPLOYEE },
  { email: SeedEmail.TECHAP_EMPLOYEE_3, name: 'Arjun Nair', role: OrgRole.EMPLOYEE },
];

const STRATXG_MEMBERS: SeedMember[] = [
  { email: SeedEmail.STRATXG_ADMIN, name: 'Lena Ortiz', role: OrgRole.ADMIN },
  { email: SeedEmail.STRATXG_ADMIN_2, name: 'Marcus Chen', role: OrgRole.ADMIN },
  { email: SeedEmail.STRATXG_ADMIN_3, name: 'Priya Kapoor', role: OrgRole.ADMIN },
  { email: SeedEmail.STRATXG_EMPLOYEE, name: 'Noah Blake', role: OrgRole.EMPLOYEE },
  { email: SeedEmail.STRATXG_EMPLOYEE_2, name: 'Sofia Alvarez', role: OrgRole.EMPLOYEE },
  { email: SeedEmail.STRATXG_EMPLOYEE_3, name: 'Dev Patel', role: OrgRole.EMPLOYEE },
];

async function upsertUser(input: {
  email: string;
  name: string;
  passwordHash: string;
  isSuperAdmin?: boolean;
}) {
  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      passwordHash: input.passwordHash,
      isSuperAdmin: input.isSuperAdmin ?? false,
    },
    create: {
      email: input.email,
      name: input.name,
      passwordHash: input.passwordHash,
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

async function syncTeams(
  organizationId: string,
  teams: readonly { key: string; name: string }[],
) {
  const upserted = [];
  for (const team of teams) {
    upserted.push(
      await upsertTeam({
        organizationId,
        key: team.key,
        name: team.name,
      }),
    );
  }

  await prisma.team.deleteMany({
    where: {
      organizationId,
      key: { notIn: teams.map((team) => team.key) },
    },
  });

  return upserted;
}

async function seedMembers(
  organizationId: string,
  members: SeedMember[],
  passwordHash: string,
) {
  const users = [];
  for (const member of members) {
    const user = await upsertUser({
      email: member.email,
      name: member.name,
      passwordHash,
    });
    await upsertMembership({
      organizationId,
      userId: user.id,
      role: member.role,
    });
    users.push({ ...member, id: user.id });
  }
  return users;
}

async function ensureWelcomeIssue(input: {
  organizationId: string;
  teamId: string;
  assigneeId: string;
  title: string;
}) {
  const existingIssue = await prisma.issue.findFirst({
    where: { teamId: input.teamId, number: 1 },
    select: { id: true },
  });
  if (existingIssue) return;

  await prisma.issue.create({
    data: {
      organizationId: input.organizationId,
      teamId: input.teamId,
      number: 1,
      title: input.title,
      description: 'This is a seeded issue. Edit or create more from the UI.',
      status: DEFAULT_ISSUE_STATUS,
      priority: DEFAULT_ISSUE_PRIORITY,
      assigneeId: input.assigneeId,
      rank: rankBetween(null, null),
    },
  });
}

async function main() {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  const owner = await upsertUser({
    email: SeedEmail.SUPER_ADMIN,
    name: 'Relay Owner',
    passwordHash,
    isSuperAdmin: true,
  });

  const acme = await upsertOrg({ name: 'Acme', slug: SeedOrgSlug.ACME });
  await upsertMembership({
    organizationId: acme.id,
    userId: owner.id,
    role: OrgRole.ADMIN,
  });
  await syncTeams(acme.id, [{ key: DEFAULT_TEAM_KEY, name: DEFAULT_TEAM_NAME }]);

  const techap = await upsertOrg({
    name: 'Techap Solutions',
    slug: SeedOrgSlug.TECHAP,
  });
  const techapMembers = await seedMembers(techap.id, TECHAP_MEMBERS, passwordHash);
  const techapTeams = await syncTeams(techap.id, PRODUCT_TEAMS);
  const techapEmployee = techapMembers.find((member) => member.role === OrgRole.EMPLOYEE);
  if (techapEmployee) {
    await ensureWelcomeIssue({
      organizationId: techap.id,
      teamId: techapTeams[0].id,
      assigneeId: techapEmployee.id,
      title: 'Welcome to Techap Solutions',
    });
  }

  const stratxg = await upsertOrg({ name: 'StratXG', slug: SeedOrgSlug.STRATXG });
  const stratxgMembers = await seedMembers(stratxg.id, STRATXG_MEMBERS, passwordHash);
  const stratxgTeams = await syncTeams(stratxg.id, PRODUCT_TEAMS);
  const stratxgEmployee = stratxgMembers.find((member) => member.role === OrgRole.EMPLOYEE);
  if (stratxgEmployee) {
    await ensureWelcomeIssue({
      organizationId: stratxg.id,
      teamId: stratxgTeams[0].id,
      assigneeId: stratxgEmployee.id,
      title: 'Welcome to StratXG',
    });
  }

  console.log(`Password for all seed users: ${SEED_PASSWORD}`);
  console.log(`Super-admin: ${SeedEmail.SUPER_ADMIN} → ${SeedOrgSlug.ACME} (${OrgRole.ADMIN})`);
  console.log(
    `${SeedOrgSlug.TECHAP}: 3 ${OrgRole.ADMIN}s (${SeedEmail.TECHAP_ADMIN} …) + 3 ${OrgRole.EMPLOYEE}s (${SeedEmail.TECHAP_EMPLOYEE} …)`,
  );
  console.log(
    `${SeedOrgSlug.STRATXG}: 3 ${OrgRole.ADMIN}s (${SeedEmail.STRATXG_ADMIN} …) + 3 ${OrgRole.EMPLOYEE}s (${SeedEmail.STRATXG_EMPLOYEE} …)`,
  );
  console.log(
    `Teams on techap-solutions & stratxg: ${PRODUCT_TEAMS.map((team) => team.name).join(', ')}`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
