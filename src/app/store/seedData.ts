import {
  createProductionPlanFromCulture,
  type AgronomicGuideline,
  type ApplicationEvent,
  type AreaNode,
  type Bed,
  type CashScenario,
  type CostAllocationLedgerEntry,
  type CostItem,
  type Crop,
  type CropPlan,
  type DemandChannel,
  type EquipmentUsageRecord,
  type ImplantationItem,
  type ImplantationProject,
  type InventoryLot,
  type InventoryProduct,
  type InvestmentContract,
  type LaborRecord,
  type LossEvent,
  type Lot,
  type MaintenanceEvent,
  type PhotoperiodEntry,
  type PurchaseItem,
  type StockMovement
} from '@/entities';

const now = new Date();
const isoDate = (offsetDays = 0): string => {
  const d = new Date(now);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export const seedCrops: Crop[] = [
  {
    id: 'crop-alface',
    name: 'Alface',
    variety: 'Crespa Vanda',
    category: 'Folhosa',
    preferredUnits: ['unit', 'box', 'weight'],
    cycleDays: 40,
    productionUnit: 'muda',
    salesUnit: 'unidade',
    purchaseType: 'caixa',
    unitsPerPurchasePack: 200,
    purchasePackCostCents: 82000,
    defaultPlantSpacingCm: 30,
    defaultRowSpacingCm: 25,
    defaultBedWidthM: 1.25,
    defaultBedLengthM: 50,
    unitsPerSalesBox: 12,
    defaultMarkupPct: 35,
    defaultLossRate: 8,
    baseSeedlingCostCents: 410,
    defaultCostSelections: [
      {
        id: 'crop-alface-default-herbicida',
        sourceType: 'cost_item',
        sourceId: 'cost-herbicida',
        label: 'Herbicida',
        category: 'Insumos operacionais',
        costValueCents: 38000,
        allocationMode: 'total',
        allocatedPerBedCents: 0,
        allocatedPerUnitCents: 0,
        inheritedFromCrop: true,
        enabled: true
      }
    ],
    notes: 'Folhosa de giro rápido, venda principal por unidade e caixa.',
    environmentCompatibility: 'ambos'
  },
  {
    id: 'crop-rucula',
    name: 'Rúcula',
    variety: 'Cultivada',
    category: 'Folhosa',
    preferredUnits: ['unit', 'box', 'weight'],
    cycleDays: 35,
    productionUnit: 'muda',
    salesUnit: 'maco',
    purchaseType: 'bandeja',
    unitsPerPurchasePack: 288,
    purchasePackCostCents: 76000,
    defaultPlantSpacingCm: 12,
    defaultRowSpacingCm: 18,
    defaultBedWidthM: 1.25,
    defaultBedLengthM: 50,
    unitsPerSalesBox: 18,
    defaultMarkupPct: 38,
    defaultLossRate: 10,
    baseSeedlingCostCents: 264,
    defaultCostSelections: [
      {
        id: 'crop-rucula-default-adubo',
        sourceType: 'purchase_item',
        sourceId: 'purchase-adubo',
        label: 'Adubo NPK',
        category: 'Insumo',
        costValueCents: 92000,
        allocationMode: 'total',
        allocatedPerBedCents: 0,
        allocatedPerUnitCents: 0,
        inheritedFromCrop: true,
        enabled: true
      }
    ],
    notes: 'Venda frequente em maço e composição para box.',
    environmentCompatibility: 'ambos'
  }
];

export const seedBeds: Bed[] = [
  { id: 'bed-1', name: 'Canteiro A1', type: 'canteiro_solo', sizeSqm: 24, environment: 'campo_aberto' },
  { id: 'bed-2', name: 'Canteiro A2', type: 'canteiro_solo', sizeSqm: 24, environment: 'campo_aberto' },
  { id: 'bed-3', name: 'Canteiro B1', type: 'protegido', sizeSqm: 20, environment: 'protegido' },
  { id: 'bed-4', name: 'Canteiro B2', type: 'protegido', sizeSqm: 20, environment: 'protegido' }
];

export const seedCropPlans: CropPlan[] = [
  createProductionPlanFromCulture(seedCrops[0], {
    id: 'plan-alface',
    cropId: 'crop-alface',
    targetChannelMix: { box: 45, kitchen: 30, 'external-market': 20, surplus: 5 },
    bedCount: 4,
    bedLengthM: 50,
    bedWidthM: 1.25,
    areaTotalSqm: 250,
    expectedLossRate: 8,
    purchasePackCostCents: 82000,
    unitsPerPurchasePack: 200,
    unitsPerSalesBox: 12,
    markupPct: 35,
    costAllocations: [
      {
        id: 'cost-alloc-alface-adubo',
        sourceType: 'cost_item',
        sourceId: 'cost-herbicida',
        label: 'Herbicida',
        category: 'Insumos operacionais',
        costValueCents: 145000,
        allocationMode: 'total',
        allocatedPerBedCents: 0,
        allocatedPerUnitCents: 0,
        inheritedFromCrop: true,
        enabled: true
      },
      {
        id: 'cost-alloc-alface-irrigacao',
        sourceType: 'manual',
        sourceId: null,
        label: 'Irrigação complementar',
        category: 'Irrigação',
        costValueCents: 52000,
        allocationMode: 'total',
        allocatedPerBedCents: 0,
        allocatedPerUnitCents: 0,
        inheritedFromCrop: false,
        enabled: true
      }
    ],
    status: 'ativo'
  }),
  createProductionPlanFromCulture(seedCrops[1], {
    id: 'plan-rucula',
    cropId: 'crop-rucula',
    targetChannelMix: { box: 40, kitchen: 35, event: 10, 'external-market': 15 },
    bedCount: 3,
    bedLengthM: 50,
    bedWidthM: 1.25,
    areaTotalSqm: 187.5,
    expectedLossRate: 10,
    purchasePackType: 'bandeja',
    purchasePackCostCents: 76000,
    unitsPerPurchasePack: 288,
    salesUnit: 'maco',
    unitsPerSalesBox: 18,
    markupPct: 38,
    costAllocations: [
      {
        id: 'cost-alloc-rucula-correcao',
        sourceType: 'purchase_item',
        sourceId: 'purchase-adubo',
        label: 'Adubo NPK',
        category: 'Insumo',
        costValueCents: 116000,
        allocationMode: 'total',
        allocatedPerBedCents: 0,
        allocatedPerUnitCents: 0,
        inheritedFromCrop: true,
        enabled: true
      },
      {
        id: 'cost-alloc-rucula-mao-obra',
        sourceType: 'manual',
        sourceId: null,
        label: 'Mão de obra',
        category: 'Mão de obra',
        costValueCents: 98000,
        allocationMode: 'total',
        allocatedPerBedCents: 0,
        allocatedPerUnitCents: 0,
        inheritedFromCrop: false,
        enabled: true
      }
    ],
    status: 'ativo'
  })
];

export const seedChannels: DemandChannel[] = [
  {
    id: 'channel-box',
    type: 'box',
    name: 'Box semanal',
    priority: 1,
    pricingMode: 'box',
    demandUnit: 'caixa',
    baselineDemand: 210,
    scenarioDemand: 210,
    transferPriceCents: 1200,
    acceptedPriceCents: 1350,
    enabled: true
  },
  {
    id: 'channel-kitchen',
    type: 'kitchen',
    name: 'Cozinha interna',
    priority: 2,
    pricingMode: 'unit',
    demandUnit: 'unidade',
    baselineDemand: 190,
    scenarioDemand: 190,
    transferPriceCents: 1000,
    acceptedPriceCents: 850,
    enabled: true
  },
  {
    id: 'channel-external',
    type: 'external-market',
    name: 'Mercado regional',
    priority: 3,
    pricingMode: 'unit',
    demandUnit: 'unidade',
    baselineDemand: 120,
    scenarioDemand: 120,
    transferPriceCents: 900,
    acceptedPriceCents: 920,
    enabled: true
  },
  {
    id: 'channel-event',
    type: 'event',
    name: 'Feiras e eventos',
    priority: 4,
    pricingMode: 'unit',
    demandUnit: 'unidade',
    baselineDemand: 45,
    scenarioDemand: 45,
    transferPriceCents: 1500,
    acceptedPriceCents: 1550,
    enabled: true
  },
  {
    id: 'channel-surplus',
    type: 'surplus',
    name: 'Excedente',
    priority: 5,
    pricingMode: 'bulk',
    demandUnit: 'caixa',
    baselineDemand: 30,
    scenarioDemand: 30,
    transferPriceCents: 500,
    acceptedPriceCents: 500,
    enabled: true
  }
];

export const seedCosts: CostItem[] = [
  {
    id: 'cost-herbicida',
    category: 'Insumos operacionais',
    subcategory: 'Proteção',
    name: 'Herbicida',
    recurrenceType: 'sazonal',
    eventValueCents: 38000,
    monthlyEquivalentCents: 12500,
    nextOccurrence: isoDate(15),
    supplier: 'Agro Verde',
    linkedCropId: 'crop-alface',
    linkedCostCenter: 'Operação diária',
    allocationDriver: 'manual',
    isAppropriable: false,
    notes: 'Aplicação trimestral',
    status: 'ativo'
  },
  {
    id: 'cost-epi',
    category: 'EPI e segurança',
    subcategory: 'Descartáveis',
    name: 'Luva, máscara, protetor e repelente',
    recurrenceType: 'recorrente',
    eventValueCents: 52000,
    monthlyEquivalentCents: 52000,
    nextOccurrence: isoDate(7),
    supplier: 'Distribuidor local',
    linkedCostCenter: 'Equipe campo',
    allocationDriver: 'manual',
    isAppropriable: false,
    notes: 'Consumo mensal médio',
    status: 'ativo'
  },
  {
    id: 'cost-evento-extra',
    category: 'Operação comercial',
    subcategory: 'Extraordinário',
    name: 'Custo extra para evento sazonal',
    recurrenceType: 'extraordinario',
    eventValueCents: 95000,
    monthlyEquivalentCents: 9000,
    nextOccurrence: isoDate(20),
    supplier: 'Equipe externa',
    linkedChannelId: 'channel-event',
    allocationDriver: 'manual',
    isAppropriable: false,
    notes: 'Só para cenário extraordinário',
    status: 'ativo'
  }
];

export const seedPurchases: PurchaseItem[] = [
  {
    id: 'purchase-adubo',
    name: 'Adubo NPK',
    category: 'Insumo',
    subcategory: 'Nutrição de solo',
    supplier: 'Casa do Agro',
    eventValueCents: 92000,
    monthlyEquivalentCents: 62000,
    nextOccurrence: isoDate(12),
    notes: 'Compra a cada 45 dias',
    status: 'ativo',
    linkedCropId: 'crop-rucula',
    isStockable: true,
    paymentStatus: 'pago',
    receivedQuantity: 4,
    receivedUnit: 'saco',
    inventoryProductId: 'product-adubo-npk'
  },
  {
    id: 'purchase-biofertilizante',
    name: 'Biofertilizante foliar',
    category: 'Insumo',
    subcategory: 'Nutrição foliar',
    supplier: 'Agro Biovida',
    eventValueCents: 68000,
    monthlyEquivalentCents: 22000,
    nextOccurrence: isoDate(14),
    notes: 'Entrada para aplicação foliar do ciclo atual.',
    status: 'ativo',
    linkedCropId: 'crop-alface',
    isStockable: true,
    paymentStatus: 'pago',
    receivedQuantity: 20,
    receivedUnit: 'L',
    inventoryProductId: 'product-biofertilizante'
  },
  {
    id: 'purchase-embalagem',
    name: 'Embalagem box',
    category: 'Operação comercial',
    subcategory: 'Box',
    supplier: 'Pack Verde',
    eventValueCents: 45000,
    monthlyEquivalentCents: 45000,
    nextOccurrence: isoDate(9),
    notes: 'Consumo mensal de box',
    status: 'ativo',
    linkedChannelId: 'channel-box',
    isStockable: true,
    paymentStatus: 'parcial',
    receivedQuantity: 100,
    receivedUnit: 'caixa',
    inventoryProductId: 'product-embalagem-box'
  }
];

export const seedInventoryProducts: InventoryProduct[] = [
  {
    id: 'product-adubo-npk',
    name: 'Adubo NPK',
    commercialName: 'NPK 20-05-20',
    category: 'adubo',
    defaultUnit: 'saco',
    notes: 'Usado em cobertura e manutenção de canteiro.',
    active: true
  },
  {
    id: 'product-biofertilizante',
    name: 'Biofertilizante foliar',
    commercialName: 'Bio Leaf',
    category: 'adubo',
    defaultUnit: 'L',
    notes: 'Aplicação foliar para reforço do pegamento.',
    active: true
  },
  {
    id: 'product-embalagem-box',
    name: 'Embalagem box',
    commercialName: 'Caixa de entrega',
    category: 'embalagem',
    defaultUnit: 'caixa',
    notes: 'Caixa usada no box semanal.',
    active: true
  }
];

export const seedInventoryLots: InventoryLot[] = [
  {
    id: 'stock-lot-adubo-1',
    productId: 'product-adubo-npk',
    purchaseId: 'purchase-adubo',
    code: 'EST-ADUBO-001',
    receivedAt: isoDate(-18),
    quantityReceived: 4,
    quantityAvailable: 3,
    unit: 'saco',
    unitCostCents: 23000,
    expirationDate: isoDate(120),
    locationName: 'Galpão principal',
    status: 'parcial',
    notes: 'Primeira entrada do adubo do ciclo.'
  },
  {
    id: 'stock-lot-bio-1',
    productId: 'product-biofertilizante',
    purchaseId: 'purchase-biofertilizante',
    code: 'EST-BIO-001',
    receivedAt: isoDate(-10),
    quantityReceived: 20,
    quantityAvailable: 8,
    unit: 'L',
    unitCostCents: 3400,
    expirationDate: isoDate(75),
    locationName: 'Casa de insumos',
    status: 'parcial',
    notes: 'Lote usado em aplicação pós-pegamento.'
  },
  {
    id: 'stock-lot-box-1',
    productId: 'product-embalagem-box',
    purchaseId: 'purchase-embalagem',
    code: 'EST-BOX-001',
    receivedAt: isoDate(-8),
    quantityReceived: 100,
    quantityAvailable: 64,
    unit: 'caixa',
    unitCostCents: 450,
    expirationDate: '',
    locationName: 'Depósito comercial',
    status: 'parcial',
    notes: 'Embalagem do box semanal.'
  }
];

export const seedStockMovements: StockMovement[] = [
  {
    id: 'stock-move-adubo-use',
    inventoryLotId: 'stock-lot-adubo-1',
    movementType: 'uso',
    quantity: 1,
    unit: 'saco',
    occurredAt: isoDate(-6),
    targetType: 'cultura',
    targetId: 'crop-rucula',
    reason: 'Cobertura de manutenção',
    notes: 'Separado para o bloco da rúcula.'
  },
  {
    id: 'stock-move-bio-application',
    inventoryLotId: 'stock-lot-bio-1',
    movementType: 'aplicacao',
    quantity: 12,
    unit: 'L',
    occurredAt: isoDate(-2),
    targetType: 'lote',
    targetId: 'lot-001',
    reason: 'Aplicação pós-pegamento',
    notes: 'Aplicação no lote inicial de alface.'
  },
  {
    id: 'stock-move-box-use',
    inventoryLotId: 'stock-lot-box-1',
    movementType: 'uso',
    quantity: 36,
    unit: 'caixa',
    occurredAt: isoDate(-1),
    targetType: 'geral',
    targetId: null,
    reason: 'Montagem do box semanal',
    notes: 'Separadas para entregas da semana.'
  }
];

export const seedMaintenance: MaintenanceEvent[] = [
  {
    id: 'maint-hydraulic-hose',
    assetName: 'Mangueira hidráulica',
    category: 'Irrigação',
    maintenanceType: 'corretiva',
    cadenceType: 'sob_demanda',
    interval: 'Sob demanda',
    costPerEventCents: 65000,
    downtimeDays: 1.2,
    nextDate: isoDate(22),
    annualEquivalentCents: 180000,
    monthlyReserveCents: 15000,
    impact: 'Risco de parada de irrigação',
    recommendation: 'avaliar',
    notes: 'Falhas recentes no setor B',
    status: 'ativo'
  },
  {
    id: 'maint-pump',
    assetName: 'Bomba de irrigação',
    category: 'Irrigação',
    maintenanceType: 'preventiva',
    cadenceType: 'recorrente',
    interval: 'A cada 6 meses',
    costPerEventCents: 120000,
    downtimeDays: 0.8,
    nextDate: isoDate(35),
    annualEquivalentCents: 240000,
    monthlyReserveCents: 20000,
    impact: 'Queda de pressão no sistema',
    recommendation: 'manter',
    notes: 'Revisão preventiva obrigatória',
    status: 'ativo'
  }
];

export const seedInvestments: InvestmentContract[] = [
  {
    id: 'inv-gradao',
    assetName: 'Gradão agrícola',
    assetCategory: 'Implemento',
    modality: 'financiamento',
    assetValueCents: 4500000,
    downPaymentCents: 600000,
    installments: 36,
    monthlyInstallmentCents: 132000,
    totalCommittedCents: 5352000,
    expectedMonthlyReturnCents: 260000,
    paybackMonths: 20.6,
    notes: 'Equipamento para expansão de preparo de solo',
    status: 'ativo'
  }
];

export const seedImplantationProjects: ImplantationProject[] = [
  {
    id: 'project-horta-base',
    name: 'Horta base',
    description: 'Implantação principal da horta com solo, cobertura, hidráulica e maquinário.',
    budgetTargetCents: 4200000,
    status: 'em_execucao',
    startDate: isoDate(-15),
    targetEndDate: isoDate(40),
    notes: 'Projeto estruturante da operação inicial.',
    createdAt: isoDate(-20)
  }
];

export const seedImplantation: ImplantationItem[] = [
  {
    id: 'imp-esterco',
    projectId: 'project-horta-base',
    group: 'solo',
    name: 'Esterco de ave',
    description: 'Recuperação de base orgânica',
    priority: 'alta',
    quotations: [
      {
        id: 'q-esterco-1',
        supplier: 'Fornecedor São José',
        totalCostCents: 850000,
        freightCents: 90000,
        notes: 'Entrega em 7 dias',
        source: 'WhatsApp',
        status: 'selecionada',
        createdAt: isoDate(-3),
        updatedAt: isoDate(-2),
        paymentMode: 'parcelado',
        downPaymentCents: 240000,
        installments: 4,
        installmentValueCents: 175000,
        firstDueDate: isoDate(12),
        paymentNotes: 'Entrada no fechamento + 4 parcelas mensais.'
      },
      {
        id: 'q-esterco-2',
        supplier: 'Agro Forte',
        totalCostCents: 910000,
        freightCents: 50000,
        notes: 'Prazo 12 dias',
        source: 'Telefone',
        status: 'recebida',
        createdAt: isoDate(-2),
        updatedAt: isoDate(-2),
        paymentMode: 'parcelado',
        downPaymentCents: 180000,
        installments: 5,
        installmentValueCents: 156000,
        firstDueDate: isoDate(18),
        paymentNotes: 'Parcelamento sujeito a aprovação.'
      }
    ],
    selectedQuotationId: 'q-esterco-1',
    paymentMode: 'parcelado',
    status: 'fechado',
    deadline: isoDate(12),
    notes: 'Prioridade de fechamento imediato'
  },
  {
    id: 'imp-hidraulica',
    projectId: 'project-horta-base',
    group: 'hidraulica',
    name: 'Parte hidráulica',
    description: 'Tubulação principal e conexões',
    priority: 'alta',
    quotations: [
      {
        id: 'q-hid-1',
        supplier: 'Hidro Campo',
        totalCostCents: 2100000,
        freightCents: 130000,
        notes: 'Incluso instalação',
        source: 'Email',
        status: 'pendente',
        createdAt: isoDate(-1),
        updatedAt: isoDate(-1),
        paymentMode: 'financiado',
        downPaymentCents: 350000,
        installments: 8,
        installmentValueCents: 235000,
        firstDueDate: isoDate(25),
        paymentNotes: 'Primeira parcela 30 dias após assinatura.'
      }
    ],
    selectedQuotationId: null,
    paymentMode: 'financiado',
    status: 'em_cotacao',
    deadline: isoDate(20),
    notes: 'Item crítico para iniciar operação'
  },
  {
    id: 'imp-sombrite',
    projectId: 'project-horta-base',
    group: 'cobertura',
    name: 'Sombrite',
    description: 'Cobertura ambiente protegido',
    priority: 'media',
    quotations: [
      {
        id: 'q-sombrite-1',
        supplier: 'Sombra Sul',
        totalCostCents: 780000,
        freightCents: 40000,
        notes: 'Malha 50%',
        source: 'Planilha',
        status: 'selecionada',
        createdAt: isoDate(-4),
        updatedAt: isoDate(-3),
        paymentMode: 'avista',
        downPaymentCents: 820000,
        installments: 0,
        installmentValueCents: 0,
        firstDueDate: isoDate(8),
        paymentNotes: 'Pagamento à vista com frete incluso.'
      }
    ],
    selectedQuotationId: 'q-sombrite-1',
    paymentMode: 'avista',
    status: 'pago_parcial',
    deadline: isoDate(8),
    notes: 'Pagamento parcial já efetuado'
  }
];

export const seedLots: Lot[] = [
  {
    id: 'lot-001',
    code: 'DNMS-20260301-001',
    cropId: 'crop-alface',
    cropPlanId: 'plan-alface',
    variety: 'Crespa Vanda',
    receivedAt: isoDate(-6),
    quantityReceived: 1800,
    quantityPlanted: 1650,
    origin: 'Viveiro regional',
    location: 'Setor A / Canteiro A1',
    areaNodeIds: ['area-canteiro-a1'],
    stage: 'vegetativo',
    applicationLogs: [
      {
        id: 'app-001',
        lotId: 'lot-001',
        productName: 'Biofertilizante foliar',
        quantity: 12,
        unit: 'L',
        appliedAt: isoDate(-2),
        responsible: 'Equipe Agro',
        notes: 'Aplicação pós-pegamento'
      }
    ],
    harvests: [
      {
        id: 'har-001',
        lotId: 'lot-001',
        harvestedAt: isoDate(32),
        grossQuantity: 210,
        marketableQuantity: 198,
        lossQuantity: 12,
        unit: 'kg',
        destinationChannel: 'channel-box',
        destinationBreakdown: [
          {
            channelId: 'channel-box',
            quantity: 198,
            unit: 'kg',
            valueCents: 304500
          }
        ],
        quantity: 210,
        soldValueCents: 304500
      }
    ],
    appropriatedCostCents: 0,
    marketableQuantity: 198,
    discardedQuantity: 12,
    traceabilityStatus: 'parcial',
    notes: 'Lote inicial da temporada'
  },
  {
    id: 'lot-002',
    code: 'DNMS-20260305-002',
    cropId: 'crop-rucula',
    cropPlanId: 'plan-rucula',
    variety: 'Cultivada',
    receivedAt: isoDate(-4),
    quantityReceived: 864,
    quantityPlanted: 820,
    origin: 'Viveiro local',
    location: 'Setor B / Canteiro B1',
    areaNodeIds: ['area-canteiro-b1'],
    stage: 'vegetativo',
    applicationLogs: [],
    applicationEvents: [],
    harvests: [],
    appropriatedCostCents: 0,
    marketableQuantity: 0,
    discardedQuantity: 0,
    traceabilityStatus: 'incompleta',
    notes: 'Lote em formação para o box.'
  }
];

export const seedApplications: ApplicationEvent[] = [
  {
    id: 'application-001',
    inventoryLotId: 'stock-lot-bio-1',
    productId: 'product-biofertilizante',
    cropId: 'crop-alface',
    cropPlanId: 'plan-alface',
    productionLotId: 'lot-001',
    areaNodeIds: ['area-canteiro-a1'],
    cropStage: 'vegetativo',
    quantityApplied: 12,
    unit: 'L',
    appliedAreaSqm: 62.5,
    doseDescription: 'Pulverização foliar leve',
    appliedAt: isoDate(-2),
    responsible: 'Equipe Agro',
    equipmentName: 'Pulverizador costal',
    weatherNotes: 'Fim da tarde, sem vento forte.',
    notes: 'Aplicação para reforço do lote inicial.'
  }
];

export const seedLosses: LossEvent[] = [
  {
    id: 'loss-001',
    date: isoDate(-1),
    cause: 'pos_colheita',
    sourceType: 'colheita',
    sourceId: 'har-001',
    quantity: 12,
    unit: 'kg',
    estimatedCostCents: 4200,
    notes: 'Folhas fora do padrão após seleção.'
  }
];

export const seedLaborRecords: LaborRecord[] = [
  {
    id: 'labor-001',
    date: isoDate(-2),
    teamName: 'Equipe Agro',
    taskName: 'Aplicação foliar',
    cropId: 'crop-alface',
    cropPlanId: 'plan-alface',
    productionLotId: 'lot-001',
    areaNodeIds: ['area-canteiro-a1'],
    hoursWorked: 2,
    hourlyCostCents: 2200,
    totalCostCents: 4400,
    notes: 'Equipe de duas pessoas em revezamento.'
  }
];

export const seedEquipmentUsageRecords: EquipmentUsageRecord[] = [
  {
    id: 'equipment-001',
    assetName: 'Pulverizador costal',
    operationName: 'Aplicação foliar',
    date: isoDate(-2),
    cropId: 'crop-alface',
    cropPlanId: 'plan-alface',
    areaNodeIds: ['area-canteiro-a1'],
    hoursUsed: 1.5,
    areaCoveredSqm: 62.5,
    fuelCostCents: 0,
    usageCostCents: 1800,
    notes: 'Uso leve no lote inicial.'
  }
];

export const seedGuidelines: AgronomicGuideline[] = [
  {
    id: 'guide-alface-open',
    cropName: 'Alface',
    environment: 'campo_aberto',
    recommendedMonths: [2, 3, 4, 5, 8, 9, 10],
    avoidMonths: [12, 1],
    notes: 'Evitar calor extremo sem sombreamento'
  },
  {
    id: 'guide-rucula-protected',
    cropName: 'Rúcula',
    environment: 'protegido',
    recommendedMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    avoidMonths: [],
    notes: 'Boa estabilidade em ambiente protegido'
  }
];

export const seedPhotoperiod: PhotoperiodEntry[] = [
  { month: 1, daylightHours: 13.2 },
  { month: 2, daylightHours: 12.7 },
  { month: 3, daylightHours: 12.2 },
  { month: 4, daylightHours: 11.7 },
  { month: 5, daylightHours: 11.3 },
  { month: 6, daylightHours: 11.1 },
  { month: 7, daylightHours: 11.2 },
  { month: 8, daylightHours: 11.5 },
  { month: 9, daylightHours: 12.0 },
  { month: 10, daylightHours: 12.5 },
  { month: 11, daylightHours: 13.0 },
  { month: 12, daylightHours: 13.3 }
];

export const seedScenarios: CashScenario[] = [
  {
    id: 'scenario-base',
    name: 'Base Operacional',
    kind: 'baseline',
    monthRef: now.toISOString().slice(0, 7),
    kitchenDemandFactor: 1,
    boxDemandFactor: 1,
    eventDemandFactor: 1,
    externalDemandFactor: 1,
    notes: 'Operação padrão sem distorções extraordinárias'
  },
  {
    id: 'scenario-evento',
    name: 'Evento Extraordinário',
    kind: 'extraordinario',
    monthRef: now.toISOString().slice(0, 7),
    kitchenDemandFactor: 1,
    boxDemandFactor: 1.25,
    eventDemandFactor: 2,
    externalDemandFactor: 1.1,
    notes: 'Stress test com evento relevante'
  },
  {
    id: 'scenario-kitchen-off',
    name: 'Cozinha sem compra',
    kind: 'stress_test',
    monthRef: now.toISOString().slice(0, 7),
    kitchenDemandFactor: 0,
    boxDemandFactor: 1.2,
    eventDemandFactor: 1,
    externalDemandFactor: 1.15,
    notes: 'Simulação para dependência da cozinha'
  },
  {
    id: 'scenario-box-up',
    name: 'Box com alta demanda',
    kind: 'extraordinario',
    monthRef: now.toISOString().slice(0, 7),
    kitchenDemandFactor: 1,
    boxDemandFactor: 1.5,
    eventDemandFactor: 1,
    externalDemandFactor: 1,
    notes: 'Aumento pontual do canal box'
  }
];
