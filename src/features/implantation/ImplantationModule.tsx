import { useEffect, useMemo, useState } from 'react';
import { implantationStoreDefaults, useImplantationStore, useOnboardingStore } from '@/app/store';
import {
  calculateImplantationTotals,
  calculateQuotationCommercialTotalCents,
  calculateQuotationPaymentGapCents,
  calculateQuotationPaymentPlanTotalCents,
  groupImplantationByProject,
  implantationGroupLabel,
  type ImplantationItem,
  type ImplantationProject,
  type PaymentMode,
  type Quotation
} from '@/entities';
import { formatCompactCurrency, formatCurrency, formatDate, fromCents, toCents } from '@/shared/lib/format';
import { CenterModal, DetailCard, ExecutiveCard, SearchBar, SmartEmptyState, StatusChip, UiIcon, WizardModal } from '@/shared/ui';

const implantationStepIds = ['projeto', 'item', 'pagamento', 'revisao'] as const;

const groupOptions: Array<{ value: ImplantationItem['group']; label: string }> = [
  { value: 'solo', label: 'Solo e fertilidade' },
  { value: 'cobertura', label: 'Cobertura e sombrite' },
  { value: 'hidraulica', label: 'Parte hidráulica' },
  { value: 'eletrica', label: 'Parte elétrica' },
  { value: 'maquinario', label: 'Maquinário' },
  { value: 'estrutura', label: 'Estrutura física' },
  { value: 'servicos', label: 'Serviços' }
];

const priorityOptions: Array<{ value: ImplantationItem['priority']; label: string }> = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' }
];

const projectStatusOptions: Array<{ value: ImplantationProject['status']; label: string }> = [
  { value: 'planejamento', label: 'Planejamento' },
  { value: 'em_execucao', label: 'Em execução' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'concluido', label: 'Concluído' }
];

const itemStatusOptions: Array<{ value: ImplantationItem['status']; label: string }> = [
  { value: 'em_cotacao', label: 'Em cotação' },
  { value: 'negociando', label: 'Negociando' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'pago_parcial', label: 'Pago parcial' },
  { value: 'pago', label: 'Pago' }
];

const paymentModeOptions: Array<{ value: PaymentMode; label: string }> = [
  { value: 'avista', label: 'À vista' },
  { value: 'parcelado', label: 'Parcelado' },
  { value: 'financiado', label: 'Financiado' }
];

const quotationStatusOptions: Array<{ value: Quotation['status']; label: string }> = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'recebida', label: 'Recebida' },
  { value: 'selecionada', label: 'Selecionada' },
  { value: 'descartada', label: 'Descartada' }
];

const statusLabel = (value: string) => value.replace(/_/g, ' ');

const itemStatusTone = (status: ImplantationItem['status']) => {
  if (status === 'em_cotacao') return 'danger';
  if (status === 'negociando') return 'warning';
  return 'positive';
};

const quotationStatusTone = (status: Quotation['status']) => {
  if (status === 'pendente' || status === 'descartada') return 'danger';
  if (status === 'selecionada') return 'positive';
  return 'neutral';
};

const projectStatusTone = (status: ImplantationProject['status']) => {
  if (status === 'pausado') return 'danger';
  if (status === 'em_execucao') return 'warning';
  if (status === 'concluido') return 'positive';
  return 'neutral';
};

const createQuotationForm = (paymentMode: PaymentMode = 'avista') => implantationStoreDefaults.defaultQuotationDraft(paymentMode);

