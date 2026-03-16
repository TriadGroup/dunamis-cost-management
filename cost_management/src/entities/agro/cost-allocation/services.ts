import type { ApplicationEvent } from '@/entities/agro/application-event/types';
import type { CostAllocationLedgerEntry } from '@/entities/agro/cost-allocation/types';
import type { EquipmentUsageRecord } from '@/entities/agro/equipment-usage/types';
import type { Harvest } from '@/entities/agro/harvest/types';
import type { LaborRecord } from '@/entities/agro/labor-record/types';
import type { CostItem } from '@/entities/finance/cost-item/types';
import type { InventoryLot } from '@/entities/finance/inventory-lot/types';
import type { StockMovement } from '@/entities/finance/stock-movement/types';

const safe = (value: number): number => (Number.isFinite(value) ? value : 0);
const money = (value: number): number => Math.max(0, Math.round(safe(value)));

const buildBaseEntry = (
  partial: Omit<CostAllocationLedgerEntry, 'id'> & { id?: string }
): CostAllocationLedgerEntry => ({
  id: partial.id ?? crypto.randomUUID(),
  originType: partial.originType,
  originId: partial.originId,
  targetType: partial.targetType,
  targetId: partial.targetId,
  cropId: partial.cropId ?? null,
  cropPlanId: partial.cropPlanId ?? null,
  productionLotId: partial.productionLotId ?? null,
  areaNodeId: partial.areaNodeId ?? null,
  channelId: partial.channelId ?? null,
  driver: partial.driver,
  amountCents: money(partial.amountCents),
  occurredAt: partial.occurredAt,
  notes: partial.notes ?? ''
});

export const buildAllocationEntriesFromApplications = (
  applications: ApplicationEvent[],
  lots: InventoryLot[]
): CostAllocationLedgerEntry[] => {
  return applications.map((application) => {
    const stockLot = lots.find((lot) => lot.id === application.inventoryLotId);
    const amountCents = money((stockLot?.unitCostCents ?? 0) * Math.max(0, safe(application.quantityApplied)));

    return buildBaseEntry({
      id: `application-${application.id}`,
      originType: 'aplicacao',
      originId: application.id,
      targetType: application.productionLotId ? 'lote' : application.cropPlanId ? 'plano' : application.cropId ? 'cultura' : 'area',
      targetId: application.productionLotId ?? application.cropPlanId ?? application.cropId ?? application.areaNodeIds[0] ?? application.id,
      cropId: application.cropId,
      cropPlanId: application.cropPlanId,
      productionLotId: application.productionLotId,
      areaNodeId: application.areaNodeIds[0] ?? null,
      channelId: null,
      driver: 'por_quantidade_aplicada',
      amountCents,
      occurredAt: application.appliedAt,
      notes: application.doseDescription || application.notes
    });
  });
};

export const buildAllocationEntriesFromStockUsage = (
  movements: StockMovement[],
  lots: InventoryLot[]
): CostAllocationLedgerEntry[] => {
  return movements
    .filter((movement) => movement.movementType === 'uso')
    .map((movement) => {
      const stockLot = lots.find((lot) => lot.id === movement.inventoryLotId);
      const amountCents = money((stockLot?.unitCostCents ?? 0) * Math.max(0, safe(movement.quantity)));

      return buildBaseEntry({
        id: `stock-usage-${movement.id}`,
        originType: 'estoque',
        originId: movement.id,
        targetType: movement.targetType === 'geral' ? 'area' : movement.targetType,
        targetId: movement.targetId ?? movement.inventoryLotId,
        cropId: movement.targetType === 'cultura' ? movement.targetId : null,
        cropPlanId: movement.targetType === 'plano' ? movement.targetId : null,
        productionLotId: movement.targetType === 'lote' ? movement.targetId : null,
        areaNodeId: movement.targetType === 'area' ? movement.targetId : null,
        channelId: null,
        driver: 'manual',
        amountCents,
        occurredAt: movement.occurredAt,
        notes: movement.reason || movement.notes
      });
    });
};

