import type { ImplantationItem, ImplantationSummary } from '@/entities/finance/implantation-item/types';
import type { Quotation } from '@/entities/finance/quotation/types';

const money = (value: number): number => Math.max(0, Math.round(Number.isFinite(value) ? value : 0));

export const calculateQuotationCommercialTotalCents = (quotation: Quotation): number =>
  money(quotation.totalCostCents) + money(quotation.freightCents);

export const calculateQuotationPaymentPlanTotalCents = (quotation: Quotation): number =>
  money(quotation.downPaymentCents) + money(quotation.installments) * money(quotation.installmentValueCents);

export const calculateQuotationPaymentGapCents = (quotation: Quotation): number =>
  calculateQuotationPaymentPlanTotalCents(quotation) - calculateQuotationCommercialTotalCents(quotation);

const selectedQuotationValue = (item: ImplantationItem): number => {
  if (!item.selectedQuotationId) return 0;
  const quotation = item.quotations.find((entry) => entry.id === item.selectedQuotationId);
  if (!quotation) return 0;
  return calculateQuotationCommercialTotalCents(quotation);
};

const fallbackBestQuotationValue = (item: ImplantationItem): number => {
  if (item.quotations.length === 0) return 0;
  const totals = item.quotations.map(calculateQuotationCommercialTotalCents);
  return Math.min(...totals);
};

export const calculateImplantationItemTotalCents = (item: ImplantationItem): number => {
  const selected = selectedQuotationValue(item);
  if (selected > 0) return selected;
  return fallbackBestQuotationValue(item);
};

export const calculateImplantationItemCommittedValueCents = (item: ImplantationItem): number => {
  if (item.status === 'em_cotacao') return 0;
  return selectedQuotationValue(item);
};

export const calculateImplantationTotals = (items: ImplantationItem[]): ImplantationSummary => {
  const totalCents = items.reduce((acc, item) => acc + calculateImplantationItemTotalCents(item), 0);

  const committedCents = items.reduce((acc, item) => acc + calculateImplantationItemCommittedValueCents(item), 0);

  return {
    totalCents,
    committedCents,
    openCents: Math.max(0, totalCents - committedCents)
  };
};

export const calculateImplantationPaybackMonths = (
  implantationItems: ImplantationItem[],
  monthlyAgroReturnCents: number
): number | null => {
  const totals = calculateImplantationTotals(implantationItems);
  const monthly = money(monthlyAgroReturnCents);
  if (monthly <= 0) return null;
  return Number((totals.committedCents / monthly).toFixed(1));
};

export const implantationGroupLabel = (group: ImplantationItem['group']): string => {
  switch (group) {
    case 'solo':
      return 'Solo e fertilidade';
    case 'cobertura':
      return 'Cobertura e sombrite';
    case 'hidraulica':
      return 'Parte hidráulica';
    case 'eletrica':
      return 'Parte elétrica';
    case 'maquinario':
      return 'Maquinário';
    case 'estrutura':
      return 'Estrutura física';
    case 'servicos':
    default:
      return 'Serviços';
  }
};
