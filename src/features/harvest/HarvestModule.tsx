import { useMemo, useState } from 'react';
import { useDemandChannelsStore } from '@/app/store/useDemandChannelsStore';
import { useOnboardingStore } from '@/app/store/useOnboardingStore';
import { useOptionCatalogStore } from '@/app/store/useOptionCatalogStore';
import { useProductionPlanningStore } from '@/app/store/useProductionPlanningStore';
import { useTraceabilityStore } from '@/app/store/useTraceabilityStore';
import type { Harvest, Lot } from '@/entities';
import { formatCurrency, formatDate, formatNumber, formatUnitLabel } from '@/shared/lib/format';
import { CenterModal, ContextHelp, CreatableSelect, DetailCard, ExecutiveCard, MoneyField, NumberField, SearchBar, SmartEmptyState, StatusChip } from '@/shared/ui';

interface HarvestDraftDestination {
  channelId: string;
  quantity: number;
  valueCents: number;
}

const buildDraft = (harvest?: Harvest) => ({
  id: harvest?.id ?? null,
  lotId: harvest?.lotId ?? '',
  harvestedAt: harvest?.harvestedAt ?? new Date().toISOString().slice(0, 10),
  grossQuantity: harvest?.grossQuantity ?? 0,
  marketableQuantity: harvest?.marketableQuantity ?? 0,
  lossQuantity: harvest?.lossQuantity ?? 0,
  unit: harvest?.unit ?? 'unidade',
  destinations: harvest?.destinationBreakdown?.map((destination) => ({
    channelId: destination.channelId,
    quantity: destination.quantity,
    valueCents: destination.valueCents
  })) ?? []
});

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

const resolveCommonUnit = (harvests: Harvest[]): string | null => {
  const units = Array.from(new Set(harvests.map((harvest) => harvest.unit).filter(Boolean)));
  return units.length === 1 ? units[0] : null;
};

const resolveLotUnit = (lot: Lot, fallbackUnit: string): string => {
  const latestHarvest = [...lot.harvests].sort((a, b) => b.harvestedAt.localeCompare(a.harvestedAt))[0];
  return latestHarvest?.unit || fallbackUnit;
};

