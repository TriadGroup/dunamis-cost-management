import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { PurchaseItem } from '@/entities';
import { PurchaseItemSchema } from '@/entities/finance/purchase/validation';

interface PurchasesState {
  purchases: PurchaseItem[];
  addPurchase: (item?: Partial<PurchaseItem>) => string;
  updatePurchase: (id: string, patch: Partial<PurchaseItem>) => void;
  removePurchase: (id: string) => void;
}

const defaultPurchase = (): PurchaseItem => ({
  id: createId(),
  name: 'Nova compra',
  category: 'Insumo',
  subcategory: 'Geral',
  supplier: '',
  eventValueCents: 0,
  monthlyEquivalentCents: 0,
  nextOccurrence: '',
  notes: '',
  status: 'ativo',
  isStockable: true,
  receivedAt: '',
  paymentStatus: 'pendente'
});

export const usePurchasesStore = create<PurchasesState>()(
  persist(
    (set) => ({
      purchases: [],
      addPurchase: (item) => {
        const next = { ...defaultPurchase(), ...item, id: createId() };
        
        // Final Gate Validation
        const result = PurchaseItemSchema.safeParse(next);
        if (!result.success) {
          console.error('Validation failed for addPurchase:', result.error.format());
          return next.id; // Or throw error
        }

        set((state) => {
          useSyncQueueStore.getState().enqueue({
            table: 'purchases',
            action: 'INSERT',
            payload: next
          });
          return { purchases: [...state.purchases, next] };
        });
        return next.id;
      },
      updatePurchase: (id, patch) =>
        set((state) => {
          const updated = state.purchases.find((p) => p.id === id);
          if (!updated) return state;

          const next = { ...updated, ...patch };
          
          // Final Gate Validation
          const result = PurchaseItemSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updatePurchase:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'purchases',
            action: 'UPDATE',
            payload: next
          });
          
          return { purchases: state.purchases.map((entry) => (entry.id === id ? next : entry)) };
        }),
      removePurchase: (id) =>
        set((state) => {
          useSyncQueueStore.getState().enqueue({
            table: 'purchases',
            action: 'DELETE',
            payload: { id }
          });
          return { purchases: state.purchases.filter((entry) => entry.id !== id) };
        })
    }),
    {
      name: 'dunamis-farm-agro-purchases-v3',
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persistedState: any) => {
        const state = persistedState as PurchasesState | undefined;
        if (!state) return { purchases: [] };
        return {
          ...state,
          purchases: (state.purchases ?? []).map((entry) => ({
            ...entry
            ,
            isStockable: entry.isStockable ?? true,
            receivedAt: entry.receivedAt ?? '',
            paymentStatus: entry.paymentStatus ?? 'pendente'
          }))
        };
      }
    }
  )
);
