'use client';

import { DateFormat, formatDate } from '@/constants/date.constant';
import { CycleStatus } from '@/constants/cycle.constant';
import { useCycles } from '@/hooks/use-cycles';
import { useParams } from 'next/navigation';
import { Fragment } from 'react';
import CycleLine from './cycle-line';

export default function Cycles() {
   const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
   const { data: cycles = [], isLoading } = useCycles(orgId, teamId);

   if (isLoading) {
      return <div className="w-full py-8 text-sm text-muted-foreground px-6">Loading cycles…</div>;
   }

   if (cycles.length === 0) {
      return (
         <div className="w-full py-8 text-sm text-muted-foreground px-6">
            No cycles yet.
         </div>
      );
   }

   return (
      <div className="w-full py-4">
         {cycles.map((cycle) => (
            <Fragment key={cycle.id}>
               <div className="w-full flex items-stretch">
                  <div className="relative w-14 sm:w-20 shrink-0 flex flex-col items-end pr-4">
                     <div className="absolute right-[20.5px] top-0 bottom-0 w-px bg-border" />
                     <div className="flex items-center gap-2 h-12">
                        <span className="text-[11px] leading-tight text-muted-foreground text-right">
                           {formatDate(cycle.startsAt, DateFormat.MONTH)}
                           <br />
                           {formatDate(cycle.startsAt, DateFormat.DAY)}
                        </span>
                        <span
                           className={
                              'relative z-10 size-2.5 rounded-full border-2 bg-background ' +
                              (cycle.status === CycleStatus.ACTIVE
                                 ? 'border-indigo-400 bg-indigo-400'
                                 : 'border-muted-foreground/40')
                           }
                        />
                     </div>
                  </div>

                  <div className="flex-1 min-w-0 border-b border-border/60">
                     <CycleLine cycle={cycle} />
                  </div>
               </div>
            </Fragment>
         ))}
      </div>
   );
}
