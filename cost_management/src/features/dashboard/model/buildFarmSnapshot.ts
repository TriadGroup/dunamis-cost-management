import {
  buildAllocationEntriesFromApplications,
  buildAllocationEntriesFromEquipment,
  buildAllocationEntriesFromIndirectCosts,
  buildAllocationEntriesFromLabor,
  buildAllocationEntriesFromStockUsage,
  buildAttentionPoints,
  calculateAgroReturn,
  calculateCostPerMarketableUnit,
  calculateDashboardKpi,
  calculateImplantationTotals,
  calculateInventoryLossTotal,
  calculateMarketableUnits,
  calculateMinimumSalePrice,
  calculateProductionContinuity,
  calculateRecurringCostSummary,
  calculateSuggestedSalePrice,
  calculateUnitEconomics,
  groupImplantationByProject,
  type ApplicationEvent,
  type Bed,
  type CostAllocationLedgerEntry,
  type CostItem,
  type Crop,
  type CropPlan,
  type DemandChannel,
  type EquipmentUsageRecord,
  type Harvest,
  type ImplantationItem,
  type ImplantationProject,
  type InventoryLot,
  type InventoryProduct,
  type InvestmentContract,
  type LaborRecord,
  type LossEvent,
  type Lot,
  type MaintenanceEvent,
  type PurchaseItem,
  type StockMovement
} from '@/entities';

const money = (value: number | undefined): number => Math.max(0, Math.round(Number.isFinite(value) ? (value as number) : 0));

export type OperationStage = 'comeco_absoluto' | 'base_montada' | 'operacao_parcial' | 'conta_real_ativa';

export interface OperationChecklistItem {
  id: string;
  label: string;
  done: boolean;
  route: string;
  description: string;
}

export interface FarmSnapshotInput {
  costs: CostItem[];
  purchases: PurchaseItem[];
  maintenance: MaintenanceEvent[];
  investments: InvestmentContract[];
  implantationProjects: ImplantationProject[];
  implantationItems: ImplantationItem[];
  channels: DemandChannel[];
  crops: Crop[];
  beds: Bed[];
  plans: CropPlan[];
  lots: Lot[];
  inventoryProducts: InventoryProduct[];
  inventoryLots: InventoryLot[];
  stockMovements: StockMovement[];
  applications: ApplicationEvent[];
  losses: LossEvent[];
  labor: LaborRecord[];
  equipmentUsage: EquipmentUsageRecord[];
  persistedLedger: CostAllocationLedgerEntry[];
}

