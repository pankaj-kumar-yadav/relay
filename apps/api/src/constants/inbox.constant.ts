export const NotificationType = {
  COMMENT: 'comment',
  ASSIGNEE: 'assignee',
  STATUS: 'status',
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

export const INBOX_LIST_LIMIT = 100;
