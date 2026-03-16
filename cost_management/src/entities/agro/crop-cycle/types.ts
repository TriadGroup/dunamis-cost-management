export interface CropCycle {
  id: string;
  cropId: string;
  startDate: string;
  harvestStartDate: string;
  harvestEndDate: string;
  cycleDays: number;
  expectedOutputKg: number;
}
