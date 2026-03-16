import { useMemo, useState } from 'react';
import { useCostAllocationStore, useFieldOperationsStore, useInventoryStore, useOnboardingStore, useOptionCatalogStore, useProductionPlanningStore, useTraceabilityStore } from '@/app/store';
import type { ApplicationEvent, CropStage } from '@/entities';
import { fieldUnitMeta, formatCurrency, formatDate, formatNumber, formatUnitLabel } from '@/shared/lib/format';
import { CenterModal, ContextHelp, CreatableSelect, DetailCard, ExecutiveCard, NumberField, SearchBar, SmartEmptyState, StatusChip } from '@/shared/ui';

const cropStageOptions: Array<{ value: CropStage; label: string }> = [
  { value: 'viveiro', label: 'Viveiro' },
  { value: 'transplante', label: 'Transplante' },
  { value: 'pegamento', label: 'Pegamento' },
  { value: 'vegetativo', label: 'Vegetativo' },
  { value: 'reprodutivo', label: 'Reprodutivo' },
  { value: 'colheita', label: 'Colheita' },
  { value: 'pos_colheita', label: 'Pós-colheita' },
  { value: 'manutencao', label: 'Manutenção' }
];

const buildDraft = (application?: ApplicationEvent) => ({
  id: application?.id ?? null,
  stockMovementId: application?.stockMovementId ?? null,
  inventoryLotId: application?.inventoryLotId ?? '',
  cropId: application?.cropId ?? '',
  cropPlanId: application?.cropPlanId ?? '',
  productionLotId: application?.productionLotId ?? '',
  areaNodeId: application?.areaNodeIds[0] ?? '',
  cropStage: application?.cropStage ?? ('vegetativo' as CropStage),
  quantityApplied: application?.quantityApplied ?? 0,
  appliedAreaSqm: application?.appliedAreaSqm ?? 0,
  doseDescription: application?.doseDescription ?? '',
  appliedAt: application?.appliedAt ?? new Date().toISOString().slice(0, 10),
  responsible: application?.responsible ?? '',
  equipmentName: application?.equipmentName ?? '',
  weatherNotes: application?.weatherNotes ?? '',
  notes: application?.notes ?? ''
});

