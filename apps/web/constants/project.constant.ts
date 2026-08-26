import { IssueStatus, isIssueStatus, type IssueStatusValue } from '@/constants/issue.constant';
import { orgPath } from '@/constants/org.constant';

export const ProjectStatus = IssueStatus;
export type ProjectStatusValue = IssueStatusValue;

export const ProjectHealth = {
  NO_UPDATE: 'no-update',
  ON_TRACK: 'on-track',
  AT_RISK: 'at-risk',
  OFF_TRACK: 'off-track',
} as const;

export type ProjectHealthValue = (typeof ProjectHealth)[keyof typeof ProjectHealth];

export const DEFAULT_PROJECT_STATUS = IssueStatus.TO_DO;
export const DEFAULT_PROJECT_HEALTH = ProjectHealth.NO_UPDATE;

const PROJECT_HEALTH_VALUES = new Set<string>(Object.values(ProjectHealth));

export const isProjectStatus = isIssueStatus;

export function isProjectHealth(value: string): value is ProjectHealthValue {
  return PROJECT_HEALTH_VALUES.has(value);
}

export const ProjectPath = {
  LIST: '/projects',
} as const;

export const ProjectTab = {
  OVERVIEW: 'overview',
  ACTIVITY: 'activity',
  ISSUES: 'issues',
} as const;

export type ProjectTabValue = (typeof ProjectTab)[keyof typeof ProjectTab];

export function projectPath(
  orgSlug: string,
  projectId: string,
  tab: ProjectTabValue = ProjectTab.OVERVIEW,
): string {
  return orgPath(orgSlug, `/project/${projectId}/${tab}`);
}

export function projectOverviewPath(orgSlug: string, projectId: string): string {
  return projectPath(orgSlug, projectId, ProjectTab.OVERVIEW);
}

export function projectActivityPath(orgSlug: string, projectId: string): string {
  return projectPath(orgSlug, projectId, ProjectTab.ACTIVITY);
}

export function projectIssuesPath(orgSlug: string, projectId: string): string {
  return projectPath(orgSlug, projectId, ProjectTab.ISSUES);
}

export function projectsPath(orgSlug: string): string {
  return orgPath(orgSlug, ProjectPath.LIST);
}