export const buildAllocationEntriesFromLabor = (records: LaborRecord[]): CostAllocationLedgerEntry[] => {
  return records.map((record) =>
    buildBaseEntry({
      id: `labor-${record.id}`,
      originType: 'mao_de_obra',
      originId: record.id,
      targetType: record.productionLotId ? 'lote' : record.cropPlanId ? 'plano' : record.cropId ? 'cultura' : 'area',
      targetId: record.productionLotId ?? record.cropPlanId ?? record.cropId ?? record.areaNodeIds[0] ?? record.id,
      cropId: record.cropId,
      cropPlanId: record.cropPlanId,
      productionLotId: record.productionLotId,
      areaNodeId: record.areaNodeIds[0] ?? null,
      channelId: null,
      driver: 'por_hora',
      amountCents: money(record.totalCostCents),
      occurredAt: record.date,
      notes: record.taskName
    })
  );
};

export const buildAllocationEntriesFromEquipment = (records: EquipmentUsageRecord[]): CostAllocationLedgerEntry[] => {
  return records.map((record) =>
    buildBaseEntry({
      id: `equipment-${record.id}`,
      originType: 'maquina',
      originId: record.id,
      targetType: record.cropPlanId ? 'plano' : record.cropId ? 'cultura' : 'area',
      targetId: record.cropPlanId ?? record.cropId ?? record.areaNodeIds[0] ?? record.id,
      cropId: record.cropId,
      cropPlanId: record.cropPlanId,
      productionLotId: null,
      areaNodeId: record.areaNodeIds[0] ?? null,
      channelId: null,
      driver: record.areaCoveredSqm > 0 ? 'por_area' : 'por_hora',
      amountCents: money(record.usageCostCents + record.fuelCostCents),
      occurredAt: record.date,
      notes: record.operationName
    })
  );
};

export const buildAllocationEntriesFromIndirectCosts = (costItems: CostItem[]): CostAllocationLedgerEntry[] => {
  return costItems
    .filter((item) => item.isAppropriable)
    .map((item) =>
      buildBaseEntry({
        id: `cost-${item.id}`,
        originType: item.category.toLowerCase().includes('energia') ? 'energia' : item.category.toLowerCase().includes('agua') ? 'agua' : 'manual',
        originId: item.id,
        targetType: item.linkedLotId ? 'lote' : item.linkedCropId ? 'cultura' : 'area',
        targetId: item.linkedLotId ?? item.linkedCropId ?? item.linkedBedId ?? item.id,
        cropId: item.linkedCropId ?? null,
        cropPlanId: null,
        productionLotId: item.linkedLotId ?? null,
        areaNodeId: item.linkedBedId ?? null,
        channelId: item.linkedChannelId ?? null,
        driver: item.allocationDriver ?? 'manual',
        amountCents: money(item.eventValueCents > 0 ? item.eventValueCents : item.monthlyEquivalentCents),
        occurredAt: item.nextOccurrence || new Date().toISOString().slice(0, 10),
        notes: item.name
      })
    );
};

export const calculateAppropriatedCostByCrop = (cropId: string, ledger: CostAllocationLedgerEntry[]): number =>
  ledger.filter((entry) => entry.cropId === cropId).reduce((acc, entry) => acc + money(entry.amountCents), 0);

export const calculateAppropriatedCostByPlan = (planId: string, ledger: CostAllocationLedgerEntry[]): number =>
  ledger.filter((entry) => entry.cropPlanId === planId || (entry.targetType === 'plano' && entry.targetId === planId)).reduce((acc, entry) => acc + money(entry.amountCents), 0);

export const calculateAppropriatedCostByLot = (lotId: string, ledger: CostAllocationLedgerEntry[]): number =>
  ledger.filter((entry) => entry.productionLotId === lotId || (entry.targetType === 'lote' && entry.targetId === lotId)).reduce((acc, entry) => acc + money(entry.amountCents), 0);

export const calculateAppropriatedCostByChannel = (
  channelId: string,
  ledger: CostAllocationLedgerEntry[],
  harvests: Harvest[]
): number => {
  const directChannelCost = ledger
    .filter((entry) => entry.channelId === channelId || (entry.targetType === 'canal' && entry.targetId === channelId))
    .reduce((acc, entry) => acc + money(entry.amountCents), 0);

  const harvestedToChannel = harvests.reduce((acc, harvest) => {
    return (
      acc +
      harvest.destinationBreakdown
        .filter((destination) => destination.channelId === channelId)
        .reduce((sum, destination) => sum + money(destination.valueCents), 0)
    );
  }, 0);

  return directChannelCost + harvestedToChannel;
};
