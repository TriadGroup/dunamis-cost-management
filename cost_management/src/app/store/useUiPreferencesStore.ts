import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const hash = (value: string): string => {
  let out = 0;
  for (let i = 0; i < value.length; i += 1) {
    out = (out << 5) - out + value.charCodeAt(i);
    out |= 0;
  }
  return String(out);
};

interface UiPreferencesState {
  productName: string;
  activeRouteId: string;
  executiveMode: boolean;
  navCollapsed: boolean;
  pinHash: string | null;
  unlocked: boolean;
  authError: string | null;
  setActiveRoute: (routeId: string) => void;
  setExecutiveMode: (value: boolean) => void;
  toggleNavCollapsed: () => void;
  setPin: (pin: string) => void;
  unlockWithPin: (pin: string) => void;
  lock: () => void;
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set, get) => ({
      productName: 'Dunamis Farm Agro',
      activeRouteId: 'dashboard',
      executiveMode: true,
      navCollapsed: false,
      pinHash: null,
      unlocked: false,
      authError: null,
      setActiveRoute: (routeId) => set({ activeRouteId: routeId }),
      setExecutiveMode: (value) => set({ executiveMode: value }),
      toggleNavCollapsed: () => set((state) => ({ navCollapsed: !state.navCollapsed })),
      setPin: (pin) => {
        const value = pin.trim();
        if (value.length < 4) {
          set({ authError: 'PIN deve ter pelo menos 4 dígitos' });
          return;
        }
        set({ pinHash: hash(value), unlocked: true, authError: null });
      },
      unlockWithPin: (pin) => {
        const value = pin.trim();
        const current = get().pinHash;
        if (!current) {
          set({ unlocked: true, authError: null });
          return;
        }
        if (hash(value) === current) {
          set({ unlocked: true, authError: null });
        } else {
          set({ authError: 'PIN inválido' });
        }
      },
      lock: () => set({ unlocked: false, authError: null })
    }),
    {
      name: 'dunamis-farm-os-ui-v2',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = (persistedState as Partial<UiPreferencesState> | undefined) ?? {};
        return {
          ...state,
          productName: 'Dunamis Farm Agro'
        };
      },
      partialize: (state) => ({
        activeRouteId: state.activeRouteId,
        executiveMode: state.executiveMode,
        navCollapsed: state.navCollapsed,
        pinHash: state.pinHash
      })
    }
  )
);
