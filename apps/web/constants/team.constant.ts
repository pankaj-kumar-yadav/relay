import { orgPath } from '@/constants/org.constant';

export const DEFAULT_TEAM_KEY = 'CORE';

export const TEAM_KEY_MIN_LENGTH = 2;
export const TEAM_KEY_MAX_LENGTH = 10;
export const TEAM_KEY_PATTERN = /^[A-Z0-9]{2,10}$/;
export const TEAM_ICON_MAX = 32;

export const TeamPath = {
  LIST: '/teams',
} as const;

export const TeamTab = {
  OVERVIEW: 'overview',
  ALL: 'all',
  ACTIVE: 'active',
  BACKLOG: 'backlog',
  MEMBERS: 'members',
  CYCLES: 'cycles',
  VIEWS: 'views',
} as const;

export type TeamTabValue = (typeof TeamTab)[keyof typeof TeamTab];

export const CycleViewPath = {
  ACTIVE: 'active',
  UPCOMING: 'upcoming',
} as const;

export type CycleViewPathValue = (typeof CycleViewPath)[keyof typeof CycleViewPath];

export function normalizeTeamKey(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isTeamKey(value: string): boolean {
  return TEAM_KEY_PATTERN.test(value);
}

export function teamPath(orgSlug: string, teamKey: string, tab: string): string {
  return orgPath(orgSlug, `/team/${teamKey}/${tab}`);
}

export function teamHomePath(orgSlug: string, teamKey: string): string {
  return teamPath(orgSlug, teamKey, TeamTab.ALL);
}

export function teamOverviewPath(orgSlug: string, teamKey: string): string {
  return teamPath(orgSlug, teamKey, TeamTab.OVERVIEW);
}

export function teamMembersPath(orgSlug: string, teamKey: string): string {
  return teamPath(orgSlug, teamKey, TeamTab.MEMBERS);
}

export function teamCyclesPath(orgSlug: string, teamKey: string): string {
  return teamPath(orgSlug, teamKey, TeamTab.CYCLES);
}

export function teamViewsPath(orgSlug: string, teamKey: string): string {
  return teamPath(orgSlug, teamKey, TeamTab.VIEWS);
}

export function teamCycleViewPath(
  orgSlug: string,
  teamKey: string,
  view: CycleViewPathValue,
): string {
  return orgPath(orgSlug, `/team/${teamKey}/cycle/${view}`);
}

export function teamsPath(orgSlug: string): string {
  return orgPath(orgSlug, TeamPath.LIST);
}
