import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { ApplicationEvent, LossEvent } from '@/entities';

interface FieldOperationsState {
  applications: ApplicationEvent[];
  losses: LossEvent[];
  addApplication: (item?: Partial<ApplicationEvent>) => string;
  updateApplication: (id: string, patch: Partial<ApplicationEvent>) => void;
  removeApplication: (id: string) => void;
  addLossEvent: (item?: Partial<LossEvent>) => string;
  updateLossEvent: (id: string, patch: Partial<LossEvent>) => void;
  removeLossEvent: (id: string) => void;
}

const defaultApplication = (): ApplicationEvent => ({
  id: createId(),
  inventoryLotId: '',
  stockMovementId: null,
  productId: '',
  cropId: null,
  cropPlanId: null,
  productionLotId: null,
  areaNodeIds: [],
  cropStage: 'vegetativo',
  quantityApplied: 0,
  unit: 'unidade',
  appliedAreaSqm: 0,
  doseDescription: '',
  appliedAt: new Date().toISOString().slice(0, 10),
  responsible: '',
  equipmentName: '',
  weatherNotes: '',
  notes: ''
});

const defaultLoss = (): LossEvent => ({
  id: createId(),
  date: new Date().toISOString().slice(0, 10),
  cause: 'outro',
  sourceType: 'estoque',
  sourceId: '',
  quantity: 0,
  unit: 'unidade',
  estimatedCostCents: 0,
  notes: ''
});

export const useFieldOperationsStore = create<FieldOperationsState>()(
  persist(
    (set) => ({
      applications: [],
      losses: [],
      addApplication: (item) => {
        const next = { ...defaultApplication(), ...item, id: createId() };
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { applications: [...state.applications, next] };
        });
        return next.id;
      },
      updateApplication: (id, patch) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { applications: state.applications.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)) };
        }),
      removeApplication: (id) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { applications: state.applications.filter((entry) => entry.id !== id) };
        }),
      addLossEvent: (item) => {
        const next = { ...defaultLoss(), ...item, id: createId() };
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { losses: [...state.losses, next] };
        });
        return next.id;
      },
      updateLossEvent: (id, patch) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { losses: state.losses.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)) };
        }),
      removeLossEvent: (id) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { losses: state.losses.filter((entry) => entry.id !== id) };
        })
    }),
    {
      name: 'dunamis-farm-agro-field-operations-v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
