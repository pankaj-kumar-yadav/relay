'use client';

import { GroupedIssuesView } from '@/components/common/issues/grouped-issues-view';
import { InsightsPanel } from '@/components/common/issues/insights-panel';
import { useIssuesList } from '@/hooks/use-issues';
import { useView } from '@/hooks/use-views';
import { displayOrderedStatus } from '@/mock-data/status';
import { useRightPanelStore } from '@/store/right-panel-store';
import { useParams } from 'next/navigation';

/** Saved-view detail page: filtered issues from the API. */
export default function ViewDetails({ viewId }: { viewId: string }) {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: view, isLoading, isError } = useView(orgId, viewId);
   const { openPanel } = useRightPanelStore();
   const { data: issues = [], isLoading: issuesLoading } = useIssuesList(
      orgId,
      view?.filters ?? {},
      { enabled: Boolean(view) },
   );

   if (isLoading) {
      return (
         <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            Loading view…
         </div>
      );
   }

   if (isError || !view) {
      return (
         <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            View not found
         </div>
      );
   }

   if (issuesLoading) {
      return (
         <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
            Loading issues…
         </div>
      );
   }

   return (
      <div className="w-full h-full flex flex-col overflow-hidden">
         <div className="flex-1 min-h-0 w-full flex overflow-hidden">
            <div className="flex-1 min-w-0 h-full overflow-hidden">
               <GroupedIssuesView
                  issues={issues}
                  totalIssues={issues}
                  statuses={displayOrderedStatus}
                  isViewTypeGrid={false}
               />
            </div>
            {openPanel === 'insights' && (
               <aside className="hidden lg:flex w-[420px] shrink-0 border-l h-full overflow-hidden bg-container">
                  <InsightsPanel issues={issues} />
               </aside>
            )}
         </div>
      </div>
   );
}
