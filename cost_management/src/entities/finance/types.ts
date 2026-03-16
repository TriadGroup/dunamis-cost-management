export type Money = number;

export type MetricType = 'cost' | 'investment' | 'revenue';

// Legacy aliases kept for migration compatibility.
export type Recurrence = 'monthly' | 'quarterly' | 'yearly';
export type PurchaseFrequency = Recurrence;

export type ItemType =
  | 'custo_unico'
  | 'custo_recorrente'
  | 'custo_por_safra'
  | 'custo_eventual'
  | 'custo_anual_provisionado'
  | 'custo_parcelado'
  | 'receita_prevista'
  | 'receita_extra';

export type RecurrenceType = 'unico' | 'recorrente' | 'customizado' | 'por_safra' | 'parcelado' | 'sob_demanda';

export type IntervalUnit = 'dias' | 'semanas' | 'meses' | 'anos' | 'safras' | 'horas_uso';

export type RecordStatus = 'ativo' | 'pausado' | 'encerrado' | 'pendente';

export type DataCompletenessStatus = 'incompleto' | 'parcial' | 'completo';

export type PendingCostStatus = 'custo_pendente' | 'definir_custo' | 'sem_custo_informado' | 'custo_definido';

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export interface LinkedEntityFields {
  linkedCropId?: string;
  linkedMachineId?: string;
  linkedCostCenter?: string;
}

export interface RecurrenceConfig {
  recurrenceType: RecurrenceType;
  intervalUnit: IntervalUnit;
  intervalValue: number;
  monthsPerCycle?: number;
  usageIntervalHours?: number;
  usageHoursPerMonth?: number;
}

export interface FinancialItem extends LinkedEntityFields, RecurrenceConfig {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  type: MetricType;
  itemType: ItemType;
  eventValueCents: Money;
  monthlyEquivalentCents: Money;
  nextOccurrenceDate: string;
  lastOccurrenceDate: string;
  paymentMethod: string;
  installmentsTotal: number;
  installmentsPaid: number;
  status: RecordStatus;
  dataCompletenessStatus: DataCompletenessStatus;
  notes: string;
  // Legacy fields maintained for backwards compatibility with old snapshots.
  baseValueCents?: Money;
  recurrence?: Recurrence;
  itemSliderPct?: number;
}

export interface Category {
  id: string;
  name: string;
  categorySliderPct: number;
  colorToken: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export type InvestmentKind = 'financiamento' | 'consorcio' | 'compra_avista';

export interface Investment {
  id: string;
  name: string;
  kind: InvestmentKind;
  assetType: string;
  assetValueCents: Money;
  upfrontCents: Money;
  monthlyInterestPct: number;
  consortiumFeePct: number;
  termMonths: number;
  expectedMonthlyReturnCents: Money;
  riskLevel: RiskLevel;
  notes: string;
}

export interface PurchaseItem extends LinkedEntityFields, RecurrenceConfig {
  id: string;
  name: string;
  category: string;
  supplier: string;
  quantity: number;
  unitPriceCents: Money;
  eventValueCents: Money;
  monthlyEquivalentCents: Money;
  reserveMonthlyEnabled: boolean;
  nextOccurrenceDate: string;
  lastOccurrenceDate: string;
  dueDate: string;
  paymentMethod: string;
  status: RecordStatus;
  notes: string;
  // Legacy compatibility.
  frequency?: PurchaseFrequency;
}

export type MaintenanceType = 'preventiva' | 'corretiva';

export type MaintenanceCriticality = 'baixa' | 'media' | 'alta';

export interface MaintenanceItem extends LinkedEntityFields, RecurrenceConfig {
  id: string;
  equipment: string;
  maintenanceType: MaintenanceType;
  criticality: MaintenanceCriticality;
  eventValueCents: Money;
  monthlyEquivalentCents: Money;
  usageIntervalHours: number;
  usageHoursPerMonth: number;
  nextOccurrenceDate: string;
  lastOccurrenceDate: string;
  downtimeDays: number;
  status: RecordStatus;
  notes: string;
  // Legacy compatibility.
  costPerServiceCents?: Money;
  frequencyMonths?: number;
}

export interface Scenario {
  id: string;
  name: string;
  monthRef: string;
  overrides: Record<string, number>;
  createdAt: string;
}

export interface KpiSnapshot {
  totalCostCents: Money;
  totalInvestmentCents: Money;
  totalRevenueCents: Money;
  projectedBalanceCents: Money;
  marginPct: number;
  roiPct: number;
  paybackMonths: number | null;
  burnRateCents: Money;
  runwayMonths: number | null;
}

export interface Totals {
  totalCostCents: Money;
  totalInvestmentCents: Money;
  totalRevenueCents: Money;
  projectedBalanceCents: Money;
}

export interface RoiSummary {
  roiPct: number;
  totalInvestmentCents: Money;
  totalReturnCents: Money;
  totalMonthlyReturnCents: Money;
}

export interface ProjectionPoint {
  month: string;
  baseBalanceCents: number;
  adjustedBalanceCents: number;
}

export type AreaUnit = 'hectare' | 'alqueire' | 'acre' | 'metro_quadrado' | 'outro';

export type ProductivityUnit =
  | 'sacas_por_hectare'
  | 'sacas_por_alqueire'
  | 'toneladas_por_hectare'
  | 'kg_por_hectare'
  | 'caixas_por_hectare'
  | 'unidades_por_hectare';

export type SalesUnit = 'saca_60kg' | 'kg' | 'tonelada' | 'caixa_20kg' | 'litro' | 'lote';

export type CropSeason = 'safra_principal' | 'safrinha' | 'outro';

export interface CultivationProject {
  id: string;
  name: string;
  cropType: string;
  variety: string;
  areaValue: number;
  areaUnit: AreaUnit;
  productivityValue: number;
  productivityUnit: ProductivityUnit;
  salesUnit: SalesUnit;
  pricePerSalesUnitCents: Money;
  postHarvestLossPct: number;
  qualityAdjustmentPct: number;
  cycleMonths: number;
  season: CropSeason;
  notes: string;
  projectionConfidence: ConfidenceLevel;
  dataCompletenessStatus: DataCompletenessStatus;
  pendingCostStatus: PendingCostStatus;
}

export interface CultivationCostLine extends RecurrenceConfig {
  id: string;
  name: string;
  itemType: ItemType;
  eventValueCents: Money;
  monthlyEquivalentCents: Money;
  nextOccurrenceDate: string;
  lastOccurrenceDate: string;
  paymentMethod: string;
  status: RecordStatus;
  notes: string;
}

export interface CultivationCostSheet {
  id: string;
  cropId: string;
  pendingCostStatus: PendingCostStatus;
  dataCompletenessStatus: DataCompletenessStatus;
  lines: CultivationCostLine[];
  updatedAt: string;
}

export interface AppState {
  schemaVersion: number;
  pinHash: string | null;
  categories: Category[];
  items: FinancialItem[];
  investments: Investment[];
  purchases: PurchaseItem[];
  maintenance: MaintenanceItem[];
  cultivationProjects: CultivationProject[];
  cultivationCostSheets: CultivationCostSheet[];
  scenarios: Scenario[];
  productionSalesCents: Money;
  farmBuildersCents: Money;
  expectedRevenueCents: Money;
  cashReserveCents: Money;
}
