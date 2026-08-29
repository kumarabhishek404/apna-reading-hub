import { useCallback, useRef } from 'react';

/**
 * Ignore a second tap while a picker, mic session, or save is still running.
 * This is what made camera/file/mic open one-by-one after a delay.
 */
export function useActionGate() {
  const busy = useRef(false);

  return useCallback(async (fn: () => void | Promise<void>) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await fn();
    } finally {
      busy.current = false;
    }
  }, []);
}
