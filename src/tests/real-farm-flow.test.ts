import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  createProductionPlanFromCulture,
  buildAllocationEntriesFromApplications,
  calculateInventoryBalance,
  type ApplicationEvent,
  type Crop,
  type DemandChannel,
  type Harvest,
  type InventoryLot,
  type Lot,
  type StockMovement
} from '@/entities';
import {
  useCostAllocationStore,
  useDemandChannelsStore,
  useEquipmentUsageStore,
  useFieldOperationsStore,
  useFinanceStore,
  useImplantationStore,
  useInventoryStore,
  useInvestmentsStore,
  useLaborStore,
  useMaintenanceStore,
  useProductionPlanningStore,
  usePurchasesStore,
  useTraceabilityStore
} from '@/app/store';
import { useFarmSnapshot } from '@/features/dashboard/model/useFarmSnapshot';

const resetOperationalStores = () => {
  localStorage.clear();
  useFinanceStore.setState({ costItems: [] });
  usePurchasesStore.setState({ purchases: [] });
  useProductionPlanningStore.setState({ crops: [], beds: [], plans: [] });
  useDemandChannelsStore.setState({ channels: [] });
  useTraceabilityStore.setState({ lots: [], searchQuery: '' });
  useInventoryStore.setState({ products: [], lots: [], movements: [] });
  useFieldOperationsStore.setState({ applications: [], losses: [] });
  useLaborStore.setState({ records: [] });
  useEquipmentUsageStore.setState({ records: [] });
  useCostAllocationStore.setState({ ledger: [] });
  useMaintenanceStore.setState({ events: [] });
  useInvestmentsStore.setState({ contracts: [] });
  useImplantationStore.setState({ projects: [], items: [] });
};

const buildCrop = (): Crop => ({
  id: 'crop-alface-americana',
  name: 'Alface',
  variety: 'Americana',
  category: 'Folhosa',
  preferredUnits: ['unit', 'box', 'weight'],
  cycleDays: 40,
  productionUnit: 'muda',
  salesUnit: 'unidade',
  purchaseType: 'caixa',
  unitsPerPurchasePack: 200,
  purchasePackCostCents: 3800,
  defaultPlantSpacingCm: 30,
  defaultRowSpacingCm: 25,
  defaultBedWidthM: 1.25,
  defaultBedLengthM: 50,
  unitsPerSalesBox: 12,
  defaultMarkupPct: 35,
  defaultLossRate: 8,
  baseSeedlingCostCents: 19,
  defaultCostSelections: [],
  environmentCompatibility: 'ambos'
});

