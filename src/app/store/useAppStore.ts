import { create } from 'zustand';
import { buildKpiSnapshot, project12Months } from '@/entities/finance/calculations';
import { DEFAULT_APP_STATE } from '@/entities/finance/defaultData';
import type { AppState, Category, FinancialItem, Investment, MetricType, Recurrence } from '@/entities/finance/types';
import { loadAppState, saveAppState, simpleHash } from '@/shared/lib/storage';

interface AuthState {
  unlocked: boolean;
  authError: string | null;
}

interface AppActions {
  setPin: (pin: string) => void;
  unlockWithPin: (pin: string) => void;
  lock: () => void;
  updateExpectedRevenue: (valueCents: number) => void;
  updateCashReserve: (valueCents: number) => void;
  addCategory: (name: string) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  removeCategory: (id: string) => void;
  setCategorySlider: (id: string, pct: number) => void;
  addItem: (categoryId: string) => void;
  updateItem: (id: string, patch: Partial<FinancialItem>) => void;
  removeItem: (id: string) => void;
  setItemSlider: (id: string, pct: number) => void;
  addInvestment: () => void;
  updateInvestment: (id: string, patch: Partial<Investment>) => void;
  removeInvestment: (id: string) => void;
}

export interface StoreState {
  data: AppState;
  auth: AuthState;
  actions: AppActions;
}

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const clampPct = (value: number): number => Math.max(-100, Math.min(300, Number.isFinite(value) ? value : 0));

const persistData = (data: AppState): AppState => {
  saveAppState(data);
  return data;
};

const initialData = loadAppState();

export const useAppStore = create<StoreState>((set, get) => ({
  data: initialData,
  auth: {
    unlocked: !initialData.pinHash,
    authError: null
  },
  actions: {
    setPin: (pin) => {
      const value = pin.trim();
      if (value.length < 4) {
        set((state) => ({ auth: { ...state.auth, authError: 'PIN deve ter pelo menos 4 digitos' } }));
        return;
      }
      set((state) => ({
        data: persistData({ ...state.data, pinHash: simpleHash(value) }),
        auth: { unlocked: true, authError: null }
      }));
    },
    unlockWithPin: (pin) => {
      const stored = get().data.pinHash;
      if (!stored) {
        set((state) => ({ auth: { ...state.auth, unlocked: true, authError: null } }));
        return;
      }

      if (simpleHash(pin.trim()) === stored) {
        set((state) => ({ auth: { ...state.auth, unlocked: true, authError: null } }));
      } else {
        set((state) => ({ auth: { ...state.auth, authError: 'PIN invalido' } }));
      }
    },
    lock: () => set((state) => ({ auth: { ...state.auth, unlocked: false, authError: null } })),
    updateExpectedRevenue: (valueCents) =>
      set((state) => ({
        data: persistData({ ...state.data, expectedRevenueCents: Math.max(0, Math.round(valueCents)) })
      })),
    updateCashReserve: (valueCents) =>
      set((state) => ({
        data: persistData({ ...state.data, cashReserveCents: Math.max(0, Math.round(valueCents)) })
      })),
    addCategory: (name) =>
      set((state) => ({
        data: persistData({
          ...state.data,
          categories: [
            ...state.data.categories,
            { id: createId(), name: name || 'Nova categoria', categorySliderPct: 0, colorToken: 'fern' }
          ]
        })
      })),
    updateCategory: (id, patch) =>
      set((state) => ({
        data: persistData({
          ...state.data,
          categories: state.data.categories.map((category) =>
            category.id === id
              ? { ...category, ...patch, categorySliderPct: clampPct(patch.categorySliderPct ?? category.categorySliderPct) }
              : category
          )
        })
      })),
    removeCategory: (id) =>
      set((state) => {
        const categories = state.data.categories.filter((category) => category.id !== id);
        const items = state.data.items.filter((item) => item.categoryId !== id);
        return { data: persistData({ ...state.data, categories, items }) };
      }),
    setCategorySlider: (id, pct) =>
      get().actions.updateCategory(id, {
        categorySliderPct: clampPct(pct)
      }),
    addItem: (categoryId) =>
      set((state) => ({
        data: persistData({
          ...state.data,
          items: [
            ...state.data.items,
            {
              id: createId(),
              categoryId,
              name: 'Novo item',
              type: 'cost' as MetricType,
              baseValueCents: 0,
              recurrence: 'monthly' as Recurrence,
              itemSliderPct: 0,
              notes: ''
            }
          ]
        })
      })),
    updateItem: (id, patch) =>
      set((state) => ({
        data: persistData({
          ...state.data,
          items: state.data.items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...patch,
                  baseValueCents: Math.max(0, Math.round(patch.baseValueCents ?? item.baseValueCents)),
                  itemSliderPct: clampPct(patch.itemSliderPct ?? item.itemSliderPct)
                }
              : item
          )
        })
      })),
    removeItem: (id) =>
      set((state) => ({
        data: persistData({ ...state.data, items: state.data.items.filter((item) => item.id !== id) })
      })),
    setItemSlider: (id, pct) => get().actions.updateItem(id, { itemSliderPct: clampPct(pct) }),
    addInvestment: () =>
      set((state) => ({
        data: persistData({
          ...state.data,
          investments: [
            ...state.data.investments,
            {
              id: createId(),
              name: 'Novo investimento',
              amountCents: 0,
              expectedMonthlyReturnCents: 0,
              horizonMonths: 12,
              riskLevel: 'medium'
            }
          ]
        })
      })),
    updateInvestment: (id, patch) =>
      set((state) => ({
        data: persistData({
          ...state.data,
          investments: state.data.investments.map((investment) =>
            investment.id === id
              ? {
                  ...investment,
                  ...patch,
                  amountCents: Math.max(0, Math.round(patch.amountCents ?? investment.amountCents)),
                  expectedMonthlyReturnCents: Math.max(
                    0,
                    Math.round(patch.expectedMonthlyReturnCents ?? investment.expectedMonthlyReturnCents)
                  ),
                  horizonMonths: Math.max(1, Math.round(patch.horizonMonths ?? investment.horizonMonths))
                }
              : investment
          )
        })
      })),
    removeInvestment: (id) =>
      set((state) => ({
        data: persistData({
          ...state.data,
          investments: state.data.investments.filter((investment) => investment.id !== id)
        })
      }))
  }
}));

export const useDashboardData = () => {
  const data = useAppStore((state) => state.data);
  const snapshot = buildKpiSnapshot(data);
  const projection = project12Months(data);
  return { data, snapshot, projection };
};

export const resetStoreForTests = () => {
  useAppStore.setState({
    data: DEFAULT_APP_STATE,
    auth: { unlocked: true, authError: null },
    actions: useAppStore.getState().actions
  });
};
