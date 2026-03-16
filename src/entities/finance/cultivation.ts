import { calculateMonthlyEquivalent, clampPct } from './recurrence';
import type {
  AreaUnit,
  ConfidenceLevel,
  CultivationCostSheet,
  CultivationProject,
  DataCompletenessStatus,
  IntervalUnit,
  SalesUnit
} from './types';

export interface CultivationSummary {
  totalCostCents: number;
  saleValueCents: number;
  marginCents: number;
  marginPct: number;
  monthlyMarginCents: number;
  monthlyRevenueEquivalentCents: number;
  monthlyCostEquivalentCents: number;
  projectionConfidence: ConfidenceLevel;
  dataCompletenessStatus: DataCompletenessStatus;
  completenessPct: number;
  formulaLines: string[];
}

export interface CultivationRevenueBreakdown {
  areaHectares: number;
  areaForProductivity: number;
  productionInProductivityUnit: number;
  estimatedSalesUnits: number;
  grossSaleCents: number;
  afterQualityCents: number;
  finalSaleCents: number;
}

const ALQUEIRE_TO_HECTARE = 2.42;

const areaToHectareFactor: Record<AreaUnit, number> = {
  hectare: 1,
  alqueire: ALQUEIRE_TO_HECTARE,
  acre: 0.404686,
  metro_quadrado: 0.0001,
  outro: 1
};

const salesUnitToKg: Record<SalesUnit, number> = {
  saca_60kg: 60,
  kg: 1,
  tonelada: 1000,
  caixa_20kg: 20,
  litro: 1,
  lote: 1
};

const safeNumber = (value: number): number => (Number.isFinite(value) ? value : 0);

const safeMoney = (value: number): number => Math.max(0, Math.round(safeNumber(value)));

const safeCycleMonths = (months: number): number => Math.max(1, Math.round(safeNumber(months) || 1));

const toHectares = (areaValue: number, unit: AreaUnit): number => {
  return Math.max(0, safeNumber(areaValue) * areaToHectareFactor[unit]);
};

const toProductivityArea = (hectares: number, unit: CultivationProject['productivityUnit']): number => {
  if (unit === 'sacas_por_alqueire') return hectares / ALQUEIRE_TO_HECTARE;
  return hectares;
};

const productivityOutputUnit = (project: CultivationProject): SalesUnit => {
  switch (project.productivityUnit) {
    case 'sacas_por_hectare':
    case 'sacas_por_alqueire':
      return 'saca_60kg';
    case 'toneladas_por_hectare':
      return 'tonelada';
    case 'kg_por_hectare':
      return 'kg';
    case 'caixas_por_hectare':
      return 'caixa_20kg';
    case 'unidades_por_hectare':
    default:
      return project.salesUnit;
  }
};

const convertUnits = (quantity: number, fromUnit: SalesUnit, toUnit: SalesUnit): number => {
  const safeQty = Math.max(0, safeNumber(quantity));
  if (fromUnit === toUnit) return safeQty;
  if (fromUnit === 'lote' || toUnit === 'lote') return safeQty;

  const fromKg = salesUnitToKg[fromUnit] || 1;
  const toKg = salesUnitToKg[toUnit] || 1;
  return (safeQty * fromKg) / toKg;
};

export const calculateCultivationCompleteness = (project: CultivationProject): number => {
  const checkpoints = [
    project.name.trim().length > 0,
    project.cropType.trim().length > 0,
    project.areaValue > 0,
    project.productivityValue > 0,
    project.pricePerSalesUnitCents > 0,
    project.cycleMonths > 0,
    project.salesUnit.trim().length > 0
  ];

  const done = checkpoints.filter(Boolean).length;
  return Math.round((done / checkpoints.length) * 100);
};

export const inferCompletenessStatus = (pct: number): DataCompletenessStatus => {
  if (pct >= 85) return 'completo';
  if (pct >= 55) return 'parcial';
  return 'incompleto';
};

export const inferProjectionConfidence = (
  completenessPct: number,
  hasPrice: boolean,
  hasProductivity: boolean,
  hasCosts: boolean
): ConfidenceLevel => {
  if (!hasPrice || !hasProductivity || completenessPct < 55) return 'low';
  if (!hasCosts || completenessPct < 85) return 'medium';
  return 'high';
};

