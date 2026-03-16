import clsx from 'clsx';
import type { KpiSnapshot } from '@/entities/finance/types';
import { riskFromKpi } from '@/entities/finance/calculations';
import { formatCurrency, formatNullableMonths, formatPct } from '@/shared/lib/format';
import { UiIcon } from '@/shared/ui/Icons';

interface KpiCardsProps {
  snapshot: KpiSnapshot;
}

type Tone = 'cost' | 'revenue' | 'investment' | 'result';

const riskMap: Record<'low' | 'medium' | 'high', { dot: string; label: string }> = {
  low: { dot: 'bg-[#52b36a]', label: 'Baixo' },
  medium: { dot: 'bg-[#d2a03a]', label: 'Médio' },
  high: { dot: 'bg-[#d45e6e]', label: 'Alto' }
};

const toneClass: Record<Tone, string> = {
  cost: 'tone-block-cost',
  revenue: 'tone-block-revenue',
  investment: 'tone-block-investment',
  result: 'tone-block-result'
};

export const KpiCards = ({ snapshot }: KpiCardsProps) => {
  const risk = riskFromKpi(snapshot.marginPct, snapshot.runwayMonths);
  const monthlyDeficit = snapshot.burnRateCents <= 0 ? 'Sem falta no mês' : formatCurrency(snapshot.burnRateCents);

  const cards: Array<{
    label: string;
    helper: string;
    value: string;
    tone: Tone;
    icon: 'cost' | 'revenue' | 'investment' | 'result' | 'wallet' | 'calendar' | 'target';
  }> = [
    {
      label: 'Custos do mês',
      helper: 'Saídas totais do período',
      value: formatCurrency(snapshot.totalCostCents),
      tone: 'cost',
      icon: 'cost'
    },
    {
      label: 'Entradas previstas',
      helper: 'Receitas esperadas no período',
      value: formatCurrency(snapshot.totalRevenueCents),
      tone: 'revenue',
      icon: 'revenue'
    },
    {
      label: 'Parcelas e investimentos do mês',
      helper: 'Financiamentos, consórcios e investimentos',
      value: formatCurrency(snapshot.totalInvestmentCents),
      tone: 'investment',
      icon: 'investment'
    },
    {
      label: 'Resultado do mês',
      helper: 'Entradas - custos - investimentos',
      value: formatCurrency(snapshot.projectedBalanceCents),
      tone: 'result',
      icon: 'result'
    },
    {
      label: 'Margem final',
      helper: 'Percentual de sobra',
      value: formatPct(snapshot.marginPct),
      tone: 'result',
      icon: 'target'
    },
    {
      label: 'Falta para fechar',
      helper: 'Valor que ainda falta cobrir',
      value: monthlyDeficit,
      tone: 'cost',
      icon: 'cost'
    },
    {
      label: 'Fôlego do caixa',
      helper: 'Meses de sustentação',
      value: formatNullableMonths(snapshot.runwayMonths),
      tone: 'investment',
      icon: 'calendar'
    },
    {
      label: 'Tempo para recuperar investimento',
      helper: 'Estimativa média de payback',
      value: formatNullableMonths(snapshot.paybackMonths),
      tone: 'investment',
      icon: 'wallet'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => (
        <article
          key={card.label}
          className={clsx('frost-card animate-soft-rise rounded-2xl p-3', toneClass[card.tone])}
          style={{ animationDelay: `${index * 28}ms` }}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#4f7058]">{card.label}</p>
            <span className="icon-pill">
              <UiIcon name={card.icon} className="h-4 w-4 text-[#3d6248]" />
            </span>
          </div>
          <p className="mt-1 break-words text-[clamp(1.1rem,3.8vw,1.7rem)] font-bold text-[#29422f]">{card.value}</p>
          <p className="help-text mt-1">{card.helper}</p>
        </article>
      ))}

      <article className="frost-card rounded-2xl p-3 tone-block-result">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#7a5a22]">Nível de atenção</p>
          <span className="icon-pill">
            <UiIcon name="warning" className="h-4 w-4 text-[#8d6b32]" />
          </span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className={clsx('h-3 w-3 rounded-full', riskMap[risk].dot)} />
          <span className="text-2xl font-semibold text-[#5f4a1f]">{riskMap[risk].label}</span>
        </div>
        <p className="help-text mt-2">Baseado na margem e no tempo que o caixa aguenta.</p>
      </article>
    </div>
  );
};
