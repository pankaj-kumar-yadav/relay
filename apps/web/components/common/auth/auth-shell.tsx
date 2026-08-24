import type { ReactNode } from 'react';
import { AUTH_FOOTER_LINKS } from '@/constants/auth.constant';

const NOISE_DATA_URI =
   "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'%3E%3Cfilter id='n' x='0' y='0'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")";

export function AuthShell({ children }: { children: ReactNode }) {
   return (
      <div className="bg-muted/50 relative flex min-h-svh flex-col">
         <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.45] mix-blend-multiply dark:opacity-[0.18] dark:mix-blend-overlay"
            style={{ backgroundImage: NOISE_DATA_URI }}
         />
         <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-16">
            {children}
         </div>
         <footer className="relative flex items-center justify-center gap-6 pb-6">
            {AUTH_FOOTER_LINKS.map((link) => (
               <a
                  key={link.label}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground text-xs transition-colors"
               >
                  {link.label}
               </a>
            ))}
         </footer>
      </div>
   );
}
