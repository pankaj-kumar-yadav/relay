'use client';

import { CreateViewButton } from '@/components/common/views/create-view-dialog';
import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { VIEW_ICON, viewsPath } from '@/constants/view.constant';
import { useIssuesList } from '@/hooks/use-issues';
import { useSession } from '@/hooks/use-session';
import { useDeleteView, useView } from '@/hooks/use-views';
import { ApiError } from '@/lib/api';
import { useRightPanelStore } from '@/store/right-panel-store';
import { BarChart3, MoreHorizontal } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function Header() {
   const { orgId, viewId } = useParams<{ orgId: string; viewId: string }>();
   const router = useRouter();
   const { data: view } = useView(orgId, viewId);
   const { data: session } = useSession();
   const { openPanel, togglePanel } = useRightPanelStore();
   const deleteView = useDeleteView();
   const [editOpen, setEditOpen] = useState(false);
   const { data: issues = [] } = useIssuesList(orgId, view?.filters ?? {}, {
      enabled: Boolean(view),
   });

   if (!view) return null;

   const isOwner = session?.id === view.ownerId;

   const onDelete = async () => {
      try {
         await deleteView.mutateAsync(view.slug);
         toast.success('View deleted');
         router.push(viewsPath(orgId));
      } catch (err) {
         toast.error(err instanceof ApiError ? err.message : 'Could not delete view');
      }
   };

   return (
      <div className="w-full flex flex-col">
         <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
            <div className="flex items-center gap-2 min-w-0">
               <SidebarTrigger />
               <span className="inline-flex size-5 items-center justify-center rounded bg-muted/50 text-xs shrink-0">
                  {VIEW_ICON}
               </span>
               <span className="text-sm font-medium truncate">{view.name}</span>
               {isOwner && (
                  <>
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button size="xs" variant="ghost" className="shrink-0">
                              <MoreHorizontal className="size-3.5" />
                           </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                           <DropdownMenuItem onClick={() => setEditOpen(true)}>
                              Rename
                           </DropdownMenuItem>
                           <DropdownMenuItem onClick={() => void onDelete()}>
                              Delete
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                     </DropdownMenu>
                     <CreateViewButton
                        view={view}
                        open={editOpen}
                        onOpenChange={setEditOpen}
                        trigger={null}
                     />
                  </>
               )}
            </div>
         </div>
         <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
            <span className="text-xs text-muted-foreground">{issues.length} issues</span>
            <Button
               size="xs"
               variant={openPanel === 'insights' ? 'secondary' : 'ghost'}
               onClick={() => togglePanel('insights')}
            >
               <BarChart3 className="size-4" />
            </Button>
         </div>
      </div>
   );
}
