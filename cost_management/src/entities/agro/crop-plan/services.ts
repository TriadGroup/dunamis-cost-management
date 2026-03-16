import type { Bed } from '@/entities/agro/bed/types';
import type { Crop } from '@/entities/agro/crop/types';
import type {
  AllocationMode,
  CostSourceType,
  CropPlan,
  CultivationCostAllocation,
  ProductionContinuity
} from '@/entities/agro/crop-plan/types';
import type { DemandChannel } from '@/entities/agro/demand-channel/types';
import type { CostItem } from '@/entities/finance/cost-item/types';
import type { PurchaseItem } from '@/entities/finance/purchase/types';

const safe = (value: number): number => (Number.isFinite(value) ? value : 0);
const money = (value: number): number => Math.max(0, Math.round(safe(value)));

export interface ProductionPlanComputationInput {
  areaTotalSqm: number;
  bedCount: number;
  bedLengthM: number;
  bedWidthM: number;
  plantSpacingCm: number;
  rowSpacingCm: number;
  expectedLossRate: number;
  unitsPerPurchasePack: number;
  purchasePackCostCents: number;
  markupPct: number;
  unitsPerSalesBox: number;
  costAllocations: CultivationCostAllocation[];
  resolvedCostAllocations?: CultivationCostAllocation[];
}

export interface ProductionPlanMetrics {
  bedAreaSqm: number;
  totalBedsAreaSqm: number;
  areaTotalSqm: number;
  bedCount: number;
  theoreticalUnits: number;
  viableUnits: number;
  packsNeeded: number;
  purchasedUnits: number;
  remainingUnitsFromPacks: number;
  purchaseCostTotalCents: number;
  extraCostTotalCents: number;
  costTotalCents: number;
  costPerBedCents: number;
  costPerUnitCents: number;
  costPerSalesBoxCents: number;
  suggestedSalePricePerUnitCents: number;
  suggestedSalePricePerBoxCents: number;
  estimatedProfitPerUnitCents: number;
  estimatedProfitPerBoxCents: number;
}

export const calculateBedArea = (bedLengthM: number, bedWidthM: number): number => {
  return Math.max(0, safe(bedLengthM)) * Math.max(0, safe(bedWidthM));
};

export const estimateBedCountFromArea = (areaTotalSqm: number, bedAreaSqm: number): number => {
  if (bedAreaSqm <= 0) return 0;
  return Math.max(1, Math.ceil(Math.max(0, safe(areaTotalSqm)) / bedAreaSqm));
};

export const calculateTheoreticalUnits = (
  areaSqm: number,
  plantSpacingCm: number,
  rowSpacingCm: number
): number => {
  const plantSpacingM = Math.max(0.0001, safe(plantSpacingCm) / 100);
  const rowSpacingM = Math.max(0.0001, safe(rowSpacingCm) / 100);
  const areaPerUnit = plantSpacingM * rowSpacingM;
  return Math.max(0, Math.floor(Math.max(0, safe(areaSqm)) / areaPerUnit));
};

const buildFinancialAllocationValue = (eventValueCents: number, monthlyEquivalentCents: number): number => {
  return money(eventValueCents > 0 ? eventValueCents : monthlyEquivalentCents);
};

export const normalizeCultivationCostAllocation = (
  allocation: Partial<CultivationCostAllocation> & Pick<CultivationCostAllocation, 'id'>
): CultivationCostAllocation => ({
  id: allocation.id,
  sourceType: (allocation.sourceType ?? 'manual') as CostSourceType,
  sourceId: allocation.sourceId ?? null,
  label: allocation.label ?? allocation.category ?? 'Custo manual',
  category: allocation.category ?? 'Manual',
  costValueCents: money(allocation.costValueCents ?? 0),
  allocationMode: (allocation.allocationMode ?? 'total') as AllocationMode,
  allocatedPerBedCents: money(allocation.allocatedPerBedCents ?? 0),
  allocatedPerUnitCents: money(allocation.allocatedPerUnitCents ?? 0),
  inheritedFromCrop: allocation.inheritedFromCrop ?? false,
  enabled: allocation.enabled ?? true
});

