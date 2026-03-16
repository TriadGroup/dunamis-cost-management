import {
  useCostAllocationStore,
  useDemandChannelsStore,
  useEquipmentUsageStore,
  useFinanceStore,
  useFieldOperationsStore,
  useImplantationStore,
  useInventoryStore,
  useInvestmentsStore,
  useLaborStore,
  useMaintenanceStore,
  useProductionPlanningStore,
  usePurchasesStore,
  useScenariosStore,
  useSetupStore,
  useSyncQueueStore,
  useTraceabilityStore,
  useUiPreferencesStore
} from '@/app/store';
import type {
  ApplicationEvent,
  Bed,
  CostItem,
  Crop,
  CropPlan,
  CropPurchaseType,
  CropUnitType,
  DemandChannel,
  EquipmentUsageRecord,
  ImplantationItem,
  InvestmentContract,
  InventoryLot,
  InventoryProduct,
  LaborRecord,
  LossEvent,
  Lot,
  MaintenanceEvent,
  PurchaseItem,
  StockMovement
} from '@/entities';
import {
  buildAllocationEntriesFromApplications,
  buildAllocationEntriesFromEquipment,
  buildAllocationEntriesFromIndirectCosts,
  buildAllocationEntriesFromLabor,
  createProductionPlanFromCulture
} from '@/entities';
import {
  seedApplications,
  seedBeds,
  seedChannels,
  seedCosts,
  seedCropPlans,
  seedCrops,
  seedEquipmentUsageRecords,
  seedGuidelines,
  seedInventoryLots,
  seedInventoryProducts,
  seedImplantation,
  seedImplantationProjects,
  seedInvestments,
  seedLaborRecords,
  seedLosses,
  seedLots,
  seedMaintenance,
  seedPhotoperiod,
  seedPurchases,
  seedScenarios,
  seedStockMovements
} from '@/app/store/seedData';
import type { InitialCropEntry, SetupState, StructureEntry } from '@/app/store/useSetupStore';

const cloneValue = <T>(value: T): T => structuredClone(value);

const cropVisualDefaults: Record<
  string,
  {
    preferredUnits: Array<'unit' | 'weight' | 'box' | 'bulk'>;
    productionUnit: CropUnitType;
    salesUnit: CropUnitType;
    purchaseType: CropPurchaseType;
    unitsPerPurchasePack: number;
    purchasePackCostCents: number;
    plantSpacingCm: number;
    rowSpacingCm: number;
    unitsPerSalesBox: number;
    markupPct: number;
    lossRate: number;
  }
> = {
  alface: {
    preferredUnits: ['unit', 'box', 'weight'],
    productionUnit: 'muda',
    salesUnit: 'unidade',
    purchaseType: 'caixa',
    unitsPerPurchasePack: 200,
    purchasePackCostCents: 82000,
    plantSpacingCm: 30,
    rowSpacingCm: 25,
    unitsPerSalesBox: 12,
    markupPct: 35,
    lossRate: 8
  },
  rucula: {
    preferredUnits: ['unit', 'box', 'weight'],
    productionUnit: 'muda',
    salesUnit: 'maco',
    purchaseType: 'bandeja',
    unitsPerPurchasePack: 288,
    purchasePackCostCents: 76000,
    plantSpacingCm: 12,
    rowSpacingCm: 18,
    unitsPerSalesBox: 18,
    markupPct: 38,
    lossRate: 10
  },
  coentro: {
    preferredUnits: ['unit', 'box', 'weight'],
    productionUnit: 'muda',
    salesUnit: 'maco',
    purchaseType: 'bandeja',
    unitsPerPurchasePack: 288,
    purchasePackCostCents: 73000,
    plantSpacingCm: 10,
    rowSpacingCm: 15,
    unitsPerSalesBox: 20,
    markupPct: 40,
    lossRate: 10
  },
  cebolinha: {
    preferredUnits: ['unit', 'box', 'weight'],
    productionUnit: 'muda',
    salesUnit: 'maco',
    purchaseType: 'bandeja',
    unitsPerPurchasePack: 288,
    purchasePackCostCents: 79000,
    plantSpacingCm: 12,
    rowSpacingCm: 15,
    unitsPerSalesBox: 20,
    markupPct: 40,
    lossRate: 10
  }
};

