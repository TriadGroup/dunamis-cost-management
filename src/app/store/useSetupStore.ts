import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type SetupStatus = 'landing' | 'in_progress' | 'completed';

export type AreaUnitOption = 'hectare' | 'alqueire_paulista' | 'alqueire_mineiro' | 'outra';

export type ProductionProfileOption =
  | 'horta'
  | 'grande_cultura'
  | 'pomar'
  | 'cultivo_protegido'
  | 'agrofloresta'
  | 'pecuaria'
  | 'viveiro'
  | 'operacao_mista';

export type StructureTypeOption =
  | 'canteiros'
  | 'estufas'
  | 'talhoes'
  | 'areas_irrigadas'
  | 'areas_mecanizadas'
  | 'pomar'
  | 'cozinha_interna'
  | 'box'
  | 'deposito'
  | 'oficina'
  | 'camara_fria'
  | 'viveiro'
  | 'outro';

export type ChannelOption =
  | 'cozinha_interna'
  | 'box'
  | 'feira_eventos'
  | 'mercado_regional'
  | 'venda_direta'
  | 'atacado_granel'
  | 'excedente'
  | 'consumo_interno'
  | 'doacao';

export type FinancialStartingPoint =
  | 'implantacao'
  | 'importar_planilhas'
  | 'custos_recorrentes'
  | 'ativos_equipamentos'
  | 'investimentos_financiamentos'
  | 'estrutura_minima';

export interface OperationIdentity {
  operationName: string;
  operationNickname: string;
  location: string;
  locationAddress: string;
  locationPlaceId: string;
  latitude: number | null;
  longitude: number | null;
  areaUnit: AreaUnitOption;
  totalArea: number;
  productiveArea: number;
  expansionArea: number;
}

export interface StructureEntry {
  id: string;
  type: StructureTypeOption;
  quantity: number;
  notes: string;
}

export interface InitialCropEntry {
  category: string;
  item: string;
}

export interface SetupState {
  status: SetupStatus;
  currentStep: number;
  identity: OperationIdentity;
  productionProfiles: ProductionProfileOption[];
  structures: StructureEntry[];
  channels: ChannelOption[];
  initialCrops: InitialCropEntry[];
  customCrops: InitialCropEntry[];
  financialStartingPoints: FinancialStartingPoint[];
  hasChosenFinancialStartingPoint: boolean;
  setStatus: (status: SetupStatus) => void;
  startSetup: () => void;
  returnToLanding: () => void;
  setCurrentStep: (step: number) => void;
  updateIdentity: (patch: Partial<OperationIdentity>) => void;
  toggleProductionProfile: (option: ProductionProfileOption) => void;
  setStructures: (structures: StructureEntry[]) => void;
  setChannels: (channels: ChannelOption[]) => void;
  moveChannel: (channel: ChannelOption, direction: 'up' | 'down') => void;
  toggleInitialCrop: (entry: InitialCropEntry) => void;
  addCustomCrop: (entry: InitialCropEntry) => void;
  setFinancialStartingPoints: (items: FinancialStartingPoint[]) => void;
  markFinancialStartingPointAsChosen: () => void;
  completeSetup: () => void;
  resetSetup: () => void;
  loadDemoSetup: () => void;
}

const defaultIdentity = (): OperationIdentity => ({
  operationName: '',
  operationNickname: '',
  location: '',
  locationAddress: '',
  locationPlaceId: '',
  latitude: null,
  longitude: null,
  areaUnit: 'hectare',
  totalArea: 0,
  productiveArea: 0,
  expansionArea: 0
});

const demoIdentity = (): OperationIdentity => ({
  operationName: 'Dunamis Farm',
  operationNickname: 'Horta base',
  location: 'Pariquera-Açu, SP',
  locationAddress: 'Pariquera-Açu, SP, Brasil',
  locationPlaceId: '',
  latitude: null,
  longitude: null,
  areaUnit: 'hectare',
  totalArea: 5,
  productiveArea: 1.2,
  expansionArea: 0.8
});

const defaultState = {
  status: 'landing' as SetupStatus,
  currentStep: 0,
  identity: defaultIdentity(),
  productionProfiles: [] as ProductionProfileOption[],
  structures: [] as StructureEntry[],
  channels: [] as ChannelOption[],
  initialCrops: [] as InitialCropEntry[],
  customCrops: [] as InitialCropEntry[],
  financialStartingPoints: ['estrutura_minima'] as FinancialStartingPoint[],
  hasChosenFinancialStartingPoint: false
};

