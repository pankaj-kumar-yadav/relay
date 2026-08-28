'use client';

import { TeamEmojiButton } from '@/components/common/teams/team-icon-picker';
import { issuePath } from '@/constants/issue.constant';
import { teamOverviewPath } from '@/constants/team.constant';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useTeams } from '@/hooks/use-teams';
import { useIssuesStore } from '@/store/issues-store';
import { ChevronDown, ChevronRight, ChevronUp, MoreHorizontal, Star } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

/**
 * Issue page header: breadcrumb (team › identifier + title) and
 * previous / next navigation across the issue list.
 */
export default function HeaderNav() {
   const { orgId, issueId } = useParams<{ orgId: string; issueId: string }>();
   const { issues } = useIssuesStore();
   const { data: teams = [] } = useTeams(orgId);
   const teamKey = issueId.split('-')[0] ?? '';
   const team = teams.find((candidate) => candidate.key === teamKey);

   const index = issues.findIndex((candidate) => candidate.identifier === issueId);
   const issue = index >= 0 ? issues[index] : undefined;

   const previousIssue = index > 0 ? issues[index - 1] : undefined;
   const nextIssue = index >= 0 && index < issues.length - 1 ? issues[index + 1] : undefined;

   return (
      <div className="w-full flex justify-between items-center border-b py-1.5 px-6 h-10 gap-4">
         <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger />
            <div className="flex items-center gap-1.5 shrink-0">
               {team ? (
                  <TeamEmojiButton
                     teamId={team.id}
                     icon={team.icon}
                     teamKey={team.key}
                     className="size-5 text-xs"
                  />
               ) : null}
               <Link
                  href={teamOverviewPath(orgId, team?.key ?? teamKey)}
                  className="hover:opacity-80"
               >
                  <span className="text-sm font-medium hidden md:inline">
                     {team?.name ?? teamKey}
                  </span>
               </Link>
            </div>
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
            {issue && (
               <span className="text-sm min-w-0 truncate">
                  <span className="font-medium text-muted-foreground mr-1.5">
                     {issue.identifier}
                  </span>
                  <span className="font-medium">{issue.title}</span>
               </span>
            )}
            <Star className="size-3.5 text-muted-foreground shrink-0" />
            <MoreHorizontal className="size-3.5 text-muted-foreground shrink-0" />
         </div>

         <div className="flex items-center gap-1 shrink-0">
            {index >= 0 && (
               <span className="text-xs text-muted-foreground mr-1">
                  {index + 1} / {issues.length}
               </span>
            )}
            <Button
               variant="ghost"
               size="icon"
               className="size-6"
               disabled={!previousIssue}
               asChild={!!previousIssue}
            >
               {previousIssue ? (
                  <Link
                     href={issuePath(orgId, previousIssue.identifier)}
                     aria-label="Previous issue"
                  >
                     <ChevronUp className="size-4" />
                  </Link>
               ) : (
                  <ChevronUp className="size-4" />
               )}
            </Button>
            <Button
               variant="ghost"
               size="icon"
               className="size-6"
               disabled={!nextIssue}
               asChild={!!nextIssue}
            >
               {nextIssue ? (
                  <Link href={issuePath(orgId, nextIssue.identifier)} aria-label="Next issue">
                     <ChevronDown className="size-4" />
                  </Link>
               ) : (
                  <ChevronDown className="size-4" />
               )}
            </Button>
         </div>
      </div>
   );
}
