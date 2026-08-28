'use client';

import { INBOX_POLL_INTERVAL_MS } from '@/constants/inbox.constant';
import { queryKeys } from '@/lib/query-keys';
import {
  listNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  type ApiNotification,
} from '@/services/inbox.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export function useInbox(orgSlug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.inbox(orgSlug ?? ''),
    queryFn: () => listNotificationsApi(orgSlug!),
    enabled: Boolean(orgSlug),
    refetchInterval: INBOX_POLL_INTERVAL_MS,
  });
}

export function useMarkNotificationRead() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();
  const queryKey = queryKeys.inbox(orgSlug ?? '');

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!orgSlug) throw new Error('No organization selected');
      return markNotificationReadApi(orgSlug, notificationId);
    },
    onSuccess: ({ notification }) => {
      queryClient.setQueryData(
        queryKey,
        (previous: { notifications: ApiNotification[]; unreadCount: number } | undefined) => {
          if (!previous) return previous;
          const wasUnread = previous.notifications.some(
            (row) => row.id === notification.id && row.readAt == null,
          );
          return {
            notifications: previous.notifications.map((row) =>
              row.id === notification.id ? notification : row,
            ),
            unreadCount: wasUnread
              ? Math.max(0, previous.unreadCount - 1)
              : previous.unreadCount,
          };
        },
      );
    },
  });
}

export function useMarkAllNotificationsRead() {
  const orgSlug = useParams<{ orgId: string }>().orgId;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      if (!orgSlug) throw new Error('No organization selected');
      return markAllNotificationsReadApi(orgSlug);
    },
    onSuccess: () => {
      if (orgSlug) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.inbox(orgSlug) });
      }
    },
  });
}