export const ImplantationModule = () => {
  const projects = useImplantationStore((state) => state.projects);
  const items = useImplantationStore((state) => state.items);
  const projectDraft = useImplantationStore((state) => state.projectDraft);
  const draft = useImplantationStore((state) => state.draft);
  const setProjectDraft = useImplantationStore((state) => state.setProjectDraft);
  const clearProjectDraft = useImplantationStore((state) => state.clearProjectDraft);
  const addProjectFromDraft = useImplantationStore((state) => state.addProjectFromDraft);
  const updateProject = useImplantationStore((state) => state.updateProject);
  const setDraft = useImplantationStore((state) => state.setDraft);
  const clearDraft = useImplantationStore((state) => state.clearDraft);
  const addFromDraft = useImplantationStore((state) => state.addFromDraft);
  const updateItem = useImplantationStore((state) => state.updateItem);
  const addQuotation = useImplantationStore((state) => state.addQuotation);
  const updateQuotation = useImplantationStore((state) => state.updateQuotation);
  const removeQuotation = useImplantationStore((state) => state.removeQuotation);
  const selectQuotation = useImplantationStore((state) => state.selectQuotation);
  const startTour = useOnboardingStore((state) => state.startTour);

  const [query, setQuery] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectError, setProjectError] = useState('');
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [wizardError, setWizardError] = useState('');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [quotationModalOpen, setQuotationModalOpen] = useState(false);
  const [quotationModalItemId, setQuotationModalItemId] = useState<string | null>(null);
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
  const [quotationError, setQuotationError] = useState('');
  const [quotationDraft, setQuotationDraft] = useState(createQuotationForm());
  const [deleteTarget, setDeleteTarget] = useState<{ itemId: string; quotationId: string; supplier: string; isSelected: boolean } | null>(null);

  useEffect(() => {
    if (!projects.length) {
      setActiveProjectId(null);
      return;
    }

    if (!activeProjectId || !projects.some((project) => project.id === activeProjectId)) {
      setActiveProjectId(projects[0].id);
    }
  }, [activeProjectId, projects]);

  const projectGroups = useMemo(() => groupImplantationByProject(projects, items), [projects, items]);
  const activeProjectGroup = projectGroups.find((entry) => entry.project.id === activeProjectId) ?? null;
  const activeProject = activeProjectGroup?.project ?? null;
  const activeProjectItems = activeProjectGroup?.items ?? [];
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return activeProjectItems;
    return activeProjectItems.filter((item: ImplantationItem) =>
      [item.name, item.description, implantationGroupLabel(item.group), item.status].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [activeProjectItems, query]);

  const globalTotals = useMemo(() => calculateImplantationTotals(items), [items]);
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;
  const selectedItemProject = selectedItem ? projects.find((project) => project.id === selectedItem.projectId) ?? null : null;

  const activeStepId = implantationStepIds[activeStepIndex];
  const currentQuotationItem = items.find((item) => item.id === quotationModalItemId) ?? null;
  const quotationCommercialTotal = calculateQuotationCommercialTotalCents({
    id: editingQuotationId ?? 'preview',
    createdAt: '',
    updatedAt: '',
    ...quotationDraft
  });
  const quotationPaymentTotal = calculateQuotationPaymentPlanTotalCents({
    id: editingQuotationId ?? 'preview',
    createdAt: '',
    updatedAt: '',
    ...quotationDraft
  });
  const quotationGap = calculateQuotationPaymentGapCents({
    id: editingQuotationId ?? 'preview',
    createdAt: '',
    updatedAt: '',
    ...quotationDraft
  });

  const openNewProjectModal = () => {
    clearProjectDraft();
    setEditingProjectId(null);
    setProjectError('');
    setProjectModalOpen(true);
  };

  const openEditProjectModal = (project: ImplantationProject) => {
    setProjectDraft({
      name: project.name,
      description: project.description,
      budgetTargetCents: project.budgetTargetCents,
      status: project.status,
      startDate: project.startDate,
      targetEndDate: project.targetEndDate,
      notes: project.notes
    });
    setEditingProjectId(project.id);
    setProjectError('');
    setProjectModalOpen(true);
  };

  const saveProject = () => {
    if (!projectDraft.name.trim()) {
      setProjectError('Defina o nome do projeto.');
      return;
    }
    if (projectDraft.budgetTargetCents <= 0) {
      setProjectError('Defina um orçamento maior que zero.');
      return;
    }

    if (editingProjectId) {
      updateProject(editingProjectId, {
        name: projectDraft.name.trim(),
        description: projectDraft.description.trim(),
        budgetTargetCents: projectDraft.budgetTargetCents,
        status: projectDraft.status,
        startDate: projectDraft.startDate,
        targetEndDate: projectDraft.targetEndDate,
        notes: projectDraft.notes.trim()
      });
    } else {
      const createdId = addProjectFromDraft();
      if (createdId) setActiveProjectId(createdId);
    }

    setProjectModalOpen(false);
    setEditingProjectId(null);
    setProjectError('');
  };

  const openNewItemModal = () => {
    if (!activeProjectId) return;
    clearDraft();
    setDraft({ projectId: activeProjectId });
    setActiveStepIndex(0);
    setWizardError('');
    setItemModalOpen(true);
  };

  const validateStep = (stepId: (typeof implantationStepIds)[number]): string | null => {
    if (stepId === 'projeto') {
      if (!draft.projectId) return 'Escolha um projeto antes de continuar.';
      return null;
    }

    if (stepId === 'item') {
      if (!draft.name.trim()) return 'Defina o nome do item da implantação.';
      return null;
    }

    return null;
  };

  const goToNextStep = () => {
    const error = validateStep(implantationStepIds[activeStepIndex]);
    if (error) {
      setWizardError(error);
      return;
    }
    setWizardError('');
    setActiveStepIndex((index) => Math.min(index + 1, implantationStepIds.length - 1));
  };

  const saveItem = () => {
    const error = validateStep('item');
    if (error) {
      setWizardError(error);
      return;
    }
    const createdId = addFromDraft();
    if (createdId) {
      setSelectedItemId(createdId);
    }
    setItemModalOpen(false);
    setActiveStepIndex(0);
    setWizardError('');
  };

  const openQuotationModal = (itemId: string, quotation?: Quotation) => {
    const item = items.find((entry) => entry.id === itemId);
    if (!item) return;

    if (quotation) {
      setQuotationDraft({
        supplier: quotation.supplier,
        totalCostCents: quotation.totalCostCents,
        freightCents: quotation.freightCents,
        source: quotation.source,
        notes: quotation.notes,
        status: quotation.status,
        paymentMode: quotation.paymentMode,
        downPaymentCents: quotation.downPaymentCents,
        installments: quotation.installments,
        installmentValueCents: quotation.installmentValueCents,
        firstDueDate: quotation.firstDueDate,
        paymentNotes: quotation.paymentNotes
      });
      setEditingQuotationId(quotation.id);
    } else {
      setQuotationDraft(createQuotationForm(item.paymentMode));
      setEditingQuotationId(null);
    }

    setQuotationModalItemId(itemId);
    setQuotationError('');
    setQuotationModalOpen(true);
  };

  const saveQuotation = () => {
    if (!currentQuotationItem) return;
    if (!quotationDraft.supplier.trim()) {
      setQuotationError('Defina o fornecedor.');
      return;
    }
    if (quotationDraft.totalCostCents <= 0) {
      setQuotationError('Defina o valor comercial da cotação.');
      return;
    }
    if (quotationDraft.paymentMode !== 'avista' && quotationDraft.installments <= 0) {
      setQuotationError('Informe o número de parcelas.');
      return;
    }
    if (quotationDraft.installments > 0 && quotationDraft.installmentValueCents <= 0) {
      setQuotationError('Informe o valor de cada parcela.');
      return;
    }

    const normalizedDraft = {
      ...quotationDraft,
      installments: quotationDraft.paymentMode === 'avista' ? 0 : quotationDraft.installments,
      installmentValueCents: quotationDraft.paymentMode === 'avista' ? 0 : quotationDraft.installmentValueCents,
      downPaymentCents: quotationDraft.paymentMode === 'avista' ? quotationCommercialTotal : quotationDraft.downPaymentCents
    };

    if (editingQuotationId) {
      updateQuotation(currentQuotationItem.id, editingQuotationId, normalizedDraft);
    } else {
      addQuotation(currentQuotationItem.id, normalizedDraft);
    }

    setQuotationModalOpen(false);
    setQuotationModalItemId(null);
    setEditingQuotationId(null);
    setQuotationError('');
  };

  const itemSteps = [
    {
      id: 'projeto',
      title: 'Projeto',
      content: (
        <div className="section-grid-2">
          <label data-tour="impl-project-select">
            Projeto
            <select className="select-dark" value={draft.projectId} onChange={(event) => setDraft({ projectId: event.target.value })}>
              <option value="">Escolher projeto</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label data-tour="impl-group">
            Grupo
            <select className="select-dark" value={draft.group} onChange={(event) => setDraft({ group: event.target.value as ImplantationItem['group'] })}>
              {groupOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label data-tour="impl-priority">
            Prioridade
            <select className="select-dark" value={draft.priority} onChange={(event) => setDraft({ priority: event.target.value as ImplantationItem['priority'] })}>
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )
    },
    {
      id: 'item',
      title: 'Item',
      content: (
        <div className="section-grid-2">
          <label data-tour="impl-item-name">
            Nome do item
            <input className="input-dark" value={draft.name} onChange={(event) => setDraft({ name: event.target.value })} placeholder="Ex: Mulching" />
          </label>
          <label data-tour="impl-deadline">
            Prazo alvo
            <input type="date" className="input-dark" value={draft.deadline} onChange={(event) => setDraft({ deadline: event.target.value })} />
          </label>
          <label className="span-2">
            Descrição
            <textarea className="textarea-dark" value={draft.description} onChange={(event) => setDraft({ description: event.target.value })} placeholder="Escopo e contexto do item" />
          </label>
        </div>
      )
    },
    {
      id: 'pagamento',
      title: 'Pagamento',
      content: (
        <div className="section-grid-2">
          <label data-tour="impl-payment-mode">
            Modalidade
            <select className="select-dark" value={draft.paymentMode} onChange={(event) => setDraft({ paymentMode: event.target.value as PaymentMode })}>
              {paymentModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="span-2">
            Observações
            <textarea className="textarea-dark" value={draft.notes} onChange={(event) => setDraft({ notes: event.target.value })} placeholder="Condição, restrição ou detalhe financeiro" />
          </label>
        </div>
      )
    },
    {
      id: 'revisao',
      title: 'Revisão',
      content: (
        <div className="page-stack">
          <div className="section-grid-3">
            <ExecutiveCard title="Projeto" value={projects.find((project) => project.id === draft.projectId)?.name ?? 'Sem projeto'} tone="info" />
            <ExecutiveCard title="Grupo" value={implantationGroupLabel(draft.group)} tone="neutral" />
            <ExecutiveCard title="Pagamento" value={paymentModeOptions.find((option) => option.value === draft.paymentMode)?.label ?? 'Sem modo'} tone="warning" />
          </div>
          <p className="modal-note">Depois do cadastro, você poderá adicionar e comparar cotações no detalhe do item.</p>
        </div>
      )
    }
  ];

  return (
    <div className="page-stack implantation-page">
      <DetailCard
        title="Implantação"
        subtitle="Projetos, itens e cotações"
        action={
          <div className="toolbar-actions">
            <button type="button" className="ghost-btn" onClick={openNewProjectModal} data-tour="new-project-btn">
              Novo projeto
            </button>
            {projects.length > 0 && (
              <button type="button" className="cta-btn" onClick={openNewItemModal} data-tour="new-implantation-item-btn">
                Novo item
              </button>
            )}
          </div>
        }
      >
        <div className="executive-grid" data-tour="implantation-summary">
          <ExecutiveCard title="Projetos" value={String(projects.length)} helper="Implantações agrupadas por frente" tone="info" icon={<UiIcon name="panel" />} />
          <ExecutiveCard title="Total previsto" value={formatCompactCurrency(globalTotals.totalCents)} helper="Melhor cotação ou cotação selecionada" tone="neutral" icon={<UiIcon name="wallet" />} />
          <ExecutiveCard title="Comprometido" value={formatCompactCurrency(globalTotals.committedCents)} helper="Itens negociados, fechados ou pagos" tone="warning" icon={<UiIcon name="target" />} />
          <ExecutiveCard title="Em aberto" value={formatCompactCurrency(globalTotals.openCents)} helper="Aguardando fechamento" tone={globalTotals.openCents > 0 ? 'danger' : 'positive'} icon={<UiIcon name="warning" />} />
        </div>
      </DetailCard>

      <DetailCard title="Projetos" subtitle="Escolha o projeto para ver os itens e o orçamento correspondente">
        {projectGroups.length === 0 ? (
          <SmartEmptyState
            title="Nenhum projeto de implantação ainda"
            description="Crie o primeiro projeto para organizar orçamento, itens e cotações."
            action={
              <button type="button" className="cta-btn" onClick={openNewProjectModal}>
                Criar primeiro projeto
              </button>
            }
          />
        ) : (
          <div className="implantation-project-grid" data-tour="implantation-projects">
            {projectGroups.map(({ project, totals }) => (
              <article
                key={project.id}
                className={`implantation-project-card ${project.id === activeProjectId ? 'is-active' : ''}`}
                onClick={() => setActiveProjectId(project.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setActiveProjectId(project.id);
                  }
                }}
              >
                <div className="implantation-project-head">
                  <div>
                    <strong>{project.name}</strong>
                    <p>{project.description || 'Sem descrição'}</p>
                  </div>
                  <StatusChip label={statusLabel(project.status)} tone={projectStatusTone(project.status)} />
                </div>
                <div className="implantation-project-metrics">
                  <div>
                    <span>Orçamento</span>
                    <strong>{formatCurrency(totals.budgetTargetCents)}</strong>
                  </div>
                  <div>
                    <span>Previsto</span>
                    <strong>{formatCurrency(totals.totalCents)}</strong>
                  </div>
                  <div>
                    <span>Comprometido</span>
                    <strong>{formatCurrency(totals.committedCents)}</strong>
                  </div>
                  <div>
                    <span>Saldo</span>
                    <strong className={totals.remainingBudgetCents < 0 ? 'text-danger' : undefined}>{formatCurrency(totals.remainingBudgetCents)}</strong>
                  </div>
                </div>
                <div className="implantation-project-footer">
                  <span>{`${totals.itemCount} item(ns)`}</span>
                  <div className="toolbar-actions">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEditProjectModal(project);
                      }}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </DetailCard>

      <DetailCard
        title={activeProject ? `Itens · ${activeProject.name}` : 'Itens'}
        subtitle={activeProject ? 'Orçamento e fechamento do projeto selecionado' : 'Escolha um projeto para ver os itens'}
        action={
          activeProject ? (
            <div className="toolbar-actions" data-tour="implantation-items-toolbar">
              <SearchBar value={query} onChange={setQuery} placeholder="Buscar item, grupo ou status" />
              <button type="button" className="cta-btn" onClick={openNewItemModal} data-tour="new-item-action-btn">
                Novo item
              </button>
            </div>
          ) : undefined
        }
      >
        {!activeProject ? (
          <SmartEmptyState title="Escolha um projeto para continuar" description="O projeto ativo define o orçamento e os itens mostrados nesta etapa." />
        ) : filteredItems.length === 0 ? (
          <SmartEmptyState
            title={activeProjectItems.length === 0 ? 'Este projeto ainda não tem itens' : 'Nenhum item encontrado'}
            description={
              activeProjectItems.length === 0
                ? 'Adicione o primeiro item para começar o orçamento da implantação.'
                : 'Ajuste a busca ou adicione um novo item a este projeto.'
            }
            action={
              <button type="button" className="cta-btn" onClick={openNewItemModal}>
                {activeProjectItems.length === 0 ? 'Adicionar primeiro item' : 'Adicionar novo item'}
              </button>
            }
          />
        ) : (
          <>
            <div className="executive-grid">
              <ExecutiveCard title="Orçamento meta" value={formatCurrency(activeProjectGroup?.totals.budgetTargetCents ?? 0)} tone="info" />
              <ExecutiveCard title="Previsto" value={formatCurrency(activeProjectGroup?.totals.totalCents ?? 0)} tone="neutral" />
              <ExecutiveCard title="Comprometido" value={formatCurrency(activeProjectGroup?.totals.committedCents ?? 0)} tone="warning" />
              <ExecutiveCard
                title="Saldo"
                value={formatCurrency(activeProjectGroup?.totals.remainingBudgetCents ?? 0)}
                tone={(activeProjectGroup?.totals.remainingBudgetCents ?? 0) < 0 ? 'danger' : 'positive'}
              />
            </div>
            <div className="table-lite-wrap">
              <table className="table-lite">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Item</th>
                  <th>Status</th>
                  <th>Prazo</th>
                  <th>Cotação selecionada</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const selected = item.selectedQuotationId
                    ? item.quotations.find((entry: Quotation) => entry.id === item.selectedQuotationId) ?? null
                    : null;

                  return (
                    <tr key={item.id} onClick={() => setSelectedItemId(item.id)} style={{ cursor: 'pointer' }}>
                      <td>{implantationGroupLabel(item.group)}</td>
                      <td>
                        <div className="table-primary-cell">
                          <strong>{item.name}</strong>
                          <span>{item.description || 'Sem descrição'}</span>
                        </div>
                      </td>
                      <td>
                        <StatusChip label={statusLabel(item.status)} tone={itemStatusTone(item.status)} />
                      </td>
                      <td>{formatDate(item.deadline)}</td>
                      <td>{selected ? formatCurrency(calculateQuotationCommercialTotalCents(selected)) : 'Sem seleção'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}
      </DetailCard>

      <CenterModal
        open={projectModalOpen}
        title={editingProjectId ? 'Editar projeto' : 'Novo projeto'}
        subtitle="Organize a implantação por frente de investimento e orçamento."
        onClose={() => setProjectModalOpen(false)}
        onHelp={() => startTour('implantation-wizard')}
        footer={
          <div className="wizard-footer">
            <div className="wizard-feedback">
              {projectError && <span className="wizard-error">{projectError}</span>}
            </div>
            <div className="wizard-actions">
              <button type="button" className="ghost-btn" onClick={() => setProjectModalOpen(false)}>
                Fechar
              </button>
              <button type="button" className="cta-btn" onClick={saveProject}>
                Salvar projeto
              </button>
            </div>
          </div>
        }
      >
        <div className="modal-form-grid">
          <label className="span-2">
            Nome do projeto
            <input className="input-dark" value={projectDraft.name} onChange={(event) => setProjectDraft({ name: event.target.value })} placeholder="Ex: Horta" />
          </label>
          <label className="span-2">
            Descrição
            <textarea className="textarea-dark" value={projectDraft.description} onChange={(event) => setProjectDraft({ description: event.target.value })} placeholder="Escopo do projeto" />
          </label>
          <label>
            Orçamento total
            <input
              type="number"
              step="0.01"
              className="input-dark"
              value={fromCents(projectDraft.budgetTargetCents)}
              onChange={(event) => setProjectDraft({ budgetTargetCents: toCents(Number(event.target.value || 0)) })}
            />
          </label>
          <label>
            Status
            <select className="select-dark" value={projectDraft.status} onChange={(event) => setProjectDraft({ status: event.target.value as ImplantationProject['status'] })}>
              {projectStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Início
            <input type="date" className="input-dark" value={projectDraft.startDate} onChange={(event) => setProjectDraft({ startDate: event.target.value })} />
          </label>
          <label>
            Prazo alvo
            <input type="date" className="input-dark" value={projectDraft.targetEndDate} onChange={(event) => setProjectDraft({ targetEndDate: event.target.value })} />
          </label>
          <label className="span-2">
            Observações
            <textarea className="textarea-dark" value={projectDraft.notes} onChange={(event) => setProjectDraft({ notes: event.target.value })} placeholder="Observações do projeto" />
          </label>
        </div>
      </CenterModal>

      <WizardModal
        open={itemModalOpen}
        title="Novo item de implantação"
        subtitle="Defina projeto, escopo e forma de pagamento antes de começar as cotações."
        steps={itemSteps}
        activeStepId={activeStepId}
        onStepChange={(stepId) => setActiveStepIndex(implantationStepIds.indexOf(stepId as (typeof implantationStepIds)[number]))}
        onClose={() => setItemModalOpen(false)}
        onBack={() => setActiveStepIndex((index) => Math.max(index - 1, 0))}
        onNext={goToNextStep}
        onSubmit={saveItem}
        onSaveDraft={() => setItemModalOpen(false)}
        backDisabled={activeStepIndex === 0}
        error={wizardError}
        submitLabel="Salvar item"
        onHelp={() => startTour('implantation-wizard')}
      />

      <CenterModal
        open={Boolean(selectedItem)}
        title={selectedItem?.name ?? 'Item de implantação'}
        subtitle={selectedItemProject ? `${selectedItemProject.name} · ${implantationGroupLabel(selectedItem?.group ?? 'solo')}` : 'Detalhe do item'}
        onClose={() => setSelectedItemId(null)}
        footer={
          selectedItem ? (
            <div className="wizard-footer">
              <span className="modal-note">
                {selectedItem.selectedQuotationId
                  ? `Cotação selecionada: ${selectedItem.quotations.find((quotation) => quotation.id === selectedItem.selectedQuotationId)?.supplier ?? 'Fornecedor'}`
                  : 'Nenhuma cotação selecionada'}
              </span>
              <div className="wizard-actions">
                <button type="button" className="ghost-btn" onClick={() => setSelectedItemId(null)}>
                  Fechar
                </button>
                <button type="button" className="cta-btn" onClick={() => openQuotationModal(selectedItem.id)}>
                  Adicionar cotação
                </button>
              </div>
            </div>
          ) : null
        }
      >
        {selectedItem && (
          <div className="page-stack">
            <div className="section-grid-2">
              <label>
                Status
                <select
                  className="select-dark"
                  value={selectedItem.status}
                  onChange={(event) => updateItem(selectedItem.id, { status: event.target.value as ImplantationItem['status'] })}
                >
                  {itemStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Prazo alvo
                <input
                  type="date"
                  className="input-dark"
                  value={selectedItem.deadline}
                  onChange={(event) => updateItem(selectedItem.id, { deadline: event.target.value })}
                />
              </label>
              <label>
                Projeto
                <select
                  className="select-dark"
                  value={selectedItem.projectId}
                  onChange={(event) => updateItem(selectedItem.id, { projectId: event.target.value })}
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Grupo
                <select
                  className="select-dark"
                  value={selectedItem.group}
                  onChange={(event) => updateItem(selectedItem.id, { group: event.target.value as ImplantationItem['group'] })}
                >
                  {groupOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Prioridade
                <select
                  className="select-dark"
                  value={selectedItem.priority}
                  onChange={(event) => updateItem(selectedItem.id, { priority: event.target.value as ImplantationItem['priority'] })}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Modalidade do item
                <select
                  className="select-dark"
                  value={selectedItem.paymentMode}
                  onChange={(event) => updateItem(selectedItem.id, { paymentMode: event.target.value as PaymentMode })}
                >
                  {paymentModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                Nome
                <input className="input-dark" value={selectedItem.name} onChange={(event) => updateItem(selectedItem.id, { name: event.target.value })} />
              </label>
              <label className="span-2">
                Descrição
                <textarea
                  className="textarea-dark"
                  value={selectedItem.description}
                  onChange={(event) => updateItem(selectedItem.id, { description: event.target.value })}
                />
              </label>
              <label className="span-2">
                Observações
                <textarea className="textarea-dark" value={selectedItem.notes} onChange={(event) => updateItem(selectedItem.id, { notes: event.target.value })} />
              </label>
            </div>

            <DetailCard
              title="Cotações"
              subtitle="Fornecedor, valor comercial e plano de pagamento"
              action={
                <button type="button" className="ghost-btn" onClick={() => openQuotationModal(selectedItem.id)}>
                  + Cotação
                </button>
              }
            >
              {selectedItem.quotations.length === 0 ? (
                <SmartEmptyState
                  title="Nenhuma cotação cadastrada"
                  description="Adicione a primeira cotação para comparar fornecedor, valor e parcelamento."
                  action={
                    <button type="button" className="cta-btn" onClick={() => openQuotationModal(selectedItem.id)}>
                      Adicionar primeira cotação
                    </button>
                  }
                />
              ) : (
                <div className="implantation-quotation-list">
                  {selectedItem.quotations.map((quotation) => {
                    const isSelected = quotation.id === selectedItem.selectedQuotationId;
                    return (
                      <article key={quotation.id} className="implantation-quotation-card">
                        <div className="implantation-quotation-head">
                          <div>
                            <strong>{quotation.supplier}</strong>
                            <p>{quotation.source || 'Origem não informada'}</p>
                          </div>
                          <StatusChip label={statusLabel(quotation.status)} tone={quotationStatusTone(quotation.status)} />
                        </div>

                        <div className="implantation-quotation-metrics">
                          <div>
                            <span>Total comercial</span>
                            <strong>{formatCurrency(calculateQuotationCommercialTotalCents(quotation))}</strong>
                          </div>
                          <div>
                            <span>Total financeiro</span>
                            <strong>{formatCurrency(calculateQuotationPaymentPlanTotalCents(quotation))}</strong>
                          </div>
                          <div>
                            <span>Parcelamento</span>
                            <strong>
                              {quotation.paymentMode === 'avista'
                                ? 'À vista'
                                : `${quotation.installments || 0}x de ${formatCurrency(quotation.installmentValueCents)}`}
                            </strong>
                          </div>
                        </div>

                        <div className="implantation-quotation-footer">
                          <span className={`modal-note ${calculateQuotationPaymentGapCents(quotation) !== 0 ? 'text-warning' : ''}`}>
                            {calculateQuotationPaymentGapCents(quotation) === 0
                              ? 'Comercial e financeiro alinhados'
                              : `Diferença entre comercial e financeiro: ${formatCurrency(calculateQuotationPaymentGapCents(quotation))}`}
                          </span>
                          <div className="toolbar-actions">
                            <button type="button" className="ghost-btn" onClick={() => selectQuotation(selectedItem.id, quotation.id)} disabled={isSelected}>
                              {isSelected ? 'Selecionada' : 'Selecionar'}
                            </button>
                            <button type="button" className="ghost-btn" onClick={() => openQuotationModal(selectedItem.id, quotation)}>
                              Editar
                            </button>
                            <button
                              type="button"
                              className="ghost-btn"
                              onClick={() =>
                                setDeleteTarget({
                                  itemId: selectedItem.id,
                                  quotationId: quotation.id,
                                  supplier: quotation.supplier,
                                  isSelected
                                })
                              }
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </DetailCard>
          </div>
        )}
      </CenterModal>

      <CenterModal
        open={quotationModalOpen}
        title={editingQuotationId ? 'Editar cotação' : 'Nova cotação'}
        subtitle={currentQuotationItem ? `Item: ${currentQuotationItem.name}` : 'Preencha fornecedor, valor e parcelamento'}
        onClose={() => setQuotationModalOpen(false)}
        footer={
          <div className="wizard-footer">
            <div className="wizard-feedback">
              {quotationError && <span className="wizard-error">{quotationError}</span>}
            </div>
            <div className="wizard-actions">
              <button type="button" className="ghost-btn" onClick={() => setQuotationModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="cta-btn" onClick={saveQuotation}>
                Salvar cotação
              </button>
            </div>
          </div>
        }
      >
        <div className="page-stack">
          <DetailCard title="Comercial" subtitle="Fornecedor, origem e valor de referência">
            <div className="modal-form-grid">
              <label>
                Fornecedor
                <input className="input-dark" value={quotationDraft.supplier} onChange={(event) => setQuotationDraft((state) => ({ ...state, supplier: event.target.value }))} />
              </label>
              <label>
                Origem
                <input className="input-dark" value={quotationDraft.source} onChange={(event) => setQuotationDraft((state) => ({ ...state, source: event.target.value }))} />
              </label>
              <label>
                Valor total
                <input
                  type="number"
                  step="0.01"
                  className="input-dark"
                  value={fromCents(quotationDraft.totalCostCents)}
                  onChange={(event) => setQuotationDraft((state) => ({ ...state, totalCostCents: toCents(Number(event.target.value || 0)) }))}
                />
              </label>
              <label>
                Frete
                <input
                  type="number"
                  step="0.01"
                  className="input-dark"
                  value={fromCents(quotationDraft.freightCents)}
                  onChange={(event) => setQuotationDraft((state) => ({ ...state, freightCents: toCents(Number(event.target.value || 0)) }))}
                />
              </label>
              <label>
                Status
                <select className="select-dark" value={quotationDraft.status} onChange={(event) => setQuotationDraft((state) => ({ ...state, status: event.target.value as Quotation['status'] }))}>
                  {quotationStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="span-2">
                Observações
                <textarea className="textarea-dark" value={quotationDraft.notes} onChange={(event) => setQuotationDraft((state) => ({ ...state, notes: event.target.value }))} />
              </label>
            </div>
          </DetailCard>

          <DetailCard title="Pagamento" subtitle="Plano financeiro da cotação">
            <div className="modal-form-grid">
              <label>
                Modalidade
                <select
                  className="select-dark"
                  value={quotationDraft.paymentMode}
                  onChange={(event) =>
                    setQuotationDraft((state) => ({
                      ...state,
                      paymentMode: event.target.value as PaymentMode,
                      installments: event.target.value === 'avista' ? 0 : state.installments,
                      installmentValueCents: event.target.value === 'avista' ? 0 : state.installmentValueCents
                    }))
                  }
                >
                  {paymentModeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Entrada
                <input
                  type="number"
                  step="0.01"
                  className="input-dark"
                  value={fromCents(quotationDraft.downPaymentCents)}
                  onChange={(event) => setQuotationDraft((state) => ({ ...state, downPaymentCents: toCents(Number(event.target.value || 0)) }))}
                />
              </label>
              <label>
                Parcelas
                <input
                  type="number"
                  className="input-dark"
                  value={quotationDraft.installments}
                  disabled={quotationDraft.paymentMode === 'avista'}
                  onChange={(event) => setQuotationDraft((state) => ({ ...state, installments: Number(event.target.value || 0) }))}
                />
              </label>
              <label>
                Valor da parcela
                <input
                  type="number"
                  step="0.01"
                  className="input-dark"
                  value={fromCents(quotationDraft.installmentValueCents)}
                  disabled={quotationDraft.paymentMode === 'avista'}
                  onChange={(event) => setQuotationDraft((state) => ({ ...state, installmentValueCents: toCents(Number(event.target.value || 0)) }))}
                />
              </label>
              <label>
                Primeiro vencimento
                <input type="date" className="input-dark" value={quotationDraft.firstDueDate} onChange={(event) => setQuotationDraft((state) => ({ ...state, firstDueDate: event.target.value }))} />
              </label>
              <label className="span-2">
                Observações do pagamento
                <textarea className="textarea-dark" value={quotationDraft.paymentNotes} onChange={(event) => setQuotationDraft((state) => ({ ...state, paymentNotes: event.target.value }))} />
              </label>
            </div>
          </DetailCard>

          <DetailCard title="Leitura rápida" subtitle="Comparação entre valor comercial e plano financeiro">
            <div className="executive-grid">
              <ExecutiveCard title="Total comercial" value={formatCurrency(quotationCommercialTotal)} tone="neutral" />
              <ExecutiveCard title="Total financeiro" value={formatCurrency(quotationPaymentTotal)} tone="warning" />
              <ExecutiveCard title="Diferença" value={formatCurrency(quotationGap)} tone={quotationGap === 0 ? 'positive' : 'danger'} />
            </div>
          </DetailCard>
        </div>
      </CenterModal>

      <CenterModal
        open={Boolean(deleteTarget)}
        title="Excluir cotação"
        subtitle={deleteTarget?.isSelected ? 'Esta cotação está selecionada no item atual.' : 'A cotação será removida do item.'}
        onClose={() => setDeleteTarget(null)}
        footer={
          <div className="wizard-footer">
            <span className="modal-note">
              {deleteTarget?.isSelected ? 'A seleção atual será limpa automaticamente.' : 'A exclusão não pode ser desfeita.'}
            </span>
            <div className="wizard-actions">
              <button type="button" className="ghost-btn" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button
                type="button"
                className="cta-btn"
                onClick={() => {
                  if (!deleteTarget) return;
                  removeQuotation(deleteTarget.itemId, deleteTarget.quotationId);
                  setDeleteTarget(null);
                }}
              >
                Excluir cotação
              </button>
            </div>
          </div>
        }
      >
        <p className="modal-note">
          {deleteTarget ? `Excluir a cotação de ${deleteTarget.supplier}?` : ''}
        </p>
      </CenterModal>
    </div>
  );
};
