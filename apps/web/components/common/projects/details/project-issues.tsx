'use client';

import { projectsPath } from '@/constants/project.constant';
import { GroupedIssuesView } from '@/components/common/issues/grouped-issues-view';
import { applyIssueFilters } from '@/components/common/issues/issue-filter-columns';
import { IssueFilterBar } from '@/components/common/issues/issue-filter-bar';
import { useIssuesList } from '@/hooks/use-issues';
import { useProject } from '@/hooks/use-projects';
import { getProjectDetail } from '@/mock-data/project-details';
import { displayOrderedStatus } from '@/mock-data/status';
import { useFilterStore } from '@/store/filter-store';
import { useIssuesStore } from '@/store/issues-store';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { ProjectSidePanel } from './project-side-panel';

interface ProjectIssuesProps {
   projectId: string;
}

/** Project "Issues" tab: the project's issues grouped by status. */
export default function ProjectIssues({ projectId }: ProjectIssuesProps) {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: project, isLoading, isError } = useProject(orgId, projectId);
   const { issues: allIssues } = useIssuesStore();
   const { filters } = useFilterStore();
   useIssuesList(orgId, { projectId });

   const issues = useMemo(
      () => allIssues.filter((issue) => issue.project?.id === projectId),
      [allIssues, projectId],
   );

   const displayedIssues = useMemo(() => applyIssueFilters(issues, filters), [issues, filters]);
   const detail = getProjectDetail(projectId);

   if (isLoading) {
      return <div className="h-full" />;
   }

   if (!project || isError) {
      return (
         <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-muted-foreground">
            <p>Project not found.</p>
            <Link href={projectsPath(orgId)} className="underline">
               Back to projects
            </Link>
         </div>
      );
   }

   return (
      <div className="w-full h-full flex flex-col overflow-hidden">
         <IssueFilterBar />
         <div className="flex-1 min-h-0 w-full flex overflow-hidden">
            <div className="flex-1 min-w-0 h-full overflow-hidden">
               <GroupedIssuesView
                  issues={displayedIssues}
                  totalIssues={issues}
                  statuses={displayOrderedStatus}
                  isViewTypeGrid={false}
               />
            </div>
            <ProjectSidePanel
               project={project}
               detail={detail}
               issues={issues}
               insightsIssues={displayedIssues}
            />
         </div>
      </div>
   );
}
