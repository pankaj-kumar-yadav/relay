'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthShell } from '@/components/common/auth/auth-shell';
import { BRAND_NAME } from '@/constants/brand.constant';
import { pickRandomSecurityTip } from '@/constants/security.constant';

/** Branded gate while session / home path resolve (/, /login, /register). */
export function AuthSessionLoading() {
   const [tip] = useState(pickRandomSecurityTip);

   return (
      <AuthShell>
         <div
            className="flex w-full max-w-sm flex-col items-center gap-4"
            role="status"
            aria-live="polite"
            aria-busy="true"
         >
            <div className="flex size-8 items-center justify-center rounded-md bg-foreground text-sm font-semibold text-background">
               {BRAND_NAME[0]}
            </div>
            <Loader2 className="text-muted-foreground size-5 animate-spin" aria-hidden />
            <p className="text-muted-foreground text-sm">Loading…</p>
            <div className="bg-card text-card-foreground mt-2 w-full rounded-xl border p-4 text-center shadow-sm">
               <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Security tip
               </p>
               <p className="text-foreground mt-1.5 text-sm leading-relaxed" suppressHydrationWarning>
                  {tip}
               </p>
            </div>
         </div>
      </AuthShell>
   );
}
