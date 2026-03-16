import type { CropPurchaseType, CropUnitType } from '@/entities/agro/crop/types';

export type CostSourceType = 'cost_item' | 'purchase_item' | 'manual';
export type AllocationMode = 'total' | 'per_bed' | 'per_unit';

export interface CostSourceReference {
  sourceType: CostSourceType;
  sourceId: string | null;
}

export interface CultivationCostAllocation {
  id: string;
  sourceType: CostSourceType;
  sourceId: string | null;
  label: string;
  category: string;
  costValueCents: number;
  allocationMode: AllocationMode;
  allocatedPerBedCents: number;
  allocatedPerUnitCents: number;
  inheritedFromCrop: boolean;
  enabled: boolean;
}

export interface CropPlan {
  id: string;
  cropId: string;
  targetChannelMix: Record<string, number>;
  seasonLabel: string;
  plannedAreaSqm: number;
  plannedBeds: number;
  areaTotalSqm: number;
  areaNodeIds: string[];
  bedCount: number;
  bedLengthM: number;
  bedWidthM: number;
  bedAreaSqm: number;
  totalBedsAreaSqm: number;
  plantSpacingCm: number;
  rowSpacingCm: number;
  theoreticalUnits: number;
  cycleDays: number;
  staggeredProduction: boolean;
  expectedLossRate: number;
  viableUnits: number;
  purchasePackType: CropPurchaseType;
  unitsPerPurchasePack: number;
  purchasePackCostCents: number;
  packsNeeded: number;
  purchasedUnits: number;
  remainingUnitsFromPacks: number;
  salesUnit: CropUnitType;
  unitsPerSalesBox: number;
  markupPct: number;
  costAllocations: CultivationCostAllocation[];
  inheritedCostSelectionCount: number;
  manualCostSelectionCount: number;
  linkedCostSelectionCount: number;
  costTotalCents: number;
  appropriatedCostCents: number;
  costPerBedCents: number;
  costPerUnitCents: number;
  costPerSalesBoxCents: number;
  minimumSalePricePerUnitCents: number;
  suggestedSalePricePerUnitCents: number;
  suggestedSalePricePerBoxCents: number;
  estimatedProfitPerUnitCents: number;
  estimatedProfitPerBoxCents: number;
  expectedYieldKg: number;
  expectedYieldUnits: number;
  marketableUnits: number;
  actualHarvestedUnits: number;
  actualSoldUnits: number;
  actualInternalUnits: number;
  actualDiscardedUnits: number;
  plannedOnly?: boolean;
  notes?: string;
  status: 'rascunho' | 'ativo' | 'pausado';
}

export interface ProductionContinuity {
  capacityPerBedKg: number;
  capacityPerBedUnits: number;
  requiredBedsNoBreak: number;
  ruptureRisk: 'low' | 'medium' | 'high';
}
