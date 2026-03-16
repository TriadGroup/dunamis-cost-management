export interface UnitEconomicsRow {
  cropId: string;
  cropName: string;
  cropVariety: string;
  unitLabel: string;
  purchasedCostCents: number;
  stockUsedCostCents: number;
  appliedCostCents: number;
  appropriatedCostCents: number;
  laborCostCents: number;
  machineryCostCents: number;
  utilityCostCents: number;
  totalCostCents: number;
  yieldKg: number;
  yieldUnits: number;
  viableUnits: number;
  marketableUnits: number;
  yieldBoxes: number;
  costPerKgCents: number;
  costPerUnitCents: number;
  costPerBoxCents: number;
  minimumSalePricePerUnitCents: number;
  suggestedSalePricePerUnitCents: number;
  suggestedSalePricePerBoxCents: number;
  estimatedProfitPerUnitCents: number;
  estimatedProfitPerBoxCents: number;
  unitsPerSalesBox: number;
  salesUnit: string;
  plannedOnly?: boolean;
}

export interface ChannelMargin {
  channelId: string;
  channelName: string;
  costCents: number;
  revenueCents: number;
  marginCents: number;
  marginPct: number;
}

export interface PricingScenario {
  id: string;
  name: string;
  useKitchenPurchase: 'total' | 'partial' | 'none';
  boxBoostPct: number;
}
