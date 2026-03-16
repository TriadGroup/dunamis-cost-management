import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { MaintenanceEvent } from '@/entities';

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
          useSyncQueueStore.getState().markPending();
          return { events: [...state.events, { ...defaultEvent(), ...item, id: createId() }] };
        }),
      updateEvent: (id, patch) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { events: state.events.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)) };
        }),
      removeEvent: (id) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { events: state.events.filter((entry) => entry.id !== id) };
        })
    }),
    {
      name: 'dunamis-farm-os-maintenance-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
