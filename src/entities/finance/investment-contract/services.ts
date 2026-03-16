import type { InvestmentContract } from '@/entities/finance/investment-contract/types';

const money = (value: number | undefined): number => Math.max(0, Math.round(Number.isFinite(value) ? (value as number) : 0));

export const deriveInvestmentContract = (
  contract: InvestmentContract
): InvestmentContract & { missingReturnForPayback: boolean } => {
  const installments = Math.max(1, contract.installments);
  const monthlyInstallmentCents = money(contract.monthlyInstallmentCents) || Math.round((contract.assetValueCents - contract.downPaymentCents) / installments);
  const totalCommittedCents =
    money(contract.totalCommittedCents) || money(contract.downPaymentCents) + monthlyInstallmentCents * installments;

  const expectedMonthlyReturnCents = money(contract.expectedMonthlyReturnCents);
  const paybackMonths = expectedMonthlyReturnCents > 0 ? Number((totalCommittedCents / expectedMonthlyReturnCents).toFixed(1)) : null;

  return {
    ...contract,
    installments,
    monthlyInstallmentCents,
    totalCommittedCents,
    expectedMonthlyReturnCents,
    paybackMonths,
    missingReturnForPayback: expectedMonthlyReturnCents <= 0
  };
};

export const calculateInvestmentsSnapshot = (contracts: InvestmentContract[]) => {
  const active = contracts.filter((item) => item.status === 'ativo');
  const derived = active.map(deriveInvestmentContract);

  const totalCommittedCents = derived.reduce((acc, item) => acc + item.totalCommittedCents, 0);
  const monthlyOutflowCents = derived.reduce((acc, item) => acc + item.monthlyInstallmentCents, 0);
  const monthlyReturnCents = derived.reduce((acc, item) => acc + money(item.expectedMonthlyReturnCents), 0);

  return {
    totalCommittedCents,
    monthlyOutflowCents,
    monthlyReturnCents,
    monthlyNetCents: monthlyReturnCents - monthlyOutflowCents
  };
};
