import { useEffect, useMemo, useState } from 'react';
import { useProductionPlanningStore, useUiPreferencesStore, useOnboardingStore } from '@/app/store';
import { useFarmSnapshot, type OperationStage } from '@/features/dashboard/model/useFarmSnapshot';
import { GrowthProjectionCard } from '@/features/dashboard/components/GrowthProjectionCard';
import { formatCurrency, formatNumber, formatUnitLabel } from '@/shared/lib/format';
import { ContextHelp, DetailCard, ExecutiveCard, FilterPills, SmartEmptyState, StatusChip } from '@/shared/ui';

const stageCopy: Record<
  OperationStage,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    metricsTitle: string;
  }
> = {
  comeco_absoluto: {
    eyebrow: 'Início',
    title: 'Vamos montar sua horta',
    subtitle: 'O sistema calcula quanto cabe nos seus canteiros e organiza tudo para você.',
    metricsTitle: 'Quando o lucro vai aparecer'
  },
  base_montada: {
    eyebrow: 'Base pronta',
    title: 'A base ja esta pronta',
    subtitle: 'A cultura, a area e os destinos ja existem. Falta colocar a vida da fazenda para dentro do sistema.',
    metricsTitle: 'O que ainda esta zerado'
  },
  operacao_parcial: {
    eyebrow: 'Operacao em andamento',
    title: 'Agora registre o que ja aconteceu',
    subtitle: 'Ja existe movimento real. Agora falta completar o que aconteceu no campo e na saida da producao.',
    metricsTitle: 'Leitura parcial da conta'
  },
  conta_real_ativa: {
    eyebrow: 'Conta real ativa',
    title: 'Agora a conta ja esta ficando real',
    subtitle: 'Ja existe base suficiente para comparar o que foi planejado com o que aconteceu de verdade.',
    metricsTitle: 'Conta da cultura em foco'
  }
};

const stageGuides: Record<
  Exclude<OperationStage, 'conta_real_ativa'>,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: Array<{ id: string; title: string; description: string }>;
  }
> = {
  comeco_absoluto: {
    eyebrow: 'Primeiros passos',
    title: 'Como o sistema vai comecar com voce',
    subtitle: 'Primeiro a base. Depois a rotina. So depois entram os numeros.',
    steps: [
      { id: 'cultura', title: '1. O que você planta?', description: 'Comece escolhendo o cultivo e veja quanto custa cada muda.' },
      { id: 'area', title: '2. Calcule seu espaço', description: 'O sistema calcula quantos canteiros e mudas você precisa para sua área.' },
      { id: 'compra', title: '3. Peça as mudas', description: 'Ao registrar o pedido, o app começa a calcular seu custo de produção real.' }
    ]
  },
  base_montada: {
    eyebrow: 'Rotina real',
    title: 'Agora a vida da fazenda entra no sistema',
    subtitle: 'O proximo salto vem quando voce registra o que comprou e o que realmente entrou.',
    steps: [
      { id: 'compra', title: '1. Fazer o pedido', description: 'Quanto pagou nas mudas? O custo real começa a nascer agora.' },
      { id: 'estoque', title: '2. Receber no galpão', description: 'Confirme o que chegou para virar insumo disponível no galpão.' },
      { id: 'uso', title: '3. Começar o plantio', description: 'Depois o sistema ajuda a planejar quando colocar cada muda na terra.' }
    ]
  },
  operacao_parcial: {
    eyebrow: 'Fechando a conta',
    title: 'Falta pouco para o numero ficar honesto',
    subtitle: 'Ja existe movimento real. Agora falta fechar o que saiu do campo e para onde foi.',
    steps: [
      { id: 'aplicacao', title: '1. Registrar aplicacao', description: 'Diga o que saiu do estoque, onde foi usado e em qual cultura entrou.' },
      { id: 'colheita', title: '2. Registrar colheita', description: 'Conte quanto saiu do campo e quanto ficou bom para vender.' },
      { id: 'destino', title: '3. Fechar o destino', description: 'Quando voce diz para onde foi, o sistema consegue fechar a margem real.' }
    ]
  }
};

