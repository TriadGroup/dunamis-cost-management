import { calculatePayback } from '@/entities/finance/calculations';
import { formatCurrency, formatNullableMonths, toCents } from '@/shared/lib/format';
import { Card } from '@/shared/ui/Card';
import { useAppStore } from '@/app/store/useAppStore';

export const InvestmentsPanel = () => {
  const investments = useAppStore((state) => state.data.investments);
  const actions = useAppStore((state) => state.actions);

  const totalAmount = investments.reduce((acc, item) => acc + item.amountCents, 0);

  return (
    <Card
      title="Investimentos"
      subtitle={`Capital total ${formatCurrency(totalAmount)}`}
      action={
        <button className="rounded-lg border border-fern-900/20 px-2 py-1 text-xs text-fern-800" onClick={actions.addInvestment}>
          + Investimento
        </button>
      }
    >
      <div className="space-y-3">
        {investments.map((item) => {
          const payback = calculatePayback(item);
          return (
            <article key={item.id} className="space-y-2 rounded-xl border border-fern-900/10 bg-white p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  value={item.name}
                  onChange={(event) => actions.updateInvestment(item.id, { name: event.target.value })}
                  className="rounded-lg border border-fern-900/20 px-2 py-1 text-sm"
                />
                <select
                  value={item.riskLevel}
                  onChange={(event) => actions.updateInvestment(item.id, { riskLevel: event.target.value as typeof item.riskLevel })}
                  className="rounded-lg border border-fern-900/20 px-2 py-1 text-sm"
                >
                  <option value="low">Baixo</option>
                  <option value="medium">Medio</option>
                  <option value="high">Alto</option>
                </select>
                <input
                  type="number"
                  value={item.amountCents / 100}
                  onChange={(event) => actions.updateInvestment(item.id, { amountCents: toCents(Number(event.target.value || 0)) })}
                  className="rounded-lg border border-fern-900/20 px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  value={item.expectedMonthlyReturnCents / 100}
                  onChange={(event) =>
                    actions.updateInvestment(item.id, { expectedMonthlyReturnCents: toCents(Number(event.target.value || 0)) })
                  }
                  className="rounded-lg border border-fern-900/20 px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  min={1}
                  value={item.horizonMonths}
                  onChange={(event) => actions.updateInvestment(item.id, { horizonMonths: Number(event.target.value || 1) })}
                  className="rounded-lg border border-fern-900/20 px-2 py-1 text-sm"
                />
              </div>
              <p className="text-sm text-fern-800/80">Payback: {formatNullableMonths(payback)}</p>
              <button onClick={() => actions.removeInvestment(item.id)} className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
                Remover investimento
              </button>
            </article>
          );
        })}
      </div>
    </Card>
  );
};