export const buildFarmSnapshotFromState = ({
  costs,
  purchases,
  maintenance,
  investments,
  implantationProjects,
  implantationItems,
  channels,
  crops,
  beds,
  plans,
  lots,
  inventoryProducts,
  inventoryLots,
  stockMovements,
  applications,
  losses,
  labor,
  equipmentUsage,
  persistedLedger
}: FarmSnapshotInput) => {
  const recurring = calculateRecurringCostSummary(costs, purchases, maintenance);
  const implantationTotals = calculateImplantationTotals(implantationItems);
  const implantationProjectGroups = groupImplantationByProject(implantationProjects, implantationItems);
  const plannedEconomics = calculateUnitEconomics(crops, plans, costs, purchases, channels);
  const agroReturn = calculateAgroReturn(channels, recurring.monthlyReserveCents, implantationTotals.committedCents);

  const derivedLedger = [
    ...buildAllocationEntriesFromStockUsage(stockMovements, inventoryLots),
    ...buildAllocationEntriesFromApplications(applications, inventoryLots),
    ...buildAllocationEntriesFromLabor(labor),
    ...buildAllocationEntriesFromEquipment(equipmentUsage),
    ...buildAllocationEntriesFromIndirectCosts(costs)
  ];
  const derivedIds = new Set(derivedLedger.map((entry) => entry.id));
  const allocationLedger: CostAllocationLedgerEntry[] = [
    ...persistedLedger.filter((entry) => !derivedIds.has(entry.id)),
    ...derivedLedger
  ];

  const harvests: Harvest[] = lots.flatMap((lot) =>
    lot.harvests.map((harvest) => ({
      ...harvest,
      quantity: harvest.quantity ?? harvest.grossQuantity
    }))
  );

  const realPlans = plans.map((plan) => {
    const relatedLots = lots.filter((lot) => lot.cropPlanId === plan.id || (!lot.cropPlanId && lot.cropId === plan.cropId));
    const relatedLotIds = new Set(relatedLots.map((lot) => lot.id));
    const relatedLedger = allocationLedger.filter(
      (entry) =>
        entry.cropPlanId === plan.id ||
        (entry.targetType === 'plano' && entry.targetId === plan.id) ||
        (entry.productionLotId ? relatedLotIds.has(entry.productionLotId) : false)
    );
    const appropriatedCostCents = relatedLedger.reduce((acc, entry) => acc + money(entry.amountCents), 0);
    const actualHarvestedUnits = relatedLots.reduce(
      (acc, lot) => acc + lot.harvests.reduce((sum, harvest) => sum + money(harvest.grossQuantity), 0),
      0
    );
    const marketableUnits = relatedLots.reduce((acc, lot) => acc + calculateMarketableUnits(lot, harvests, losses), 0);
    const actualInternalUnits = relatedLots.reduce(
      (acc, lot) =>
        acc +
        lot.harvests.reduce(
          (sum, harvest) =>
            sum +
            harvest.destinationBreakdown
              .filter((destination) => channels.find((channel) => channel.id === destination.channelId)?.type === 'kitchen')
              .reduce((channelSum, destination) => channelSum + money(destination.quantity), 0),
          0
        ),
      0
    );
    const actualSoldUnits = relatedLots.reduce(
      (acc, lot) =>
        acc +
        lot.harvests.reduce(
          (sum, harvest) =>
            sum +
            harvest.destinationBreakdown
              .filter((destination) => {
                const channelType = channels.find((channel) => channel.id === destination.channelId)?.type;
                return channelType && channelType !== 'kitchen' && channelType !== 'surplus';
              })
              .reduce((channelSum, destination) => channelSum + money(destination.quantity), 0),
          0
        ),
      0
    );
    const actualDiscardedUnits = relatedLots.reduce((acc, lot) => acc + money(lot.discardedQuantity), 0);
    const minimumSalePricePerUnitCents = calculateMinimumSalePrice(
      calculateCostPerMarketableUnit(appropriatedCostCents, marketableUnits)
    );
    const plannedOnly = !(appropriatedCostCents > 0 && marketableUnits > 0);

    return {
      ...plan,
      appropriatedCostCents,
      costTotalCents: plannedOnly ? plan.costTotalCents : appropriatedCostCents,
      marketableUnits,
      actualHarvestedUnits,
      actualSoldUnits,
      actualInternalUnits,
      actualDiscardedUnits,
      minimumSalePricePerUnitCents,
      suggestedSalePricePerUnitCents: plannedOnly
        ? plan.suggestedSalePricePerUnitCents
        : calculateSuggestedSalePrice(minimumSalePricePerUnitCents, plan.markupPct),
      suggestedSalePricePerBoxCents: plannedOnly
        ? plan.suggestedSalePricePerBoxCents
        : calculateSuggestedSalePrice(minimumSalePricePerUnitCents, plan.markupPct) * Math.max(1, plan.unitsPerSalesBox),
      costPerUnitCents: plannedOnly
        ? plan.costPerUnitCents
        : calculateCostPerMarketableUnit(appropriatedCostCents, marketableUnits),
      costPerSalesBoxCents: plannedOnly
        ? plan.costPerSalesBoxCents
        : calculateCostPerMarketableUnit(appropriatedCostCents, marketableUnits) * Math.max(1, plan.unitsPerSalesBox),
      plannedOnly
    };
  });

  const realEconomics = calculateUnitEconomics(crops, realPlans, costs, purchases, channels);

  const realMarginByChannel = channels
    .filter((channel) => channel.enabled)
    .map((channel) => {
      const revenueCents = harvests.reduce(
        (acc, harvest) =>
          acc +
          harvest.destinationBreakdown
            .filter((destination) => destination.channelId === channel.id)
            .reduce((sum, destination) => sum + money(destination.valueCents), 0),
        0
      );

      const costCents = lots.reduce((acc, lot) => {
        const lotMarketable = Math.max(1, calculateMarketableUnits(lot, harvests, losses));
        const lotCost = allocationLedger
          .filter(
            (entry) =>
              entry.productionLotId === lot.id ||
              (entry.targetType === 'lote' && entry.targetId === lot.id) ||
              (entry.cropPlanId && lot.cropPlanId === entry.cropPlanId)
          )
          .reduce((sum, entry) => sum + money(entry.amountCents), 0);

        const quantityToChannel = lot.harvests.reduce(
          (sum, harvest) =>
            sum +
            harvest.destinationBreakdown
              .filter((destination) => destination.channelId === channel.id)
              .reduce((channelSum, destination) => channelSum + money(destination.quantity), 0),
          0
        );

        if (quantityToChannel <= 0 || lotCost <= 0) return acc;
        return acc + Math.round(lotCost * (quantityToChannel / lotMarketable));
      }, 0);

      const marginCents = revenueCents - costCents;
      return {
        channelId: channel.id,
        channelName: channel.name,
        revenueCents,
        costCents,
        marginCents,
        marginPct: revenueCents > 0 ? (marginCents / revenueCents) * 100 : 0
      };
    });

  const kpi = calculateDashboardKpi({
    costs,
    purchases,
    maintenance,
    investments,
    implantation: implantationItems,
    implantationItems,
    implantationProjects,
    channels,
    crops,
    cropPlans: realPlans,
    lots,
    unitEconomicsRows: realEconomics.rows,
    marginsByChannel: realMarginByChannel
  });

  const attentionPoints = [
    ...buildAttentionPoints({
      costs,
      purchases,
      maintenance,
      investments,
      implantation: implantationItems,
      implantationItems,
      implantationProjects,
      channels,
      crops,
      cropPlans: realPlans,
      lots,
      unitEconomicsRows: realEconomics.rows,
      marginsByChannel: realMarginByChannel
    }),
    ...purchases
      .filter((purchase) => purchase.isStockable && (!purchase.receivedQuantity || !purchase.receivedUnit))
      .map((purchase) => ({
        id: `purchase-without-receiving-${purchase.id}`,
        title: 'Compra sem recebimento',
        description: `${purchase.name} foi comprada, mas ainda não entrou no estoque.`,
        severity: 'medium' as const
      })),
    ...inventoryLots
      .filter((lot) => {
        if (!lot.expirationDate) return false;
        const today = new Date();
        const expiration = new Date(lot.expirationDate);
        const diffDays = Math.round((expiration.getTime() - today.getTime()) / 86400000);
        return diffDays <= 15;
      })
      .map((lot) => ({
        id: `inventory-expiring-${lot.id}`,
        title: 'Lote do estoque vencendo',
        description: `${lot.code} vence logo e precisa de uso ou baixa.`,
        severity: 'high' as const
      })),
    ...applications
      .filter((application) => application.areaNodeIds.length === 0 || !application.cropId || application.quantityApplied <= 0)
      .map((application) => ({
        id: `application-incomplete-${application.id}`,
        title: 'Aplicação incompleta',
        description: 'Tem aplicação sem área, cultura ou quantidade fechada.',
        severity: 'high' as const
      })),
    ...realEconomics.rows
      .filter((row) => !row.plannedOnly && row.suggestedSalePricePerUnitCents < row.minimumSalePricePerUnitCents)
      .map((row) => ({
        id: `price-under-minimum-${row.cropId}`,
        title: 'Preço abaixo do mínimo',
        description: `${row.cropName} está com preço abaixo do piso do custo real.`,
        severity: 'high' as const
      })),
    ...realPlans
      .filter((plan) => !lots.some((lot) => lot.cropPlanId === plan.id && lot.harvests.length > 0))
      .map((plan) => ({
        id: `plan-without-harvest-${plan.id}`,
        title: 'Plano sem colheita lançada',
        description: `Ainda não existe colheita registrada para o plano ${plan.id}.`,
        severity: 'medium' as const
      }))
  ].slice(0, 12);

  const continuityByPlan = realPlans.map((plan) => ({
    plan,
    continuity: calculateProductionContinuity(plan, beds, channels)
  }));

  const inventoryAtRiskCount = inventoryLots.filter((lot) => {
    if (lot.status === 'vencido') return true;
    if (!lot.expirationDate) return false;
    const today = new Date();
    const expiration = new Date(lot.expirationDate);
    return Math.round((expiration.getTime() - today.getTime()) / 86400000) <= 15;
  }).length;

  const hasCultures = crops.length > 0;
  const hasPlans = plans.length > 0;
  const hasBaseArea = beds.length > 0 || plans.some((plan) => plan.areaTotalSqm > 0 || plan.bedCount > 0);
  const hasDestinations = channels.length > 0;
  const hasPurchases = purchases.length > 0;
  const hasStock = inventoryLots.length > 0;
  const hasApplications = applications.length > 0;
  const hasHarvests = harvests.length > 0;
  const hasHarvestDestinations = harvests.some((harvest) =>
    harvest.destinationBreakdown.some((destination) => money(destination.quantity) > 0)
  );
  const hasRealCosts = realPlans.some((plan) => !plan.plannedOnly && plan.appropriatedCostCents > 0);
  const canShowPlannedMetrics = plannedEconomics.rows.length > 0;
  const canShowRealMetrics = hasRealCosts && hasHarvestDestinations;

  let operationStage: OperationStage = 'comeco_absoluto';
  if (hasCultures && hasPlans && hasBaseArea && hasDestinations) {
    operationStage = 'base_montada';
  }
  if (hasPurchases || hasStock || hasApplications) {
    operationStage = 'operacao_parcial';
  }
  if (hasStock && hasApplications && hasHarvests && hasHarvestDestinations && canShowRealMetrics) {
    operationStage = 'conta_real_ativa';
  }

  const operationChecklist: OperationChecklistItem[] = [
    {
      id: 'culture',
      label: 'Cultura',
      done: hasCultures,
      route: 'production-planning',
      description: hasCultures ? 'Ja existe pelo menos uma cultura criada.' : 'Defina o que voce planta primeiro.'
    },
    {
      id: 'area',
      label: 'Tamanho da área',
      done: hasBaseArea,
      route: 'production-planning',
      description: hasBaseArea ? 'Área e canteiros já calculados.' : 'Calcule quanto cabe nos seus canteiros.'
    },
    {
      id: 'destination',
      label: 'Destinos (Vendas)',
      done: hasDestinations,
      route: 'demand-channels',
      description: hasDestinations ? 'Destinos já definidos.' : 'Diga para quem você vai produzir.'
    },
    {
      id: 'purchase',
      label: 'Pedir as mudas',
      done: hasPurchases,
      route: 'purchases',
      description: hasPurchases ? 'Pedido de mudas registrado.' : 'A vida começa quando você pede as mudas.'
    },
    {
      id: 'stock',
      label: 'Receber insumos',
      done: hasStock,
      route: 'inventory',
      description: hasStock ? 'Insumos já estão no galpão.' : 'Confirme se o que você pediu já chegou.'
    },
    {
      id: 'application',
      label: 'Plantar e cuidar',
      done: hasApplications,
      route: 'field-operations',
      description: hasApplications ? 'O plantio está em andamento.' : 'Conte quando você colocar a muda na terra.'
    },
    {
      id: 'harvest',
      label: 'Colheita',
      done: hasHarvests,
      route: 'harvest',
      description: hasHarvests ? 'Ja existe colheita registrada.' : 'Sem colheita o sistema ainda nao sabe o vendavel.'
    },
    {
      id: 'destination-real',
      label: 'Saida',
      done: hasHarvestDestinations,
      route: 'harvest',
      description: hasHarvestDestinations ? 'Ja existe saida ligada a colheita.' : 'Sem destino a margem real nao fecha.'
    }
  ];

  const nextActionByStage: Record<
    OperationStage,
    { label: string; description: string; route: string }
  > = {
    comeco_absoluto: hasCultures
      ? {
          label: 'Criar primeiro plano',
          description: 'Sem plano e area base o sistema ainda nao consegue te guiar no dia a dia.',
          route: 'production-planning'
        }
      : {
          label: 'Criar primeira cultura',
          description: 'Comece dizendo o que voce planta. O resto o sistema vai montando junto.',
          route: 'production-planning'
        },
    base_montada: {
      label: hasPurchases ? 'Receber no galpão' : 'Pedir as mudas',
      description: hasPurchases
        ? 'O pedido foi feito. Agora confirme o que chegou no galpão.'
        : 'A base está pronta. Peça as mudas para a vida da fazenda começar de verdade.',
      route: hasPurchases ? 'inventory' : 'purchases'
    },
    operacao_parcial: {
      label: hasApplications ? 'Registrar colheita' : 'Registrar plantio',
      description: hasApplications
        ? 'Falta colher e vender para o sistema fechar a conta real.'
        : 'O custo real começa quando você coloca a muda no canteiro.',
      route: hasApplications ? 'harvest' : 'field-operations'
    },
    conta_real_ativa: {
      label: 'Abrir custo real',
      description: 'Agora ja da para comparar o que foi planejado com o que aconteceu de verdade.',
      route: 'real-costs'
    }
  };

  const dataGaps = operationChecklist.filter((item) => !item.done).map((item) => item.label);
  const zeroedMetrics = {
    realCost: {
      value: 'R$ 0,00',
      reason: hasStock ? 'Falta registrar uso, aplicacao e colheita.' : 'Falta registrar entrada no estoque.'
    },
    minimumPrice: {
      value: 'R$ 0,00',
      reason: hasHarvests ? 'Falta fechar o vendavel e o valor apropriado.' : 'Falta registrar colheita e perdas.'
    },
    realMargin: {
      value: '0%',
      reason: hasHarvestDestinations ? 'Falta base real suficiente para fechar a margem.' : 'Sem destino real a margem nao fecha.'
    },
    marketable: {
      value: '0',
      reason: hasHarvests ? 'A colheita ainda nao fechou o que ficou bom para vender.' : 'Sem colheita o sistema nao sabe o que ficou bom para vender.'
    }
  };

  return {
    recurring,
    implantationTotals,
    economics: plannedEconomics,
    plannedEconomics,
    realEconomics,
    realMarginByChannel,
    agroReturn,
    kpi,
    attentionPoints,
    continuityByPlan,
    costs,
    purchases,
    maintenance,
    investments,
    implantation: implantationItems,
    implantationItems,
    implantationProjects,
    implantationProjectGroups,
    channels,
    crops,
    plans,
    realPlans,
    beds,
    lots,
    harvests,
    inventory: {
      products: inventoryProducts,
      lots: inventoryLots,
      movements: stockMovements,
      lossTotalCents: calculateInventoryLossTotal(losses, inventoryLots),
      atRiskCount: inventoryAtRiskCount
    },
    applications,
    losses,
    labor,
    equipmentUsage,
    allocationLedger,
    operationStage,
    operationChecklist,
    nextAction: nextActionByStage[operationStage],
    dataGaps,
    zeroedMetrics,
    canShowPlannedMetrics,
    canShowRealMetrics
  };
};

export type FarmSnapshot = ReturnType<typeof buildFarmSnapshotFromState>;
