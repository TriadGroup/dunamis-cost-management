export interface Harvest {
  id: string;
  lotId: string;
  harvestedAt: string;
  grossQuantity: number;
  marketableQuantity: number;
  lossQuantity: number;
  unit: string;
  destinationChannel?: string;
  destinationBreakdown: Array<{
    channelId: string;
    quantity: number;
    unit: string;
    valueCents: number;
  }>;
  quantity?: number;
  soldValueCents?: number;
  internalTransferValueCents?: number;
}
