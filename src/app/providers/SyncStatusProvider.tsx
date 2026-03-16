import { useEffect, type PropsWithChildren } from 'react';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';

export const SyncStatusProvider = ({ children }: PropsWithChildren) => {
  const processQueue = useSyncQueueStore((state) => state.processQueue);

  useEffect(() => {
    const handleOffline = () => {
      // Logic handled within store if needed, but we can set explicit state here
    };

    const handleOnline = () => {
      processQueue();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [processQueue]);

  return children;
};
