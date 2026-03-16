import type { LossEvent } from '@/entities/agro/loss-event/types';
import type { InventoryLot } from '@/entities/finance/inventory-lot/types';
import type { StockMovement } from '@/entities/finance/stock-movement/types';

const safe = (value: number): number => (Number.isFinite(value) ? value : 0);

const isNegativeMovement = (movementType: StockMovement['movementType']) =>
  movementType === 'uso' ||
  movementType === 'aplicacao' ||
  movementType === 'perda' ||
  movementType === 'transferencia';

export const calculateInventoryBalance = (lot: InventoryLot, movements: StockMovement[]): number => {
  const related = movements.filter((movement) => movement.inventoryLotId === lot.id);
  const net = related.reduce((acc, movement) => {
    const quantity = Math.max(0, safe(movement.quantity));
    return acc + (isNegativeMovement(movement.movementType) ? -quantity : quantity);
  }, 0);

  return Math.max(0, safe(lot.quantityReceived) + net);
};

export const calculateAverageUnitCost = (productId: string, lots: InventoryLot[]): number => {
  const related = lots.filter((lot) => lot.productId === productId);
  const totalQuantity = related.reduce((acc, lot) => acc + Math.max(0, safe(lot.quantityAvailable)), 0);
  if (totalQuantity <= 0) return 0;

  const totalCost = related.reduce(
    (acc, lot) => acc + Math.max(0, safe(lot.quantityAvailable)) * Math.max(0, safe(lot.unitCostCents)),
    0
  );

  return Math.round(totalCost / totalQuantity);
};

export const calculateInventoryLossTotal = (losses: LossEvent[], lots: InventoryLot[]): number => {
  const lotIds = new Set(lots.map((lot) => lot.id));
  return losses
    .filter((loss) => loss.sourceType === 'estoque' && lotIds.has(loss.sourceId))
    .reduce((acc, loss) => acc + Math.max(0, safe(loss.estimatedCostCents)), 0);
};

export const getLotStatusFromBalance = (lot: InventoryLot, movements: StockMovement[]): InventoryLot['status'] => {
  const balance = calculateInventoryBalance(lot, movements);
  if (lot.expirationDate && lot.expirationDate < new Date().toISOString().slice(0, 10)) return 'vencido';
  if (balance <= 0) return 'encerrado';
  if (balance < lot.quantityReceived) return 'parcial';
  return 'ativo';
};
