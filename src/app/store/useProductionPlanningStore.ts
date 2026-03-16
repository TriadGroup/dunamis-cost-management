import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createId } from '@/app/store/id';
import { useFinanceStore } from '@/app/store/useFinanceStore';
import { usePurchasesStore } from '@/app/store/usePurchasesStore';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import { CropSchema, BedSchema, CropPlanSchema } from '@/entities/agro/production/validation';
import {
  buildCropCostSelectionDefaults,
  createProductionPlanFromCulture,
  normalizeCultivationCostAllocation,
  type Bed,
  type CostSourceType,
  type Crop,
  type CropPlan,
  type CropPurchaseType,
  type CropUnitType,
  type CultivationCostAllocation
} from '@/entities';

export interface CultureDraft {
  name: string;
  variety: string;
  category: string;
  cycleDays: number;
  productionUnit: CropUnitType;
  salesUnit: CropUnitType;
  purchaseType: CropPurchaseType;
  unitsPerPurchasePack: number;
  purchasePackCostCents: number;
  defaultPlantSpacingCm: number;
  defaultRowSpacingCm: number;
  defaultBedWidthM: number;
  defaultBedLengthM: number;
  unitsPerSalesBox: number;
  defaultMarkupPct: number;
  defaultLossRate: number;
  baseSeedlingCostCents: number;
  defaultCostSelections: CultivationCostAllocation[];
  environmentCompatibility: Crop['environmentCompatibility'];
  notes: string;
}

export interface CropPlanDraft {
  cropId: string;
  areaTotalSqm: number;
  bedCount: number;
  bedLengthM: number;
  bedWidthM: number;
  plantSpacingCm: number;
  rowSpacingCm: number;
  cycleDays: number;
  expectedLossRate: number;
  purchasePackType: CropPurchaseType;
  unitsPerPurchasePack: number;
  purchasePackCostCents: number;
  salesUnit: CropUnitType;
  unitsPerSalesBox: number;
  markupPct: number;
  staggeredProduction: boolean;
  targetChannelMix: Record<string, number>;
  costAllocations: CultivationCostAllocation[];
  notes: string;
  status: CropPlan['status'];
}

interface ProductionPlanningState {
  crops: Crop[];
  beds: Bed[];
  plans: CropPlan[];
  cultureDraft: CultureDraft;
  draft: CropPlanDraft;
  setCultureDraft: (patch: Partial<CultureDraft>) => void;
  setCultureDefaultCostSelections: (allocations: CultivationCostAllocation[]) => void;
  toggleCultureDefaultCostSelection: (id: string) => void;
  replaceCultureCostsFromLinkedSources: (cropId: string) => void;
  clearCultureDraft: () => void;
  addCultureFromDraft: () => string | null;
  updateCrop: (id: string, patch: Partial<Crop>) => void;
  setDraft: (patch: Partial<CropPlanDraft>) => void;
  setPlanCostAllocations: (allocations: CultivationCostAllocation[]) => void;
  togglePlanCostAllocation: (id: string) => void;
  addManualPlanCostAllocation: () => void;
  hydratePlanCostsFromCrop: (cropId: string) => void;
  syncPlanLinkedCostsFromCrop: (cropId: string) => void;
  clearDraft: (cropId?: string) => void;
  addPlanFromDraft: () => string | null;
  updatePlan: (id: string, patch: Partial<CropPlan>) => void;
  updateBed: (id: string, patch: Partial<Bed>) => void;
}

const money = (value: number): number => Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
const integer = (value: number, fallback = 1): number => Math.max(fallback, Math.round(Number.isFinite(value) ? value : fallback));

const defaultChannelMix = (): Record<string, number> => ({
  box: 40,
  kitchen: 30,
  'external-market': 20,
  surplus: 10
});

const buildManualAllocation = (label = 'Novo custo manual'): CultivationCostAllocation =>
  normalizeCultivationCostAllocation({
    id: createId(),
    sourceType: 'manual',
    sourceId: null,
    label,
    category: 'Manual',
    costValueCents: 0,
    allocationMode: 'total',
    inheritedFromCrop: false,
    enabled: true
  });

