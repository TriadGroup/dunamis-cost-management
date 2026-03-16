import { create } from 'zustand';

export type DashboardViewMode = 'entradas' | 'saidas' | 'atencao';
export type HomeViewMode = 'base' | 'next' | 'attention';

interface DashboardState {
  mode: HomeViewMode;
  setMode: (mode: HomeViewMode) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  mode: 'base',
  setMode: (mode) => set({ mode })
}));
