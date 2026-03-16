import type { CostItem } from '@/entities/finance/cost-item/types';
import type { PurchaseItem } from '@/entities/finance/purchase/types';
import type { DemandChannel } from '@/entities/agro/demand-channel/types';
import type { Crop } from '@/entities/agro/crop/types';
import type { CropPlan } from '@/entities/agro/crop-plan/types';
import type { ChannelMargin, UnitEconomicsRow } from '@/entities/agro/unit-economics/types';
import { calculateProductionPlanMetrics, normalizeCultivationCostAllocation, resolveAllocationValueCents } from '@/entities/agro/crop-plan/services';

const safe = (value: number | undefined): number => (Number.isFinite(value) ? (value as number) : 0);
const money = (value: number | undefined): number => Math.max(0, Math.round(safe(value)));
const demandValue = (channel: DemandChannel): number => Math.max(0, safe(channel.scenarioDemand ?? 0));

const unitLabelFromSalesUnit = (salesUnit: Crop['salesUnit']): string => {
  switch (salesUnit) {
    case 'muda':
      return 'muda';
    case 'unidade':
      return 'unidade';
    case 'caixa':
      return 'caixa';
    case 'maco':
      return 'maço';
    case 'cabeca':
      return 'cabeça';
    case 'pe':
      return 'pé';
    case 'bandeja':
      return 'bandeja';
    case 'kg':
      return 'kg';
    default:
      return 'unidade';
  }
};

export const calculateUnitEconomics = (
  crops: Crop[],
  cropPlans: CropPlan[],
  costItems: CostItem[],
  purchases: PurchaseItem[],
  channels: DemandChannel[]
): {
  rows: UnitEconomicsRow[];
  marginByChannel: ChannelMargin[];
} => {
  const rows: UnitEconomicsRow[] = cropPlans.map((plan) => {
    const crop = crops.find((entry) => entry.id === plan.cropId);
    const normalizedCostAllocations = plan.costAllocations.map((allocation) => normalizeCultivationCostAllocation(allocation));
    const resolvedCostAllocations = normalizedCostAllocations
      .map((allocation) => ({
        ...allocation,
        costValueCents: resolveAllocationValueCents(allocation, costItems, purchases)
      }))
      .filter((allocation) => allocation.enabled && (allocation.sourceType === 'manual' || allocation.costValueCents > 0));

    const metrics = calculateProductionPlanMetrics({
      areaTotalSqm: plan.areaTotalSqm,
      bedCount: plan.bedCount,
      bedLengthM: plan.bedLengthM,
      bedWidthM: plan.bedWidthM,
      plantSpacingCm: plan.plantSpacingCm,
      rowSpacingCm: plan.rowSpacingCm,
      expectedLossRate: plan.expectedLossRate,
      unitsPerPurchasePack: plan.unitsPerPurchasePack,
      purchasePackCostCents: plan.purchasePackCostCents,
      markupPct: plan.markupPct,
      unitsPerSalesBox: plan.unitsPerSalesBox,
      costAllocations: normalizedCostAllocations,
      resolvedCostAllocations
    });

    const manualCostCents = resolvedCostAllocations
      .filter((allocation) => allocation.sourceType === 'manual')
      .reduce((acc, allocation) => acc + money(allocation.costValueCents), 0);

    const purchaseSelectionCostCents = resolvedCostAllocations
      .filter((allocation) => allocation.sourceType === 'purchase_item')
      .reduce((acc, allocation) => acc + money(allocation.costValueCents), 0);
    const totalCostCents = plan.plannedOnly === false ? money(plan.appropriatedCostCents) : metrics.costTotalCents;
    const marketableUnits = Math.max(0, money(plan.marketableUnits || plan.viableUnits || metrics.viableUnits));
    const costPerUnitCents =
      marketableUnits > 0
        ? Math.round(totalCostCents / marketableUnits)
        : money(plan.costPerUnitCents || metrics.costPerUnitCents);
    const minimumSalePricePerUnitCents = money(plan.minimumSalePricePerUnitCents || costPerUnitCents);
    const suggestedSalePricePerUnitCents = money(
      plan.suggestedSalePricePerUnitCents || Math.round(costPerUnitCents * (1 + Math.max(0, safe(plan.markupPct)) / 100))
    );

    const salesBundleUnits = Math.max(0, plan.unitsPerSalesBox || crop?.unitsPerSalesBox || 0);

    return {
      cropId: plan.cropId,
      cropName: crop?.name || 'Cultura',
      cropVariety: crop?.variety || '',
      unitLabel: unitLabelFromSalesUnit(plan.salesUnit || crop?.salesUnit || 'unidade'),
      purchasedCostCents: metrics.purchaseCostTotalCents,
      stockUsedCostCents: purchaseSelectionCostCents,
      appliedCostCents: plan.plannedOnly ? 0 : Math.max(0, totalCostCents - metrics.purchaseCostTotalCents - manualCostCents),
      appropriatedCostCents: money(plan.appropriatedCostCents),
      laborCostCents: 0,
      machineryCostCents: 0,
      utilityCostCents: 0,
      totalCostCents,
      yieldKg: Math.max(0, safe(plan.expectedYieldKg)),
      yieldUnits: Math.max(0, safe(plan.theoreticalUnits || plan.expectedYieldUnits || metrics.theoreticalUnits)),
      viableUnits: Math.max(0, safe(plan.viableUnits || plan.expectedYieldUnits || metrics.viableUnits)),
      marketableUnits,
      yieldBoxes: salesBundleUnits > 0 ? Math.max(0, Math.ceil(marketableUnits / salesBundleUnits)) : 0,
      costPerKgCents: plan.expectedYieldKg > 0 ? Math.round(totalCostCents / Math.max(1, plan.expectedYieldKg)) : 0,
      costPerUnitCents,
      costPerBoxCents: salesBundleUnits > 0 ? costPerUnitCents * salesBundleUnits : 0,
      minimumSalePricePerUnitCents,
      suggestedSalePricePerUnitCents,
      suggestedSalePricePerBoxCents: salesBundleUnits > 0 ? suggestedSalePricePerUnitCents * salesBundleUnits : 0,
      estimatedProfitPerUnitCents: suggestedSalePricePerUnitCents - costPerUnitCents,
      estimatedProfitPerBoxCents: salesBundleUnits > 0 ? suggestedSalePricePerUnitCents * salesBundleUnits - costPerUnitCents * salesBundleUnits : 0,
      unitsPerSalesBox: salesBundleUnits,
      salesUnit: plan.salesUnit,
      plannedOnly: plan.plannedOnly ?? true
    };
  });

  const totalOperationCost = rows.reduce((acc, row) => acc + row.totalCostCents, 0);
  const totalScenarioVolume = Math.max(1, channels.reduce((acc, entry) => acc + demandValue(entry), 0));

  const marginByChannel: ChannelMargin[] = channels
    .filter((channel) => channel.enabled)
    .map((channel) => {
      const scenarioVolume = demandValue(channel);
      const channelCostCents = Math.round(totalOperationCost * (scenarioVolume / totalScenarioVolume));
      let unitPrice = money(channel.acceptedPriceCents ?? channel.transferPriceCents ?? 0);
      if (channel.items && channel.items.length > 0) {
        unitPrice = channel.items.reduce((sum, item) => sum + safe(item.acceptedPriceCents), 0);
      }
      
      const channelRevenue = Math.round(unitPrice * scenarioVolume);
      const marginCents = channelRevenue - channelCostCents;

      return {
        channelId: channel.id,
        channelName: channel.name,
        costCents: channelCostCents,
        revenueCents: channelRevenue,
        marginCents,
        marginPct: channelRevenue > 0 ? (marginCents / channelRevenue) * 100 : 0
      };
    });

  return { rows, marginByChannel };
};

