'use client';

import {
   SidebarGroup,
   SidebarMenu,
   SidebarMenuBadge,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import { inboxPath, INBOX_UNREAD_BADGE_MAX } from '@/constants/inbox.constant';
import { myIssuesPath } from '@/constants/issue.constant';
import { useInbox } from '@/hooks/use-inbox';
import { useCommandPaletteStore } from '@/store/command-palette-store';
import {
   isSidebarItemVisible,
   resolveOrder,
   SidebarItemKey,
   useSidebarPrefsStore,
} from '@/store/sidebar-prefs-store';
import { FolderKanban, Inbox, LucideIcon, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type PersonalNavItem = {
   key: SidebarItemKey;
   name: string;
   icon: LucideIcon;
   href: (orgSlug: string) => string;
};

const PERSONAL_NAV: PersonalNavItem[] = [
   { key: 'inbox', name: 'Inbox', icon: Inbox, href: inboxPath },
   { key: 'my-issues', name: 'My issues', icon: FolderKanban, href: myIssuesPath },
];

export function NavInbox() {
   const { orgId } = useParams<{ orgId: string }>();
   const openPalette = useCommandPaletteStore((state) => state.open);
   const { visibility, badgeStyle, order } = useSidebarPrefsStore();
   const { data } = useInbox(orgId);
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);

   const unread = mounted ? (data?.unreadCount ?? 0) : 0;

   const orderedNav = mounted
      ? resolveOrder(
           order.personal,
           PERSONAL_NAV.map((item) => item.key),
        )
           .map((key) => PERSONAL_NAV.find((item) => item.key === key))
           .filter((item): item is PersonalNavItem => Boolean(item))
      : PERSONAL_NAV;

   const items = orderedNav.filter((item) => {
      if (!mounted) return true;
      const badge = item.key === 'inbox' ? unread : 0;
      return isSidebarItemVisible(visibility[item.key], badge);
   });

   return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
         <SidebarMenu>
            <SidebarMenuItem>
               <SidebarMenuButton onClick={openPalette}>
                  <Search />
                  <span>Search</span>
                  <kbd className="ml-auto min-w-5 h-5 px-1 inline-flex items-center justify-center rounded border bg-muted/50 text-[10px] text-muted-foreground font-sans">
                     Ctrl K
                  </kbd>
               </SidebarMenuButton>
            </SidebarMenuItem>
            {items.map((item) => (
               <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                     <Link href={item.href(orgId)}>
                        <item.icon />
                        <span>{item.name}</span>
                     </Link>
                  </SidebarMenuButton>
                  {mounted && item.key === 'inbox' && unread > 0 && (
                     <SidebarMenuBadge className="text-muted-foreground">
                        {badgeStyle === 'count' ? (
                           unread > INBOX_UNREAD_BADGE_MAX ? (
                              `${INBOX_UNREAD_BADGE_MAX}+`
                           ) : (
                              unread
                           )
                        ) : (
                           <span className="size-1.5 rounded-full bg-muted-foreground inline-block" />
                        )}
                     </SidebarMenuBadge>
                  )}
               </SidebarMenuItem>
            ))}
         </SidebarMenu>
      </SidebarGroup>
   );
}
