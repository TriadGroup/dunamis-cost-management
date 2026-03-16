import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CostItem } from '@/entities';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';

interface FinanceState {
  costItems: CostItem[];
  addCostItem: (item?: Partial<CostItem>) => void;
  updateCostItem: (id: string, patch: Partial<CostItem>) => void;
  removeCostItem: (id: string) => void;
}

const defaultCostItem = (): CostItem => ({
  id: createId(),
  category: 'Operação',
  subcategory: 'Geral',
  name: 'Novo custo',
  recurrenceType: 'recorrente',
  eventValueCents: 0,
  monthlyEquivalentCents: 0,
  nextOccurrence: '',
  supplier: '',
  linkedCostCenter: '',
  allocationDriver: 'manual',
  isAppropriable: false,
  notes: '',
  status: 'ativo'
});

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      costItems: [],
      addCostItem: (item) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { costItems: [...state.costItems, { ...defaultCostItem(), ...item, id: createId() }] };
        }),
      updateCostItem: (id, patch) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return {
            costItems: state.costItems.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
          };
        }),
      removeCostItem: (id) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { costItems: state.costItems.filter((entry) => entry.id !== id) };
        })
    }),
    {
      name: 'dunamis-farm-agro-finance-v3',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persistedState: any) => {
        const state = persistedState as FinanceState | undefined;
        if (!state) return { costItems: [] };
        return {
          ...state,
          costItems: (state.costItems ?? []).map((entry) => ({
            ...entry
            ,
            allocationDriver: entry.allocationDriver ?? 'manual',
            isAppropriable: entry.isAppropriable ?? false
          }))
        };
      }
    }
  )
);
