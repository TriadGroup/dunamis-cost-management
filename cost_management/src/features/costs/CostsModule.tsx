import { useMemo, useState } from 'react';
import { useFinanceStore, useOnboardingStore, useOptionCatalogStore, useProductionPlanningStore } from '@/app/store';
import { calculateRecurringCostSummary, type CostItem, type CostRecurrenceType, type CostStatus } from '@/entities';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import { CenterModal, CreatableSelect, DetailCard, ExecutiveCard, FilterPills, MoneyField, SearchBar, SmartEmptyState, StatusChip } from '@/shared/ui';

interface CostCategoryOption {
  value: string;
  subcategories: string[];
}

interface CostDraft {
  name: string;
  recurrenceType: CostRecurrenceType;
  category: string;
  subcategory: string;
  eventValueCents: number;
  monthlyEquivalentCents: number;
  nextOccurrence: string;
  supplier: string;
  linkedCostCenter: string;
  linkedCropId: string;
  status: CostStatus;
  notes: string;
}

const recurrenceOptions: Array<{ value: CostRecurrenceType; label: string }> = [
  { value: 'unico', label: 'Custo único' },
  { value: 'recorrente', label: 'Recorrente' },
  { value: 'sazonal', label: 'Sazonal' },
  { value: 'por_ciclo', label: 'Por ciclo' },
  { value: 'extraordinario', label: 'Extraordinário' }
];

const categoryOptions: CostCategoryOption[] = [
  {
    value: 'Insumos operacionais',
    subcategories: ['Proteção', 'Nutrição de solo', 'Correção de solo', 'Sementes e mudas', 'Irrigação']
  },
  {
    value: 'EPI e segurança',
    subcategories: ['Descartáveis', 'Proteção pessoal', 'Higiene']
  },
  {
    value: 'Rotina da equipe',
    subcategories: ['Campo', 'Transporte', 'Apoio']
  },
  {
    value: 'Operação comercial',
    subcategories: ['Box', 'Feira e eventos', 'Venda direta', 'Extraordinário']
  },
  {
    value: 'Infraestrutura',
    subcategories: ['Irrigação', 'Elétrica', 'Hidráulica', 'Depósito']
  },
  {
    value: 'Serviços',
    subcategories: ['Mão de obra', 'Frete', 'Terceiros', 'Consultoria']
  }
];

const statusOptions: Array<{ value: CostStatus; label: string }> = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'encerrado', label: 'Encerrado' }
];

const costCenterOptions = ['Operação diária', 'Cultivo', 'Equipe campo', 'Comercial', 'Infraestrutura', 'Sem centro'];

const recurrenceTone = (value: CostRecurrenceType): 'high' | 'medium' | 'low' | 'neutral' => {
  if (value === 'extraordinario') return 'high';
  if (value === 'sazonal' || value === 'por_ciclo') return 'medium';
  if (value === 'recorrente') return 'low';
  return 'neutral';
};

const buildDefaultDraft = (): CostDraft => ({
  name: '',
  recurrenceType: 'recorrente',
  category: categoryOptions[0].value,
  subcategory: categoryOptions[0].subcategories[0],
  eventValueCents: 0,
  monthlyEquivalentCents: 0,
  nextOccurrence: '',
  supplier: '',
  linkedCostCenter: costCenterOptions[0],
  linkedCropId: '',
  status: 'ativo',
  notes: ''
});

const buildDraftFromItem = (item: CostItem): CostDraft => ({
  name: item.name,
  recurrenceType: item.recurrenceType,
  category: item.category,
  subcategory: item.subcategory,
  eventValueCents: item.eventValueCents,
  monthlyEquivalentCents: item.monthlyEquivalentCents,
  nextOccurrence: item.nextOccurrence,
  supplier: item.supplier,
  linkedCostCenter: item.linkedCostCenter || costCenterOptions[0],
  linkedCropId: item.linkedCropId || '',
  status: item.status,
  notes: item.notes
});

