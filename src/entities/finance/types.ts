export type Money = number;

export type MetricType = 'cost' | 'investment' | 'revenue';

export type Recurrence = 'monthly' | 'quarterly' | 'yearly';

export interface FinancialItem {
  id: string;
  categoryId: string;
  name: string;
  type: MetricType;
  baseValueCents: Money;
  recurrence: Recurrence;
  itemSliderPct: number;
  notes: string;
}

export interface Category {
  id: string;
  name: string;
  categorySliderPct: number;
  colorToken: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Investment {
  id: string;
  name: string;
  amountCents: Money;
  expectedMonthlyReturnCents: Money;
  horizonMonths: number;
  riskLevel: RiskLevel;
}

export interface Scenario {
  id: string;
  name: string;
  monthRef: string;
  overrides: Record<string, number>;
  createdAt: string;
}

export interface KpiSnapshot {
  totalCostCents: Money;
  totalInvestmentCents: Money;
  totalRevenueCents: Money;
  projectedBalanceCents: Money;
  marginPct: number;
  roiPct: number;
  paybackMonths: number | null;
  burnRateCents: Money;
  runwayMonths: number | null;
}

export interface Totals {
  totalCostCents: Money;
  totalInvestmentCents: Money;
  totalRevenueCents: Money;
  projectedBalanceCents: Money;
}

export interface RoiSummary {
  roiPct: number;
  totalInvestmentCents: Money;
  totalReturnCents: Money;
  totalMonthlyReturnCents: Money;
}

export interface ProjectionPoint {
  month: string;
  baseBalanceCents: number;
  adjustedBalanceCents: number;
}

export interface AppState {
  schemaVersion: number;
  pinHash: string | null;
  categories: Category[];
  items: FinancialItem[];
  investments: Investment[];
  scenarios: Scenario[];
  expectedRevenueCents: Money;
  cashReserveCents: Money;
}