export const HarvestModule = () => {
  const lots = useTraceabilityStore((state) => state.lots);
  const updateLot = useTraceabilityStore((state) => state.updateLot);
  const crops = useProductionPlanningStore((state) => state.crops);
  const channels = useDemandChannelsStore((state) => state.channels.filter((channel) => channel.enabled));
  const inventoryUnitOptions = useOptionCatalogStore((state) => state.getOptions('inventory-unit'));
  const addCatalogOption = useOptionCatalogStore((state) => state.addOption);
  const startTour = useOnboardingStore((state) => state.startTour);

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(buildDraft());

  const visibleLots = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lots;
    return lots.filter((lot) => {
      const crop = crops.find((entry) => entry.id === lot.cropId);
      return [lot.code, lot.location, crop?.name, lot.variety].filter(Boolean).some((value) => String(value).toLowerCase().includes(q));
    });
  }, [crops, lots, query]);

  const allHarvests = useMemo(
    () =>
      lots.flatMap((lot) =>
        lot.harvests.map((harvest) => ({
          ...harvest,
          lotCode: lot.code,
          cropName: crops.find((entry) => entry.id === lot.cropId)?.name || lot.cropId
        }))
      ),
    [crops, lots]
  );

  const summary = useMemo(() => {
    const gross = allHarvests.reduce((acc, harvest) => acc + harvest.grossQuantity, 0);
    const marketable = allHarvests.reduce((acc, harvest) => acc + harvest.marketableQuantity, 0);
    const losses = allHarvests.reduce((acc, harvest) => acc + harvest.lossQuantity, 0);
    const revenue = allHarvests.reduce(
      (acc, harvest) => acc + harvest.destinationBreakdown.reduce((sumValue, destination) => sumValue + destination.valueCents, 0),
      0
    );

    return { gross, marketable, losses, revenue };
  }, [allHarvests]);
  const summaryUnit = useMemo(() => resolveCommonUnit(allHarvests), [allHarvests]);

  const activeLot = lots.find((lot) => lot.id === draft.lotId) ?? null;
  const destinationTotal = sum(draft.destinations.map((destination) => destination.quantity));
  const destinationsMatch = Math.round(destinationTotal * 100) === Math.round(draft.marketableQuantity * 100);

  const openCreateModal = () => {
    setDraft(buildDraft());
    setModalOpen(true);
  };

  const openEditModal = (lot: Lot, harvest: Harvest) => {
    setDraft(buildDraft({ ...harvest, lotId: lot.id }));
    setModalOpen(true);
  };

  const closeModal = () => {
    setDraft(buildDraft());
    setModalOpen(false);
  };

  const saveHarvest = () => {
    if (!draft.lotId || !draft.harvestedAt || draft.grossQuantity <= 0 || draft.marketableQuantity <= 0) return;
    if (!destinationsMatch) return;
    if (draft.unit.trim()) addCatalogOption('inventory-unit', draft.unit, draft.unit);

    const nextHarvest: Harvest = {
      id: draft.id ?? crypto.randomUUID(),
      lotId: draft.lotId,
      harvestedAt: draft.harvestedAt,
      grossQuantity: draft.grossQuantity,
      marketableQuantity: draft.marketableQuantity,
      lossQuantity: draft.lossQuantity,
      unit: draft.unit,
      quantity: draft.grossQuantity,
      destinationBreakdown: draft.destinations
        .filter((destination) => destination.quantity > 0)
        .map((destination) => ({
          channelId: destination.channelId,
          quantity: destination.quantity,
          unit: draft.unit,
          valueCents: destination.valueCents
        }))
    };

    const lot = lots.find((entry) => entry.id === draft.lotId);
    if (!lot) return;

    const nextHarvests = [...lot.harvests.filter((entry) => entry.id !== nextHarvest.id), nextHarvest].sort((a, b) => a.harvestedAt.localeCompare(b.harvestedAt));
    const totalMarketable = nextHarvests.reduce((acc, harvest) => acc + harvest.marketableQuantity, 0);
    const totalDiscarded = nextHarvests.reduce((acc, harvest) => acc + harvest.lossQuantity, 0);

    updateLot(lot.id, {
      harvests: nextHarvests,
      marketableQuantity: totalMarketable,
      discardedQuantity: totalDiscarded,
      stage: 'colheita'
    });

    closeModal();
  };

  return (
    <div className="page-stack">
      <DetailCard
        eyebrow="Colheita"
        title="O que voce colheu e para onde foi?"
        subtitle="Aqui voce fecha o que saiu do campo, o que ficou bom para vender e para onde essa producao foi."
        action={lots.length > 0 ? <button type="button" className="cta-btn" onClick={openCreateModal} data-tour="new-harvest-btn">Nova colheita</button> : undefined}
      >
        <div className="executive-grid">
          <ExecutiveCard
            title="Bruto colhido"
            value={summaryUnit ? `${formatNumber(summary.gross, 0)} ${formatUnitLabel(summaryUnit)}` : 'Unidades mistas'}
            helper={summaryUnit ? 'Saiu do campo' : 'Compare por lote para não misturar formatos'}
            tone="info"
          />
          <ExecutiveCard
            title="Vendavel"
            value={summaryUnit ? `${formatNumber(summary.marketable, 0)} ${formatUnitLabel(summaryUnit)}` : 'Unidades mistas'}
            helper={summaryUnit ? 'Bom para venda ou entrega' : 'Cada lote pode usar um formato diferente'}
            tone="positive"
          />
          <ExecutiveCard
            title="Perda depois da colheita"
            value={summaryUnit ? `${formatNumber(summary.losses, 0)} ${formatUnitLabel(summaryUnit)}` : 'Unidades mistas'}
            helper={summaryUnit ? 'O que se perdeu depois de colher' : 'Veja a perda por lote'}
            tone="warning"
          />
          <ExecutiveCard title="Valor ja lançado" value={formatCurrency(summary.revenue)} helper="Destino com valor preenchido" tone="neutral" />
        </div>
      </DetailCard>

      <DetailCard title="Lotes prontos para colher" subtitle="Escolha o lote e diga quanto saiu, quanto ficou bom e para onde foi">
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar por lote, cultura ou localização" />
        {visibleLots.length === 0 ? (
          <SmartEmptyState
            title="Nenhum lote disponível"
            description="Crie o primeiro lote e ligue a cultura antes de registrar a colheita."
            action={<button type="button" className="cta-btn" onClick={openCreateModal} data-tour="new-harvest-btn">Abrir registro de colheita</button>}
          />
        ) : (
          <div className="table-lite-wrap">
            <table className="table-lite">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Cultura</th>
                <th>Local</th>
                <th>Vendável <ContextHelp text="É o que sobrou bom para vender, usar na cozinha ou montar caixa." /></th>
                <th>Perda</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {visibleLots.map((lot) => {
                const crop = crops.find((entry) => entry.id === lot.cropId);
                const lotUnit = resolveLotUnit(lot, crop?.salesUnit || crop?.productionUnit || 'unidade');
                return (
                  <tr key={lot.id}>
                    <td>{lot.code}</td>
                    <td>{crop?.name || lot.cropId}</td>
                    <td>{lot.location}</td>
                    <td>{`${formatNumber(lot.marketableQuantity || 0, 0)} ${formatUnitLabel(lotUnit)}`}</td>
                    <td>{`${formatNumber(lot.discardedQuantity || 0, 0)} ${formatUnitLabel(lotUnit)}`}</td>
                    <td>
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => {
                          const latestHarvest = [...lot.harvests].sort((a, b) => b.harvestedAt.localeCompare(a.harvestedAt))[0];
                          if (latestHarvest) {
                            openEditModal(lot, latestHarvest);
                            return;
                          }
                          setDraft({ ...buildDraft(), lotId: lot.id, unit: lotUnit });
                          setModalOpen(true);
                        }}
                      >
                        {lot.harvests.length > 0 ? 'Editar última' : 'Registrar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </DetailCard>

      <DetailCard title="Colheitas lançadas" subtitle="Bruto, vendável e destino">
        {allHarvests.length === 0 ? (
          <SmartEmptyState
            title="Nenhuma colheita lançada"
            description="Registre a primeira colheita para o sistema saber o que ficou bom para vender."
            action={<button type="button" className="cta-btn" onClick={openCreateModal} data-tour="new-harvest-btn">Registrar primeira colheita</button>}
          />
        ) : (
          <div className="table-lite-wrap">
            <table className="table-lite">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Cultura</th>
                <th>Data</th>
                <th>Bruto</th>
                <th>Vendável</th>
                <th>Destino</th>
              </tr>
            </thead>
            <tbody>
              {allHarvests.map((harvest) => (
                <tr key={harvest.id}>
                  <td>{harvest.lotCode}</td>
                  <td>{harvest.cropName}</td>
                  <td>{formatDate(harvest.harvestedAt)}</td>
                  <td>{`${formatNumber(harvest.grossQuantity, 0)} ${harvest.unit}`}</td>
                  <td>{`${formatNumber(harvest.marketableQuantity, 0)} ${harvest.unit}`}</td>
                  <td>{harvest.destinationBreakdown.map((destination) => channels.find((entry) => entry.id === destination.channelId)?.name || destination.channelId).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </DetailCard>

      <CenterModal
        open={modalOpen}
        title={draft.id ? 'Editar colheita' : 'Nova colheita'}
        subtitle="Responda em ordem: quanto saiu do campo, quanto perdeu e para onde foi."
        onClose={closeModal}
        onHelp={() => startTour('harvest-wizard')}
        footer={
          <div className="wizard-footer">
            <span className="modal-note">A soma dos destinos precisa bater com o que ficou bom para vender.</span>
            <div className="wizard-actions">
              <button type="button" className="ghost-btn" onClick={closeModal}>Cancelar</button>
              <button type="button" className="cta-btn" onClick={saveHarvest} disabled={!draft.lotId || draft.grossQuantity <= 0 || draft.marketableQuantity <= 0 || !destinationsMatch}>
                {draft.id ? 'Salvar colheita' : 'Registrar colheita'}
              </button>
            </div>
          </div>
        }
      >
        <div className="page-stack">
          <div className="modal-form-grid">
            <label data-tour="harvest-lot">
              De qual lote veio?
              <select className="select-dark" value={draft.lotId} onChange={(event) => {
                const lot = lots.find((entry) => entry.id === event.target.value);
                const crop = crops.find((entry) => entry.id === lot?.cropId);
                setDraft((state) => ({ ...state, lotId: event.target.value, unit: lot ? resolveLotUnit(lot, crop?.salesUnit || crop?.productionUnit || state.unit) : state.unit }));
              }}>
                <option value="">Selecione</option>
                {lots.map((lot) => {
                  const crop = crops.find((entry) => entry.id === lot.cropId);
                  return <option key={lot.id} value={lot.id}>{`${lot.code} · ${crop?.name || lot.cropId}`}</option>;
                })}
              </select>
            </label>
            <label>
              Data
              <input type="date" className="input-dark" value={draft.harvestedAt} onChange={(event) => setDraft((state) => ({ ...state, harvestedAt: event.target.value }))} />
            </label>
            <label data-tour="harvest-gross">
              Quanto saiu do campo?
              <NumberField
                step="0.01"
                value={draft.grossQuantity || ''}
                onChange={(event) => {
                  const grossQuantity = Number(event.target.value || 0);
                  setDraft((state) => ({ ...state, grossQuantity, marketableQuantity: Math.max(0, grossQuantity - state.lossQuantity) }));
                }}
                suffix={formatUnitLabel(draft.unit || 'unidade')}
              />
            </label>
            <label data-tour="harvest-loss">
              Quanto se perdeu depois?
              <NumberField
                step="0.01"
                value={draft.lossQuantity || ''}
                onChange={(event) => {
                  const lossQuantity = Number(event.target.value || 0);
                  setDraft((state) => ({ ...state, lossQuantity, marketableQuantity: Math.max(0, state.grossQuantity - lossQuantity) }));
                }}
                suffix={formatUnitLabel(draft.unit || 'unidade')}
              />
            </label>
            <label data-tour="harvest-marketable">
              Quanto ficou bom para vender?
              <NumberField
                step="0.01"
                value={draft.marketableQuantity || ''}
                onChange={(event) => setDraft((state) => ({ ...state, marketableQuantity: Number(event.target.value || 0) }))}
                suffix={formatUnitLabel(draft.unit || 'unidade')}
              />
            </label>
            <label>
              Unidade
              <CreatableSelect
                value={draft.unit}
                options={inventoryUnitOptions}
                placeholder="Escolha a unidade"
                onChange={(value) => setDraft((state) => ({ ...state, unit: value }))}
                onCreate={(label) => addCatalogOption('inventory-unit', label, label)}
                createLabel="Criar unidade"
              />
            </label>
          </div>

          <DetailCard title="Para onde foi?" subtitle="A soma dos destinos precisa fechar o vendavel">
            <div className="table-lite-wrap" data-tour="harvest-destinations">
              <table className="table-lite">
              <thead>
                <tr>
                  <th>Destino</th>
                  <th>Quantidade</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => {
                  const current = draft.destinations.find((destination) => destination.channelId === channel.id) ?? {
                    channelId: channel.id,
                    quantity: 0,
                    valueCents: 0
                  };
                  return (
                    <tr key={channel.id}>
                      <td>{channel.name}</td>
                      <td>
                        <NumberField
                          step="0.01"
                          value={current.quantity || ''}
                          suffix={formatUnitLabel(draft.unit || channel.demandUnit)}
                          onChange={(event) => {
                            const quantity = Number(event.target.value || 0);
                            setDraft((state) => ({
                              ...state,
                              destinations: [
                                ...state.destinations.filter((destination) => destination.channelId !== channel.id),
                                { ...current, quantity }
                              ]
                            }));
                          }}
                        />
                      </td>
                      <td>
                        <MoneyField
                          valueCents={current.valueCents}
                          ariaLabel={`Valor lançado para ${channel.name}`}
                          onChange={(event) => {
                            const valueCents = event;
                            setDraft((state) => ({
                              ...state,
                              destinations: [
                                ...state.destinations.filter((destination) => destination.channelId !== channel.id),
                                { ...current, valueCents }
                              ]
                            }));
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StatusChip label={`Vendavel: ${formatNumber(draft.marketableQuantity, 2)} ${formatUnitLabel(draft.unit || 'unidade')}`} tone="low" />
              <StatusChip label={`Destinos: ${formatNumber(destinationTotal, 2)} ${formatUnitLabel(draft.unit || 'unidade')}`} tone={destinationsMatch ? 'low' : 'high'} />
              {!destinationsMatch && <StatusChip label="Os destinos ainda nao fecham o vendavel" tone="high" />}
            </div>
          </DetailCard>

          {activeLot && (
            <DetailCard title="Lote escolhido" subtitle="Contexto rapido">
              <div className="executive-grid">
                <ExecutiveCard title="Lote" value={activeLot.code} tone="neutral" />
                <ExecutiveCard title="Cultura" value={crops.find((entry) => entry.id === activeLot.cropId)?.name || activeLot.cropId} tone="info" />
                <ExecutiveCard title="Local" value={activeLot.location} tone="warning" />
                <ExecutiveCard title="Valor ja lancado" value={formatCurrency(activeLot.appropriatedCostCents)} tone="positive" />
              </div>
            </DetailCard>
          )}
        </div>
      </CenterModal>
    </div>
  );
};
