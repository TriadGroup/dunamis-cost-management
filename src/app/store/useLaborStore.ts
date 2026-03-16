import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { LaborRecord } from '@/entities';

interface LaborState {
  records: LaborRecord[];
  addRecord: (item?: Partial<LaborRecord>) => string;
  updateRecord: (id: string, patch: Partial<LaborRecord>) => void;
  removeRecord: (id: string) => void;
}

const defaultRecord = (): LaborRecord => ({
  id: createId(),
  date: new Date().toISOString().slice(0, 10),
  teamName: 'Equipe campo',
  taskName: 'Tarefa',
  cropId: null,
  cropPlanId: null,
  productionLotId: null,
  areaNodeIds: [],
  hoursWorked: 0,
  hourlyCostCents: 0,
  totalCostCents: 0,
  notes: ''
});

export const useLaborStore = create<LaborState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (item) => {
        const next = { ...defaultRecord(), ...item, id: createId() };
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { records: [...state.records, next] };
        });
        return next.id;
      },
      updateRecord: (id, patch) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { records: state.records.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)) };
        }),
      removeRecord: (id) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { records: state.records.filter((entry) => entry.id !== id) };
        })
    }),
    {
      name: 'dunamis-farm-agro-labor-v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
