export const formatCurrency = (valueCents: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2
  }).format(valueCents / 100);
};

export const formatPct = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

export const formatNullableMonths = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return '--';
  return `${value.toFixed(1)} meses`;
};

export const toCents = (value: number): number => Math.round(value * 100);
export const fromCents = (value: number): number => value / 100;
