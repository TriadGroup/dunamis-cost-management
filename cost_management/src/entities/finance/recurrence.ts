import type { IntervalUnit, RecurrenceConfig, RecurrenceType } from './types';

const AVERAGE_DAYS_PER_MONTH = 30.4375;
const AVERAGE_WEEKS_PER_MONTH = 4.345;

const safeNumber = (value: number): number => (Number.isFinite(value) ? value : 0);

export const clampIntervalValue = (value: number): number => {
  return Math.max(1, Math.round(safeNumber(value) || 1));
};

export const clampPct = (value: number, min = -100, max = 300): number => {
  return Math.max(min, Math.min(max, safeNumber(value)));
};

export const normalizeRecurrenceType = (value: unknown): RecurrenceType => {
  switch (value) {
    case 'unico':
    case 'recorrente':
    case 'customizado':
    case 'por_safra':
    case 'parcelado':
    case 'sob_demanda':
      return value;
    default:
      return 'recorrente';
  }
};

export const normalizeIntervalUnit = (value: unknown): IntervalUnit => {
  switch (value) {
    case 'dias':
    case 'semanas':
    case 'meses':
    case 'anos':
    case 'safras':
    case 'horas_uso':
      return value;
    default:
      return 'meses';
  }
};

export const monthlyFactorFromRecurrence = (config: RecurrenceConfig): number => {
  const recurrenceType = normalizeRecurrenceType(config.recurrenceType);
  const intervalUnit = normalizeIntervalUnit(config.intervalUnit);
  const intervalValue = clampIntervalValue(config.intervalValue);

  if (recurrenceType === 'sob_demanda') return 0;

  if (recurrenceType === 'unico') {
    // A cobrança acontece uma vez; usamos 12 meses como referência de provisão.
    return 1 / 12;
  }

  if (recurrenceType === 'por_safra' || intervalUnit === 'safras') {
    const monthsPerCycle = Math.max(1, safeNumber(config.monthsPerCycle || 12));
    return 1 / (monthsPerCycle * intervalValue);
  }

  if (intervalUnit === 'dias') return AVERAGE_DAYS_PER_MONTH / intervalValue;
  if (intervalUnit === 'semanas') return AVERAGE_WEEKS_PER_MONTH / intervalValue;
  if (intervalUnit === 'meses') return 1 / intervalValue;
  if (intervalUnit === 'anos') return 1 / (12 * intervalValue);

  if (intervalUnit === 'horas_uso') {
    const usageInterval = Math.max(1, safeNumber(config.usageIntervalHours || intervalValue));
    const usageHoursPerMonth = Math.max(0, safeNumber(config.usageHoursPerMonth || 0));
    if (usageHoursPerMonth <= 0) return 0;
    return usageHoursPerMonth / usageInterval;
  }

  return 0;
};

export const calculateMonthlyEquivalent = (eventValueCents: number, config: RecurrenceConfig): number => {
  const eventValue = Math.max(0, Math.round(safeNumber(eventValueCents)));
  return Math.max(0, Math.round(eventValue * monthlyFactorFromRecurrence(config)));
};

const plural = (value: number, singular: string, pluralLabel: string): string => {
  return value === 1 ? singular : pluralLabel;
};

export const describeCadence = (config: Pick<RecurrenceConfig, 'recurrenceType' | 'intervalUnit' | 'intervalValue'>): string => {
  const recurrenceType = normalizeRecurrenceType(config.recurrenceType);
  const intervalUnit = normalizeIntervalUnit(config.intervalUnit);
  const intervalValue = clampIntervalValue(config.intervalValue);

  if (recurrenceType === 'sob_demanda') return 'Sob demanda (sem cadência fixa)';
  if (recurrenceType === 'unico') return 'Cobrança única';
  if (recurrenceType === 'por_safra' || intervalUnit === 'safras') {
    return intervalValue === 1 ? '1 vez por safra' : `A cada ${intervalValue} safras`;
  }

  if (intervalUnit === 'anos') {
    return intervalValue === 1 ? '1 vez por ano' : `A cada ${intervalValue} anos`;
  }
  if (intervalUnit === 'meses') {
    return intervalValue === 1 ? 'Todo mês' : `A cada ${intervalValue} meses`;
  }
  if (intervalUnit === 'semanas') {
    return intervalValue === 1 ? 'Toda semana' : `A cada ${intervalValue} semanas`;
  }
  if (intervalUnit === 'dias') {
    return intervalValue === 1 ? 'Todo dia' : `A cada ${intervalValue} dias`;
  }
  if (intervalUnit === 'horas_uso') {
    return `A cada ${intervalValue} ${plural(intervalValue, 'hora', 'horas')} de uso`;
  }

  return 'Cadência indefinida';
};

export const recurrenceLabel = (recurrenceType: RecurrenceType): string => {
  switch (recurrenceType) {
    case 'unico':
      return 'Único';
    case 'recorrente':
      return 'Recorrente';
    case 'customizado':
      return 'Intervalo customizado';
    case 'por_safra':
      return 'Por safra/ciclo';
    case 'parcelado':
      return 'Parcelado';
    case 'sob_demanda':
      return 'Sob demanda';
    default:
      return 'Recorrente';
  }
};

export const intervalUnitLabel = (unit: IntervalUnit): string => {
  switch (unit) {
    case 'dias':
      return 'dias';
    case 'semanas':
      return 'semanas';
    case 'meses':
      return 'meses';
    case 'anos':
      return 'anos';
    case 'safras':
      return 'safras';
    case 'horas_uso':
      return 'horas de uso';
    default:
      return 'meses';
  }
};

export const recurrenceFromLegacy = (legacy: unknown): Pick<RecurrenceConfig, 'recurrenceType' | 'intervalUnit' | 'intervalValue'> => {
  switch (legacy) {
    case 'yearly':
      return {
        recurrenceType: 'recorrente',
        intervalUnit: 'anos',
        intervalValue: 1
      };
    case 'quarterly':
      return {
        recurrenceType: 'recorrente',
        intervalUnit: 'meses',
        intervalValue: 3
      };
    case 'monthly':
    default:
      return {
        recurrenceType: 'recorrente',
        intervalUnit: 'meses',
        intervalValue: 1
      };
  }
};
