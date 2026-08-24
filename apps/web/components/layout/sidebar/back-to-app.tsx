'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { useTeams } from '@/hooks/use-teams';
import { DEFAULT_TEAM_KEY } from '@/lib/paths';

export function BackToApp() {
   const { orgId } = useParams<{ orgId: string }>();
   const { data: teams = [] } = useTeams(orgId);
   const teamKey = teams[0]?.key ?? DEFAULT_TEAM_KEY;

   return (
      <div className="w-full flex items-center justify-between gap-2">
         <Button className="w-fit" size="xs" variant="outline" asChild>
            <Link href={`/${orgId}/team/${teamKey}/all`}>
               <ChevronLeft className="size-4" />
               Back to app
            </Link>
         </Button>
         <ThemeToggle />
      </div>
   );
}
