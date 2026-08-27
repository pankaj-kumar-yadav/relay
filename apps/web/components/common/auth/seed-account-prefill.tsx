'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrgRole } from '@/constants/org.constant';
import {
   SEED_ACCOUNTS,
   SEED_ORGS,
   SeedAccountRoleLabel,
   type SeedAccountRole,
} from '@/constants/seed.constant';

type SeedAccount = (typeof SEED_ACCOUNTS)[number];

const ROLE_SECTIONS: SeedAccountRole[] = ['super-admin', OrgRole.ADMIN, OrgRole.EMPLOYEE];

export function SeedAccountPrefill({
   selectedEmail,
   onSelect,
}: {
   selectedEmail: string;
   onSelect: (account: SeedAccount) => void;
}) {
   const [open, setOpen] = useState(false);
   const selected = SEED_ACCOUNTS.find((account) => account.email === selectedEmail);
   const selectedOrg = SEED_ORGS.find((org) => org.slug === selected?.org);
   const defaultTab = selected?.org ?? SEED_ORGS[0].slug;

   const accountsByOrg = useMemo(() => {
      return SEED_ORGS.map((org) => {
         const accounts = SEED_ACCOUNTS.filter((account) => account.org === org.slug);
         return {
            ...org,
            sections: ROLE_SECTIONS.flatMap((role) => {
               const roleAccounts = accounts.filter((account) => account.role === role);
               if (roleAccounts.length === 0) return [];
               return [{ role, label: SeedAccountRoleLabel[role], accounts: roleAccounts }];
            }),
         };
      });
   }, []);

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger asChild>
            <Button
               type="button"
               variant="outline"
               className="text-muted-foreground h-8 w-full justify-between px-3 text-xs font-normal shadow-xs"
            >
               <span className="truncate">
                  {selected
                     ? `${selected.name} · ${selectedOrg?.name ?? selected.org}`
                     : 'Prefill a seed account'}
               </span>
               <ChevronDown className="size-4 opacity-50" />
            </Button>
         </PopoverTrigger>
         <PopoverContent align="start" className="w-80 p-2">
            <Tabs key={defaultTab} defaultValue={defaultTab} className="gap-2">
               <TabsList className="h-8 w-full">
                  {SEED_ORGS.map((org) => (
                     <TabsTrigger key={org.slug} value={org.slug} className="flex-1 text-xs">
                        {org.name}
                     </TabsTrigger>
                  ))}
               </TabsList>
               {accountsByOrg.map((org) => (
                  <TabsContent key={org.slug} value={org.slug} className="flex flex-col gap-2">
                     {org.sections.map((section) => (
                        <div key={section.role} className="flex flex-col gap-0.5">
                           <p className="text-muted-foreground px-2 pt-1 text-[10px] font-medium tracking-wide uppercase">
                              {section.label}
                           </p>
                           {section.accounts.map((account) => (
                              <button
                                 key={account.email}
                                 type="button"
                                 className="hover:bg-accent hover:text-accent-foreground rounded-sm px-2 py-1.5 text-left"
                                 onClick={() => {
                                    onSelect(account);
                                    setOpen(false);
                                 }}
                              >
                                 <span className="block text-sm">{account.name}</span>
                                 <span className="text-muted-foreground block truncate text-xs">
                                    {account.email}
                                 </span>
                              </button>
                           ))}
                        </div>
                     ))}
                  </TabsContent>
               ))}
            </Tabs>
         </PopoverContent>
      </Popover>
   );
}