export const calculateCultivationRevenueBreakdown = (project: CultivationProject): CultivationRevenueBreakdown => {
  const areaHectares = toHectares(project.areaValue, project.areaUnit);
  const areaForProductivity = toProductivityArea(areaHectares, project.productivityUnit);
  const productionInProductivityUnit = Math.max(0, safeNumber(project.productivityValue) * areaForProductivity);

  const fromUnit = productivityOutputUnit(project);
  const estimatedSalesUnits = convertUnits(productionInProductivityUnit, fromUnit, project.salesUnit);

  const grossSaleCents = safeMoney(estimatedSalesUnits * safeMoney(project.pricePerSalesUnitCents));
  const qualityMultiplier = 1 + clampPct(project.qualityAdjustmentPct) / 100;
  const afterQualityCents = safeMoney(grossSaleCents * qualityMultiplier);
  const lossMultiplier = 1 - Math.max(0, Math.min(100, safeNumber(project.postHarvestLossPct))) / 100;
  const finalSaleCents = safeMoney(afterQualityCents * lossMultiplier);

  return {
    areaHectares,
    areaForProductivity,
    productionInProductivityUnit,
    estimatedSalesUnits,
    grossSaleCents,
    afterQualityCents,
    finalSaleCents
  };
};

export const calculateCultivationSaleValue = (project: CultivationProject): number => {
  return calculateCultivationRevenueBreakdown(project).finalSaleCents;
};

export const calculateCultivationCostTotals = (
  project: CultivationProject,
  sheet: CultivationCostSheet | null
): { totalCostCents: number; monthlyEquivalentCents: number } => {
  if (!sheet || sheet.lines.length === 0) {
    return { totalCostCents: 0, monthlyEquivalentCents: 0 };
  }

  const totalCostCents = sheet.lines.reduce((acc, line) => acc + safeMoney(line.eventValueCents), 0);
  const monthlyEquivalentCents = sheet.lines.reduce(
    (acc, line) =>
      acc +
      calculateMonthlyEquivalent(line.eventValueCents, {
        recurrenceType: line.recurrenceType,
        intervalUnit: line.intervalUnit,
        intervalValue: line.intervalValue,
        monthsPerCycle: safeCycleMonths(project.cycleMonths)
      }),
    0
  );

  return { totalCostCents, monthlyEquivalentCents };
};

export const calculateCultivationSummary = (
  project: CultivationProject,
  sheet: CultivationCostSheet | null = null
): CultivationSummary => {
  const sale = calculateCultivationRevenueBreakdown(project);
  const cost = calculateCultivationCostTotals(project, sheet);

  const marginCents = sale.finalSaleCents - cost.totalCostCents;
  const marginPct = sale.finalSaleCents > 0 ? (marginCents / sale.finalSaleCents) * 100 : 0;
  const cycleMonths = safeCycleMonths(project.cycleMonths);
  const monthlyMarginCents = Math.round(marginCents / cycleMonths);

  const completenessPct = calculateCultivationCompleteness(project);
  const dataCompletenessStatus = inferCompletenessStatus(completenessPct);
  const projectionConfidence = inferProjectionConfidence(
    completenessPct,
    project.pricePerSalesUnitCents > 0,
    project.productivityValue > 0,
    cost.totalCostCents > 0
  );

  const formulaLines = [
    `Produção estimada: área (${project.areaValue}) x produtividade (${project.productivityValue})`,
    `Venda bruta: produção estimada x preço por unidade (${project.pricePerSalesUnitCents / 100})`,
    `Ajuste de qualidade: +${project.qualityAdjustmentPct.toFixed(1)}%`,
    `Perda pós-colheita: -${project.postHarvestLossPct.toFixed(1)}%`
  ];

  return {
    totalCostCents: cost.totalCostCents,
    saleValueCents: sale.finalSaleCents,
    marginCents,
    marginPct,
    monthlyMarginCents,
    monthlyRevenueEquivalentCents: Math.round(sale.finalSaleCents / cycleMonths),
    monthlyCostEquivalentCents: cost.monthlyEquivalentCents,
    projectionConfidence,
    dataCompletenessStatus,
    completenessPct,
    formulaLines
  };
};

