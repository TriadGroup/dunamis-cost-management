import { useMemo, useState, type SetStateAction } from 'react';
import { useFieldOperationsStore } from '@/app/store/useFieldOperationsStore';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import { useOptionCatalogStore } from '@/app/store/useOptionCatalogStore';
import { useProductionPlanningStore } from '@/app/store/useProductionPlanningStore';
import { calculateAverageUnitCost, type InventoryLot, type InventoryProduct } from '@/entities';
import { formatCurrency, formatDate, formatNumber, formatUnitLabel } from '@/shared/lib/format';
import { usePersistentDraftState } from '@/shared/lib/usePersistentDraftState';
import { CenterModal, ContextHelp, CreatableSelect, DetailCard, ExecutiveCard, MoneyField, NumberField, SearchBar, SmartEmptyState, StatusChip } from '@/shared/ui';

type InventoryModalMode = 'entry' | 'usage' | 'loss' | null;
type ProductCategory = InventoryProduct['category'];
type UsageTargetType = 'geral' | 'cultura' | 'plano' | 'lote' | 'area';

const productCategoryOptions: Array<{ value: ProductCategory; label: string }> = [
  { value: 'adubo', label: 'Adubo' },
  { value: 'defensivo', label: 'Defensivo' },
  { value: 'corretivo', label: 'Corretivo' },
  { value: 'semente', label: 'Semente' },
  { value: 'muda', label: 'Muda' },
  { value: 'embalagem', label: 'Embalagem' },
  { value: 'combustivel', label: 'Combustível' },
  { value: 'outro', label: 'Outro' }
];

const buildEntryDraft = () => ({
  productId: '',
  newProductName: '',
  category: 'outro' as ProductCategory,
  unit: 'unidade',
  quantityReceived: 0,
  unitCostCents: 0,
  receivedAt: new Date().toISOString().slice(0, 10),
  expirationDate: '',
  locationName: 'Galpão principal',
  notes: ''
});

const buildUsageDraft = () => ({
  inventoryLotId: '',
  quantity: 0,
  occurredAt: new Date().toISOString().slice(0, 10),
  targetType: 'geral' as UsageTargetType,
  targetId: '',
  reason: ''
});

const buildLossDraft = () => ({
  inventoryLotId: '',
  quantity: 0,
  occurredAt: new Date().toISOString().slice(0, 10),
  cause: 'descarte' as const,
  notes: ''
});

interface InventoryEditorState {
  mode: InventoryModalMode;
  entryDraft: ReturnType<typeof buildEntryDraft>;
  usageDraft: ReturnType<typeof buildUsageDraft>;
  lossDraft: ReturnType<typeof buildLossDraft>;
}

const buildEditorState = (): InventoryEditorState => ({
  mode: null,
  entryDraft: buildEntryDraft(),
  usageDraft: buildUsageDraft(),
  lossDraft: buildLossDraft()
});

const lotTone = (lot: InventoryLot): 'low' | 'medium' | 'high' | 'neutral' => {
  if (lot.status === 'vencido') return 'high';
  if (lot.status === 'parcial') return 'medium';
  if (lot.status === 'encerrado') return 'neutral';
  return 'low';
};

