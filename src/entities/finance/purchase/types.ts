export type PurchaseStatus = 'ativo' | 'pausado' | 'encerrado' | 'pendente';

export type PurchasePaymentStatus = 'pendente' | 'parcial' | 'pago';

export interface PurchaseItem {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  supplier: string;
  eventValueCents: number;
  monthlyEquivalentCents: number;
  nextOccurrence: string;
  notes: string;
  status: PurchaseStatus;
  linkedCropId?: string;
  linkedBedId?: string;
  linkedLotId?: string;
  linkedChannelId?: string;
  linkedCostCenter?: string;
  receivedAt?: string;
  receivedQuantity?: number;
  receivedUnit?: string;
  inventoryProductId?: string;
  isStockable: boolean;
  paymentStatus: PurchasePaymentStatus;
}
