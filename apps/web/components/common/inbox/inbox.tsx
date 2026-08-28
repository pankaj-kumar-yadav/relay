'use client';

import { toInboxRow, type InboxRowView } from '@/components/common/inbox/inbox-row';
import { useInbox, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/hooks/use-inbox';
import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
   DropdownMenuLabel,
   DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
   MoreHorizontal,
   SlidersHorizontal,
   Trash2,
   CheckCheck,
   Archive,
   ArrowUpDown,
} from 'lucide-react';
import NotificationPreview from './issue-preview';
import IssueLine from './issue-line';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChevronLeft } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export default function Inbox() {
   const { orgId } = useParams<{ orgId: string }>();
   const { data, isLoading } = useInbox(orgId);
   const markRead = useMarkNotificationRead();
   const markAll = useMarkAllNotificationsRead();
   const [selectedId, setSelectedId] = useState<string | undefined>();
   const isMobile = useIsMobile();
   const [showRead, setShowRead] = useState(true);
   const [showUnreadFirst, setShowUnreadFirst] = useState(false);
   const [ordering, setOrdering] = useState('newest');
   const [showId, setShowId] = useState(true);
   const [showStatusIcon, setShowStatusIcon] = useState(true);

   const notifications = useMemo(
      () => (data?.notifications ?? []).map(toInboxRow),
      [data?.notifications],
   );
   const unreadCount = data?.unreadCount ?? 0;

   const filteredNotifications = notifications
      .filter((notification) => {
         if (!showRead && notification.read) return false;
         return true;
      })
      .sort((a, b) => {
         if (showUnreadFirst) {
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
         }
         return ordering === 'newest'
            ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

   const selectedNotification = notifications.find((row) => row.id === selectedId);

   const selectNotification = (notification: InboxRowView) => {
      setSelectedId(notification.id);
   };

   const listPane = (
      <>
         <div className="flex items-center justify-between px-4 h-10 border-b border-border">
            <div className="flex items-center gap-2">
               <SidebarTrigger className="inline-flex lg:hidden" />
               <h2 className="text-lg font-semibold">Inbox</h2>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="xs">
                        <MoreHorizontal className="w-4 h-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                     {/* Delete / snooze stay Circle leftovers — not wired in v1 */}
                     <DropdownMenuItem disabled>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete all notifications
                     </DropdownMenuItem>
                     <DropdownMenuItem disabled>
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Delete all read notifications
                     </DropdownMenuItem>
                     <DropdownMenuItem disabled>
                        <Archive className="w-4 h-4 mr-2" />
                        Delete notifications for completed issues
                     </DropdownMenuItem>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
               <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => markAll.mutate()}
                  disabled={unreadCount === 0 || markAll.isPending}
               >
                  <CheckCheck className="w-4 h-4" />
               </Button>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="xs">
                        <SlidersHorizontal className="w-4 h-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                     <DropdownMenuLabel className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4" />
                        Ordering
                     </DropdownMenuLabel>
                     <DropdownMenuCheckboxItem
                        checked={ordering === 'newest'}
                        onCheckedChange={() => setOrdering('newest')}
                     >
                        Newest
                     </DropdownMenuCheckboxItem>
                     <DropdownMenuCheckboxItem
                        checked={ordering === 'oldest'}
                        onCheckedChange={() => setOrdering('oldest')}
                     >
                        Oldest
                     </DropdownMenuCheckboxItem>

                     <DropdownMenuSeparator />

                     <div className="p-2 space-y-3">
                        <div className="flex items-center justify-between">
                           <Label htmlFor="show-read" className="text-sm">
                              Show read
                           </Label>
                           <Switch
                              id="show-read"
                              checked={showRead}
                              onCheckedChange={setShowRead}
                           />
                        </div>
                        <div className="flex items-center justify-between">
                           <Label htmlFor="show-unread-first" className="text-sm">
                              Show unread first
                           </Label>
                           <Switch
                              id="show-unread-first"
                              checked={showUnreadFirst}
                              onCheckedChange={setShowUnreadFirst}
                           />
                        </div>
                     </div>

                     <DropdownMenuSeparator />

                     <DropdownMenuLabel>Display properties</DropdownMenuLabel>
                     <div className="p-2 space-y-3">
                        <div className="flex items-center justify-between">
                           <Label htmlFor="show-id" className="text-sm">
                              ID
                           </Label>
                           <Switch id="show-id" checked={showId} onCheckedChange={setShowId} />
                        </div>
                        <div className="flex items-center justify-between">
                           <Label htmlFor="show-status-icon" className="text-sm">
                              Status and icon
                           </Label>
                           <Switch
                              id="show-status-icon"
                              checked={showStatusIcon}
                              onCheckedChange={setShowStatusIcon}
                           />
                        </div>
                     </div>
                  </DropdownMenuContent>
               </DropdownMenu>
            </div>
         </div>
         <div className="w-full flex flex-col items-center justify-start overflow-y-scroll h-[calc(100%-40px)] pb-0.25">
            {isLoading ? (
               <p className="text-sm text-muted-foreground py-8">Loading inbox…</p>
            ) : filteredNotifications.length === 0 ? (
               <p className="text-sm text-muted-foreground py-8">No notifications yet.</p>
            ) : (
               filteredNotifications.map((notification) => (
                  <IssueLine
                     key={notification.id}
                     notification={notification}
                     isSelected={selectedNotification?.id === notification.id}
                     onClick={() => selectNotification(notification)}
                     showId={showId}
                     showStatusIcon={showStatusIcon}
                  />
               ))
            )}
         </div>
      </>
   );

   if (isMobile) {
      return selectedNotification ? (
         <div className="flex flex-col h-full w-full">
            <button
               onClick={() => setSelectedId(undefined)}
               className="flex items-center gap-1 px-4 h-10 border-b border-border text-sm text-muted-foreground hover:text-foreground shrink-0"
            >
               <ChevronLeft className="size-4" />
               Inbox
            </button>
            <div className="flex-1 min-h-0">
               <NotificationPreview
                  notification={selectedNotification}
                  unreadCount={unreadCount}
                  onMarkAsRead={(id) => markRead.mutate(id)}
                  markReadPending={markRead.isPending}
               />
            </div>
         </div>
      ) : (
         <div className="flex flex-col h-full w-full">{listPane}</div>
      );
   }

   return (
      <ResizablePanelGroup
         direction="horizontal"
         autoSaveId="inbox-panel-group"
         className="w-full h-full"
      >
         <ResizablePanel defaultSize={350} maxSize={500}>
            {listPane}
         </ResizablePanel>
         <ResizableHandle withHandle />
         <ResizablePanel defaultSize={350} maxSize={500}>
            <NotificationPreview
               notification={selectedNotification}
               unreadCount={unreadCount}
               onMarkAsRead={(id) => markRead.mutate(id)}
               markReadPending={markRead.isPending}
            />
         </ResizablePanel>
      </ResizablePanelGroup>
   );
}
