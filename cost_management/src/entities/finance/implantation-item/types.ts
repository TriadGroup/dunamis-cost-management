import type { Quotation } from '@/entities/finance/quotation/types';

export type ImplantationGroup =
  | 'solo'
  | 'cobertura'
  | 'hidraulica'
  | 'eletrica'
  | 'maquinario'
  | 'estrutura'
  | 'servicos';

export type ImplantationPriority = 'alta' | 'media' | 'baixa';

export type ImplantationStatus = 'em_cotacao' | 'negociando' | 'fechado' | 'pago_parcial' | 'pago';

export type PaymentMode = 'avista' | 'parcelado' | 'financiado';

export interface ImplantationItem {
  id: string;
  projectId: string;
  group: ImplantationGroup;
  name: string;
  description: string;
  priority: ImplantationPriority;
  quotations: Quotation[];
  selectedQuotationId: string | null;
  paymentMode: PaymentMode;
  status: ImplantationStatus;
  deadline: string;
  linkedAssetId?: string;
  notes: string;
}

export interface ImplantationSummary {
  totalCents: number;
  committedCents: number;
  openCents: number;
}
