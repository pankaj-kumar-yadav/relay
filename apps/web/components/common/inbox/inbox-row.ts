import {
  InboxNotificationCopy,
  type NotificationTypeValue,
} from '@/constants/inbox.constant';
import type { ApiNotification } from '@/services/inbox.service';

export type InboxRowView = {
  id: string;
  type: NotificationTypeValue;
  identifier: string;
  title: string;
  statusId: string;
  actorName: string;
  actorId: string;
  content: string;
  createdAt: string;
  read: boolean;
  issueId: string;
};

export function toInboxRow(notification: ApiNotification): InboxRowView {
  return {
    id: notification.id,
    type: notification.type,
    identifier: notification.issue.identifier,
    title: notification.issue.title,
    statusId: notification.issue.status,
    actorName: notification.actor.name,
    actorId: notification.actor.id,
    content: InboxNotificationCopy[notification.type],
    createdAt: notification.createdAt,
    read: notification.readAt != null,
    issueId: notification.issue.id,
  };
}
