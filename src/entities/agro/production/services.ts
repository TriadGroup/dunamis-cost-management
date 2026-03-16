import type { Harvest } from '@/entities/agro/harvest/types';
import type { LossEvent } from '@/entities/agro/loss-event/types';
import type { Lot } from '@/entities/agro/lot/types';

const safe = (value: number): number => (Number.isFinite(value) ? value : 0);
const money = (value: number): number => Math.max(0, Math.round(safe(value)));

export const calculateMarketableUnits = (lot: Lot, harvests: Harvest[], losses: LossEvent[]): number => {
  const lotHarvests = harvests.filter((harvest) => harvest.lotId === lot.id);
  const marketableFromHarvest = lotHarvests.reduce((acc, harvest) => acc + Math.max(0, safe(harvest.marketableQuantity)), 0);
  const lotLosses = losses
    .filter((loss) => loss.sourceType === 'lote' && loss.sourceId === lot.id)
    .reduce((acc, loss) => acc + Math.max(0, safe(loss.quantity)), 0);

  return Math.max(0, Math.round(marketableFromHarvest - lotLosses));
};

export const calculateCostPerMarketableUnit = (appropriatedCostCents: number, marketableUnits: number): number => {
  if (marketableUnits <= 0) return 0;
  return Math.round(money(appropriatedCostCents) / Math.max(1, marketableUnits));
};

export const calculateCostPerBox = (costPerUnitCents: number, unitsPerBox: number): number => {
  return money(costPerUnitCents) * Math.max(1, Math.round(safe(unitsPerBox)));
};

export const calculateMinimumSalePrice = (costPerUnitCents: number): number => {
  return money(costPerUnitCents);
};

export const calculateSuggestedSalePrice = (costPerUnitCents: number, markupPct: number): number => {
  return Math.round(money(costPerUnitCents) * (1 + Math.max(0, safe(markupPct)) / 100));
};
