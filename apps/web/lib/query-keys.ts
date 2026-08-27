import type { IssueListQuery } from '@/services/issues.service';

export const queryKeys = {
  session: ['session'] as const,
  orgs: ['orgs'] as const,
  teams: (orgSlug: string) => ['teams', orgSlug] as const,
  team: (orgSlug: string, teamId: string) => ['teams', orgSlug, teamId] as const,
  members: (orgSlug: string) => ['members', orgSlug] as const,
  projects: {
    all: (orgSlug: string) => ['projects', orgSlug] as const,
    list: (orgSlug: string, teamId?: string) =>
      ['projects', orgSlug, 'list', teamId ?? ''] as const,
    detail: (orgSlug: string, projectId: string) =>
      ['projects', orgSlug, 'detail', projectId] as const,
  },
  issues: {
    all: (orgSlug: string) => ['issues', orgSlug] as const,
    list: (orgSlug: string, query: IssueListQuery = {}) =>
      ['issues', orgSlug, 'list', query] as const,
    detail: (orgSlug: string, issueId: string) => ['issues', orgSlug, 'detail', issueId] as const,
    activity: (orgSlug: string, issueId: string) =>
      ['issues', orgSlug, 'activity', issueId] as const,
  },
} as const;
