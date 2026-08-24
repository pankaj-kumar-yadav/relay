'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';

const APP_HOME = '/lndev-ui/team/CORE/all';

export default function Home() {
   const router = useRouter();

   useEffect(() => {
      let cancelled = false;
      getSession()
         .then((user) => {
            if (cancelled) return;
            router.replace(user ? APP_HOME : '/login');
         })
         .catch(() => {
            if (!cancelled) router.replace('/login');
         });
      return () => {
         cancelled = true;
      };
   }, [router]);

   return <div className="min-h-svh bg-background" />;
}