const cloneCostAllocations = (allocations: CultivationCostAllocation[], inheritedFromCrop?: boolean): CultivationCostAllocation[] =>
  allocations.map((allocation) =>
    normalizeCultivationCostAllocation({
      ...allocation,
      inheritedFromCrop: inheritedFromCrop ?? allocation.inheritedFromCrop,
      id: createId()
    })
  );

const defaultCultureDraft = (): CultureDraft => ({
  name: '',
  variety: '',
  category: 'Folhosa',
  cycleDays: 40,
  productionUnit: 'muda',
  salesUnit: 'unidade',
  purchaseType: 'caixa',
  unitsPerPurchasePack: 200,
  purchasePackCostCents: 0,
  defaultPlantSpacingCm: 30,
  defaultRowSpacingCm: 25,
  defaultBedWidthM: 1.25,
  defaultBedLengthM: 50,
  unitsPerSalesBox: 0,
  defaultMarkupPct: 35,
  defaultLossRate: 8,
  baseSeedlingCostCents: 0,
  defaultCostSelections: [],
  environmentCompatibility: 'ambos',
  notes: ''
});

const hydrateCropDefaultCosts = (crop?: Crop): CultivationCostAllocation[] => cloneCostAllocations(crop?.defaultCostSelections ?? [], true);

const buildPlanDraftFromCrop = (crop?: Crop): CropPlanDraft => ({
  cropId: crop?.id ?? '',
  areaTotalSqm: crop ? crop.defaultBedWidthM * crop.defaultBedLengthM : 0,
  bedCount: 1,
  bedLengthM: crop?.defaultBedLengthM ?? 50,
  bedWidthM: crop?.defaultBedWidthM ?? 1.25,
  plantSpacingCm: crop?.defaultPlantSpacingCm ?? 30,
  rowSpacingCm: crop?.defaultRowSpacingCm ?? 25,
  cycleDays: crop?.cycleDays ?? 40,
  expectedLossRate: crop?.defaultLossRate ?? 8,
  purchasePackType: crop?.purchaseType ?? 'caixa',
  unitsPerPurchasePack: crop?.unitsPerPurchasePack ?? 200,
  purchasePackCostCents: crop?.purchasePackCostCents ?? 0,
  salesUnit: crop?.salesUnit ?? 'unidade',
  unitsPerSalesBox: crop && supportsSalesBundleType(crop.salesUnit) ? crop.unitsPerSalesBox : 0,
  markupPct: crop?.defaultMarkupPct ?? 35,
  staggeredProduction: true,
  targetChannelMix: defaultChannelMix(),
  costAllocations: hydrateCropDefaultCosts(crop),
  notes: '',
  status: 'rascunho'
});

const toPreferredUnits = (salesUnit: CropUnitType): Crop['preferredUnits'] => {
  if (salesUnit === 'caixa' || salesUnit === 'bandeja' || salesUnit === 'maco') return ['unit', 'box'];
  if (salesUnit === 'kg') return ['unit', 'weight', 'box'];
  return ['unit', 'box', 'weight'];
};

const supportsSalesBundleType = (salesUnit: CropUnitType): boolean =>
  salesUnit === 'caixa' || salesUnit === 'bandeja' || salesUnit === 'maco';

const normalizeUnitsPerSalesBox = (salesUnit: CropUnitType, unitsPerSalesBox: number): number => {
  if (!supportsSalesBundleType(salesUnit)) return 0;
  return Math.max(1, integer(unitsPerSalesBox || 0));
};

const syncSalesSettings = <T extends { salesUnit: CropUnitType; unitsPerSalesBox: number }>(value: T): T => ({
  ...value,
  unitsPerSalesBox: normalizeUnitsPerSalesBox(value.salesUnit, value.unitsPerSalesBox)
});

