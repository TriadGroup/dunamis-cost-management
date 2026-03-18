import { useEffect, type PropsWithChildren } from 'react';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import {
  persistWorkspaceBackup,
  subscribeWorkspaceBackup
} from '@/app/store/workspaceBackup';

export const WorkspacePersistenceProvider = ({ children }: PropsWithChildren) => {
  const processQueue = useSyncQueueStore((state) => state.processQueue);
  const flushQueueOnPageHide = useSyncQueueStore((state) => state.flushQueueOnPageHide);

  useEffect(() => {
    const unsubscribe = subscribeWorkspaceBackup();

    const persistNow = () => {
      persistWorkspaceBackup();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistNow();
        flushQueueOnPageHide();
        return;
      }

      processQueue();
    };

    const handlePageHide = () => {
      persistNow();
      flushQueueOnPageHide();
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', persistNow);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      unsubscribe();
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', persistNow);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushQueueOnPageHide, processQueue]);

  return children;
};
