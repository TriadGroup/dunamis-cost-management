export const formatCurrency = (valueCents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2
  }).format(valueCents / 100);
};

export const formatCompactCurrency = (valueCents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(valueCents / 100);
};

export const formatPct = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

export const formatNullableMonths = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '--';
  return `${value.toFixed(1)} meses`;
};

export const toCents = (value: number): number => Math.round(value * 100);
export const fromCents = (value: number): number => value / 100;

export const formatNumber = (value: number, maxFraction = 1): string =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: maxFraction }).format(value);

export const formatDate = (value: string): string => {
  if (!value) return 'Sem data';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('pt-BR');
};

export const formatUnitLabel = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case 'm':
      return 'm';
    case 'm2':
    case 'm²':
      return 'm²';
    case 'cm':
      return 'cm';
    case '%':
      return '%';
    case 'r$':
      return 'R$';
    case 'muda':
      return 'muda';
    case 'unidade':
      return 'unidade';
    case 'cabeca':
    case 'cabeça':
      return 'cabeça';
    case 'pe':
    case 'pé':
      return 'pé';
    case 'caixa':
      return 'caixa';
    case 'bandeja':
      return 'bandeja';
    case 'maco':
    case 'maço':
      return 'maço';
    case 'kg':
      return 'kg';
    case 'l':
      return 'L';
    default:
      return value;
  }
};

export const formatPricePerUnit = (valueCents: number, unit: string): string => `${formatCurrency(valueCents)} / ${formatUnitLabel(unit)}`;

export const fieldUnitMeta = {
  currency: 'R$',
  percent: '%',
  spacing: 'cm',
  bedLength: 'm',
  bedWidth: 'm',
  area: 'm²'
} as const;