export const calculateCultivationRevenueTotal = (projects: CultivationProject[]): number => {
  return projects.reduce((acc, project) => acc + calculateCultivationSaleValue(project), 0);
};

export const calculateCultivationPortfolio = (
  projects: CultivationProject[],
  sheets: CultivationCostSheet[]
): CultivationSummary => {
  const sheetMap = new Map(sheets.map((sheet) => [sheet.cropId, sheet]));

  const saleValueCents = projects.reduce((acc, project) => acc + calculateCultivationSaleValue(project), 0);
  const totalCostCents = projects.reduce(
    (acc, project) => acc + calculateCultivationCostTotals(project, sheetMap.get(project.id) ?? null).totalCostCents,
    0
  );

  const totalCycleMonths = projects.reduce((acc, project) => acc + safeCycleMonths(project.cycleMonths), 0);
  const monthlyCostEquivalentCents = projects.reduce(
    (acc, project) =>
      acc + calculateCultivationCostTotals(project, sheetMap.get(project.id) ?? null).monthlyEquivalentCents,
    0
  );

  const marginCents = saleValueCents - totalCostCents;
  const marginPct = saleValueCents > 0 ? (marginCents / saleValueCents) * 100 : 0;

  const completeList = projects.map((project) => calculateCultivationCompleteness(project));
  const averageCompleteness =
    completeList.length > 0
      ? Math.round(completeList.reduce((acc, value) => acc + value, 0) / completeList.length)
      : 0;

  const dataCompletenessStatus = inferCompletenessStatus(averageCompleteness);
  const projectionConfidence = inferProjectionConfidence(
    averageCompleteness,
    projects.every((project) => project.pricePerSalesUnitCents > 0),
    projects.every((project) => project.productivityValue > 0),
    totalCostCents > 0
  );

  return {
    totalCostCents,
    saleValueCents,
    marginCents,
    marginPct,
    monthlyMarginCents: totalCycleMonths > 0 ? Math.round(marginCents / totalCycleMonths) : marginCents,
    monthlyRevenueEquivalentCents: totalCycleMonths > 0 ? Math.round(saleValueCents / totalCycleMonths) : saleValueCents,
    monthlyCostEquivalentCents,
    projectionConfidence,
    dataCompletenessStatus,
    completenessPct: averageCompleteness,
    formulaLines: ['Portfólio: soma das receitas e custos de todos os cultivos']
  };
};

export const productionUnitLabel = (unit: CultivationProject['productivityUnit']): string => {
  switch (unit) {
    case 'sacas_por_hectare':
      return 'sacas/ha';
    case 'sacas_por_alqueire':
      return 'sacas/alqueire';
    case 'toneladas_por_hectare':
      return 't/ha';
    case 'kg_por_hectare':
      return 'kg/ha';
    case 'caixas_por_hectare':
      return 'caixas/ha';
    case 'unidades_por_hectare':
    default:
      return 'unidades/ha';
  }
};

export const areaUnitLabel = (unit: AreaUnit): string => {
  switch (unit) {
    case 'hectare':
      return 'ha';
    case 'alqueire':
      return 'alqueire';
    case 'acre':
      return 'acre';
    case 'metro_quadrado':
      return 'm²';
    case 'outro':
    default:
      return 'unidade';
  }
};

export const salesUnitLabel = (unit: SalesUnit): string => {
  switch (unit) {
    case 'saca_60kg':
      return 'Saca 60kg';
    case 'kg':
      return 'Kg';
    case 'tonelada':
      return 'Tonelada';
    case 'caixa_20kg':
      return 'Caixa 20kg';
    case 'litro':
      return 'Litro';
    case 'lote':
    default:
      return 'Lote';
  }
};

export const confidenceLabel = (value: ConfidenceLevel): string => {
  switch (value) {
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Média';
    case 'low':
    default:
      return 'Baixa';
  }
};