export const useSetupStore = create<SetupState>()(
  persist(
    (set) => ({
      ...defaultState,
      setStatus: (status) => set({ status }),
      startSetup: () =>
        set((state) => ({
          status: 'in_progress',
          currentStep: state.currentStep
        })),
      returnToLanding: () => set({ status: 'landing' }),
      setCurrentStep: (step) => set({ currentStep: Math.max(0, step) }),
      updateIdentity: (patch) =>
        set((state) => ({
          identity: {
            ...state.identity,
            ...patch
          }
        })),
      toggleProductionProfile: (option) =>
        set((state) => ({
          productionProfiles: state.productionProfiles.includes(option)
            ? state.productionProfiles.filter((entry) => entry !== option)
            : [...state.productionProfiles, option]
        })),
      setStructures: (structures) => set({ structures }),
      setChannels: (channels) => set({ channels }),
      moveChannel: (channel, direction) =>
        set((state) => {
          const index = state.channels.indexOf(channel);
          if (index < 0) return state;
          const nextIndex = direction === 'up' ? index - 1 : index + 1;
          if (nextIndex < 0 || nextIndex >= state.channels.length) return state;
          const next = state.channels.slice();
          [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
          return { channels: next };
        }),
      toggleInitialCrop: (entry) =>
        set((state) => {
          const exists = state.initialCrops.some((item) => item.category === entry.category && item.item === entry.item);
          return {
            initialCrops: exists
              ? state.initialCrops.filter((item) => !(item.category === entry.category && item.item === entry.item))
              : [...state.initialCrops, entry]
          };
        }),
      addCustomCrop: (entry) =>
        set((state) => {
          const normalizedItem = entry.item.trim();
          if (!normalizedItem) {
            return state;
          }

          const exists = state.customCrops.some(
            (item) =>
              item.category === entry.category &&
              item.item.trim().toLowerCase() === normalizedItem.toLowerCase()
          );

          if (exists) {
            return state;
          }

          return {
            customCrops: [...state.customCrops, { ...entry, item: normalizedItem }]
          };
        }),
      setFinancialStartingPoints: (items) => set({ financialStartingPoints: items }),
      markFinancialStartingPointAsChosen: () => set({ hasChosenFinancialStartingPoint: true }),
      completeSetup: () => set({ status: 'completed' }),
      resetSetup: () =>
        set({
          ...defaultState,
          identity: defaultIdentity()
        }),
      loadDemoSetup: () =>
        set({
          status: 'completed',
          currentStep: 7,
          identity: demoIdentity(),
          productionProfiles: ['horta', 'cultivo_protegido', 'operacao_mista'],
          structures: [
            { id: 'setup-structure-1', type: 'canteiros', quantity: 12, notes: 'Base de produção folhosa' },
            { id: 'setup-structure-2', type: 'cozinha_interna', quantity: 1, notes: 'Canal interno ativo' },
            { id: 'setup-structure-3', type: 'box', quantity: 1, notes: 'Entrega semanal' },
            { id: 'setup-structure-4', type: 'deposito', quantity: 1, notes: 'Insumos e embalagens' }
          ],
          channels: ['box', 'cozinha_interna', 'mercado_regional', 'excedente', 'feira_eventos'],
          initialCrops: [
            { category: 'folhosas', item: 'Alface' },
            { category: 'folhosas', item: 'Rucula' },
            { category: 'ervas', item: 'Coentro' }
          ],
          customCrops: [],
          financialStartingPoints: ['custos_recorrentes'],
          hasChosenFinancialStartingPoint: true
        })
    }),
    {
      name: 'dunamis-farm-os-setup-v1',
      version: 6,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = (persistedState as Partial<SetupState> | undefined) ?? {};
        const identity = state.identity ?? defaultIdentity();
        const normalizedFinancialStartingPoints =
          state.financialStartingPoints && state.financialStartingPoints.length > 0
            ? [state.financialStartingPoints[0]]
            : ['estrutura_minima'];

        return {
          ...defaultState,
          ...state,
          identity: {
            ...defaultIdentity(),
            ...identity,
            location: identity.location === 'Mogi das Cruzes, SP' ? 'Pariquera-Açu, SP' : identity.location
          },
          customCrops: state.customCrops ?? [],
          financialStartingPoints: normalizedFinancialStartingPoints,
          hasChosenFinancialStartingPoint: state.hasChosenFinancialStartingPoint ?? false
        };
      }
    }
  )
);
