'use client';

import type { InboxRowView } from '@/components/common/inbox/inbox-row';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/constants/date.constant';
import { issuePath } from '@/constants/issue.constant';
import { dicebearAvatarUrl } from '@/constants/user.constant';
import { getNotificationIcon } from '@/lib/notification-utils';
import { renderStatusIcon } from '@/lib/status-utils';
import { ArrowUpRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { NotificationBox } from './icons/motification-box';

interface IssuePreviewProps {
   notification?: InboxRowView;
   unreadCount: number;
   onMarkAsRead?: (id: string) => void;
   markReadPending?: boolean;
}

/**
 * Inbox preview pane: notification context plus a link to the real issue.
 */
export default function IssuePreview({
   notification,
   unreadCount,
   onMarkAsRead,
   markReadPending = false,
}: IssuePreviewProps) {
   const { orgId } = useParams<{ orgId: string }>();

   if (!notification) {
      return (
         <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <NotificationBox className="w-16 h-16 mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
               {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
               Select a notification from the list to view its details and take action.
            </p>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full overflow-hidden">
         <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0">
            <div className="flex items-center gap-2 min-w-0">
               {renderStatusIcon(notification.statusId)}
               <span className="text-sm font-medium truncate">{notification.identifier}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
               {!notification.read && onMarkAsRead && (
                  <Button
                     variant="outline"
                     size="xs"
                     onClick={() => onMarkAsRead(notification.id)}
                     aria-label="Mark as read"
                     disabled={markReadPending}
                     className="gap-1"
                  >
                     <Check className="size-4" />
                     Mark as read
                  </Button>
               )}
               <Button variant="ghost" size="xs" asChild>
                  <Link href={issuePath(orgId, notification.identifier)}>
                     Open
                     <ArrowUpRight className="size-3.5 ml-0.5" />
                  </Link>
               </Button>
            </div>
         </div>

         <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="pt-8 pb-6 px-6 w-full max-w-3xl mx-auto">
               <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg mb-8">
                  <div className="relative shrink-0">
                     <Avatar className="size-7">
                        <AvatarImage
                           src={dicebearAvatarUrl(notification.actorId)}
                           alt={notification.actorName}
                        />
                        <AvatarFallback className="text-xs">
                           {notification.actorName[0]}
                        </AvatarFallback>
                     </Avatar>
                     <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-accent border border-background flex items-center justify-center">
                        {getNotificationIcon(notification.type, 'size-2.5')}
                     </div>
                  </div>
                  <div className="min-w-0 text-sm">
                     <span className="font-medium">{notification.actorName}</span>{' '}
                     <span className="text-muted-foreground">
                        · {formatRelativeTime(notification.createdAt)}
                     </span>
                     <p className="text-foreground/90 mt-0.5">{notification.content}</p>
                  </div>
               </div>

               <h3 className="text-2xl font-semibold text-foreground text-balance">
                  {notification.title}
               </h3>
            </div>
         </div>
      </div>
   );
}
