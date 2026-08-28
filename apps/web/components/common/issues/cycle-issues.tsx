'use client';

import { CycleDetailsPanel } from '@/components/common/cycles/cycle-details-panel';
import { CycleStatus } from '@/constants/cycle.constant';
import { useCycles } from '@/hooks/use-cycles';
import { useIssuesList } from '@/hooks/use-issues';
import { displayOrderedStatus } from '@/mock-data/status';
import { useFilterStore } from '@/store/filter-store';
import { applyIssueFilters } from './issue-filter-columns';
import { IssueFilterBar } from './issue-filter-bar';
import { useRightPanelStore } from '@/store/right-panel-store';
import { useSearchStore } from '@/store/search-store';
import { useViewStore } from '@/store/view-store';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { GroupedIssuesView } from './grouped-issues-view';
import { InsightsPanel } from './insights-panel';
import { SearchIssues } from './search-issues';

export type CycleView = 'active' | 'upcoming';

interface CycleIssuesProps {
   cycleView: CycleView;
}

export default function CycleIssues({ cycleView }: CycleIssuesProps) {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const { isSearchOpen, searchQuery } = useSearchStore();
   const { viewType } = useViewStore();
   const { filters } = useFilterStore();
   const { openPanel } = useRightPanelStore();
   const { data: cycles = [], isLoading: cyclesLoading } = useCycles(orgId, teamId);

   const wanted = cycleView === 'active' ? CycleStatus.ACTIVE : CycleStatus.UPCOMING;
   const cycle = cycles.find((item) => item.status === wanted);

   const { data: cycleIssues = [], isLoading: issuesLoading } = useIssuesList(
      orgId,
      {
         teamId,
         cycleId: cycle?.id,
      },
      { enabled: Boolean(cycle?.id) },
   );

   const isSearching = isSearchOpen && searchQuery.trim() !== '';
   const isViewTypeGrid = viewType === 'grid';

   const displayedIssues = useMemo(
      () => applyIssueFilters(cycleIssues, filters),
      [cycleIssues, filters],
   );

   if (cyclesLoading || (cycle && issuesLoading)) {
      return <div className="w-full py-8 text-sm text-muted-foreground px-6">Loading cycle…</div>;
   }

   if (!cycle) {
      return (
         <div className="w-full py-8 text-sm text-muted-foreground px-6">
            No {cycleView} cycle for this team.
         </div>
      );
   }

   if (isSearching) {
      return (
         <div className="w-full h-full">
            <div className="px-6 mb-6">
               <SearchIssues />
            </div>
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
                  totalIssues={cycleIssues}
                  statuses={displayOrderedStatus}
                  isViewTypeGrid={isViewTypeGrid}
               />
            </div>

            {openPanel === 'insights' && (
               <aside className="hidden lg:flex w-[420px] shrink-0 border-l h-full overflow-hidden bg-container">
                  <InsightsPanel issues={displayedIssues} />
               </aside>
            )}
            {openPanel === 'cycle-details' && (
               <aside className="hidden lg:flex w-[420px] shrink-0 border-l h-full overflow-hidden bg-container">
                  <CycleDetailsPanel cycle={cycle} issues={cycleIssues} />
               </aside>
            )}
         </div>
      </div>
   );
}
