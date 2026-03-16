import { DEFAULT_APP_STATE } from '@/entities/finance/defaultData';
import { calculateMonthlyEquivalent, normalizeIntervalUnit, normalizeRecurrenceType, recurrenceFromLegacy } from '@/entities/finance/recurrence';
import type {
  AppState,
  AreaUnit,
  Category,
  ConfidenceLevel,
  CropSeason,
  CultivationCostLine,
  CultivationCostSheet,
  CultivationProject,
  DataCompletenessStatus,
  FinancialItem,
  IntervalUnit,
  Investment,
  InvestmentKind,
  ItemType,
  MaintenanceCriticality,
  MaintenanceItem,
  MaintenanceType,
  MetricType,
  PendingCostStatus,
  PurchaseItem,
  RecurrenceType,
  RecordStatus,
  RiskLevel,
  SalesUnit
} from '@/entities/finance/types';

const STORAGE_KEY = 'dunamis-cost-management-v1';
const SCHEMA_VERSION = 3;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const safeMoney = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
};

const safeNumber = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return value;
};

const safeText = (value: unknown, fallback = ''): string => (typeof value === 'string' ? value : fallback);

const safeDate = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value;
};

const clampPct = (value: unknown, min = -100, max = 300): number => {
  const numberValue = safeNumber(value);
  return Math.max(min, Math.min(max, numberValue));
};

const parseMetricType = (value: unknown): MetricType => {
  switch (value) {
    case 'cost':
    case 'investment':
    case 'revenue':
      return value;
    default:
      return 'cost';
  }
};

const parseRecurrenceType = (value: unknown): RecurrenceType => {
  return normalizeRecurrenceType(value);
};

const parseIntervalUnit = (value: unknown): IntervalUnit => {
  return normalizeIntervalUnit(value);
};

const parseRecordStatus = (value: unknown): RecordStatus => {
  switch (value) {
    case 'ativo':
    case 'pausado':
    case 'encerrado':
    case 'pendente':
      return value;
    default:
      return 'ativo';
  }
};

const parseDataCompleteness = (value: unknown): DataCompletenessStatus => {
  switch (value) {
    case 'incompleto':
    case 'parcial':
    case 'completo':
      return value;
    default:
      return 'parcial';
  }
};

const parsePendingCostStatus = (value: unknown): PendingCostStatus => {
  switch (value) {
    case 'custo_pendente':
    case 'definir_custo':
    case 'sem_custo_informado':
    case 'custo_definido':
      return value;
    default:
      return 'custo_pendente';
  }
};

const parseItemType = (value: unknown, metricType: MetricType): ItemType => {
  switch (value) {
    case 'custo_unico':
    case 'custo_recorrente':
    case 'custo_por_safra':
    case 'custo_eventual':
    case 'custo_anual_provisionado':
    case 'custo_parcelado':
    case 'receita_prevista':
    case 'receita_extra':
      return value;
    default:
      if (metricType === 'revenue') return 'receita_extra';
      return 'custo_recorrente';
  }
};

const parseRiskLevel = (value: unknown): RiskLevel => {
  switch (value) {
    case 'low':
    case 'medium':
    case 'high':
      return value;
    default:
      return 'medium';
  }
};

const parseInvestmentKind = (value: unknown): InvestmentKind => {
  switch (value) {
    case 'financiamento':
    case 'consorcio':
    case 'compra_avista':
      return value;
    default:
      return 'financiamento';
  }
};

const parseMaintenanceType = (value: unknown): MaintenanceType => {
  switch (value) {
    case 'preventiva':
    case 'corretiva':
      return value;
    default:
      return 'preventiva';
  }
};

const parseMaintenanceCriticality = (value: unknown): MaintenanceCriticality => {
  switch (value) {
    case 'baixa':
    case 'media':
    case 'alta':
      return value;
    default:
      return 'media';
  }
};

const parseConfidence = (value: unknown): ConfidenceLevel => {
  switch (value) {
    case 'low':
    case 'medium':
    case 'high':
      return value;
    default:
      return 'medium';
  }
};

