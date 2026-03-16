import type { CropUnitType } from '@/entities/agro/crop/types';

export type DemandChannelType = 'kitchen' | 'box' | 'event' | 'external-market' | 'surplus';

export type PricingMode = 'unit' | 'weight' | 'box' | 'bulk';
export type DemandUnit = 'muda' | 'unidade' | 'maco' | 'caixa' | 'kg' | 'saca' | 'tonelada' | 'outro';

export interface DemandChannelItem {
  id: string;
  cropId: string;
  quantityPerBundle: number;
  acceptedPriceCents: number;
  unit: CropUnitType;
}

export interface DemandChannel {
  id: string;
  type: DemandChannelType;
  name: string;
  priority: number;
  pricingMode: PricingMode;
  demandUnit: DemandUnit;
  baselineDemand: number;
  scenarioDemand: number;
  transferPriceCents?: number;
  acceptedPriceCents?: number;
  enabled: boolean;
  items?: DemandChannelItem[];
}
