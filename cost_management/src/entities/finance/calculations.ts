import type {
  AppState,
  Category,
  CultivationCostSheet,
  CultivationProject,
  FinancialItem,
  Investment,
  KpiSnapshot,
  MaintenanceItem,
  ProjectionPoint,
  PurchaseItem,
  RoiSummary,
  Totals
} from './types';
import { calculateCultivationCostTotals, calculateCultivationRevenueTotal } from './cultivation';
import { deriveInvestment, sumInvestmentMonthlyOutflow, sumInvestmentProjectedReturn, sumInvestmentTotalPaid } from './investments';
import { calculateMonthlyEquivalent } from './recurrence';

const safeMoney = (value: number): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
};

const safeNumber = (value: number): number => (Number.isFinite(value) ? value : 0);

const itemEventValue = (item: FinancialItem): number => {
  if (item.eventValueCents > 0) return safeMoney(item.eventValueCents);
  return safeMoney(item.baseValueCents || 0);
};

export const toMonthlyValue = (item: FinancialItem): number => {
  return calculateMonthlyEquivalent(itemEventValue(item), {
    recurrenceType: item.recurrenceType,
    intervalUnit: item.intervalUnit,
    intervalValue: item.intervalValue
  });
};

export const adjustedItemValue = (item: FinancialItem, _category: Category | undefined): number => {
  return toMonthlyValue(item);
};

const purchaseEventValue = (purchase: PurchaseItem): number => {
  if (purchase.eventValueCents > 0) return safeMoney(purchase.eventValueCents);
  const quantity = Math.max(0, safeNumber(purchase.quantity));
  const unitPrice = safeMoney(purchase.unitPriceCents);
  return Math.round(quantity * unitPrice);
};

export const toPurchaseMonthlyValue = (purchase: PurchaseItem): number => {
  return calculateMonthlyEquivalent(purchaseEventValue(purchase), {
    recurrenceType: purchase.recurrenceType,
    intervalUnit: purchase.intervalUnit,
    intervalValue: purchase.intervalValue
  });
};

const maintenanceEventValue = (maintenance: MaintenanceItem): number => {
  if (maintenance.eventValueCents > 0) return safeMoney(maintenance.eventValueCents);
  return safeMoney(maintenance.costPerServiceCents || 0);
};

export const toMaintenanceMonthlyValue = (maintenance: MaintenanceItem): number => {
  return calculateMonthlyEquivalent(maintenanceEventValue(maintenance), {
    recurrenceType: maintenance.recurrenceType,
    intervalUnit: maintenance.intervalUnit,
    intervalValue: maintenance.intervalValue,
    usageIntervalHours: maintenance.usageIntervalHours,
    usageHoursPerMonth: maintenance.usageHoursPerMonth
  });
};

export const toMaintenanceAnnualCost = (maintenance: MaintenanceItem): number => {
  return Math.round(toMaintenanceMonthlyValue(maintenance) * 12);
};

const cultivationCostsMonthly = (projects: CultivationProject[], sheets: CultivationCostSheet[]): number => {
  const sheetMap = new Map(sheets.map((sheet) => [sheet.cropId, sheet]));
  return projects.reduce(
    (acc, project) => acc + calculateCultivationCostTotals(project, sheetMap.get(project.id) ?? null).monthlyEquivalentCents,
    0
  );
};

export const calculateMonthlyTotals = (
  items: FinancialItem[],
  categories: Category[],
  expectedRevenueCents: number,
  investments: Investment[],
  purchases: PurchaseItem[] = [],
  maintenance: MaintenanceItem[] = [],
  cultivationProjects: CultivationProject[] = [],
  cultivationCostSheets: CultivationCostSheet[] = []
): Totals => {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  let totalCostCents = 0;
  let totalInvestmentCents = 0;
  let totalRevenueCents = safeMoney(expectedRevenueCents);

  for (const item of items) {
    const adjusted = adjustedItemValue(item, categoryMap.get(item.categoryId));
    if (item.type === 'cost') totalCostCents += adjusted;
    if (item.type === 'investment') totalInvestmentCents += adjusted;
    if (item.type === 'revenue') totalRevenueCents += adjusted;
  }

  totalCostCents += purchases.reduce((acc, purchase) => acc + toPurchaseMonthlyValue(purchase), 0);
  totalCostCents += maintenance.reduce((acc, entry) => acc + toMaintenanceMonthlyValue(entry), 0);
  totalCostCents += cultivationCostsMonthly(cultivationProjects, cultivationCostSheets);
  totalInvestmentCents += sumInvestmentMonthlyOutflow(investments);

  return {
    totalCostCents,
    totalInvestmentCents,
    totalRevenueCents,
    projectedBalanceCents: totalRevenueCents - totalCostCents - totalInvestmentCents
  };
};

export const calculateRoi = (investments: Investment[]): RoiSummary => {
  const totalInvestmentCents = sumInvestmentTotalPaid(investments);
  const totalReturnCents = sumInvestmentProjectedReturn(investments);
  const totalMonthlyReturnCents = investments.reduce(
    (acc, investment) => acc + safeMoney(investment.expectedMonthlyReturnCents),
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
  return deriveInvestment(investment).paybackMonths;
};

export const calculateAggregatePayback = (investments: Investment[]): number | null => {
  const totalInvestment = sumInvestmentTotalPaid(investments);
  const monthlyReturn = investments.reduce((acc, item) => acc + safeMoney(item.expectedMonthlyReturnCents), 0);
  if (monthlyReturn <= 0) return null;
  return Number((totalInvestment / monthlyReturn).toFixed(1));
};

export const riskFromKpi = (marginPct: number, runwayMonths: number | null): 'low' | 'medium' | 'high' => {
  if (marginPct < 5 || (runwayMonths !== null && runwayMonths < 3)) return 'high';
  if (marginPct < 20 || (runwayMonths !== null && runwayMonths < 8)) return 'medium';
  return 'low';
};

export const buildKpiSnapshot = (state: AppState): KpiSnapshot => {
  const productionSalesCents = calculateCultivationRevenueTotal(state.cultivationProjects);
  const expectedRevenueCents = productionSalesCents + state.farmBuildersCents;
  const totals = calculateMonthlyTotals(
    state.items,
    state.categories,
    expectedRevenueCents,
    state.investments,
    state.purchases,
    state.maintenance,
    state.cultivationProjects,
    state.cultivationCostSheets
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
  const productionSalesCents = calculateCultivationRevenueTotal(state.cultivationProjects);
  const expectedRevenueCents = productionSalesCents + state.farmBuildersCents;
  const monthlyProjection = calculateMonthlyTotals(
    state.items,
    state.categories,
    expectedRevenueCents,
    state.investments,
    state.purchases,
    state.maintenance,
    state.cultivationProjects,
    state.cultivationCostSheets
  ).projectedBalanceCents;

  let baseCumulative = state.cashReserveCents;
  let adjustedCumulative = state.cashReserveCents;

  return Array.from({ length: 12 }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() + index, 1);
    baseCumulative += monthlyProjection;
    adjustedCumulative += monthlyProjection;

    return {
      month: monthLabel(date),
      baseBalanceCents: baseCumulative,
      adjustedBalanceCents: adjustedCumulative
    };
  });
};