const parseAreaUnit = (value: unknown): AreaUnit => {
  switch (value) {
    case 'hectare':
    case 'alqueire':
    case 'acre':
    case 'metro_quadrado':
    case 'outro':
      return value;
    default:
      return 'hectare';
  }
};

const parseSeason = (value: unknown): CropSeason => {
  switch (value) {
    case 'safra_principal':
    case 'safrinha':
    case 'outro':
      return value;
    default:
      return 'safra_principal';
  }
};

const parseSalesUnit = (value: unknown): SalesUnit => {
  switch (value) {
    case 'saca_60kg':
    case 'kg':
    case 'tonelada':
    case 'caixa_20kg':
    case 'litro':
    case 'lote':
      return value;
    default:
      return 'saca_60kg';
  }
};

const parseProductivityUnit = (value: unknown): CultivationProject['productivityUnit'] => {
  switch (value) {
    case 'sacas_por_hectare':
    case 'sacas_por_alqueire':
    case 'toneladas_por_hectare':
    case 'kg_por_hectare':
    case 'caixas_por_hectare':
    case 'unidades_por_hectare':
      return value;
    default:
      return 'sacas_por_hectare';
  }
};

const migrateCategories = (value: unknown): Category[] => {
  if (!Array.isArray(value)) return DEFAULT_APP_STATE.categories;
  const migrated = value
    .filter((entry): entry is Record<string, unknown> => isObject(entry))
    .map((category, index) => ({
      id: safeText(category.id, `categoria-${index}`),
      name: safeText(category.name, 'Categoria'),
      categorySliderPct: clampPct(category.categorySliderPct),
      colorToken: safeText(category.colorToken, 'fern')
    }));

  return migrated.length > 0 ? migrated : DEFAULT_APP_STATE.categories;
};

const migrateItems = (value: unknown, validCategoryIds: Set<string>): FinancialItem[] => {
  if (!Array.isArray(value)) return DEFAULT_APP_STATE.items;

  const firstCategory = [...validCategoryIds][0] ?? DEFAULT_APP_STATE.categories[0].id;

  return value
    .filter((entry): entry is Record<string, unknown> => isObject(entry))
    .map((item, index) => {
      const categoryId = safeText(item.categoryId, firstCategory);
      const type = parseMetricType(item.type);
      const eventValueCents = safeMoney(item.eventValueCents) || safeMoney(item.baseValueCents);

      const legacyRecurrence = recurrenceFromLegacy(item.recurrence);
      const recurrenceType = parseRecurrenceType(item.recurrenceType || legacyRecurrence.recurrenceType);
      const intervalUnit = parseIntervalUnit(item.intervalUnit || legacyRecurrence.intervalUnit);
      const intervalValue = Math.max(1, Math.round(safeNumber(item.intervalValue) || legacyRecurrence.intervalValue));

      return {
        id: safeText(item.id, `item-${index}`),
        categoryId: validCategoryIds.has(categoryId) ? categoryId : firstCategory,
        name: safeText(item.name, 'Item financeiro'),
        description: safeText(item.description),
        type,
        itemType: parseItemType(item.itemType, type),
        eventValueCents,
        monthlyEquivalentCents:
          safeMoney(item.monthlyEquivalentCents) ||
          calculateMonthlyEquivalent(eventValueCents, {
            recurrenceType,
            intervalUnit,
            intervalValue
          }),
        recurrenceType,
        intervalUnit,
        intervalValue,
        nextOccurrenceDate: safeDate(item.nextOccurrenceDate),
        lastOccurrenceDate: safeDate(item.lastOccurrenceDate),
        paymentMethod: safeText(item.paymentMethod),
        installmentsTotal: Math.max(1, Math.round(safeNumber(item.installmentsTotal) || 1)),
        installmentsPaid: Math.max(0, Math.round(safeNumber(item.installmentsPaid) || 0)),
        linkedCropId: safeText(item.linkedCropId),
        linkedMachineId: safeText(item.linkedMachineId),
        linkedCostCenter: safeText(item.linkedCostCenter),
        status: parseRecordStatus(item.status),
        dataCompletenessStatus: parseDataCompleteness(item.dataCompletenessStatus),
        notes: safeText(item.notes),
        baseValueCents: eventValueCents,
        recurrence:
          intervalUnit === 'anos'
            ? 'yearly'
            : intervalUnit === 'meses' && intervalValue === 3
              ? 'quarterly'
              : 'monthly',
        itemSliderPct: clampPct(item.itemSliderPct)
      };
    });
};

