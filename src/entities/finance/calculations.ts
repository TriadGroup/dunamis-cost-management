import type {
  AppState,
  Category,
  FinancialItem,
  Investment,
  KpiSnapshot,
  ProjectionPoint,
  RoiSummary,
  Totals
} from './types';

const recurrenceMultiplier: Record<FinancialItem['recurrence'], number> = {
  monthly: 1,
  quarterly: 1 / 3,
  yearly: 1 / 12
};

export const toMonthlyValue = (item: FinancialItem): number => {
  return Math.round(item.baseValueCents * recurrenceMultiplier[item.recurrence]);
};

export const adjustedItemValue = (item: FinancialItem, category: Category | undefined): number => {
  const categoryPct = category?.categorySliderPct ?? 0;
  const multiplier = (1 + item.itemSliderPct / 100) * (1 + categoryPct / 100);
  return Math.round(toMonthlyValue(item) * multiplier);
};

export const calculateMonthlyTotals = (
  items: FinancialItem[],
  categories: Category[],
  expectedRevenueCents: number,
  investments: Investment[]
): Totals => {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  let totalCostCents = 0;
  let totalInvestmentCents = 0;
  let totalRevenueCents = expectedRevenueCents;

  for (const item of items) {
    const adjusted = adjustedItemValue(item, categoryMap.get(item.categoryId));
    if (item.type === 'cost') totalCostCents += adjusted;
    if (item.type === 'investment') totalInvestmentCents += adjusted;
    if (item.type === 'revenue') totalRevenueCents += adjusted;
  }

  totalInvestmentCents += investments.reduce((acc, investment) => acc + investment.amountCents, 0);

  return {
    totalCostCents,
    totalInvestmentCents,
    totalRevenueCents,
    projectedBalanceCents: totalRevenueCents - totalCostCents - totalInvestmentCents
  };
};

export const calculateRoi = (investments: Investment[]): RoiSummary => {
  const totalInvestmentCents = investments.reduce((acc, investment) => acc + investment.amountCents, 0);
  const totalReturnCents = investments.reduce(
    (acc, investment) => acc + investment.expectedMonthlyReturnCents * investment.horizonMonths,
    0
  );
  const totalMonthlyReturnCents = investments.reduce(
    (acc, investment) => acc + investment.expectedMonthlyReturnCents,
    0
  );

  const roiPct = totalInvestmentCents > 0 ? ((totalReturnCents - totalInvestmentCents) / totalInvestmentCents) * 100 : 0;

  return {
    roiPct,
    totalInvestmentCents,
    totalReturnCents,
    totalMonthlyReturnCents
  };
};

export const calculatePayback = (investment: Investment): number | null => {
  if (investment.expectedMonthlyReturnCents <= 0) return null;
  return Number((investment.amountCents / investment.expectedMonthlyReturnCents).toFixed(1));
};

export const calculateAggregatePayback = (investments: Investment[]): number | null => {
  const totalInvestment = investments.reduce((acc, item) => acc + item.amountCents, 0);
  const monthlyReturn = investments.reduce((acc, item) => acc + item.expectedMonthlyReturnCents, 0);
  if (monthlyReturn <= 0) return null;
  return Number((totalInvestment / monthlyReturn).toFixed(1));
};

export const riskFromKpi = (marginPct: number, runwayMonths: number | null): 'low' | 'medium' | 'high' => {
  if (marginPct < 5 || (runwayMonths !== null && runwayMonths < 3)) return 'high';
  if (marginPct < 20 || (runwayMonths !== null && runwayMonths < 8)) return 'medium';
  return 'low';
};

export const buildKpiSnapshot = (state: AppState): KpiSnapshot => {
  const totals = calculateMonthlyTotals(
    state.items,
    state.categories,
    state.expectedRevenueCents,
    state.investments
  );
  const roi = calculateRoi(state.investments);
  const paybackMonths = calculateAggregatePayback(state.investments);

  const marginPct = totals.totalRevenueCents > 0 ? (totals.projectedBalanceCents / totals.totalRevenueCents) * 100 : 0;
  const burnRateCents = Math.max(0, totals.totalCostCents + totals.totalInvestmentCents - totals.totalRevenueCents);
  const runwayMonths = burnRateCents > 0 ? Number((state.cashReserveCents / burnRateCents).toFixed(1)) : null;

  return {
    ...totals,
    marginPct,
    roiPct: roi.roiPct,
    paybackMonths,
    burnRateCents,
    runwayMonths
  };
};

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

const monthLabel = (date: Date): string => {
  const base = monthFormatter.format(date).replace('.', '');
  return base[0].toUpperCase() + base.slice(1);
};

export const project12Months = (state: AppState): ProjectionPoint[] => {
  const now = new Date();
  const baseItems = state.items.map((item) => ({ ...item, itemSliderPct: 0 }));
  const baseCategories = state.categories.map((category) => ({ ...category, categorySliderPct: 0 }));

  const baseMonthly = calculateMonthlyTotals(
    baseItems,
    baseCategories,
    state.expectedRevenueCents,
    state.investments
  ).projectedBalanceCents;
  const adjustedMonthly = calculateMonthlyTotals(
    state.items,
    state.categories,
    state.expectedRevenueCents,
    state.investments
  ).projectedBalanceCents;

  let baseCumulative = state.cashReserveCents;
  let adjustedCumulative = state.cashReserveCents;

  return Array.from({ length: 12 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
    baseCumulative += baseMonthly;
    adjustedCumulative += adjustedMonthly;

    return {
      month: monthLabel(date),
      baseBalanceCents: baseCumulative,
      adjustedBalanceCents: adjustedCumulative
    };
  });
};
