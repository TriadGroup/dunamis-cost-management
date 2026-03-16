import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { EquipmentUsageRecord } from '@/entities';
import { EquipmentUsageRecordSchema } from '@/entities/agro/shared_validation';

interface EquipmentUsageState {
  records: EquipmentUsageRecord[];
  addRecord: (item?: Partial<EquipmentUsageRecord>) => string;
  updateRecord: (id: string, patch: Partial<EquipmentUsageRecord>) => void;
  removeRecord: (id: string) => void;
}

const defaultRecord = (): EquipmentUsageRecord => ({
  id: createId(),
  assetName: 'Implemento',
  operationName: 'Operação',
  date: new Date().toISOString().slice(0, 10),
  cropId: null,
  cropPlanId: null,
  areaNodeIds: [],
  hoursUsed: 0,
  areaCoveredSqm: 0,
  fuelCostCents: 0,
  usageCostCents: 0,
  notes: ''
});

export const useEquipmentUsageStore = create<EquipmentUsageState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (item) => {
        const next = { ...defaultRecord(), ...item, id: createId() };
        
        // Final Gate Validation
        const result = EquipmentUsageRecordSchema.safeParse(next);
        if (!result.success) {
          console.error('Validation failed for addRecord:', result.error.format());
          return next.id;
        }

        useSyncQueueStore.getState().enqueue({
          table: 'equipment_usage_records',
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
          const result = EquipmentUsageRecordSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateRecord:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'equipment_usage_records',
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
            table: 'equipment_usage_records',
            action: 'DELETE',
            payload: { id }
          });

          return { records: state.records.filter((entry) => entry.id !== id) };
        })
    }),
    {
      name: 'dunamis-farm-agro-equipment-usage-v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
