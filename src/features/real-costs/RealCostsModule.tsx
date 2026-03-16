import { useMemo, useState } from 'react';
import { useFarmSnapshot } from '@/features/dashboard/model/useFarmSnapshot';
import { calculateAppropriatedCostByLot, calculateMarketableUnits } from '@/entities';
import { formatCurrency, formatNumber, formatUnitLabel } from '@/shared/lib/format';
import { ContextHelp, DetailCard, ExecutiveCard, FilterPills, SmartEmptyState, StatusChip } from '@/shared/ui';
import { useUiPreferencesStore } from '@/app/store/useUiPreferencesStore';

type CostView = 'cultura' | 'plano' | 'lote' | 'destino';

export const RealCostsModule = () => {
  const setActiveRoute = useUiPreferencesStore((state) => state.setActiveRoute);
  const {
    crops,
    lots,
    harvests,
    losses,
    realPlans,
    realEconomics,
    plannedEconomics,
    realMarginByChannel,
    allocationLedger,
    inventory,
    operationStage,
    nextAction
  } = useFarmSnapshot();

  const [view, setView] = useState<CostView>('cultura');

  const summary = useMemo(() => {
    const totalGasto = realMarginByChannel.reduce((acc, c) => acc + c.costCents, 0);
    const totalVendido = realMarginByChannel.reduce((acc, c) => acc + c.revenueCents, 0);
    const totalSobrou = totalVendido - totalGasto;
    const totalMarketable = realPlans.reduce((acc, plan) => acc + plan.marketableUnits, 0);

    const unitLabels = Array.from(new Set(realEconomics.rows.map((row) => row.unitLabel).filter(Boolean)));
    return {
      totalGasto,
      totalVendido,
      totalSobrou,
      totalMarketable,
      marketableUnitLabel: unitLabels.length === 1 ? unitLabels[0] : null
    };
  }, [realMarginByChannel, realPlans, realEconomics.rows]);

  const lotRows = useMemo(
    () =>
      lots.map((lot) => {
        const marketableUnits = calculateMarketableUnits(lot, harvests, losses);
        const appropriatedCostCents = calculateAppropriatedCostByLot(lot.id, allocationLedger);
        const costPerUnitCents = marketableUnits > 0 ? Math.round(appropriatedCostCents / marketableUnits) : 0;
        const crop = crops.find((entry) => entry.id === lot.cropId);
        return {
          id: lot.id,
          code: lot.code,
          cropName: crop?.name || lot.cropId,
          marketableUnits,
          appropriatedCostCents,
          costPerUnitCents,
          location: lot.location,
          unitLabel: formatUnitLabel(crop?.salesUnit || crop?.productionUnit || 'unidade')
        };
      }),
    [allocationLedger, crops, harvests, losses, lots]
  );

  const hasRealData = allocationLedger.length > 0 || harvests.length > 0;

  return (
    <div className="page-stack">
      <DetailCard eyebrow="Conta real" title="Quanto isso está custando de verdade?" subtitle="Aqui entra só o que já aconteceu no campo, no estoque e na colheita.">
        <div className="executive-grid">
          <ExecutiveCard title="Gastei" value={formatCurrency(summary.totalGasto)} helper="Custo direto das vendas" tone="warning" />
          <ExecutiveCard title="Vendi" value={formatCurrency(summary.totalVendido)} helper="Receita das vendas fechadas" tone="info" />
          <ExecutiveCard title="Sobrou" value={formatCurrency(summary.totalSobrou)} helper="Lucro (ou prejuízo)" tone={summary.totalSobrou >= 0 ? 'positive' : 'danger'} />
          <ExecutiveCard
            title="Plantas para venda"
            value={summary.marketableUnitLabel ? `${formatNumber(summary.totalMarketable, 0)} ${summary.marketableUnitLabel}` : 'Formatos mistos'}
            helper={summary.marketableUnitLabel ? 'Total de plantas boas' : 'Volume de plantas boas'}
            tone="neutral"
          />
        </div>
      </DetailCard>

      <DetailCard
        title="Ver por onde?"
        subtitle="Escolha como você quer olhar a conta: por cultura, por plano, por lote ou por destino."
        action={
          <FilterPills
            activeId={view}
            onChange={(value) => setView(value as CostView)}
            data-tour="real-costs-filter"
            options={[
              { id: 'cultura', label: 'Por cultura' },
              { id: 'plano', label: 'Por plano' },
              { id: 'lote', label: 'Por lote' },
              { id: 'destino', label: 'Por destino' }
            ]}
          />
        }
      >
        {!hasRealData ? (
          <SmartEmptyState
            title="Ainda falta vida real do campo"
            description={
              operationStage === 'base_montada'
                ? 'A base já está pronta. Agora registre compra ou entrada no estoque para a conta sair do zero.'
                : operationStage === 'operacao_parcial'
                  ? 'Já tem movimento, mas ainda falta fechar aplicação, colheita ou destino para esta conta ficar firme.'
                  : 'Sem estoque, uso, aplicação e colheita essa tela ainda não fecha a conta real.'
            }
            action={
              <button
                type="button"
                className="cta-btn"
                onClick={() => setActiveRoute(nextAction.route)}
              >
                {nextAction.label}
              </button>
            }
          />
        ) : null}

        {view === 'cultura' && realEconomics.rows.length > 0 && (
          <div className="table-lite-wrap">
            <table className="table-lite">
            <thead>
              <tr>
                <th>Cultura</th>
                <th>Já entrou na conta <ContextHelp text="É o valor que realmente entrou na conta dessa cultura." /></th>
                <th>Plantas boas</th>
                <th>R$ por venda</th>
                <th>Preço mínimo</th>
                <th>Preço sugerido</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {realEconomics.rows.map((row) => (
                <tr key={row.cropId}>
                  <td>{`${row.cropName}${row.cropVariety ? ` · ${row.cropVariety}` : ''}`}</td>
                  <td>{formatCurrency(row.appropriatedCostCents)}</td>
                  <td>{`${formatNumber(row.marketableUnits || row.viableUnits, 0)} ${row.unitLabel}`}</td>
                  <td>{row.costPerUnitCents > 0 ? formatCurrency(row.costPerUnitCents) : 'R$ 0,00'}</td>
                  <td>{row.minimumSalePricePerUnitCents > 0 ? formatCurrency(row.minimumSalePricePerUnitCents) : 'R$ 0,00'}</td>
                  <td>{row.suggestedSalePricePerUnitCents > 0 ? formatCurrency(row.suggestedSalePricePerUnitCents) : 'R$ 0,00'}</td>
                  <td>
                    <StatusChip label={row.plannedOnly ? 'Só previsto' : 'Real'} tone={row.plannedOnly ? 'medium' : 'low'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {view === 'plano' && realPlans.length > 0 && (
          <div className="table-lite-wrap">
            <table className="table-lite">
            <thead>
              <tr>
                <th>Plano</th>
                <th>Cultura</th>
                <th>Já entrou na conta</th>
                <th>Plantas boas</th>
                <th>R$ por venda</th>
                <th>Preço mínimo</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {realPlans.map((plan) => (
                <tr key={plan.id}>
                  <td>{plan.id.slice(0, 8)}</td>
                  <td>{crops.find((crop) => crop.id === plan.cropId)?.name || plan.cropId}</td>
                  <td>{formatCurrency(plan.appropriatedCostCents)}</td>
                  <td>{`${formatNumber(plan.marketableUnits, 0)} ${formatUnitLabel(crops.find((crop) => crop.id === plan.cropId)?.salesUnit || 'unidade')}`}</td>
                  <td>{plan.costPerUnitCents > 0 ? formatCurrency(plan.costPerUnitCents) : 'R$ 0,00'}</td>
                  <td>{plan.minimumSalePricePerUnitCents > 0 ? formatCurrency(plan.minimumSalePricePerUnitCents) : 'R$ 0,00'}</td>
                  <td>
                    <StatusChip label={plan.plannedOnly ? 'Só previsto' : 'Real'} tone={plan.plannedOnly ? 'medium' : 'low'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {view === 'lote' && lotRows.length > 0 && (
          <div className="table-lite-wrap">
            <table className="table-lite">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Cultura</th>
                <th>Local</th>
                <th>Já entrou na conta</th>
                <th>Plantas boas</th>
                <th>R$ por venda</th>
              </tr>
            </thead>
            <tbody>
              {lotRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.code}</td>
                  <td>{row.cropName}</td>
                  <td>{row.location}</td>
                  <td>{formatCurrency(row.appropriatedCostCents)}</td>
                  <td>{`${formatNumber(row.marketableUnits, 0)} ${row.unitLabel}`}</td>
                  <td>{row.costPerUnitCents > 0 ? formatCurrency(row.costPerUnitCents) : 'R$ 0,00'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        {view === 'destino' && realMarginByChannel.length > 0 && (
          <div className="table-lite-wrap">
            <table className="table-lite">
            <thead>
              <tr>
                <th>Destino</th>
                <th>Entrou</th>
                <th>Custou</th>
                <th>Lucro (%)</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {realMarginByChannel.map((row) => (
                <tr key={row.channelId}>
                  <td>{row.channelName}</td>
                  <td>{formatCurrency(row.revenueCents)}</td>
                  <td>{formatCurrency(row.costCents)}</td>
                  <td>{`${formatNumber(row.marginPct, 1)}%`}</td>
                  <td>
                    <StatusChip label={row.marginPct < 0 ? 'Negativa' : row.marginPct < 20 ? 'Apertada' : 'Boa'} tone={row.marginPct < 0 ? 'high' : row.marginPct < 20 ? 'medium' : 'low'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </DetailCard>

      <DetailCard eyebrow="Comparação" title="Planejado x o que já aconteceu">
        <div className="executive-grid">
          <ExecutiveCard
            title="Culturas com conta real"
            value={String(realEconomics.rows.filter((row) => !row.plannedOnly).length)}
            helper={`${plannedEconomics.rows.length} cultura(s) ainda estão só no previsto`}
            tone="positive"
          />
          <ExecutiveCard
            title="Culturas só no previsto"
            value={String(realEconomics.rows.filter((row) => row.plannedOnly).length)}
            helper="Falta baixa, aplicação ou colheita"
            tone="warning"
          />
          <ExecutiveCard title="Lotes com colheita" value={String(lots.filter((lot) => lot.harvests.length > 0).length)} helper="Já fecharam o vendável" tone="info" />
          <ExecutiveCard title="Lotes sem colheita" value={String(lots.filter((lot) => lot.harvests.length === 0).length)} helper="Ainda sem destino real" tone="neutral" />
        </div>
      </DetailCard>
    </div>
  );
};
