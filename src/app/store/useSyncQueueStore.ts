import { create } from 'zustand';

export type SyncStatus = 'saved' | 'pending' | 'reconnecting';

interface SyncQueueState {
  status: SyncStatus;
  lastSavedAt: string;
  markPending: () => void;
  markReconnecting: () => void;
  markSaved: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useSyncQueueStore = create<SyncQueueState>((set) => ({
  status: 'saved',
  lastSavedAt: new Date().toISOString(),
  markPending: () => {
    set({ status: 'pending' });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      set({ status: 'saved', lastSavedAt: new Date().toISOString() });
    }, 500);
  },
  markReconnecting: () => set({ status: 'reconnecting' }),
  markSaved: () => set({ status: 'saved', lastSavedAt: new Date().toISOString() })
}));
