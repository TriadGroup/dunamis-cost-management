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
          useSyncQueueStore.getState().markPending();
          return { ledger: [...state.ledger, entry] };
        }),
      removeEntry: (id) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { ledger: state.ledger.filter((entry) => entry.id !== id) };
        }),
      replaceLedger: (entries) =>
        set(() => {
          useSyncQueueStore.getState().markPending();
          return { ledger: entries };
        }),
      rebuildEntriesForPlan: (planId) =>
        set(() => {
          const derived = deriveLedger().filter((entry) => entry.cropPlanId === planId || (entry.targetType === 'plano' && entry.targetId === planId));
          useSyncQueueStore.getState().markPending();
          return { ledger: derived };
        }),
      rebuildEntriesForLot: (lotId) =>
        set(() => {
          const derived = deriveLedger().filter((entry) => entry.productionLotId === lotId || (entry.targetType === 'lote' && entry.targetId === lotId));
          useSyncQueueStore.getState().markPending();
          return { ledger: derived };
        }),
      rebuildFromFacts: () =>
        set(() => {
          useSyncQueueStore.getState().markPending();
          return { ledger: deriveLedger() };
        })
    }),
    {
      name: 'dunamis-farm-agro-cost-allocation-v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