export const calculateAgroReturn = (
  channels: DemandChannel[],
  monthlyOperationCostCents: number,
  implantationCommittedCents: number
): {
  internalRevenueCents: number;
  externalRevenueCents: number;
  totalReturnCents: number;
  paybackMonths: number | null;
} => {
  const internalRevenueCents = channels
    .filter((entry) => entry.enabled && entry.type === 'kitchen')
    .reduce(
      (acc, channel) => {
        let unitPrice = money(channel.acceptedPriceCents ?? channel.transferPriceCents ?? 0);
        if (channel.items && channel.items.length > 0) {
          unitPrice = channel.items.reduce((sum, item) => sum + safe(item.acceptedPriceCents), 0);
        }
        return acc + Math.round(demandValue(channel) * unitPrice);
      },
      0
    );

  const externalRevenueCents = channels
    .filter((entry) => entry.enabled && entry.type !== 'kitchen')
    .reduce(
      (acc, channel) => {
        let unitPrice = money(channel.acceptedPriceCents ?? channel.transferPriceCents ?? 0);
        if (channel.items && channel.items.length > 0) {
          unitPrice = channel.items.reduce((sum, item) => sum + safe(item.acceptedPriceCents), 0);
        }
        return acc + Math.round(demandValue(channel) * unitPrice);
      },
      0
    );

  const totalReturnCents = internalRevenueCents + externalRevenueCents - money(monthlyOperationCostCents);
  const paybackMonths = totalReturnCents > 0 ? Number((money(implantationCommittedCents) / totalReturnCents).toFixed(1)) : null;

  return {
    internalRevenueCents,
    externalRevenueCents,
    totalReturnCents,
    paybackMonths
  };
};
