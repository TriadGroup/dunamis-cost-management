import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import { useEquipmentUsageStore } from '@/app/store/useEquipmentUsageStore';
import { useFieldOperationsStore } from '@/app/store/useFieldOperationsStore';
import { useFinanceStore } from '@/app/store/useFinanceStore';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import { useLaborStore } from '@/app/store/useLaborStore';
import type { CostAllocationLedgerEntry } from '@/entities';
import {
  buildAllocationEntriesFromApplications,
  buildAllocationEntriesFromEquipment,
  buildAllocationEntriesFromIndirectCosts,
  buildAllocationEntriesFromLabor,
  buildAllocationEntriesFromStockUsage
} from '@/entities';
import { CostAllocationLedgerEntrySchema } from '@/entities/agro/allocation/validation';

interface CostAllocationState {
  ledger: CostAllocationLedgerEntry[];
  addEntry: (entry: CostAllocationLedgerEntry) => void;
  removeEntry: (id: string) => void;
  replaceLedger: (entries: CostAllocationLedgerEntry[]) => void;
  rebuildEntriesForPlan: (planId: string) => void;
  rebuildEntriesForLot: (lotId: string) => void;
  rebuildFromFacts: () => void;
}

const deriveLedger = (): CostAllocationLedgerEntry[] => {
  const applications = useFieldOperationsStore.getState().applications;
  const lots = useInventoryStore.getState().lots;
  const movements = useInventoryStore.getState().movements;
  const costItems = useFinanceStore.getState().costItems;
  const labor = useLaborStore.getState().records;
  const equipment = useEquipmentUsageStore.getState().records;

  return [
    ...buildAllocationEntriesFromStockUsage(movements, lots),
    ...buildAllocationEntriesFromApplications(applications, lots),
    ...buildAllocationEntriesFromLabor(labor),
    ...buildAllocationEntriesFromEquipment(equipment),
    ...buildAllocationEntriesFromIndirectCosts(costItems)
  ];
};

export const useCostAllocationStore = create<CostAllocationState>()(
  persist(
    (set) => ({
      ledger: [],
      addEntry: (entry) =>
        set((state) => {
          // Final Gate Validation
          const result = CostAllocationLedgerEntrySchema.safeParse(entry);
          if (!result.success) {
            console.error('Validation failed for addEntry:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'cost_allocation_ledger',
            action: 'INSERT',
            payload: entry
          });

          return { ledger: [...state.ledger, entry] };
        }),
      removeEntry: (id) =>
        set((state) => {
          const target = state.ledger.find((entry) => entry.id === id);
          if (!target) return state;

          useSyncQueueStore.getState().enqueue({
            table: 'cost_allocation_ledger',
            action: 'DELETE',
            payload: { id }
          });

          return { ledger: state.ledger.filter((entry) => entry.id !== id) };
        }),
      replaceLedger: (entries) =>
        set(() => {
          // Mass sync for replacement
          entries.forEach((entry) => {
            useSyncQueueStore.getState().enqueue({
              table: 'cost_allocation_ledger',
              action: 'UPDATE', // Upsert logic would be better, but UPDATE + INSERT works in queue
              payload: entry
            });
          });
          return { ledger: entries };
        }),
      rebuildEntriesForPlan: (planId) =>
        set(() => {
          const derived = deriveLedger().filter((entry) => entry.cropPlanId === planId || (entry.targetType === 'plano' && entry.targetId === planId));
          
          derived.forEach((entry) => {
             useSyncQueueStore.getState().enqueue({
              table: 'cost_allocation_ledger',
              action: 'UPDATE',
              payload: entry
            });
          });

          return { ledger: derived };
        }),
      rebuildEntriesForLot: (lotId) =>
        set(() => {
          const derived = deriveLedger().filter((entry) => entry.productionLotId === lotId || (entry.targetType === 'lote' && entry.targetId === lotId));
          
          derived.forEach((entry) => {
             useSyncQueueStore.getState().enqueue({
              table: 'cost_allocation_ledger',
              action: 'UPDATE',
              payload: entry
            });
          });

          return { ledger: derived };
        }),
      rebuildFromFacts: () =>
        set(() => {
          const derived = deriveLedger();
          
          derived.forEach((entry) => {
             useSyncQueueStore.getState().enqueue({
              table: 'cost_allocation_ledger',
              action: 'UPDATE',
              payload: entry
            });
          });

          return { ledger: derived };
        })
    }),
    {
      name: 'dunamis-farm-agro-cost-allocation-v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
