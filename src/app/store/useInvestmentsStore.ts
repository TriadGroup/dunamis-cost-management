import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import type { InvestmentContract } from '@/entities';
import { InvestmentContractSchema } from '@/entities/finance/shared_validation';

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
          const next = { ...defaultContract(), ...item, id: createId() };
          
          // Final Gate Validation
          const result = InvestmentContractSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for addContract:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'investment_contracts',
            action: 'INSERT',
            payload: next
          });

          return { contracts: [...state.contracts, next] };
        }),
      updateContract: (id, patch) =>
        set((state) => {
          const current = state.contracts.find((entry) => entry.id === id);
          if (!current) return state;

          const next = { ...current, ...patch };

          // Final Gate Validation
          const result = InvestmentContractSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateContract:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'investment_contracts',
            action: 'UPDATE',
            payload: next
          });

          return {
            contracts: state.contracts.map((entry) => (entry.id === id ? next : entry))
          };
        }),
      removeContract: (id) =>
        set((state) => {
          const target = state.contracts.find((entry) => entry.id === id);
          if (!target) return state;

          useSyncQueueStore.getState().enqueue({
            table: 'investment_contracts',
            action: 'DELETE',
            payload: { id }
          });

          return { contracts: state.contracts.filter((entry) => entry.id !== id) };
        })
    }),
    {
      name: 'dunamis-farm-os-investments-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
