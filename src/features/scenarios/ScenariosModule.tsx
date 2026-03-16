import { useMemo } from 'react';
import { useDemandChannelsStore, useScenariosStore } from '@/app/store';
import { applyScenarioDemand } from '@/entities';
import { formatNumber, formatPct, formatUnitLabel } from '@/shared/lib/format';
import { DetailCard, ExecutiveCard, StatusChip } from '@/shared/ui';

const demandValue = (value?: number) => Math.max(0, Number.isFinite(value) ? (value as number) : 0);

const channelTypeLabel: Record<string, string> = {
  kitchen: 'Cozinha',
  box: 'Box',
  event: 'Evento',
  'external-market': 'Mercado',
  surplus: 'Excedente'
};

export const ScenariosModule = () => {
  const channels = useDemandChannelsStore((state) => state.channels);
  const scenarios = useScenariosStore((state) => state.scenarios);
  const baselineScenarioId = useScenariosStore((state) => state.baselineScenarioId);
  const compareScenarioId = useScenariosStore((state) => state.compareScenarioId);
  const setCompareScenarioId = useScenariosStore((state) => state.setCompareScenarioId);

  const baseline = scenarios.find((entry) => entry.id === baselineScenarioId) ?? scenarios[0];
  const compare = scenarios.find((entry) => entry.id === compareScenarioId) ?? scenarios[1] ?? scenarios[0];

  const baselineChannels = useMemo(() => applyScenarioDemand(channels, baseline), [baseline, channels]);
  const compareChannels = useMemo(() => applyScenarioDemand(channels, compare), [channels, compare]);

  const baselineDemand = baselineChannels.reduce((acc, entry) => acc + demandValue(entry.scenarioDemand), 0);
  const compareDemand = compareChannels.reduce((acc, entry) => acc + demandValue(entry.scenarioDemand), 0);
  const unitSet = new Set(baselineChannels.map((entry) => entry.demandUnit));
  const hasMixedUnits = unitSet.size > 1;
  const baselineUnit = baselineChannels[0]?.demandUnit ?? 'unidade';
  const changePct = ((compareDemand - baselineDemand) / Math.max(1, baselineDemand)) * 100;
  const changeHelper = hasMixedUnits
    ? 'Leia destino por destino'
    : compareDemand === baselineDemand
      ? 'Nada muda na demanda'
      : compareDemand > baselineDemand
        ? 'A demanda sobe'
        : 'A demanda cai';

  return (
    <div className="page-stack">
      <DetailCard
        title="Simular antes de mudar"
        subtitle="Teste cozinha, box, feira ou evento sem mexer na sua base."
        action={
          <select className="select-dark" value={compareScenarioId} onChange={(event) => setCompareScenarioId(event.target.value)}>
            {scenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
            ))}
          </select>
        }
      >
        <div className="executive-grid">
          <ExecutiveCard
            title="Hoje"
            value={hasMixedUnits ? 'Veja por destino' : `${formatNumber(baselineDemand, 0)} ${formatUnitLabel(baselineUnit)}`}
            helper={hasMixedUnits ? `${baselineChannels.length} destinos em unidades diferentes` : baseline.name}
            tone="info"
          />
          <ExecutiveCard
            title="Se mudar"
            value={hasMixedUnits ? 'Compare por destino' : `${formatNumber(compareDemand, 0)} ${formatUnitLabel(baselineUnit)}`}
            helper={compare.name}
            tone="warning"
          />
          <ExecutiveCard
            title="Quanto muda"
            value={formatPct(changePct)}
            helper={changeHelper}
            tone={compareDemand >= baselineDemand ? 'warning' : 'positive'}
          />
        </div>
      </DetailCard>

      <DetailCard title="Destino por destino" subtitle="Veja onde sobe, cai ou fica igual.">
        <div className="table-lite-wrap">
          <table className="table-lite">
          <thead>
            <tr>
              <th>Destino</th>
              <th>Hoje</th>
              <th>Se mudar</th>
              <th>Diferença</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {baselineChannels.map((entry) => {
              const compareChannel = compareChannels.find((channel) => channel.id === entry.id);
              const baseDemandByChannel = demandValue(entry.scenarioDemand);
              const compareDemandByChannel = demandValue(compareChannel?.scenarioDemand);
              const delta = compareDemandByChannel - baseDemandByChannel;
              return (
                <tr key={entry.id}>
                  <td>{entry.name}</td>
                  <td>{`${formatNumber(baseDemandByChannel, 0)} ${formatUnitLabel(entry.demandUnit)}`}</td>
                  <td>{`${formatNumber(compareDemandByChannel, 0)} ${formatUnitLabel(entry.demandUnit)}`}</td>
                  <td>{`${formatNumber(delta, 0)} ${formatUnitLabel(entry.demandUnit)}`}</td>
                  <td>
                    <StatusChip
                      label={channelTypeLabel[entry.type] ?? entry.type}
                      tone={entry.type === 'event' ? 'high' : entry.type === 'kitchen' ? 'medium' : 'neutral'}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </DetailCard>
    </div>
  );
};
