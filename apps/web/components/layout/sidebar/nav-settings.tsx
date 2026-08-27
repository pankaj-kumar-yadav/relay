'use client';

import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
   Bell,
   Blocks,
   Bot,
   Code,
   Compass,
   FileText,
   Flame,
   HeartHandshake,
   KeyRound,
   LucideIcon,
   MessageCircleQuestion,
   Rocket,
   Settings,
   Smile,
   Sparkles,
   Tag,
   Target,
   UserRound,
   Users,
   Zap,
} from 'lucide-react';
import { OrgPath, orgPath } from '@/constants/org.constant';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';

interface SettingsNavItem {
   name: string;
   /** Path under /{orgId}. */
   url: string;
   icon: LucideIcon;
}

interface SettingsNavGroup {
   label: string;
   items: SettingsNavItem[];
}

/** Linear-style settings navigation. */
export const settingsNav: SettingsNavGroup[] = [
   {
      label: 'Personal',
      items: [
         { name: 'Preferences', url: OrgPath.SETTINGS_PREFERENCES, icon: Settings },
         { name: 'Profile', url: OrgPath.SETTINGS_PROFILE, icon: UserRound },
         { name: 'Notifications', url: OrgPath.SETTINGS_NOTIFICATIONS, icon: Bell },
         { name: 'Code & reviews', url: OrgPath.SETTINGS_CODE_AND_REVIEWS, icon: Code },
         { name: 'Security & access', url: OrgPath.SETTINGS_SECURITY, icon: KeyRound },
         { name: 'Connected accounts', url: OrgPath.SETTINGS_CONNECTED_ACCOUNTS, icon: Users },
         { name: 'Agent personalization', url: OrgPath.SETTINGS_AGENT_PERSONALIZATION, icon: Bot },
      ],
   },
   {
      label: 'Issues',
      items: [
         { name: 'Labels', url: OrgPath.SETTINGS_ISSUE_LABELS, icon: Tag },
         { name: 'Templates', url: OrgPath.SETTINGS_ISSUE_TEMPLATES, icon: FileText },
         { name: 'SLAs', url: OrgPath.SETTINGS_SLAS, icon: Flame },
      ],
   },
   {
      label: 'Projects',
      items: [
         // { name: 'Labels', url: OrgPath.SETTINGS_PROJECT_LABELS, icon: Tag }, — out of v1; restore later
         { name: 'Templates', url: OrgPath.SETTINGS_PROJECT_TEMPLATES, icon: FileText },
         { name: 'Statuses', url: OrgPath.SETTINGS_PROJECT_STATUSES, icon: Target },
         { name: 'Updates', url: OrgPath.SETTINGS_PROJECT_UPDATES, icon: Zap },
      ],
   },
   {
      label: 'Features',
      items: [
         { name: 'AI & Agents', url: OrgPath.SETTINGS_AI, icon: Sparkles },
         { name: 'Initiatives', url: OrgPath.SETTINGS_INITIATIVES, icon: Compass },
         { name: 'Documents', url: OrgPath.SETTINGS_DOCUMENTS, icon: FileText },
         { name: 'Customer requests', url: OrgPath.SETTINGS_CUSTOMER_REQUESTS, icon: HeartHandshake },
         { name: 'Releases', url: OrgPath.SETTINGS_RELEASES, icon: Rocket },
         { name: 'Pulse', url: OrgPath.SETTINGS_PULSE, icon: Zap },
         { name: 'Asks', url: OrgPath.SETTINGS_ASKS, icon: MessageCircleQuestion },
         { name: 'Emojis', url: OrgPath.SETTINGS_EMOJIS, icon: Smile },
         { name: 'Integrations', url: OrgPath.SETTINGS_INTEGRATIONS, icon: Blocks },
      ],
   },
];

export function NavSettings() {
   const { orgId } = useParams<{ orgId: string }>();
   const pathname = usePathname();

   return (
      <>
         {settingsNav.map((group) => (
            <SidebarGroup key={group.label} className="group-data-[collapsible=icon]:hidden">
               <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
               <SidebarMenu>
                  {group.items.map((item) => {
                     const href = orgPath(orgId, item.url);
                     const isActive = pathname === href;
                     return (
                        <SidebarMenuItem key={`${group.label}-${item.name}`}>
                           <SidebarMenuButton asChild isActive={isActive}>
                              <Link href={href}>
                                 <item.icon className="size-4" />
                                 <span>{item.name}</span>
                              </Link>
                           </SidebarMenuButton>
                        </SidebarMenuItem>
                     );
                  })}
               </SidebarMenu>
            </SidebarGroup>
         ))}
      </>
   );
}
