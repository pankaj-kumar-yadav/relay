'use client';

import {
   SidebarGroup,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCommandPaletteStore } from '@/store/command-palette-store';
import { FolderKanban, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function NavInbox() {
   const { orgId } = useParams<{ orgId: string }>();
   const openPalette = useCommandPaletteStore((state) => state.open);

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
            <SidebarMenuItem>
               <SidebarMenuButton asChild>
                  <Link href={`/${orgId}/my-issues`}>
                     <FolderKanban />
                     <span>My issues</span>
                  </Link>
               </SidebarMenuButton>
            </SidebarMenuItem>
         </SidebarMenu>
      </SidebarGroup>
   );
}
