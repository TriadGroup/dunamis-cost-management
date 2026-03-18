import { useEffect, useMemo, useState } from 'react';
import {
  useSetupStore,
  type ChannelOption,
  type FinancialStartingPoint,
  type ProductionProfileOption,
  type StructureEntry,
  type StructureTypeOption
} from '@/app/store/useSetupStore';
import { applySetupWorkspace, resetWorkspaceToEmpty } from '@/app/store/setupWorkspace';
import { createId } from '@/app/store/id';
import { usePersistentDraftState } from '@/shared/lib/usePersistentDraftState';
import { BrandLogo, CenterModal, DetailCard, ExecutiveCard, StatusChip, UiIcon } from '@/shared/ui';
import { FarmLocationField } from '@/features/setup/components/FarmLocationField';

const setupSteps = [
  { id: 'identidade', label: 'Terra', icon: 'home' as const },
  { id: 'perfil', label: 'Perfil', icon: 'seed' as const },
  { id: 'estrutura', label: 'Estrutura', icon: 'panel' as const },
  { id: 'canais', label: 'Destino', icon: 'flow' as const },
  { id: 'cultivos', label: 'Cultivos', icon: 'magic' as const },
  { id: 'financeiro', label: 'Dinheiro', icon: 'wallet' as const },
  { id: 'resumo', label: 'Resumo', icon: 'target' as const },
  { id: 'pronto', label: 'Pronto', icon: 'result' as const }
];

const profileOptions: Array<{ id: ProductionProfileOption; label: string; icon: 'seed' | 'tractor' | 'trace' | 'panel' | 'flow'; hint: string }> = [
  { id: 'horta', label: 'Horta', icon: 'seed', hint: 'Ciclo curto' },
  { id: 'grande_cultura', label: 'Grande cultura', icon: 'tractor', hint: 'Área e safra' },
  { id: 'pomar', label: 'Pomar', icon: 'seed', hint: 'Perene' },
  { id: 'cultivo_protegido', label: 'Protegido', icon: 'panel', hint: 'Estufa' },
  { id: 'agrofloresta', label: 'Agrofloresta', icon: 'seed', hint: 'Sistema misto' },
  { id: 'pecuaria', label: 'Pecuária', icon: 'tractor', hint: 'Manejo animal' },
  { id: 'viveiro', label: 'Viveiro', icon: 'trace', hint: 'Mudas e origem' },
  { id: 'operacao_mista', label: 'Mista', icon: 'flow', hint: 'Mais de uma frente' }
];

const structureOptions: Array<{ id: StructureTypeOption; label: string }> = [
  { id: 'canteiros', label: 'Canteiros' },
  { id: 'estufas', label: 'Estufas' },
  { id: 'talhoes', label: 'Talhoes' },
  { id: 'areas_irrigadas', label: 'Irrigadas' },
  { id: 'areas_mecanizadas', label: 'Mecanizadas' },
  { id: 'pomar', label: 'Pomar' },
  { id: 'cozinha_interna', label: 'Cozinha' },
  { id: 'box', label: 'Box' },
  { id: 'deposito', label: 'Deposito' },
  { id: 'oficina', label: 'Oficina' },
  { id: 'camara_fria', label: 'Camara fria' },
  { id: 'viveiro', label: 'Viveiro' },
  { id: 'outro', label: 'Outro' }
];

const channelOptions: Array<{ id: ChannelOption; label: string }> = [
  { id: 'cozinha_interna', label: 'Cozinha' },
  { id: 'box', label: 'Box' },
  { id: 'feira_eventos', label: 'Feira' },
  { id: 'mercado_regional', label: 'Mercado' },
  { id: 'venda_direta', label: 'Direta' },
  { id: 'atacado_granel', label: 'Granel' },
  { id: 'excedente', label: 'Excedente' },
  { id: 'consumo_interno', label: 'Consumo' },
  { id: 'doacao', label: 'Doacao' }
];

const cropCatalog: Record<string, string[]> = {
  folhosas: ['Alface', 'Rucula', 'Couve', 'Acelga'],
  legumes: ['Tomate', 'Pepino', 'Abobrinha', 'Vagem'],
  ervas: ['Coentro', 'Cebolinha', 'Manjericao', 'Salsa'],
  frutas: ['Morango', 'Mamao', 'Banana', 'Maracuja'],
  raizes: ['Cenoura', 'Beterraba', 'Rabanete', 'Batata doce'],
  grandes_culturas: ['Milho', 'Feijao', 'Soja', 'Mandioca'],
  outros: ['Flores comestiveis', 'Broto', 'Microverdes']
};