const migrateInvestments = (value: unknown): Investment[] => {
  if (!Array.isArray(value)) return DEFAULT_APP_STATE.investments;

  const migrated = value
    .filter((entry): entry is Record<string, unknown> => isObject(entry))
    .map((investment, index) => {
      const legacyAmount = safeMoney(investment.amountCents);
      const legacyTerm = Math.max(1, Math.round(safeNumber(investment.horizonMonths) || 1));
      const kind = parseInvestmentKind(investment.kind);
      const assetValueCents = safeMoney(investment.assetValueCents) || legacyAmount;
      const termMonths = Math.max(1, Math.round(safeNumber(investment.termMonths) || legacyTerm || 12));
      const upfrontDefault = kind === 'compra_avista' ? assetValueCents : 0;

      return {
        id: safeText(investment.id, `investimento-${index}`),
        name: safeText(investment.name, 'Investimento'),
        kind,
        assetType: safeText(investment.assetType, 'Ativo'),
        assetValueCents,
        upfrontCents: safeMoney(investment.upfrontCents) || upfrontDefault,
        monthlyInterestPct: Math.max(0, clampPct(investment.monthlyInterestPct, 0, 100)),
        consortiumFeePct: Math.max(0, clampPct(investment.consortiumFeePct, 0, 100)),
        termMonths,
        expectedMonthlyReturnCents: safeMoney(investment.expectedMonthlyReturnCents),
        riskLevel: parseRiskLevel(investment.riskLevel),
        notes: safeText(investment.notes)
      };
    });

  return migrated.length > 0 ? migrated : DEFAULT_APP_STATE.investments;
};

const migratePurchases = (value: unknown): PurchaseItem[] => {
  if (!Array.isArray(value)) return DEFAULT_APP_STATE.purchases;

  return value
    .filter((entry): entry is Record<string, unknown> => isObject(entry))
    .map((purchase, index) => {
      const quantity = Math.max(0, safeNumber(purchase.quantity) || 1);
      const unitPriceCents = safeMoney(purchase.unitPriceCents);
      const eventValueCents = safeMoney(purchase.eventValueCents) || Math.round(quantity * unitPriceCents);

      const legacyRecurrence = recurrenceFromLegacy(purchase.frequency);
      const recurrenceType = parseRecurrenceType(purchase.recurrenceType || legacyRecurrence.recurrenceType);
      const intervalUnit = parseIntervalUnit(purchase.intervalUnit || legacyRecurrence.intervalUnit);
      const intervalValue = Math.max(1, Math.round(safeNumber(purchase.intervalValue) || legacyRecurrence.intervalValue));

      return {
        id: safeText(purchase.id, `compra-${index}`),
        name: safeText(purchase.name, 'Compra'),
        category: safeText(purchase.category, 'Insumo'),
        supplier: safeText(purchase.supplier),
        quantity,
        unitPriceCents,
        eventValueCents,
        monthlyEquivalentCents:
          safeMoney(purchase.monthlyEquivalentCents) ||
          calculateMonthlyEquivalent(eventValueCents, {
            recurrenceType,
            intervalUnit,
            intervalValue
          }),
        recurrenceType,
        intervalUnit,
        intervalValue,
        reserveMonthlyEnabled: typeof purchase.reserveMonthlyEnabled === 'boolean' ? purchase.reserveMonthlyEnabled : true,
        nextOccurrenceDate: safeDate(purchase.nextOccurrenceDate),
        lastOccurrenceDate: safeDate(purchase.lastOccurrenceDate),
        dueDate: safeDate(purchase.dueDate),
        paymentMethod: safeText(purchase.paymentMethod),
        linkedCropId: safeText(purchase.linkedCropId),
        linkedMachineId: safeText(purchase.linkedMachineId),
        linkedCostCenter: safeText(purchase.linkedCostCenter),
        status: parseRecordStatus(purchase.status),
        notes: safeText(purchase.notes)
      };
    });
};

