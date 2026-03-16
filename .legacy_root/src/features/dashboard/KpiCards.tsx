import clsx from 'clsx';
import type { KpiSnapshot } from '@/entities/finance/types';
import { riskFromKpi } from '@/entities/finance/calculations';
import { formatCurrency, formatNullableMonths, formatPct } from '@/shared/lib/format';

interface KpiCardsProps {
  snapshot: KpiSnapshot;
}

const riskMap: Record<'low' | 'medium' | 'high', string> = {
  low: 'bg-fern-600',
  medium: 'bg-amber-500',
  high: 'bg-red-600'
};

export const KpiCards = ({ snapshot }: KpiCardsProps) => {
  const risk = riskFromKpi(snapshot.marginPct, snapshot.runwayMonths);

  const cards = [
    { label: 'Custo mensal', value: formatCurrency(snapshot.totalCostCents) },
    { label: 'Investimento mensal', value: formatCurrency(snapshot.totalInvestmentCents) },
    { label: 'Receita prevista', value: formatCurrency(snapshot.totalRevenueCents) },
    { label: 'Saldo projetado', value: formatCurrency(snapshot.projectedBalanceCents) },
    { label: 'Margem', value: formatPct(snapshot.marginPct) },
    { label: 'Burn rate', value: formatCurrency(snapshot.burnRateCents) },
    { label: 'Runway', value: formatNullableMonths(snapshot.runwayMonths) },
    { label: 'ROI medio', value: formatPct(snapshot.roiPct) },
    { label: 'Payback estimado', value: formatNullableMonths(snapshot.paybackMonths) }
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
      {cards.map((card, index) => (
        <article
          key={card.label}
          className="animate-riseIn rounded-2xl border border-fern-900/10 bg-fern-50/70 p-3"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <p className="text-xs uppercase tracking-wide text-fern-700">{card.label}</p>
          <p className="mt-2 font-display text-xl text-fern-900">{card.value}</p>
        </article>
      ))}
      <article className="rounded-2xl border border-fern-900/10 bg-dunamis-50/80 p-3">
        <p className="text-xs uppercase tracking-wide text-fern-700">Risco operacional</p>
        <div className="mt-3 flex items-center gap-2">
          <span className={clsx('h-3 w-3 rounded-full', riskMap[risk])} />
          <span className="font-display text-xl capitalize text-fern-900">{risk}</span>
        </div>
      </article>
    </div>
  );
};