const deriveBaseUnitCostCents = (purchasePackCostCents: number, unitsPerPurchasePack: number, purchaseType: CropPurchaseType): number => {
  if (purchaseType === 'unidade') return money(purchasePackCostCents);
  return Math.round(money(purchasePackCostCents) / Math.max(1, integer(unitsPerPurchasePack)));
};

const syncCultureDraftPurchase = (draft: CultureDraft, patch: Partial<CultureDraft>): CultureDraft => {
  const next = syncSalesSettings({ ...draft, ...patch });

  if (next.purchaseType === 'unidade') {
    const unitCostCents =
      patch.baseSeedlingCostCents !== undefined
        ? money(patch.baseSeedlingCostCents)
        : patch.purchasePackCostCents !== undefined
          ? money(patch.purchasePackCostCents)
          : money(next.baseSeedlingCostCents > 0 ? next.baseSeedlingCostCents : next.purchasePackCostCents);

    return {
      ...next,
      unitsPerPurchasePack: 1,
      purchasePackCostCents: unitCostCents,
      baseSeedlingCostCents: unitCostCents
    };
  }

  const unitsPerPurchasePack = integer(next.unitsPerPurchasePack);

  if (patch.baseSeedlingCostCents !== undefined) {
    const unitCostCents = money(patch.baseSeedlingCostCents);
    return {
      ...next,
      unitsPerPurchasePack,
      baseSeedlingCostCents: unitCostCents,
      purchasePackCostCents: unitCostCents * unitsPerPurchasePack
    };
  }

  if (patch.purchasePackCostCents !== undefined || patch.unitsPerPurchasePack !== undefined || patch.purchaseType !== undefined) {
    const purchasePackCostCents = money(next.purchasePackCostCents);
    return {
      ...next,
      unitsPerPurchasePack,
      purchasePackCostCents,
      baseSeedlingCostCents: deriveBaseUnitCostCents(purchasePackCostCents, unitsPerPurchasePack, next.purchaseType)
    };
  }

  return {
    ...next,
    unitsPerPurchasePack
  };
};

const syncPlanDraftPurchase = (draft: CropPlanDraft, patch: Partial<CropPlanDraft>): CropPlanDraft => {
  const next = syncSalesSettings({ ...draft, ...patch });

  if (next.purchasePackType === 'unidade') {
    return {
      ...next,
      unitsPerPurchasePack: 1,
      purchasePackCostCents: money(next.purchasePackCostCents)
    };
  }

  return {
    ...next,
    unitsPerPurchasePack: integer(next.unitsPerPurchasePack),
    purchasePackCostCents: money(next.purchasePackCostCents)
  };
};

const hydratePlan = (crop: Crop, patch: Partial<CropPlan>): CropPlan =>
  createProductionPlanFromCulture(crop, {
    ...patch,
    targetChannelMix: patch.targetChannelMix ?? defaultChannelMix()
  });

const countAllocationsByType = (allocations: CultivationCostAllocation[]) => {
  const active = allocations.map(normalizeCultivationCostAllocation).filter((allocation) => allocation.enabled);
  return {
    inheritedCostSelectionCount: active.filter((allocation) => allocation.inheritedFromCrop).length,
    manualCostSelectionCount: active.filter((allocation) => allocation.sourceType === 'manual').length,
    linkedCostSelectionCount: active.filter((allocation) => allocation.sourceType !== 'manual').length
  };
};

const normalizePersistedCrop = (crop: Crop): Crop => ({
  ...crop,
  unitsPerSalesBox: normalizeUnitsPerSalesBox(crop.salesUnit, crop.unitsPerSalesBox),
  defaultCostSelections: (crop.defaultCostSelections ?? []).map(normalizeCultivationCostAllocation)
});