const channelNameMap: Record<SetupState['channels'][number], string> = {
  cozinha_interna: 'Cozinha interna',
  box: 'Box',
  feira_eventos: 'Feira e eventos',
  mercado_regional: 'Mercado regional',
  venda_direta: 'Venda direta',
  atacado_granel: 'Atacado / granel',
  excedente: 'Excedente',
  consumo_interno: 'Consumo interno',
  doacao: 'Doacao'
};

const channelTypeMap: Record<SetupState['channels'][number], DemandChannel['type']> = {
  cozinha_interna: 'kitchen',
  box: 'box',
  feira_eventos: 'event',
  mercado_regional: 'external-market',
  venda_direta: 'external-market',
  atacado_granel: 'external-market',
  excedente: 'surplus',
  consumo_interno: 'kitchen',
  doacao: 'surplus'
};

const buildCropsFromSetup = (initialCrops: InitialCropEntry[]): Crop[] => {
  return initialCrops.map((entry, index) => {
    const normalized = entry.item.toLowerCase();
    const defaults = cropVisualDefaults[normalized] ?? {
      preferredUnits: ['unit', 'box', 'weight'] as Array<'unit' | 'weight' | 'box' | 'bulk'>,
      productionUnit: 'muda' as CropUnitType,
      salesUnit: 'unidade' as CropUnitType,
      purchaseType: 'caixa' as CropPurchaseType,
      unitsPerPurchasePack: 200,
      purchasePackCostCents: 80000,
      plantSpacingCm: entry.category === 'folhosas' || entry.category === 'ervas' ? 20 : 35,
      rowSpacingCm: entry.category === 'folhosas' || entry.category === 'ervas' ? 20 : 40,
      unitsPerSalesBox: 12,
      markupPct: 35,
      lossRate: entry.category === 'folhosas' ? 8 : 12
    };

    return {
      id: `crop-${normalized.replace(/\s+/g, '-')}-${index + 1}`,
      name: entry.item,
      variety: 'Padrao inicial',
      category: entry.category,
      preferredUnits: defaults.preferredUnits,
      cycleDays: entry.category === 'folhosas' || entry.category === 'ervas' ? 40 : 90,
      productionUnit: defaults.productionUnit,
      salesUnit: defaults.salesUnit,
      purchaseType: defaults.purchaseType,
      unitsPerPurchasePack: defaults.unitsPerPurchasePack,
      purchasePackCostCents: defaults.purchasePackCostCents,
      defaultPlantSpacingCm: defaults.plantSpacingCm,
      defaultRowSpacingCm: defaults.rowSpacingCm,
      defaultBedWidthM: 1.25,
      defaultBedLengthM: 50,
      unitsPerSalesBox: defaults.unitsPerSalesBox,
      defaultMarkupPct: defaults.markupPct,
      defaultLossRate: defaults.lossRate,
      baseSeedlingCostCents: Math.round(defaults.purchasePackCostCents / Math.max(1, defaults.unitsPerPurchasePack)),
      defaultCostSelections: [],
      notes: 'Criado no setup inicial.',
      environmentCompatibility: 'ambos'
    };
  });
};

const buildBedsFromSetup = (structures: StructureEntry[]): Bed[] => {
  const beds: Bed[] = [];
  const canteiros = structures.find((entry) => entry.type === 'canteiros')?.quantity ?? 0;
  const estufas = structures.find((entry) => entry.type === 'estufas')?.quantity ?? 0;

  for (let index = 0; index < canteiros; index += 1) {
    beds.push({
      id: `bed-open-${index + 1}`,
      name: `Canteiro ${index + 1}`,
      type: 'canteiro_solo',
      sizeSqm: 18,
      environment: 'campo_aberto'
    });
  }

  for (let index = 0; index < estufas; index += 1) {
    beds.push({
      id: `bed-protected-${index + 1}`,
      name: `Estufa ${index + 1}`,
      type: 'protegido',
      sizeSqm: 24,
      environment: 'protegido'
    });
  }

  return beds;
};

