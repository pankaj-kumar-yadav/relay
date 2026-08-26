export const DEFAULT_TEAM_KEY = 'CORE';

export function teamHomePath(orgSlug: string, teamKey: string) {
  return `/${orgSlug}/team/${teamKey}/all`;
}

export function issuePath(orgSlug: string, identifier: string) {
  return `/${orgSlug}/issue/${identifier}`;
}

export function projectIssuesPath(orgSlug: string, projectId: string) {
  return `/${orgSlug}/project/${projectId}/issues`;
}

export function projectsPath(orgSlug: string) {
  return `/${orgSlug}/projects`;
}