export const resolveAllocationValueCents = (
  allocation: CultivationCostAllocation,
  costItems: CostItem[],
  purchases: PurchaseItem[]
): number => {
  const normalized = normalizeCultivationCostAllocation(allocation);

  if (normalized.sourceType === 'manual') {
    if (normalized.allocationMode === 'per_bed') {
      return money(normalized.allocatedPerBedCents || normalized.costValueCents);
    }

    if (normalized.allocationMode === 'per_unit') {
      return money(normalized.allocatedPerUnitCents || normalized.costValueCents);
    }

    return money(normalized.costValueCents);
  }

  if (normalized.sourceType === 'cost_item') {
    const item = costItems.find((entry) => entry.id === normalized.sourceId);
    if (!item) return 0;
    const baseValue = buildFinancialAllocationValue(item.eventValueCents, item.monthlyEquivalentCents);

    if (normalized.allocationMode === 'per_bed') {
      return money(normalized.allocatedPerBedCents || normalized.costValueCents || baseValue);
    }

    if (normalized.allocationMode === 'per_unit') {
      return money(normalized.allocatedPerUnitCents || normalized.costValueCents || baseValue);
    }

    return money(normalized.costValueCents || baseValue);
  }

  const purchase = purchases.find((entry) => entry.id === normalized.sourceId);
  if (!purchase) return 0;
  const baseValue = buildFinancialAllocationValue(purchase.eventValueCents, purchase.monthlyEquivalentCents);

  if (normalized.allocationMode === 'per_bed') {
    return money(normalized.allocatedPerBedCents || normalized.costValueCents || baseValue);
  }

  if (normalized.allocationMode === 'per_unit') {
    return money(normalized.allocatedPerUnitCents || normalized.costValueCents || baseValue);
  }

  return money(normalized.costValueCents || baseValue);
};

export const buildCropCostSelectionDefaults = (
  cropId: string,
  costItems: CostItem[],
  purchases: PurchaseItem[]
): CultivationCostAllocation[] => {
  const linkedCosts = costItems
    .filter((item) => item.linkedCropId === cropId)
    .map((item) =>
      normalizeCultivationCostAllocation({
        id: `cost-item-${item.id}`,
        sourceType: 'cost_item',
        sourceId: item.id,
        label: item.name,
        category: item.category,
        costValueCents: buildFinancialAllocationValue(item.eventValueCents, item.monthlyEquivalentCents),
        allocationMode: 'total',
        inheritedFromCrop: true,
        enabled: true
      })
    );

  const linkedPurchases = purchases
    .filter((item) => item.linkedCropId === cropId)
    .map((item) =>
      normalizeCultivationCostAllocation({
        id: `purchase-item-${item.id}`,
        sourceType: 'purchase_item',
        sourceId: item.id,
        label: item.name,
        category: item.category,
        costValueCents: buildFinancialAllocationValue(item.eventValueCents, item.monthlyEquivalentCents),
        allocationMode: 'total',
        inheritedFromCrop: true,
        enabled: true
      })
    );

  return [...linkedCosts, ...linkedPurchases];
};

const calculateAllocationTotal = (
  allocation: CultivationCostAllocation,
  bedCount: number,
  viableUnits: number
): number => {
  const normalized = normalizeCultivationCostAllocation(allocation);
  if (!normalized.enabled) return 0;

  if (normalized.allocationMode === 'per_bed') {
    return money((normalized.allocatedPerBedCents || normalized.costValueCents) * Math.max(1, bedCount));
  }

  if (normalized.allocationMode === 'per_unit') {
    return money((normalized.allocatedPerUnitCents || normalized.costValueCents) * Math.max(1, viableUnits));
  }

  return money(normalized.costValueCents);
};

