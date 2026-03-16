export type InvestmentModality = 'avista' | 'financiamento' | 'consorcio';
export type InvestmentStatus = 'ativo' | 'encerrado' | 'pendente';

export interface InvestmentContract {
  id: string;
  assetName: string;
  assetCategory: string;
  modality: InvestmentModality;
  assetValueCents: number;
  downPaymentCents: number;
  installments: number;
  monthlyInstallmentCents: number;
  totalCommittedCents: number;
  expectedMonthlyReturnCents?: number;
  paybackMonths: number | null;
  notes: string;
  status: InvestmentStatus;
}
