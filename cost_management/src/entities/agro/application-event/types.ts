export type CropStage =
  | 'viveiro'
  | 'transplante'
  | 'pegamento'
  | 'vegetativo'
  | 'reprodutivo'
  | 'colheita'
  | 'pos_colheita'
  | 'manutencao';

export interface ApplicationEvent {
  id: string;
  inventoryLotId: string;
  stockMovementId?: string | null;
  productId: string;
  cropId: string | null;
  cropPlanId: string | null;
  productionLotId: string | null;
  areaNodeIds: string[];
  cropStage: CropStage;
  quantityApplied: number;
  unit: string;
  appliedAreaSqm: number;
  doseDescription: string;
  appliedAt: string;
  responsible: string;
  equipmentName: string;
  weatherNotes: string;
  notes: string;
}
