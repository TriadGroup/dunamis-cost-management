import type { CashScenario, AgronomicGuideline, PhotoperiodEntry } from '@/entities';
import type {
  AreaUnitOption,
  ChannelOption,
  FinancialStartingPoint,
  InitialCropEntry,
  OperationIdentity,
  ProductionProfileOption,
  SetupStatus,
  StructureEntry
} from '@/app/store/useSetupStore';
import type { FarmSnapshot } from '@/features/dashboard/model/buildFarmSnapshot';

export type ExportPrimitive = string | number | boolean | Date | null | undefined;

export interface ExportFormulaValue {
  formula: string;
  result?: ExportPrimitive;
}

export type ExportCellValue = ExportPrimitive | ExportFormulaValue;

export type ExportRow = Record<string, ExportCellValue>;

export type ExportColumnFormat = 'currency' | 'percent' | 'date' | 'integer' | 'number' | 'text';

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  format?: ExportColumnFormat;
  dropdown?: string[];
}

export interface ExportTable {
  title?: string;
  description?: string;
  columns: ExportColumn[];
  rows: ExportRow[];
  editable?: boolean;
  instructions?: string[];
}

export type ExportMetricTone = 'forest' | 'sage' | 'mist' | 'amber' | 'terracotta' | 'slate';

export interface ExportMetric {
  key: string;
  label: string;
  value: ExportCellValue;
  hint?: string;
  format?: ExportColumnFormat;
  tone?: ExportMetricTone;
}

export interface ExportSheet {
  name: string;
  title: string;
  description: string;
  tables: ExportTable[];
  summaryTitle?: string;
  summaryDescription?: string;
  summaryColumns?: number;
  summaryMetrics?: ExportMetric[];
  hidden?: boolean;
}

export interface FarmExportSetup {
  status: SetupStatus;
  currentStep: number;
  identity: OperationIdentity;
  productionProfiles: ProductionProfileOption[];
  structures: StructureEntry[];
  channels: ChannelOption[];
  initialCrops: InitialCropEntry[];
  customCrops: InitialCropEntry[];
  financialStartingPoints: FinancialStartingPoint[];
  hasChosenFinancialStartingPoint: boolean;
  areaUnit: AreaUnitOption;
}

export interface FarmExportScenarios {
  demandScenarios: CashScenario[];
  activeDemandScenarioId: string;
  cashScenarios: CashScenario[];
  baselineScenarioId: string;
  compareScenarioId: string;
}

export interface FarmExportCalendar {
  guidelines: AgronomicGuideline[];
  photoperiod: PhotoperiodEntry[];
}

export interface FarmExportSnapshot {
  generatedAt: string;
  setup: FarmExportSetup;
  scenarios: FarmExportScenarios;
  calendar: FarmExportCalendar;
  snapshot: FarmSnapshot;
}
