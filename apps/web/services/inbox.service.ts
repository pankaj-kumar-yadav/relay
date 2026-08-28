import { api } from '@/lib/api';
import type { NotificationTypeValue } from '@/constants/inbox.constant';

export type ApiNotification = {
  id: string;
  type: NotificationTypeValue;
  readAt: string | null;
  createdAt: string;
  actor: { id: string; name: string };
  issue: {
    id: string;
    identifier: string;
    title: string;
    status: string;
  };
};

export async function listNotificationsApi(orgSlug: string) {
  return api<{ notifications: ApiNotification[]; unreadCount: number }>(
    `/orgs/${orgSlug}/notifications`,
  );
}

export async function markNotificationReadApi(orgSlug: string, notificationId: string) {
  return api<{ notification: ApiNotification }>(
    `/orgs/${orgSlug}/notifications/${notificationId}/read`,
    { method: 'POST' },
  );
}

export async function markAllNotificationsReadApi(orgSlug: string) {
  return api<{ unreadCount: number }>(`/orgs/${orgSlug}/notifications/read-all`, {
    method: 'POST',
  });
}
