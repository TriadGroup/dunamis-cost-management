import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import { OptionCatalogSchema } from '@/entities/shared/validation';

export interface OptionCatalogEntry {
  value: string;
  label: string;
}

export type OptionCatalogState = {
  options: Record<string, OptionCatalogEntry[]>;
  getOptions: (taxonomy: string) => OptionCatalogEntry[];
  addOption: (taxonomy: string, label: string, value?: string) => string;
  renameOption: (taxonomy: string, value: string, nextLabel: string) => void;
  removeOption: (taxonomy: string, value: string) => void;
};

const slugify = (value: string): string =>
  value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const uniqueEntries = (entries: OptionCatalogEntry[]): OptionCatalogEntry[] => {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.value}:${entry.label.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const seededOptions = (): Record<string, OptionCatalogEntry[]> => ({
  'crop-category': [
    { value: 'Folhosa', label: 'Folhosa' },
    { value: 'Erva / tempero', label: 'Erva / tempero' },
    { value: 'Raiz', label: 'Raiz' },
    { value: 'Fruto', label: 'Fruto' },
    { value: 'Flor / inflorescência', label: 'Flor / inflorescência' },
    { value: 'Brassica / crucífera', label: 'Brassica / crucífera' },
    { value: 'Outro', label: 'Outro' }
  ],
  'cost-category': [
    { value: 'Insumos operacionais', label: 'Insumos operacionais' },
    { value: 'EPI e segurança', label: 'EPI e segurança' },
    { value: 'Mão de obra', label: 'Mão de obra' },
    { value: 'Operação comercial', label: 'Operação comercial' }
  ],
  'cost-subcategory': [
    { value: 'Proteção', label: 'Proteção' },
    { value: 'Nutrição de solo', label: 'Nutrição de solo' },
    { value: 'Correção de solo', label: 'Correção de solo' },
    { value: 'Sementes e mudas', label: 'Sementes e mudas' },
    { value: 'Irrigação', label: 'Irrigação' },
    { value: 'Descartáveis', label: 'Descartáveis' }
  ],
  'cost-center': [
    { value: 'Operação diária', label: 'Operação diária' },
    { value: 'Equipe campo', label: 'Equipe campo' },
    { value: 'Campo aberto', label: 'Campo aberto' },
    { value: 'Estufa', label: 'Estufa' }
  ],
  supplier: [
    { value: 'Agro Verde', label: 'Agro Verde' },
    { value: 'Distribuidor local', label: 'Distribuidor local' }
  ],
  'inventory-unit': [
    { value: 'unidade', label: 'Unidade' },
    { value: 'muda', label: 'Muda' },
    { value: 'caixa', label: 'Caixa' },
    { value: 'bandeja', label: 'Bandeja' },
    { value: 'maço', label: 'Maço' },
    { value: 'kg', label: 'Kg' },
    { value: 'L', label: 'L' }
  ],
  'inventory-location': [
    { value: 'Galpão principal', label: 'Galpão principal' },
    { value: 'Depósito seco', label: 'Depósito seco' },
    { value: 'Câmara fria', label: 'Câmara fria' }
  ],
  responsible: [{ value: 'Equipe campo', label: 'Equipe campo' }],
  equipment: [
    { value: 'Pulverizador costal', label: 'Pulverizador costal' },
    { value: 'Aplicação manual', label: 'Aplicação manual' }
  ],
  'traceability-origin': [
    { value: 'Viveiro parceiro', label: 'Viveiro parceiro' },
    { value: 'Semente própria', label: 'Semente própria' }
  ],
  'traceability-location': [
    { value: 'Setor A / Canteiro 1', label: 'Setor A / Canteiro 1' },
    { value: 'Setor B / Canteiro 4', label: 'Setor B / Canteiro 4' }
  ],
  'maintenance-category': [
    { value: 'Irrigação', label: 'Irrigação' },
    { value: 'Trator', label: 'Trator' },
    { value: 'Pulverização', label: 'Pulverização' }
  ],
  'maintenance-impact': [
    { value: 'Atrasa plantio', label: 'Atrasa plantio' },
    { value: 'Para irrigação', label: 'Para irrigação' },
    { value: 'Reduz capacidade', label: 'Reduz capacidade' }
  ],
  'investment-category': [
    { value: 'Implemento', label: 'Implemento' },
    { value: 'Máquina', label: 'Máquina' },
    { value: 'Estrutura', label: 'Estrutura' }
  ]
});

export const useOptionCatalogStore = create<OptionCatalogState>()(
  persist(
    (set, get) => ({
      options: seededOptions(),
      getOptions: (taxonomy) => get().options[taxonomy] ?? [],
      addOption: (taxonomy, label, value) => {
        const normalizedLabel = label.trim();
        if (!normalizedLabel) return '';
        const normalizedValue = value?.trim() || slugify(normalizedLabel) || normalizedLabel;
        const current = get().options[taxonomy] ?? [];
        const existing =
          current.find((entry) => entry.value === normalizedValue) ??
          current.find((entry) => entry.label.trim().toLowerCase() === normalizedLabel.toLowerCase());

        if (existing) return existing.value;

        const nextOptions = {
          ...get().options,
          [taxonomy]: uniqueEntries([
            ...current,
            {
              value: normalizedValue,
              label: normalizedLabel
            }
          ]).sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'))
        };

        const result = OptionCatalogSchema.safeParse(nextOptions);
        if (!result.success) {
          console.error('Validation failed for addOption:', result.error.format());
          return '';
        }

        useSyncQueueStore.getState().enqueue({
          table: 'option_catalog',
          action: 'UPDATE', 
          payload: { options: nextOptions }
        });

        set({ options: nextOptions });
        return normalizedValue;
      },
      renameOption: (taxonomy, value, nextLabel) => {
        const normalizedLabel = nextLabel.trim();
        if (!normalizedLabel) return;

        const nextOptions = {
          ...get().options,
          [taxonomy]: (get().options[taxonomy] ?? []).map((entry) =>
            entry.value === value
              ? {
                  ...entry,
                  label: normalizedLabel
                }
              : entry
          )
        };

        const result = OptionCatalogSchema.safeParse(nextOptions);
        if (!result.success) {
          console.error('Validation failed for renameOption:', result.error.format());
          return;
        }

        useSyncQueueStore.getState().enqueue({
          table: 'option_catalog',
          action: 'UPDATE',
          payload: { options: nextOptions }
        });

        set({ options: nextOptions });
      },
      removeOption: (taxonomy, value) => {
        const nextOptions = {
          ...get().options,
          [taxonomy]: (get().options[taxonomy] ?? []).filter((entry) => entry.value !== value)
        };

        const result = OptionCatalogSchema.safeParse(nextOptions);
        if (!result.success) {
          console.error('Validation failed for removeOption:', result.error.format());
          return;
        }

        useSyncQueueStore.getState().enqueue({
          table: 'option_catalog',
          action: 'UPDATE',
          payload: { options: nextOptions }
        });

        set({ options: nextOptions });
      }
    }),
    {
      name: 'dunamis-farm-os-option-catalog-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = (persistedState as Partial<OptionCatalogState> | undefined) ?? {};
        const defaults = seededOptions();
        const persistedOptions = state.options ?? {};
        const mergedEntries = Object.entries({
          ...defaults,
          ...persistedOptions
        }).reduce<Record<string, OptionCatalogEntry[]>>((acc, [taxonomy, entries]) => {
          const defaultEntries = defaults[taxonomy] ?? [];
          acc[taxonomy] = uniqueEntries([...(defaultEntries ?? []), ...(entries ?? [])]).sort((a, b) =>
            a.label.localeCompare(b.label, 'pt-BR')
          );
          return acc;
        }, {});

        return {
          options: mergedEntries
        };
      }
    }
  )
);
