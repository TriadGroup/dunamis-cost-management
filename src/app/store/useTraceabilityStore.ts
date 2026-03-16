import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { Lot } from '@/entities';
import { generateLotCode } from '@/entities';
import { LotSchema } from '@/entities/agro/traceability/validation';

interface LotDraft {
  cropId: string;
  variety: string;
  origin: string;
  receivedAt: string;
  quantityReceived: number;
  quantityPlanted: number;
  location: string;
  notes: string;
}

interface TraceabilityState {
  lots: Lot[];
  searchQuery: string;
  draft: LotDraft;
  setSearchQuery: (value: string) => void;
  setDraft: (patch: Partial<LotDraft>) => void;
  clearDraft: () => void;
  addLotFromDraft: () => void;
  updateLot: (id: string, patch: Partial<Lot>) => void;
}

const defaultDraft = (): LotDraft => ({
  cropId: '',
  variety: '',
  origin: '',
  receivedAt: '',
  quantityReceived: 0,
  quantityPlanted: 0,
  location: '',
  notes: ''
});

export const useTraceabilityStore = create<TraceabilityState>()(
  persist(
    (set, get) => ({
      lots: [],
      searchQuery: '',
      draft: defaultDraft(),
      setSearchQuery: (value) => set({ searchQuery: value }),
      setDraft: (patch) =>
        set((state) => {
          // Draft is local state, no sync queue needed for intermediate edits
          return { draft: { ...state.draft, ...patch } };
        }),
      clearDraft: () => set({ draft: defaultDraft() }),
      addLotFromDraft: () =>
        set((state) => {
          const draft = get().draft;
          if (!draft.cropId || !draft.receivedAt) return state;
          
          const code = generateLotCode(new Date(draft.receivedAt), state.lots.length + 1);
          
          const newLot: Lot = {
            id: createId(),
            code,
            cropId: draft.cropId,
            cropPlanId: null,
            variety: draft.variety,
            receivedAt: draft.receivedAt,
            quantityReceived: draft.quantityReceived,
            quantityPlanted: draft.quantityPlanted,
            origin: draft.origin,
            location: draft.location,
            areaNodeIds: [],
            stage: 'transplante',
            applicationLogs: [],
            applicationEvents: [],
            harvests: [],
            appropriatedCostCents: 0,
            marketableQuantity: 0,
            discardedQuantity: 0,
            traceabilityStatus: 'incompleta',
            notes: draft.notes
          };

          // Final Gate Validation
          const result = LotSchema.safeParse(newLot);
          if (!result.success) {
            console.error('Validation failed for addLotFromDraft:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'production_lots',
            action: 'INSERT',
            payload: newLot
          });

          return {
            lots: [...state.lots, newLot],
            draft: defaultDraft()
          };
        }),
      updateLot: (id, patch) =>
        set((state) => {
          const updated = state.lots.find((lot) => lot.id === id);
          if (!updated) return state;

          const next = { ...updated, ...patch };
          
          // Final Gate Validation
          const result = LotSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateLot:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'production_lots',
            action: 'UPDATE',
            payload: next
          });

          return {
            lots: state.lots.map((lot) => (lot.id === id ? next : lot))
          };
        })
    }),
    {
      name: 'dunamis-farm-agro-traceability-v3',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
