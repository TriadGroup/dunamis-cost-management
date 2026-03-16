import type { CostItem, RecurringCostSummary } from '@/entities/finance/cost-item/types';
import type { MaintenanceEvent } from '@/entities/finance/maintenance-event/types';
import type { PurchaseItem } from '@/entities/finance/purchase/types';

const money = (value: number): number => Math.max(0, Math.round(Number.isFinite(value) ? value : 0));

export const calculateRecurringCostSummary = (
  costItems: CostItem[],
  purchases: PurchaseItem[],
  maintenanceEvents: MaintenanceEvent[]
): RecurringCostSummary => {
  const monthlyCostCents = costItems.reduce((acc, item) => {
    if (item.status !== 'ativo') return acc;
    return acc + money(item.monthlyEquivalentCents);
  }, 0);

  const monthlyReserveCents =
    monthlyCostCents +
    purchases.reduce((acc, item) => (item.status === 'ativo' ? acc + money(item.monthlyEquivalentCents) : acc), 0) +
    maintenanceEvents.reduce((acc, item) => (item.status === 'ativo' ? acc + money(item.monthlyReserveCents) : acc), 0);

  return {
    monthlyCostCents,
    monthlyReserveCents,
    annualConsolidatedCents: monthlyReserveCents * 12
  };
};

export const calculateCostPerChannel = (costItems: CostItem[], channelId: string): number => {
  return costItems
    .filter((entry) => entry.linkedChannelId === channelId && entry.status === 'ativo')
    .reduce((acc, entry) => acc + money(entry.monthlyEquivalentCents), 0);
};

export const costAttentionSignals = (costItems: CostItem[]): string[] => {
  const signals: string[] = [];
  if (costItems.some((item) => !item.category.trim())) {
    signals.push('Existem custos sem categoria definida.');
  }
  if (costItems.some((item) => item.recurrenceType === 'extraordinario' && item.status === 'ativo')) {
    signals.push('Há custos extraordinários ativos que exigem revisão.');
  }
  return signals;
};
