import { describe, expect, it } from 'vitest';
import {
  calculateMonthlyTotals,
  calculatePayback,
  calculateRoi,
  project12Months
} from '@/entities/finance/calculations';
import { DEFAULT_APP_STATE } from '@/entities/finance/defaultData';

describe('finance calculations', () => {
  it('applies category and item sliders together', () => {
    const state = structuredClone(DEFAULT_APP_STATE);
    const category = state.categories[0];
    const item = state.items.find((entry) => entry.categoryId === category.id)!;

    category.categorySliderPct = 20;
    item.itemSliderPct = 10;

    const totals = calculateMonthlyTotals(state.items, state.categories, state.expectedRevenueCents, state.investments);

    expect(totals.totalCostCents).toBeGreaterThan(0);
    expect(totals.totalCostCents).toBeGreaterThan(1000000);
  });

  it('handles ROI and payback edge cases', () => {
    const roi = calculateRoi([
      { id: '1', name: 'A', amountCents: 100000, expectedMonthlyReturnCents: 20000, horizonMonths: 10, riskLevel: 'low' }
    ]);

    expect(roi.roiPct).toBeCloseTo(100, 4);

    const payback = calculatePayback({
      id: '1',
      name: 'A',
      amountCents: 100000,
      expectedMonthlyReturnCents: 0,
      horizonMonths: 12,
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
