import type { Investment } from './types';

export interface InvestmentDerived {
  monthlyPaymentCents: number;
  totalPaidCents: number;
  feeOrInterestCents: number;
  netMonthlyImpactCents: number;
  paybackMonths: number | null;
}

const safeMoney = (value: number): number => Math.max(0, Math.round(value));
const safePct = (value: number): number => (Number.isFinite(value) ? value : 0);

const financingPayment = (principalCents: number, monthlyRatePct: number, termMonths: number): number => {
  const n = Math.max(1, Math.round(termMonths));
  const rate = Math.max(0, monthlyRatePct) / 100;
  if (rate === 0) return Math.round(principalCents / n);

  const p = principalCents;
  const payment = (p * rate) / (1 - Math.pow(1 + rate, -n));
  return Math.round(payment);
};

export const deriveInvestment = (investment: Investment): InvestmentDerived => {
  const assetValue = safeMoney(investment.assetValueCents);
  const upfront = safeMoney(investment.upfrontCents);
  const term = Math.max(1, Math.round(investment.termMonths || 1));

  const financedBase = Math.max(0, assetValue - upfront);

  let monthlyPaymentCents = 0;
  let totalPaidCents = 0;
  let feeOrInterestCents = 0;

  if (investment.kind === 'financiamento') {
    monthlyPaymentCents = financingPayment(financedBase, safePct(investment.monthlyInterestPct), term);
    totalPaidCents = upfront + monthlyPaymentCents * term;
    feeOrInterestCents = Math.max(0, totalPaidCents - assetValue);
  }

  if (investment.kind === 'consorcio') {
    const fee = Math.round(assetValue * (Math.max(0, safePct(investment.consortiumFeePct)) / 100));
    const base = financedBase + fee;
    monthlyPaymentCents = Math.round(base / term);
    totalPaidCents = upfront + monthlyPaymentCents * term;
    feeOrInterestCents = fee;
  }

  if (investment.kind === 'compra_avista') {
    monthlyPaymentCents = assetValue;
    totalPaidCents = assetValue;
    feeOrInterestCents = 0;
  }

  const netMonthlyImpactCents = safeMoney(investment.expectedMonthlyReturnCents) - monthlyPaymentCents;
  const paybackMonths =
    investment.expectedMonthlyReturnCents > 0
      ? Number((totalPaidCents / investment.expectedMonthlyReturnCents).toFixed(1))
      : null;

  return {
    monthlyPaymentCents,
    totalPaidCents,
    feeOrInterestCents,
    netMonthlyImpactCents,
    paybackMonths
  };
};

export const sumInvestmentMonthlyOutflow = (investments: Investment[]): number => {
  return investments.reduce((acc, investment) => acc + deriveInvestment(investment).monthlyPaymentCents, 0);
};

export const sumInvestmentTotalPaid = (investments: Investment[]): number => {
  return investments.reduce((acc, investment) => acc + deriveInvestment(investment).totalPaidCents, 0);
};

export const sumInvestmentProjectedReturn = (investments: Investment[]): number => {
  return investments.reduce(
    (acc, investment) => acc + safeMoney(investment.expectedMonthlyReturnCents) * Math.max(1, Math.round(investment.termMonths || 1)),
    0
  );
};