const migrateMaintenance = (value: unknown): MaintenanceItem[] => {
  if (!Array.isArray(value)) return DEFAULT_APP_STATE.maintenance;

  return value
    .filter((entry): entry is Record<string, unknown> => isObject(entry))
    .map((maintenance, index) => {
      const eventValueCents = safeMoney(maintenance.eventValueCents) || safeMoney(maintenance.costPerServiceCents);

      const legacyIntervalMonths = Math.max(1, Math.round(safeNumber(maintenance.frequencyMonths) || 1));
      const recurrenceType = parseRecurrenceType(maintenance.recurrenceType || 'recorrente');
      const intervalUnit = parseIntervalUnit(maintenance.intervalUnit || 'meses');
      const intervalValue = Math.max(
        1,
        Math.round(safeNumber(maintenance.intervalValue) || (intervalUnit === 'meses' ? legacyIntervalMonths : 1))
      );

      return {
        id: safeText(maintenance.id, `manutencao-${index}`),
        equipment: safeText(maintenance.equipment, 'Equipamento'),
        maintenanceType: parseMaintenanceType(maintenance.maintenanceType),
        criticality: parseMaintenanceCriticality(maintenance.criticality),
        eventValueCents,
        monthlyEquivalentCents:
          safeMoney(maintenance.monthlyEquivalentCents) ||
          calculateMonthlyEquivalent(eventValueCents, {
            recurrenceType,
            intervalUnit,
            intervalValue,
            usageIntervalHours: Math.max(0, safeNumber(maintenance.usageIntervalHours)),
            usageHoursPerMonth: Math.max(0, safeNumber(maintenance.usageHoursPerMonth))
          }),
        recurrenceType,
        intervalUnit,
        intervalValue,
        usageIntervalHours: Math.max(0, safeNumber(maintenance.usageIntervalHours)),
        usageHoursPerMonth: Math.max(0, safeNumber(maintenance.usageHoursPerMonth)),
        nextOccurrenceDate: safeDate(maintenance.nextOccurrenceDate),
        lastOccurrenceDate: safeDate(maintenance.lastOccurrenceDate),
        downtimeDays: Math.max(0, safeNumber(maintenance.downtimeDays)),
        linkedCropId: safeText(maintenance.linkedCropId),
        linkedMachineId: safeText(maintenance.linkedMachineId),
        linkedCostCenter: safeText(maintenance.linkedCostCenter),
        status: parseRecordStatus(maintenance.status),
        notes: safeText(maintenance.notes),
        costPerServiceCents: eventValueCents,
        frequencyMonths: intervalUnit === 'meses' ? intervalValue : 1
      };
    });
};

const migrateCultivationProjects = (value: unknown): CultivationProject[] => {
  if (!Array.isArray(value)) return DEFAULT_APP_STATE.cultivationProjects;

  const migrated = value
    .filter((entry): entry is Record<string, unknown> => isObject(entry))
    .map((project, index) => {
      const legacyExpectedYield = Math.max(0, safeNumber(project.expectedYield));
      const legacyPrice = safeMoney(project.pricePerUnitCents);

      const areaValue = Math.max(0, safeNumber(project.areaValue) || (legacyExpectedYield > 0 ? 1 : 0));
      const areaUnit = parseAreaUnit(project.areaUnit);
      const productivityValue = Math.max(0, safeNumber(project.productivityValue) || legacyExpectedYield);

      return {
        id: safeText(project.id, `cultivo-${index}`),
        name: safeText(project.name, 'Cultivo'),
        cropType: safeText(project.cropType, ''),
        variety: safeText(project.variety, ''),
        areaValue,
        areaUnit,
        productivityValue,
        productivityUnit: parseProductivityUnit(project.productivityUnit),
        salesUnit: parseSalesUnit(project.salesUnit),
        pricePerSalesUnitCents: safeMoney(project.pricePerSalesUnitCents) || legacyPrice,
        postHarvestLossPct: Math.max(0, Math.min(100, safeNumber(project.postHarvestLossPct) || safeNumber(project.lossPct))),
        qualityAdjustmentPct: clampPct(project.qualityAdjustmentPct ?? project.qualityPct),
        cycleMonths: Math.max(1, Math.round(safeNumber(project.cycleMonths) || safeNumber(project.termMonths) || 1)),
        season: parseSeason(project.season),
        notes: safeText(project.notes),
        projectionConfidence: parseConfidence(project.projectionConfidence),
        dataCompletenessStatus: parseDataCompleteness(project.dataCompletenessStatus),
        pendingCostStatus: parsePendingCostStatus(project.pendingCostStatus)
      };
    });

  return migrated.length > 0 ? migrated : DEFAULT_APP_STATE.cultivationProjects;
};

