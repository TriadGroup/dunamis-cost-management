export interface EquipmentUsageRecord {
  id: string;
  assetName: string;
  operationName: string;
  date: string;
  cropId: string | null;
  cropPlanId: string | null;
  areaNodeIds: string[];
  hoursUsed: number;
  areaCoveredSqm: number;
  fuelCostCents: number;
  usageCostCents: number;
  notes: string;
}