export const calculateProductionPlanMetrics = (input: ProductionPlanComputationInput): ProductionPlanMetrics => {
  const bedAreaSqm = calculateBedArea(input.bedLengthM, input.bedWidthM);
  const derivedBedCount =
    input.bedCount > 0
      ? Math.max(1, Math.round(input.bedCount))
      : estimateBedCountFromArea(input.areaTotalSqm, bedAreaSqm);

  const totalBedsAreaSqm = bedAreaSqm * Math.max(1, derivedBedCount);
  const areaTotalSqm = input.areaTotalSqm > 0 ? input.areaTotalSqm : totalBedsAreaSqm;
  const theoreticalUnits = calculateTheoreticalUnits(areaTotalSqm, input.plantSpacingCm, input.rowSpacingCm);
  const viableUnits = Math.max(0, Math.floor(theoreticalUnits * (1 - Math.max(0, safe(input.expectedLossRate)) / 100)));
  const unitsPerPurchasePack = Math.max(1, Math.round(safe(input.unitsPerPurchasePack)));
  const packsNeeded = Math.max(0, Math.ceil(theoreticalUnits / unitsPerPurchasePack));
  const purchasedUnits = packsNeeded * unitsPerPurchasePack;
  const remainingUnitsFromPacks = Math.max(0, purchasedUnits - theoreticalUnits);
  const purchaseCostTotalCents = money(packsNeeded * input.purchasePackCostCents);
  const sourceAllocations = (input.resolvedCostAllocations ?? input.costAllocations).map(normalizeCultivationCostAllocation);
  const extraCostTotalCents = sourceAllocations.reduce(
    (acc, allocation) => acc + calculateAllocationTotal(allocation, derivedBedCount, viableUnits),
    0
  );
  const costTotalCents = purchaseCostTotalCents + extraCostTotalCents;
  const costPerBedCents = derivedBedCount > 0 ? Math.round(costTotalCents / derivedBedCount) : 0;
  const costPerUnitCents = viableUnits > 0 ? Math.round(costTotalCents / viableUnits) : 0;
  const boxUnits = Math.max(0, Math.round(safe(input.unitsPerSalesBox)));
  const costPerSalesBoxCents = boxUnits > 0 ? costPerUnitCents * boxUnits : 0;
  const suggestedSalePricePerUnitCents = Math.round(costPerUnitCents * (1 + Math.max(0, safe(input.markupPct)) / 100));
  const suggestedSalePricePerBoxCents = boxUnits > 0 ? suggestedSalePricePerUnitCents * boxUnits : 0;
  const estimatedProfitPerUnitCents = suggestedSalePricePerUnitCents - costPerUnitCents;
  const estimatedProfitPerBoxCents = boxUnits > 0 ? suggestedSalePricePerBoxCents - costPerSalesBoxCents : 0;

  return {
    bedAreaSqm,
    totalBedsAreaSqm,
    areaTotalSqm,
    bedCount: derivedBedCount,
    theoreticalUnits,
    viableUnits,
    packsNeeded,
    purchasedUnits,
    remainingUnitsFromPacks,
    purchaseCostTotalCents,
    extraCostTotalCents,
    costTotalCents,
    costPerBedCents,
    costPerUnitCents,
    costPerSalesBoxCents,
    suggestedSalePricePerUnitCents,
    suggestedSalePricePerBoxCents,
    estimatedProfitPerUnitCents,
    estimatedProfitPerBoxCents
  };
};

const countCostSelections = (costAllocations: CultivationCostAllocation[]) => {
  const activeAllocations = costAllocations.map(normalizeCultivationCostAllocation).filter((allocation) => allocation.enabled);

  return {
    inheritedCostSelectionCount: activeAllocations.filter((allocation) => allocation.inheritedFromCrop).length,
    manualCostSelectionCount: activeAllocations.filter((allocation) => allocation.sourceType === 'manual').length,
    linkedCostSelectionCount: activeAllocations.filter((allocation) => allocation.sourceType !== 'manual').length
  };
};

