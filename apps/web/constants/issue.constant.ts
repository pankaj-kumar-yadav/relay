import { orgPath } from '@/constants/org.constant';

export {
   IssueStatus,
   IssuePriority,
   IssueStatusCategory,
   DEFAULT_ISSUE_STATUS,
   DEFAULT_ISSUE_PRIORITY,
   ISSUE_STATUS_CATEGORY,
   isIssueStatus,
   isIssuePriority,
   statusesForCategories,
   type IssueStatusValue,
   type IssuePriorityValue,
   type IssueStatusCategoryValue,
} from '@relay/shared/constants/issue.constant';

export const IssuePath = {
   MY_ISSUES: '/my-issues',
} as const;

/** Matches `/{orgSlug}/issue/{identifier}` and captures the identifier. */
export const ISSUE_PATHNAME_PATTERN = /^\/[^/]+\/issue\/([^/]+)/;

export function issuePath(orgSlug: string, identifier: string): string {
   return orgPath(orgSlug, `/issue/${identifier}`);
}

export function myIssuesPath(orgSlug: string): string {
   return orgPath(orgSlug, IssuePath.MY_ISSUES);
}
