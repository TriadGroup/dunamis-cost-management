import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { MaintenanceEvent } from '@/entities';
import { MaintenanceEventSchema } from '@/entities/agro/shared_validation';

interface MaintenanceState {
  events: MaintenanceEvent[];
  addEvent: (item?: Partial<MaintenanceEvent>) => void;
  updateEvent: (id: string, patch: Partial<MaintenanceEvent>) => void;
  removeEvent: (id: string) => void;
}

const defaultEvent = (): MaintenanceEvent => ({
  id: createId(),
  assetName: 'Novo ativo',
  category: 'Geral',
  maintenanceType: 'preventiva',
  cadenceType: 'recorrente',
  interval: 'A cada 6 meses',
  costPerEventCents: 0,
  downtimeDays: 0,
  nextDate: '',
  annualEquivalentCents: 0,
  monthlyReserveCents: 0,
  impact: '',
  recommendation: 'avaliar',
  notes: '',
  status: 'ativo'
});

export const useMaintenanceStore = create<MaintenanceState>()(
  persist(
    (set) => ({
      events: [],
      addEvent: (item) =>
        set((state) => {
          const next = { ...defaultEvent(), ...item, id: createId() };
          
          // Final Gate Validation
          const result = MaintenanceEventSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for addEvent:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'maintenance_events',
            action: 'INSERT',
            payload: next
          });

          return { events: [...state.events, next] };
        }),
      updateEvent: (id, patch) =>
        set((state) => {
          const current = state.events.find((entry) => entry.id === id);
          if (!current) return state;

          const next = { ...current, ...patch };

          // Final Gate Validation
          const result = MaintenanceEventSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateEvent:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'maintenance_events',
            action: 'UPDATE',
            payload: next
          });

          return { events: state.events.map((entry) => (entry.id === id ? next : entry)) };
        }),
      removeEvent: (id) =>
        set((state) => {
          const target = state.events.find((entry) => entry.id === id);
          if (!target) return state;

          useSyncQueueStore.getState().enqueue({
            table: 'maintenance_events',
            action: 'DELETE',
            payload: { id }
          });

          return { events: state.events.filter((entry) => entry.id !== id) };
        })
    }),
    {
      name: 'dunamis-farm-os-maintenance-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
