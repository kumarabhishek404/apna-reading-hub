import { useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { getStoredSession } from '@/lib/auth';

export default function IndexPage() {
  useEffect(() => {
    let isMounted = true;

    async function resolveRoute() {
      const session = await getStoredSession();
      if (!isMounted) return;
      router.replace((session ? '/(tabs)/home' : '/login') as any);
    }

    resolveRoute();
    return () => {
      isMounted = false;
    };
  }, []);

  return <Redirect href={'/login' as any} />;
}
