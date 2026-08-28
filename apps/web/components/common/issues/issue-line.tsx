'use client';

import { Issue } from '@/mock-data/issues';
import { DateFormat, formatDate } from '@/constants/date.constant';
import { issuePath } from '@/constants/issue.constant';
import { useDisplaySettingsStore } from '@/store/display-settings-store';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AssigneeUser } from './assignee-user';
import { LabelBadge } from './label-badge';
import { PrioritySelector } from './priority-selector';
import { ProjectBadge } from './project-badge';
import { StatusSelector } from './status-selector';
import { motion } from 'motion/react';

import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu';
import { IssueContextMenu } from './issue-context-menu';

export function IssueLine({ issue, layoutId = false }: { issue: Issue; layoutId?: boolean }) {
   const { orgId } = useParams<{ orgId: string }>();
   const { displayProperties } = useDisplaySettingsStore();
   const cycleName =
      displayProperties.cycle && issue.cycleId ? issue.cycleName : undefined;

   return (
      <ContextMenu>
         <ContextMenuTrigger asChild>
            <motion.div
               {...(layoutId && { layoutId: `issue-line-${issue.identifier}` })}
               className="w-full flex items-center justify-start h-11 px-6 hover:bg-sidebar/50"
            >
               <div className="flex items-center gap-0.5">
                  {displayProperties.priority && (
                     <PrioritySelector priority={issue.priority} issueId={issue.id} />
                  )}
                  {displayProperties.id && (
                     <span className="text-sm hidden sm:inline-block text-muted-foreground font-medium w-[66px] truncate shrink-0 mr-0.5">
                        {issue.identifier}
                     </span>
                  )}
                  {displayProperties.status && (
                     <StatusSelector status={issue.status} issueId={issue.id} />
                  )}
               </div>
               <Link
                  href={issuePath(orgId, issue.identifier)}
                  className="min-w-0 flex items-center justify-start mr-1 ml-0.5"
               >
                  <span className="text-xs sm:text-sm font-medium sm:font-semibold truncate">
                     {issue.title}
                  </span>
               </Link>
               <div className="flex items-center justify-end gap-2 ml-auto sm:w-fit">
                  <div className="w-3 shrink-0"></div>
                  <div className="-space-x-5 hover:space-x-1 lg:space-x-1 items-center justify-end hidden sm:flex duration-200 transition-all">
                     {displayProperties.labels && <LabelBadge label={issue.labels} />}
                     {displayProperties.project && issue.project && (
                        <ProjectBadge project={issue.project} />
                     )}
                  </div>
                  {cycleName && (
                     <span className="text-xs text-muted-foreground border border-border rounded-md px-1.5 py-0.5 shrink-0 hidden lg:inline-block">
                        {cycleName}
                     </span>
                  )}
                  {displayProperties.dueDate && issue.dueDate && (
                     <span className="text-xs text-orange-400 shrink-0 hidden sm:inline-block">
                        Due {formatDate(issue.dueDate, DateFormat.MONTH_DAY_PAD)}
                     </span>
                  )}
                  {displayProperties.created && (
                     <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline-block">
                        {formatDate(issue.createdAt, DateFormat.MONTH_DAY_PAD)}
                     </span>
                  )}
                  {displayProperties.assignee && (
                     <AssigneeUser user={issue.assignee} issueId={issue.id} />
                  )}
               </div>
            </motion.div>
         </ContextMenuTrigger>
         <IssueContextMenu issueId={issue.id} />
      </ContextMenu>
   );
}
