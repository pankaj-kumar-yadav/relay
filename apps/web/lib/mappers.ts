import { DEFAULT_ISSUE_STATUS } from '@/constants/issue.constant';
import { OrgRoleLabel } from '@/constants/org.constant';
import { DEFAULT_USER_STATUS, dicebearAvatarUrl } from '@/constants/user.constant';
import {
  DEFAULT_PROJECT_HEALTH,
  DEFAULT_PROJECT_STATUS,
} from '@/constants/project.constant';
import { Issue } from '@/mock-data/issues';
import { priorities } from '@/mock-data/priorities';
import { health, Project } from '@/mock-data/projects';
import { status } from '@/mock-data/status';
import { User, users } from '@/mock-data/users';
import type { ApiAssignee, ApiIssue } from '@/services/issues.service';
import type { OrgMember } from '@/services/members.service';
import type { ApiProject } from '@/services/projects.service';
import { Folder } from 'lucide-react';

export function mapMemberToUser(member: OrgMember): User {
  return {
    id: member.id,
    name: member.name,
    email: member.email,
    avatarUrl: dicebearAvatarUrl(member.id),
    status: DEFAULT_USER_STATUS,
    role: OrgRoleLabel[member.role] === 'Admin' ? 'Admin' : 'Member',
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
    avatarUrl: dicebearAvatarUrl(assignee.id),
    status: DEFAULT_USER_STATUS,
    role: 'Member',
    joinedDate: '',
    teamIds: [],
    timezone: 'UTC',
  };
}

export function mapApiProject(project: ApiProject): Project {
  return {
    id: project.id,
    name: project.name,
    status:
      status.find((item) => item.id === project.status) ??
      status.find((item) => item.id === DEFAULT_PROJECT_STATUS)!,
    icon: Folder,
    percentComplete: 0,
    startDate: project.startDate ?? project.createdAt,
    targetDate: project.targetDate ?? undefined,
    lead: users[0]!,
    priority: priorities[0]!,
    health:
      health.find((item) => item.id === project.health) ??
      health.find((item) => item.id === DEFAULT_PROJECT_HEALTH)!,
    teamId: project.team.key,
    labels: [],
  };
}

export function mapApiIssue(issue: ApiIssue): Issue {
  return {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description ?? '',
    status:
      status.find((item) => item.id === issue.status) ??
      status.find((item) => item.id === DEFAULT_ISSUE_STATUS)!,
    assignee: mapAssigneeToUser(issue.assignee),
    priority:
      priorities.find((item) => item.id === issue.priority) ?? priorities[0]!,
    labels: issue.labels ?? [],
    createdAt: issue.createdAt,
    cycleId: '',
    project: issue.project
      ? mapApiProject({
          id: issue.project.id,
          name: issue.project.name,
          status: DEFAULT_PROJECT_STATUS,
          health: DEFAULT_PROJECT_HEALTH,
          startDate: null,
          targetDate: null,
          team: issue.team,
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
        })
      : undefined,
    subissues: [],
    rank: issue.rank,
  };
}
