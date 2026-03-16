export interface LaborRecord {
  id: string;
  date: string;
  teamName: string;
  taskName: string;
  cropId: string | null;
  cropPlanId: string | null;
  productionLotId: string | null;
  areaNodeIds: string[];
  hoursWorked: number;
  hourlyCostCents: number;
  totalCostCents: number;
  notes: string;
}
