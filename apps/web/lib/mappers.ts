import { OrgRoleLabel } from '@/constants/org.constant';
import { Issue } from '@/mock-data/issues';
import { priorities } from '@/mock-data/priorities';
import { status } from '@/mock-data/status';
import { User } from '@/mock-data/users';
import type { ApiAssignee, ApiIssue } from '@/services/issues.service';
import type { OrgMember } from '@/services/members.service';

const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;

export function mapMemberToUser(member: OrgMember): User {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    avatarUrl: avatarUrl(member.id),
    status: 'offline',
    role: OrgRoleLabel[member.role],
    joinedDate: member.joinedAt,
    teamIds: [],
    timezone: 'UTC',
  };
}

export function mapAssigneeToUser(assignee: ApiAssignee): User | null {
  if (!assignee) return null;
  return {
    id: assignee.id,
    name: assignee.name,
    email: assignee.email,
    avatarUrl: avatarUrl(assignee.id),
    status: 'offline',
    role: 'Member',
    joinedDate: '',
    teamIds: [],
    timezone: 'UTC',
  };
}

export function mapApiIssue(issue: ApiIssue): Issue {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description ?? '',
    status: status.find((item) => item.id === issue.status) ?? status.find((item) => item.id === 'to-do')!,
    assignee: mapAssigneeToUser(issue.assignee),
    priority:
      priorities.find((item) => item.id === issue.priority) ?? priorities[0]!,
    labels: [],
    createdAt: issue.createdAt,
    cycleId: '',
    project: undefined,
    subissues: [],
    rank: issue.rank,
  };
}
