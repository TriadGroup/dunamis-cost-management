export type StockMovementType =
  | 'entrada'
  | 'transferencia'
  | 'reserva'
  | 'uso'
  | 'aplicacao'
  | 'perda'
  | 'ajuste'
  | 'devolucao';

export type StockMovementTargetType = 'cultura' | 'plano' | 'lote' | 'area' | 'geral';

export interface StockMovement {
  id: string;
  inventoryLotId: string;
  movementType: StockMovementType;
  quantity: number;
  unit: string;
  occurredAt: string;
  targetType: StockMovementTargetType;
  targetId: string | null;
  reason: string;
  notes: string;
}
