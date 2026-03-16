import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { EquipmentUsageRecord } from '@/entities';

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
      name: 'dunamis-farm-agro-equipment-usage-v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
