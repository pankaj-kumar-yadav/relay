'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/dummy-auth';

const APP_HOME = '/lndev-ui/team/CORE/all';

export default function Home() {
   const router = useRouter();

   useEffect(() => {
      router.replace(isLoggedIn() ? APP_HOME : '/login');
   }, [router]);

   return <div className="min-h-svh bg-background" />;
}
