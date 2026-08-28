import { InboxPath } from '@/constants/inbox.constant';
import { IssuePath } from '@/constants/issue.constant';
import { OrgPath } from '@/constants/org.constant';
import { ProjectPath } from '@/constants/project.constant';
import { TeamPath } from '@/constants/team.constant';
import { WorkspacePath } from '@/constants/workspace.constant';
import {
   Bot,
   GitPullRequestArrow,
   Inbox,
   FolderKanban,
   ContactRound,
   Box,
   Settings,
   Bell,
   KeyRound,
   Users,
   Tag,
   Layers,
   FileText,
   MessageSquare,
   Clock,
   Zap,
   UserRound,
} from 'lucide-react';

export const inboxItems = [
   {
      name: 'Inbox',
      url: InboxPath.INBOX,
      icon: Inbox,
   },
   {
      name: 'Reviews',
      url: WorkspacePath.REVIEWS,
      icon: GitPullRequestArrow,
   },
   {
      name: 'My issues',
      url: IssuePath.MY_ISSUES,
      icon: FolderKanban,
   },
];

/**
 * @deprecated AI agent is out of MVP scope (see docs/SCOPE.md). Kept for
 * reference; not rendered in the sidebar.
 */
export const deprecatedAgentNavItem = {
   name: 'Agent',
   url: WorkspacePath.AGENT,
   icon: Bot,
} as const;

export const workspaceItems = [
   {
      name: 'Teams',
      url: TeamPath.LIST,
      icon: ContactRound,
   },
   {
      name: 'Projects',
      url: ProjectPath.LIST,
      icon: Box,
   },
   {
      name: 'Members',
      url: OrgPath.MEMBERS,
      icon: UserRound,
   },
];

export const accountItems = [
   {
      name: 'Account',
      url: OrgPath.SETTINGS_ACCOUNT,
      icon: UserRound,
   },
   {
      name: 'Preferences',
      url: OrgPath.SETTINGS_PREFERENCES,
      icon: Settings,
   },
   {
      name: 'Profile',
      url: OrgPath.SETTINGS_PROFILE,
      icon: UserRound,
   },
   {
      name: 'Notifications',
      url: OrgPath.SETTINGS_NOTIFICATIONS,
      icon: Bell,
   },
   {
      name: 'Security & access',
      url: OrgPath.SETTINGS_SECURITY,
      icon: KeyRound,
   },
   {
      name: 'Connected accounts',
      url: OrgPath.SETTINGS_CONNECTED_ACCOUNTS,
      icon: Users,
   },
];

export const featuresItems = [
   {
      name: 'Labels',
      url: OrgPath.SETTINGS_LABELS,
      icon: Tag,
   },
   {
      name: 'Projects',
      url: OrgPath.SETTINGS_PROJECTS,
      icon: Box,
   },
   {
      name: 'Initiatives',
      url: OrgPath.SETTINGS_INITIATIVES,
      icon: Layers,
   },
   {
      name: 'Customer requests',
      url: OrgPath.SETTINGS_CUSTOMER_REQUESTS,
      icon: Inbox,
   },
   {
      name: 'Templates',
      url: OrgPath.SETTINGS_TEMPLATES,
      icon: FileText,
   },
   {
      name: 'Asks',
      url: OrgPath.SETTINGS_ASKS,
      icon: MessageSquare,
   },
   {
      name: 'SLAs',
      url: OrgPath.SETTINGS_SLAS,
      icon: Clock,
   },
   {
      name: 'Emojis',
      url: OrgPath.SETTINGS_EMOJIS,
      icon: MessageSquare,
   },
   {
      name: 'Integrations',
      url: OrgPath.SETTINGS_INTEGRATIONS,
      icon: Zap,
   },
];
