'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppRoute } from '@/constants/auth.constant';
import { useSession } from '@/hooks/use-session';
import { useResolveHomePath } from '@/hooks/use-orgs';

export default function Home() {
  const router = useRouter();
  const { data: user, isFetched, isError } = useSession();
  const { mutateAsync: resolveHomePath } = useResolveHomePath();

  useEffect(() => {
    if (!isFetched || isError) return;
    if (!user) {
      router.replace(AppRoute.LOGIN);
      return;
    }
    let cancelled = false;
    resolveHomePath()
      .then((path) => {
        if (!cancelled) router.replace(path);
      })
      .catch(() => {
        if (!cancelled) router.replace(AppRoute.LOGIN);
      });
    return () => {
      cancelled = true;
    };
  }, [isFetched, isError, user, router, resolveHomePath]);

  return <div className="min-h-svh bg-background" />;
}
