export const ProjectStatus = {
  TRIAGE: 'triage',
  BACKLOG: 'backlog',
  IDEA: 'idea',
  TO_DO: 'to-do',
  IN_PROGRESS: 'in-progress',
  TECHNICAL_REVIEW: 'technical-review',
  PAUSED: 'paused',
  PRODUCT_FEEDBACK: 'product-feedback',
  BLOCKED: 'blocked',
  DONE: 'done',
  SHIPPED: 'shipped',
  CANCELED: 'canceled',
  DUPLICATE: 'duplicate',
} as const;

export type ProjectStatusValue = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const ProjectHealth = {
  NO_UPDATE: 'no-update',
  ON_TRACK: 'on-track',
  AT_RISK: 'at-risk',
  OFF_TRACK: 'off-track',
} as const;

export type ProjectHealthValue = (typeof ProjectHealth)[keyof typeof ProjectHealth];

export const DEFAULT_PROJECT_STATUS = ProjectStatus.TO_DO;
export const DEFAULT_PROJECT_HEALTH = ProjectHealth.NO_UPDATE;

const PROJECT_STATUS_VALUES = new Set<string>(Object.values(ProjectStatus));
const PROJECT_HEALTH_VALUES = new Set<string>(Object.values(ProjectHealth));

export function isProjectStatus(value: string): value is ProjectStatusValue {
  return PROJECT_STATUS_VALUES.has(value);
}

export function isProjectHealth(value: string): value is ProjectHealthValue {
  return PROJECT_HEALTH_VALUES.has(value);
}
