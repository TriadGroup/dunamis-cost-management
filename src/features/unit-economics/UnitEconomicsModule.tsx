import { useFarmSnapshot } from '@/features/dashboard/model/useFarmSnapshot';
import { formatCurrency, formatNumber } from '@/shared/lib/format';
import { DetailCard, ExecutiveCard, StatusChip } from '@/shared/ui';

export const UnitEconomicsModule = () => {
  const { economics } = useFarmSnapshot();

  const averageCostPerUnit = economics.rows.length
    ? Math.round(economics.rows.reduce((acc, row) => acc + row.costPerUnitCents, 0) / economics.rows.length)
    : 0;

  const averageSuggestedPrice = economics.rows.length
    ? Math.round(economics.rows.reduce((acc, row) => acc + row.suggestedSalePricePerUnitCents, 0) / economics.rows.length)
    : 0;

  const averageBoxPrice = economics.rows.length
    ? Math.round(economics.rows.reduce((acc, row) => acc + row.suggestedSalePricePerBoxCents, 0) / economics.rows.length)
    : 0;

  return (
    <div className="page-stack">
      <DetailCard eyebrow="Decisao" title="Quanto custa e quanto cobrar" subtitle="Uma leitura simples para decidir o preço de cada cultura.">
        <div className="executive-grid">
          <ExecutiveCard title="Custo médio por unidade" value={averageCostPerUnit > 0 ? formatCurrency(averageCostPerUnit) : 'Sem custo'} helper="Base dos planos ativos" tone="warning" />
          <ExecutiveCard title="Venda sugerida média" value={averageSuggestedPrice > 0 ? formatCurrency(averageSuggestedPrice) : 'Sem preço'} helper="Lucro aplicado" tone="positive" />
          <ExecutiveCard title="Venda média por embalagem" value={averageBoxPrice > 0 ? formatCurrency(averageBoxPrice) : 'Sem embalagem'} helper="Quando a embalagem existe" tone="info" />
        </div>
      </DetailCard>

      <DetailCard eyebrow="Cultivos" title="Cultura por cultura" subtitle="Veja custo, venda sugerida e lucro esperado.">
        <div className="table-lite-wrap" data-tour="unit-economics-table">
          <table className="table-lite">
          <thead>
            <tr>
              <th>Cultura</th>
              <th>Plantas boas</th>
              <th>Custo/unidade</th>
              <th>Venda sugerida</th>
              <th>Embalagem</th>
              <th>Lucro pretendido</th>
            </tr>
          </thead>
          <tbody>
            {economics.rows.map((row) => (
              <tr key={row.cropId}>
                <td>{row.cropName}</td>
                <td>{formatNumber(row.viableUnits, 0)}</td>
                <td>{row.costPerUnitCents > 0 ? formatCurrency(row.costPerUnitCents) : 'Sem custo'}</td>
                <td>{row.suggestedSalePricePerUnitCents > 0 ? formatCurrency(row.suggestedSalePricePerUnitCents) : 'Faltam dados'}</td>
                <td>{row.unitsPerSalesBox > 0 ? formatCurrency(row.suggestedSalePricePerBoxCents) : 'Sem embalagem'}</td>
                <td>{row.estimatedProfitPerUnitCents > 0 ? formatCurrency(row.estimatedProfitPerUnitCents) : 'Sem lucro definido'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </DetailCard>

      <DetailCard eyebrow="Destinos" title="Resultado por canal de venda" subtitle="Entenda onde o retorno esta melhor ou mais apertado.">
        <div className="table-lite-wrap">
          <table className="table-lite">
          <thead>
            <tr>
              <th>Canal</th>
              <th>Custo</th>
              <th>Receita</th>
              <th>Lucro (%)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {economics.marginByChannel.map((channel) => (
              <tr key={channel.channelId}>
                <td>{channel.channelName}</td>
                <td>{formatCurrency(channel.costCents)}</td>
                <td>{formatCurrency(channel.revenueCents)}</td>
                <td>{`${formatNumber(channel.marginPct, 1)}%`}</td>
                <td>
                  <StatusChip
                    label={channel.marginPct >= 20 ? 'Boa' : channel.marginPct >= 0 ? 'Apertada' : 'Negativa'}
                    tone={channel.marginPct >= 20 ? 'low' : channel.marginPct >= 0 ? 'medium' : 'high'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </DetailCard>
    </div>
  );
};