export const createProductionPlanFromCulture = (crop: Crop, patch: Partial<CropPlan>): CropPlan => {
  const normalizedCostAllocations = (patch.costAllocations ?? crop.defaultCostSelections ?? []).map(normalizeCultivationCostAllocation);
  const metrics = calculateProductionPlanMetrics({
    areaTotalSqm: patch.areaTotalSqm ?? patch.plannedAreaSqm ?? 0,
    bedCount: patch.bedCount ?? patch.plannedBeds ?? 0,
    bedLengthM: patch.bedLengthM ?? crop.defaultBedLengthM,
    bedWidthM: patch.bedWidthM ?? crop.defaultBedWidthM,
    plantSpacingCm: patch.plantSpacingCm ?? crop.defaultPlantSpacingCm,
    rowSpacingCm: patch.rowSpacingCm ?? crop.defaultRowSpacingCm,
    expectedLossRate: patch.expectedLossRate ?? crop.defaultLossRate,
    unitsPerPurchasePack: patch.unitsPerPurchasePack ?? crop.unitsPerPurchasePack,
    purchasePackCostCents: patch.purchasePackCostCents ?? crop.purchasePackCostCents,
    markupPct: patch.markupPct ?? crop.defaultMarkupPct,
    unitsPerSalesBox: patch.unitsPerSalesBox ?? crop.unitsPerSalesBox,
    costAllocations: normalizedCostAllocations
  });

  const counts = countCostSelections(normalizedCostAllocations);

  return {
    id: patch.id || '',
    cropId: crop.id,
    targetChannelMix: patch.targetChannelMix ?? {},
    seasonLabel: patch.seasonLabel ?? new Date().toISOString().slice(0, 7),
    plannedAreaSqm: metrics.areaTotalSqm,
    plannedBeds: metrics.bedCount,
    areaTotalSqm: metrics.areaTotalSqm,
    areaNodeIds: patch.areaNodeIds ?? [],
    bedCount: metrics.bedCount,
    bedLengthM: patch.bedLengthM ?? crop.defaultBedLengthM,
    bedWidthM: patch.bedWidthM ?? crop.defaultBedWidthM,
    bedAreaSqm: metrics.bedAreaSqm,
    totalBedsAreaSqm: metrics.totalBedsAreaSqm,
    plantSpacingCm: patch.plantSpacingCm ?? crop.defaultPlantSpacingCm,
    rowSpacingCm: patch.rowSpacingCm ?? crop.defaultRowSpacingCm,
    theoreticalUnits: metrics.theoreticalUnits,
    cycleDays: patch.cycleDays ?? crop.cycleDays,
    staggeredProduction: patch.staggeredProduction ?? true,
    expectedLossRate: patch.expectedLossRate ?? crop.defaultLossRate,
    viableUnits: metrics.viableUnits,
    purchasePackType: patch.purchasePackType ?? crop.purchaseType,
    unitsPerPurchasePack: patch.unitsPerPurchasePack ?? crop.unitsPerPurchasePack,
    purchasePackCostCents: patch.purchasePackCostCents ?? crop.purchasePackCostCents,
    packsNeeded: metrics.packsNeeded,
    purchasedUnits: metrics.purchasedUnits,
    remainingUnitsFromPacks: metrics.remainingUnitsFromPacks,
    salesUnit: patch.salesUnit ?? crop.salesUnit,
    unitsPerSalesBox: patch.unitsPerSalesBox ?? crop.unitsPerSalesBox,
    markupPct: patch.markupPct ?? crop.defaultMarkupPct,
    costAllocations: normalizedCostAllocations,
    inheritedCostSelectionCount: counts.inheritedCostSelectionCount,
    manualCostSelectionCount: counts.manualCostSelectionCount,
    linkedCostSelectionCount: counts.linkedCostSelectionCount,
    costTotalCents: metrics.costTotalCents,
    appropriatedCostCents: patch.appropriatedCostCents ?? 0,
    costPerBedCents: metrics.costPerBedCents,
    costPerUnitCents: metrics.costPerUnitCents,
    costPerSalesBoxCents: metrics.costPerSalesBoxCents,
    minimumSalePricePerUnitCents: metrics.costPerUnitCents,
    suggestedSalePricePerUnitCents: metrics.suggestedSalePricePerUnitCents,
    suggestedSalePricePerBoxCents: metrics.suggestedSalePricePerBoxCents,
    estimatedProfitPerUnitCents: metrics.estimatedProfitPerUnitCents,
    estimatedProfitPerBoxCents: metrics.estimatedProfitPerBoxCents,
    expectedYieldKg: patch.expectedYieldKg ?? 0,
    expectedYieldUnits: metrics.viableUnits,
    marketableUnits: patch.marketableUnits ?? metrics.viableUnits,
    actualHarvestedUnits: patch.actualHarvestedUnits ?? 0,
    actualSoldUnits: patch.actualSoldUnits ?? 0,
    actualInternalUnits: patch.actualInternalUnits ?? 0,
    actualDiscardedUnits: patch.actualDiscardedUnits ?? 0,
    plannedOnly: patch.plannedOnly ?? true,
    notes: patch.notes ?? '',
    status: patch.status ?? 'rascunho'
  };
};

