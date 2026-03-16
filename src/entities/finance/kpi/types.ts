export interface AttentionPoint {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
}

export interface DashboardKpi {
  recurringCostCents: number;
  implantationCommittedCents: number;
  monthlyInflowCents: number;
  monthlyOutflowCents: number;
  projectedBalanceCents: number;
  agroReturnCents: number;
  paybackMonths: number | null;
}
