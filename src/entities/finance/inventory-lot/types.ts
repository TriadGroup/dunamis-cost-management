export type InventoryLotStatus = 'ativo' | 'parcial' | 'encerrado' | 'vencido';

export interface InventoryLot {
  id: string;
  productId: string;
  purchaseId: string | null;
  code: string;
  receivedAt: string;
  quantityReceived: number;
  quantityAvailable: number;
  unit: string;
  unitCostCents: number;
  expirationDate: string;
  locationName: string;
  status: InventoryLotStatus;
  notes: string;
}
