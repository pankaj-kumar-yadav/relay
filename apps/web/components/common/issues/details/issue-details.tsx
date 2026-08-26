'use client';

import { useIssue, useIssueMutations } from '@/hooks/use-issues';
import { useIssuesStore } from '@/store/issues-store';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IssuePropertiesPanel } from './issue-properties-panel';
import { Issue } from '@/mock-data/issues';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DEFAULT_TEAM_KEY, teamHomePath } from '@/constants/team.constant';

export default function IssueDetails() {
   const { orgId, issueId } = useParams<{ orgId: string; issueId: string }>();
   const updateIssue = useIssuesStore((s) => s.updateIssue);
   const { patchIssueFields } = useIssueMutations();
   const { data, isLoading } = useIssue(orgId, issueId);
   const [issue, setIssue] = useState<Issue | undefined>();

   useEffect(() => {
      if (data) setIssue(data);
   }, [data]);

   if (isLoading) {
      return <div className="h-full" />;
   }

   if (!issue) {
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
            <div className="max-w-3xl mx-auto px-8 py-10 flex flex-col gap-4">
               <p className="text-sm text-muted-foreground font-medium">{issue.identifier}</p>
               <Input
                  className="border-none shadow-none text-3xl font-semibold px-0 h-auto focus-visible:ring-0"
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
               <Textarea
                  className="border-none shadow-none min-h-40 px-0 resize-none focus-visible:ring-0"
                  placeholder="Add description..."
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
            </div>
         </div>
         <aside className="hidden lg:block w-80 shrink-0 border-l h-full overflow-y-auto bg-container px-5 py-6">
            <IssuePropertiesPanel issue={issue} />
         </aside>
      </div>
   );
}
