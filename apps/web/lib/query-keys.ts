import type { IssueListQuery } from '@/services/issues.service';

export const queryKeys = {
  session: ['session'] as const,
  orgs: ['orgs'] as const,
  teams: (orgSlug: string) => ['teams', orgSlug] as const,
  members: (orgSlug: string) => ['members', orgSlug] as const,
  issues: {
    all: (orgSlug: string) => ['issues', orgSlug] as const,
    list: (orgSlug: string, query: IssueListQuery = {}) => ['issues', orgSlug, 'list', query] as const,
    detail: (orgSlug: string, issueId: string) => ['issues', orgSlug, 'detail', issueId] as const,
  },
} as const;
