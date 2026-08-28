'use client';

import { IssueReactions } from '@/components/common/issues/details/issue-reactions';
import { issuePath, IssueStatusCategory } from '@/constants/issue.constant';
import { DEFAULT_TEAM_KEY, teamHomePath } from '@/constants/team.constant';
import { useIssue, useIssueMutations } from '@/hooks/use-issues';
import { getIssueDetail } from '@/mock-data/issue-details';
import { Issue } from '@/mock-data/issues';
import { useIssuesStore } from '@/store/issues-store';
import { Paperclip, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AssigneeUser } from '../assignee-user';
import { ActivityFeed } from './activity-feed';
import { IssuePropertiesPanel } from './issue-properties-panel';

/**
 * Issue detail page: Circle layout (title, description, reactions, sub-issues,
 * activity, properties sidebar) with API-backed issue fields.
 */
export default function IssueDetails() {
   const { orgId, issueId } = useParams<{ orgId: string; issueId: string }>();
   const updateIssue = useIssuesStore((s) => s.updateIssue);
   const { issues } = useIssuesStore();
   const { patchIssueFields } = useIssueMutations();
   const { data, isLoading } = useIssue(orgId, issueId);
   const [issue, setIssue] = useState<Issue | undefined>();

   useEffect(() => {
      if (data) setIssue(data);
   }, [data]);

   const detail = useMemo(() => (issue ? getIssueDetail(issue) : null), [issue]);

   const subIssues = (detail?.subIssueIds ?? [])
      .map((identifier) => issues.find((candidate) => candidate.identifier === identifier))
      .filter((candidate) => candidate !== undefined);

   if (isLoading) {
      return <div className="h-full" />;
   }

   if (!issue || !detail) {
      return (
         <div className="flex flex-col items-center justify-center h-full gap-2 text-sm text-muted-foreground">
            <p>Issue {issueId} not found.</p>
            <Link
               href={teamHomePath(orgId, issueId.split('-')[0] ?? DEFAULT_TEAM_KEY)}
               className="underline"
            >
               Back to issues
            </Link>
         </div>
      );
   }

   return (
      <div className="w-full h-full flex overflow-hidden">
         <div className="flex-1 min-w-0 h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto px-8 py-10">
               <textarea
                  aria-label="Issue title"
                  rows={1}
                  className="w-full bg-transparent text-3xl font-semibold leading-tight text-balance outline-none resize-none field-sizing-content"
                  value={issue.title}
                  onChange={(e) => {
                     const title = e.target.value;
                     setIssue({ ...issue, title });
                     updateIssue(issue.id, { title });
                  }}
                  onBlur={() => {
                     patchIssueFields(issue.id, { title: issue.title }, { title: issue.title });
                  }}
               />

               <textarea
                  aria-label="Issue description"
                  placeholder="Add description..."
                  className="mt-6 w-full bg-transparent text-[15px] leading-7 outline-none resize-none field-sizing-content min-h-7 placeholder:text-muted-foreground"
                  value={issue.description}
                  onChange={(e) => {
                     const description = e.target.value;
                     setIssue({ ...issue, description });
                     updateIssue(issue.id, { description });
                  }}
                  onBlur={() => {
                     patchIssueFields(
                        issue.id,
                        { description: issue.description },
                        { description: issue.description },
                     );
                  }}
               />

               <div className="flex items-center gap-3 mt-6 text-muted-foreground">
                  <IssueReactions orgSlug={orgId} issueId={issue.identifier} />
                  <button className="hover:text-foreground" aria-label="Attach file">
                     <Paperclip className="size-4" />
                  </button>
               </div>

               <div className="mt-8">
                  {subIssues.length > 0 ? (
                     <>
                        <h2 className="text-sm font-medium mb-1">
                           Sub-issues{' '}
                           <span className="text-muted-foreground">
                              {
                                 subIssues.filter(
                                    (subIssue) =>
                                       subIssue.status.category === IssueStatusCategory.COMPLETED,
                                 ).length
                              }
                              /{subIssues.length}
                           </span>
                        </h2>
                        <div className="flex flex-col border-t border-border/50">
                           {subIssues.map((subIssue) => (
                              <Link
                                 key={subIssue.id}
                                 href={issuePath(orgId, subIssue.identifier)}
                                 className="flex items-center gap-2.5 h-10 px-1 border-b border-border/50 hover:bg-sidebar/50 text-sm min-w-0"
                              >
                                 <subIssue.status.icon />
                                 <span className="text-muted-foreground shrink-0 text-xs font-medium">
                                    {subIssue.identifier}
                                 </span>
                                 <span className="truncate font-medium">{subIssue.title}</span>
                                 <span className="ml-auto shrink-0">
                                    <AssigneeUser user={subIssue.assignee} />
                                 </span>
                              </Link>
                           ))}
                        </div>
                     </>
                  ) : (
                     <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                        <Plus className="size-4" />
                        Add sub-issues
                     </button>
                  )}
               </div>

               <ActivityFeed orgSlug={orgId} issueId={issue.identifier} />
            </div>
         </div>

         <aside className="hidden lg:block w-80 shrink-0 border-l h-full overflow-y-auto bg-container px-5 py-6">
            <IssuePropertiesPanel issue={issue} detail={detail} />
         </aside>
      </div>
   );
}