export const FieldOperationsModule = () => {
  const applications = useFieldOperationsStore((state) => state.applications);
  const addApplication = useFieldOperationsStore((state) => state.addApplication);
  const updateApplication = useFieldOperationsStore((state) => state.updateApplication);
  const removeApplication = useFieldOperationsStore((state) => state.removeApplication);
  const lots = useInventoryStore((state) => state.lots);
  const products = useInventoryStore((state) => state.products);
  const addMovement = useInventoryStore((state) => state.addMovement);
  const removeMovement = useInventoryStore((state) => state.removeMovement);
  const crops = useProductionPlanningStore((state) => state.crops);
  const plans = useProductionPlanningStore((state) => state.plans);
  const beds = useProductionPlanningStore((state) => state.beds);
  const fieldLots = useTraceabilityStore((state) => state.lots);
  const updateLot = useTraceabilityStore((state) => state.updateLot);
  const rebuildFromFacts = useCostAllocationStore((state) => state.rebuildFromFacts);
  const responsibleOptions = useOptionCatalogStore((state) => state.getOptions('responsible'));
  const equipmentOptions = useOptionCatalogStore((state) => state.getOptions('equipment'));
  const addCatalogOption = useOptionCatalogStore((state) => state.addOption);
  const startTour = useOnboardingStore((state) => state.startTour);

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(buildDraft());

  const visibleApplications = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((application) => {
      const stockLot = lots.find((lot) => lot.id === application.inventoryLotId);
      const product = products.find((entry) => entry.id === application.productId || entry.id === stockLot?.productId);
      const crop = crops.find((entry) => entry.id === application.cropId);
      return [product?.name, crop?.name, application.responsible, application.equipmentName, application.notes]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [applications, crops, lots, products, query]);

  const summary = useMemo(() => {
    const appliedValue = applications.reduce((acc, application) => {
      const stockLot = lots.find((lot) => lot.id === application.inventoryLotId);
      return acc + Math.round((stockLot?.unitCostCents ?? 0) * application.quantityApplied);
    }, 0);

    return {
      total: applications.length,
      activeLots: new Set(applications.map((entry) => entry.productionLotId).filter(Boolean)).size,
      appliedValue,
      today: applications.filter((entry) => entry.appliedAt === new Date().toISOString().slice(0, 10)).length
    };
  }, [applications, lots]);

  const selectedStockLot = lots.find((lot) => lot.id === draft.inventoryLotId) ?? null;
  const existingApplication = applications.find((application) => application.id === draft.id) ?? null;
  const selectedProduct = products.find((entry) => entry.id === selectedStockLot?.productId) ?? null;
  const availablePlans = plans.filter((plan) => !draft.cropId || plan.cropId === draft.cropId);
  const availableFieldLots = fieldLots.filter((lot) => (!draft.cropId || lot.cropId === draft.cropId) && (!draft.cropPlanId || lot.cropPlanId === draft.cropPlanId));

  const detachFromAllLots = (applicationId: string) => {
    fieldLots.forEach((lot) => {
      if (!lot.applicationEvents?.some((entry) => entry.id === applicationId)) return;
      updateLot(lot.id, { applicationEvents: lot.applicationEvents.filter((entry) => entry.id !== applicationId) });
    });
  };

  const attachToProductionLot = (application: ApplicationEvent) => {
    if (!application.productionLotId) return;
    const lot = fieldLots.find((entry) => entry.id === application.productionLotId);
    if (!lot) return;
    const current = lot.applicationEvents ?? [];
    updateLot(lot.id, {
      applicationEvents: [...current.filter((entry) => entry.id !== application.id), application],
      stage: application.cropStage
    });
  };

  const openCreateModal = () => {
    setDraft(buildDraft());
    setModalOpen(true);
  };

  const openEditModal = (application: ApplicationEvent) => {
    setDraft(buildDraft(application));
    setModalOpen(true);
  };

  const closeModal = () => {
    setDraft(buildDraft());
    setModalOpen(false);
  };

  const saveApplication = () => {
    if (!draft.inventoryLotId || !draft.cropId || !draft.areaNodeId || draft.quantityApplied <= 0 || !selectedStockLot) return;
    const maxAvailable =
      selectedStockLot.quantityAvailable +
      (existingApplication && existingApplication.inventoryLotId === draft.inventoryLotId ? existingApplication.quantityApplied : 0);
    if (draft.quantityApplied > maxAvailable) return;

    if (draft.responsible.trim()) addCatalogOption('responsible', draft.responsible, draft.responsible);
    if (draft.equipmentName.trim()) addCatalogOption('equipment', draft.equipmentName, draft.equipmentName);

    if (draft.id && draft.stockMovementId) {
      removeMovement(draft.stockMovementId);
    }

    const movementId = addMovement({
      inventoryLotId: draft.inventoryLotId,
      movementType: 'aplicacao',
      quantity: draft.quantityApplied,
      unit: selectedStockLot.unit,
      occurredAt: draft.appliedAt,
      targetType: draft.productionLotId ? 'lote' : draft.cropPlanId ? 'plano' : draft.cropId ? 'cultura' : 'area',
      targetId: draft.productionLotId || draft.cropPlanId || draft.cropId || draft.areaNodeId,
      reason: draft.doseDescription || 'Aplicação registrada',
      notes: draft.notes
    });

    const payload: Partial<ApplicationEvent> = {
      stockMovementId: movementId,
      inventoryLotId: draft.inventoryLotId,
      productId: selectedStockLot.productId,
      cropId: draft.cropId || null,
      cropPlanId: draft.cropPlanId || null,
      productionLotId: draft.productionLotId || null,
      areaNodeIds: draft.areaNodeId ? [draft.areaNodeId] : [],
      cropStage: draft.cropStage,
      quantityApplied: draft.quantityApplied,
      unit: selectedStockLot.unit,
      appliedAreaSqm: draft.appliedAreaSqm,
      doseDescription: draft.doseDescription,
      appliedAt: draft.appliedAt,
      responsible: draft.responsible,
      equipmentName: draft.equipmentName,
      weatherNotes: draft.weatherNotes,
      notes: draft.notes
    };

    const applicationId = draft.id ?? addApplication(payload);
    if (draft.id) {
      updateApplication(draft.id, payload);
    }

    const savedApplication: ApplicationEvent = {
      id: applicationId,
      stockMovementId: movementId,
      inventoryLotId: payload.inventoryLotId!,
      productId: payload.productId!,
      cropId: payload.cropId ?? null,
      cropPlanId: payload.cropPlanId ?? null,
      productionLotId: payload.productionLotId ?? null,
      areaNodeIds: payload.areaNodeIds ?? [],
      cropStage: payload.cropStage!,
      quantityApplied: payload.quantityApplied!,
      unit: payload.unit!,
      appliedAreaSqm: payload.appliedAreaSqm!,
      doseDescription: payload.doseDescription!,
      appliedAt: payload.appliedAt!,
      responsible: payload.responsible!,
      equipmentName: payload.equipmentName!,
      weatherNotes: payload.weatherNotes!,
      notes: payload.notes!
    };

    detachFromAllLots(applicationId);
    attachToProductionLot(savedApplication);
    rebuildFromFacts();
    closeModal();
  };

  const deleteApplication = (application: ApplicationEvent) => {
    if (application.stockMovementId) removeMovement(application.stockMovementId);
    detachFromAllLots(application.id);
    removeApplication(application.id);
    rebuildFromFacts();
  };

  return (
    <div className="page-stack">
      <DetailCard
        eyebrow="Aplicações"
        title="O que voce aplicou no campo?"
        subtitle="Aqui voce diz o que saiu do estoque, em qual cultura entrou e onde foi aplicado."
        action={applications.length > 0 ? <button type="button" className="cta-btn" onClick={openCreateModal} data-tour="new-operation-btn">Nova aplicação</button> : undefined}
      >
        <div className="executive-grid">
          <ExecutiveCard title="Aplicacoes lancadas" value={String(summary.total)} helper="Fatos do campo" tone="info" />
          <ExecutiveCard title="Lotes atendidos" value={String(summary.activeLots)} helper="Lotes da producao" tone="neutral" />
          <ExecutiveCard title="Valor ja lancado" value={formatCurrency(summary.appliedValue)} helper="Saiu do estoque e entrou na cultura" tone="warning" />
          <ExecutiveCard title="Hoje" value={String(summary.today)} helper="Aplicações do dia" tone="positive" />
        </div>
      </DetailCard>

      <DetailCard title="Aplicacoes registradas" subtitle="Produto, area, fase e responsavel em um so lugar">
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar por produto, cultura, responsável ou observação" />
        {visibleApplications.length === 0 ? (
          <SmartEmptyState
            title="Nenhuma aplicação lançada"
            description="Registre a primeira aplicacao para baixar o estoque e jogar o valor na cultura certa."
            action={<button type="button" className="cta-btn" onClick={openCreateModal} data-tour="new-operation-btn">Registrar primeira aplicação</button>}
          />
        ) : (
          <div className="table-lite-wrap">
            <table className="table-lite">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Quanto</th>
                <th>Cultura</th>
                <th>Fase <ContextHelp text="É o momento da cultura quando a aplicação aconteceu." /></th>
                <th>Área</th>
                <th>Data</th>
                <th>Quem aplicou</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {visibleApplications.map((application) => {
                const stockLot = lots.find((lot) => lot.id === application.inventoryLotId);
                const product = products.find((entry) => entry.id === application.productId || entry.id === stockLot?.productId);
                const crop = crops.find((entry) => entry.id === application.cropId);
                const area = beds.find((entry) => entry.id === application.areaNodeIds[0]);
                return (
                  <tr key={application.id}>
                    <td>{product?.name || stockLot?.code || 'Produto'}</td>
                    <td>{`${formatNumber(application.quantityApplied, 2)} ${application.unit}`}</td>
                    <td>{crop?.name || 'Sem cultura'}</td>
                    <td><StatusChip label={cropStageOptions.find((entry) => entry.value === application.cropStage)?.label || application.cropStage} tone="medium" /></td>
                    <td>{area?.name || application.areaNodeIds[0] || 'Sem área'}</td>
                    <td>{formatDate(application.appliedAt)}</td>
                    <td>{application.responsible || 'Sem nome'}</td>
                    <td>
                      <div className="action-row" style={{ gap: 8 }}>
                        <button type="button" className="ghost-btn" onClick={() => openEditModal(application)}>Editar</button>
                        <button type="button" className="ghost-btn" onClick={() => deleteApplication(application)}>Remover</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </DetailCard>

      <CenterModal
        open={modalOpen}
        title={draft.id ? 'Editar aplicação' : 'Nova aplicação'}
        subtitle="Responda o basico: o que usou, quanto usou, onde foi e em qual cultura."
        onClose={closeModal}
        onHelp={() => startTour('operation-wizard')}
        footer={
          <div className="wizard-footer">
            <span className="modal-note">A aplicacao baixa o lote do estoque e joga o valor na cultura.</span>
            <div className="wizard-actions">
              <button type="button" className="ghost-btn" onClick={closeModal}>Cancelar</button>
              <button type="button" className="cta-btn" onClick={saveApplication} disabled={!draft.inventoryLotId || !draft.cropId || !draft.areaNodeId || draft.quantityApplied <= 0}>
                {draft.id ? 'Salvar aplicação' : 'Registrar aplicação'}
              </button>
            </div>
          </div>
        }
      >
        <div className="modal-form-grid">
          <label data-tour="operation-stock-lot">
            De qual lote do estoque saiu?
            <select className="select-dark" value={draft.inventoryLotId} onChange={(event) => setDraft((state) => ({ ...state, inventoryLotId: event.target.value }))}>
              <option value="">Selecione</option>
              {lots.filter((lot) => lot.quantityAvailable > 0 || lot.id === draft.inventoryLotId).map((lot) => {
                const product = products.find((entry) => entry.id === lot.productId);
                return <option key={lot.id} value={lot.id}>{`${product?.name || 'Produto'} · ${lot.code} · ${formatNumber(lot.quantityAvailable, 2)} ${lot.unit}`}</option>;
              })}
            </select>
          </label>
          <label>
            Produto
            <input className="input-dark" value={selectedProduct?.name || ''} disabled readOnly />
          </label>
          <label data-tour="operation-quantity">
            Quanto voce usou?
            <NumberField
              step="0.01"
              value={draft.quantityApplied || ''}
              onChange={(event) => setDraft((state) => ({ ...state, quantityApplied: Number(event.target.value || 0) }))}
              suffix={formatUnitLabel(selectedStockLot?.unit || 'unidade')}
            />
          </label>
          <label data-tour="operation-area">
            Quanto de area pegou?
            <NumberField
              step="0.01"
              value={draft.appliedAreaSqm || ''}
              onChange={(event) => setDraft((state) => ({ ...state, appliedAreaSqm: Number(event.target.value || 0) }))}
              suffix={fieldUnitMeta.area}
            />
          </label>
          <label data-tour="operation-crop">
            Em qual cultura?
            <select className="select-dark" value={draft.cropId} onChange={(event) => setDraft((state) => ({ ...state, cropId: event.target.value, cropPlanId: '', productionLotId: '' }))}>
              <option value="">Selecione</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>{crop.name}</option>
              ))}
            </select>
          </label>
          <label data-tour="operation-plan">
            Em qual plano?
            <select className="select-dark" value={draft.cropPlanId} onChange={(event) => setDraft((state) => ({ ...state, cropPlanId: event.target.value, productionLotId: '' }))}>
              <option value="">Sem plano</option>
              {availablePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>{`${crops.find((crop) => crop.id === plan.cropId)?.name || 'Plano'} · ${plan.bedCount} canteiro(s)`}</option>
              ))}
            </select>
          </label>
          <label data-tour="operation-lot">
            Em qual lote?
            <select className="select-dark" value={draft.productionLotId} onChange={(event) => setDraft((state) => ({ ...state, productionLotId: event.target.value }))}>
              <option value="">Sem lote</option>
              {availableFieldLots.map((lot) => (
                <option key={lot.id} value={lot.id}>{lot.code}</option>
              ))}
            </select>
          </label>
          <label data-tour="operation-bed">
            Onde aplicou?
            <select className="select-dark" value={draft.areaNodeId} onChange={(event) => setDraft((state) => ({ ...state, areaNodeId: event.target.value }))}>
              <option value="">Selecione</option>
              {beds.map((bed) => (
                <option key={bed.id} value={bed.id}>{bed.name}</option>
              ))}
            </select>
          </label>
          <label data-tour="operation-stage">
            Em que fase estava?
            <select className="select-dark" value={draft.cropStage} onChange={(event) => setDraft((state) => ({ ...state, cropStage: event.target.value as CropStage }))}>
              {cropStageOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Quando aplicou?
            <input type="date" className="input-dark" value={draft.appliedAt} onChange={(event) => setDraft((state) => ({ ...state, appliedAt: event.target.value }))} />
          </label>
          <label data-tour="operation-responsible">
            Quem fez?
            <CreatableSelect
              value={draft.responsible}
              options={responsibleOptions}
              placeholder="Escolha quem fez"
              onChange={(value) => setDraft((state) => ({ ...state, responsible: value }))}
              onCreate={(label) => addCatalogOption('responsible', label, label)}
              createLabel="Criar responsável"
            />
          </label>
          <label>
            Com o que aplicou?
            <CreatableSelect
              value={draft.equipmentName}
              options={equipmentOptions}
              placeholder="Escolha o equipamento"
              onChange={(value) => setDraft((state) => ({ ...state, equipmentName: value }))}
              onCreate={(label) => addCatalogOption('equipment', label, label)}
              createLabel="Criar equipamento"
            />
          </label>
          <label className="span-2">
            Como foi usado?
            <input className="input-dark" value={draft.doseDescription} onChange={(event) => setDraft((state) => ({ ...state, doseDescription: event.target.value }))} placeholder="Ex.: 150 mL em 20 L de agua" />
          </label>
          <label>
            Como estava o clima?
            <input className="input-dark" value={draft.weatherNotes} onChange={(event) => setDraft((state) => ({ ...state, weatherNotes: event.target.value }))} />
          </label>
          <label className="span-2">
            Algo importante sobre essa aplicacao?
            <textarea className="textarea-dark" value={draft.notes} onChange={(event) => setDraft((state) => ({ ...state, notes: event.target.value }))} />
          </label>
        </div>
      </CenterModal>
    </div>
  );
};
