import type { CropPurchaseType, CropUnitType } from '@/entities/agro/crop/types';

export type CultureTemplateCategory =
  | 'Folhosa'
  | 'Erva / tempero'
  | 'Raiz'
  | 'Fruto'
  | 'Flor / inflorescência'
  | 'Brassica / crucífera'
  | 'Outro';

export interface CultureTemplate {
  id: string;
  name: string;
  category: CultureTemplateCategory;
  variant: string;
  cycleDays: number;
  purchaseTypeDefault: CropPurchaseType;
  unitsPerPurchasePack: number;
  productionUnitDefault: CropUnitType;
  salesUnitDefault: CropUnitType;
  unitsPerSalesBox: number;
  spacingBetweenPlantsCm: number;
  spacingBetweenRowsCm: number;
  bedLengthDefaultM: number;
  bedWidthDefaultM: number;
  plantsPerBed: number | null;
  weeklyProductionEstimate: number | null;
  bedsWithoutBreak: number | null;
  seedCostCents: number;
  inputCostCents: number;
  maintenanceCostCents: number;
  utilitiesCostCents: number;
  laborCostCents: number;
  totalEstimatedCostCents: number;
  notes: string;
  sourceTags: string[];
  recommendedMarkupPct: number;
  defaultLossRate: number;
  environmentType: 'canteiro' | 'tutorado' | 'pomar' | 'solo' | 'protegido';
  groupTag: string;
  active: boolean;
}
