'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/use-session';
import { useResolveHomePath } from '@/hooks/use-orgs';

export default function Home() {
  const router = useRouter();
  const { data: user, isFetched, isError } = useSession();
  const { mutateAsync: resolveHomePath } = useResolveHomePath();

  useEffect(() => {
    if (!isFetched) return;
    if (!user || isError) {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    resolveHomePath()
      .then((path) => {
        if (!cancelled) router.replace(path);
      })
      .catch(() => {
        if (!cancelled) router.replace('/login');
      });
    return () => {
      cancelled = true;
    };
  }, [isFetched, isError, user, router, resolveHomePath]);

  return <div className="min-h-svh bg-background" />;
}
