export type QuotationStatus = 'pendente' | 'recebida' | 'selecionada' | 'descartada';

export interface Quotation {
  id: string;
  supplier: string;
  totalCostCents: number;
  freightCents: number;
  notes: string;
  source: string;
  status: QuotationStatus;
  createdAt: string;
  updatedAt: string;
  paymentMode: 'avista' | 'parcelado' | 'financiado';
  downPaymentCents: number;
  installments: number;
  installmentValueCents: number;
  firstDueDate: string;
  paymentNotes: string;
}
