const safe = (value: number, fallback = 0): number => (Number.isFinite(value) ? value : fallback);
const money = (value: number): number => Math.max(0, Math.round(safe(value)));

const buildMonthLabel = (offset: number): string => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() + offset);
  return new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date).replace('.', '');
};

export interface GrowthProjectionBaseline {
  cropName: string;
  unitLabel: string;
  baseAreaSqm: number;
  baseBeds: number;
  baseCycleDays: number;
  baseMonthlyUnits: number;
  baseCostPerUnitCents: number;
  basePricePerUnitCents: number;
  baseLossRate: number;
}

export interface GrowthProjectionScenario {
  startingAreaSqm: number;
  monthlyGrowthPct: number;
  productivityGainPct: number;
  expectedLossRate: number;
  costAdjustmentPct: number;
  priceAdjustmentPct: number;
}

export interface GrowthProjectionPoint {
  monthIndex: number;
  monthLabel: string;
  areaSqm: number;
  units: number;
  totalCostCents: number;
  totalRevenueCents: number;
  totalProfitCents: number;
  cumulativeCostCents: number;
  cumulativeRevenueCents: number;
  cumulativeProfitCents: number;
  marginPct: number;
}

export interface GrowthProjectionSummary {
  horizonMonths: number;
  totalCostCents: number;
  totalRevenueCents: number;
  totalProfitCents: number;
  averageMarginPct: number;
  finalAreaSqm: number;
  finalMonthlyUnits: number;
}

export const buildDefaultProjectionScenario = (baseline: GrowthProjectionBaseline): GrowthProjectionScenario => ({
  startingAreaSqm: Math.max(1, Math.round(safe(baseline.baseAreaSqm, 1) * 100) / 100),
  monthlyGrowthPct: 6,
  productivityGainPct: 4,
  expectedLossRate: Math.max(0, Math.round(safe(baseline.baseLossRate, 8))),
  costAdjustmentPct: 2,
  priceAdjustmentPct: 3
});

export const buildGrowthProjectionSeries = (
  baseline: GrowthProjectionBaseline,
  scenario: GrowthProjectionScenario,
  horizonMonths: number
): GrowthProjectionPoint[] => {
  const months = Math.max(1, Math.round(safe(horizonMonths, 1)));
  const baseArea = Math.max(1, safe(baseline.baseAreaSqm, 1));
  const baseUnits = Math.max(1, Math.round(safe(baseline.baseMonthlyUnits, 1)));
  const baseLossFactor = Math.max(0.15, 1 - Math.max(0, safe(baseline.baseLossRate)) / 100);
  const targetLossFactor = Math.max(0.15, 1 - Math.max(0, safe(scenario.expectedLossRate)) / 100);
  const areaRatio = Math.max(0.2, safe(scenario.startingAreaSqm, baseArea) / baseArea);
  const productivityMultiplier = Math.max(0.3, 1 + safe(scenario.productivityGainPct) / 100);
  const monthlyGrowth = 1 + safe(scenario.monthlyGrowthPct) / 100;
  const monthlyCostAdjustment = 1 + safe(scenario.costAdjustmentPct) / 100;
  const monthlyPriceAdjustment = 1 + safe(scenario.priceAdjustmentPct) / 100;

  let cumulativeCostCents = 0;
  let cumulativeRevenueCents = 0;

  return Array.from({ length: months }, (_, index) => {
    const monthIndex = index + 1;
    const compoundingFactor = Math.pow(monthlyGrowth, index);
    const areaSqm = Math.max(0, safe(scenario.startingAreaSqm, baseArea) * compoundingFactor);
    const units = Math.max(
      0,
      Math.round(baseUnits * areaRatio * compoundingFactor * productivityMultiplier * (targetLossFactor / baseLossFactor))
    );
    const costPerUnitCents = money(baseline.baseCostPerUnitCents * Math.pow(monthlyCostAdjustment, index));
    const pricePerUnitCents = money(baseline.basePricePerUnitCents * Math.pow(monthlyPriceAdjustment, index));
    const totalCostCents = units * costPerUnitCents;
    const totalRevenueCents = units * pricePerUnitCents;
    const totalProfitCents = totalRevenueCents - totalCostCents;
    const marginPct = totalRevenueCents > 0 ? (totalProfitCents / totalRevenueCents) * 100 : 0;

    cumulativeCostCents += totalCostCents;
    cumulativeRevenueCents += totalRevenueCents;

    return {
      monthIndex,
      monthLabel: buildMonthLabel(index),
      areaSqm,
      units,
      totalCostCents,
      totalRevenueCents,
      totalProfitCents,
      cumulativeCostCents,
      cumulativeRevenueCents,
      cumulativeProfitCents: cumulativeRevenueCents - cumulativeCostCents,
      marginPct
    };
  });
};

export const summarizeGrowthProjection = (
  points: GrowthProjectionPoint[],
  horizonMonths: number
): GrowthProjectionSummary => {
  const totalCostCents = points.reduce((acc, point) => acc + point.totalCostCents, 0);
  const totalRevenueCents = points.reduce((acc, point) => acc + point.totalRevenueCents, 0);
  const totalProfitCents = totalRevenueCents - totalCostCents;
  const averageMarginPct = totalRevenueCents > 0 ? (totalProfitCents / totalRevenueCents) * 100 : 0;
  const finalPoint = points[points.length - 1];

  return {
    horizonMonths,
    totalCostCents,
    totalRevenueCents,
    totalProfitCents,
    averageMarginPct,
    finalAreaSqm: finalPoint?.areaSqm ?? 0,
    finalMonthlyUnits: finalPoint?.units ?? 0
  };
};

export const buildProjectionMilestones = (
  baseline: GrowthProjectionBaseline,
  scenario: GrowthProjectionScenario,
  horizons: number[] = [3, 6, 12]
): Record<number, GrowthProjectionSummary> => {
  const fullSeries = buildGrowthProjectionSeries(baseline, scenario, Math.max(...horizons));

  return horizons.reduce<Record<number, GrowthProjectionSummary>>((acc, horizon) => {
    acc[horizon] = summarizeGrowthProjection(fullSeries.slice(0, horizon), horizon);
    return acc;
  }, {});
};
