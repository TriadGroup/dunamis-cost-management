import { describe, expect, it } from 'vitest';
import {
  calculateMonthlyTotals,
  calculatePayback,
  calculateRoi,
  project12Months
} from '@/entities/finance/calculations';
import { DEFAULT_APP_STATE } from '@/entities/finance/defaultData';

describe('finance calculations', () => {
  it('calculates monthly totals from base values', () => {
    const state = structuredClone(DEFAULT_APP_STATE);
    const totals = calculateMonthlyTotals(
      state.items,
      state.categories,
      state.expectedRevenueCents,
      state.investments,
      state.purchases,
      state.maintenance
    );

    expect(totals.totalCostCents).toBeGreaterThan(0);
    expect(totals.totalCostCents).toBeGreaterThan(500000);
  });

  it('handles ROI and payback edge cases', () => {
    const investment = {
      id: '1',
      name: 'Financiamento trator',
      kind: 'financiamento' as const,
      assetType: 'Maquinario',
      assetValueCents: 100000,
      upfrontCents: 0,
      monthlyInterestPct: 0,
      consortiumFeePct: 0,
      termMonths: 10,
      expectedMonthlyReturnCents: 20000,
      riskLevel: 'low' as const,
      notes: ''
    };

    const roi = calculateRoi([investment]);
    expect(roi.roiPct).toBeCloseTo(100, 4);

    const payback = calculatePayback({
      ...investment,
      expectedMonthlyReturnCents: 0,
      riskLevel: 'medium'
    });

    expect(payback).toBeNull();
  });

  it('creates a 12 month projection', () => {
    const points = project12Months(DEFAULT_APP_STATE);
    expect(points).toHaveLength(12);
    expect(points[0]).toHaveProperty('baseBalanceCents');
    expect(points[0]).toHaveProperty('adjustedBalanceCents');
  });
});
