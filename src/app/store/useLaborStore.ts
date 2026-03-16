import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { LaborRecord } from '@/entities';
import { LaborRecordSchema } from '@/entities/agro/shared_validation';

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
        
        // Final Gate Validation
        const result = LaborRecordSchema.safeParse(next);
        if (!result.success) {
          console.error('Validation failed for addRecord:', result.error.format());
          return next.id;
        }

        useSyncQueueStore.getState().enqueue({
          table: 'labor_records',
          action: 'INSERT',
          payload: next
        });

        set((state) => ({ records: [...state.records, next] }));
        return next.id;
      },
      updateRecord: (id, patch) =>
        set((state) => {
          const current = state.records.find((entry) => entry.id === id);
          if (!current) return state;

          const next = { ...current, ...patch };

          // Final Gate Validation
          const result = LaborRecordSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateRecord:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'labor_records',
            action: 'UPDATE',
            payload: next
          });

          return { records: state.records.map((entry) => (entry.id === id ? next : entry)) };
        }),
      removeRecord: (id) =>
        set((state) => {
          const target = state.records.find((entry) => entry.id === id);
          if (!target) return state;

          useSyncQueueStore.getState().enqueue({
            table: 'labor_records',
            action: 'DELETE',
            payload: { id }
          });

          return { records: state.records.filter((entry) => entry.id !== id) };
        })
    }),
    {
      name: 'dunamis-farm-agro-labor-v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