const migrateCultivationLine = (
  value: Record<string, unknown>,
  index: number,
  cycleMonths: number,
  fallbackType: ItemType = 'custo_por_safra'
): CultivationCostLine => {
  const eventValueCents = safeMoney(value.eventValueCents) || safeMoney(value.valueCents);
  const recurrenceType = parseRecurrenceType(value.recurrenceType || 'por_safra');
  const intervalUnit = parseIntervalUnit(value.intervalUnit || 'safras');
  const intervalValue = Math.max(1, Math.round(safeNumber(value.intervalValue) || 1));

  return {
    id: safeText(value.id, `linha-${index}`),
    name: safeText(value.name, 'Custo'),
    itemType: parseItemType(value.itemType, 'cost') || fallbackType,
    eventValueCents,
    monthlyEquivalentCents:
      safeMoney(value.monthlyEquivalentCents) ||
      calculateMonthlyEquivalent(eventValueCents, {
        recurrenceType,
        intervalUnit,
        intervalValue,
        monthsPerCycle: Math.max(1, cycleMonths)
      }),
    recurrenceType,
    intervalUnit,
    intervalValue,
    nextOccurrenceDate: safeDate(value.nextOccurrenceDate),
    lastOccurrenceDate: safeDate(value.lastOccurrenceDate),
    paymentMethod: safeText(value.paymentMethod),
    status: parseRecordStatus(value.status),
    notes: safeText(value.notes)
  };
};

