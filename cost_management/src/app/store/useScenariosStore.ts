import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { seedScenarios } from '@/app/store/seedData';
import type { CashScenario } from '@/entities';

interface ScenariosState {
  scenarios: CashScenario[];
  baselineScenarioId: string;
  compareScenarioId: string;
  setCompareScenarioId: (id: string) => void;
}

export const useScenariosStore = create<ScenariosState>()(
  persist(
    (set) => ({
      scenarios: seedScenarios,
      baselineScenarioId: seedScenarios[0]?.id ?? '',
      compareScenarioId: seedScenarios[1]?.id ?? seedScenarios[0]?.id ?? '',
      setCompareScenarioId: (id) => set({ compareScenarioId: id })
    }),
    {
      name: 'dunamis-farm-os-scenarios-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