const normalizePersistedPlan = (plan: CropPlan): CropPlan => {
  const costAllocations = (plan.costAllocations ?? []).map((allocation) =>
    normalizeCultivationCostAllocation({
      ...allocation,
      label: allocation.label ?? allocation.category ?? 'Custo manual'
    })
  );
  const counts = countAllocationsByType(costAllocations);

  return {
    ...plan,
    unitsPerSalesBox: normalizeUnitsPerSalesBox(plan.salesUnit, plan.unitsPerSalesBox),
    seasonLabel: plan.seasonLabel ?? new Date().toISOString().slice(0, 7),
    areaNodeIds: plan.areaNodeIds ?? [],
    costAllocations,
    inheritedCostSelectionCount: counts.inheritedCostSelectionCount,
    manualCostSelectionCount: counts.manualCostSelectionCount,
    linkedCostSelectionCount: counts.linkedCostSelectionCount,
    appropriatedCostCents: plan.appropriatedCostCents ?? 0,
    minimumSalePricePerUnitCents: plan.minimumSalePricePerUnitCents ?? plan.costPerUnitCents ?? 0,
    marketableUnits: plan.marketableUnits ?? plan.viableUnits ?? 0,
    actualHarvestedUnits: plan.actualHarvestedUnits ?? 0,
    actualSoldUnits: plan.actualSoldUnits ?? 0,
    actualInternalUnits: plan.actualInternalUnits ?? 0,
    actualDiscardedUnits: plan.actualDiscardedUnits ?? 0,
    plannedOnly: plan.plannedOnly ?? true
  };
};

