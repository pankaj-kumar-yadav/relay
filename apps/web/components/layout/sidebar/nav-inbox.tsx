'use client';

import {
   SidebarGroup,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import { FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function NavInbox() {
   const { orgId } = useParams<{ orgId: string }>();

   return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
         <SidebarMenu>
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
