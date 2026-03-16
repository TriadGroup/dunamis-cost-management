import type { CultivationCostAllocation } from '@/entities/agro/crop-plan/types';

export type CropEnvironment = 'campo_aberto' | 'protegido' | 'ambos';
export type CropPurchaseType = 'caixa' | 'bandeja' | 'saco' | 'pacote' | 'unidade' | 'kg_semente' | 'outro';
export type CropUnitType =
  | 'unidade'
  | 'muda'
  | 'cabeca'
  | 'pe'
  | 'caixa'
  | 'bandeja'
  | 'maco'
  | 'kg'
  | 'outro';

export interface Crop {
  id: string;
  name: string;
  variety: string;
  category: string;
  preferredUnits: Array<'unit' | 'weight' | 'box' | 'bulk'>;
  cycleDays: number;
  productionUnit: CropUnitType;
  salesUnit: CropUnitType;
  purchaseType: CropPurchaseType;
  unitsPerPurchasePack: number;
  purchasePackCostCents: number;
  defaultPlantSpacingCm: number;
  defaultRowSpacingCm: number;
  defaultBedWidthM: number;
  defaultBedLengthM: number;
  unitsPerSalesBox: number;
  defaultMarkupPct: number;
  defaultLossRate: number;
  baseSeedlingCostCents: number;
  defaultCostSelections: CultivationCostAllocation[];
  notes?: string;
  environmentCompatibility: CropEnvironment;
}