export const useProductionPlanningStore = create<ProductionPlanningState>()(
  persist(
    (set, get) => ({
      crops: [],
      beds: [],
      plans: [],
      cultureDraft: defaultCultureDraft(),
      draft: buildPlanDraftFromCrop(),
      setCultureDraft: (patch) =>
        set((state) => {
          // Draft state is local, no sync queue needed here
          return {
            cultureDraft: syncSalesSettings({
              ...syncCultureDraftPurchase(state.cultureDraft, patch),
              defaultCostSelections: patch.defaultCostSelections
                ? patch.defaultCostSelections.map(normalizeCultivationCostAllocation)
                : state.cultureDraft.defaultCostSelections
            })
          };
        }),
      setCultureDefaultCostSelections: (allocations) =>
        set((state) => {
          return {
            cultureDraft: {
              ...state.cultureDraft,
              defaultCostSelections: allocations.map(normalizeCultivationCostAllocation)
            }
          };
        }),
      toggleCultureDefaultCostSelection: (id) =>
        set((state) => {
          return {
            cultureDraft: {
              ...state.cultureDraft,
              defaultCostSelections: state.cultureDraft.defaultCostSelections.map((allocation) =>
                allocation.id === id ? { ...allocation, enabled: !allocation.enabled } : allocation
              )
            }
          };
        }),
      replaceCultureCostsFromLinkedSources: (cropId) =>
        set((state) => {
          const nextDefaults = buildCropCostSelectionDefaults(
            cropId,
            useFinanceStore.getState().costItems,
            usePurchasesStore.getState().purchases
          );

          const target = state.crops.find(c => c.id === cropId);
          if (target) {
            const nextCrop = { ...target, defaultCostSelections: nextDefaults };
            useSyncQueueStore.getState().enqueue({
              table: 'crops',
              action: 'UPDATE',
              payload: nextCrop
            });
          }

          return {
            crops: state.crops.map((crop) => (crop.id === cropId ? { ...crop, defaultCostSelections: nextDefaults } : crop)),
            draft:
              state.draft.cropId === cropId
                ? {
                    ...state.draft,
                    costAllocations: cloneCostAllocations(nextDefaults, true)
                  }
                : state.draft
          };
        }),
      clearCultureDraft: () => set({ cultureDraft: defaultCultureDraft() }),
      addCultureFromDraft: () => {
        const draft = get().cultureDraft;
        if (!draft.name.trim()) return null;
        const baseSeedlingCostCents =
          draft.baseSeedlingCostCents > 0
            ? draft.baseSeedlingCostCents
            : Math.round(draft.purchasePackCostCents / Math.max(1, draft.unitsPerPurchasePack));

        const cropId = createId();
        const newCrop: Crop = {
          id: cropId,
          name: draft.name.trim(),
          variety: draft.variety.trim() || 'Padrao',
          category: draft.category.trim() || 'Folhosa',
          preferredUnits: toPreferredUnits(draft.salesUnit),
          cycleDays: draft.cycleDays,
          productionUnit: draft.productionUnit,
          salesUnit: draft.salesUnit,
          purchaseType: draft.purchaseType,
          unitsPerPurchasePack: draft.unitsPerPurchasePack,
          purchasePackCostCents: draft.purchasePackCostCents,
          defaultPlantSpacingCm: draft.defaultPlantSpacingCm,
          defaultRowSpacingCm: draft.defaultRowSpacingCm,
          defaultBedWidthM: draft.defaultBedWidthM,
          defaultBedLengthM: draft.defaultBedLengthM,
          unitsPerSalesBox: normalizeUnitsPerSalesBox(draft.salesUnit, draft.unitsPerSalesBox),
          defaultMarkupPct: draft.defaultMarkupPct,
          defaultLossRate: draft.defaultLossRate,
          baseSeedlingCostCents,
          defaultCostSelections: draft.defaultCostSelections.map((allocation) => normalizeCultivationCostAllocation({ ...allocation, inheritedFromCrop: true })),
          environmentCompatibility: draft.environmentCompatibility,
          notes: draft.notes.trim()
        };

        const result = CropSchema.safeParse(newCrop);
        if (!result.success) {
          console.error('Validation failed for addCultureFromDraft:', result.error.format());
          return null;
        }

        useSyncQueueStore.getState().enqueue({
          table: 'crops',
          action: 'INSERT',
          payload: newCrop
        });

        set((state) => ({
          crops: [...state.crops, newCrop],
          cultureDraft: defaultCultureDraft(),
          draft: buildPlanDraftFromCrop(newCrop)
        }));

        return cropId;
      },
      updateCrop: (id, patch) =>
        set((state) => {
          const nextCrops = state.crops.map((crop) => {
            if (crop.id !== id) return crop;
            return normalizePersistedCrop(syncSalesSettings({
              ...crop,
              ...patch,
              preferredUnits: toPreferredUnits((patch.salesUnit ?? crop.salesUnit) as CropUnitType),
              defaultCostSelections: (patch.defaultCostSelections ?? crop.defaultCostSelections).map(normalizeCultivationCostAllocation)
            }));
          });

          const updatedCrop = nextCrops.find((crop) => crop.id === id);
          if (!updatedCrop) return state;

          const result = CropSchema.safeParse(updatedCrop);
          if (!result.success) {
            console.error('Validation failed for updateCrop:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'crops',
            action: 'UPDATE',
            payload: updatedCrop
          });
          return {
            crops: nextCrops,
            plans: state.plans.map((plan) =>
              plan.cropId === id
                ? hydratePlan(updatedCrop, {
                    ...plan,
                    costAllocations: plan.costAllocations.some((allocation) => !allocation.inheritedFromCrop)
                      ? [
                          ...cloneCostAllocations(updatedCrop.defaultCostSelections, true),
                          ...plan.costAllocations.filter((allocation) => !allocation.inheritedFromCrop).map(normalizeCultivationCostAllocation)
                        ]
                      : cloneCostAllocations(updatedCrop.defaultCostSelections, true)
                  })
                : plan
            ),
            draft:
              state.draft.cropId === id
                ? {
                    ...state.draft,
                    bedLengthM: updatedCrop.defaultBedLengthM,
                    bedWidthM: updatedCrop.defaultBedWidthM,
                    plantSpacingCm: updatedCrop.defaultPlantSpacingCm,
                    rowSpacingCm: updatedCrop.defaultRowSpacingCm,
                    cycleDays: updatedCrop.cycleDays,
                    expectedLossRate: updatedCrop.defaultLossRate,
                    purchasePackType: updatedCrop.purchaseType,
                    unitsPerPurchasePack: updatedCrop.unitsPerPurchasePack,
                    purchasePackCostCents: updatedCrop.purchasePackCostCents,
                    salesUnit: updatedCrop.salesUnit,
                    unitsPerSalesBox: updatedCrop.unitsPerSalesBox,
                    markupPct: updatedCrop.defaultMarkupPct,
                    costAllocations: cloneCostAllocations(updatedCrop.defaultCostSelections, true)
                  }
                : state.draft
          };
        }),
      setDraft: (patch) =>
        set((state) => {
          const selectedCrop =
            state.crops.find((crop) => crop.id === (patch.cropId ?? state.draft.cropId)) ??
            state.crops.find((crop) => crop.id === state.draft.cropId);

          if (patch.cropId && selectedCrop) {
            const baseDraft = buildPlanDraftFromCrop(selectedCrop);
            return {
              draft: syncPlanDraftPurchase(baseDraft, {
                ...patch,
                cropId: selectedCrop.id,
                costAllocations: patch.costAllocations ?? cloneCostAllocations(baseDraft.costAllocations, true)
              })
            };
          }

          const nextDraft = syncPlanDraftPurchase(state.draft, patch);
          return {
            draft: syncSalesSettings({
              ...nextDraft,
              costAllocations: patch.costAllocations
                ? patch.costAllocations.map(normalizeCultivationCostAllocation)
                : state.draft.costAllocations
            })
          };
        }),
      setPlanCostAllocations: (allocations) =>
        set((state) => {
          return {
            draft: {
              ...state.draft,
              costAllocations: allocations.map(normalizeCultivationCostAllocation)
            }
          };
        }),
      togglePlanCostAllocation: (id) =>
        set((state) => {
          return {
            draft: {
              ...state.draft,
              costAllocations: state.draft.costAllocations.map((allocation) =>
                allocation.id === id ? { ...allocation, enabled: !allocation.enabled } : allocation
              )
            }
          };
        }),
      addManualPlanCostAllocation: () =>
        set((state) => {
          return {
            draft: {
              ...state.draft,
              costAllocations: [...state.draft.costAllocations, buildManualAllocation()]
            }
          };
        }),
      hydratePlanCostsFromCrop: (cropId) =>
        set((state) => {
          const crop = state.crops.find((entry) => entry.id === cropId);
          if (!crop) return state;
          return {
            draft: {
              ...state.draft,
              cropId,
              costAllocations: cloneCostAllocations(crop.defaultCostSelections, true)
            }
          };
        }),
      syncPlanLinkedCostsFromCrop: (cropId) =>
        set((state) => {
          const crop = state.crops.find((entry) => entry.id === cropId);
          if (!crop) return state;
          const nonInherited = state.draft.costAllocations.filter((allocation) => !allocation.inheritedFromCrop);
          return {
            draft: {
              ...state.draft,
              cropId,
              costAllocations: [...cloneCostAllocations(crop.defaultCostSelections, true), ...nonInherited.map(normalizeCultivationCostAllocation)]
            }
          };
        }),
      clearDraft: (cropId) => {
        const crop = get().crops.find((entry) => entry.id === cropId) ?? get().crops[0];
        set({ draft: buildPlanDraftFromCrop(crop) });
      },
      addPlanFromDraft: () => {
        const state = get();
        const draft = state.draft;
        const crop = state.crops.find((entry) => entry.id === draft.cropId);
        if (!crop) return null;

        const newPlan = hydratePlan(crop, {
          id: createId(),
          cropId: draft.cropId,
          areaTotalSqm: draft.areaTotalSqm,
          bedCount: draft.bedCount,
          bedLengthM: draft.bedLengthM,
          bedWidthM: draft.bedWidthM,
          plantSpacingCm: draft.plantSpacingCm,
          rowSpacingCm: draft.rowSpacingCm,
          cycleDays: draft.cycleDays,
          expectedLossRate: draft.expectedLossRate,
          purchasePackType: draft.purchasePackType,
          unitsPerPurchasePack: draft.unitsPerPurchasePack,
          purchasePackCostCents: draft.purchasePackCostCents,
          salesUnit: draft.salesUnit,
          unitsPerSalesBox: draft.unitsPerSalesBox,
          markupPct: draft.markupPct,
          staggeredProduction: draft.staggeredProduction,
          targetChannelMix: draft.targetChannelMix,
          costAllocations: draft.costAllocations.map(normalizeCultivationCostAllocation),
          notes: draft.notes,
          status: draft.status
        });

        const result = CropPlanSchema.safeParse(newPlan);
        if (!result.success) {
          console.error('Validation failed for addPlanFromDraft:', result.error.format());
          return null;
        }

        useSyncQueueStore.getState().enqueue({
          table: 'crop_plans',
          action: 'INSERT',
          payload: newPlan
        });

        set((current) => ({
          plans: [...current.plans, newPlan],
          draft: buildPlanDraftFromCrop(crop)
        }));

        return newPlan.id;
      },
      updatePlan: (id, patch) =>
        set((state) => {
          const currentPlan = state.plans.find((plan) => plan.id === id);
          if (!currentPlan) return state;

          const nextCropId = patch.cropId ?? currentPlan.cropId;
          const crop = state.crops.find((entry) => entry.id === nextCropId);
          if (!crop) return state;

          const next = hydratePlan(crop, {
            ...currentPlan,
            ...patch,
            cropId: nextCropId,
            costAllocations: (patch.costAllocations ?? currentPlan.costAllocations).map(normalizeCultivationCostAllocation)
          });

          const result = CropPlanSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updatePlan:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'crop_plans',
            action: 'UPDATE',
            payload: next
          });

          return {
            plans: state.plans.map((plan) => (plan.id === id ? next : plan))
          };
        }),
      updateBed: (id, patch) =>
        set((state) => {
          const target = state.beds.find(b => b.id === id);
          if (!target) return state;

          const next = { ...target, ...patch };
          const result = BedSchema.safeParse(next);
          if (!result.success) {
            console.error('Validation failed for updateBed:', result.error.format());
            return state;
          }

          useSyncQueueStore.getState().enqueue({
            table: 'beds',
            action: 'UPDATE',
            payload: next
          });

          return { beds: state.beds.map((bed) => (bed.id === id ? next : bed)) };
        })
    }),
    {
      name: 'dunamis-farm-os-production-planning-v3',
      version: 4,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const state = persistedState as Partial<ProductionPlanningState> | undefined;
        const crops = (state?.crops ?? []).map((crop) => normalizePersistedCrop(crop as Crop));
        const plans = (state?.plans ?? []).map((plan) => normalizePersistedPlan(plan as CropPlan));
        const cultureDraft = syncCultureDraftPurchase(defaultCultureDraft(), {
          ...(state?.cultureDraft as Partial<CultureDraft> | undefined),
          defaultCostSelections: ((state?.cultureDraft as Partial<CultureDraft> | undefined)?.defaultCostSelections ?? []).map(normalizeCultivationCostAllocation)
        });
          const draftBase = buildPlanDraftFromCrop(crops[0]);
        const draft = syncSalesSettings(syncPlanDraftPurchase(draftBase, {
          ...(state?.draft as Partial<CropPlanDraft> | undefined),
          costAllocations: ((state?.draft as Partial<CropPlanDraft> | undefined)?.costAllocations ?? []).map((allocation) =>
            normalizeCultivationCostAllocation({
              ...allocation,
              label: allocation.label ?? allocation.category ?? 'Custo manual'
            })
          )
        }));

        return {
          crops,
          beds: state?.beds ?? [],
          plans,
          cultureDraft,
          draft
        } satisfies Partial<ProductionPlanningState>;
      }
    }
  )
);
