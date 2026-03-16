import type {
  AppState,
  Category,
  CultivationCostSheet,
  CultivationProject,
  FinancialItem,
  Investment,
  MaintenanceItem,
  PurchaseItem
} from './types';
import { calculateMonthlyEquivalent } from './recurrence';

const nowIso = new Date().toISOString();

const categories: Category[] = [
  { id: 'implementos', name: 'Implementos', categorySliderPct: 0, colorToken: 'fern' },
  { id: 'quimicos', name: 'Químicos', categorySliderPct: 0, colorToken: 'dunamis' },
  { id: 'manutencao', name: 'Manutenção', categorySliderPct: 0, colorToken: 'fern' },
  { id: 'combustivel', name: 'Combustível', categorySliderPct: 0, colorToken: 'dunamis' },
  { id: 'mao_obra', name: 'Mão de Obra', categorySliderPct: 0, colorToken: 'fern' },
  { id: 'logistica', name: 'Logística', categorySliderPct: 0, colorToken: 'dunamis' },
  { id: 'outros', name: 'Outros', categorySliderPct: 0, colorToken: 'fern' }
];

const items: FinancialItem[] = [
  {
    id: 'item-trator',
    categoryId: 'implementos',
    name: 'Aluguel de trator',
    description: 'Trator principal para preparo de solo',
    type: 'cost',
    itemType: 'custo_recorrente',
    eventValueCents: 450000,
    monthlyEquivalentCents: 450000,
    recurrenceType: 'recorrente',
    intervalUnit: 'meses',
    intervalValue: 1,
    nextOccurrenceDate: new Date().toISOString().slice(0, 10),
    lastOccurrenceDate: '',
    paymentMethod: 'Boleto',
    installmentsTotal: 1,
    installmentsPaid: 0,
    linkedCropId: '',
    linkedMachineId: '',
    linkedCostCenter: 'Operação de campo',
    status: 'ativo',
    dataCompletenessStatus: 'completo',
    notes: 'Uso principal de safra'
  },
  {
    id: 'item-herbicida',
    categoryId: 'quimicos',
    name: 'Herbicida (aplicação trimestral)',
    description: 'Aplicação preventiva em áreas produtivas',
    type: 'cost',
    itemType: 'custo_recorrente',
    eventValueCents: 180000,
    monthlyEquivalentCents: 60000,
    recurrenceType: 'customizado',
    intervalUnit: 'meses',
    intervalValue: 3,
    nextOccurrenceDate: '',
    lastOccurrenceDate: '',
    paymentMethod: 'PIX',
    installmentsTotal: 1,
    installmentsPaid: 0,
    linkedCropId: '',
    linkedMachineId: '',
    linkedCostCenter: 'Proteção de cultivo',
    status: 'ativo',
    dataCompletenessStatus: 'parcial',
    notes: ''
  },
  {
    id: 'item-taxa',
    categoryId: 'outros',
    name: 'Taxa ambiental anual',
    description: 'Cobrança única anual',
    type: 'cost',
    itemType: 'custo_anual_provisionado',
    eventValueCents: 57600,
    monthlyEquivalentCents: 4800,
    recurrenceType: 'recorrente',
    intervalUnit: 'anos',
    intervalValue: 1,
    nextOccurrenceDate: '',
    lastOccurrenceDate: '',
    paymentMethod: 'Boleto',
    installmentsTotal: 1,
    installmentsPaid: 0,
    linkedCropId: '',
    linkedMachineId: '',
    linkedCostCenter: 'Administrativo',
    status: 'ativo',
    dataCompletenessStatus: 'completo',
    notes: 'Mostrar como cobrança anual real'
  },
  {
    id: 'item-receita-extra',
    categoryId: 'outros',
    name: 'Receita extra de visita técnica',
    description: 'Entrada complementar',
    type: 'revenue',
    itemType: 'receita_extra',
    eventValueCents: 120000,
    monthlyEquivalentCents: 120000,
    recurrenceType: 'recorrente',
    intervalUnit: 'meses',
    intervalValue: 1,
    nextOccurrenceDate: '',
    lastOccurrenceDate: '',
    paymentMethod: 'Transferência',
    installmentsTotal: 1,
    installmentsPaid: 0,
    linkedCropId: '',
    linkedMachineId: '',
    linkedCostCenter: 'Receitas diversas',
    status: 'ativo',
    dataCompletenessStatus: 'completo',
    notes: ''
  }
];

