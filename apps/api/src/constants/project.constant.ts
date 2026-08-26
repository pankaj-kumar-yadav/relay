import { IssueStatus, isIssueStatus, type IssueStatusValue } from './issue.js';

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