const buildPlansFromSetup = (crops: Crop[], beds: Bed[]): CropPlan[] => {
  return crops.map((crop, index) => {
    const bedCount = Math.max(1, Math.min(beds.length || 1, index + 1));
    return createProductionPlanFromCulture(crop, {
      id: `plan-${crop.id}`,
      cropId: crop.id,
      targetChannelMix: { box: 40, kitchen: 30, 'external-market': 20, surplus: 10 },
      bedCount,
      bedLengthM: crop.defaultBedLengthM,
      bedWidthM: crop.defaultBedWidthM,
      areaTotalSqm: bedCount * crop.defaultBedLengthM * crop.defaultBedWidthM,
      expectedLossRate: crop.defaultLossRate,
      purchasePackType: crop.purchaseType,
      unitsPerPurchasePack: crop.unitsPerPurchasePack,
      purchasePackCostCents: crop.purchasePackCostCents,
      salesUnit: crop.salesUnit,
      unitsPerSalesBox: crop.unitsPerSalesBox,
      markupPct: crop.defaultMarkupPct,
      costAllocations: [],
      status: 'rascunho'
    });
  });
};

const buildChannelsFromSetup = (channels: SetupState['channels']): DemandChannel[] => {
  return channels.map((channel, index) => ({
    id: `channel-${channel}-${index + 1}`,
    type: channelTypeMap[channel],
    name: channelNameMap[channel],
    priority: index + 1,
    pricingMode: channel === 'box' ? 'box' : channel === 'atacado_granel' ? 'bulk' : 'unit',
    demandUnit: channel === 'box' ? 'caixa' : channel === 'atacado_granel' ? 'kg' : 'unidade',
    baselineDemand: channel === 'cozinha_interna' ? 320 : channel === 'box' ? 28 : 120,
    scenarioDemand: channel === 'cozinha_interna' ? 320 : channel === 'box' ? 28 : 120,
    transferPriceCents: channel === 'cozinha_interna' || channel === 'consumo_interno' ? 900 : 1200,
    acceptedPriceCents: channel === 'cozinha_interna' || channel === 'consumo_interno' ? 850 : 1250,
    enabled: true
  }));
};

const defaultCultureDraftState = () => ({
  name: '',
  variety: '',
  category: 'Folhosa',
  cycleDays: 40,
  productionUnit: 'muda' as CropUnitType,
  salesUnit: 'unidade' as CropUnitType,
  purchaseType: 'caixa' as CropPurchaseType,
  unitsPerPurchasePack: 200,
  purchasePackCostCents: 0,
  defaultPlantSpacingCm: 30,
  defaultRowSpacingCm: 25,
  defaultBedWidthM: 1.25,
  defaultBedLengthM: 50,
  unitsPerSalesBox: 12,
  defaultMarkupPct: 35,
  defaultLossRate: 8,
  baseSeedlingCostCents: 0,
  defaultCostSelections: [],
  environmentCompatibility: 'ambos' as Crop['environmentCompatibility'],
  notes: ''
});

const defaultPlanDraftState = (crop?: Crop) => ({
  cropId: crop?.id ?? '',
  areaTotalSqm: crop ? crop.defaultBedLengthM * crop.defaultBedWidthM : 0,
  bedCount: 1,
  bedLengthM: crop?.defaultBedLengthM ?? 50,
  bedWidthM: crop?.defaultBedWidthM ?? 1.25,
  plantSpacingCm: crop?.defaultPlantSpacingCm ?? 30,
  rowSpacingCm: crop?.defaultRowSpacingCm ?? 25,
  cycleDays: crop?.cycleDays ?? 40,
  expectedLossRate: crop?.defaultLossRate ?? 8,
  purchasePackType: crop?.purchaseType ?? 'caixa',
  unitsPerPurchasePack: crop?.unitsPerPurchasePack ?? 200,
  purchasePackCostCents: crop?.purchasePackCostCents ?? 0,
  salesUnit: crop?.salesUnit ?? 'unidade',
  unitsPerSalesBox: crop?.unitsPerSalesBox ?? 12,
  markupPct: crop?.defaultMarkupPct ?? 35,
  staggeredProduction: true,
  targetChannelMix: { box: 40, kitchen: 30, 'external-market': 20, surplus: 10 },
  costAllocations: [],
  notes: '',
  status: 'rascunho' as const
});

