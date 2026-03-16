import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { ApplicationEvent, LossEvent } from '@/entities';
import { ApplicationEventSchema, LossEventSchema } from '@/entities/agro/shared_validation';

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
        
        // Final Gate Validation
        const result = ApplicationEventSchema.safeParse(next);
        if (!result.success) {
          console.error('Validation failed for addApplication:', result.error.format());
          return next.id;
        }

        useSyncQueueStore.getState().enqueue({
          table: 'application_events',
          action: 'INSERT',
          payload: next
        });

        set((state) => ({ applications: [...state.applications, next] }));
        return next.id;
      },
      updateApplication: (id, patch) =>
        set((state) => {
          const current = state.applications.find((entry) => entry.id === id);
          if (!current) return state;

          const next = { ...current, ...patch };

          // Final Gate Validation
          const result = ApplicationEventSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateApplication:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'application_events',
            action: 'UPDATE',
            payload: next
          });

          return { applications: state.applications.map((entry) => (entry.id === id ? next : entry)) };
        }),
      removeApplication: (id) =>
        set((state) => {
          const target = state.applications.find((entry) => entry.id === id);
          if (!target) return state;

          useSyncQueueStore.getState().enqueue({
            table: 'application_events',
            action: 'DELETE',
            payload: { id }
          });

          return { applications: state.applications.filter((entry) => entry.id !== id) };
        }),
      addLossEvent: (item) => {
        const next = { ...defaultLoss(), ...item, id: createId() };
        
        // Final Gate Validation
        const result = LossEventSchema.safeParse(next);
        if (!result.success) {
          console.error('Validation failed for addLossEvent:', result.error.format());
          return next.id;
        }

        useSyncQueueStore.getState().enqueue({
          table: 'loss_events',
          action: 'INSERT',
          payload: next
        });

        set((state) => ({ losses: [...state.losses, next] }));
        return next.id;
      },
      updateLossEvent: (id, patch) =>
        set((state) => {
          const current = state.losses.find((entry) => entry.id === id);
          if (!current) return state;

          const next = { ...current, ...patch };

          // Final Gate Validation
          const result = LossEventSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateLossEvent:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'loss_events',
            action: 'UPDATE',
            payload: next
          });

          return { losses: state.losses.map((entry) => (entry.id === id ? next : entry)) };
        }),
      removeLossEvent: (id) =>
        set((state) => {
          const target = state.losses.find((entry) => entry.id === id);
          if (!target) return state;

          useSyncQueueStore.getState().enqueue({
            table: 'loss_events',
            action: 'DELETE',
            payload: { id }
          });

          return { losses: state.losses.filter((entry) => entry.id !== id) };
        })
    }),
    {
      name: 'dunamis-farm-agro-field-operations-v1',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
