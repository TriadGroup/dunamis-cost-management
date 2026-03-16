import type { ImplantationItem } from '@/entities/finance/implantation-item/types';

export type ImplantationProjectStatus = 'planejamento' | 'em_execucao' | 'pausado' | 'concluido';

export interface ImplantationProject {
  id: string;
  name: string;
  description: string;
  budgetTargetCents: number;
  status: ImplantationProjectStatus;
  startDate: string;
  targetEndDate: string;
  notes: string;
  createdAt: string;
}

export interface ImplantationProjectTotals {
  budgetTargetCents: number;
  totalCents: number;
  committedCents: number;
  openCents: number;
  remainingBudgetCents: number;
  itemCount: number;
  selectedQuotationCount: number;
}

export interface ImplantationProjectGroup {
  project: ImplantationProject;
  totals: ImplantationProjectTotals;
  items: ImplantationItem[];
}