const setWorkspaceFromSetup = (setup: SetupState) => {
  const crops = buildCropsFromSetup(setup.initialCrops);
  const beds = buildBedsFromSetup(setup.structures);
  const plans = buildPlansFromSetup(crops, beds);
  const channels = buildChannelsFromSetup(setup.channels);

  useProductionPlanningStore.setState({
    crops,
    beds,
    plans,
    cultureDraft: defaultCultureDraftState(),
    draft: defaultPlanDraftState(crops[0])
  });

  useDemandChannelsStore.setState({
    channels,
    scenarios: cloneValue(seedScenarios),
    activeScenarioId: seedScenarios[0]?.id ?? ''
  });
  useScenariosStore.setState({
    scenarios: cloneValue(seedScenarios),
    baselineScenarioId: seedScenarios[0]?.id ?? '',
    compareScenarioId: seedScenarios[1]?.id ?? seedScenarios[0]?.id ?? ''
  });

  useFinanceStore.setState({ costItems: [] as CostItem[] });
  usePurchasesStore.setState({ purchases: [] as PurchaseItem[] });
  useInventoryStore.setState({ products: [] as InventoryProduct[], lots: [] as InventoryLot[], movements: [] as StockMovement[] });
  useFieldOperationsStore.setState({ applications: [] as ApplicationEvent[], losses: [] as LossEvent[] });
  useLaborStore.setState({ records: [] as LaborRecord[] });
  useEquipmentUsageStore.setState({ records: [] as EquipmentUsageRecord[] });
  useCostAllocationStore.setState({ ledger: [] });
  useMaintenanceStore.setState({ events: [] as MaintenanceEvent[] });
  useInvestmentsStore.setState({ contracts: [] as InvestmentContract[] });
  useImplantationStore.setState({
    projects: [],
    items: [] as ImplantationItem[],
    projectDraft: {
      name: '',
      description: '',
      budgetTargetCents: 0,
      status: 'planejamento',
      startDate: '',
      targetEndDate: '',
      notes: ''
    },
    draft: {
      projectId: '',
      group: 'solo',
      name: '',
      description: '',
      priority: 'media',
      paymentMode: 'avista',
      deadline: '',
      notes: ''
    }
  });
  useTraceabilityStore.setState({
    lots: [] as Lot[],
    searchQuery: '',
    draft: {
      cropId: crops[0]?.id ?? '',
      variety: '',
      origin: '',
      receivedAt: '',
      quantityReceived: 0,
      quantityPlanted: 0,
      location: '',
      notes: ''
    }
  });
};

export const loadExampleWorkspace = () => {
  // Demo data should not be synced
  useSetupStore.getState().loadDemoSetup();
  
  useProductionPlanningStore.setState({
    crops: cloneValue(seedCrops),
    beds: cloneValue(seedBeds),
    plans: cloneValue(seedCropPlans),
    cultureDraft: defaultCultureDraftState(),
    draft: defaultPlanDraftState(seedCrops[0])
  });
  useDemandChannelsStore.setState({
    channels: cloneValue(seedChannels),
    scenarios: cloneValue(seedScenarios),
    activeScenarioId: seedScenarios[0]?.id ?? ''
  });
  useScenariosStore.setState({
    scenarios: cloneValue(seedScenarios),
    baselineScenarioId: seedScenarios[0]?.id ?? '',
    compareScenarioId: seedScenarios[1]?.id ?? seedScenarios[0]?.id ?? ''
  });
  useFinanceStore.setState({ costItems: cloneValue(seedCosts) });
  usePurchasesStore.setState({ purchases: cloneValue(seedPurchases) });
  useInventoryStore.setState({
    products: cloneValue(seedInventoryProducts),
    lots: cloneValue(seedInventoryLots),
    movements: cloneValue(seedStockMovements)
  });
  useFieldOperationsStore.setState({ applications: cloneValue(seedApplications), losses: cloneValue(seedLosses) });
  useLaborStore.setState({ records: cloneValue(seedLaborRecords) });
  useEquipmentUsageStore.setState({ records: cloneValue(seedEquipmentUsageRecords) });
  useCostAllocationStore.setState({
    ledger: [
      ...buildAllocationEntriesFromApplications(seedApplications, seedInventoryLots),
      ...buildAllocationEntriesFromLabor(seedLaborRecords),
      ...buildAllocationEntriesFromEquipment(seedEquipmentUsageRecords),
      ...buildAllocationEntriesFromIndirectCosts(seedCosts)
    ]
  });
  useMaintenanceStore.setState({ events: cloneValue(seedMaintenance) });
  useInvestmentsStore.setState({ contracts: cloneValue(seedInvestments) });
  useImplantationStore.setState({
    projects: cloneValue(seedImplantationProjects),
    items: cloneValue(seedImplantation),
    projectDraft: {
      name: '',
      description: '',
      budgetTargetCents: 0,
      status: 'planejamento',
      startDate: '',
      targetEndDate: '',
      notes: ''
    },
    draft: {
      projectId: seedImplantationProjects[0]?.id ?? '',
      group: 'solo',
      name: '',
      description: '',
      priority: 'media',
      paymentMode: 'avista',
      deadline: '',
      notes: ''
    }
  });
  useTraceabilityStore.setState({
    lots: cloneValue(seedLots),
    searchQuery: '',
    draft: {
      cropId: seedCrops[0]?.id ?? '',
      variety: '',
      origin: '',
      receivedAt: '',
      quantityReceived: 0,
      quantityPlanted: 0,
      location: '',
      notes: ''
    }
  });
  useUiPreferencesStore.getState().setActiveRoute('dashboard');
};

