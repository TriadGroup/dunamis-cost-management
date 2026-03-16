import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { InvestmentContract } from '@/entities';

interface InvestmentsState {
  contracts: InvestmentContract[];
  addContract: (item?: Partial<InvestmentContract>) => void;
  updateContract: (id: string, patch: Partial<InvestmentContract>) => void;
  removeContract: (id: string) => void;
}

const defaultContract = (): InvestmentContract => ({
  id: createId(),
  assetName: 'Novo investimento',
  assetCategory: 'Ativo',
  modality: 'financiamento',
  assetValueCents: 0,
  downPaymentCents: 0,
  installments: 12,
  monthlyInstallmentCents: 0,
  totalCommittedCents: 0,
  expectedMonthlyReturnCents: 0,
  paybackMonths: null,
  notes: '',
  status: 'ativo'
});

export const useInvestmentsStore = create<InvestmentsState>()(
  persist(
    (set) => ({
      contracts: [],
      addContract: (item) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { contracts: [...state.contracts, { ...defaultContract(), ...item, id: createId() }] };
        }),
      updateContract: (id, patch) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return {
            contracts: state.contracts.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
          };
        }),
      removeContract: (id) =>
        set((state) => {
          useSyncQueueStore.getState().markPending();
          return { contracts: state.contracts.filter((entry) => entry.id !== id) };
        })
    }),
    {
      name: 'dunamis-farm-os-investments-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
