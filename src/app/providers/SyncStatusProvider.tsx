import { useEffect, type PropsWithChildren } from 'react';
import { useSyncQueueStore } from '@/app/store';

export const SyncStatusProvider = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    const handleOffline = () => {
      useSyncQueueStore.getState().markReconnecting();
    };

    const handleOnline = () => {
      useSyncQueueStore.getState().markSaved();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return children;
};