export const applySetupWorkspace = () => {
  const setup = useSetupStore.getState();
  // New setup is NOT demo by default unless specified
  setWorkspaceFromSetup(setup);
  useUiPreferencesStore.getState().setActiveRoute('dashboard');
};

export const resetWorkspaceToEmpty = () => {
  useSetupStore.getState().resetSetup(); // This clears isDemo too
  
  useProductionPlanningStore.setState({
    crops: [] as Crop[],
    beds: [] as Bed[],
    plans: [] as CropPlan[],
    cultureDraft: defaultCultureDraftState(),
    draft: defaultPlanDraftState()
  });
  useDemandChannelsStore.setState({
    channels: [] as DemandChannel[],
    scenarios: cloneValue(seedScenarios),
    activeScenarioId: seedScenarios[0]?.id ?? ''
  });
  useScenariosStore.setState({
    scenarios: cloneValue(seedScenarios),
    baselineScenarioId: seedScenarios[0]?.id ?? '',
    compareScenarioId: seedScenarios[1]?.id ?? seedScenarios[0]?.id ?? ''
  });
  useFinanceStore.setState({ costItems: [] as CostItem[] });
  usePurchasesStore.setState({ purchases: [] as PurchaseItem[] });
  useInventoryStore.setState({ products: [] as InventoryProduct[], lots: [] as InventoryLot[], movements: [] as StockMovement[] });
  useFieldOperationsStore.setState({ applications: [] as ApplicationEvent[], losses: [] as LossEvent[] });
  useLaborStore.setState({ records: [] as LaborRecord[] });
  useEquipmentUsageStore.setState({ records: [] as EquipmentUsageRecord[] });
  useCostAllocationStore.setState({ ledger: [] });
  useMaintenanceStore.setState({ events: [] as MaintenanceEvent[] });
  useInvestmentsStore.setState({ contracts: [] as InvestmentContract[] });
  useImplantationStore.setState({
    projects: [],
    items: [],
    projectDraft: {
      name: '',
      description: '',
      budgetTargetCents: 0,
      status: 'planejamento',
      startDate: '',
      targetEndDate: '',
      notes: ''
    },
    draft: {
      projectId: '',
      group: 'solo',
      name: '',
      description: '',
      priority: 'media',
      paymentMode: 'avista',
      deadline: '',
      notes: ''
    }
  });
  useTraceabilityStore.setState({
    lots: [] as Lot[],
    searchQuery: '',
    draft: {
      cropId: '',
      variety: '',
      origin: '',
      receivedAt: '',
      quantityReceived: 0,
      quantityPlanted: 0,
      location: '',
      notes: ''
    }
  });
  useUiPreferencesStore.getState().setActiveRoute('dashboard');
};

export const staticKnowledgeState = {
  guidelines: cloneValue(seedGuidelines),
  photoperiod: cloneValue(seedPhotoperiod),
  scenarios: cloneValue(seedScenarios)
};
