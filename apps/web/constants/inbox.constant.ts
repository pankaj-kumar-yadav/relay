import { orgPath } from '@/constants/org.constant';
import { NotificationType, type NotificationTypeValue } from '@relay/shared/constants/inbox.constant';

export {
   NotificationType,
   INBOX_LIST_LIMIT,
   type NotificationTypeValue,
} from '@relay/shared/constants/inbox.constant';

export const INBOX_POLL_INTERVAL_MS = 300_000;
export const INBOX_UNREAD_BADGE_MAX = 99;

export const InboxPath = {
   INBOX: '/inbox',
} as const;

export function inboxPath(orgSlug: string): string {
   return orgPath(orgSlug, InboxPath.INBOX);
}

export const InboxNotificationCopy: Record<NotificationTypeValue, string> = {
   [NotificationType.COMMENT]: 'commented on this issue',
   [NotificationType.ASSIGNEE]: 'assigned this issue to you',
   [NotificationType.STATUS]: 'changed the status',
};
