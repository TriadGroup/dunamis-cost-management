import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { seedScenarios } from '@/app/store/seedData';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { CashScenario, DemandChannel } from '@/entities';
import { applyScenarioDemand } from '@/entities';
import { DemandChannelSchema } from '@/entities/commercial/validation';

interface DemandChannelsState {
  channels: DemandChannel[];
  scenarios: CashScenario[];
  activeScenarioId: string;
  setActiveScenario: (id: string) => void;
  updateChannel: (id: string, patch: Partial<DemandChannel>) => void;
  reorderChannels: (orderedIds: string[]) => void;
  applyActiveScenario: () => void;
}

export const useDemandChannelsStore = create<DemandChannelsState>()(
  persist(
    (set, get) => ({
      channels: [],
      scenarios: seedScenarios,
      activeScenarioId: seedScenarios[0]?.id ?? '',
      setActiveScenario: (id) => set({ activeScenarioId: id }),
      updateChannel: (id, patch) =>
        set((state) => {
          const current = state.channels.find((entry) => entry.id === id);
          if (!current) return state;

          const next = { ...current, ...patch };

          // Final Gate Validation
          const result = DemandChannelSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateChannel:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'demand_channels',
            action: 'UPDATE',
            payload: next
          });

          return { channels: state.channels.map((entry) => (entry.id === id ? next : entry)) };
        }),
      reorderChannels: (orderedIds) =>
        set((state) => {
          const rank = new Map(orderedIds.map((id, index) => [id, index + 1]));
          const nextChannels = state.channels
            .slice()
            .sort((a, b) => (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER))
            .map((channel, index) => ({
              ...channel,
              priority: index + 1
            }));

          // Enqueue updates for all reordered channels
          nextChannels.forEach((channel) => {
            useSyncQueueStore.getState().enqueue({
              table: 'demand_channels',
              action: 'UPDATE',
              payload: channel
            });
          });

          return { channels: nextChannels };
        }),
      applyActiveScenario: () =>
        set((state) => {
          const scenario = state.scenarios.find((entry) => entry.id === get().activeScenarioId);
          if (!scenario) return state;
          
          const nextChannels = applyScenarioDemand(state.channels, scenario);

          // Enqueue updates for all affected channels
          nextChannels.forEach((channel) => {
            useSyncQueueStore.getState().enqueue({
              table: 'demand_channels',
              action: 'UPDATE',
              payload: channel
            });
          });

          return { channels: nextChannels };
        })
    }),
    {
      name: 'dunamis-farm-os-demand-channels-v3',
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = (persistedState as Partial<DemandChannelsState> | undefined) ?? {};
        const channels = (state.channels ?? []).map((channel) => {
          const legacyChannel = channel as DemandChannel & {
            baselineDemandKg?: number;
            scenarioDemandKg?: number;
          };
          return {
            ...channel,
            baselineDemand: channel.baselineDemand ?? legacyChannel.baselineDemandKg ?? 0,
            scenarioDemand: channel.scenarioDemand ?? legacyChannel.scenarioDemandKg ?? 0
          };
        });

        return {
          channels,
          scenarios: state.scenarios ?? seedScenarios,
          activeScenarioId: state.activeScenarioId ?? seedScenarios[0]?.id ?? ''
        };
      }
    }
  )
);
