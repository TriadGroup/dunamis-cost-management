import { useMemo, useState } from 'react';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import { useOnboardingStore } from '@/app/store/useOnboardingStore';
import { useOptionCatalogStore } from '@/app/store/useOptionCatalogStore';
import { useProductionPlanningStore } from '@/app/store/useProductionPlanningStore';
import { usePurchasesStore } from '@/app/store/usePurchasesStore';
import type { InventoryProduct, PurchaseItem, PurchasePaymentStatus, PurchaseStatus } from '@/entities';
import { formatCurrency, formatDate, formatUnitLabel } from '@/shared/lib/format';
import { CenterModal, CreatableSelect, DetailCard, ExecutiveCard, MoneyField, NumberField, SearchBar, SmartEmptyState, StatusChip } from '@/shared/ui';

const purchaseCategoryOptions = [
  {
    value: 'Insumos operacionais',
    subcategories: ['Proteção', 'Nutrição', 'Correção de solo', 'Irrigação', 'Outro']
  },
  {
    value: 'EPI e segurança',
    subcategories: ['Descartáveis', 'Proteção pessoal', 'Higiene', 'Outro']
  },
  {
    value: 'Logística e apoio',
    subcategories: ['Embalagens', 'Transporte', 'Depósito', 'Outro']
  },
  {
    value: 'Serviços e utilidades',
    subcategories: ['Energia', 'Água', 'Terceiros', 'Outro']
  }
] as const;

const purchaseStatusOptions: PurchaseStatus[] = ['ativo', 'pendente', 'pausado', 'encerrado'];
const paymentStatusOptions: PurchasePaymentStatus[] = ['pendente', 'parcial', 'pago'];
const costCenterOptions = ['Galpão principal', 'Campo aberto', 'Estufa', 'Box', 'Cozinha', 'Uso geral'];

type ProductCategory = InventoryProduct['category'];

const productCategoryByPurchaseCategory: Record<string, ProductCategory> = {
  'Insumos operacionais': 'adubo',
  'EPI e segurança': 'outro',
  'Logística e apoio': 'embalagem',
  'Serviços e utilidades': 'outro'
};

const buildDraft = (purchase?: PurchaseItem) => ({
  id: purchase?.id ?? null,
  name: purchase?.name ?? '',
  category: purchase?.category ?? purchaseCategoryOptions[0].value,
  subcategory: purchase?.subcategory ?? purchaseCategoryOptions[0].subcategories[0],
  supplier: purchase?.supplier ?? '',
  eventValueCents: purchase?.eventValueCents ?? 0,
  monthlyEquivalentCents: purchase?.monthlyEquivalentCents ?? 0,
  nextOccurrence: purchase?.nextOccurrence ?? '',
  linkedCropId: purchase?.linkedCropId ?? '',
  linkedCostCenter: purchase?.linkedCostCenter ?? costCenterOptions[0],
  notes: purchase?.notes ?? '',
  status: purchase?.status ?? ('ativo' as PurchaseStatus),
  isStockable: purchase?.isStockable ?? true,
  paymentStatus: purchase?.paymentStatus ?? ('pendente' as PurchasePaymentStatus),
  receivedAt: purchase?.receivedAt ?? new Date().toISOString().slice(0, 10),
  receivedQuantity: purchase?.receivedQuantity ?? 0,
  receivedUnit: purchase?.receivedUnit ?? 'unidade',
  inventoryProductId: purchase?.inventoryProductId ?? ''
});

const lotTone = (linkedLotCount: number): 'low' | 'medium' | 'neutral' => (linkedLotCount > 0 ? 'low' : 'neutral');

