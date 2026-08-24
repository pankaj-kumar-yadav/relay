export const DEFAULT_TEAM_KEY = 'CORE';
export const DEFAULT_TEAM_NAME = 'Core';

export const IssueStatus = {
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

export type IssueStatusValue = (typeof IssueStatus)[keyof typeof IssueStatus];

export const IssuePriority = {
  NO_PRIORITY: 'no-priority',
  URGENT: 'urgent',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type IssuePriorityValue = (typeof IssuePriority)[keyof typeof IssuePriority];

export const IssueStatusCategory = {
  TRIAGE: 'triage',
  BACKLOG: 'backlog',
  UNSTARTED: 'unstarted',
  STARTED: 'started',
  COMPLETED: 'completed',
  CANCELED: 'canceled',
} as const;

export type IssueStatusCategoryValue =
  (typeof IssueStatusCategory)[keyof typeof IssueStatusCategory];

export const DEFAULT_ISSUE_STATUS = IssueStatus.TO_DO;
export const DEFAULT_ISSUE_PRIORITY = IssuePriority.NO_PRIORITY;

export const ISSUE_STATUS_CATEGORY: Record<IssueStatusValue, IssueStatusCategoryValue> = {
  [IssueStatus.TRIAGE]: IssueStatusCategory.TRIAGE,
  [IssueStatus.BACKLOG]: IssueStatusCategory.BACKLOG,
  [IssueStatus.IDEA]: IssueStatusCategory.BACKLOG,
  [IssueStatus.TO_DO]: IssueStatusCategory.UNSTARTED,
  [IssueStatus.IN_PROGRESS]: IssueStatusCategory.STARTED,
  [IssueStatus.TECHNICAL_REVIEW]: IssueStatusCategory.STARTED,
  [IssueStatus.PAUSED]: IssueStatusCategory.STARTED,
  [IssueStatus.PRODUCT_FEEDBACK]: IssueStatusCategory.STARTED,
  [IssueStatus.BLOCKED]: IssueStatusCategory.STARTED,
  [IssueStatus.DONE]: IssueStatusCategory.COMPLETED,
  [IssueStatus.SHIPPED]: IssueStatusCategory.COMPLETED,
  [IssueStatus.CANCELED]: IssueStatusCategory.CANCELED,
  [IssueStatus.DUPLICATE]: IssueStatusCategory.CANCELED,
};

const ISSUE_STATUS_VALUES = new Set<string>(Object.values(IssueStatus));
const ISSUE_PRIORITY_VALUES = new Set<string>(Object.values(IssuePriority));

export function isIssueStatus(value: string): value is IssueStatusValue {
  return ISSUE_STATUS_VALUES.has(value);
}

export function isIssuePriority(value: string): value is IssuePriorityValue {
  return ISSUE_PRIORITY_VALUES.has(value);
}

export function statusesForCategories(
  categories: IssueStatusCategoryValue[],
): IssueStatusValue[] {
  const wanted = new Set(categories);
  return (Object.keys(ISSUE_STATUS_CATEGORY) as IssueStatusValue[]).filter((id) =>
    wanted.has(ISSUE_STATUS_CATEGORY[id]),
  );
}