const getSubcategoryOptions = (category: string): string[] => {
  const found = categoryOptions.find((option) => option.value === category);
  return found?.subcategories ?? ['Geral'];
};

const recurrenceLabel = (value: CostRecurrenceType) => recurrenceOptions.find((option) => option.value === value)?.label ?? value;

export const CostsModule = () => {
  const optionCatalog = useOptionCatalogStore((state) => state.options);
  const addCatalogOption = useOptionCatalogStore((state) => state.addOption);
  const costItems = useFinanceStore((state) => state.costItems);
  const addCostItem = useFinanceStore((state) => state.addCostItem);
  const updateCostItem = useFinanceStore((state) => state.updateCostItem);
  const removeCostItem = useFinanceStore((state) => state.removeCostItem);
  const crops = useProductionPlanningStore((state) => state.crops);
  const startTour = useOnboardingStore((state) => state.startTour);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CostRecurrenceType | 'todos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CostDraft>(buildDefaultDraft());

  const visible = useMemo(() => {
    return costItems.filter((item) => {
      const q = query.toLowerCase();
      const matchesQuery =
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.subcategory.toLowerCase().includes(q);
      const matchesFilter = filter === 'todos' ? true : item.recurrenceType === filter;
      return matchesQuery && matchesFilter;
    });
  }, [costItems, filter, query]);

  const summary = calculateRecurringCostSummary(costItems, [], []);
  const activeSubcategories = [...new Set([...getSubcategoryOptions(draft.category), ...(optionCatalog['cost-subcategory'] ?? []).map((entry) => entry.label)])];
  const categoryCatalog = optionCatalog['cost-category'] ?? categoryOptions.map((option) => ({ value: option.value, label: option.value }));
  const costCenterCatalog = optionCatalog['cost-center'] ?? costCenterOptions.map((option) => ({ value: option, label: option }));
  const supplierCatalog = optionCatalog.supplier ?? [];
  const isSingleCost = draft.recurrenceType === 'unico';

  const openCreateModal = () => {
    setEditingId(null);
    setDraft(buildDefaultDraft());
    setModalOpen(true);
  };

  const openEditModal = (item: CostItem) => {
    setEditingId(item.id);
    setDraft(buildDraftFromItem(item));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setDraft(buildDefaultDraft());
  };

  const saveDraft = () => {
    addCatalogOption('cost-category', draft.category, draft.category);
    addCatalogOption('cost-subcategory', draft.subcategory, draft.subcategory);
    addCatalogOption('cost-center', draft.linkedCostCenter, draft.linkedCostCenter);
    if (draft.supplier.trim()) {
      addCatalogOption('supplier', draft.supplier.trim(), draft.supplier.trim());
    }

    const payload: Partial<CostItem> = {
      name: draft.name.trim() || 'Novo lançamento',
      recurrenceType: draft.recurrenceType,
      category: draft.category,
      subcategory: draft.subcategory,
      eventValueCents: draft.eventValueCents,
      monthlyEquivalentCents: isSingleCost ? 0 : draft.monthlyEquivalentCents,
      nextOccurrence: draft.nextOccurrence,
      supplier: draft.supplier.trim(),
      linkedCostCenter: draft.linkedCostCenter,
      linkedCropId: draft.linkedCropId || undefined,
      status: draft.status,
      notes: draft.notes.trim()
    };

    if (editingId) {
      updateCostItem(editingId, payload);
    } else {
      addCostItem(payload);
    }

    closeModal();
  };

  return (
    <div className="page-stack">
      <DetailCard
        title="Custos recorrentes e operacionais"
        subtitle="Agora e por mês"
        action={costItems.length > 0 ? <button className="cta-btn" onClick={openCreateModal} data-tour="new-cost-btn">Novo lançamento</button> : undefined}
      >
        <div className="executive-grid">
          <ExecutiveCard title="Custo mensal" value={formatCurrency(summary.monthlyCostCents)} helper="Custos ativos" tone="danger" />
          <ExecutiveCard title="Reserva mensal" value={formatCurrency(summary.monthlyReserveCents)} helper="Leitura para caixa" tone="warning" />
          <ExecutiveCard title="Consolidado anual" value={formatCurrency(summary.annualConsolidatedCents)} helper="Planejamento anual" tone="info" />
        </div>
      </DetailCard>

      <DetailCard
        title="Lançamentos"
        subtitle="Lista viva"
        action={
          <FilterPills
            activeId={filter}
            onChange={(value) => setFilter(value as CostRecurrenceType | 'todos')}
            options={[
              { id: 'todos', label: 'Todos' },
              { id: 'unico', label: 'Único' },
              { id: 'recorrente', label: 'Recorrente' },
              { id: 'sazonal', label: 'Sazonal' },
              { id: 'por_ciclo', label: 'Por ciclo' },
              { id: 'extraordinario', label: 'Extraordinário' }
            ]}
          />
        }
      >
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar lançamento por nome, categoria ou subcategoria" />

        {visible.length === 0 ? (
          <SmartEmptyState
            title="Sem lançamentos nesse filtro"
            description="Ajuste o filtro ou crie um lançamento novo."
            action={<button type="button" className="cta-btn" onClick={openCreateModal} data-tour="new-cost-btn">Novo lançamento</button>}
          />
        ) : (
          <div className="cost-card-grid">
            {visible.map((item) => (
              <article key={item.id} className="detail-card tone-neutral">
                <div className="cost-card-head">
                  <div>
                    <h4 className="cost-card-title">{item.name}</h4>
                    <p className="cost-card-meta">
                      {item.category} · {item.subcategory} · {item.supplier || 'Fornecedor não definido'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusChip label={recurrenceLabel(item.recurrenceType)} tone={recurrenceTone(item.recurrenceType)} />
                    <StatusChip label={statusOptions.find((option) => option.value === item.status)?.label || item.status} tone={item.status === 'ativo' ? 'low' : item.status === 'pendente' ? 'medium' : 'neutral'} />
                  </div>
                </div>

                <div className="cost-metric-row" style={{ marginTop: 14 }}>
                  <div className="cost-metric">
                    <span>Agora</span>
                    <strong>{formatCurrency(item.eventValueCents)}</strong>
                  </div>
                  <div className="cost-metric">
                    <span>Por mês</span>
                    <strong>{item.recurrenceType === 'unico' ? 'Não aplica' : formatCurrency(item.monthlyEquivalentCents)}</strong>
                  </div>
                  <div className="cost-metric">
                    <span>Próxima ocorrência</span>
                    <strong>{formatDate(item.nextOccurrence)}</strong>
                  </div>
                  <div className="cost-metric">
                    <span>Centro</span>
                    <strong>{item.linkedCostCenter || 'Sem centro'}</strong>
                  </div>
                  <div className="cost-metric">
                    <span>Cultura</span>
                    <strong>{crops.find((crop) => crop.id === item.linkedCropId)?.name || 'Sem cultura'}</strong>
                  </div>
                </div>

                <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" className="ghost-btn" onClick={() => openEditModal(item)}>
                    Editar
                  </button>
                  <button type="button" className="ghost-btn" onClick={() => removeCostItem(item.id)}>
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </DetailCard>

      <CenterModal
        open={modalOpen}
        title={editingId ? 'Editar lançamento' : 'Novo lançamento'}
        subtitle="Escolha o tipo e preencha só o que faz sentido para esse custo."
        onClose={closeModal}
        onHelp={() => startTour('cost-wizard')}
        footer={
          <>
            <span className="modal-note">
              {isSingleCost ? 'Custo único não entra como peso mensal.' : 'Use “por mês” para o que realmente pesa no caixa mensal.'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="ghost-btn" onClick={closeModal}>
                Cancelar
              </button>
              <button type="button" className="cta-btn" onClick={saveDraft}>
                {editingId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </>
        }
      >
        <div className="modal-form-grid">
          <label className="span-2" data-tour="cost-name">
            Nome do lançamento
            <input className="input-dark" value={draft.name} onChange={(event) => setDraft((state) => ({ ...state, name: event.target.value }))} placeholder="Ex.: Herbicida, adubo, EPI..." />
          </label>

          <label data-tour="cost-type">
            Tipo
            <select
              className="select-dark"
              value={draft.recurrenceType}
              onChange={(event) =>
                setDraft((state) => ({
                  ...state,
                  recurrenceType: event.target.value as CostRecurrenceType,
                  monthlyEquivalentCents: event.target.value === 'unico' ? 0 : state.monthlyEquivalentCents
                }))
              }
            >
              {recurrenceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select className="select-dark" value={draft.status} onChange={(event) => setDraft((state) => ({ ...state, status: event.target.value as CostStatus }))}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label data-tour="cost-category">
            Categoria
            <CreatableSelect
              value={draft.category}
              options={categoryCatalog}
              onChange={(value) => {
                const nextCategory = value;
                const nextSubcategories = getSubcategoryOptions(nextCategory);
                setDraft((state) => ({
                  ...state,
                  category: nextCategory,
                  subcategory: nextSubcategories[0]
                }));
              }}
              onCreate={(label) => addCatalogOption('cost-category', label, label)}
              createLabel="Criar categoria"
            />
          </label>

          <label>
            Subcategoria
            <CreatableSelect
              value={draft.subcategory}
              options={activeSubcategories.map((option) => ({ value: option, label: option }))}
              onChange={(value) => setDraft((state) => ({ ...state, subcategory: value }))}
              onCreate={(label) => addCatalogOption('cost-subcategory', label, label)}
              createLabel="Criar subcategoria"
            />
          </label>

          <label data-tour="cost-value">
            Quanto isso custa agora? (R$)
            <MoneyField valueCents={draft.eventValueCents} onChange={(nextValueCents) => setDraft((state) => ({ ...state, eventValueCents: nextValueCents }))} />
          </label>

          <label data-tour="cost-monthly-weight">
            Quanto pesa por mês? (R$)
            <MoneyField
              valueCents={draft.monthlyEquivalentCents}
              onChange={(nextValueCents) => setDraft((state) => ({ ...state, monthlyEquivalentCents: nextValueCents }))}
              disabled={isSingleCost}
            />
          </label>

          <label>
            Próxima ocorrência
            <input className="input-dark" type="date" value={draft.nextOccurrence} onChange={(event) => setDraft((state) => ({ ...state, nextOccurrence: event.target.value }))} />
          </label>

          <label data-tour="cost-center">
            Centro
            <CreatableSelect
              value={draft.linkedCostCenter}
              options={costCenterCatalog}
              onChange={(value) => setDraft((state) => ({ ...state, linkedCostCenter: value }))}
              onCreate={(label) => addCatalogOption('cost-center', label, label)}
              createLabel="Criar centro"
            />
          </label>

          <label data-tour="cost-crop">
            Vincular a qual cultura?
            <select className="select-dark" value={draft.linkedCropId} onChange={(event) => setDraft((state) => ({ ...state, linkedCropId: event.target.value }))}>
              <option value="">Sem cultura</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name} {crop.variety ? `· ${crop.variety}` : ''}
                </option>
              ))}
            </select>
          </label>

          <label>
            Fornecedor
            <CreatableSelect
              value={draft.supplier}
              options={supplierCatalog}
              onChange={(value) => setDraft((state) => ({ ...state, supplier: value }))}
              onCreate={(label) => addCatalogOption('supplier', label, label)}
              createLabel="Criar fornecedor"
              placeholder="Escolha ou crie"
            />
          </label>

          <label className="span-2">
            Observações
            <input className="input-dark" value={draft.notes} onChange={(event) => setDraft((state) => ({ ...state, notes: event.target.value }))} placeholder="Opcional" />
          </label>
        </div>
      </CenterModal>
    </div>
  );
};
