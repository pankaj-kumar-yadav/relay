export const IssueEventType = {
  CREATED: 'created',
  STATUS: 'status',
  PRIORITY: 'priority',
  ASSIGNEE: 'assignee',
  LABEL: 'label',
  CYCLE: 'cycle',
} as const;

export type IssueEventTypeValue =
  (typeof IssueEventType)[keyof typeof IssueEventType];

export const COMMENT_BODY_MAX = 16_000;
export const ACTIVITY_LIST_LIMIT = 200;
export const COMMENT_REACTION_EMOJI_MAX = 32;