export const PurchasesModule = () => {
  const optionCatalog = useOptionCatalogStore((state) => state.options);
  const addCatalogOption = useOptionCatalogStore((state) => state.addOption);
  const purchases = usePurchasesStore((state) => state.purchases);
  const addPurchase = usePurchasesStore((state) => state.addPurchase);
  const updatePurchase = usePurchasesStore((state) => state.updatePurchase);
  const removePurchase = usePurchasesStore((state) => state.removePurchase);
  const crops = useProductionPlanningStore((state) => state.crops);
  const products = useInventoryStore((state) => state.products);
  const lots = useInventoryStore((state) => state.lots);
  const addProduct = useInventoryStore((state) => state.addProduct);
  const addLot = useInventoryStore((state) => state.addLot);
  const updateLot = useInventoryStore((state) => state.updateLot);
  const startTour = useOnboardingStore((state) => state.startTour);

  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState(buildDraft());

  const visible = useMemo(
    () => purchases.filter((entry) => [entry.name, entry.category, entry.subcategory, entry.supplier].some((value) => value.toLowerCase().includes(query.toLowerCase()))),
    [purchases, query]
  );

  const totals = useMemo(
    () => ({
      eventCents: purchases.reduce((acc, entry) => acc + entry.eventValueCents, 0),
      monthlyCents: purchases.reduce((acc, entry) => acc + entry.monthlyEquivalentCents, 0),
      stockableCount: purchases.filter((entry) => entry.isStockable).length
    }),
    [purchases]
  );

  const availableSubcategories = [
    ...new Set([
      ...(purchaseCategoryOptions.find((option) => option.value === draft.category)?.subcategories ?? purchaseCategoryOptions[0].subcategories),
      ...(optionCatalog['cost-subcategory'] ?? []).map((entry) => entry.label)
    ])
  ];
  const supplierCatalog = optionCatalog.supplier ?? [];
  const costCenterCatalog = optionCatalog['cost-center'] ?? costCenterOptions.map((option) => ({ value: option, label: option }));
  const inventoryUnitCatalog = optionCatalog['inventory-unit'] ?? [];
  const categoryCatalog = optionCatalog['cost-category'] ?? purchaseCategoryOptions.map((option) => ({ value: option.value, label: option.value }));

  const openCreateModal = () => {
    setDraft(buildDraft());
    setModalOpen(true);
  };

  const openEditModal = (purchase: PurchaseItem) => {
    setDraft(buildDraft(purchase));
    setModalOpen(true);
  };

  const closeModal = () => {
    setDraft(buildDraft());
    setModalOpen(false);
  };

  const savePurchase = () => {
    if (!draft.name.trim()) return;
    if (draft.isStockable && (!draft.receivedQuantity || !draft.receivedUnit.trim())) return;

    addCatalogOption('cost-category', draft.category, draft.category);
    addCatalogOption('cost-subcategory', draft.subcategory, draft.subcategory);
    addCatalogOption('cost-center', draft.linkedCostCenter, draft.linkedCostCenter);
    addCatalogOption('inventory-unit', draft.receivedUnit, draft.receivedUnit);
    if (draft.supplier.trim()) {
      addCatalogOption('supplier', draft.supplier.trim(), draft.supplier.trim());
    }

    let inventoryProductId = draft.inventoryProductId || undefined;
    if (draft.isStockable && !inventoryProductId) {
      inventoryProductId = addProduct({
        name: draft.name.trim(),
        commercialName: draft.name.trim(),
        category: productCategoryByPurchaseCategory[draft.category] ?? 'outro',
        defaultUnit: draft.receivedUnit.trim() || 'unidade',
        notes: ''
      });
    }

    const payload: Partial<PurchaseItem> = {
      name: draft.name.trim(),
      category: draft.category,
      subcategory: draft.subcategory,
      supplier: draft.supplier.trim(),
      eventValueCents: draft.eventValueCents,
      monthlyEquivalentCents: draft.monthlyEquivalentCents,
      nextOccurrence: draft.nextOccurrence,
      linkedCropId: draft.linkedCropId || undefined,
      linkedCostCenter: draft.linkedCostCenter || undefined,
      notes: draft.notes.trim(),
      status: draft.status,
      isStockable: draft.isStockable,
      paymentStatus: draft.paymentStatus,
      receivedAt: draft.isStockable ? draft.receivedAt : '',
      receivedQuantity: draft.isStockable ? draft.receivedQuantity : 0,
      receivedUnit: draft.isStockable ? draft.receivedUnit.trim() : '',
      inventoryProductId
    };

    const purchaseId = draft.id ? draft.id : addPurchase(payload);
    if (draft.id) {
      updatePurchase(draft.id, payload);
    }

    if (draft.isStockable && inventoryProductId && draft.receivedQuantity > 0) {
      const existingLot = lots.find((lot) => lot.purchaseId === purchaseId);
      const unitCostCents = draft.receivedQuantity > 0 ? Math.round(draft.eventValueCents / draft.receivedQuantity) : 0;
      if (existingLot) {
        updateLot(existingLot.id, {
          productId: inventoryProductId,
          receivedAt: draft.receivedAt,
          quantityReceived: draft.receivedQuantity,
          unit: draft.receivedUnit.trim() || 'unidade',
          unitCostCents,
          locationName: draft.linkedCostCenter || 'Galpão principal',
          notes: draft.notes.trim()
        });
      } else {
        addLot({
          productId: inventoryProductId,
          purchaseId,
          receivedAt: draft.receivedAt,
          quantityReceived: draft.receivedQuantity,
          quantityAvailable: draft.receivedQuantity,
          unit: draft.receivedUnit.trim() || 'unidade',
          unitCostCents,
          locationName: draft.linkedCostCenter || 'Galpão principal',
          notes: draft.notes.trim()
        });
      }
    }

    closeModal();
  };

  return (
    <div className="page-stack">
      <DetailCard
        title="O que voce comprou?"
        subtitle="Primeiro diga o que foi comprado. Depois o sistema separa o que entrou e o que virou estoque."
        action={purchases.length > 0 ? <button type="button" className="cta-btn" onClick={openCreateModal} data-tour="new-purchase-btn">Nova compra</button> : undefined}
      >
        <div className="executive-grid">
          <ExecutiveCard title="Compras lancadas" value={formatCurrency(totals.eventCents)} helper="Quanto ja foi comprado" tone="danger" />
          <ExecutiveCard title="Pesa por mes" value={formatCurrency(totals.monthlyCents)} helper="Rotina do dia a dia" tone="warning" />
          <ExecutiveCard title="Planejado no ano" value={formatCurrency(totals.monthlyCents * 12)} helper="Conta anual prevista" tone="info" />
          <ExecutiveCard title="Ja virou estoque" value={String(totals.stockableCount)} helper="Compras que ficaram guardadas" tone="positive" />
        </div>
      </DetailCard>

      <DetailCard title="Compras registradas" subtitle="Aqui voce enxerga o que foi comprado, o que entrou e o que ficou guardado.">
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar por compra, categoria ou fornecedor" />

        {visible.length === 0 ? (
          <SmartEmptyState
            title={purchases.length === 0 ? 'Nenhuma compra cadastrada' : 'Nenhuma compra encontrada'}
            description={purchases.length === 0 ? 'Registre a primeira compra. O sistema vai perguntar se ela ficou guardada ou se foi para uso direto.' : 'Ajuste a busca ou cadastre uma nova compra.'}
            action={<button type="button" className="cta-btn" onClick={openCreateModal} data-tour="new-purchase-btn">{purchases.length === 0 ? 'Adicionar primeira compra' : 'Cadastrar nova compra'}</button>}
          />
        ) : (
          <div className="page-stack">
            {visible.map((purchase) => {
              const linkedLots = lots.filter((lot) => lot.purchaseId === purchase.id);
              return (
                <article key={purchase.id} className="detail-card tone-neutral">
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem' }}>{purchase.name}</h4>
                      <p style={{ marginTop: 4, color: '#5f6f64', fontSize: '0.84rem' }}>
                        {purchase.category} · {purchase.subcategory} · {purchase.supplier || 'Sem fornecedor'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <StatusChip label={purchase.isStockable ? 'Virou estoque' : 'Uso direto'} tone={purchase.isStockable ? 'low' : 'medium'} />
                      <StatusChip label={purchase.paymentStatus} tone={purchase.paymentStatus === 'pago' ? 'low' : purchase.paymentStatus === 'parcial' ? 'medium' : 'high'} />
                      <StatusChip label={purchase.status} tone={purchase.status === 'ativo' ? 'low' : purchase.status === 'pendente' ? 'medium' : 'neutral'} />
                    </div>
                  </div>

                  <div className="executive-grid" style={{ marginTop: 12 }}>
                    <ExecutiveCard title="Valor total" value={formatCurrency(purchase.eventValueCents)} tone="danger" />
                    <ExecutiveCard title="Quanto chegou" value={purchase.receivedQuantity ? `${purchase.receivedQuantity} ${purchase.receivedUnit || ''}` : 'Ainda não entrou'} helper={purchase.receivedAt ? `Entrada em ${formatDate(purchase.receivedAt)}` : 'Sem entrada'} tone="warning" />
                    <ExecutiveCard title="Vai para" value={purchase.linkedCostCenter || 'Sem destino'} helper={crops.find((crop) => crop.id === purchase.linkedCropId)?.name || 'Sem cultura'} tone="info" />
                    <ExecutiveCard title="Lotes criados" value={String(linkedLots.length)} helper={linkedLots.length > 0 ? linkedLots.map((lot) => lot.code).join(', ') : 'Compra ainda sem lote'} tone={linkedLots.length > 0 ? 'positive' : 'neutral'} />
                  </div>

                  <div className="action-row" style={{ marginTop: 12 }}>
                    <button type="button" className="ghost-btn" onClick={() => openEditModal(purchase)}>Editar</button>
                    <button type="button" className="ghost-btn" onClick={() => removePurchase(purchase.id)} disabled={linkedLots.length > 0}>
                      Remover
                    </button>
                    {linkedLots.length > 0 && <StatusChip label="Já virou estoque" tone={lotTone(linkedLots.length)} />}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </DetailCard>

      <CenterModal
        open={modalOpen}
        title={draft.id ? 'Editar compra' : 'Nova compra'}
        subtitle="Responda em passos simples: o que comprou, quanto chegou e se ficou guardado."
        onClose={closeModal}
        onHelp={() => startTour('purchase-wizard')}
        footer={
          <div className="wizard-footer">
            <span className="modal-note">Compra so vira custo real quando sair do estoque ou for usada de verdade.</span>
            <div className="wizard-actions">
              <button type="button" className="ghost-btn" onClick={closeModal}>Cancelar</button>
              <button type="button" className="cta-btn" onClick={savePurchase} disabled={!draft.name.trim() || (draft.isStockable && (!draft.receivedQuantity || !draft.receivedUnit.trim()))}>
                {draft.id ? 'Salvar compra' : 'Criar compra'}
              </button>
            </div>
          </div>
        }
      >
        <div className="modal-form-grid">
          <label data-tour="purchase-name">
            O que voce comprou?
            <input className="input-dark" value={draft.name} onChange={(event) => setDraft((state) => ({ ...state, name: event.target.value }))} />
          </label>
          <label data-tour="purchase-supplier">
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
          <label data-tour="purchase-category">
            Categoria
            <CreatableSelect
              value={draft.category}
              options={categoryCatalog}
              onChange={(value) =>
                setDraft((state) => ({
                  ...state,
                  category: value,
                  subcategory: purchaseCategoryOptions.find((option) => option.value === value)?.subcategories[0] ?? 'Outro'
                }))
              }
              onCreate={(label) => addCatalogOption('cost-category', label, label)}
              createLabel="Criar categoria"
            />
          </label>
          <label>
            Subcategoria
            <CreatableSelect
              value={draft.subcategory}
              options={availableSubcategories.map((subcategory) => ({ value: subcategory, label: subcategory }))}
              onChange={(value) => setDraft((state) => ({ ...state, subcategory: value }))}
              onCreate={(label) => addCatalogOption('cost-subcategory', label, label)}
              createLabel="Criar subcategoria"
            />
          </label>
          <label data-tour="purchase-value">
            Valor total
            <MoneyField valueCents={draft.eventValueCents} onChange={(nextValueCents) => setDraft((state) => ({ ...state, eventValueCents: nextValueCents }))} />
          </label>
          <label>
            Pesa por mes
            <MoneyField valueCents={draft.monthlyEquivalentCents} onChange={(nextValueCents) => setDraft((state) => ({ ...state, monthlyEquivalentCents: nextValueCents }))} />
          </label>
          <label data-tour="purchase-stockable">
            Isso ficou guardado?
            <select className="select-dark" value={draft.isStockable ? 'sim' : 'nao'} onChange={(event) => setDraft((state) => ({ ...state, isStockable: event.target.value === 'sim' }))}>
              <option value="sim">Sim, ficou guardado</option>
              <option value="nao">Não, foi para uso direto</option>
            </select>
          </label>
          <label>
            Ja pagou isso?
            <select className="select-dark" value={draft.paymentStatus} onChange={(event) => setDraft((state) => ({ ...state, paymentStatus: event.target.value as PurchasePaymentStatus }))}>
              {paymentStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          {draft.isStockable && (
            <>
              <label>
                Quando entrou?
                <input type="date" className="input-dark" value={draft.receivedAt} onChange={(event) => setDraft((state) => ({ ...state, receivedAt: event.target.value }))} />
              </label>
              <label>
                Quanto entrou de verdade?
                <NumberField step="0.01" value={draft.receivedQuantity || ''} onChange={(event) => setDraft((state) => ({ ...state, receivedQuantity: Number(event.target.value || 0) }))} suffix={formatUnitLabel(draft.receivedUnit || 'unidade')} />
              </label>
              <label>
                Unidade
                <CreatableSelect
                  value={draft.receivedUnit}
                  options={inventoryUnitCatalog}
                  onChange={(value) => setDraft((state) => ({ ...state, receivedUnit: value }))}
                  onCreate={(label) => addCatalogOption('inventory-unit', label, label)}
                  createLabel="Criar unidade"
                />
              </label>
              <label>
                Nome no estoque
                <select className="select-dark" value={draft.inventoryProductId} onChange={(event) => setDraft((state) => ({ ...state, inventoryProductId: event.target.value }))}>
                  <option value="">Criar a partir do nome da compra</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
              </label>
            </>
          )}
          <label>
            Isso foi para qual cultura?
            <select className="select-dark" value={draft.linkedCropId} onChange={(event) => setDraft((state) => ({ ...state, linkedCropId: event.target.value }))}>
              <option value="">Sem cultura</option>
              {crops.map((crop) => <option key={crop.id} value={crop.id}>{crop.name}</option>)}
            </select>
          </label>
          <label data-tour="purchase-destination">
            Onde isso vai ser usado?
            <CreatableSelect
              value={draft.linkedCostCenter}
              options={costCenterCatalog}
              onChange={(value) => setDraft((state) => ({ ...state, linkedCostCenter: value }))}
              onCreate={(label) => addCatalogOption('cost-center', label, label)}
              createLabel="Criar destino"
            />
          </label>
          <label>
            Como essa compra ficou?
            <select className="select-dark" value={draft.status} onChange={(event) => setDraft((state) => ({ ...state, status: event.target.value as PurchaseStatus }))}>
              {purchaseStatusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label>
            Tem nova compra prevista?
            <input type="date" className="input-dark" value={draft.nextOccurrence} onChange={(event) => setDraft((state) => ({ ...state, nextOccurrence: event.target.value }))} />
          </label>
          <label className="span-2">
            Algo importante sobre essa compra?
            <textarea className="textarea-dark" value={draft.notes} onChange={(event) => setDraft((state) => ({ ...state, notes: event.target.value }))} placeholder="Ex.: compra da semana, reforco para irrigacao, protecao da folhosa" />
          </label>
        </div>
      </CenterModal>
    </div>
  );
};