describe('real farm flow', () => {
  beforeEach(() => {
    resetOperationalStores();
  });

  it('mantem saldo no estoque e apropria so o que foi aplicado', () => {
    const stockLot: InventoryLot = {
      id: 'lot-herbicida',
      productId: 'product-herbicida',
      purchaseId: 'purchase-herbicida',
      code: 'EST-ALF-01',
      receivedAt: '2026-03-01',
      quantityReceived: 50,
      quantityAvailable: 50,
      unit: 'L',
      unitCostCents: 2000,
      expirationDate: '2026-12-31',
      locationName: 'Galpao principal',
      status: 'ativo',
      notes: ''
    };

    const movement: StockMovement = {
      id: 'mov-aplicacao',
      inventoryLotId: stockLot.id,
      movementType: 'aplicacao',
      quantity: 10,
      unit: 'L',
      occurredAt: '2026-03-02',
      targetType: 'lote',
      targetId: 'lot-alface',
      reason: 'Pulverizacao da semana',
      notes: ''
    };

    const application: ApplicationEvent = {
      id: 'app-herbicida',
      inventoryLotId: stockLot.id,
      stockMovementId: movement.id,
      productId: stockLot.productId,
      cropId: 'crop-alface-americana',
      cropPlanId: 'plan-alface',
      productionLotId: 'lot-alface',
      areaNodeIds: ['bed-01'],
      cropStage: 'vegetativo',
      quantityApplied: 10,
      unit: 'L',
      appliedAreaSqm: 250,
      doseDescription: '10 L no bloco da alface',
      appliedAt: '2026-03-02',
      responsible: 'Equipe campo',
      equipmentName: 'Pulverizador costal',
      weatherNotes: '',
      notes: ''
    };

    expect(calculateInventoryBalance(stockLot, [movement])).toBe(40);

    const entries = buildAllocationEntriesFromApplications([application], [stockLot]);
    expect(entries).toHaveLength(1);
    expect(entries[0].amountCents).toBe(20000);
    expect(entries[0].targetType).toBe('lote');
    expect(entries[0].productionLotId).toBe('lot-alface');
  });

  it('fecha o fluxo compra > estoque > aplicacao > apropriacao > colheita > margem real', () => {
    const crop = buildCrop();
    const plan = createProductionPlanFromCulture(crop, {
      id: 'plan-alface',
      cropId: crop.id,
      bedCount: 4,
      areaTotalSqm: 250,
      bedLengthM: 50,
      bedWidthM: 1.25,
      status: 'ativo'
    });

    const channel: DemandChannel = {
      id: 'channel-box',
      type: 'box',
      name: 'Box semanal',
      priority: 1,
      pricingMode: 'unit',
      demandUnit: 'unidade',
      baselineDemand: 0,
      scenarioDemand: 0,
      enabled: true
    };

    const purchaseId = usePurchasesStore.getState().addPurchase({
      name: 'Herbicida para campo aberto',
      category: 'Insumos operacionais',
      subcategory: 'Protecao',
      supplier: 'Agro Verde',
      eventValueCents: 100000,
      monthlyEquivalentCents: 0,
      linkedCropId: crop.id,
      linkedCostCenter: 'Campo aberto',
      isStockable: true,
      receivedAt: '2026-03-01',
      receivedQuantity: 50,
      receivedUnit: 'L',
      paymentStatus: 'pago',
      status: 'ativo'
    });

    const productId = useInventoryStore.getState().addProduct({
      name: 'Herbicida',
      commercialName: 'Herbicida Campo',
      category: 'defensivo',
      defaultUnit: 'L',
      notes: ''
    });

    const stockLotId = useInventoryStore.getState().addLot({
      productId,
      purchaseId,
      code: 'EST-HERB-01',
      receivedAt: '2026-03-01',
      quantityReceived: 50,
      quantityAvailable: 50,
      unit: 'L',
      unitCostCents: 2000,
      expirationDate: '2026-12-31',
      locationName: 'Galpao principal',
      notes: ''
    });

    const applicationMovementId = useInventoryStore.getState().addMovement({
      inventoryLotId: stockLotId,
      movementType: 'aplicacao',
      quantity: 10,
      unit: 'L',
      occurredAt: '2026-03-05',
      targetType: 'lote',
      targetId: 'lot-alface',
      reason: 'Aplicacao no alface'
    });

    useFieldOperationsStore.getState().addApplication({
      inventoryLotId: stockLotId,
      stockMovementId: applicationMovementId,
      productId,
      cropId: crop.id,
      cropPlanId: plan.id,
      productionLotId: 'lot-alface',
      areaNodeIds: ['bed-01', 'bed-02', 'bed-03', 'bed-04'],
      cropStage: 'vegetativo',
      quantityApplied: 10,
      unit: 'L',
      appliedAreaSqm: 250,
      doseDescription: 'Aplicacao parcial do bloco',
      appliedAt: '2026-03-05',
      responsible: 'Equipe campo',
      equipmentName: 'Pulverizador costal'
    });

    useLaborStore.getState().addRecord({
      date: '2026-03-05',
      teamName: 'Equipe campo',
      taskName: 'Aplicacao manual',
      cropId: crop.id,
      cropPlanId: plan.id,
      productionLotId: 'lot-alface',
      areaNodeIds: ['bed-01'],
      hoursWorked: 4,
      hourlyCostCents: 2500,
      totalCostCents: 10000
    });

    const harvest: Harvest = {
      id: 'harvest-alface',
      lotId: 'lot-alface',
      harvestedAt: '2026-04-15',
      grossQuantity: 1000,
      marketableQuantity: 900,
      lossQuantity: 100,
      unit: 'unidade',
      destinationBreakdown: [
        {
          channelId: channel.id,
          quantity: 900,
          unit: 'unidade',
          valueCents: 54000
        }
      ],
      quantity: 1000
    };

    const productionLot: Lot = {
      id: 'lot-alface',
      code: 'DNMS-20260301-001',
      cropId: crop.id,
      cropPlanId: plan.id,
      variety: crop.variety,
      receivedAt: '2026-03-01',
      quantityReceived: 3200,
      quantityPlanted: 3200,
      origin: 'Viveiro parceiro',
      location: 'Bloco 1',
      areaNodeIds: ['bed-01', 'bed-02', 'bed-03', 'bed-04'],
      stage: 'colheita',
      applicationLogs: [],
      applicationEvents: [],
      harvests: [harvest],
      appropriatedCostCents: 0,
      marketableQuantity: 900,
      discardedQuantity: 100,
      traceabilityStatus: 'completa',
      notes: ''
    };

    useProductionPlanningStore.setState({ crops: [crop], beds: [], plans: [plan] });
    useDemandChannelsStore.setState({ channels: [channel] });
    useTraceabilityStore.setState({ lots: [productionLot] });
    useCostAllocationStore.getState().rebuildFromFacts();

    const { result, unmount } = renderHook(() => useFarmSnapshot());

    expect(result.current.inventory.lots[0].quantityAvailable).toBe(40);
    expect(result.current.allocationLedger).toHaveLength(2);
    expect(result.current.allocationLedger.some((entry) => entry.originType === 'aplicacao')).toBe(true);
    expect(result.current.allocationLedger.some((entry) => entry.originType === 'mao_de_obra')).toBe(true);

    expect(result.current.realPlans[0].plannedOnly).toBe(false);
    expect(result.current.realPlans[0].appropriatedCostCents).toBe(30000);
    expect(result.current.realEconomics.rows[0].marketableUnits).toBe(900);
    expect(result.current.realEconomics.rows[0].costPerUnitCents).toBe(33);
    expect(result.current.realEconomics.rows[0].minimumSalePricePerUnitCents).toBe(33);
    expect(result.current.realEconomics.rows[0].plannedOnly).toBe(false);
    expect(result.current.plannedEconomics.rows[0].plannedOnly).toBe(true);

    expect(result.current.realMarginByChannel[0].revenueCents).toBe(54000);
    expect(result.current.realMarginByChannel[0].costCents).toBe(30000);
    expect(result.current.realMarginByChannel[0].marginCents).toBe(24000);

    unmount();
  });
});