const investments: Investment[] = [
  {
    id: 'inv-irrigacao',
    name: 'Irrigação inteligente',
    kind: 'financiamento',
    assetType: 'Maquinário',
    assetValueCents: 2500000,
    upfrontCents: 300000,
    monthlyInterestPct: 1.2,
    consortiumFeePct: 0,
    termMonths: 24,
    expectedMonthlyReturnCents: 350000,
    riskLevel: 'medium',
    notes: 'Financiamento para expansão da irrigação'
  }
];

const purchases: PurchaseItem[] = [
  {
    id: 'compra-adubo',
    name: 'Adubo NPK',
    category: 'Insumo',
    supplier: 'Fornecedor local',
    quantity: 20,
    unitPriceCents: 4500,
    eventValueCents: 90000,
    monthlyEquivalentCents: Math.round(
      calculateMonthlyEquivalent(90000, {
        recurrenceType: 'customizado',
        intervalUnit: 'dias',
        intervalValue: 45
      })
    ),
    recurrenceType: 'customizado',
    intervalUnit: 'dias',
    intervalValue: 45,
    reserveMonthlyEnabled: true,
    nextOccurrenceDate: '',
    lastOccurrenceDate: '',
    dueDate: '',
    paymentMethod: 'Prazo fornecedor',
    linkedCropId: '',
    linkedMachineId: '',
    linkedCostCenter: 'Insumos',
    status: 'ativo',
    notes: ''
  }
];

const maintenance: MaintenanceItem[] = [
  {
    id: 'manut-trator',
    equipment: 'Trator principal',
    maintenanceType: 'preventiva',
    criticality: 'alta',
    eventValueCents: 180000,
    monthlyEquivalentCents: 15000,
    recurrenceType: 'recorrente',
    intervalUnit: 'anos',
    intervalValue: 1,
    usageIntervalHours: 0,
    usageHoursPerMonth: 0,
    nextOccurrenceDate: '',
    lastOccurrenceDate: '',
    downtimeDays: 1,
    linkedCropId: '',
    linkedMachineId: 'trator-principal',
    linkedCostCenter: 'Oficina',
    status: 'ativo',
    notes: 'Troca de filtro e revisão'
  }
];

const cultivationProjects: CultivationProject[] = [
  {
    id: 'cultivo-cafe',
    name: 'Plantio de café',
    cropType: 'Café',
    variety: 'Catuaí Vermelho',
    areaValue: 12,
    areaUnit: 'hectare',
    productivityValue: 30,
    productivityUnit: 'sacas_por_hectare',
    salesUnit: 'saca_60kg',
    pricePerSalesUnitCents: 60000,
    postHarvestLossPct: 5,
    qualityAdjustmentPct: 0,
    cycleMonths: 8,
    season: 'safra_principal',
    notes: '',
    projectionConfidence: 'medium',
    dataCompletenessStatus: 'parcial',
    pendingCostStatus: 'custo_pendente'
  }
];

const cultivationCostSheets: CultivationCostSheet[] = [
  {
    id: 'sheet-cafe',
    cropId: 'cultivo-cafe',
    pendingCostStatus: 'custo_pendente',
    dataCompletenessStatus: 'parcial',
    lines: [
      {
        id: 'cafe-semente',
        name: 'Sementes e mudas',
        itemType: 'custo_por_safra',
        eventValueCents: 250000,
        monthlyEquivalentCents: 31250,
        recurrenceType: 'por_safra',
        intervalUnit: 'safras',
        intervalValue: 1,
        nextOccurrenceDate: '',
        lastOccurrenceDate: '',
        paymentMethod: 'Boleto',
        status: 'ativo',
        notes: ''
      },
      {
        id: 'cafe-mao-obra',
        name: 'Mão de obra de plantio',
        itemType: 'custo_por_safra',
        eventValueCents: 180000,
        monthlyEquivalentCents: 22500,
        recurrenceType: 'por_safra',
        intervalUnit: 'safras',
        intervalValue: 1,
        nextOccurrenceDate: '',
        lastOccurrenceDate: '',
        paymentMethod: 'PIX',
        status: 'ativo',
        notes: ''
      }
    ],
    updatedAt: nowIso
  }
];

export const DEFAULT_APP_STATE: AppState = {
  schemaVersion: 3,
  pinHash: null,
  categories,
  items,
  investments,
  purchases,
  maintenance,
  cultivationProjects,
  cultivationCostSheets,
  scenarios: [
    {
      id: 'base',
      name: 'Cenário Base',
      monthRef: new Date().toISOString().slice(0, 7),
      overrides: {},
      createdAt: nowIso
    }
  ],
  productionSalesCents: 0,
  farmBuildersCents: 0,
  expectedRevenueCents: 0,
  cashReserveCents: 530000
};