const DashboardModule = () => {
  const setActiveRoute = useUiPreferencesStore((state) => state.setActiveRoute);
  const crops = useProductionPlanningStore((state) => state.crops);
  const {
    attentionPoints,
    inventory,
    plannedEconomics,
    realEconomics,
    realMarginByChannel,
    operationStage,
    operationChecklist,
    nextAction,
    zeroedMetrics,
    canShowRealMetrics,
    dataGaps,
    purchases,
    applications,
    harvests,
    realPlans
  } = useFarmSnapshot();
  const [activeCropId, setActiveCropId] = useState<string>('');

  useEffect(() => {
    if (!crops.length) {
      setActiveCropId('');
      return;
    }

    if (!crops.some((crop) => crop.id === activeCropId)) {
      setActiveCropId(crops[0].id);
    }
  }, [activeCropId, crops]);

  const activeCrop = crops.find((crop) => crop.id === activeCropId) ?? crops[0] ?? null;

  const focus = useMemo(() => {
    if (!activeCrop) {
      return {
        plannedCost: 0,
        realCost: 0,
        minimumPrice: 0,
        suggestedPrice: 0,
        marketableUnits: 0,
        plannedOnly: true,
        plansCount: 0
      };
    }

    const plannedRows = plannedEconomics.rows.filter((row) => row.cropId === activeCrop.id);
    const realRows = realEconomics.rows.filter((row) => row.cropId === activeCrop.id);
    const rowsWithFacts = realRows.filter((row) => !row.plannedOnly && row.marketableUnits > 0);
    const realSource = rowsWithFacts.length > 0 ? rowsWithFacts : realRows;
    const average = (values: number[]) =>
      values.length ? Math.round(values.reduce((acc, value) => acc + value, 0) / values.length) : 0;

    return {
      plannedCost: average(plannedRows.map((row) => row.costPerUnitCents)),
      realCost: average(realSource.map((row) => row.costPerUnitCents)),
      minimumPrice: average(realSource.map((row) => row.minimumSalePricePerUnitCents)),
      suggestedPrice: average(realSource.map((row) => row.suggestedSalePricePerUnitCents)),
      marketableUnits: realSource.reduce((acc, row) => acc + Math.max(0, row.marketableUnits || row.viableUnits), 0),
      plannedOnly: rowsWithFacts.length === 0,
      plansCount: realRows.length || plannedRows.length
    };
  }, [activeCrop, plannedEconomics.rows, realEconomics.rows]);

  const checklistDoneCount = operationChecklist.filter((item) => item.done).length;
  const topChecklist = operationChecklist.slice(0, 6);
  const pendingItems = operationChecklist.filter((item) => !item.done).slice(0, 3);
  const liveCounts: Array<{
    title: string;
    value: string;
    helper: string;
    tone: 'neutral' | 'positive' | 'warning' | 'danger' | 'info';
  }> = [
    { title: 'Pedidos', value: String(purchases.length), helper: purchases.length > 0 ? 'Ja registrados' : 'Nada pedido ainda', tone: purchases.length > 0 ? 'info' : 'neutral' as const },
    { title: 'No galpão', value: String(inventory.lots.length), helper: inventory.lots.length > 0 ? 'Lotes disponíveis' : 'Nada no galpão ainda', tone: inventory.lots.length > 0 ? 'positive' : 'neutral' as const },
    { title: 'No canteiro', value: String(applications.length), helper: applications.length > 0 ? 'Mudas plantadas' : 'Nada plantado ainda', tone: applications.length > 0 ? 'warning' : 'neutral' as const },
    { title: 'Colheitas', value: String(harvests.length), helper: harvests.length > 0 ? 'Já colhido' : 'Sem colheita ainda', tone: harvests.length > 0 ? 'positive' : 'neutral' as const }
  ];

  const realMetrics = [
    {
      title: 'Custo por unidade',
      value: canShowRealMetrics && focus.realCost > 0 ? formatCurrency(focus.realCost) : zeroedMetrics.realCost.value,
      helper: canShowRealMetrics ? 'Sai do que ja aconteceu no campo.' : zeroedMetrics.realCost.reason,
      tone: canShowRealMetrics ? ('warning' as const) : ('neutral' as const),
      help: 'Mostra quanto a unidade esta custando com base no que ja entrou, saiu e foi colhido.'
    },
    {
      title: 'Preco sugerido',
      value: canShowRealMetrics && focus.suggestedPrice > 0 ? formatCurrency(focus.suggestedPrice) : zeroedMetrics.minimumPrice.value,
      helper: canShowRealMetrics ? 'Margem aplicada sobre o custo atual.' : zeroedMetrics.minimumPrice.reason,
      tone: canShowRealMetrics ? ('positive' as const) : ('neutral' as const),
      help: 'É o valor sugerido para vender com mais segurança, depois de aplicar a margem sobre o custo da unidade.'
    }
  ];

  const stageData = stageCopy[operationStage];
  const stageGuide = operationStage === 'conta_real_ativa' ? null : stageGuides[operationStage];
  const projectionBaseline = useMemo(() => {
    if (!activeCrop) return null;

    const relatedPlans = realPlans.filter((plan) => plan.cropId === activeCrop.id);
    if (relatedPlans.length === 0) return null;

    const totalAreaSqm = relatedPlans.reduce((acc, plan) => acc + Math.max(0, plan.areaTotalSqm || plan.plannedAreaSqm || 0), 0);
    const totalBeds = relatedPlans.reduce((acc, plan) => acc + Math.max(0, plan.bedCount || plan.plannedBeds || 0), 0);
    const averageCycleDays = Math.round(
      relatedPlans.reduce((acc, plan) => acc + Math.max(1, plan.cycleDays || activeCrop.cycleDays || 1), 0) / relatedPlans.length
    );
    const totalMonthlyUnits = Math.round(
      relatedPlans.reduce((acc, plan) => {
        const cycleDays = Math.max(1, plan.cycleDays || activeCrop.cycleDays || 1);
        const cycleUnits = Math.max(0, plan.marketableUnits || plan.viableUnits || 0);
        return acc + cycleUnits * (30 / cycleDays);
      }, 0)
    );

    const baselineCostPerUnitCents = focus.realCost > 0 ? focus.realCost : focus.plannedCost;
    const baselinePricePerUnitCents = focus.suggestedPrice > 0 ? focus.suggestedPrice : Math.round(baselineCostPerUnitCents * 1.35);
    const averageLossRate =
      relatedPlans.reduce((acc, plan) => acc + Math.max(0, plan.expectedLossRate || activeCrop.defaultLossRate || 0), 0) / relatedPlans.length;

    if (totalAreaSqm <= 0 || totalMonthlyUnits <= 0 || baselinePricePerUnitCents <= 0) return null;

    return {
      cropName: activeCrop.name,
      unitLabel: formatUnitLabel(activeCrop.salesUnit || activeCrop.productionUnit || 'unidade'),
      baseAreaSqm: totalAreaSqm,
      baseBeds: totalBeds,
      baseCycleDays: averageCycleDays,
      baseMonthlyUnits: totalMonthlyUnits,
      baseCostPerUnitCents: Math.max(0, baselineCostPerUnitCents),
      basePricePerUnitCents: Math.max(0, baselinePricePerUnitCents),
      baseLossRate: Math.max(0, averageLossRate)
    };
  }, [activeCrop, focus.plannedCost, focus.realCost, focus.suggestedPrice, realPlans]);

  return (
    <div className="page-stack home-stack">
      <DetailCard
        className="home-stage-card"
        eyebrow={stageData.eyebrow}
        title={stageData.title}
        subtitle={stageData.subtitle}
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              type="button" 
              className="ghost-btn" 
              style={{ fontSize: '0.8rem', padding: '4px 8px', opacity: 0.8 }}
              onClick={() => useOnboardingStore.getState().startTour('global')}
            >
              Ver tutorial novamente
            </button>
            {activeCrop && operationStage !== 'comeco_absoluto' && crops.length > 1 ? (
              <FilterPills
                activeId={activeCrop.id}
                onChange={setActiveCropId}
                options={crops.map((crop) => ({ id: crop.id, label: crop.name }))}
              />
            ) : null}
          </div>
        }
      >
        <div className="home-stage-grid" data-tour="stage-card">
          <div className="home-stage-main">
            <div className="home-signal-row">
              <StatusChip label={`${checklistDoneCount}/${operationChecklist.length} passos prontos`} tone={checklistDoneCount > 0 ? 'info' : 'neutral'} />
              {activeCrop && operationStage !== 'comeco_absoluto' ? (
                <StatusChip label={`${activeCrop.name}${activeCrop.variety ? ` · ${activeCrop.variety}` : ''}`} tone="low" />
              ) : null}
              {operationStage === 'operacao_parcial' ? <StatusChip label="Parcial" tone="medium" /> : null}
              {operationStage === 'conta_real_ativa' ? <StatusChip label="Base real" tone="positive" /> : null}
            </div>

            <div className="home-next-step-panel">
              <div>
                <span className="home-next-step-eyebrow">Proximo passo</span>
                <h4>{nextAction.label}</h4>
                <p>{nextAction.description}</p>
              </div>
              <div className="home-focus-actions">
                <button type="button" className="cta-btn" onClick={() => setActiveRoute(nextAction.route)}>
                  {nextAction.label}
                </button>
                {operationStage !== 'comeco_absoluto' ? (
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => setActiveRoute(operationStage === 'base_montada' ? 'purchases' : 'real-costs')}
                  >
                    {operationStage === 'base_montada' ? 'Registrar compra' : 'Ver conta'}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="home-checklist-grid" data-tour="home-checklist-grid">
              {topChecklist.map((item) => (
                <button key={item.id} type="button" className={item.done ? 'home-check-item is-done' : 'home-check-item'} onClick={() => setActiveRoute(item.route)}>
                  <span className="home-check-state">{item.done ? 'OK' : 'Falta'}</span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="home-stage-side" data-tour="home-stage-side">
            <DetailCard
              eyebrow={stageData.metricsTitle}
              title={operationStage === 'conta_real_ativa' ? 'O que ja esta valendo de verdade' : 'O que ainda nao foi calculado'}
              subtitle={
                operationStage === 'conta_real_ativa'
                  ? 'Agora os principais numeros ja saem do que aconteceu na fazenda.'
                  : 'Esses numeros so ganham forca quando houver estoque, uso, colheita e destino.'
              }
            >
              <div className="home-zero-grid">
                {realMetrics.map((metric) => (
                  <ExecutiveCard key={metric.title} title={metric.title} value={metric.value} helper={metric.helper} tone={metric.tone}>
                    <ContextHelp text={metric.help} />
                  </ExecutiveCard>
                ))}
              </div>
            </DetailCard>

            <GrowthProjectionCard baseline={projectionBaseline} onGoToPlanning={() => setActiveRoute('production-planning')} />
          </div>
        </div>
      </DetailCard>

      {operationStage === 'comeco_absoluto' ? (
        <DetailCard eyebrow="Agora" title="Comece pelo que realmente importa" subtitle="O sistema ainda nao tem base suficiente. Primeiro monte o basico da operacao.">
          <SmartEmptyState
            title="Criar primeira cultura"
            description="Diga o que voce planta, como compra e qual e a area. O resto o sistema vai guiando aos poucos."
            action={
              <button type="button" className="cta-btn" onClick={() => setActiveRoute('production-planning')}>
                Criar primeira cultura
              </button>
            }
          />
        </DetailCard>
      ) : null}

      <div className="home-lower-grid">
        <DetailCard eyebrow="Agora" title="O que falta registrar">
          <div className="home-pending-list">
            {pendingItems.length > 0 ? (
              pendingItems.map((item) => (
                <button key={item.id} type="button" className="home-pending-item" onClick={() => setActiveRoute(item.route)}>
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </button>
              ))
            ) : (
              <div className="home-pending-item is-static">
                <strong>Base suficiente para seguir</strong>
                <span>Agora o sistema ja consegue olhar o que aconteceu de verdade e comparar com o planejado.</span>
              </div>
            )}

            {attentionPoints.slice(0, 2).map((point) => (
              <div key={point.id} className={`home-pending-item is-static severity-${point.severity}`}>
                <strong>{point.title}</strong>
                <span>{point.description}</span>
              </div>
            ))}
          </div>
        </DetailCard>

        <DetailCard eyebrow="Ja registrado" title="O que ja esta valendo">
          <div className="executive-grid">
            {liveCounts.map((item) => (
              <ExecutiveCard key={item.title} title={item.title} value={item.value} helper={item.helper} tone={item.tone} />
            ))}
          </div>
        </DetailCard>
      </div>

      <DetailCard
        eyebrow={operationStage === 'conta_real_ativa' ? stageData.metricsTitle : stageGuide?.eyebrow}
        title={operationStage === 'conta_real_ativa' ? 'Planejado e real lado a lado' : stageGuide?.title ?? 'Como o sistema vai comecar'}
        subtitle={
          operationStage === 'conta_real_ativa'
            ? dataGaps.length > 0
              ? `Ainda faltam ${dataGaps.join(', ').toLowerCase()}.`
              : 'A base real ja esta fechando os numeros principais.'
            : stageGuide?.subtitle ?? 'Responda o basico e o sistema organiza o resto.'
        }
      >
        {operationStage === 'conta_real_ativa' ? (
          <div className="home-summary-grid">
            <ExecutiveCard key="planned-cost" title="Planejado" value={focus.plannedCost > 0 ? formatCurrency(focus.plannedCost) : 'R$ 0,00'} helper="Serve para comparar o plano com o que aconteceu." tone="info">
              <ContextHelp text="Planejado e a conta da simulacao, antes da vida real da fazenda entrar." />
            </ExecutiveCard>
            <ExecutiveCard key="real-cost" title="Real" value={focus.realCost > 0 ? formatCurrency(focus.realCost) : 'R$ 0,00'} helper="Sai do estoque, do uso, da colheita e do destino." tone="warning">
              <ContextHelp text="Real e a conta do que ja aconteceu de verdade na fazenda." />
            </ExecutiveCard>
            <ExecutiveCard key="minimum" title="Preco minimo" value={focus.minimumPrice > 0 ? formatCurrency(focus.minimumPrice) : 'R$ 0,00'} helper="E o piso para nao perder dinheiro." tone="danger">
              <ContextHelp text="Preco minimo e o piso da unidade vendavel. Abaixo disso, perde dinheiro." />
            </ExecutiveCard>
            <ExecutiveCard key="suggested" title="Preco sugerido" value={focus.suggestedPrice > 0 ? formatCurrency(focus.suggestedPrice) : 'R$ 0,00'} helper="Sai do custo mais a margem escolhida." tone="positive">
              <ContextHelp text="Preco sugerido ajuda a sair do custo minimo para um valor mais seguro de venda." />
            </ExecutiveCard>
          </div>
        ) : (
          <div className="home-guide-grid">
            {stageGuide?.steps.map((step) => (
              <div key={step.id} className="home-guide-card">
                <strong>{step.title}</strong>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        )}
      </DetailCard>
    </div>
  );
};

export { DashboardModule };
