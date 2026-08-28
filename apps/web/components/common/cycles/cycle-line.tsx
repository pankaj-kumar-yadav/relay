'use client';

import { CycleStatus, cycleStatusLabel, formatCycleDateRange } from '@/constants/cycle.constant';
import { CycleViewPath, teamCycleViewPath } from '@/constants/team.constant';
import { cn } from '@/lib/utils';
import type { ApiCycle } from '@/services/cycles.service';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export function CyclePlayIcon({ className }: { className?: string }) {
   return (
      <svg
         width="16"
         height="16"
         viewBox="0 0 16 16"
         fill="none"
         className={cn('text-muted-foreground shrink-0', className)}
         role="img"
         focusable="false"
      >
         <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
         <path d="M6.75 5.75L10.25 8L6.75 10.25V5.75Z" fill="currentColor" />
      </svg>
   );
}

interface CycleLineProps {
   cycle: Pick<ApiCycle, 'id' | 'name' | 'status' | 'startsAt' | 'endsAt' | 'issueCount'>;
}

export default function CycleLine({ cycle }: CycleLineProps) {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();

   const href =
      cycle.status === CycleStatus.ACTIVE
         ? teamCycleViewPath(orgId, teamId, CycleViewPath.ACTIVE)
         : cycle.status === CycleStatus.UPCOMING
           ? teamCycleViewPath(orgId, teamId, CycleViewPath.UPCOMING)
           : undefined;

   const content = (
      <div className="w-full flex items-center justify-between gap-4 px-6 h-12 hover:bg-sidebar/50 rounded-md">
         <div className="flex items-center gap-3 min-w-0">
            <CyclePlayIcon />
            <span className="text-sm font-medium truncate">{cycle.name}</span>
         </div>

         <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <span className="text-xs px-2 py-1 rounded-md bg-accent text-muted-foreground whitespace-nowrap">
               {cycleStatusLabel[cycle.status]}
            </span>
            <span className="hidden sm:inline-block text-sm text-muted-foreground whitespace-nowrap">
               {formatCycleDateRange(cycle)}
            </span>
            <span className="text-sm w-14 sm:w-20 text-right whitespace-nowrap">
               {cycle.issueCount}{' '}
               <span className="text-muted-foreground">
                  {cycle.issueCount === 1 ? 'issue' : 'issues'}
               </span>
            </span>
         </div>
      </div>
   );

   if (href) {
      return (
         <Link href={href} className="block w-full">
            {content}
         </Link>
      );
   }

   return content;
}