const financialOptions: Array<{ id: FinancialStartingPoint; label: string; short: string; helper: string }> = [
  { id: 'implantacao', label: 'Implantacao e orcamento inicial', short: 'Comecar', helper: 'Para organizar o que falta para montar a operacao.' },
  { id: 'importar_planilhas', label: 'Trazer planilhas depois', short: 'Planilhas', helper: 'Para continuar leve agora e importar dados mais tarde.' },
  { id: 'custos_recorrentes', label: 'Gastos do dia a dia', short: 'Custos', helper: 'Para registrar insumos, rotina e despesas da fazenda.' },
  { id: 'ativos_equipamentos', label: 'Maquinas, ativos e manutencao', short: 'Ativos', helper: 'Para cuidar de implementos, paradas e custo de uso.' },
  { id: 'investimentos_financiamentos', label: 'Parcelas e contratos', short: 'Contratos', helper: 'Para acompanhar financiamentos e compromissos maiores.' },
  { id: 'estrutura_minima', label: 'So o basico por enquanto', short: 'Simples', helper: 'Para entrar rapido e aprofundar depois.' }
];

const hasStructure = (structures: StructureEntry[], type: StructureTypeOption): StructureEntry | undefined => {
  return structures.find((entry) => entry.type === type);
};

const profileIcon = (id: ProductionProfileOption) => {
  const option = profileOptions.find((entry) => entry.id === id);
  return option?.icon ?? 'seed';
};

const getRecommendedFinancialStart = (
  profiles: ProductionProfileOption[],
  _structureEntries: StructureEntry[],
  _selectedChannels: ChannelOption[]
): FinancialStartingPoint => {
  if (profiles.includes('grande_cultura') || profiles.includes('pomar')) {
    return 'ativos_equipamentos';
  }

  if (profiles.includes('pecuaria')) {
    return 'custos_recorrentes';
  }

  if (profiles.includes('horta') || profiles.includes('cultivo_protegido') || profiles.includes('viveiro')) {
    return 'implantacao';
  }

  if (profiles.includes('agrofloresta') || profiles.includes('operacao_mista')) {
    return 'custos_recorrentes';
  }

  return 'estrutura_minima';
};

