import { describe, expect, it } from 'vitest';
import {
  buildDefaultProjectionScenario,
  buildGrowthProjectionSeries,
  buildProjectionMilestones
} from '@/features/dashboard/model/projectionScenario';

describe('dashboard projection scenario', () => {
  const baseline = {
    cropName: 'Alface',
    unitLabel: 'unidade',
    baseAreaSqm: 250,
    baseBeds: 4,
    baseCycleDays: 40,
    baseMonthlyUnits: 900,
    baseCostPerUnitCents: 420,
    basePricePerUnitCents: 690,
    baseLossRate: 8
  };

  it('builds a 12 month series with revenue, cost and profit', () => {
    const scenario = buildDefaultProjectionScenario(baseline);
    const series = buildGrowthProjectionSeries(baseline, scenario, 12);

    expect(series).toHaveLength(12);
    expect(series[0].units).toBeGreaterThan(0);
    expect(series[0].totalRevenueCents).toBeGreaterThan(series[0].totalCostCents);
    expect(series[11].areaSqm).toBeGreaterThan(series[0].areaSqm);
    expect(series[11].cumulativeRevenueCents).toBeGreaterThan(series[0].cumulativeRevenueCents);
  });

  it('builds milestone summaries for 3, 6 and 12 months', () => {
    const milestones = buildProjectionMilestones(baseline, {
      ...buildDefaultProjectionScenario(baseline),
      monthlyGrowthPct: 10
    });

    expect(milestones[3].horizonMonths).toBe(3);
    expect(milestones[6].totalRevenueCents).toBeGreaterThan(milestones[3].totalRevenueCents);
    expect(milestones[12].totalProfitCents).toBeGreaterThan(milestones[6].totalProfitCents);
  });
});
