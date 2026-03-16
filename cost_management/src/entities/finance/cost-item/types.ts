import type { AllocationDriver } from '@/entities/agro/cost-allocation/types';

export type CostRecurrenceType = 'unico' | 'recorrente' | 'sazonal' | 'por_ciclo' | 'extraordinario';

export type CostStatus = 'ativo' | 'pausado' | 'encerrado' | 'pendente';

export interface CostItem {
  id: string;
  category: string;
  subcategory: string;
  name: string;
  recurrenceType: CostRecurrenceType;
  eventValueCents: number;
  monthlyEquivalentCents: number;
  nextOccurrence: string;
  supplier: string;
  linkedCropId?: string;
  linkedBedId?: string;
  linkedLotId?: string;
  linkedChannelId?: string;
  linkedCostCenter?: string;
  allocationDriver?: AllocationDriver;
  isAppropriable: boolean;
  notes: string;
  status: CostStatus;
}

export interface RecurringCostSummary {
  monthlyCostCents: number;
  monthlyReserveCents: number;
  annualConsolidatedCents: number;
}
