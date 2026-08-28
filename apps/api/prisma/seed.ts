import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

import {
  DEFAULT_ISSUE_PRIORITY,
  DEFAULT_ISSUE_STATUS,
  DEFAULT_TEAM_KEY,
  DEFAULT_TEAM_NAME,
  ISSUE_STATUS_CATEGORY,
  IssuePriority,
  IssueStatus,
  IssueStatusCategory,
} from '../src/constants/issue.js';
import { IssueEventType } from '../src/constants/activity.constant.js';
import { CycleStatus } from '../src/constants/cycle.constant.js';
import { NotificationType } from '../src/constants/inbox.constant.js';
import {
  DEFAULT_PROJECT_HEALTH,
  DEFAULT_PROJECT_STATUS,
} from '../src/constants/project.constant.js';
import { OrgRole, type OrgRoleValue } from '../src/constants/org.js';
import {
  SEED_LABELS,
  SEED_PASSWORD,
  SEED_PREVIOUS_ACME_SLUG,
  SEED_PROJECT_NAME,
  SeedEmail,
  SeedOrgSlug,
} from '../src/constants/seed.constant.js';
import { rankBetween } from '../src/utils/issue/issueRank.js';
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

async function upsertOrg(input: { name: string; slug: string; previousSlug?: string }) {
  const existing = await prisma.organization.findUnique({
    where: { slug: input.slug },
  });
  if (existing) {
    return prisma.organization.update({
      where: { id: existing.id },
      data: { name: input.name },
    });
  }

  if (input.previousSlug) {
    const previous = await prisma.organization.findUnique({
      where: { slug: input.previousSlug },
    });
    if (previous) {
      return prisma.organization.update({
        where: { id: previous.id },
        data: { name: input.name, slug: input.slug },
      });
    }
  }

  return prisma.organization.create({
    data: { name: input.name, slug: input.slug },
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

async function upsertProject(input: {
  organizationId: string;
  teamId: string;
  name: string;
  previousName?: string;
  status?: string;
  health?: string;
}) {
  const existing = await prisma.project.findFirst({
    where: {
      organizationId: input.organizationId,
      teamId: input.teamId,
      name: input.name,
    },
    select: { id: true },
  });
  if (existing) return existing;

  if (input.previousName) {
    const previous = await prisma.project.findFirst({
      where: {
        organizationId: input.organizationId,
        teamId: input.teamId,
        name: input.previousName,
      },
      select: { id: true },
    });
    if (previous) {
      return prisma.project.update({
        where: { id: previous.id },
        data: { name: input.name },
        select: { id: true },
      });
    }
  }

  return prisma.project.create({
    data: {
      organizationId: input.organizationId,
      teamId: input.teamId,
      name: input.name,
      status: input.status ?? DEFAULT_PROJECT_STATUS,
      health: input.health ?? DEFAULT_PROJECT_HEALTH,
    },
    select: { id: true },
  });
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

const ACME_ISSUES = [
  {
    title: 'Set up the Acme workspace',
    status: IssueStatus.DONE,
    priority: IssuePriority.HIGH,
  },
  {
    title: 'Invite the first teammate',
    status: IssueStatus.IN_PROGRESS,
    priority: IssuePriority.URGENT,
  },
  {
    title: 'Triage inbound bugs',
    status: IssueStatus.TRIAGE,
    priority: IssuePriority.HIGH,
  },
  {
    title: 'Plan Launch checklist',
    status: IssueStatus.BACKLOG,
    priority: IssuePriority.MEDIUM,
  },
  {
    title: 'Ship Launch landing page',
    status: IssueStatus.TO_DO,
    priority: IssuePriority.MEDIUM,
  },
  {
    title: 'Review onboarding copy',
    status: IssueStatus.TECHNICAL_REVIEW,
    priority: IssuePriority.LOW,
  },
  {
    title: 'Paused: vendor integration',
    status: IssueStatus.PAUSED,
    priority: IssuePriority.LOW,
  },
  {
    title: 'Canceled duplicate ticket',
    status: IssueStatus.CANCELED,
    priority: IssuePriority.NO_PRIORITY,
  },
] as const;

async function syncTeamIssues(input: {
  organizationId: string;
  teamId: string;
  projectId: string;
  assigneeId: string;
  issues: readonly { title: string; status: string; priority: string }[];
}) {
  let prevRank: string | null = null;
  for (let i = 0; i < input.issues.length; i += 1) {
    const number = i + 1;
    const spec = input.issues[i]!;
    const rank = rankBetween(prevRank, null);
    prevRank = rank;

    await prisma.issue.upsert({
      where: {
        teamId_number: { teamId: input.teamId, number },
      },
      update: {
        title: spec.title,
        status: spec.status,
        priority: spec.priority,
        assigneeId: input.assigneeId,
        projectId: input.projectId,
      },
      create: {
        organizationId: input.organizationId,
        teamId: input.teamId,
        number,
        title: spec.title,
        description: 'Seeded issue. Edit or create more from the UI.',
        status: spec.status,
        priority: spec.priority,
        assigneeId: input.assigneeId,
        projectId: input.projectId,
        rank,
      },
    });
  }
}

async function ensureWelcomeIssue(input: {
  organizationId: string;
  teamId: string;
  assigneeId: string;
  title: string;
  projectId?: string;
}) {
  const existingIssue = await prisma.issue.findFirst({
    where: { teamId: input.teamId, number: 1 },
    select: { id: true },
  });
  if (existingIssue) {
    if (input.projectId) {
      await prisma.issue.update({
        where: { id: existingIssue.id },
        data: { projectId: input.projectId },
      });
    }
    return;
  }

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
      projectId: input.projectId ?? null,
      rank: rankBetween(null, null),
    },
  });
}

async function ensureEmployeeInbox(input: {
  organizationId: string;
  teamId: string;
  projectId?: string;
  actorId: string;
  employees: Array<{ id: string; name: string }>;
}) {
  const types = [
    NotificationType.COMMENT,
    NotificationType.ASSIGNEE,
    NotificationType.STATUS,
  ] as const;

  for (const employee of input.employees) {
    if (employee.id === input.actorId) continue;

    const existing = await prisma.notification.findMany({
      where: { organizationId: input.organizationId, userId: employee.id },
      select: { type: true, issueId: true },
    });
    const have = new Set(existing.map((row) => row.type));
    const missing = types.filter((type) => !have.has(type));
    if (missing.length === 0) continue;

    let issueId = existing[0]?.issueId;
    if (!issueId) {
      const assigned = await prisma.issue.findFirst({
        where: {
          organizationId: input.organizationId,
          assigneeId: employee.id,
        },
        orderBy: { number: 'asc' },
        select: { id: true },
      });
      issueId = assigned?.id;
    }
    if (!issueId) {
      const last = await prisma.issue.findFirst({
        where: { teamId: input.teamId },
        orderBy: { number: 'desc' },
        select: { number: true },
      });
      const created = await prisma.issue.create({
        data: {
          organizationId: input.organizationId,
          teamId: input.teamId,
          number: (last?.number ?? 0) + 1,
          title: `Inbox for ${employee.name}`,
          description: 'Seeded issue so this member has inbox notifications.',
          status: DEFAULT_ISSUE_STATUS,
          priority: DEFAULT_ISSUE_PRIORITY,
          assigneeId: employee.id,
          projectId: input.projectId ?? null,
          rank: rankBetween(null, null),
        },
        select: { id: true },
      });
      issueId = created.id;
    }

    await prisma.$transaction(async (tx) => {
      if (missing.includes(NotificationType.COMMENT)) {
        await tx.comment.create({
          data: {
            organizationId: input.organizationId,
            issueId,
            authorId: input.actorId,
            body: 'Seed comment: welcome to the workspace.',
          },
        });
      }
      await tx.notification.createMany({
        data: missing.map((type) => ({
          organizationId: input.organizationId,
          userId: employee.id,
          issueId: issueId!,
          actorId: input.actorId,
          type,
        })),
      });
    });
  }
}

async function ensureOrgLabels(organizationId: string) {
  const existing = await prisma.label.findMany({
    where: { organizationId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((label) => label.name.toLowerCase()));
  const missing = SEED_LABELS.filter(
    (label) => !existingNames.has(label.name.toLowerCase()),
  );
  if (missing.length === 0) return;
  await prisma.label.createMany({
    data: missing.map((label) => ({ organizationId, ...label })),
  });
}

async function ensureAcmeIssueLabel(organizationId: string) {
  const first = await prisma.issue.findFirst({
    where: { organizationId },
    orderBy: { number: 'asc' },
    select: { id: true },
  });
  if (!first) return;
  const existing = await prisma.issueLabel.count({ where: { issueId: first.id } });
  if (existing > 0) return;
  const bug = await prisma.label.findFirst({
    where: { organizationId, name: 'Bug' },
    select: { id: true },
  });
  if (!bug) return;
  await prisma.issueLabel.create({
    data: {
      organizationId,
      issueId: first.id,
      labelId: bug.id,
    },
  });
}

function utcDay(offsetDays: number, now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + offsetDays),
  );
}

const TEAM_CYCLE_SPECS = [
  { name: 'Cycle 1', startOffset: -70, endOffset: -56, status: CycleStatus.COMPLETED },
  { name: 'Cycle 2', startOffset: -56, endOffset: -42, status: CycleStatus.COMPLETED },
  { name: 'Cycle 3', startOffset: -42, endOffset: -28, status: CycleStatus.COMPLETED },
  { name: 'Cycle 4', startOffset: -14, endOffset: 0, status: CycleStatus.ACTIVE },
  { name: 'Cycle 5', startOffset: 0, endOffset: 14, status: CycleStatus.UPCOMING },
] as const;

const TEAM_PROJECT_NAMES: Record<string, readonly string[]> = {
  [DEFAULT_TEAM_KEY]: [SEED_PROJECT_NAME],
  LMS: ['LMS Platform', 'LMS Mobile'],
  CONT: ['Continuum Mobile', 'Continuum Web'],
  EXG: ['EXG Exchange', 'EXG Clearing'],
  PULSE: ['Pulse Analytics', 'Pulse Alerts'],
  ATLAS: ['Atlas Ops', 'Atlas Research'],
};

const SAMPLE_ISSUE_SPECS = [
  { title: 'Close out Cycle 1', status: IssueStatus.DONE, priority: IssuePriority.LOW },
  { title: 'Ship Cycle 2 wrap-up', status: IssueStatus.SHIPPED, priority: IssuePriority.LOW },
  { title: 'Finish Cycle 3 leftovers', status: IssueStatus.DONE, priority: IssuePriority.MEDIUM },
  { title: 'Ship this cycle’s milestone', status: IssueStatus.IN_PROGRESS, priority: IssuePriority.HIGH },
  { title: 'Review in-progress work', status: IssueStatus.TECHNICAL_REVIEW, priority: IssuePriority.MEDIUM },
  { title: 'Todo for the active cycle', status: IssueStatus.TO_DO, priority: IssuePriority.HIGH },
  { title: 'Triage inbound bugs', status: IssueStatus.TRIAGE, priority: IssuePriority.URGENT },
  { title: 'Backlog: polish and follow-ups', status: IssueStatus.BACKLOG, priority: IssuePriority.MEDIUM },
] as const;

async function ensureTeamProjects(input: {
  organizationId: string;
  teamId: string;
  teamKey: string;
  teamName: string;
}) {
  const names = [...(TEAM_PROJECT_NAMES[input.teamKey] ?? [input.teamName])];
  const [first, ...rest] = names;
  await upsertProject({
    organizationId: input.organizationId,
    teamId: input.teamId,
    name: first ?? input.teamName,
    previousName: input.teamName !== first ? input.teamName : undefined,
  });
  for (const name of rest) {
    await upsertProject({
      organizationId: input.organizationId,
      teamId: input.teamId,
      name,
    });
  }
  return prisma.project.findMany({
    where: { organizationId: input.organizationId, teamId: input.teamId },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
}

async function ensureTeamSampleIssues(input: {
  organizationId: string;
  teamId: string;
  projects: Array<{ id: string }>;
  assigneeId: string;
  teamName: string;
}) {
  const existingTitles = new Set(
    (
      await prisma.issue.findMany({
        where: { teamId: input.teamId },
        select: { title: true },
      })
    ).map((issue) => issue.title),
  );
  const last = await prisma.issue.findFirst({
    where: { teamId: input.teamId },
    orderBy: { number: 'desc' },
    select: { number: true, rank: true },
  });
  let prevRank = last?.rank ?? null;
  let number = last?.number ?? 0;
  let created = 0;
  for (const spec of SAMPLE_ISSUE_SPECS) {
    const title = `${input.teamName}: ${spec.title}`;
    if (existingTitles.has(title)) continue;
    number += 1;
    const rank = rankBetween(prevRank, null);
    prevRank = rank;
    const project = input.projects[created % input.projects.length];
    await prisma.issue.create({
      data: {
        organizationId: input.organizationId,
        teamId: input.teamId,
        projectId: project?.id ?? null,
        number,
        title,
        description: 'Seeded issue so this team has cycle work.',
        status: spec.status,
        priority: spec.priority,
        assigneeId: input.assigneeId,
        rank,
      },
    });
    existingTitles.add(title);
    created += 1;
  }
}

function pickCycleForIssue(
  status: string,
  buckets: {
    completed: Array<{ id: string }>;
    active: { id: string } | undefined;
    upcoming: { id: string } | undefined;
  },
  completedIndex: number,
) {
  const category = ISSUE_STATUS_CATEGORY[status as keyof typeof ISSUE_STATUS_CATEGORY];
  if (
    category === IssueStatusCategory.COMPLETED ||
    category === IssueStatusCategory.CANCELED
  ) {
    if (buckets.completed.length === 0) return buckets.active;
    return buckets.completed[completedIndex % buckets.completed.length];
  }
  if (
    category === IssueStatusCategory.STARTED ||
    category === IssueStatusCategory.UNSTARTED
  ) {
    return buckets.active ?? buckets.upcoming;
  }
  if (
    category === IssueStatusCategory.BACKLOG ||
    category === IssueStatusCategory.TRIAGE
  ) {
    return buckets.upcoming ?? buckets.active;
  }
  return buckets.active ?? buckets.upcoming ?? buckets.completed[0];
}

async function assignIssuesToTeamCycles(teamId: string) {
  const cycles = await prisma.cycle.findMany({
    where: { teamId },
    orderBy: { startsAt: 'asc' },
    select: { id: true, status: true },
  });
  if (cycles.length === 0) return;

  const buckets = {
    completed: cycles.filter((cycle) => cycle.status === CycleStatus.COMPLETED),
    active: cycles.find((cycle) => cycle.status === CycleStatus.ACTIVE),
    upcoming: cycles.find((cycle) => cycle.status === CycleStatus.UPCOMING),
  };
  const issues = await prisma.issue.findMany({
    where: { teamId },
    orderBy: { number: 'asc' },
    select: { id: true, status: true },
  });

  let completedIndex = 0;
  for (const issue of issues) {
    const cycle = pickCycleForIssue(issue.status, buckets, completedIndex);
    const category = ISSUE_STATUS_CATEGORY[issue.status as keyof typeof ISSUE_STATUS_CATEGORY];
    if (
      category === IssueStatusCategory.COMPLETED ||
      category === IssueStatusCategory.CANCELED
    ) {
      completedIndex += 1;
    }
    if (!cycle) continue;
    await prisma.issue.update({
      where: { id: issue.id },
      data: { cycleId: cycle.id },
    });
  }
}

async function ensureTeamCycles(input: {
  organizationId: string;
  teamId: string;
}) {
  const existing = await prisma.cycle.findMany({
    where: { teamId: input.teamId },
    select: { id: true, name: true },
  });
  const byName = new Map(existing.map((cycle) => [cycle.name, cycle]));

  for (const spec of TEAM_CYCLE_SPECS) {
    if (byName.has(spec.name)) continue;
    const created = await prisma.cycle.create({
      data: {
        organizationId: input.organizationId,
        teamId: input.teamId,
        name: spec.name,
        startsAt: utcDay(spec.startOffset),
        endsAt: utcDay(spec.endOffset),
        status: CycleStatus.COMPLETED,
      },
      select: { id: true, name: true },
    });
    byName.set(spec.name, created);
  }

  await prisma.cycle.updateMany({
    where: { teamId: input.teamId },
    data: { status: CycleStatus.COMPLETED },
  });

  for (const spec of TEAM_CYCLE_SPECS) {
    const row = byName.get(spec.name);
    if (!row) continue;
    await prisma.cycle.update({
      where: { id: row.id },
      data: {
        startsAt: utcDay(spec.startOffset),
        endsAt: utcDay(spec.endOffset),
        status: CycleStatus.COMPLETED,
      },
    });
  }

  for (const spec of TEAM_CYCLE_SPECS) {
    if (spec.status === CycleStatus.COMPLETED) continue;
    const row = byName.get(spec.name);
    if (!row) continue;
    await prisma.cycle.update({
      where: { id: row.id },
      data: { status: spec.status },
    });
  }

  await assignIssuesToTeamCycles(input.teamId);
}

async function ensureOrgCycles(input: {
  organizationId: string;
  teams: Array<{ id: string; key: string; name: string }>;
  assigneeId: string;
}) {
  for (const team of input.teams) {
    const projects = await ensureTeamProjects({
      organizationId: input.organizationId,
      teamId: team.id,
      teamKey: team.key,
      teamName: team.name,
    });
    await ensureTeamSampleIssues({
      organizationId: input.organizationId,
      teamId: team.id,
      projects,
      assigneeId: input.assigneeId,
      teamName: team.name,
    });
    await ensureTeamCycles({
      organizationId: input.organizationId,
      teamId: team.id,
    });
  }
}

async function ensureAcmeActivity(input: {
  organizationId: string;
  authorId: string;
}) {
  const first = await prisma.issue.findFirst({
    where: { organizationId: input.organizationId },
    orderBy: { number: 'asc' },
  });
  if (!first) return;

  const existingComments = await prisma.comment.count({
    where: { issueId: first.id },
  });
  if (existingComments > 0) return;

  const hasCreated = await prisma.issueEvent.findFirst({
    where: { issueId: first.id, type: IssueEventType.CREATED },
  });
  if (!hasCreated) {
    await prisma.issueEvent.create({
      data: {
        organizationId: input.organizationId,
        issueId: first.id,
        actorId: input.authorId,
        type: IssueEventType.CREATED,
        payload: {},
      },
    });
  }

  await prisma.comment.createMany({
    data: [
      {
        organizationId: input.organizationId,
        issueId: first.id,
        authorId: input.authorId,
        body: 'Seed comment: kickoff notes for Launch.',
      },
      {
        organizationId: input.organizationId,
        issueId: first.id,
        authorId: input.authorId,
        body: 'Seed comment: follow up after the first cycle.',
      },
    ],
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

  const acme = await upsertOrg({
    name: 'Acme',
    slug: SeedOrgSlug.ACME,
    previousSlug: SEED_PREVIOUS_ACME_SLUG,
  });
  await upsertMembership({
    organizationId: acme.id,
    userId: owner.id,
    role: OrgRole.ADMIN,
  });
  const acmeTeams = await syncTeams(acme.id, [
    { key: DEFAULT_TEAM_KEY, name: DEFAULT_TEAM_NAME },
  ]);
  const launch = await upsertProject({
    organizationId: acme.id,
    teamId: acmeTeams[0].id,
    name: SEED_PROJECT_NAME,
    previousName: 'Acme Launch',
  });
  await syncTeamIssues({
    organizationId: acme.id,
    teamId: acmeTeams[0].id,
    projectId: launch.id,
    assigneeId: owner.id,
    issues: ACME_ISSUES,
  });
  await ensureAcmeActivity({
    organizationId: acme.id,
    authorId: owner.id,
  });
  await ensureOrgLabels(acme.id);
  await ensureAcmeIssueLabel(acme.id);
  await ensureOrgCycles({
    organizationId: acme.id,
    teams: acmeTeams,
    assigneeId: owner.id,
  });

  const techap = await upsertOrg({
    name: 'Techap Solutions',
    slug: SeedOrgSlug.TECHAP,
  });
  const techapMembers = await seedMembers(techap.id, TECHAP_MEMBERS, passwordHash);
  const techapTeams = await syncTeams(techap.id, PRODUCT_TEAMS);
  const techapLms = await upsertProject({
    organizationId: techap.id,
    teamId: techapTeams[0].id,
    name: 'LMS Platform',
  });
  await upsertProject({
    organizationId: techap.id,
    teamId: techapTeams[1].id,
    name: 'Continuum Mobile',
  });
  const techapAdmin = techapMembers.find((member) => member.role === OrgRole.ADMIN);
  const techapEmployees = techapMembers.filter(
    (member) => member.role === OrgRole.EMPLOYEE,
  );
  if (techapEmployees[0]) {
    await ensureWelcomeIssue({
      organizationId: techap.id,
      teamId: techapTeams[0].id,
      assigneeId: techapEmployees[0].id,
      title: 'Welcome to Techap Solutions',
      projectId: techapLms.id,
    });
  }
  if (techapAdmin) {
    await ensureEmployeeInbox({
      organizationId: techap.id,
      teamId: techapTeams[0].id,
      projectId: techapLms.id,
      actorId: techapAdmin.id,
      employees: techapEmployees,
    });
  }
  await ensureOrgLabels(techap.id);
  await ensureOrgCycles({
    organizationId: techap.id,
    teams: techapTeams,
    assigneeId: (techapAdmin ?? techapEmployees[0])!.id,
  });

  const stratxg = await upsertOrg({ name: 'StratXG', slug: SeedOrgSlug.STRATXG });
  const stratxgMembers = await seedMembers(stratxg.id, STRATXG_MEMBERS, passwordHash);
  const stratxgTeams = await syncTeams(stratxg.id, PRODUCT_TEAMS);
  const stratxgLms = await upsertProject({
    organizationId: stratxg.id,
    teamId: stratxgTeams[0].id,
    name: 'LMS Platform',
  });
  const stratxgAdmin = stratxgMembers.find((member) => member.role === OrgRole.ADMIN);
  const stratxgEmployees = stratxgMembers.filter(
    (member) => member.role === OrgRole.EMPLOYEE,
  );
  if (stratxgEmployees[0]) {
    await ensureWelcomeIssue({
      organizationId: stratxg.id,
      teamId: stratxgTeams[0].id,
      assigneeId: stratxgEmployees[0].id,
      title: 'Welcome to StratXG',
      projectId: stratxgLms.id,
    });
  }
  if (stratxgAdmin) {
    await ensureEmployeeInbox({
      organizationId: stratxg.id,
      teamId: stratxgTeams[0].id,
      projectId: stratxgLms.id,
      actorId: stratxgAdmin.id,
      employees: stratxgEmployees,
    });
  }
  await ensureOrgLabels(stratxg.id);
  await ensureOrgCycles({
    organizationId: stratxg.id,
    teams: stratxgTeams,
    assigneeId: (stratxgAdmin ?? stratxgEmployees[0])!.id,
  });

  console.log(`Password for all seed users: ${SEED_PASSWORD}`);
  console.log(
    `Super-admin: ${SeedEmail.SUPER_ADMIN} → ${SeedOrgSlug.ACME} (${OrgRole.ADMIN}), team ${DEFAULT_TEAM_KEY}, project ${SEED_PROJECT_NAME}`,
  );
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
