import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CostItem } from '@/entities';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import { CostItemSchema } from '@/entities/finance/cost/validation';

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
    (set, get) => ({
      costItems: [],
      addCostItem: (item) =>
        set((state) => {
          const newItem = { ...defaultCostItem(), ...item, id: createId() };
          
          // Final Gate Validation
          const result = CostItemSchema.safeParse(newItem);
          if (!result.success) {
            console.error('Validation failed for addCostItem:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'cost_items',
            action: 'INSERT',
            payload: newItem
          });

          return { costItems: [...state.costItems, newItem] };
        }),
      updateCostItem: (id, patch) =>
        set((state) => {
          const updated = state.costItems.find((entry) => entry.id === id);
          if (!updated) return state;

          const next = { ...updated, ...patch };

          // Final Gate Validation
          const result = CostItemSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateCostItem:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'cost_items',
            action: 'UPDATE',
            payload: next
          });

          return {
            costItems: state.costItems.map((entry) => (entry.id === id ? next : entry))
          };
        }),
      removeCostItem: (id) =>
        set((state) => {
          const target = state.costItems.find((item) => item.id === id);
          if (!target) return state;

          useSyncQueueStore.getState().enqueue({
            table: 'cost_items',
            action: 'DELETE',
            payload: { id }
          });

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