export const SetupExperience = () => {
  const status = useSetupStore((state) => state.status);
  const currentStep = useSetupStore((state) => state.currentStep);
  const identity = useSetupStore((state) => state.identity);
  const productionProfiles = useSetupStore((state) => state.productionProfiles);
  const structures = useSetupStore((state) => state.structures);
  const channels = useSetupStore((state) => state.channels);
  const initialCrops = useSetupStore((state) => state.initialCrops);
  const customCrops = useSetupStore((state) => state.customCrops);
  const financialStartingPoints = useSetupStore((state) => state.financialStartingPoints);
  const hasChosenFinancialStartingPoint = useSetupStore((state) => state.hasChosenFinancialStartingPoint);
  const startSetup = useSetupStore((state) => state.startSetup);
  const returnToLanding = useSetupStore((state) => state.returnToLanding);
  const setCurrentStep = useSetupStore((state) => state.setCurrentStep);
  const updateIdentity = useSetupStore((state) => state.updateIdentity);
  const toggleProductionProfile = useSetupStore((state) => state.toggleProductionProfile);
  const setStructures = useSetupStore((state) => state.setStructures);
  const setChannels = useSetupStore((state) => state.setChannels);
  const toggleInitialCrop = useSetupStore((state) => state.toggleInitialCrop);
  const addCustomCrop = useSetupStore((state) => state.addCustomCrop);
  const setFinancialStartingPoints = useSetupStore((state) => state.setFinancialStartingPoints);
  const markFinancialStartingPointAsChosen = useSetupStore((state) => state.markFinancialStartingPointAsChosen);
  const completeSetup = useSetupStore((state) => state.completeSetup);
  const [draggedChannel, setDraggedChannel] = useState<ChannelOption | null>(null);
  const {
    value: customCropDraft,
    setValue: setCustomCropDraft,
    clear: clearCustomCropDraft
  } = usePersistentDraftState('dunamis-farm-os-setup-custom-crop-draft-v1', () => ({
    cropCategoryInModal: null as string | null,
    customCropName: ''
  }));
  const { cropCategoryInModal, customCropName } = customCropDraft;

  const hasDraft = useMemo(() => {
    return (
      currentStep > 0 ||
      identity.operationName.trim().length > 0 ||
      productionProfiles.length > 0 ||
      structures.length > 0 ||
      channels.length > 0 ||
      initialCrops.length > 0
    );
  }, [channels.length, currentStep, identity.operationName, initialCrops.length, productionProfiles.length, structures.length]);

  const progressPct = Math.round(((currentStep + 1) / setupSteps.length) * 100);
  const step = setupSteps[currentStep] ?? setupSteps[0];

  const summaryChips = [
    identity.operationName || 'Sem nome',
    structures.length > 0 ? `${structures.length} blocos` : 'Sem estrutura',
    channels.length > 0 ? `${channels.length} canais` : 'Sem canal',
    initialCrops.length > 0 ? `${initialCrops.length} cultivos` : 'Sem cultivo'
  ];
  const selectedFinancialStart = financialOptions.find((option) => option.id === financialStartingPoints[0]) ?? null;

  const setupCropCatalog = useMemo(() => {
    return Object.fromEntries(
      Object.entries(cropCatalog).map(([category, items]) => {
        const customItems = customCrops
          .filter((entry) => entry.category === category)
          .map((entry) => entry.item);

        return [category, [...new Set([...items, ...customItems])]];
      })
    ) as Record<string, string[]>;
  }, [customCrops]);

  const recommendedFinancialStart = useMemo(
    () => getRecommendedFinancialStart(productionProfiles, structures, channels),
    [productionProfiles, structures, channels]
  );

  useEffect(() => {
    if (step.id !== 'financeiro') {
      return;
    }

    if (hasChosenFinancialStartingPoint) {
      return;
    }

    if (financialStartingPoints.length === 0) {
      setFinancialStartingPoints([recommendedFinancialStart]);
      return;
    }

    if (financialStartingPoints[0] !== recommendedFinancialStart) {
      setFinancialStartingPoints([recommendedFinancialStart]);
    }
  }, [financialStartingPoints, hasChosenFinancialStartingPoint, recommendedFinancialStart, setFinancialStartingPoints, step.id]);

  const closeCustomCropModal = () => {
    clearCustomCropDraft();
  };

  const saveCustomCrop = () => {
    if (!cropCategoryInModal) return;

    const normalizedItem = customCropName.trim();
    if (!normalizedItem) return;

    addCustomCrop({ category: cropCategoryInModal, item: normalizedItem });

    const alreadySelected = initialCrops.some(
      (entry) =>
        entry.category === cropCategoryInModal &&
        entry.item.trim().toLowerCase() === normalizedItem.toLowerCase()
    );

    if (!alreadySelected) {
      toggleInitialCrop({ category: cropCategoryInModal, item: normalizedItem });
    }

    closeCustomCropModal();
  };

  const stepContent = (() => {
    switch (step.id) {
      case 'identidade':
        return (
          <div className="setup-grid-two">
            <label>
              Nome
              <input className="input-dark" value={identity.operationName} onChange={(event) => updateIdentity({ operationName: event.target.value })} placeholder="Sitio Dunamis" />
            </label>
            <label>
              Apelido
              <input className="input-dark" value={identity.operationNickname} onChange={(event) => updateIdentity({ operationNickname: event.target.value })} placeholder="Horta base" />
            </label>
            <FarmLocationField identity={identity} onChange={updateIdentity} />
            <label>
              Unidade
              <select className="select-dark" value={identity.areaUnit} onChange={(event) => updateIdentity({ areaUnit: event.target.value as typeof identity.areaUnit })}>
                <option value="hectare">Hectare</option>
                <option value="alqueire_paulista">Alqueire paulista</option>
                <option value="alqueire_mineiro">Alqueire mineiro</option>
                <option value="outra">Outra</option>
              </select>
            </label>
            <label>
              Area total
              <input type="number" className="input-dark" value={identity.totalArea} onChange={(event) => updateIdentity({ totalArea: Number(event.target.value || 0) })} />
            </label>
            <label>
              Area produtiva
              <input type="number" className="input-dark" value={identity.productiveArea} onChange={(event) => updateIdentity({ productiveArea: Number(event.target.value || 0) })} />
            </label>
          </div>
        );
      case 'perfil':
        return (
          <div className="setup-selection-grid">
            {profileOptions.map((option) => {
              const active = productionProfiles.includes(option.id);
              return (
                <button key={option.id} type="button" className={active ? 'setup-choice-card is-active' : 'setup-choice-card'} onClick={() => toggleProductionProfile(option.id)}>
                  <span className="setup-choice-icon">
                    <UiIcon name={option.icon} className="setup-choice-icon-svg" />
                  </span>
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </button>
              );
            })}
          </div>
        );
      case 'estrutura':
        return (
          <div className="setup-structure-grid">
            {structureOptions.map((option) => {
              const entry = hasStructure(structures, option.id);
              const active = Boolean(entry);
              return (
                <article key={option.id} className={active ? 'setup-choice-card is-active' : 'setup-choice-card'}>
                  <button
                    type="button"
                    className="setup-choice-inline"
                    onClick={() => {
                      if (entry) {
                        setStructures(structures.filter((item) => item.type !== option.id));
                        return;
                      }
                      setStructures([...structures, { id: createId(), type: option.id, quantity: 1, notes: '' }]);
                    }}
                  >
                    <strong>{option.label}</strong>
                    <small>{active ? `Qtd ${entry?.quantity || 0}` : 'Adicionar'}</small>
                  </button>
                  {entry && (
                    <div className="setup-inline-fields">
                      <label>
                        Quantidade
                        <input
                          type="number"
                          className="input-dark"
                          value={entry.quantity}
                          onChange={(event) =>
                            setStructures(
                              structures.map((item) =>
                                item.id === entry.id ? { ...item, quantity: Number(event.target.value || 0) } : item
                              )
                            )
                          }
                        />
                      </label>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        );
      case 'canais':
        return (
          <div className="setup-stage-grid">
            <div className="setup-selection-grid">
              {channelOptions.map((option) => {
                const active = channels.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={active ? 'setup-choice-card is-active' : 'setup-choice-card'}
                    onClick={() => setChannels(active ? channels.filter((entry) => entry !== option.id) : [...channels, option.id])}
                  >
                    <strong>{option.label}</strong>
                    <small>{active ? 'Ativo' : 'Selecionar'}</small>
                  </button>
                );
              })}
            </div>
            <div className="setup-priority-stack">
              <div className="setup-priority-header">
                <span className="setup-stack-label">Ordem</span>
                <small>Arraste para mudar</small>
              </div>
              {channels.length === 0 ? (
                <StatusChip label="Escolha um canal" tone="warning" />
              ) : (
                channels.map((channel, index) => {
                  const channelLabel = channelOptions.find((option) => option.id === channel)?.label ?? channel.replace(/_/g, ' ');
                  return (
                  <div
                    key={channel}
                    className={draggedChannel === channel ? 'setup-priority-row is-dragging' : 'setup-priority-row'}
                    draggable
                    onDragStart={() => setDraggedChannel(channel)}
                    onDragEnd={() => setDraggedChannel(null)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (!draggedChannel || draggedChannel === channel) return;
                      const next = channels.slice();
                      const fromIndex = next.indexOf(draggedChannel);
                      const toIndex = next.indexOf(channel);
                      if (fromIndex < 0 || toIndex < 0) return;
                      const [moved] = next.splice(fromIndex, 1);
                      next.splice(toIndex, 0, moved);
                      setChannels(next);
                      setDraggedChannel(null);
                    }}
                  >
                    <div className="setup-priority-head">
                      <span className="setup-priority-order">{index + 1}º</span>
                      <span>{channelLabel}</span>
                    </div>
                    <span className="setup-drag-handle" aria-hidden="true">
                      <UiIcon name="list" className="setup-drag-handle-icon" />
                    </span>
                  </div>
                )})
              )}
            </div>
          </div>
        );
      case 'cultivos':
        return (
          <div className="setup-crop-stack">
            {Object.entries(setupCropCatalog).map(([category, items]) => (
              <section key={category} className="setup-crop-group">
                <div className="setup-crop-group-header">
                  <h4>{category.replace('_', ' ')}</h4>
                  <button
                    type="button"
                    className="setup-crop-add"
                    onClick={() => {
                      setCustomCropDraft({
                        cropCategoryInModal: category,
                        customCropName: ''
                      });
                    }}
                    aria-label={`Adicionar cultivo em ${category.replace('_', ' ')}`}
                  >
                    +
                  </button>
                </div>
                <div className="setup-chip-wrap">
                  {items.map((item) => {
                    const active = initialCrops.some((entry) => entry.category === category && entry.item === item);
                    return (
                      <button
                        key={item}
                        type="button"
                        className={active ? 'setup-chip is-active' : 'setup-chip'}
                        onClick={() => toggleInitialCrop({ category, item })}
                        aria-pressed={active}
                      >
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        );
      case 'financeiro':
        return (
          <div className="setup-finance-stack">
            <p className="setup-inline-note">Escolha um ponto de partida. Depois o resto pode ser ligado aos poucos.</p>
            <div className="setup-selection-grid">
              {financialOptions.map((option) => {
                const active = financialStartingPoints.includes(option.id);
                const recommended = recommendedFinancialStart === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={active ? recommended ? 'setup-choice-card is-active is-recommended' : 'setup-choice-card is-active' : recommended ? 'setup-choice-card is-recommended' : 'setup-choice-card'}
                    onClick={() => {
                      setFinancialStartingPoints([option.id]);
                      markFinancialStartingPointAsChosen();
                    }}
                    aria-pressed={active}
                  >
                    {recommended && <span className="setup-recommended-chip">Recomendado</span>}
                    {active && <span className="setup-selected-chip">Escolhido</span>}
                    <strong>{option.short}</strong>
                    <small>{option.label}</small>
                    <span className="setup-choice-helper">{option.helper}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      case 'resumo':
        return (
          <div className="setup-summary-grid">
            <ExecutiveCard title="Terra" value={identity.operationName || '--'} helper={identity.location || 'Local'} tone="info" />
            <ExecutiveCard title="Perfis" value={String(productionProfiles.length)} helper="Selecionados" tone="positive" />
            <ExecutiveCard title="Estrutura" value={String(structures.length)} helper="Blocos" tone="warning" />
            <ExecutiveCard title="Canais" value={String(channels.length)} helper="Destinos" tone="positive" />
            <ExecutiveCard title="Cultivos" value={String(initialCrops.length)} helper="Partida" tone="info" />
            <ExecutiveCard title="Financeiro" value={String(financialStartingPoints.length)} helper="Frentes" tone="neutral" />
          </div>
        );
      case 'pronto':
        return (
          <div className="setup-ready-card">
            <div className="setup-ready-icon">
              <UiIcon name="result" className="setup-ready-icon-svg" />
            </div>
            <h3>Seu cockpit esta pronto.</h3>
            <p>A base foi montada. Agora o sistema mostra primeiro o que faz sentido para a sua operacao.</p>
          </div>
        );
      default:
        return null;
    }
  })();

  if (status === 'landing') {
    return (
      <main className="setup-shell landing-mode">
        <section className="setup-hero-card">
          <div className="setup-hero-copy">
            <BrandLogo variant="hero" />
            <h1>Monte a base antes de ver os numeros.</h1>
            <p>Comece leve. A plataforma aprende sua terra em poucos passos.</p>
            <div className="setup-hero-actions">
              <button
                type="button"
                className="cta-btn setup-primary"
                onClick={() => {
                  if (!hasDraft) resetWorkspaceToEmpty();
                  startSetup();
                }}
              >
                {hasDraft ? 'Retomar configuracao' : 'Comecar agora'}
              </button>
            </div>
            <div className="setup-proof-strip">
              <span>Passo a passo</span>
              <span>Salva sozinho</span>
              <span>Sem tela tecnica no inicio</span>
            </div>
          </div>

          <div className="setup-hero-visual">
            <div className="setup-orbit setup-orbit-a" />
            <div className="setup-orbit setup-orbit-b" />
            <div className="setup-visual-card">
              <strong>Base da terra</strong>
              <span>Nome, estrutura, destino e cultivos primeiro.</span>
            </div>
            <div className="setup-visual-card alt">
              <strong>Cockpit sob medida</strong>
              <span>O sistema muda conforme a sua operacao.</span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="setup-shell">
        <section className="setup-flow-card setup-flow-v2">
        <header className="setup-flow-head compact">
          <div>
            <span className="setup-badge">Configuracao inicial</span>
            <h2>{step.label}</h2>
          </div>
          <div className="setup-progress-block compact">
            <strong>{progressPct}%</strong>
            <span>{currentStep + 1}/{setupSteps.length}</span>
          </div>
        </header>

        <div className="setup-progress-bar slim">
          <span style={{ width: `${Math.max(10, progressPct)}%` }} />
        </div>

        <div className="setup-flow-v2-grid">
          <aside className="setup-step-rail">
            {setupSteps.map((entry, index) => {
              const active = index === currentStep;
              const done = index < currentStep;
              return (
                <button key={entry.id} type="button" className={active ? 'setup-step-link is-active' : done ? 'setup-step-link is-done' : 'setup-step-link'} onClick={() => setCurrentStep(index)}>
                  <span className="setup-step-icon">
                    <UiIcon name={entry.icon} className="setup-step-icon-svg" />
                  </span>
                  <span>{entry.label}</span>
                </button>
              );
            })}
          </aside>

          <section className="setup-question-card">
            <div className="setup-question-head">
              <span className="setup-question-kicker">Passo {currentStep + 1}</span>
              <h3>{questionFor(step.id)}</h3>
            </div>

            <div className="setup-question-body">{stepContent}</div>

            <footer className="setup-question-footer">
              <button type="button" className="ghost-btn" onClick={() => currentStep === 0 ? returnToLanding() : setCurrentStep(currentStep - 1)}>
                {currentStep === 0 ? 'Voltar' : 'Anterior'}
              </button>
              <div className="setup-inline-actions">
                <button type="button" className="ghost-btn" onClick={returnToLanding}>
                  Continuar depois
                </button>
                {currentStep < setupSteps.length - 1 ? (
                  <button type="button" className="cta-btn" onClick={() => setCurrentStep(currentStep + 1)}>
                    Continuar
                  </button>
                ) : (
                  <button
                    type="button"
                    className="cta-btn"
                    onClick={() => {
                      applySetupWorkspace();
                      completeSetup();
                    }}
                  >
                    Entrar no cockpit
                  </button>
                )}
              </div>
            </footer>
          </section>

          <aside className="setup-preview-rail">
            <DetailCard eyebrow="Resumo" title={identity.operationName || 'Sua base'}>
              <div className="drawer-chip-wrap">
                {summaryChips.map((chip) => (
                  <StatusChip key={chip} label={chip} tone="neutral" />
                ))}
              </div>
            </DetailCard>

            <DetailCard eyebrow="Direcao" title="Como o app vai nascer">
              <div className="setup-preview-stack">
                {productionProfiles.length > 0 && (
                  <div className="setup-preview-line">
                    <UiIcon name={profileIcon(productionProfiles[0])} className="setup-preview-icon" />
                    <span>{productionProfiles.length} perfil(is) ativo(s)</span>
                  </div>
                )}
                {channels.length > 0 && (
                  <div className="setup-preview-line">
                    <UiIcon name="flow" className="setup-preview-icon" />
                    <span>{channels[0].replace(/_/g, ' ')} entra primeiro</span>
                  </div>
                )}
                {financialStartingPoints.length > 0 && (
                  <div className="setup-preview-line">
                    <UiIcon name="wallet" className="setup-preview-icon" />
                    <span>{selectedFinancialStart ? `${selectedFinancialStart.short} entra primeiro` : 'Ponto de partida definido'}</span>
                  </div>
                )}
              </div>
            </DetailCard>
          </aside>
        </div>
        </section>
      </main>
      <CenterModal
        open={Boolean(cropCategoryInModal)}
        title={cropCategoryInModal ? `Novo cultivo em ${cropCategoryInModal.replace('_', ' ')}` : 'Novo cultivo'}
        subtitle="Adicione um cultivo nesta linha. Ele entra na lista e ja fica selecionado."
        onClose={closeCustomCropModal}
        footer={(
          <>
            <button type="button" className="ghost-btn" onClick={closeCustomCropModal}>
              Fechar
            </button>
            <button type="button" className="cta-btn" onClick={saveCustomCrop} disabled={!customCropName.trim()}>
              Adicionar cultivo
            </button>
          </>
        )}
      >
        <div className="setup-modal-form">
          <label>
            Nome do cultivo
            <input
              className="input-dark"
              value={customCropName}
              onChange={(event) =>
                setCustomCropDraft((state) => ({
                  ...state,
                  customCropName: event.target.value
                }))
              }
              placeholder="Ex.: Almeirao roxo"
              autoFocus
            />
          </label>
        </div>
      </CenterModal>
    </>
  );
};

const questionFor = (stepId: string): string => {
  if (stepId === 'identidade') return 'Como essa operacao deve se chamar?';
  if (stepId === 'perfil') return 'Que tipo de producao faz parte do dia a dia?';
  if (stepId === 'estrutura') return 'O que ja existe hoje?';
  if (stepId === 'canais') return 'Para onde a producao vai primeiro?';
  if (stepId === 'cultivos') return 'O que voce quer produzir primeiro?';
  if (stepId === 'financeiro') return 'Por onde voce quer comecar no dinheiro?';
  if (stepId === 'resumo') return 'Essa base representa bem a sua operacao?';
  return 'Pronto para abrir o cockpit?';
};
