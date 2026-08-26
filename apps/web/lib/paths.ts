export const DEFAULT_TEAM_KEY = 'CORE';

export function teamHomePath(orgSlug: string, teamKey: string) {
  return `/${orgSlug}/team/${teamKey}/all`;
}

export function issuePath(orgSlug: string, identifier: string) {
  return `/${orgSlug}/issue/${identifier}`;
}
