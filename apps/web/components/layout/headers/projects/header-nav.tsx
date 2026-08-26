'use client';

import { CreateProjectButton } from '@/components/common/projects/create-project-modal';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useProjects } from '@/hooks/use-projects';
import { useParams } from 'next/navigation';

export default function HeaderNav() {
   const { orgId, teamId } = useParams<{ orgId: string; teamId?: string }>();
   const { data: projects = [] } = useProjects(orgId, { teamId });

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10">
         <div className="flex items-center gap-2">
            <SidebarTrigger className="" />
            <div className="flex items-center gap-1">
               <span className="text-sm font-medium">Projects</span>
               <span className="text-xs bg-accent rounded-md px-1.5 py-1">{projects.length}</span>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <CreateProjectButton defaultTeamKey={teamId} />
         </div>
      </div>
   );
}
