'use client';

import {
   SidebarGroup,
   SidebarGroupLabel,
   SidebarMenu,
   SidebarMenuButton,
   SidebarMenuItem,
} from '@/components/ui/sidebar';
import { KeyRound, LucideIcon, Settings, Tag, UserRound } from 'lucide-react';
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
         // { name: 'Notifications', url: OrgPath.SETTINGS_NOTIFICATIONS, icon: Bell }, — out of v1; restore later
         // { name: 'Code & reviews', url: OrgPath.SETTINGS_CODE_AND_REVIEWS, icon: Code }, — out of v1; restore later
         { name: 'Security & access', url: OrgPath.SETTINGS_SECURITY, icon: KeyRound },
         // { name: 'Connected accounts', url: OrgPath.SETTINGS_CONNECTED_ACCOUNTS, icon: Users }, — out of v1; restore later
         // { name: 'Agent personalization', url: OrgPath.SETTINGS_AGENT_PERSONALIZATION, icon: Bot }, — out of v1; restore later
      ],
   },
   {
      label: 'Issues',
      items: [
         { name: 'Labels', url: OrgPath.SETTINGS_ISSUE_LABELS, icon: Tag },
         // { name: 'Templates', url: OrgPath.SETTINGS_ISSUE_TEMPLATES, icon: FileText }, — out of v1; restore later
         // { name: 'SLAs', url: OrgPath.SETTINGS_SLAS, icon: Flame }, — out of v1; restore later
      ],
   },
   // Projects — out of v1; restore later
   // {
   //    label: 'Projects',
   //    items: [
   //       { name: 'Templates', url: OrgPath.SETTINGS_PROJECT_TEMPLATES, icon: FileText },
   //       { name: 'Statuses', url: OrgPath.SETTINGS_PROJECT_STATUSES, icon: Target },
   //       { name: 'Updates', url: OrgPath.SETTINGS_PROJECT_UPDATES, icon: Zap },
   //    ],
   // },
   // Features — out of v1; restore later
   // {
   //    label: 'Features',
   //    items: [
   //       { name: 'AI & Agents', url: OrgPath.SETTINGS_AI, icon: Sparkles },
   //       { name: 'Initiatives', url: OrgPath.SETTINGS_INITIATIVES, icon: Compass },
   //       { name: 'Documents', url: OrgPath.SETTINGS_DOCUMENTS, icon: FileText },
   //       { name: 'Customer requests', url: OrgPath.SETTINGS_CUSTOMER_REQUESTS, icon: HeartHandshake },
   //       { name: 'Releases', url: OrgPath.SETTINGS_RELEASES, icon: Rocket },
   //       { name: 'Pulse', url: OrgPath.SETTINGS_PULSE, icon: Zap },
   //       { name: 'Asks', url: OrgPath.SETTINGS_ASKS, icon: MessageCircleQuestion },
   //       { name: 'Emojis', url: OrgPath.SETTINGS_EMOJIS, icon: Smile },
   //       { name: 'Integrations', url: OrgPath.SETTINGS_INTEGRATIONS, icon: Blocks },
   //    ],
   // },
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
