import type { Lot, TraceabilitySummary } from '@/entities/agro/lot/types';

export const generateLotCode = (date: Date, sequence: number): string => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `DNMS-${y}${m}${d}-${String(Math.max(1, sequence)).padStart(3, '0')}`;
};

export const calculateTraceabilityCompleteness = (lot: Lot): TraceabilitySummary => {
  const required: Array<[string, boolean]> = [
    ['Código do lote', lot.code.trim().length > 0],
    ['Cultura', lot.cropId.trim().length > 0],
    ['Origem', lot.origin.trim().length > 0],
    ['Data de chegada', lot.receivedAt.trim().length > 0],
    ['Quantidade recebida', lot.quantityReceived > 0],
    ['Quantidade plantada', lot.quantityPlanted > 0],
    ['Localização', lot.location.trim().length > 0],
    ['Aplicações', lot.applicationLogs.length > 0],
    ['Colheitas', lot.harvests.length > 0]
  ];

  const missingFields = required.filter((entry) => !entry[1]).map((entry) => entry[0]);
  const score = Math.round(((required.length - missingFields.length) / required.length) * 100);

  if (score < 55) {
    return { score, missingFields, status: 'incompleta' };
  }
  if (score < 90) {
    return { score, missingFields, status: 'parcial' };
  }
  return { score, missingFields, status: 'completa' };
};

export const findLotByCode = (lots: Lot[], code: string): Lot | null => {
  const normalized = code.trim().toLowerCase();
  if (!normalized) return null;
  return lots.find((entry) => entry.code.toLowerCase() === normalized) ?? null;
};
