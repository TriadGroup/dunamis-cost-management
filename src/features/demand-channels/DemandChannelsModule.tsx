import { useMemo, useState } from 'react';
import { useDemandChannelsStore } from '@/app/store/useDemandChannelsStore';
import { calculateChannelRevenue, kitchenSensitivity, sortChannelsByPriority } from '@/entities';
import { formatCurrency, formatPct, formatPricePerUnit, formatUnitLabel } from '@/shared/lib/format';
import { DetailCard, ExecutiveCard, MoneyField, NumberField, SmartEmptyState, StatusChip, UiIcon } from '@/shared/ui';
import { DemandChannelCompositionModal } from './ui/DemandChannelCompositionModal';

const demandUnitOptions = [
  { value: 'unidade', label: 'Unidade' },
  { value: 'muda', label: 'Muda' },
  { value: 'caixa', label: 'Caixa' },
  { value: 'maco', label: 'Maço' },
  { value: 'kg', label: 'Kg' },
  { value: 'outro', label: 'Outro' }
] as const;

export const DemandChannelsModule = () => {
  const channels = useDemandChannelsStore((state) => state.channels);
  const scenarios = useDemandChannelsStore((state) => state.scenarios);
  const activeScenarioId = useDemandChannelsStore((state) => state.activeScenarioId);
  const setActiveScenario = useDemandChannelsStore((state) => state.setActiveScenario);
  const updateChannel = useDemandChannelsStore((state) => state.updateChannel);
  const reorderChannels = useDemandChannelsStore((state) => state.reorderChannels);
  const applyActiveScenario = useDemandChannelsStore((state) => state.applyActiveScenario);
  const [draggingChannelId, setDraggingChannelId] = useState<string | null>(null);
  const [dragOverChannelId, setDragOverChannelId] = useState<string | null>(null);
  const [composingChannelId, setComposingChannelId] = useState<string | null>(null);

  const sorted = useMemo(() => sortChannelsByPriority(channels), [channels]);
  const revenue = calculateChannelRevenue(channels);
  const kitchen = kitchenSensitivity(channels);

  const moveChannel = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const orderedIds = sorted.map((channel) => channel.id);
    const sourceIndex = orderedIds.indexOf(sourceId);
    const targetIndex = orderedIds.indexOf(targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const nextIds = orderedIds.slice();
    const [moved] = nextIds.splice(sourceIndex, 1);
    nextIds.splice(targetIndex, 0, moved);
    reorderChannels(nextIds);
  };

  return (
    <div className="page-stack">
      <DetailCard
        title="Demanda e canais"
        subtitle="Prioridade e cenario"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="select-dark" value={activeScenarioId} onChange={(event) => setActiveScenario(event.target.value)}>
              {scenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
              ))}
            </select>
            <button className="cta-btn" onClick={applyActiveScenario} data-tour="apply-scenario-btn">Aplicar cenário</button>
          </div>
        }
      >
        <div className="executive-grid">
          <ExecutiveCard title="Receita interna" value={formatCurrency(revenue.internalRevenueCents)} helper="Canal cozinha" tone="info" />
          <ExecutiveCard title="Receita externa" value={formatCurrency(revenue.externalRevenueCents)} helper="Box, mercado, eventos" tone="positive" />
          <ExecutiveCard title="Preço cozinha vs ideal" value={formatPct(kitchen.acceptedVsIdealPct - 100)} helper="Sensibilidade do canal interno" tone={kitchen.risk === 'low' ? 'positive' : kitchen.risk === 'medium' ? 'warning' : 'danger'} />
        </div>
      </DetailCard>

      <DetailCard title="Prioridade" subtitle="Arraste os canais. A numeração é automática.">
        {sorted.length === 0 ? (
          <SmartEmptyState title="Nenhum canal cadastrado" description="Crie canais para definir a ordem de prioridade da operação." />
        ) : (
          <div className="channel-priority-list">
            {sorted.map((channel, index) => (
              <article
                key={channel.id}
                className={`channel-priority-row ${dragOverChannelId === channel.id ? 'is-drop-target' : ''}`}
                draggable
                onDragStart={() => {
                  setDraggingChannelId(channel.id);
                  setDragOverChannelId(channel.id);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverChannelId(channel.id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (draggingChannelId) moveChannel(draggingChannelId, channel.id);
                  setDraggingChannelId(null);
                  setDragOverChannelId(null);
                }}
                onDragEnd={() => {
                  setDraggingChannelId(null);
                  setDragOverChannelId(null);
                }}
              >
                <div className="channel-priority-handle" aria-hidden="true">
                  <UiIcon name="flow" className="rail-link-icon" />
                </div>
                <div className="channel-priority-rank">{index + 1}</div>
                <div className="channel-priority-copy">
                  <strong>{channel.name}</strong>
                  <small>{channel.type === 'kitchen' ? 'Canal interno' : 'Canal de saída'}</small>
                </div>
                <StatusChip label={channel.enabled ? 'Ativo' : 'Desativado'} tone={channel.enabled ? 'low' : 'medium'} />
              </article>
            ))}
          </div>
        )}
      </DetailCard>

      <DetailCard title="Ajustes por canal" subtitle="Demanda e preço de cada destino">
        <div className="table-lite-wrap">
          <table className="table-lite">
          <thead>
            <tr>
              <th>Canal</th>
              <th>Unidade</th>
              <th>Base</th>
              <th>Cenário</th>
              <th>Preço aceito</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((channel) => (
              <tr key={channel.id}>
                <td>{channel.name}</td>
                <td>
                  <select className="select-dark" value={channel.demandUnit} onChange={(event) => updateChannel(channel.id, { demandUnit: event.target.value as typeof channel.demandUnit })}>
                    {demandUnitOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <NumberField value={channel.baselineDemand} onChange={(event) => updateChannel(channel.id, { baselineDemand: Number(event.target.value || 0) })} suffix={formatUnitLabel(channel.demandUnit)} />
                </td>
                <td>
                  <NumberField value={channel.scenarioDemand} onChange={(event) => updateChannel(channel.id, { scenarioDemand: Number(event.target.value || 0) })} suffix={formatUnitLabel(channel.demandUnit)} />
                </td>
                <td>
                  <MoneyField valueCents={channel.acceptedPriceCents ?? 0} onChange={(nextValueCents) => updateChannel(channel.id, { acceptedPriceCents: nextValueCents })} ariaLabel={`Preço aceito por ${channel.name}`} />
                  <div className="command-hint" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      {channel.items && channel.items.length > 0 
                        ? `Pacote misto: ${formatCurrency(channel.items.reduce((sum, item) => sum + item.acceptedPriceCents, 0))}` 
                        : formatPricePerUnit(channel.acceptedPriceCents ?? 0, channel.demandUnit)}
                    </span>
                    <button type="button" className="ghost-btn" style={{ padding: '2px 8px', fontSize: '0.8rem' }} onClick={() => setComposingChannelId(channel.id)}>
                      Editar composição
                    </button>
                  </div>
                </td>
                <td>
                  <StatusChip label={channel.enabled ? 'Ativo' : 'Desativado'} tone={channel.enabled ? 'low' : 'medium'} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </DetailCard>

      {composingChannelId && (
        <DemandChannelCompositionModal 
          channelId={composingChannelId} 
          onClose={() => setComposingChannelId(null)} 
        />
      )}
    </div>
  );
};
