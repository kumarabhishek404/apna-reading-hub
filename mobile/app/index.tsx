import { useEffect, useState } from 'react';
import { Redirect, router } from 'expo-router';
import { getStoredSession } from '@/lib/auth';

export default function IndexPage() {
  const [isReady, setIsReady] = useState(false);
  const [sessionExists, setSessionExists] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function resolveRoute() {
      const session = await getStoredSession();
      if (!isMounted) return;

      setSessionExists(Boolean(session));
      setIsReady(true);
    }

    resolveRoute();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isReady) {
    return null;
  }

  return <Redirect href={sessionExists ? '/capture' : '/login'} />;
}
