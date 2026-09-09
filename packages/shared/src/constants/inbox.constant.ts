export const NotificationType = {
  COMMENT: 'comment',
  ASSIGNEE: 'assignee',
  STATUS: 'status',
} as const;

export type NotificationTypeValue = (typeof NotificationType)[keyof typeof NotificationType];

export const INBOX_LIST_LIMIT = 100;

export const InboxNotificationCopy: Record<NotificationTypeValue, string> = {
  [NotificationType.COMMENT]: 'commented on this issue',
  [NotificationType.ASSIGNEE]: 'assigned this issue to you',
  [NotificationType.STATUS]: 'changed the status',
};

