'use client';

import { CreateViewButton } from '@/components/common/views/create-view-dialog';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Plus } from 'lucide-react';

export default function Header() {
   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2">
            <SidebarTrigger />
            <span className="text-sm font-medium">Views</span>
         </div>
         <CreateViewButton
            trigger={
               <Button size="xs" variant="ghost">
                  <Plus className="size-4" />
               </Button>
            }
         />
      </div>
   );
}
