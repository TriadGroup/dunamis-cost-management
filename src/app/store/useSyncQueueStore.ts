import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { isSupabaseConfigured, supabase, supabaseAnonKey, supabaseUrl } from '@/shared/api/supabase';
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
  failedTasks: SyncTask[];
  
  // Actions
  enqueue: (task: Omit<SyncTask, 'id' | 'timestamp' | 'retries'>) => void;
  processQueue: () => Promise<void>;
  retryFailed: () => Promise<void>;
  flushQueueOnPageHide: () => void;
}

const TABLE_NAME_ALIASES: Record<string, string> = {
  crops: 'cultures',
  labor_records: 'labor_entries',
  equipment_usage_records: 'equipment_usage',
  cost_allocation_ledger: 'cost_allocation_entries'
};

const normalizeTableName = (table: string) => TABLE_NAME_ALIASES[table] ?? table;

const isDuplicateInsertError = (error: unknown) => {
  const code = typeof error === 'object' && error !== null ? String((error as { code?: string }).code ?? '') : '';
  const message =
    typeof error === 'object' && error !== null ? String((error as { message?: string }).message ?? '') : '';

  return code === '23505' || /duplicate key/i.test(message);
};

const isMissingTableError = (error: unknown) => {
  const code = typeof error === 'object' && error !== null ? String((error as { code?: string }).code ?? '') : '';
  const message =
    typeof error === 'object' && error !== null ? String((error as { message?: string }).message ?? '') : '';

  return code === 'PGRST205' || /could not find the table/i.test(message) || /relation .* does not exist/i.test(message);
};

const isTransientError = (error: unknown) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  if (error instanceof TypeError) return true;

  const message =
    typeof error === 'object' && error !== null ? String((error as { message?: string }).message ?? '') : String(error ?? '');

  return /failed to fetch|network|load failed|timed out/i.test(message);
};

const encodeFilterValue = (value: string) => encodeURIComponent(value);

const fireAndForgetTask = (task: SyncTask) => {
  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) return;

  const table = normalizeTableName(task.table);
  const headers: Record<string, string> = {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal,resolution=merge-duplicates'
  };

  if (task.action === 'INSERT') {
    void fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=id`, {
      method: 'POST',
      headers,
      body: JSON.stringify(task.payload),
      keepalive: true
    }).catch(() => undefined);
    return;
  }

  const id = String(task.payload?.id ?? '');
  if (!id) return;
  const url = `${supabaseUrl}/rest/v1/${table}?id=eq.${encodeFilterValue(id)}`;

  if (task.action === 'UPDATE') {
    void fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(task.payload),
      keepalive: true
    }).catch(() => undefined);
    return;
  }

  void fetch(url, {
    method: 'DELETE',
    headers,
    keepalive: true
  }).catch(() => undefined);
};

export const useSyncQueueStore = create<SyncQueueState>()(
  persist(
    (set, get) => ({
      status: 'saved',
      lastSyncedAt: null,
      queue: [],
      failedTasks: [],

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
          ...data,
          table: normalizeTableName(data.table)
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
        if (queue.length === 0 || status === 'offline' || !isSupabaseConfigured) return;

        set({ status: 'pending' });

        for (const task of [...queue]) {
          try {
            let error;
            const table = normalizeTableName(task.table);
            if (task.action === 'INSERT') {
              ({ error } = await supabase.from(table).insert(task.payload));
            } else if (task.action === 'UPDATE') {
              ({ error } = await supabase.from(table).update(task.payload).match({ id: task.payload.id }));
            } else if (task.action === 'DELETE') {
              ({ error } = await supabase.from(table).delete().match({ id: task.payload.id }));
            }

            if (error) {
              if (task.action === 'INSERT' && isDuplicateInsertError(error)) {
                set((state) => ({
                  queue: state.queue.filter((entry) => entry.id !== task.id),
                  lastSyncedAt: new Date().toISOString()
                }));
                continue;
              }

              if (isMissingTableError(error)) {
                console.warn('Sync skipped because table is missing on Supabase:', task.table, error);
                set((state) => ({
                  queue: state.queue.filter((entry) => entry.id !== task.id),
                  failedTasks: [...state.failedTasks, { ...task, retries: task.retries + 1 }],
                  status: state.queue.length <= 1 ? 'saved' : state.status
                }));
                continue;
              }

              throw error;
            }

            // Success: Remove from queue
            set((state) => ({
              queue: state.queue.filter((t) => t.id !== task.id),
              lastSyncedAt: new Date().toISOString()
            }));
          } catch (err) {
            console.error('Sync failed for task:', task.id, err);

            if (isTransientError(err)) {
              set((state) => ({
                queue: state.queue.map((entry) =>
                  entry.id === task.id ? { ...entry, retries: entry.retries + 1 } : entry
                ),
                status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'error'
              }));
              break;
            }

            // Increment retries
            set((state) => ({
              queue: state.queue.filter((entry) => entry.id !== task.id),
              failedTasks: [...state.failedTasks, { ...task, retries: task.retries + 1 }],
              status: state.queue.length <= 1 ? 'saved' : state.status
            }));
          }
        }

        if (get().queue.length === 0) {
          set({ status: 'saved' });
        }
      },

      retryFailed: async () => {
        await get().processQueue();
      },

      flushQueueOnPageHide: () => {
        const { queue, status } = get();
        if (queue.length === 0 || status === 'offline') return;

        queue.forEach(fireAndForgetTask);
      }
    }),
    {
      name: 'dunamis-sync-queue',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