const migrateCultivationCostSheets = (
  rawSheets: unknown,
  projects: CultivationProject[],
  rawProjects: unknown
): CultivationCostSheet[] => {
  const projectById = new Map(projects.map((project) => [project.id, project]));

  const sheetsFromState = Array.isArray(rawSheets)
    ? rawSheets
        .filter((entry): entry is Record<string, unknown> => isObject(entry))
        .map((sheet, index) => {
          const cropId = safeText(sheet.cropId);
          const project = projectById.get(cropId);
          const cycleMonths = Math.max(1, project?.cycleMonths || 12);
          const lines = Array.isArray(sheet.lines)
            ? sheet.lines
                .filter((line): line is Record<string, unknown> => isObject(line))
                .map((line, lineIndex) => migrateCultivationLine(line, lineIndex, cycleMonths))
            : [];

          return {
            id: safeText(sheet.id, `sheet-${index}`),
            cropId,
            pendingCostStatus: parsePendingCostStatus(
              sheet.pendingCostStatus || (lines.length > 0 ? 'custo_definido' : 'sem_custo_informado')
            ),
            dataCompletenessStatus: parseDataCompleteness(sheet.dataCompletenessStatus),
            lines,
            updatedAt: safeText(sheet.updatedAt, new Date().toISOString())
          };
        })
        .filter((sheet) => sheet.cropId && projectById.has(sheet.cropId))
    : [];

  const sheetByCrop = new Map(sheetsFromState.map((sheet) => [sheet.cropId, sheet]));

  const rawProjectList = Array.isArray(rawProjects) ? rawProjects : [];
  for (const rawProject of rawProjectList) {
    if (!isObject(rawProject)) continue;
    const cropId = safeText(rawProject.id);
    if (!cropId || sheetByCrop.has(cropId)) continue;

    const project = projectById.get(cropId);
    const cycleMonths = Math.max(1, project?.cycleMonths || 12);

    const legacyCostItems = Array.isArray(rawProject.costItems)
      ? rawProject.costItems.filter((entry): entry is Record<string, unknown> => isObject(entry))
      : [];

    const lines = legacyCostItems.map((line, lineIndex) =>
      migrateCultivationLine(
        {
          ...line,
          recurrenceType: line.recurrenceType || 'por_safra',
          intervalUnit: line.intervalUnit || 'safras',
          intervalValue: line.intervalValue || 1,
          itemType: line.itemType || 'custo_por_safra'
        },
        lineIndex,
        cycleMonths,
        'custo_por_safra'
      )
    );

    sheetByCrop.set(cropId, {
      id: `sheet-${cropId}`,
      cropId,
      pendingCostStatus: lines.length > 0 ? 'custo_definido' : 'custo_pendente',
      dataCompletenessStatus: lines.length > 0 ? 'parcial' : 'incompleto',
      lines,
      updatedAt: new Date().toISOString()
    });
  }

  for (const project of projects) {
    if (!sheetByCrop.has(project.id)) {
      sheetByCrop.set(project.id, {
        id: `sheet-${project.id}`,
        cropId: project.id,
        pendingCostStatus: 'custo_pendente',
        dataCompletenessStatus: 'incompleto',
        lines: [],
        updatedAt: new Date().toISOString()
      });
    }
  }

  return [...sheetByCrop.values()];
};

export const migrateState = (raw: unknown): AppState => {
  if (!isObject(raw)) return DEFAULT_APP_STATE;

  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (version > SCHEMA_VERSION) return DEFAULT_APP_STATE;

  const hasSplitRevenue = typeof raw.productionSalesCents === 'number' || typeof raw.farmBuildersCents === 'number';
  const fallbackRevenue = safeMoney(raw.expectedRevenueCents);
  const productionSalesCents = hasSplitRevenue ? safeMoney(raw.productionSalesCents) : fallbackRevenue;
  const farmBuildersCents = hasSplitRevenue ? safeMoney(raw.farmBuildersCents) : 0;
  const expectedRevenueCents = productionSalesCents + farmBuildersCents;

  const categories = migrateCategories(raw.categories);
  const categoryIds = new Set(categories.map((category) => category.id));
  const items = migrateItems(raw.items, categoryIds);
  const investments = migrateInvestments(raw.investments);
  const purchases = migratePurchases(raw.purchases);
  const maintenance = migrateMaintenance(raw.maintenance);
  const cultivationProjects = migrateCultivationProjects(raw.cultivationProjects);
  const cultivationCostSheets = migrateCultivationCostSheets(
    raw.cultivationCostSheets,
    cultivationProjects,
    raw.cultivationProjects
  );

  return {
    ...DEFAULT_APP_STATE,
    ...raw,
    schemaVersion: SCHEMA_VERSION,
    productionSalesCents,
    farmBuildersCents,
    expectedRevenueCents,
    cashReserveCents:
      typeof raw.cashReserveCents === 'number' ? safeMoney(raw.cashReserveCents) : DEFAULT_APP_STATE.cashReserveCents,
    categories,
    items,
    investments,
    purchases,
    maintenance,
    cultivationProjects,
    cultivationCostSheets,
    scenarios: Array.isArray(raw.scenarios) ? (raw.scenarios as AppState['scenarios']) : DEFAULT_APP_STATE.scenarios
  };
};

export const loadAppState = (): AppState => {
  if (typeof window === 'undefined') return DEFAULT_APP_STATE;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_APP_STATE;

  try {
    return migrateState(JSON.parse(raw));
  } catch {
    return DEFAULT_APP_STATE;
  }
};

export const saveAppState = (state: AppState): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const resetAppState = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const simpleHash = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
};