export const calculateProductionContinuity = (
  plan: CropPlan,
  beds: Bed[],
  channels: DemandChannel[]
): ProductionContinuity => {
  const activeBeds = beds.filter((bed) => !bed.activeCropPlanId || bed.activeCropPlanId === plan.id);
  const bedCount = Math.max(1, plan.bedCount || activeBeds.length || plan.plannedBeds || 1);
  const totalBedArea = plan.totalBedsAreaSqm > 0 ? plan.totalBedsAreaSqm : activeBeds.reduce((acc, bed) => acc + Math.max(0, safe(bed.sizeSqm)), 0);
  const capacityPerBedUnits = plan.viableUnits > 0 ? Math.round(plan.viableUnits / bedCount) : 0;
  const capacityPerBedKg = plan.expectedYieldKg > 0 ? plan.expectedYieldKg / bedCount : 0;

  const totalDemandUnits = channels
    .filter((entry) => entry.enabled)
    .reduce((acc, entry) => {
      const baseDemand = Math.max(0, safe(entry.baselineDemand ?? 0));
      if (entry.pricingMode === 'box') {
        return acc + Math.round(baseDemand * Math.max(1, plan.unitsPerSalesBox || 1));
      }

      if (entry.pricingMode === 'unit') {
        return acc + Math.round(baseDemand);
      }

      return acc;
    }, 0);

  const cycleFactor = Math.max(1, Math.round(Math.max(1, plan.cycleDays) / 30));
  const referenceUnits = capacityPerBedUnits > 0 ? capacityPerBedUnits : Math.max(1, Math.round(plan.theoreticalUnits / bedCount));
  const requiredBedsNoBreak =
    totalDemandUnits > 0
      ? Math.max(1, Math.ceil((totalDemandUnits * cycleFactor) / Math.max(1, referenceUnits)))
      : Math.max(1, plan.bedCount || plan.plannedBeds || 1);

  let ruptureRisk: ProductionContinuity['ruptureRisk'] = 'low';
  if (requiredBedsNoBreak > bedCount) ruptureRisk = 'high';
  else if (requiredBedsNoBreak > bedCount * 0.8) ruptureRisk = 'medium';

  if (totalBedArea <= 0 || referenceUnits <= 0) {
    ruptureRisk = 'high';
  }

  return {
    capacityPerBedKg,
    capacityPerBedUnits: referenceUnits,
    requiredBedsNoBreak,
    ruptureRisk
  };
};

export const calculateProjectionReliability = (plan: CropPlan): { score: number; status: 'baixa' | 'media' | 'alta' } => {
  let score = 0;
  if (plan.areaTotalSqm > 0) score += 20;
  if (plan.bedCount > 0) score += 15;
  if (plan.theoreticalUnits > 0) score += 20;
  if (plan.viableUnits > 0) score += 15;
  if (plan.costTotalCents > 0) score += 15;
  if (plan.suggestedSalePricePerUnitCents > 0) score += 15;

  if (score < 60) return { score, status: 'baixa' };
  if (score < 90) return { score, status: 'media' };
  return { score, status: 'alta' };
};
