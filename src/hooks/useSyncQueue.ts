import { useEffect, useState, useCallback } from 'react';
import { db } from '../store/db';

export function useSyncQueue() {
  const [isSyncing, setIsSyncing] = useState(false);

  const processQueue = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;

    try {
      setIsSyncing(true);
      
      // Get all pending items
      const pendingItems = await db.syncQueue
        .where('status')
        .equals('PENDING')
        .toArray();

      if (pendingItems.length === 0) {
        setIsSyncing(false);
        return;
      }

      console.log(`[Sync] Found ${pendingItems.length} items to sync.`);

      for (const item of pendingItems) {
        try {
          // Mark as syncing
          await db.syncQueue.update(item.id, { status: 'SYNCING' });

          // --- MOCK API CALL ---
          // In a real app, this would be a fetch() or Firebase call
          console.log(`[Sync] Uploading item ${item.id} of type ${item.type}...`);
          await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
          
          // Randomly fail 10% of the time to demonstrate retry logic
          if (Math.random() < 0.1) {
            throw new Error('Simulated network error during sync');
          }
          // --- END MOCK API CALL ---

          // If successful, delete from queue or mark as synced
          await db.syncQueue.delete(item.id);
          console.log(`[Sync] Successfully synced item ${item.id}`);
          
        } catch (error: any) {
          console.error(`[Sync] Failed to sync item ${item.id}:`, error);
          
          // Revert to pending and increment retry count
          await db.syncQueue.update(item.id, { 
            status: 'PENDING',
            retryCount: item.retryCount + 1,
            errorReason: error.message || 'Unknown error'
          });
        }
      }
    } catch (error) {
      console.error('[Sync] Fatal error processing queue:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Listen for online events to trigger sync
  useEffect(() => {
    window.addEventListener('online', processQueue);
    return () => window.removeEventListener('online', processQueue);
  }, [processQueue]);

  // Also try to sync periodically if online
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine) {
        processQueue();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [processQueue]);

  return { isSyncing, forceSync: processQueue };
}
