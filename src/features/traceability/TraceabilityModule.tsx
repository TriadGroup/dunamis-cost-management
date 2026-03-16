import { useMemo, useState } from 'react';
import { useOnboardingStore, useOptionCatalogStore, useProductionPlanningStore, useTraceabilityStore, useUiPreferencesStore } from '@/app/store';
import { calculateTraceabilityCompleteness, findLotByCode } from '@/entities';
import { formatDate, formatUnitLabel } from '@/shared/lib/format';
import { CreatableSelect, DetailCard, ExecutiveCard, NumberField, SearchBar, SmartEmptyState, StatusChip, TimelineList, WizardModal } from '@/shared/ui';

const lotStepIds = ['dados', 'origem', 'plantio', 'revisao'] as const;

export const TraceabilityModule = () => {
  const lots = useTraceabilityStore((state) => state.lots);
  const draft = useTraceabilityStore((state) => state.draft);
  const setDraft = useTraceabilityStore((state) => state.setDraft);
  const clearDraft = useTraceabilityStore((state) => state.clearDraft);
  const addLotFromDraft = useTraceabilityStore((state) => state.addLotFromDraft);
  const updateLot = useTraceabilityStore((state) => state.updateLot);
  const crops = useProductionPlanningStore((state) => state.crops);
  const setActiveRoute = useUiPreferencesStore((state) => state.setActiveRoute);
  const originOptions = useOptionCatalogStore((state) => state.getOptions('traceability-origin'));
  const locationOptions = useOptionCatalogStore((state) => state.getOptions('traceability-location'));
  const addCatalogOption = useOptionCatalogStore((state) => state.addOption);
  const startTour = useOnboardingStore((state) => state.startTour);

  const [query, setQuery] = useState('');
  const [activeLotId, setActiveLotId] = useState<string | null>(lots[0]?.id ?? null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStepIndex, setWizardStepIndex] = useState(0);
  const [wizardError, setWizardError] = useState('');

  const searchedLot = useMemo(() => findLotByCode(lots, query), [lots, query]);
  const activeLot = lots.find((entry) => entry.id === activeLotId) ?? searchedLot ?? null;
  const activeWizardStepId = lotStepIds[wizardStepIndex];
  const activeDraftCrop = crops.find((crop) => crop.id === draft.cropId) ?? null;
  const draftUnitLabel = formatUnitLabel(activeDraftCrop?.productionUnit || 'unidade');

  const summary = useMemo(() => {
    const completions = lots.map((entry) => calculateTraceabilityCompleteness(entry).score);
    const avg = completions.length ? Math.round(completions.reduce((acc, value) => acc + value, 0) / completions.length) : 0;
    return {
      total: lots.length,
      complete: lots.filter((entry) => calculateTraceabilityCompleteness(entry).status === 'completa').length,
      avg
    };
  }, [lots]);

  const openWizard = () => {
    clearDraft();
    setWizardStepIndex(0);
    setWizardError('');
    setWizardOpen(true);
  };

  const validateStep = (stepId: (typeof lotStepIds)[number]): string | null => {
    if (stepId === 'dados' && !draft.cropId) return 'Escolha a cultura do lote.';
    if (stepId === 'origem' && !draft.receivedAt) return 'Informe a data de chegada.';
    if (stepId === 'plantio' && !draft.location.trim()) return 'Informe onde o lote foi plantado.';
    return null;
  };

  const goToNextStep = () => {
    const error = validateStep(lotStepIds[wizardStepIndex]);
    if (error) {
      setWizardError(error);
      return;
    }
    setWizardError('');
    setWizardStepIndex((index) => Math.min(index + 1, lotStepIds.length - 1));
  };

  const goToPreviousStep = () => {
    setWizardError('');
    setWizardStepIndex((index) => Math.max(index - 1, 0));
  };

  const createLot = () => {
    const error = validateStep('plantio');
    if (error) {
      setWizardError(error);
      return;
    }

    if (draft.origin.trim()) addCatalogOption('traceability-origin', draft.origin, draft.origin);
    if (draft.location.trim()) addCatalogOption('traceability-location', draft.location, draft.location);
    addLotFromDraft();
    setWizardOpen(false);
    setWizardStepIndex(0);
    setWizardError('');
    setActiveLotId(null);
  };

  const steps = [
    {
      id: 'dados',
      title: 'Dados do lote',
      content: (
        <div className="section-grid-2">
          <label data-tour="lot-crop">
            Cultura
            <select className="select-dark" value={draft.cropId} onChange={(event) => setDraft({ cropId: event.target.value })}>
              <option value="">Selecione</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))}
            </select>
          </label>
          <label data-tour="lot-variety">
            Variedade
            <input className="input-dark" value={draft.variety} onChange={(event) => setDraft({ variety: event.target.value })} />
          </label>
        </div>
      )
    },
    {
      id: 'origem',
      title: 'Origem',
      content: (
        <div className="section-grid-2">
          <label data-tour="lot-origin">
            Origem da muda ou semente
            <CreatableSelect
              value={draft.origin}
              options={originOptions}
              placeholder="Escolha a origem"
              onChange={(value) => setDraft({ origin: value })}
              onCreate={(label) => addCatalogOption('traceability-origin', label, label)}
              createLabel="Criar origem"
            />
          </label>
          <label data-tour="lot-received-date">
            Data de chegada
            <input type="date" className="input-dark" value={draft.receivedAt} onChange={(event) => setDraft({ receivedAt: event.target.value })} />
          </label>
        </div>
      )
    },
    {
      id: 'plantio',
      title: 'Plantio',
      content: (
        <div className="section-grid-2">
          <label data-tour="lot-quantity-received">
            Quantidade recebida
            <NumberField value={draft.quantityReceived} onChange={(event) => setDraft({ quantityReceived: Number(event.target.value || 0) })} suffix={draftUnitLabel} />
          </label>
          <label data-tour="lot-quantity-planted">
            Quantidade plantada
            <NumberField value={draft.quantityPlanted} onChange={(event) => setDraft({ quantityPlanted: Number(event.target.value || 0) })} suffix={draftUnitLabel} />
          </label>
          <label className="span-2" data-tour="lot-location">
            Localização
            <CreatableSelect
              value={draft.location}
              options={locationOptions}
              placeholder="Escolha o local"
              onChange={(value) => setDraft({ location: value })}
              onCreate={(label) => addCatalogOption('traceability-location', label, label)}
              createLabel="Criar local"
            />
          </label>
          <label className="span-2">
            Observações
            <textarea className="textarea-dark" value={draft.notes} onChange={(event) => setDraft({ notes: event.target.value })} />
          </label>
        </div>
      )
    },
    {
      id: 'revisao',
      title: 'Revisão',
      content: (
        <div className="executive-grid">
          <ExecutiveCard title="Cultura" value={crops.find((crop) => crop.id === draft.cropId)?.name || 'Sem cultura'} tone="info" />
          <ExecutiveCard title="Recebidas" value={`${draft.quantityReceived || 0} ${draftUnitLabel}`} tone="neutral" />
          <ExecutiveCard title="Plantadas" value={`${draft.quantityPlanted || 0} ${draftUnitLabel}`} tone="warning" />
          <ExecutiveCard title="Local" value={draft.location || 'Sem local'} tone="positive" />
        </div>
      )
    }
  ];

  const timelineItems = [
    ...(activeLot?.applicationEvents?.map((entry) => ({
      id: entry.id,
      title: `Aplicação: ${entry.quantityApplied} ${entry.unit}`,
      subtitle: `${formatDate(entry.appliedAt)} · fase ${entry.cropStage} · ${entry.responsible || 'Sem nome'}`,
      tone: 'info' as const
    })) ?? []),
    ...(activeLot?.applicationLogs.map((entry) => ({
      id: entry.id,
      title: `Aplicação: ${entry.productName}`,
      subtitle: `${formatDate(entry.appliedAt)} · ${entry.quantity} ${entry.unit} · ${entry.responsible}`,
      tone: 'info' as const
    })) ?? [])
  ];

  const harvestTimeline =
    activeLot?.harvests.map((entry) => ({
      id: entry.id,
      title: `Colheita ${entry.grossQuantity} ${entry.unit}`,
      subtitle: `${formatDate(entry.harvestedAt)} · vendável ${entry.marketableQuantity} ${entry.unit}`,
      tone: 'positive' as const
    })) ?? [];

  if (crops.length === 0) {
    return (
      <div className="page-stack">
        <DetailCard title="Rastreabilidade por lote" subtitle="Comece pela base">
          <SmartEmptyState
            title="Nenhuma cultura pronta para rastrear"
            description="Crie a primeira cultura antes de abrir lotes e histórico."
            action={
              <button type="button" className="cta-btn" onClick={() => setActiveRoute('production-planning')}>
                Criar primeira cultura
              </button>
            }
          />
        </DetailCard>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <DetailCard
        title="Rastreabilidade por lote"
        subtitle="Busque e acompanhe"
        action={lots.length > 0 ? (
          <button type="button" className="cta-btn" onClick={openWizard} data-tour="new-lot-btn">
            Novo lote
          </button>
        ) : undefined}
      >
        <div className="executive-grid">
          <ExecutiveCard title="Lotes cadastrados" value={String(summary.total)} helper="RG da produção" tone="info" />
          <ExecutiveCard title="Lotes completos" value={String(summary.complete)} helper="Rastreabilidade 100%" tone="positive" />
          <ExecutiveCard
            title="Completude média"
            value={`${summary.avg}%`}
            helper="Qualidade dos dados de lote"
            tone={summary.avg >= 85 ? 'positive' : summary.avg >= 55 ? 'warning' : 'danger'}
          />
        </div>
      </DetailCard>

      <DetailCard title="Busca" subtitle="Código do lote">
        <SearchBar value={query} onChange={setQuery} placeholder="Digite o código do lote" />
        {query && !searchedLot && (
          <SmartEmptyState
            title="Lote não encontrado"
            description="Confira o código ou cadastre um novo lote."
            action={
              <button type="button" className="cta-btn" onClick={openWizard} data-tour="new-lot-btn">
                Cadastrar novo lote
              </button>
            }
          />
        )}
      </DetailCard>

      <DetailCard title="Histórico" subtitle="Origem e destino">
        {!activeLot ? (
          <SmartEmptyState
            title={lots.length === 0 ? 'Nenhum lote cadastrado ainda' : 'Escolha um lote'}
            description={
              lots.length === 0
                ? 'Comece pelo primeiro lote. Depois o histórico passa a se organizar sozinho.'
                : 'Use a busca acima ou clique em um lote da lista para abrir o histórico.'
            }
            action={
              <button type="button" className="cta-btn" onClick={openWizard} data-tour="new-lot-btn">
                {lots.length === 0 ? 'Criar primeiro lote' : 'Cadastrar novo lote'}
              </button>
            }
          />
        ) : (
          <>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <StatusChip label={activeLot.code} tone="neutral" />
              <StatusChip label={`${activeLot.marketableQuantity || 0} ${formatUnitLabel(crops.find((crop) => crop.id === activeLot.cropId)?.salesUnit || 'unidade')} vendáveis`} tone="low" />
              <StatusChip label={activeLot.appropriatedCostCents > 0 ? 'Com valor real' : 'Só previsto'} tone={activeLot.appropriatedCostCents > 0 ? 'low' : 'medium'} />
              {(() => {
                const completeness = calculateTraceabilityCompleteness(activeLot);
                return (
                  <StatusChip
                    label={`${completeness.status} · ${completeness.score}%`}
                    tone={completeness.status === 'completa' ? 'low' : completeness.status === 'parcial' ? 'medium' : 'high'}
                  />
                );
              })()}
            </div>

            <div className="section-grid-2">
              <label>
                Localização
                <CreatableSelect
                  value={activeLot.location}
                  options={locationOptions}
                  placeholder="Escolha o local"
                  onChange={(value) => {
                    addCatalogOption('traceability-location', value, value);
                    updateLot(activeLot.id, { location: value });
                  }}
                  onCreate={(label) => addCatalogOption('traceability-location', label, label)}
                  createLabel="Criar local"
                />
              </label>
              <label>
                Origem
                <CreatableSelect
                  value={activeLot.origin}
                  options={originOptions}
                  placeholder="Escolha a origem"
                  onChange={(value) => {
                    addCatalogOption('traceability-origin', value, value);
                    updateLot(activeLot.id, { origin: value });
                  }}
                  onCreate={(label) => addCatalogOption('traceability-origin', label, label)}
                  createLabel="Criar origem"
                />
              </label>
            </div>

            <DetailCard title="Aplicações" subtitle="Linha do tempo">
              <TimelineList items={timelineItems} emptyText="Sem aplicações registradas." />
            </DetailCard>

            <DetailCard title="Colheitas" subtitle="Linha do tempo">
              <TimelineList items={harvestTimeline} emptyText="Sem colheitas registradas." />
            </DetailCard>
          </>
        )}
      </DetailCard>

      <DetailCard title="Lotes" subtitle="Lista rápida">
        {lots.length === 0 ? (
          <SmartEmptyState
            title="Nenhum lote cadastrado"
            description="Adicione o primeiro lote para começar o histórico de plantio, aplicação e colheita."
            action={
              <button type="button" className="cta-btn" onClick={openWizard} data-tour="new-lot-btn">
                Adicionar primeiro lote
              </button>
            }
          />
        ) : (
          <div className="table-lite-wrap">
            <table className="table-lite">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cultura</th>
                <th>Recebido em</th>
                <th>Localização</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <tr key={lot.id} style={{ cursor: 'pointer' }} onClick={() => setActiveLotId(lot.id)}>
                  <td>{lot.code}</td>
                  <td>{crops.find((crop) => crop.id === lot.cropId)?.name || lot.cropId}</td>
                  <td>{formatDate(lot.receivedAt)}</td>
                  <td>{lot.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </DetailCard>

      <WizardModal
        open={wizardOpen}
        title="Novo lote"
        subtitle="Preencha o essencial. O histórico cresce depois."
        steps={steps}
        activeStepId={activeWizardStepId}
        onStepChange={(stepId) => setWizardStepIndex(lotStepIds.indexOf(stepId as (typeof lotStepIds)[number]))}
        onClose={() => setWizardOpen(false)}
        onBack={goToPreviousStep}
        onNext={goToNextStep}
        onSubmit={createLot}
        onSaveDraft={() => setWizardOpen(false)}
        backDisabled={wizardStepIndex === 0}
        submitLabel="Criar lote"
        error={wizardError}
        onHelp={() => startTour('lot-wizard')}
      />
    </div>
  );
};
