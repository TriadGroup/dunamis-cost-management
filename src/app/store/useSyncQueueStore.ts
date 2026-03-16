import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/shared/api/supabase';
import { useSetupStore } from '@/app/store/useSetupStore';

export type SyncStatus = 'saved' | 'pending' | 'error' | 'offline';

export interface SyncTask {
  id: string;
  table: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: any;
  timestamp: string;
  retries: number;
}

interface SyncQueueState {
  status: SyncStatus;
  lastSyncedAt: string | null;
  queue: SyncTask[];
  
  // Actions
  enqueue: (task: Omit<SyncTask, 'id' | 'timestamp' | 'retries'>) => void;
  processQueue: () => Promise<void>;
  retryFailed: () => Promise<void>;
}

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      status: 'saved',
      lastSyncedAt: null,
      queue: [],

      enqueue: (data) => {
        // Phase 8: Demo Isolation
        // If in demo mode, we should NOT sync to production Supabase
        const isDemo = useSetupStore.getState().isDemo;
        if (isDemo) {
          set({ status: 'saved' });
          return;
        }

        const newTask: SyncTask = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          retries: 0,
          ...data
        };
        
        set((state) => ({
          queue: [...state.queue, newTask],
          status: 'pending'
        }));

        // Start processing
        get().processQueue();
      },

      processQueue: async () => {
        const { queue, status } = get();
        if (queue.length === 0 || status === 'offline') return;

        set({ status: 'pending' });

        for (const task of queue) {
          try {
            let error;
            if (task.action === 'INSERT') {
              ({ error } = await supabase.from(task.table).insert(task.payload));
            } else if (task.action === 'UPDATE') {
              ({ error } = await supabase.from(task.table).update(task.payload).match({ id: task.payload.id }));
            } else if (task.action === 'DELETE') {
              ({ error } = await supabase.from(task.table).delete().match({ id: task.payload.id }));
            }

            if (error) throw error;

            // Success: Remove from queue
            set((state) => ({
              queue: state.queue.filter((t) => t.id !== task.id),
              lastSyncedAt: new Date().toISOString()
            }));
          } catch (err) {
            console.error('Sync failed for task:', task.id, err);
            // Increment retries
            set((state) => ({
              queue: state.queue.map((t) => t.id === task.id ? { ...t, retries: t.retries + 1 } : t),
              status: 'error'
            }));
            break; // Stop processing and wait for retry
          }
        }

        if (get().queue.length === 0) {
          set({ status: 'saved' });
        }
      },

      retryFailed: async () => {
        await get().processQueue();
      }
    }),
    {
      name: 'dunamis-sync-queue',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
