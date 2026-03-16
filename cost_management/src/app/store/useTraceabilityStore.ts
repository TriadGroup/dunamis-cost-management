import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { Lot } from '@/entities';
import { generateLotCode } from '@/entities';

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
          useSyncQueueStore.getState().markPending();
          return { draft: { ...state.draft, ...patch } };
        }),
      clearDraft: () => set({ draft: defaultDraft() }),
      addLotFromDraft: () =>
        set((state) => {
          const draft = get().draft;
          if (!draft.cropId || !draft.receivedAt) return state;
          const code = generateLotCode(new Date(draft.receivedAt), state.lots.length + 1);
          useSyncQueueStore.getState().markPending();
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
          return {
            lots: [...state.lots, newLot],
            draft: defaultDraft()
          };
        }),
      updateLot: (id, patch) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return {
            lots: state.lots.map((lot) => (lot.id === id ? { ...lot, ...patch } : lot))
          };
        })
    }),
    {
      name: 'dunamis-farm-agro-traceability-v3',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