export const InventoryModule = () => {
  const products = useInventoryStore((state) => state.products);
  const lots = useInventoryStore((state) => state.lots);
  const movements = useInventoryStore((state) => state.movements);
  const addProduct = useInventoryStore((state) => state.addProduct);
  const addLot = useInventoryStore((state) => state.addLot);
  const addMovement = useInventoryStore((state) => state.addMovement);
  const losses = useFieldOperationsStore((state) => state.losses);
  const addLossEvent = useFieldOperationsStore((state) => state.addLossEvent);
  const crops = useProductionPlanningStore((state) => state.crops);
  const plans = useProductionPlanningStore((state) => state.plans);
  const beds = useProductionPlanningStore((state) => state.beds);
  const inventoryUnitOptions = useOptionCatalogStore((state) => state.getOptions('inventory-unit'));
  const inventoryLocationOptions = useOptionCatalogStore((state) => state.getOptions('inventory-location'));
  const addCatalogOption = useOptionCatalogStore((state) => state.addOption);

  const [query, setQuery] = useState('');
  const {
    value: editorState,
    setValue: setEditorState,
    clear: clearEditorState
  } = usePersistentDraftState<InventoryEditorState>('dunamis-farm-os-inventory-editor-draft-v1', buildEditorState);
  const { mode, entryDraft, usageDraft, lossDraft } = editorState;

  const setMode = (nextMode: InventoryModalMode) => {
    setEditorState((state) => ({
      ...state,
      mode: nextMode
    }));
  };

  const setEntryDraft = (nextValue: SetStateAction<ReturnType<typeof buildEntryDraft>>) => {
    setEditorState((state) => ({
      ...state,
      entryDraft: typeof nextValue === 'function' ? nextValue(state.entryDraft) : nextValue
    }));
  };

  const setUsageDraft = (nextValue: SetStateAction<ReturnType<typeof buildUsageDraft>>) => {
    setEditorState((state) => ({
      ...state,
      usageDraft: typeof nextValue === 'function' ? nextValue(state.usageDraft) : nextValue
    }));
  };

  const setLossDraft = (nextValue: SetStateAction<ReturnType<typeof buildLossDraft>>) => {
    setEditorState((state) => ({
      ...state,
      lossDraft: typeof nextValue === 'function' ? nextValue(state.lossDraft) : nextValue
    }));
  };

  const visibleLots = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lots;
    return lots.filter((lot) => {
      const product = products.find((entry) => entry.id === lot.productId);
      return [lot.code, lot.locationName, product?.name, product?.commercialName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [lots, products, query]);

  const summary = useMemo(() => {
    const openLots = lots.filter((lot) => lot.quantityAvailable > 0);
    const expiringLots = lots.filter((lot) => {
      if (!lot.expirationDate) return false;
      const diffDays = Math.round((new Date(lot.expirationDate).getTime() - Date.now()) / 86400000);
      return diffDays <= 15;
    });
    const reservedMovements = movements.filter((entry) => entry.movementType === 'reserva').length;

    return {
      products: new Set(openLots.map((lot) => lot.productId)).size,
      openLots: openLots.length,
      reservedMovements,
      expiringLots: expiringLots.length,
      lossCount: losses.filter((entry) => entry.sourceType === 'estoque').length
    };
  }, [lots, losses, movements]);

  const destinationOptions = useMemo(
    () => ({
      cultura: crops.map((crop) => ({ id: crop.id, label: crop.name })),
      plano: plans.map((plan) => ({ id: plan.id, label: `${crops.find((crop) => crop.id === plan.cropId)?.name || 'Plano'} · ${plan.bedCount} canteiro(s)` })),
      lote: [],
      area: beds.map((bed) => ({ id: bed.id, label: bed.name }))
    }),
    [beds, crops, plans]
  );

  const activeUsageLot = lots.find((lot) => lot.id === usageDraft.inventoryLotId) ?? null;
  const activeLossLot = lots.find((lot) => lot.id === lossDraft.inventoryLotId) ?? null;

  const closeModal = () => {
    clearEditorState();
  };

  const saveEntry = () => {
    const productName = entryDraft.newProductName.trim();
    let productId = entryDraft.productId;
    const resolvedUnit = entryDraft.unit.trim() || 'unidade';
    const resolvedLocation = entryDraft.locationName.trim() || 'Galpão principal';
    if (!productId) {
      if (!productName) return;
      productId = addProduct({
        name: productName,
        commercialName: productName,
        category: entryDraft.category,
        defaultUnit: resolvedUnit,
        notes: ''
      });
    }

    if (!entryDraft.quantityReceived || !entryDraft.unitCostCents) return;

    addCatalogOption('inventory-unit', resolvedUnit, resolvedUnit);
    addCatalogOption('inventory-location', resolvedLocation, resolvedLocation);

    addLot({
      productId,
      purchaseId: null,
      receivedAt: entryDraft.receivedAt,
      quantityReceived: entryDraft.quantityReceived,
      quantityAvailable: entryDraft.quantityReceived,
      unit: resolvedUnit,
      unitCostCents: entryDraft.unitCostCents,
      expirationDate: entryDraft.expirationDate,
      locationName: resolvedLocation,
      notes: entryDraft.notes
    });

    closeModal();
  };

  const saveUsage = () => {
    if (!usageDraft.inventoryLotId || usageDraft.quantity <= 0 || !activeUsageLot) return;
    if (usageDraft.quantity > activeUsageLot.quantityAvailable) return;

    addMovement({
      inventoryLotId: usageDraft.inventoryLotId,
      movementType: 'uso',
      quantity: usageDraft.quantity,
      unit: activeUsageLot.unit,
      occurredAt: usageDraft.occurredAt,
      targetType: usageDraft.targetType,
      targetId: usageDraft.targetId || null,
      reason: usageDraft.reason,
      notes: ''
    });

    closeModal();
  };

  const saveLoss = () => {
    if (!lossDraft.inventoryLotId || lossDraft.quantity <= 0 || !activeLossLot) return;
    if (lossDraft.quantity > activeLossLot.quantityAvailable) return;

    addMovement({
      inventoryLotId: lossDraft.inventoryLotId,
      movementType: 'perda',
      quantity: lossDraft.quantity,
      unit: activeLossLot.unit,
      occurredAt: lossDraft.occurredAt,
      targetType: 'geral',
      targetId: null,
      reason: lossDraft.cause,
      notes: lossDraft.notes
    });

    addLossEvent({
      date: lossDraft.occurredAt,
      cause: lossDraft.cause,
      sourceType: 'estoque',
      sourceId: lossDraft.inventoryLotId,
      quantity: lossDraft.quantity,
      unit: activeLossLot.unit,
      estimatedCostCents: Math.round(activeLossLot.unitCostCents * lossDraft.quantity),
      notes: lossDraft.notes
    });

    closeModal();
  };

  return (
    <div className="page-stack" data-tour="inventory-stack">
      <DetailCard
        eyebrow="Insumos"
        data-tour="inventory-main-card"
        title="O que entrou e o que ainda esta guardado"
        subtitle="Aqui voce ve o que chegou, o que sobrou e o que ainda pode ser usado."
        action={
          <div className="action-row" style={{ gap: 10 }}>
            <button type="button" className="ghost-btn" onClick={() => setMode('entry')}>Registrar entrada</button>
            <button type="button" className="ghost-btn" onClick={() => setMode('usage')}>Registrar uso</button>
            <button type="button" className="cta-btn" onClick={() => setMode('loss')}>Registrar perda</button>
          </div>
        }
      >
        <div className="executive-grid">
          <ExecutiveCard title="Produtos guardados" value={String(summary.products)} helper="Com saldo aberto" tone="info" />
          <ExecutiveCard title="Lotes abertos" value={String(summary.openLots)} helper="Ainda com saldo" tone="neutral" />
          <ExecutiveCard title="Saídas reservadas" value={String(summary.reservedMovements)} helper="Movimentos já separados" tone="warning" />
          <ExecutiveCard title="Vence logo" value={String(summary.expiringLots)} helper={`${summary.lossCount} perda(s) ja lancada(s)`} tone={summary.expiringLots > 0 ? 'danger' : 'positive'} />
        </div>
      </DetailCard>

      <DetailCard title="Lotes do estoque" subtitle="Saldo, custo e vencimento em um so lugar">
        <SearchBar value={query} onChange={setQuery} placeholder="Buscar por produto, lote ou local" />
        {visibleLots.length === 0 ? (
          <SmartEmptyState
            title="Nenhum lote no estoque ainda"
            description="Registre a primeira entrada para separar o que foi comprado do que realmente ficou guardado."
            action={<button type="button" className="cta-btn" onClick={() => setMode('entry')}>Registrar primeira entrada</button>}
          />
        ) : (
          <div className="table-lite-wrap" data-tour="inventory-table">
            <table className="table-lite">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Lote do estoque</th>
                <th>Saldo <ContextHelp text="É o que ainda está guardado e pronto para uso." /></th>
                <th>Custo médio</th>
                <th>Local</th>
                <th>Vence em</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {visibleLots.map((lot) => {
                const product = products.find((entry) => entry.id === lot.productId);
                return (
                  <tr key={lot.id}>
                    <td>{product?.name || 'Produto sem nome'}</td>
                    <td>{lot.code}</td>
                    <td>{`${formatNumber(lot.quantityAvailable, 0)} ${lot.unit}`}</td>
                    <td>{formatCurrency(calculateAverageUnitCost(lot.productId, lots))}</td>
                    <td>{lot.locationName}</td>
                    <td>{formatDate(lot.expirationDate)}</td>
                    <td><StatusChip label={lot.status} tone={lotTone(lot)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}
      </DetailCard>

      <CenterModal
        open={mode === 'entry'}
        title="Registrar entrada"
        subtitle="Diga o que entrou de verdade e onde isso ficou guardado."
        onClose={closeModal}
        footer={
          <div className="wizard-footer">
            <span className="modal-note">A entrada cria o lote do estoque.</span>
            <div className="wizard-actions">
              <button type="button" className="ghost-btn" onClick={closeModal}>Cancelar</button>
              <button type="button" className="cta-btn" onClick={saveEntry} disabled={!entryDraft.quantityReceived || !entryDraft.unitCostCents || (!entryDraft.productId && !entryDraft.newProductName.trim())}>
                Salvar entrada
              </button>
            </div>
          </div>
        }
      >
        <div className="modal-form-grid">
          <label>
            Esse produto ja existe?
            <select
              className="select-dark"
              value={entryDraft.productId}
              onChange={(event) => {
                const selectedProduct = products.find((product) => product.id === event.target.value);
                setEntryDraft((state) => ({
                  ...state,
                  productId: event.target.value,
                  unit: selectedProduct?.defaultUnit || state.unit,
                  category: selectedProduct?.category || state.category
                }));
              }}
            >
              <option value="">Criar produto novo</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </label>
          {!entryDraft.productId && (
            <label>
              O que entrou?
              <input className="input-dark" value={entryDraft.newProductName} onChange={(event) => setEntryDraft((state) => ({ ...state, newProductName: event.target.value }))} />
            </label>
          )}
          {!entryDraft.productId && (
            <label>
              O que e isso?
              <select className="select-dark" value={entryDraft.category} onChange={(event) => setEntryDraft((state) => ({ ...state, category: event.target.value as ProductCategory }))}>
                {productCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            Quando entrou?
            <input type="date" className="input-dark" value={entryDraft.receivedAt} onChange={(event) => setEntryDraft((state) => ({ ...state, receivedAt: event.target.value }))} />
          </label>
          <label>
            Quanto entrou de verdade?
            <NumberField
              step="0.01"
              value={entryDraft.quantityReceived || ''}
              onChange={(event) => setEntryDraft((state) => ({ ...state, quantityReceived: Number(event.target.value || 0) }))}
              suffix={formatUnitLabel(entryDraft.unit || 'unidade')}
            />
          </label>
          <label>
            Unidade
            <CreatableSelect
              value={entryDraft.unit}
              options={inventoryUnitOptions}
              placeholder="Escolha a unidade"
              onChange={(value) => setEntryDraft((state) => ({ ...state, unit: value }))}
              onCreate={(label) => addCatalogOption('inventory-unit', label, label)}
              createLabel="Criar unidade"
            />
          </label>
          <label>
            {`Quanto custou por ${formatUnitLabel(entryDraft.unit || 'unidade')}?`}
            <MoneyField valueCents={entryDraft.unitCostCents} onChange={(nextValueCents) => setEntryDraft((state) => ({ ...state, unitCostCents: nextValueCents }))} />
          </label>
          <label>
            Onde ficou guardado?
            <CreatableSelect
              value={entryDraft.locationName}
              options={inventoryLocationOptions}
              placeholder="Escolha o local"
              onChange={(value) => setEntryDraft((state) => ({ ...state, locationName: value }))}
              onCreate={(label) => addCatalogOption('inventory-location', label, label)}
              createLabel="Criar local"
            />
          </label>
          <label>
            Vence quando?
            <input type="date" className="input-dark" value={entryDraft.expirationDate} onChange={(event) => setEntryDraft((state) => ({ ...state, expirationDate: event.target.value }))} />
          </label>
          <label className="span-2">
            Algo importante sobre essa entrada?
            <textarea className="textarea-dark" value={entryDraft.notes} onChange={(event) => setEntryDraft((state) => ({ ...state, notes: event.target.value }))} />
          </label>
        </div>
      </CenterModal>

      <CenterModal
        open={mode === 'usage'}
        title="Registrar saida"
        subtitle="Diga o que saiu do estoque e para onde isso foi."
        onClose={closeModal}
        footer={
          <div className="wizard-footer">
            <span className="modal-note">Se isso foi direto para a cultura, o proximo passo e registrar a aplicacao.</span>
            <div className="wizard-actions">
              <button type="button" className="ghost-btn" onClick={closeModal}>Cancelar</button>
              <button type="button" className="cta-btn" onClick={saveUsage} disabled={!usageDraft.inventoryLotId || usageDraft.quantity <= 0 || !usageDraft.reason.trim()}>
                Salvar uso
              </button>
            </div>
          </div>
        }
      >
        <div className="modal-form-grid">
          <label>
            De qual lote saiu?
            <select className="select-dark" value={usageDraft.inventoryLotId} onChange={(event) => setUsageDraft((state) => ({ ...state, inventoryLotId: event.target.value }))}>
              <option value="">Selecione</option>
              {lots.filter((lot) => lot.quantityAvailable > 0).map((lot) => {
                const product = products.find((entry) => entry.id === lot.productId);
                return (
                  <option key={lot.id} value={lot.id}>{`${product?.name || 'Produto'} · ${lot.code} · ${formatNumber(lot.quantityAvailable, 0)} ${lot.unit}`}</option>
                );
              })}
            </select>
          </label>
          <label>
            Quanto saiu?
            <NumberField
              step="0.01"
              value={usageDraft.quantity || ''}
              onChange={(event) => setUsageDraft((state) => ({ ...state, quantity: Number(event.target.value || 0) }))}
              suffix={formatUnitLabel(activeUsageLot?.unit || 'unidade')}
            />
          </label>
          <label>
            Data
            <input type="date" className="input-dark" value={usageDraft.occurredAt} onChange={(event) => setUsageDraft((state) => ({ ...state, occurredAt: event.target.value }))} />
          </label>
          <label>
            Foi para onde?
            <select className="select-dark" value={usageDraft.targetType} onChange={(event) => setUsageDraft((state) => ({ ...state, targetType: event.target.value as UsageTargetType, targetId: '' }))}>
              <option value="geral">Uso geral</option>
              <option value="cultura">Cultura</option>
              <option value="plano">Plano</option>
              <option value="area">Área / canteiro</option>
            </select>
          </label>
          {usageDraft.targetType !== 'geral' && usageDraft.targetType !== 'lote' && (
            <label className="span-2">
              Onde exatamente?
              <select className="select-dark" value={usageDraft.targetId} onChange={(event) => setUsageDraft((state) => ({ ...state, targetId: event.target.value }))}>
                <option value="">Selecione</option>
                {(usageDraft.targetType === 'cultura'
                  ? destinationOptions.cultura
                  : usageDraft.targetType === 'plano'
                    ? destinationOptions.plano
                    : destinationOptions.area
                ).map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.label}</option>
                ))}
              </select>
            </label>
          )}
          <label className="span-2">
            O que aconteceu com esse produto?
            <input className="input-dark" value={usageDraft.reason} onChange={(event) => setUsageDraft((state) => ({ ...state, reason: event.target.value }))} placeholder="Ex.: foi para embalagem do box, preparo do solo, uso geral do campo" />
          </label>
        </div>
      </CenterModal>

      <CenterModal
        open={mode === 'loss'}
        title="Registrar perda"
        subtitle="Se perdeu, descarte ou venceu, registre aqui para o saldo ficar honesto."
        onClose={closeModal}
        footer={
          <div className="wizard-footer">
            <span className="modal-note">A perda reduz saldo e fica registrada para auditoria.</span>
            <div className="wizard-actions">
              <button type="button" className="ghost-btn" onClick={closeModal}>Cancelar</button>
              <button type="button" className="cta-btn" onClick={saveLoss} disabled={!lossDraft.inventoryLotId || lossDraft.quantity <= 0}>
                Salvar perda
              </button>
            </div>
          </div>
        }
      >
        <div className="modal-form-grid">
          <label>
            De qual lote foi a perda?
            <select className="select-dark" value={lossDraft.inventoryLotId} onChange={(event) => setLossDraft((state) => ({ ...state, inventoryLotId: event.target.value }))}>
              <option value="">Selecione</option>
              {lots.filter((lot) => lot.quantityAvailable > 0).map((lot) => {
                const product = products.find((entry) => entry.id === lot.productId);
                return (
                  <option key={lot.id} value={lot.id}>{`${product?.name || 'Produto'} · ${lot.code}`}</option>
                );
              })}
            </select>
          </label>
          <label>
            Quanto se perdeu?
            <NumberField
              step="0.01"
              value={lossDraft.quantity || ''}
              onChange={(event) => setLossDraft((state) => ({ ...state, quantity: Number(event.target.value || 0) }))}
              suffix={formatUnitLabel(activeLossLot?.unit || 'unidade')}
            />
          </label>
          <label>
            Data
            <input type="date" className="input-dark" value={lossDraft.occurredAt} onChange={(event) => setLossDraft((state) => ({ ...state, occurredAt: event.target.value }))} />
          </label>
          <label>
            O que aconteceu?
            <select className="select-dark" value={lossDraft.cause} onChange={(event) => setLossDraft((state) => ({ ...state, cause: event.target.value as typeof lossDraft.cause }))}>
              <option value="descarte">Descarte</option>
              <option value="vencimento">Vencimento</option>
              <option value="quebra">Quebra</option>
              <option value="evaporacao">Evaporação</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          <label className="span-2">
            Algo importante sobre essa perda?
            <textarea className="textarea-dark" value={lossDraft.notes} onChange={(event) => setLossDraft((state) => ({ ...state, notes: event.target.value }))} />
          </label>
        </div>
      </CenterModal>
    </div>
  );
};
