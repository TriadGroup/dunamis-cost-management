export type InventoryProductCategory =
  | 'adubo'
  | 'defensivo'
  | 'corretivo'
  | 'semente'
  | 'muda'
  | 'embalagem'
  | 'combustivel'
  | 'outro';

export interface InventoryProduct {
  id: string;
  name: string;
  commercialName: string;
  category: InventoryProductCategory;
  defaultUnit: string;
  density?: number;
  activeIngredient?: string;
  notes: string;
  active: boolean;
}
