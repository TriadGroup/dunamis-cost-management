import type {
  CostAllocationLedgerEntry,
  Lot,
  Quotation,
  UnitEconomicsRow
} from '@/entities';
import { formatUnitLabel } from '@/shared/lib/format';
import type {
  ExportColumn,
  ExportFormulaValue,
  ExportMetric,
  ExportRow,
  ExportSheet,
  FarmExportSnapshot
} from '@/features/export/types';

const toReais = (valueCents?: number | null): number => Math.round((Number(valueCents ?? 0) / 100) * 100) / 100;
const toPercent = (value?: number | null): number => Number(value ?? 0) / 100;
const asText = (value?: string | null): string => value?.trim() || '';
const yesNo = (value: boolean): string => (value ? 'Sim' : 'Não');

const setupProfileLabel: Record<string, string> = {
  horta: 'Horta',
  grande_cultura: 'Grande cultura',
  pomar: 'Pomar',
  cultivo_protegido: 'Cultivo protegido',
  agrofloresta: 'Agrofloresta',
  pecuaria: 'Pecuária',
  viveiro: 'Viveiro',
  operacao_mista: 'Operação mista'
};

const setupStructureLabel: Record<string, string> = {
  canteiros: 'Canteiros',
  estufas: 'Estufas',
  talhoes: 'Talhões',
  areas_irrigadas: 'Áreas irrigadas',
  areas_mecanizadas: 'Áreas mecanizadas',
  pomar: 'Pomar',
  cozinha_interna: 'Cozinha interna',
  box: 'Box',
  deposito: 'Depósito',
  oficina: 'Oficina',
  camara_fria: 'Câmara fria',
  viveiro: 'Viveiro',
  outro: 'Outro'
};

const setupChannelLabel: Record<string, string> = {
  cozinha_interna: 'Cozinha interna',
  box: 'Box',
  feira_eventos: 'Feira / eventos',
  mercado_regional: 'Mercado regional',
  venda_direta: 'Venda direta',
  atacado_granel: 'Atacado / granel',
  excedente: 'Excedente',
  consumo_interno: 'Consumo interno',
  doacao: 'Doação'
};

const startingPointLabel: Record<string, string> = {
  implantacao: 'Implantação agora',
  importar_planilhas: 'Importar planilhas',
  custos_recorrentes: 'Custos recorrentes',
  ativos_equipamentos: 'Ativos e equipamentos',
  investimentos_financiamentos: 'Investimentos e financiamentos',
  estrutura_minima: 'Estrutura mínima'
};

const scenarioKindLabel: Record<string, string> = {
  baseline: 'Base operacional',
  extraordinario: 'Extraordinário',
  stress_test: 'Stress test'
};

const demandChannelTypeLabel: Record<string, string> = {
  kitchen: 'Cozinha',
  box: 'Box',
  event: 'Evento',
  'external-market': 'Mercado',
  surplus: 'Excedente'
};

const severityLabel: Record<string, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa'
};

const recommendationLabel: Record<string, string> = {
  manter: 'Manter',
  trocar: 'Trocar',
  avaliar: 'Avaliar'
};

export const TECHNICAL_METRICS_DATA_START_ROW = 8;

const average = (values: number[]) => (values.length ? values.reduce((acc, value) => acc + value, 0) / values.length : 0);

interface TechnicalMetricRow extends ExportRow {
  metricKey: string;
  label: string;
  value: string | number | null;
  unit: string;
  origem: string;
}

const currencyColumn = (key: string, header: string, width = 16): ExportColumn => ({ key, header, width, format: 'currency' });
const percentColumn = (key: string, header: string, width = 13): ExportColumn => ({ key, header, width, format: 'percent' });
const dateColumn = (key: string, header: string, width = 14): ExportColumn => ({ key, header, width, format: 'date' });
const numberColumn = (key: string, header: string, width = 14): ExportColumn => ({ key, header, width, format: 'number' });
const integerColumn = (key: string, header: string, width = 12): ExportColumn => ({ key, header, width, format: 'integer' });
const textColumn = (key: string, header: string, width = 24): ExportColumn => ({ key, header, width, format: 'text' });
const selectColumn = (key: string, header: string, dropdown: string[], width = 24): ExportColumn => ({
  key,
  header,
  width,
  format: 'text',
  dropdown
});

const yesNoOptions = ['Sim', 'Não'];
const setupStatusOptions = ['idle', 'in_progress', 'completed'];
const severityOptions = ['Alta', 'Média', 'Baixa'];
const implantationStatusOptions = ['planejado', 'cotando', 'negociando', 'aprovado', 'comprado', 'pago'];
const implantationPaymentOptions = ['a_vista', 'parcelado', 'financiado', 'consorcio'];
const costRecurrenceOptions = ['unico', 'recorrente', 'sazonal', 'por_ciclo', 'extraordinario'];
const paymentStatusOptions = ['pendente', 'parcial', 'pago', 'atrasado'];
const purchaseStatusOptions = ['planejada', 'comprada', 'recebida', 'cancelada'];
const purchaseCategoryOptions = ['mudas', 'sementes', 'adubo', 'defensivo', 'irrigacao', 'embalagem', 'epi', 'estrutura', 'geral'];
const channelPricingOptions = ['unit', 'weight', 'box', 'bulk'];
const cropCategoryOptions = ['folhosa', 'legume', 'erva', 'fruto', 'raiz', 'grandes culturas', 'outro'];
const purchasePackOptions = ['caixa', 'bandeja', 'saco', 'pacote', 'unidade', 'kg de semente', 'outro'];
const salesUnitOptions = ['unidade', 'caixa', 'maço', 'bandeja', 'kg', 'outro'];
const planStatusOptions = ['draft', 'planejado', 'ativo', 'em_cultivo', 'encerrado', 'pausado'];
const maintenanceTypeOptions = ['preventiva', 'corretiva'];
const maintenanceCadenceOptions = ['recorrente', 'sob_demanda'];
const recommendationOptions = ['Manter', 'Trocar', 'Avaliar'];
const investmentModalityOptions = ['avista', 'financiamento', 'consorcio'];
const genericActiveOptions = ['ativo', 'inativo'];
const traceabilityStatusOptions = ['incompleta', 'parcial', 'completa'];
const scenarioKindOptions = ['Base operacional', 'Extraordinário', 'Stress test'];
const demandChannelTypeOptions = ['Cozinha', 'Box', 'Evento', 'Mercado', 'Excedente'];

const buildLookups = (snapshot: FarmExportSnapshot) => {
  const { setup } = snapshot;
  const { snapshot: farm } = snapshot;
  const cropById = new Map(farm.crops.map((crop) => [crop.id, crop]));
  const planById = new Map(farm.realPlans.map((plan) => [plan.id, plan]));
  const lotById = new Map(farm.lots.map((lot) => [lot.id, lot]));
  const channelById = new Map(farm.channels.map((channel) => [channel.id, channel]));
  const productById = new Map(farm.inventory.products.map((product) => [product.id, product]));
  const inventoryLotById = new Map(farm.inventory.lots.map((lot) => [lot.id, lot]));
  const purchaseById = new Map(farm.purchases.map((purchase) => [purchase.id, purchase]));
  const projectById = new Map(farm.implantationProjects.map((project) => [project.id, project]));

  return {
    cropById,
    planById,
    lotById,
    channelById,
    productById,
    inventoryLotById,
    purchaseById,
    projectById,
    setup
  };
};

const firstUsefulEconomicsRow = (snapshot: FarmExportSnapshot): UnitEconomicsRow | null => {
  const rows = snapshot.snapshot.realEconomics.rows;
  return rows.find((row) => !row.plannedOnly && row.marketableUnits > 0) ?? rows[0] ?? snapshot.snapshot.plannedEconomics.rows[0] ?? null;
};

const buildTechnicalMetricRows = (snapshot: FarmExportSnapshot): TechnicalMetricRow[] => {
  const { snapshot: farm } = snapshot;
  const focusRow = firstUsefulEconomicsRow(snapshot);
  const totalMarginPct =
    farm.realMarginByChannel.reduce((acc, row) => acc + row.marginPct, 0) / Math.max(1, farm.realMarginByChannel.length);
  const availableInventoryValue = farm.inventory.lots.reduce(
    (acc, lot) => acc + Math.round((lot.quantityAvailable || 0) * (lot.unitCostCents || 0)),
    0
  );
  const highAlerts = farm.attentionPoints.filter((item) => item.severity === 'high').length;
  const mediumAlerts = farm.attentionPoints.filter((item) => item.severity === 'medium').length;
  const lowAlerts = farm.attentionPoints.filter((item) => item.severity === 'low').length;
  const stockablePurchases = farm.purchases.filter((item) => item.isStockable).length;
  const receivedPurchases = farm.purchases.filter((item) => item.receivedAt).length;
  const linkedCosts = farm.costs.filter(
    (item) => item.linkedCropId || item.linkedLotId || item.linkedChannelId || item.linkedCostCenter
  ).length;
  const applicationsWithArea = farm.applications.filter((item) => item.appliedAreaSqm > 0);
  const harvestDestinationValueCents = farm.harvests.reduce(
    (acc, harvest) =>
      acc + harvest.destinationBreakdown.reduce((destinationAcc, destination) => destinationAcc + Number(destination.valueCents || 0), 0),
    0
  );
  const activeChannels = farm.channels.filter((channel) => channel.enabled);
  const averageAcceptedPriceCents = average(activeChannels.map((channel) => Number(channel.acceptedPriceCents || 0)));
  const averageTransferPriceCents = average(activeChannels.map((channel) => Number(channel.transferPriceCents || 0)));
  const averageCycleDays = average(farm.crops.map((crop) => crop.cycleDays));
  const averageMarkup = average(farm.crops.map((crop) => crop.defaultMarkupPct));
  const averageLossRate = average(farm.crops.map((crop) => crop.defaultLossRate));
  const totalPlanArea = farm.realPlans.reduce((acc, plan) => acc + Number(plan.areaTotalSqm || 0), 0);
  const totalPlanCostCents = farm.realPlans.reduce((acc, plan) => acc + Number(plan.costTotalCents || 0), 0);
  const totalMarketableUnits = farm.realPlans.reduce((acc, plan) => acc + Number(plan.marketableUnits || plan.viableUnits || 0), 0);
  const economicsRows = farm.realEconomics.rows.length ? farm.realEconomics.rows : farm.plannedEconomics.rows;
  const averageCostPerUnitCents = average(economicsRows.map((row) => Number(row.costPerUnitCents || 0)));
  const averageSuggestedPriceCents = average(economicsRows.map((row) => Number(row.suggestedSalePricePerUnitCents || 0)));
  const averageEconomicsMargin = average(
    economicsRows.map((row) =>
      row.suggestedSalePricePerUnitCents > 0 ? row.estimatedProfitPerUnitCents / row.suggestedSalePricePerUnitCents : 0
    )
  );
  const totalEconomicsProfitCents = economicsRows.reduce((acc, row) => acc + Number(row.estimatedProfitPerUnitCents || 0), 0);
  const totalLaborHours = farm.labor.reduce((acc, record) => acc + Number(record.hoursWorked || 0), 0);
  const totalLaborCostCents = farm.labor.reduce((acc, record) => acc + Number(record.totalCostCents || 0), 0);
  const totalEquipmentHours = farm.equipmentUsage.reduce((acc, record) => acc + Number(record.hoursUsed || 0), 0);
  const totalEquipmentCostCents = farm.equipmentUsage.reduce((acc, record) => acc + Number(record.usageCostCents || 0), 0);
  const totalFuelCostCents = farm.equipmentUsage.reduce((acc, record) => acc + Number(record.fuelCostCents || 0), 0);
  const totalMaintenanceReserveCents = farm.maintenance.reduce((acc, event) => acc + Number(event.monthlyReserveCents || 0), 0);
  const totalMaintenanceAnnualCents = farm.maintenance.reduce((acc, event) => acc + Number(event.annualEquivalentCents || 0), 0);
  const totalDowntimeDays = farm.maintenance.reduce((acc, event) => acc + Number(event.downtimeDays || 0), 0);
  const totalInvestmentsCommittedCents = farm.investments.reduce((acc, contract) => acc + Number(contract.totalCommittedCents || 0), 0);
  const totalMonthlyInstallmentsCents = farm.investments.reduce((acc, contract) => acc + Number(contract.monthlyInstallmentCents || 0), 0);
  const totalExpectedReturnCents = farm.investments.reduce((acc, contract) => acc + Number(contract.expectedMonthlyReturnCents || 0), 0);
  const traceabilityCompleteLots = farm.lots.filter((lot) => lot.traceabilityStatus === 'completa').length;
  const lotMarketableQuantity = farm.lots.reduce((acc, lot) => acc + Number(lot.marketableQuantity || 0), 0);
  const changedChannels = farm.channels.filter((channel) => channel.scenarioDemand !== channel.baselineDemand).length;

  return [
    { metricKey: 'generated_at', label: 'Gerado em', value: snapshot.generatedAt, unit: '', origem: 'export' },
    { metricKey: 'monthly_inflow', label: 'Entrada do mês', value: toReais(farm.kpi.monthlyInflowCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'monthly_outflow', label: 'Saída do mês', value: toReais(farm.kpi.monthlyOutflowCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'projected_balance', label: 'Saldo projetado', value: toReais(farm.kpi.projectedBalanceCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'recurring_cost', label: 'Custo recorrente', value: toReais(farm.kpi.recurringCostCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'implantation_committed', label: 'Implantação comprometida', value: toReais(farm.kpi.implantationCommittedCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'agro_return', label: 'Retorno do agro', value: toReais(farm.kpi.agroReturnCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'payback_months', label: 'Payback estimado', value: farm.kpi.paybackMonths ?? null, unit: 'meses', origem: 'snapshot' },
    { metricKey: 'focus_cost_per_unit', label: 'Custo por unidade foco', value: toReais(focusRow?.costPerUnitCents), unit: focusRow?.unitLabel || 'unidade', origem: 'snapshot' },
    { metricKey: 'focus_suggested_sale', label: 'Preço sugerido foco', value: toReais(focusRow?.suggestedSalePricePerUnitCents), unit: focusRow?.unitLabel || 'unidade', origem: 'snapshot' },
    { metricKey: 'focus_margin', label: 'Margem foco', value: focusRow && focusRow.suggestedSalePricePerUnitCents > 0 ? (focusRow.estimatedProfitPerUnitCents / focusRow.suggestedSalePricePerUnitCents) : 0, unit: '%', origem: 'snapshot' },
    { metricKey: 'total_margin', label: 'Margem média canais', value: totalMarginPct / 100, unit: '%', origem: 'snapshot' },
    { metricKey: 'attention_points', label: 'Pontos de atenção', value: farm.attentionPoints.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'crops_count', label: 'Culturas', value: farm.crops.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'plans_count', label: 'Planos', value: farm.realPlans.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'lots_count', label: 'Lotes', value: farm.lots.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'inventory_risk', label: 'Lotes de estoque em risco', value: farm.inventory.atRiskCount, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'setup_profiles_count', label: 'Perfis ativos', value: snapshot.setup.productionProfiles.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'setup_structures_count', label: 'Estruturas', value: snapshot.setup.structures.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'setup_channels_count', label: 'Canais do setup', value: snapshot.setup.channels.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'setup_productive_area', label: 'Área produtiva', value: snapshot.setup.identity.productiveArea, unit: snapshot.setup.identity.areaUnit, origem: 'snapshot' },
    { metricKey: 'implantation_projects_count', label: 'Projetos implantação', value: farm.implantationProjectGroups.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'implantation_items_count', label: 'Itens implantação', value: farm.implantationItems.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'implantation_quotes_count', label: 'Cotações implantação', value: farm.implantationItems.reduce((acc, item) => acc + item.quotations.length, 0), unit: 'itens', origem: 'snapshot' },
    { metricKey: 'implantation_open', label: 'Implantação em aberto', value: toReais(farm.implantationTotals.openCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'costs_count', label: 'Custos cadastrados', value: farm.costs.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'costs_event_total', label: 'Valor evento custos', value: toReais(farm.costs.reduce((acc, item) => acc + Number(item.eventValueCents || 0), 0)), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'costs_linked_count', label: 'Custos vinculados', value: linkedCosts, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'purchases_count', label: 'Compras', value: farm.purchases.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'purchases_total', label: 'Compras total', value: toReais(farm.purchases.reduce((acc, item) => acc + Number(item.eventValueCents || 0), 0)), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'purchases_stockable_count', label: 'Compras que viram estoque', value: stockablePurchases, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'purchases_received_count', label: 'Compras recebidas', value: receivedPurchases, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'inventory_products_count', label: 'Produtos estoque', value: farm.inventory.products.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'inventory_lots_count', label: 'Lotes estoque', value: farm.inventory.lots.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'inventory_available_value', label: 'Valor disponível estoque', value: toReais(availableInventoryValue), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'applications_count', label: 'Aplicações', value: farm.applications.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'applications_area_total', label: 'Área aplicada', value: applicationsWithArea.reduce((acc, item) => acc + Number(item.appliedAreaSqm || 0), 0), unit: 'm²', origem: 'snapshot' },
    { metricKey: 'applications_quantity_total', label: 'Quantidade aplicada', value: farm.applications.reduce((acc, item) => acc + Number(item.quantityApplied || 0), 0), unit: 'mista', origem: 'snapshot' },
    { metricKey: 'losses_count', label: 'Perdas registradas', value: farm.losses.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'losses_total_cost', label: 'Custo estimado perdas', value: toReais(farm.losses.reduce((acc, item) => acc + Number(item.estimatedCostCents || 0), 0)), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'harvests_count', label: 'Colheitas', value: farm.harvests.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'harvests_total_gross', label: 'Colheita bruta', value: farm.harvests.reduce((acc, item) => acc + Number(item.grossQuantity || item.quantity || 0), 0), unit: 'mista', origem: 'snapshot' },
    { metricKey: 'harvests_total_marketable', label: 'Colheita comercial', value: farm.harvests.reduce((acc, item) => acc + Number(item.marketableQuantity || 0), 0), unit: 'mista', origem: 'snapshot' },
    { metricKey: 'harvests_total_value', label: 'Valor destinos colheita', value: toReais(harvestDestinationValueCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'channels_active_count', label: 'Canais ativos', value: activeChannels.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'channels_average_accepted_price', label: 'Preço aceito médio', value: toReais(averageAcceptedPriceCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'channels_average_transfer_price', label: 'Preço transferência médio', value: toReais(averageTransferPriceCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'cultures_average_cycle', label: 'Ciclo médio culturas', value: averageCycleDays, unit: 'dias', origem: 'snapshot' },
    { metricKey: 'cultures_average_markup', label: 'Margem base média culturas', value: averageMarkup / 100, unit: '%', origem: 'snapshot' },
    { metricKey: 'cultures_average_loss', label: 'Perda base média culturas', value: averageLossRate / 100, unit: '%', origem: 'snapshot' },
    { metricKey: 'plans_total_area', label: 'Área total planos', value: totalPlanArea, unit: 'm²', origem: 'snapshot' },
    { metricKey: 'plans_total_cost', label: 'Custo total planos', value: toReais(totalPlanCostCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'plans_total_viable_units', label: 'Unidades viáveis planos', value: totalMarketableUnits, unit: 'mista', origem: 'snapshot' },
    { metricKey: 'economics_average_cost_unit', label: 'Custo médio unit economics', value: toReais(averageCostPerUnitCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'economics_average_suggested_price', label: 'Preço sugerido médio', value: toReais(averageSuggestedPriceCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'economics_average_margin', label: 'Margem média unit economics', value: averageEconomicsMargin, unit: '%', origem: 'snapshot' },
    { metricKey: 'economics_total_profit_unit', label: 'Lucro unitário somado', value: toReais(totalEconomicsProfitCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'labor_records_count', label: 'Registros de mão de obra', value: farm.labor.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'labor_total_hours', label: 'Horas de mão de obra', value: totalLaborHours, unit: 'horas', origem: 'snapshot' },
    { metricKey: 'labor_total_cost', label: 'Custo mão de obra', value: toReais(totalLaborCostCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'equipment_records_count', label: 'Registros de equipamento', value: farm.equipmentUsage.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'equipment_total_hours', label: 'Horas equipamento', value: totalEquipmentHours, unit: 'horas', origem: 'snapshot' },
    { metricKey: 'equipment_total_cost', label: 'Custo equipamento', value: toReais(totalEquipmentCostCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'equipment_fuel_total', label: 'Combustível equipamento', value: toReais(totalFuelCostCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'maintenance_records_count', label: 'Eventos manutenção', value: farm.maintenance.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'maintenance_monthly_reserve_total', label: 'Reserva mensal manutenção', value: toReais(totalMaintenanceReserveCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'maintenance_annual_total', label: 'Equiv. anual manutenção', value: toReais(totalMaintenanceAnnualCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'maintenance_downtime_total', label: 'Dias parados manutenção', value: totalDowntimeDays, unit: 'dias', origem: 'snapshot' },
    { metricKey: 'investments_count', label: 'Investimentos', value: farm.investments.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'investments_committed_total', label: 'Investimentos comprometidos', value: toReais(totalInvestmentsCommittedCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'investments_monthly_total', label: 'Parcela mensal investimentos', value: toReais(totalMonthlyInstallmentsCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'investments_expected_return_total', label: 'Retorno esperado investimentos', value: toReais(totalExpectedReturnCents), unit: 'R$', origem: 'snapshot' },
    { metricKey: 'lots_traceability_complete', label: 'Lotes rastreáveis', value: traceabilityCompleteLots, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'lots_marketable_total', label: 'Lotes comercializáveis', value: lotMarketableQuantity, unit: 'mista', origem: 'snapshot' },
    { metricKey: 'calendar_guidelines_count', label: 'Guidelines calendário', value: snapshot.calendar.guidelines.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'calendar_photoperiod_count', label: 'Meses fotoperíodo', value: snapshot.calendar.photoperiod.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'scenarios_count', label: 'Cenários', value: snapshot.scenarios.cashScenarios.length, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'scenarios_channels_changed', label: 'Canais alterados no cenário', value: changedChannels, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'alerts_high_count', label: 'Alertas altos', value: highAlerts, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'alerts_medium_count', label: 'Alertas médios', value: mediumAlerts, unit: 'itens', origem: 'snapshot' },
    { metricKey: 'alerts_low_count', label: 'Alertas baixos', value: lowAlerts, unit: 'itens', origem: 'snapshot' }
  ];
};

const buildMetricFormulaMap = (rows: TechnicalMetricRow[]) =>
  new Map(
    rows.map((row) => [
      row.metricKey as string,
      {
        formula: `IFERROR(INDEX('99_Base_Tecnica'!C:C,MATCH("${row.metricKey}",'99_Base_Tecnica'!A:A,0)),"")`,
        result: row.value
      } satisfies ExportFormulaValue
    ])
  );

const buildSummaryMetric = (
  formulaMap: Map<string, ExportFormulaValue>,
  key: string,
  label: string,
  format: ExportColumn['format'],
  tone: ExportMetric['tone'],
  hint: string
): ExportMetric => ({
  key,
  label,
  value: formulaMap.get(key) ?? '',
  format,
  tone,
  hint
});

const joinAreaNodes = (areaNodeIds: string[]) => (areaNodeIds.length ? areaNodeIds.join(', ') : '');

const flattenImplantationQuotations = (snapshot: FarmExportSnapshot): Array<Quotation & { itemId: string; itemName: string; projectName: string }> => {
  const { projectById } = buildLookups(snapshot);
  return snapshot.snapshot.implantationItems.flatMap((item) =>
    item.quotations.map((quotation) => ({
      ...quotation,
      itemId: item.id,
      itemName: item.name,
      projectName: projectById.get(item.projectId)?.name || ''
    }))
  );
};

const buildScenarioComparisonRows = (snapshot: FarmExportSnapshot): ExportRow[] => {
  const { snapshot: farm, scenarios } = snapshot;
  return farm.channels.map((channel) => ({
    canal: channel.name,
    tipo: demandChannelTypeLabel[channel.type] || channel.type,
    unidade: formatUnitLabel(channel.demandUnit),
    demanda_base: channel.baselineDemand,
    demanda_cenario: channel.scenarioDemand,
    variacao_absoluta: channel.scenarioDemand - channel.baselineDemand,
    variacao_pct:
      channel.baselineDemand > 0 ? (channel.scenarioDemand - channel.baselineDemand) / channel.baselineDemand : 0,
    cenario_ativo:
      scenarios.demandScenarios.find((entry) => entry.id === scenarios.activeDemandScenarioId)?.name || 'Sem cenário'
  }));
};

const buildHarvestRows = (snapshot: FarmExportSnapshot): ExportRow[] => {
  const { cropById, planById, lotById, channelById } = buildLookups(snapshot);
  return snapshot.snapshot.harvests.flatMap<ExportRow>((harvest) => {
    const lot = lotById.get(harvest.lotId);
    const crop = lot ? cropById.get(lot.cropId) : undefined;
    const plan = lot?.cropPlanId ? planById.get(lot.cropPlanId) : undefined;
    if (harvest.destinationBreakdown.length === 0) {
      return [{
        colheita_id: harvest.id,
        data: harvest.harvestedAt,
        lote: lot?.code || '',
        cultura: crop?.name || '',
        plano: plan?.seasonLabel || plan?.id || '',
        quantidade_bruta: harvest.grossQuantity,
        quantidade_comercial: harvest.marketableQuantity,
        perda: harvest.lossQuantity,
        unidade: formatUnitLabel(harvest.unit),
        destino: '',
        quantidade_destino: null,
        valor_destino: null
      }];
    }

    return harvest.destinationBreakdown.map((destination) => ({
      colheita_id: harvest.id,
      data: harvest.harvestedAt,
      lote: lot?.code || '',
      cultura: crop?.name || '',
      plano: plan?.seasonLabel || plan?.id || '',
      quantidade_bruta: harvest.grossQuantity,
      quantidade_comercial: harvest.marketableQuantity,
      perda: harvest.lossQuantity,
      unidade: formatUnitLabel(harvest.unit),
      destino: channelById.get(destination.channelId)?.name || destination.channelId,
      quantidade_destino: destination.quantity,
      valor_destino: toReais(destination.valueCents)
    }));
  });
};

const buildUnitEconomicsRows = (label: string, rows: UnitEconomicsRow[]): ExportRow[] =>
  rows.map((row) => ({
    visao: label,
    cultura: row.cropName,
    variedade: row.cropVariety,
    unidade: row.unitLabel,
    vendas_em: formatUnitLabel(row.salesUnit),
    unidades_por_caixa: row.unitsPerSalesBox,
    custo_total: toReais(row.totalCostCents),
    custo_por_unidade: toReais(row.costPerUnitCents),
    custo_por_caixa: toReais(row.costPerBoxCents),
    preco_minimo: toReais(row.minimumSalePricePerUnitCents),
    preco_sugerido_unidade: toReais(row.suggestedSalePricePerUnitCents),
    preco_sugerido_caixa: toReais(row.suggestedSalePricePerBoxCents),
    lucro_unidade: toReais(row.estimatedProfitPerUnitCents),
    lucro_caixa: toReais(row.estimatedProfitPerBoxCents),
    unidades_viaveis: row.viableUnits,
    unidades_comerciais: row.marketableUnits,
    caixas_previstas: row.yieldBoxes,
    margem_unidade:
      row.suggestedSalePricePerUnitCents > 0 ? row.estimatedProfitPerUnitCents / row.suggestedSalePricePerUnitCents : 0,
    origem: row.plannedOnly ? 'Planejado' : 'Real'
  }));

const buildDictionarySheet = (sheets: ExportSheet[]): ExportSheet => {
  const descriptions: Record<string, string> = {
    cultura: 'Nome do cultivo ou da cultura usada como base.',
    plano: 'Plano de produção ligado à cultura.',
    lote: 'Código do lote de produção ou do estoque.',
    unidade: 'Unidade usada no registro.',
    custo_total: 'Custo consolidado daquele registro.',
    custo_por_unidade: 'Quanto custa cada unidade comercializável.',
    preco_sugerido_unidade: 'Preço sugerido com base no custo e na margem.',
    margem_unidade: 'Lucro percentual sobre o preço sugerido.',
    prioridade: 'Ordem de atendimento ou importância.',
    status: 'Situação atual do item.',
    fornecedor: 'Fornecedor ou origem da compra/cotação.',
    observacoes: 'Anotações livres para leitura humana.',
    quantidade: 'Quantidade registrada.',
    data: 'Data principal do registro.'
  };

  const rows: ExportRow[] = [];
  sheets
    .filter((sheet) => sheet.name !== '98_Dicionario')
    .forEach((sheet) => {
      sheet.summaryMetrics?.forEach((metric) => {
        rows.push({
          aba: sheet.name,
          secao: sheet.summaryTitle || 'Painel rápido',
          coluna: metric.label,
          chave: metric.key,
          formato: metric.format || 'text',
          significado: metric.hint || `Leitura resumida da aba ${sheet.title}.`,
          origem: 'Fórmula / base técnica'
        });
      });
      sheet.tables.forEach((table) => {
        table.columns.forEach((column) => {
          rows.push({
            aba: sheet.name,
            secao: table.title || sheet.title,
            coluna: column.header,
            chave: column.key,
            formato: column.format || 'text',
            significado: descriptions[column.key] || `Campo exportado da seção ${table.title || sheet.title}.`,
            origem: sheet.name === '00_Resumo_Executivo' ? 'Fórmula / snapshot' : 'Dados do sistema'
          });
        });
      });
    });

  return {
    name: '98_Dicionario',
    title: 'Dicionário',
    description: 'Explica as colunas exportadas, o formato, a origem e o significado de cada dado.',
    tables: [
      {
        title: 'Guia das colunas',
        description: 'Use esta aba para entender de onde cada campo veio e como ler a planilha.',
        columns: [
          textColumn('aba', 'Aba', 22),
          textColumn('secao', 'Seção', 28),
          textColumn('coluna', 'Coluna', 28),
          textColumn('chave', 'Chave técnica', 26),
          textColumn('formato', 'Formato', 16),
          textColumn('significado', 'O que significa', 54),
          textColumn('origem', 'Origem', 22)
        ],
        rows
      }
    ]
  };
};

export const buildExportSheets = (snapshot: FarmExportSnapshot): ExportSheet[] => {
  const { setup, scenarios, calendar, snapshot: farm } = snapshot;
  const lookups = buildLookups(snapshot);
  const baseMetricRows = buildTechnicalMetricRows(snapshot);
  const metricFormula = buildMetricFormulaMap(baseMetricRows);
  const focusRow = firstUsefulEconomicsRow(snapshot);
  const flattenedQuotations = flattenImplantationQuotations(snapshot);
  const activeDemandScenario = scenarios.demandScenarios.find((entry) => entry.id === scenarios.activeDemandScenarioId);
  const baselineScenario = scenarios.cashScenarios.find((entry) => entry.id === scenarios.baselineScenarioId);
  const compareScenario = scenarios.cashScenarios.find((entry) => entry.id === scenarios.compareScenarioId);
  const summaryMetrics = {
    executive: [
      buildSummaryMetric(metricFormula, 'monthly_inflow', 'Entrada do mês', 'currency', 'forest', 'Receita e entradas internas do momento.'),
      buildSummaryMetric(metricFormula, 'projected_balance', 'Saldo projetado', 'currency', 'mist', 'Leitura consolidada da operação atual.'),
      buildSummaryMetric(metricFormula, 'focus_cost_per_unit', 'Custo foco', 'currency', 'amber', 'Quanto custa a unidade principal agora.'),
      buildSummaryMetric(metricFormula, 'focus_suggested_sale', 'Preço sugerido', 'currency', 'forest', 'Preço sugerido pelo motor atual do app.'),
      buildSummaryMetric(metricFormula, 'focus_margin', 'Margem foco', 'percent', 'sage', 'Margem estimada da cultura foco.'),
      buildSummaryMetric(metricFormula, 'attention_points', 'Pontos de atenção', 'integer', 'terracotta', 'Itens que hoje pedem ação ou revisão.')
    ],
    operation: [
      buildSummaryMetric(metricFormula, 'setup_profiles_count', 'Perfis ativos', 'integer', 'forest', 'Perfis produtivos escolhidos no setup.'),
      buildSummaryMetric(metricFormula, 'setup_structures_count', 'Estruturas', 'integer', 'mist', 'Estruturas mapeadas da operação.'),
      buildSummaryMetric(metricFormula, 'setup_channels_count', 'Canais do setup', 'integer', 'amber', 'Destinos já definidos para a fazenda.'),
      buildSummaryMetric(metricFormula, 'setup_productive_area', 'Área produtiva', 'number', 'sage', 'Área útil informada na base da operação.')
    ],
    implantation: [
      buildSummaryMetric(metricFormula, 'implantation_projects_count', 'Projetos', 'integer', 'forest', 'Frentes abertas de implantação.'),
      buildSummaryMetric(metricFormula, 'implantation_items_count', 'Itens', 'integer', 'mist', 'Itens cadastrados para colocar a operação de pé.'),
      buildSummaryMetric(metricFormula, 'implantation_committed', 'Comprometido', 'currency', 'amber', 'Quanto já está comprometido hoje.'),
      buildSummaryMetric(metricFormula, 'implantation_open', 'Em aberto', 'currency', 'terracotta', 'O que ainda falta fechar na implantação.')
    ],
    costs: [
      buildSummaryMetric(metricFormula, 'costs_count', 'Custos', 'integer', 'forest', 'Registros que hoje pesam na operação.'),
      buildSummaryMetric(metricFormula, 'recurring_cost', 'Equiv. mensal', 'currency', 'amber', 'Peso mensal consolidado dos custos.'),
      buildSummaryMetric(metricFormula, 'costs_event_total', 'Valor evento', 'currency', 'mist', 'Soma bruta dos eventos de custo.'),
      buildSummaryMetric(metricFormula, 'costs_linked_count', 'Custos vinculados', 'integer', 'sage', 'Custos já ligados a cultura, lote ou canal.')
    ],
    purchases: [
      buildSummaryMetric(metricFormula, 'purchases_count', 'Compras', 'integer', 'forest', 'Pedidos registrados no sistema.'),
      buildSummaryMetric(metricFormula, 'purchases_total', 'Valor comprado', 'currency', 'amber', 'Soma das compras lançadas.'),
      buildSummaryMetric(metricFormula, 'purchases_stockable_count', 'Viram estoque', 'integer', 'mist', 'Itens que entram no galpão.'),
      buildSummaryMetric(metricFormula, 'purchases_received_count', 'Recebidas', 'integer', 'sage', 'Compras já confirmadas como recebidas.')
    ],
    inventory: [
      buildSummaryMetric(metricFormula, 'inventory_products_count', 'Produtos', 'integer', 'forest', 'Produtos cadastrados para controle.'),
      buildSummaryMetric(metricFormula, 'inventory_lots_count', 'Lotes', 'integer', 'mist', 'Lotes atualmente no estoque.'),
      buildSummaryMetric(metricFormula, 'inventory_available_value', 'Valor disponível', 'currency', 'amber', 'Valor aproximado ainda no estoque.'),
      buildSummaryMetric(metricFormula, 'inventory_risk', 'Em risco', 'integer', 'terracotta', 'Lotes perto de vencer ou vencidos.')
    ],
    applications: [
      buildSummaryMetric(metricFormula, 'applications_count', 'Aplicações', 'integer', 'forest', 'Lançamentos reais feitos em campo.'),
      buildSummaryMetric(metricFormula, 'applications_area_total', 'Área aplicada', 'number', 'mist', 'Área total aplicada em m².'),
      buildSummaryMetric(metricFormula, 'applications_quantity_total', 'Qtd aplicada', 'number', 'amber', 'Soma mista de quantidades registradas.'),
      buildSummaryMetric(metricFormula, 'costs_linked_count', 'Custos ligados', 'integer', 'sage', 'Base de custo já conectada ao operacional.')
    ],
    losses: [
      buildSummaryMetric(metricFormula, 'losses_count', 'Perdas', 'integer', 'terracotta', 'Perdas já registradas em campo.'),
      buildSummaryMetric(metricFormula, 'losses_total_cost', 'Custo estimado', 'currency', 'amber', 'Impacto financeiro estimado das perdas.'),
      buildSummaryMetric(metricFormula, 'harvests_total_marketable', 'Comercial ainda salvo', 'number', 'forest', 'Volume comercial registrado apesar das perdas.'),
      buildSummaryMetric(metricFormula, 'attention_points', 'Atenção aberta', 'integer', 'mist', 'Pontos que ainda pedem revisão.')
    ],
    harvests: [
      buildSummaryMetric(metricFormula, 'harvests_count', 'Colheitas', 'integer', 'forest', 'Eventos de colheita registrados.'),
      buildSummaryMetric(metricFormula, 'harvests_total_gross', 'Volume bruto', 'number', 'mist', 'Soma mista do que saiu do campo.'),
      buildSummaryMetric(metricFormula, 'harvests_total_marketable', 'Volume comercial', 'number', 'sage', 'Parte comercial da colheita.'),
      buildSummaryMetric(metricFormula, 'harvests_total_value', 'Valor destino', 'currency', 'amber', 'Valor somado dos destinos lançados.')
    ],
    channels: [
      buildSummaryMetric(metricFormula, 'channels_active_count', 'Canais ativos', 'integer', 'forest', 'Destinos ativos para atender.'),
      buildSummaryMetric(metricFormula, 'channels_average_accepted_price', 'Preço aceito médio', 'currency', 'amber', 'Média de preço aceito nos canais.'),
      buildSummaryMetric(metricFormula, 'channels_average_transfer_price', 'Transferência média', 'currency', 'mist', 'Preço interno médio quando existe.'),
      buildSummaryMetric(metricFormula, 'scenarios_channels_changed', 'Mudam no cenário', 'integer', 'sage', 'Canais que variam com o cenário ativo.')
    ],
    crops: [
      buildSummaryMetric(metricFormula, 'crops_count', 'Culturas', 'integer', 'forest', 'Culturas vivas na base da fazenda.'),
      buildSummaryMetric(metricFormula, 'cultures_average_cycle', 'Ciclo médio', 'number', 'mist', 'Dias médios até fechamento do ciclo.'),
      buildSummaryMetric(metricFormula, 'cultures_average_markup', 'Margem base média', 'percent', 'amber', 'Margem padrão configurada nas culturas.'),
      buildSummaryMetric(metricFormula, 'cultures_average_loss', 'Perda base média', 'percent', 'terracotta', 'Perda padrão esperada nas culturas.')
    ],
    plans: [
      buildSummaryMetric(metricFormula, 'plans_count', 'Planos', 'integer', 'forest', 'Planos reais hoje na operação.'),
      buildSummaryMetric(metricFormula, 'plans_total_area', 'Área total', 'number', 'mist', 'Área somada dos planos em m².'),
      buildSummaryMetric(metricFormula, 'plans_total_viable_units', 'Unidades viáveis', 'number', 'sage', 'Volume viável total dos planos.'),
      buildSummaryMetric(metricFormula, 'plans_total_cost', 'Custo total', 'currency', 'amber', 'Custo somado dos planos atuais.')
    ],
    economics: [
      buildSummaryMetric(metricFormula, 'economics_average_cost_unit', 'Custo médio', 'currency', 'amber', 'Quanto custa em média a unidade acompanhada.'),
      buildSummaryMetric(metricFormula, 'economics_average_suggested_price', 'Preço sugerido médio', 'currency', 'forest', 'Preço sugerido médio do motor econômico.'),
      buildSummaryMetric(metricFormula, 'economics_average_margin', 'Margem média', 'percent', 'sage', 'Margem média das leituras de unit economics.'),
      buildSummaryMetric(metricFormula, 'economics_total_profit_unit', 'Lucro unitário somado', 'currency', 'mist', 'Soma do lucro unitário calculado nas linhas.')
    ],
    labor: [
      buildSummaryMetric(metricFormula, 'labor_records_count', 'Registros', 'integer', 'forest', 'Apontamentos de equipe lançados.'),
      buildSummaryMetric(metricFormula, 'labor_total_hours', 'Horas', 'number', 'mist', 'Horas somadas de mão de obra.'),
      buildSummaryMetric(metricFormula, 'labor_total_cost', 'Custo total', 'currency', 'amber', 'Custo somado da equipe registrada.'),
      buildSummaryMetric(metricFormula, 'plans_count', 'Planos impactados', 'integer', 'sage', 'Contexto geral da operação ligada aos registros.')
    ],
    equipment: [
      buildSummaryMetric(metricFormula, 'equipment_records_count', 'Usos', 'integer', 'forest', 'Registros de uso de equipamento.'),
      buildSummaryMetric(metricFormula, 'equipment_total_hours', 'Horas', 'number', 'mist', 'Horas acumuladas de uso.'),
      buildSummaryMetric(metricFormula, 'equipment_total_cost', 'Custo de uso', 'currency', 'amber', 'Custo total do uso registrado.'),
      buildSummaryMetric(metricFormula, 'equipment_fuel_total', 'Combustível', 'currency', 'terracotta', 'Quanto já foi de combustível.')
    ],
    maintenance: [
      buildSummaryMetric(metricFormula, 'maintenance_records_count', 'Eventos', 'integer', 'forest', 'Eventos de manutenção cadastrados.'),
      buildSummaryMetric(metricFormula, 'maintenance_monthly_reserve_total', 'Reserva mensal', 'currency', 'amber', 'Reserva mensal equivalente.'),
      buildSummaryMetric(metricFormula, 'maintenance_annual_total', 'Equiv. anual', 'currency', 'mist', 'Custo anual estimado da manutenção.'),
      buildSummaryMetric(metricFormula, 'maintenance_downtime_total', 'Dias parados', 'number', 'terracotta', 'Tempo total estimado de parada.')
    ],
    investments: [
      buildSummaryMetric(metricFormula, 'investments_count', 'Contratos', 'integer', 'forest', 'Investimentos ou contratos ativos.'),
      buildSummaryMetric(metricFormula, 'investments_committed_total', 'Comprometido', 'currency', 'amber', 'Total comprometido com investimentos.'),
      buildSummaryMetric(metricFormula, 'investments_monthly_total', 'Parcela mensal', 'currency', 'mist', 'Parcela mensal somada.'),
      buildSummaryMetric(metricFormula, 'investments_expected_return_total', 'Retorno esperado', 'currency', 'sage', 'Retorno mensal esperado informado.')
    ],
    lots: [
      buildSummaryMetric(metricFormula, 'lots_count', 'Lotes', 'integer', 'forest', 'Lotes de produção rastreados.'),
      buildSummaryMetric(metricFormula, 'lots_traceability_complete', 'Rastreáveis', 'integer', 'sage', 'Lotes com rastreabilidade completa.'),
      buildSummaryMetric(metricFormula, 'lots_marketable_total', 'Qtd comercial', 'number', 'mist', 'Quantidade comercial agregada nos lotes.'),
      buildSummaryMetric(metricFormula, 'inventory_risk', 'Risco no estoque', 'integer', 'terracotta', 'Risco cruzado entre lote e estoque.')
    ],
    calendarSheet: [
      buildSummaryMetric(metricFormula, 'calendar_guidelines_count', 'Guidelines', 'integer', 'forest', 'Regras agronômicas disponíveis.'),
      buildSummaryMetric(metricFormula, 'calendar_photoperiod_count', 'Meses com fotoperíodo', 'integer', 'mist', 'Meses cobertos na base de fotoperíodo.'),
      buildSummaryMetric(metricFormula, 'crops_count', 'Culturas na base', 'integer', 'sage', 'Culturas hoje já conhecidas pelo sistema.'),
      buildSummaryMetric(metricFormula, 'plans_count', 'Planos ativos', 'integer', 'amber', 'Planos atuais que usam essa base.')
    ],
    scenariosSheet: [
      buildSummaryMetric(metricFormula, 'scenarios_count', 'Cenários', 'integer', 'forest', 'Cenários salvos para comparar.'),
      buildSummaryMetric(metricFormula, 'scenarios_channels_changed', 'Canais alterados', 'integer', 'mist', 'Canais que mudam no cenário ativo.'),
      buildSummaryMetric(metricFormula, 'channels_active_count', 'Canais ativos', 'integer', 'sage', 'Canais disponíveis na operação.'),
      buildSummaryMetric(metricFormula, 'projected_balance', 'Saldo projetado', 'currency', 'amber', 'Leitura do saldo com a base atual.')
    ],
    alerts: [
      buildSummaryMetric(metricFormula, 'attention_points', 'Total de alertas', 'integer', 'terracotta', 'Tudo que pede ação, revisão ou dado faltante.'),
      buildSummaryMetric(metricFormula, 'alerts_high_count', 'Alta', 'integer', 'terracotta', 'Alertas críticos agora.'),
      buildSummaryMetric(metricFormula, 'alerts_medium_count', 'Média', 'integer', 'amber', 'Alertas importantes, mas não críticos.'),
      buildSummaryMetric(metricFormula, 'alerts_low_count', 'Baixa', 'integer', 'mist', 'Alertas de acompanhamento leve.')
    ]
  };

  const baseSheets: ExportSheet[] = [
    {
      name: '00_Resumo_Executivo',
      title: 'Resumo executivo',
      description: 'Leitura principal da operação, com números-chave, cenário ativo e principais alertas.',
      summaryTitle: 'Painel principal',
      summaryDescription: 'Estes blocos continuam ligados à base técnica da exportação e mantêm a leitura macro viva no Google Planilhas.',
      summaryColumns: 3,
      summaryMetrics: summaryMetrics.executive,
      tables: [
        {
          title: 'Números principais',
          description: 'Estas células usam fórmula para ler a base técnica oculta e manter o resumo consistente.',
          columns: [
            textColumn('indicador', 'Indicador', 28),
            textColumn('valor', 'Valor', 18),
            textColumn('unidade', 'Unidade', 16),
            textColumn('origem', 'Origem', 24)
          ],
          rows: [
            { indicador: 'Operação', valor: setup.identity.operationName || 'Sem nome', unidade: '', origem: 'Setup' },
            { indicador: 'Lugar', valor: setup.identity.location || setup.identity.locationAddress || 'Sem localização', unidade: '', origem: 'Setup' },
            { indicador: 'Cenário ativo', valor: activeDemandScenario?.name || 'Base operacional', unidade: '', origem: 'Canais' },
            { indicador: 'Entrada do mês', valor: metricFormula.get('monthly_inflow')!, unidade: 'R$', origem: 'Fórmula' },
            { indicador: 'Saída do mês', valor: metricFormula.get('monthly_outflow')!, unidade: 'R$', origem: 'Fórmula' },
            { indicador: 'Saldo projetado', valor: metricFormula.get('projected_balance')!, unidade: 'R$', origem: 'Fórmula' },
            { indicador: 'Custo recorrente', valor: metricFormula.get('recurring_cost')!, unidade: 'R$', origem: 'Fórmula' },
            { indicador: 'Implantação comprometida', valor: metricFormula.get('implantation_committed')!, unidade: 'R$', origem: 'Fórmula' },
            { indicador: 'Retorno do agro', valor: metricFormula.get('agro_return')!, unidade: 'R$', origem: 'Fórmula' },
            { indicador: 'Custo por unidade foco', valor: metricFormula.get('focus_cost_per_unit')!, unidade: formatUnitLabel(focusRow?.unitLabel || 'unidade'), origem: 'Fórmula' },
            { indicador: 'Preço sugerido foco', valor: metricFormula.get('focus_suggested_sale')!, unidade: formatUnitLabel(focusRow?.unitLabel || 'unidade'), origem: 'Fórmula' },
            { indicador: 'Margem foco', valor: metricFormula.get('focus_margin')!, unidade: '%', origem: 'Fórmula' },
            { indicador: 'Margem média canais', valor: metricFormula.get('total_margin')!, unidade: '%', origem: 'Fórmula' },
            { indicador: 'Payback', valor: metricFormula.get('payback_months')!, unidade: 'meses', origem: 'Fórmula' },
            { indicador: 'Pontos de atenção', valor: metricFormula.get('attention_points')!, unidade: 'itens', origem: 'Fórmula' }
          ]
        },
        {
          title: 'Estado da operação',
          description: 'Leitura do momento atual e o próximo passo mais provável.',
          columns: [
            textColumn('campo', 'Campo', 26),
            textColumn('valor', 'Valor', 34)
          ],
          rows: [
            { campo: 'Estágio da operação', valor: farm.operationStage },
            { campo: 'Próximo passo', valor: farm.nextAction.label },
            { campo: 'Descrição do próximo passo', valor: farm.nextAction.description },
            { campo: 'Rota sugerida', valor: farm.nextAction.route },
            { campo: 'Gerado em', valor: snapshot.generatedAt }
          ]
        },
        {
          title: 'Alertas-chave',
          description: 'Os primeiros alertas que já aparecem na leitura executiva do sistema.',
          columns: [
            textColumn('prioridade', 'Prioridade', 14),
            textColumn('titulo', 'Título', 28),
            textColumn('descricao', 'Descrição', 64)
          ],
          rows: farm.attentionPoints.map((item) => ({
            prioridade: severityLabel[item.severity] || item.severity,
            titulo: item.title,
            descricao: item.description
          }))
        }
      ]
    },
    {
      name: '01_Operacao',
      title: 'Operação',
      description: 'Identidade da fazenda, áreas, perfis, estruturas, canais iniciais e ponto de partida do setup.',
      summaryTitle: 'Base da operação',
      summaryDescription: 'Tudo que define a identidade da fazenda e estrutura inicial do sistema.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.operation,
      tables: [
        {
          title: 'Identidade',
          columns: [textColumn('campo', 'Campo', 28), textColumn('valor', 'Valor', 42)],
          rows: [
            { campo: 'Nome da operação', valor: setup.identity.operationName || '' },
            { campo: 'Apelido', valor: setup.identity.operationNickname || '' },
            { campo: 'Lugar', valor: setup.identity.location || '' },
            { campo: 'Endereço', valor: setup.identity.locationAddress || '' },
            { campo: 'Latitude', valor: setup.identity.latitude ?? null },
            { campo: 'Longitude', valor: setup.identity.longitude ?? null },
            { campo: 'Unidade de área', valor: setup.areaUnit },
            { campo: 'Área total', valor: `${setup.identity.totalArea} ${setup.identity.areaUnit}` },
            { campo: 'Área produtiva', valor: `${setup.identity.productiveArea} ${setup.identity.areaUnit}` },
            { campo: 'Área expansão', valor: `${setup.identity.expansionArea} ${setup.identity.areaUnit}` },
            { campo: 'Status do setup', valor: setup.status }
          ]
        },
        {
          title: 'Perfis e canais iniciais',
          columns: [textColumn('tipo', 'Tipo', 22), textColumn('valor', 'Valor', 42)],
          rows: [
            ...setup.productionProfiles.map((profile) => ({ tipo: 'Perfil', valor: setupProfileLabel[profile] || profile })),
            ...setup.channels.map((channel) => ({ tipo: 'Canal escolhido', valor: setupChannelLabel[channel] || channel })),
            ...setup.financialStartingPoints.map((point) => ({ tipo: 'Começo financeiro', valor: startingPointLabel[point] || point }))
          ]
        },
        {
          title: 'Estruturas',
          columns: [
            textColumn('estrutura', 'Estrutura', 28),
            integerColumn('quantidade', 'Quantidade'),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: setup.structures.map((entry) => ({
            estrutura: setupStructureLabel[entry.type] || entry.type,
            quantidade: entry.quantity,
            observacoes: entry.notes
          }))
        },
        {
          title: 'Cultivos do setup',
          columns: [
            textColumn('tipo', 'Tipo', 20),
            textColumn('categoria', 'Categoria', 22),
            textColumn('item', 'Item', 28)
          ],
          rows: [
            ...setup.initialCrops.map((crop) => ({ tipo: 'Inicial', categoria: crop.category, item: crop.item })),
            ...setup.customCrops.map((crop) => ({ tipo: 'Criado no setup', categoria: crop.category, item: crop.item }))
          ]
        }
      ]
    },
    {
      name: '02_Implantacao',
      title: 'Implantação',
      description: 'Projetos, itens, cotações e quanto já está comprometido para colocar a operação de pé.',
      summaryTitle: 'Leitura rápida da implantação',
      summaryDescription: 'Números de implantação já prontos para discutir investimento, abertura e fechamento.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.implantation,
      tables: [
        {
          title: 'Projetos',
          editable: true,
          columns: [
            textColumn('projeto', 'Projeto', 28),
            selectColumn('status', 'Status', implantationStatusOptions, 16),
            currencyColumn('orcamento_alvo', 'Orçamento alvo'),
            currencyColumn('total_estimado', 'Total estimado'),
            currencyColumn('comprometido', 'Comprometido'),
            currencyColumn('em_aberto', 'Em aberto'),
            dateColumn('inicio', 'Início'),
            dateColumn('meta_fim', 'Meta fim'),
            textColumn('notas', 'Notas', 42)
          ],
          rows: farm.implantationProjectGroups.map((group) => ({
            projeto: group.project.name,
            status: group.project.status,
            orcamento_alvo: toReais(group.project.budgetTargetCents),
            total_estimado: toReais(group.totals.totalCents),
            comprometido: toReais(group.totals.committedCents),
            em_aberto: toReais(group.totals.openCents),
            inicio: group.project.startDate,
            meta_fim: group.project.targetEndDate,
            notas: group.project.notes
          }))
        },
        {
          title: 'Itens',
          editable: true,
          columns: [
            textColumn('projeto', 'Projeto', 24),
            textColumn('grupo', 'Grupo', 18),
            textColumn('item', 'Item', 30),
            selectColumn('prioridade', 'Prioridade', severityOptions, 14),
            selectColumn('status', 'Status', implantationStatusOptions, 16),
            selectColumn('pagamento', 'Pagamento', implantationPaymentOptions, 16),
            dateColumn('prazo', 'Prazo'),
            textColumn('fornecedor_escolhido', 'Fornecedor escolhido', 24),
            currencyColumn('valor_escolhido', 'Valor escolhido'),
            currencyColumn('frete_escolhido', 'Frete'),
            integerColumn('cotacoes', 'Cotações'),
            textColumn('notas', 'Notas', 42)
          ],
          rows: farm.implantationItems.map((item) => {
            const selected = item.quotations.find((quotation) => quotation.id === item.selectedQuotationId);
            return {
              projeto: lookups.projectById.get(item.projectId)?.name || '',
              grupo: item.group,
              item: item.name,
              prioridade: item.priority,
              status: item.status,
              pagamento: item.paymentMode,
              prazo: item.deadline,
              fornecedor_escolhido: selected?.supplier || '',
              valor_escolhido: toReais(selected?.totalCostCents),
              frete_escolhido: toReais(selected?.freightCents),
              cotacoes: item.quotations.length,
              notas: item.notes
            };
          })
        },
        {
          title: 'Cotações',
          editable: true,
          columns: [
            textColumn('projeto', 'Projeto', 22),
            textColumn('item', 'Item', 28),
            textColumn('fornecedor', 'Fornecedor', 24),
            currencyColumn('valor_total', 'Valor total'),
            currencyColumn('frete', 'Frete'),
            selectColumn('status', 'Status', implantationStatusOptions, 16),
            selectColumn('pagamento', 'Pagamento', implantationPaymentOptions, 16),
            integerColumn('parcelas', 'Parcelas'),
            currencyColumn('valor_parcela', 'Valor parcela'),
            dateColumn('primeiro_vencimento', 'Primeiro vencimento'),
            textColumn('fonte', 'Fonte', 18)
          ],
          rows: flattenedQuotations.map((quotation) => ({
            projeto: quotation.projectName,
            item: quotation.itemName,
            fornecedor: quotation.supplier,
            valor_total: toReais(quotation.totalCostCents),
            frete: toReais(quotation.freightCents),
            status: quotation.status,
            pagamento: quotation.paymentMode,
            parcelas: quotation.installments,
            valor_parcela: toReais(quotation.installmentValueCents),
            primeiro_vencimento: quotation.firstDueDate,
            fonte: quotation.source
          }))
        }
      ]
    },
    {
      name: '03_Custos',
      title: 'Custos',
      description: 'Custos recorrentes, sazonais e extraordinários que pesam na operação.',
      summaryTitle: 'Peso da operação',
      summaryDescription: 'Resumo do que mais pesa no mês antes de mergulhar nas linhas detalhadas.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.costs,
      tables: [
        {
          editable: true,
          columns: [
            selectColumn('categoria', 'Categoria', purchaseCategoryOptions, 20),
            selectColumn('subcategoria', 'Subcategoria', purchaseCategoryOptions, 22),
            textColumn('nome', 'Nome', 28),
            selectColumn('tipo', 'Recorrência', costRecurrenceOptions, 18),
            currencyColumn('valor_evento', 'Valor evento'),
            currencyColumn('equivalente_mensal', 'Equiv. mensal'),
            dateColumn('proxima_ocorrencia', 'Próxima ocorrência'),
            textColumn('fornecedor', 'Fornecedor', 22),
            textColumn('vinculo', 'Vínculo', 28),
            selectColumn('status', 'Status', genericActiveOptions, 14),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: farm.costs.map((item) => ({
            categoria: item.category,
            subcategoria: item.subcategory,
            nome: item.name,
            tipo: item.recurrenceType,
            valor_evento: toReais(item.eventValueCents),
            equivalente_mensal: toReais(item.monthlyEquivalentCents),
            proxima_ocorrencia: item.nextOccurrence,
            fornecedor: item.supplier,
            vinculo: item.linkedCropId || item.linkedLotId || item.linkedChannelId || item.linkedCostCenter || '',
            status: item.status,
            observacoes: item.notes
          }))
        }
      ]
    },
    {
      name: '04_Compras',
      title: 'Compras',
      description: 'Pedidos, recebimentos e a ligação entre compra, estoque e rotina da operação.',
      summaryTitle: 'Compras em foco',
      summaryDescription: 'Leitura rápida do que foi comprado e do que já virou rotina ou estoque.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.purchases,
      tables: [
        {
          editable: true,
          columns: [
            textColumn('item', 'Item', 28),
            selectColumn('categoria', 'Categoria', purchaseCategoryOptions, 18),
            selectColumn('subcategoria', 'Subcategoria', purchaseCategoryOptions, 20),
            textColumn('fornecedor', 'Fornecedor', 24),
            currencyColumn('valor_total', 'Valor total'),
            currencyColumn('equivalente_mensal', 'Equiv. mensal'),
            dateColumn('recebido_em', 'Recebido em'),
            numberColumn('quantidade_recebida', 'Quantidade recebida'),
            textColumn('unidade_recebida', 'Unidade', 12),
            selectColumn('vira_estoque', 'Vira estoque?', yesNoOptions, 14),
            textColumn('produto_estoque', 'Produto estoque', 22),
            selectColumn('status_pagamento', 'Pagamento', paymentStatusOptions, 16),
            selectColumn('status', 'Status', purchaseStatusOptions, 14),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: farm.purchases.map((item) => ({
            item: item.name,
            categoria: item.category,
            subcategoria: item.subcategory,
            fornecedor: item.supplier,
            valor_total: toReais(item.eventValueCents),
            equivalente_mensal: toReais(item.monthlyEquivalentCents),
            recebido_em: item.receivedAt,
            quantidade_recebida: item.receivedQuantity ?? null,
            unidade_recebida: item.receivedUnit ? formatUnitLabel(item.receivedUnit) : '',
            vira_estoque: yesNo(item.isStockable),
            produto_estoque: item.inventoryProductId ? lookups.productById.get(item.inventoryProductId)?.name || '' : '',
            status_pagamento: item.paymentStatus,
            status: item.status,
            observacoes: item.notes
          }))
        }
      ]
    },
    {
      name: '05_Estoque',
      title: 'Estoque',
      description: 'Produtos, lotes e movimentos do galpão em uma leitura auditável.',
      summaryTitle: 'Saúde do estoque',
      summaryDescription: 'Panorama do galpão antes de olhar produto por produto.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.inventory,
      tables: [
        {
          title: 'Produtos',
          editable: true,
          columns: [
            textColumn('produto', 'Produto', 28),
            textColumn('nome_comercial', 'Nome comercial', 26),
            selectColumn('categoria', 'Categoria', purchaseCategoryOptions, 18),
            textColumn('unidade_padrao', 'Unidade padrão', 16),
            selectColumn('ativo', 'Ativo', yesNoOptions, 12),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: farm.inventory.products.map((product) => ({
            produto: product.name,
            nome_comercial: product.commercialName,
            categoria: product.category,
            unidade_padrao: formatUnitLabel(product.defaultUnit),
            ativo: yesNo(product.active),
            observacoes: product.notes
          }))
        },
        {
          title: 'Lotes do estoque',
          editable: true,
          columns: [
            textColumn('lote', 'Lote', 26),
            textColumn('produto', 'Produto', 28),
            dateColumn('recebido_em', 'Recebido em'),
            numberColumn('quantidade_recebida', 'Qtd recebida'),
            numberColumn('quantidade_disponivel', 'Qtd disponível'),
            textColumn('unidade', 'Unidade', 12),
            currencyColumn('custo_unitario', 'Custo unitário'),
            textColumn('local', 'Local', 20),
            dateColumn('validade', 'Validade'),
            selectColumn('status', 'Status', ['ativo', 'esgotado', 'quarentena', 'vencido'], 14),
            textColumn('compra', 'Compra', 22)
          ],
          rows: farm.inventory.lots.map((lot) => ({
            lote: lot.code,
            produto: lookups.productById.get(lot.productId)?.name || '',
            recebido_em: lot.receivedAt,
            quantidade_recebida: lot.quantityReceived,
            quantidade_disponivel: lot.quantityAvailable,
            unidade: formatUnitLabel(lot.unit),
            custo_unitario: toReais(lot.unitCostCents),
            local: lot.locationName,
            validade: lot.expirationDate,
            status: lot.status,
            compra: lot.purchaseId ? lookups.purchaseById.get(lot.purchaseId)?.name || lot.purchaseId : ''
          }))
        },
        {
          title: 'Movimentos',
          editable: true,
          columns: [
            dateColumn('data', 'Data'),
            textColumn('lote', 'Lote', 22),
            textColumn('produto', 'Produto', 26),
            selectColumn('movimento', 'Movimento', ['entrada', 'saida', 'consumo', 'ajuste', 'perda', 'transferencia'], 18),
            numberColumn('quantidade', 'Quantidade'),
            textColumn('unidade', 'Unidade', 12),
            textColumn('alvo', 'Alvo', 22),
            textColumn('motivo', 'Motivo', 22),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: farm.inventory.movements.map((movement) => {
            const inventoryLot = lookups.inventoryLotById.get(movement.inventoryLotId);
            return {
              data: movement.occurredAt,
              lote: inventoryLot?.code || '',
              produto: inventoryLot ? lookups.productById.get(inventoryLot.productId)?.name || '' : '',
              movimento: movement.movementType,
              quantidade: movement.quantity,
              unidade: formatUnitLabel(movement.unit),
              alvo: movement.targetType === 'geral' ? 'Geral' : movement.targetId || '',
              motivo: movement.reason,
              observacoes: movement.notes
            };
          })
        }
      ]
    },
    {
      name: '06_Campo_Aplicacoes',
      title: 'Campo · Aplicações',
      description: 'Uso real de insumos, onde entrou, em qual cultura e com qual área.',
      summaryTitle: 'Aplicações no campo',
      summaryDescription: 'O que já foi aplicado e o tamanho operacional disso.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.applications,
      tables: [
        {
          editable: true,
          columns: [
            dateColumn('data', 'Data'),
            textColumn('produto', 'Produto', 28),
            textColumn('lote_estoque', 'Lote do estoque', 24),
            textColumn('cultura', 'Cultura', 24),
            textColumn('plano', 'Plano', 24),
            textColumn('lote_producao', 'Lote produção', 24),
            numberColumn('quantidade_aplicada', 'Quantidade'),
            textColumn('unidade', 'Unidade', 12),
            numberColumn('area_aplicada', 'Área aplicada m²'),
            selectColumn('fase', 'Fase', ['preparo', 'plantio', 'desenvolvimento', 'producao', 'colheita', 'pos-colheita'], 16),
            textColumn('responsavel', 'Responsável', 22),
            textColumn('equipamento', 'Equipamento', 22),
            textColumn('area_nodes', 'Áreas', 22),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: farm.applications.map((application) => ({
            data: application.appliedAt,
            produto: lookups.productById.get(application.productId)?.name || '',
            lote_estoque: lookups.inventoryLotById.get(application.inventoryLotId)?.code || '',
            cultura: application.cropId ? lookups.cropById.get(application.cropId)?.name || '' : '',
            plano: application.cropPlanId ? lookups.planById.get(application.cropPlanId)?.seasonLabel || lookups.planById.get(application.cropPlanId)?.id || '' : '',
            lote_producao: application.productionLotId ? lookups.lotById.get(application.productionLotId)?.code || '' : '',
            quantidade_aplicada: application.quantityApplied,
            unidade: formatUnitLabel(application.unit),
            area_aplicada: application.appliedAreaSqm,
            fase: application.cropStage,
            responsavel: application.responsible,
            equipamento: application.equipmentName,
            area_nodes: joinAreaNodes(application.areaNodeIds),
            observacoes: application.notes
          }))
        }
      ]
    },
    {
      name: '07_Campo_Perdas',
      title: 'Campo · Perdas',
      description: 'Perdas registradas na operação e custo estimado quando houver.',
      summaryTitle: 'Perdas em vista',
      summaryDescription: 'Leitura compacta do impacto das perdas já registradas.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.losses,
      tables: [
        {
          editable: true,
          columns: [
            dateColumn('data', 'Data'),
            textColumn('causa', 'Causa', 22),
            selectColumn('origem', 'Origem', ['campo', 'estoque', 'colheita', 'lote', 'plano', 'outro'], 18),
            textColumn('referencia', 'Referência', 28),
            numberColumn('quantidade', 'Quantidade'),
            textColumn('unidade', 'Unidade', 12),
            currencyColumn('custo_estimado', 'Custo estimado'),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: farm.losses.map((loss) => ({
            data: loss.date,
            causa: loss.cause,
            origem: loss.sourceType,
            referencia: loss.sourceId,
            quantidade: loss.quantity,
            unidade: formatUnitLabel(loss.unit),
            custo_estimado: toReais(loss.estimatedCostCents),
            observacoes: loss.notes
          }))
        }
      ]
    },
    {
      name: '08_Colheitas',
      title: 'Colheitas',
      description: 'Tudo que saiu do campo, o que ficou comercial e para onde foi.',
      summaryTitle: 'Leitura da colheita',
      summaryDescription: 'Bruto, comercial e valor de destino em um bloco rápido antes da auditoria linha a linha.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.harvests,
      tables: [
        {
          editable: true,
          columns: [
            textColumn('colheita_id', 'Colheita', 18),
            dateColumn('data', 'Data'),
            textColumn('lote', 'Lote', 20),
            textColumn('cultura', 'Cultura', 24),
            textColumn('plano', 'Plano', 24),
            numberColumn('quantidade_bruta', 'Qtd bruta'),
            numberColumn('quantidade_comercial', 'Qtd comercial'),
            numberColumn('perda', 'Perda'),
            textColumn('unidade', 'Unidade', 12),
            selectColumn('destino', 'Destino', Array.from(new Set(farm.channels.map((channel) => channel.name))), 24),
            numberColumn('quantidade_destino', 'Qtd destino'),
            currencyColumn('valor_destino', 'Valor destino')
          ],
          rows: buildHarvestRows(snapshot)
        }
      ]
    },
    {
      name: '09_Canais',
      title: 'Canais',
      description: 'Destinos da produção, prioridade, demanda base, demanda no cenário e preços aceitos.',
      summaryTitle: 'Pressão de canais',
      summaryDescription: 'Leitura rápida de demanda, preços e canais que mais mexem na operação.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.channels,
      tables: [
        {
          editable: true,
          columns: [
            textColumn('canal', 'Canal', 26),
            selectColumn('tipo', 'Tipo', demandChannelTypeOptions, 18),
            integerColumn('prioridade', 'Prioridade'),
            textColumn('unidade', 'Unidade', 12),
            selectColumn('modo_preco', 'Modo preço', channelPricingOptions, 16),
            numberColumn('demanda_base', 'Demanda base'),
            numberColumn('demanda_cenario', 'Demanda cenário'),
            currencyColumn('preco_aceito', 'Preço aceito'),
            currencyColumn('preco_transferencia', 'Preço transferência'),
            selectColumn('ativo', 'Ativo', yesNoOptions, 12),
            textColumn('cenario_ativo', 'Cenário ativo', 24)
          ],
          rows: farm.channels.map((channel) => ({
            canal: channel.name,
            tipo: demandChannelTypeLabel[channel.type] || channel.type,
            prioridade: channel.priority,
            unidade: formatUnitLabel(channel.demandUnit),
            modo_preco: channel.pricingMode,
            demanda_base: channel.baselineDemand,
            demanda_cenario: channel.scenarioDemand,
            preco_aceito: toReais(channel.acceptedPriceCents),
            preco_transferencia: toReais(channel.transferPriceCents),
            ativo: yesNo(channel.enabled),
            cenario_ativo: activeDemandScenario?.name || 'Sem cenário'
          }))
        }
      ]
    },
    {
      name: '10_Culturas',
      title: 'Culturas',
      description: 'Configuração-base das culturas, compra por embalagem, espaçamento, margem e venda.',
      summaryTitle: 'Base das culturas',
      summaryDescription: 'Leitura macro da biblioteca de culturas usada no sistema.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.crops,
      tables: [
        {
          editable: true,
          columns: [
            textColumn('cultura', 'Cultura', 24),
            textColumn('variedade', 'Variedade', 24),
            selectColumn('categoria', 'Categoria', cropCategoryOptions, 20),
            integerColumn('ciclo_dias', 'Ciclo dias'),
            selectColumn('compra_por', 'Compra por', purchasePackOptions, 18),
            integerColumn('unidades_por_embalagem', 'Unid. por embalagem'),
            currencyColumn('custo_embalagem', 'Custo embalagem'),
            currencyColumn('custo_base_muda', 'Custo base muda'),
            numberColumn('espacamento_plantas_cm', 'Espaçamento planta cm'),
            numberColumn('espacamento_linhas_cm', 'Espaçamento linha cm'),
            numberColumn('largura_canteiro_m', 'Largura canteiro m'),
            numberColumn('comprimento_canteiro_m', 'Comprimento canteiro m'),
            selectColumn('venda_em', 'Venda em', salesUnitOptions, 14),
            integerColumn('unidades_por_caixa', 'Unid. por caixa'),
            percentColumn('margem_base', 'Margem base'),
            percentColumn('perda_base', 'Perda base'),
            selectColumn('ambiente', 'Ambiente', ['campo_aberto', 'protegido', 'ambos'], 18),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: farm.crops.map((crop) => ({
            cultura: crop.name,
            variedade: crop.variety,
            categoria: crop.category,
            ciclo_dias: crop.cycleDays,
            compra_por: crop.purchaseType,
            unidades_por_embalagem: crop.unitsPerPurchasePack,
            custo_embalagem: toReais(crop.purchasePackCostCents),
            custo_base_muda: toReais(crop.baseSeedlingCostCents),
            espacamento_plantas_cm: crop.defaultPlantSpacingCm,
            espacamento_linhas_cm: crop.defaultRowSpacingCm,
            largura_canteiro_m: crop.defaultBedWidthM,
            comprimento_canteiro_m: crop.defaultBedLengthM,
            venda_em: formatUnitLabel(crop.salesUnit),
            unidades_por_caixa: crop.unitsPerSalesBox,
            margem_base: toPercent(crop.defaultMarkupPct),
            perda_base: toPercent(crop.defaultLossRate),
            ambiente: crop.environmentCompatibility,
            observacoes: crop.notes
          }))
        }
      ]
    },
    {
      name: '11_Planos',
      title: 'Planos',
      description: 'Planos de produção com área, canteiros, capacidade, perda, packs e preços sugeridos.',
      summaryTitle: 'Panorama dos planos',
      summaryDescription: 'Área, volume viável e custo total dos planos atuais.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.plans,
      tables: [
        {
          editable: true,
          columns: [
            textColumn('cultura', 'Cultura', 24),
            textColumn('plano', 'Plano', 22),
            selectColumn('status', 'Status', planStatusOptions, 14),
            numberColumn('area_total_m2', 'Área total m²'),
            integerColumn('canteiros', 'Canteiros'),
            numberColumn('area_por_canteiro_m2', 'Área por canteiro'),
            numberColumn('unidades_teoricas', 'Unid. teóricas'),
            numberColumn('unidades_viaveis', 'Unid. viáveis'),
            percentColumn('perda_esperada', 'Perda esperada'),
            integerColumn('packs_necessarios', 'Emb. necessárias'),
            integerColumn('unidades_por_embalagem', 'Unid. por embalagem'),
            currencyColumn('custo_total', 'Custo total'),
            currencyColumn('custo_por_canteiro', 'Custo por canteiro'),
            currencyColumn('custo_por_unidade', 'Custo por unidade'),
            currencyColumn('preco_minimo', 'Preço mínimo'),
            currencyColumn('preco_sugerido', 'Preço sugerido'),
            currencyColumn('preco_sugerido_caixa', 'Preço sugerido caixa'),
            integerColumn('unidades_por_caixa', 'Unid. por caixa'),
            selectColumn('venda_em', 'Venda em', salesUnitOptions, 14),
            selectColumn('planejado_ou_real', 'Base', ['Planejado', 'Real'], 14)
          ],
          rows: farm.realPlans.map((plan) => ({
            cultura: lookups.cropById.get(plan.cropId)?.name || '',
            plano: plan.seasonLabel || plan.id,
            status: plan.status,
            area_total_m2: plan.areaTotalSqm,
            canteiros: plan.bedCount,
            area_por_canteiro_m2: plan.bedAreaSqm,
            unidades_teoricas: plan.theoreticalUnits,
            unidades_viaveis: plan.marketableUnits || plan.viableUnits,
            perda_esperada: toPercent(plan.expectedLossRate),
            packs_necessarios: plan.packsNeeded,
            unidades_por_embalagem: plan.unitsPerPurchasePack,
            custo_total: toReais(plan.costTotalCents),
            custo_por_canteiro: toReais(plan.costPerBedCents),
            custo_por_unidade: toReais(plan.costPerUnitCents),
            preco_minimo: toReais(plan.minimumSalePricePerUnitCents),
            preco_sugerido: toReais(plan.suggestedSalePricePerUnitCents),
            preco_sugerido_caixa: toReais(plan.suggestedSalePricePerBoxCents),
            unidades_por_caixa: plan.unitsPerSalesBox,
            venda_em: formatUnitLabel(plan.salesUnit),
            planejado_ou_real: plan.plannedOnly ? 'Planejado' : 'Real'
          }))
        }
      ]
    },
    {
      name: '12_Unit_Economics',
      title: 'Unit Economics',
      description: 'Leitura planejada e real de custo, preço sugerido, lucro e margem por cultura.',
      summaryTitle: 'Leitura econômica',
      summaryDescription: 'Os principais números de unit economics antes de entrar nas linhas por cultura.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.economics,
      tables: [
        {
          editable: true,
          columns: [
            selectColumn('visao', 'Visão', ['Planejado', 'Real'], 14),
            textColumn('cultura', 'Cultura', 24),
            textColumn('variedade', 'Variedade', 22),
            textColumn('unidade', 'Unidade', 12),
            selectColumn('vendas_em', 'Venda em', salesUnitOptions, 14),
            integerColumn('unidades_por_caixa', 'Unid. por caixa'),
            currencyColumn('custo_total', 'Custo total'),
            currencyColumn('custo_por_unidade', 'Custo por unidade'),
            currencyColumn('custo_por_caixa', 'Custo por caixa'),
            currencyColumn('preco_minimo', 'Preço mínimo'),
            currencyColumn('preco_sugerido_unidade', 'Preço sugerido unid.'),
            currencyColumn('preco_sugerido_caixa', 'Preço sugerido caixa'),
            currencyColumn('lucro_unidade', 'Lucro por unidade'),
            currencyColumn('lucro_caixa', 'Lucro por caixa'),
            percentColumn('margem_unidade', 'Margem'),
            numberColumn('unidades_viaveis', 'Unid. viáveis'),
            numberColumn('unidades_comerciais', 'Unid. comerciais'),
            numberColumn('caixas_previstas', 'Caixas previstas'),
            selectColumn('origem', 'Origem', ['Planejado', 'Real'], 12)
          ],
          rows: [
            ...buildUnitEconomicsRows('Planejado', farm.plannedEconomics.rows),
            ...buildUnitEconomicsRows('Real', farm.realEconomics.rows)
          ]
        }
      ]
    },
    {
      name: '13_Mao_de_Obra',
      title: 'Mão de obra',
      description: 'Horas, custo e vínculo da equipe com cultura, plano e lote.',
      summaryTitle: 'Peso da equipe',
      summaryDescription: 'Volume e custo da mão de obra registrada.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.labor,
      tables: [
        {
          editable: true,
          columns: [
            dateColumn('data', 'Data'),
            textColumn('equipe', 'Equipe', 22),
            textColumn('tarefa', 'Tarefa', 26),
            textColumn('cultura', 'Cultura', 22),
            textColumn('plano', 'Plano', 22),
            textColumn('lote', 'Lote', 20),
            numberColumn('horas', 'Horas'),
            currencyColumn('custo_hora', 'Custo hora'),
            currencyColumn('custo_total', 'Custo total'),
            textColumn('areas', 'Áreas', 22),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: farm.labor.map((record) => ({
            data: record.date,
            equipe: record.teamName,
            tarefa: record.taskName,
            cultura: record.cropId ? lookups.cropById.get(record.cropId)?.name || '' : '',
            plano: record.cropPlanId ? lookups.planById.get(record.cropPlanId)?.seasonLabel || lookups.planById.get(record.cropPlanId)?.id || '' : '',
            lote: record.productionLotId ? lookups.lotById.get(record.productionLotId)?.code || '' : '',
            horas: record.hoursWorked,
            custo_hora: toReais(record.hourlyCostCents),
            custo_total: toReais(record.totalCostCents),
            areas: joinAreaNodes(record.areaNodeIds),
            observacoes: record.notes
          }))
        }
      ]
    },
    {
      name: '14_Equipamentos',
      title: 'Equipamentos',
      description: 'Uso de equipamento, área coberta, combustível e custo de uso.',
      summaryTitle: 'Uso de equipamentos',
      summaryDescription: 'Panorama do custo operacional e do uso mecânico registrado.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.equipment,
      tables: [
        {
          editable: true,
          columns: [
            dateColumn('data', 'Data'),
            textColumn('ativo', 'Ativo', 24),
            textColumn('operacao', 'Operação', 24),
            textColumn('cultura', 'Cultura', 22),
            textColumn('plano', 'Plano', 22),
            numberColumn('horas', 'Horas'),
            numberColumn('area_m2', 'Área coberta m²'),
            currencyColumn('combustivel', 'Combustível'),
            currencyColumn('custo_uso', 'Custo de uso'),
            textColumn('areas', 'Áreas', 22),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: farm.equipmentUsage.map((record) => ({
            data: record.date,
            ativo: record.assetName,
            operacao: record.operationName,
            cultura: record.cropId ? lookups.cropById.get(record.cropId)?.name || '' : '',
            plano: record.cropPlanId ? lookups.planById.get(record.cropPlanId)?.seasonLabel || lookups.planById.get(record.cropPlanId)?.id || '' : '',
            horas: record.hoursUsed,
            area_m2: record.areaCoveredSqm,
            combustivel: toReais(record.fuelCostCents),
            custo_uso: toReais(record.usageCostCents),
            areas: joinAreaNodes(record.areaNodeIds),
            observacoes: record.notes
          }))
        }
      ]
    },
    {
      name: '15_Manutencao',
      title: 'Manutenção',
      description: 'Custos, reserva mensal, parada e recomendação de cada ativo.',
      summaryTitle: 'Ritmo da manutenção',
      summaryDescription: 'Reserva, impacto e tempo de parada antes de entrar nos detalhes.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.maintenance,
      tables: [
        {
          editable: true,
          columns: [
            textColumn('ativo', 'Ativo', 24),
            textColumn('categoria', 'Categoria', 20),
            selectColumn('tipo', 'Tipo', maintenanceTypeOptions, 16),
            selectColumn('cadencia', 'Cadência', maintenanceCadenceOptions, 16),
            textColumn('intervalo', 'Intervalo', 16),
            currencyColumn('custo_evento', 'Custo evento'),
            currencyColumn('equivalente_anual', 'Equiv. anual'),
            currencyColumn('reserva_mensal', 'Reserva mensal'),
            numberColumn('dias_parado', 'Dias parado'),
            dateColumn('proxima_data', 'Próxima data'),
            textColumn('impacto', 'Impacto', 28),
            selectColumn('recomendacao', 'Recomendação', recommendationOptions, 16),
            selectColumn('status', 'Status', ['ativo', 'pausado', 'encerrado'], 14)
          ],
          rows: farm.maintenance.map((event) => ({
            ativo: event.assetName,
            categoria: event.category,
            tipo: event.maintenanceType,
            cadencia: event.cadenceType,
            intervalo: event.interval,
            custo_evento: toReais(event.costPerEventCents),
            equivalente_anual: toReais(event.annualEquivalentCents),
            reserva_mensal: toReais(event.monthlyReserveCents),
            dias_parado: event.downtimeDays,
            proxima_data: event.nextDate,
            impacto: event.impact,
            recomendacao: recommendationLabel[event.recommendation] || event.recommendation,
            status: event.status
          }))
        }
      ]
    },
    {
      name: '16_Investimentos',
      title: 'Investimentos',
      description: 'Bens, modalidade, parcelas, total comprometido e payback.',
      summaryTitle: 'Compromisso dos investimentos',
      summaryDescription: 'Leitura rápida de contratos, parcela mensal e retorno esperado.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.investments,
      tables: [
        {
          editable: true,
          columns: [
            textColumn('bem', 'Bem', 28),
            textColumn('categoria', 'Categoria', 20),
            selectColumn('modalidade', 'Modalidade', investmentModalityOptions, 16),
            currencyColumn('valor_bem', 'Valor bem'),
            currencyColumn('entrada', 'Entrada'),
            integerColumn('parcelas', 'Parcelas'),
            currencyColumn('parcela_mensal', 'Parcela mensal'),
            currencyColumn('total_comprometido', 'Total comprometido'),
            currencyColumn('retorno_mensal_esperado', 'Retorno esperado'),
            numberColumn('payback_meses', 'Payback meses'),
            selectColumn('status', 'Status', ['ativo', 'quitado', 'pausado', 'encerrado'], 14),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: farm.investments.map((contract) => ({
            bem: contract.assetName,
            categoria: contract.assetCategory,
            modalidade: contract.modality,
            valor_bem: toReais(contract.assetValueCents),
            entrada: toReais(contract.downPaymentCents),
            parcelas: contract.installments,
            parcela_mensal: toReais(contract.monthlyInstallmentCents),
            total_comprometido: toReais(contract.totalCommittedCents),
            retorno_mensal_esperado: toReais(contract.expectedMonthlyReturnCents),
            payback_meses: contract.paybackMonths,
            status: contract.status,
            observacoes: contract.notes
          }))
        }
      ]
    },
    {
      name: '17_Lotes',
      title: 'Lotes',
      description: 'Rastreabilidade do lote do início até colheita, custos e completude.',
      summaryTitle: 'Rastreabilidade viva',
      summaryDescription: 'Quantos lotes existem e quão bem rastreados eles estão.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.lots,
      tables: [
        {
          editable: true,
          columns: [
            textColumn('lote', 'Lote', 22),
            textColumn('cultura', 'Cultura', 24),
            textColumn('variedade', 'Variedade', 22),
            textColumn('plano', 'Plano', 22),
            dateColumn('recebido_em', 'Recebido em'),
            numberColumn('quantidade_recebida', 'Qtd recebida'),
            numberColumn('quantidade_plantada', 'Qtd plantada'),
            textColumn('origem', 'Origem', 24),
            textColumn('local', 'Local', 24),
            selectColumn('fase', 'Fase', ['preparo', 'plantio', 'desenvolvimento', 'producao', 'colheita', 'encerrado'], 16),
            currencyColumn('custo_apropriado', 'Custo apropriado'),
            numberColumn('quantidade_comercial', 'Qtd comercial'),
            numberColumn('quantidade_descartada', 'Qtd descartada'),
            selectColumn('rastreabilidade', 'Rastreabilidade', traceabilityStatusOptions, 16),
            integerColumn('aplicacoes', 'Aplicações'),
            integerColumn('colheitas', 'Colheitas'),
            textColumn('observacoes', 'Observações', 42)
          ],
          rows: farm.lots.map((lot: Lot) => ({
            lote: lot.code,
            cultura: lookups.cropById.get(lot.cropId)?.name || '',
            variedade: lot.variety,
            plano: lot.cropPlanId ? lookups.planById.get(lot.cropPlanId)?.seasonLabel || lookups.planById.get(lot.cropPlanId)?.id || '' : '',
            recebido_em: lot.receivedAt,
            quantidade_recebida: lot.quantityReceived,
            quantidade_plantada: lot.quantityPlanted,
            origem: lot.origin,
            local: lot.location,
            fase: lot.stage,
            custo_apropriado: toReais(lot.appropriatedCostCents),
            quantidade_comercial: lot.marketableQuantity,
            quantidade_descartada: lot.discardedQuantity,
            rastreabilidade: lot.traceabilityStatus,
            aplicacoes: lot.applicationLogs.length + (lot.applicationEvents?.length ?? 0),
            colheitas: lot.harvests.length,
            observacoes: lot.notes
          }))
        }
      ]
    },
    {
      name: '18_Calendario',
      title: 'Calendário agronômico',
      description: 'Guidelines por cultura e ambiente, além do fotoperíodo por mês.',
      summaryTitle: 'Inteligência agronômica',
      summaryDescription: 'Resumo da base consultiva que apoia o planejamento.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.calendarSheet,
      tables: [
        {
          title: 'Guidelines',
          editable: true,
          columns: [
            textColumn('cultura', 'Cultura', 24),
            selectColumn('ambiente', 'Ambiente', ['Campo aberto', 'Protegido'], 18),
            textColumn('meses_recomendados', 'Meses recomendados', 28),
            textColumn('meses_evitar', 'Meses evitar', 24),
            textColumn('notas', 'Notas', 48)
          ],
          rows: calendar.guidelines.map((entry) => ({
            cultura: entry.cropName,
            ambiente: entry.environment === 'campo_aberto' ? 'Campo aberto' : 'Protegido',
            meses_recomendados: entry.recommendedMonths.join(', '),
            meses_evitar: entry.avoidMonths.join(', '),
            notas: entry.notes
          }))
        },
        {
          title: 'Fotoperíodo',
          columns: [
            integerColumn('mes', 'Mês'),
            numberColumn('horas_luz', 'Horas de luz')
          ],
          rows: calendar.photoperiod.map((entry) => ({
            mes: entry.month,
            horas_luz: entry.daylightHours
          }))
        }
      ]
    },
    {
      name: '19_Cenarios',
      title: 'Cenários',
      description: 'Cenários cadastrados e comparação por canal entre demanda base e cenário ativo.',
      summaryTitle: 'Simulação pronta',
      summaryDescription: 'Leitura direta de quanto o cenário mexe na operação.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.scenariosSheet,
      tables: [
        {
          title: 'Cenários cadastrados',
          editable: true,
          columns: [
            textColumn('nome', 'Nome', 24),
            selectColumn('tipo', 'Tipo', scenarioKindOptions, 18),
            textColumn('mes_ref', 'Mês ref.', 14),
            percentColumn('fator_cozinha', 'Fator cozinha'),
            percentColumn('fator_box', 'Fator box'),
            percentColumn('fator_evento', 'Fator evento'),
            percentColumn('fator_mercado', 'Fator mercado'),
            textColumn('notas', 'Notas', 42)
          ],
          rows: scenarios.cashScenarios.map((entry) => ({
            nome: entry.name,
            tipo: scenarioKindLabel[entry.kind] || entry.kind,
            mes_ref: entry.monthRef,
            fator_cozinha: entry.kitchenDemandFactor - 1,
            fator_box: entry.boxDemandFactor - 1,
            fator_evento: entry.eventDemandFactor - 1,
            fator_mercado: entry.externalDemandFactor - 1,
            notas: entry.notes
          }))
        },
        {
          title: 'Comparativo por canal',
          columns: [
            textColumn('canal', 'Canal', 22),
            textColumn('tipo', 'Tipo', 16),
            textColumn('unidade', 'Unidade', 12),
            numberColumn('demanda_base', 'Demanda base'),
            numberColumn('demanda_cenario', 'Demanda cenário'),
            numberColumn('variacao_absoluta', 'Variação abs.'),
            percentColumn('variacao_pct', 'Variação %'),
            textColumn('cenario_ativo', 'Cenário ativo', 24)
          ],
          rows: buildScenarioComparisonRows(snapshot)
        },
        {
          title: 'Metadados do cenário',
          columns: [textColumn('campo', 'Campo', 24), textColumn('valor', 'Valor', 42)],
          rows: [
            { campo: 'Cenário de demanda ativo', valor: activeDemandScenario?.name || 'Sem cenário' },
            { campo: 'Cenário base de caixa', valor: baselineScenario?.name || 'Sem cenário' },
            { campo: 'Cenário comparado de caixa', valor: compareScenario?.name || 'Sem cenário' }
          ]
        }
      ]
    },
    {
      name: '20_Alertas',
      title: 'Alertas',
      description: 'Tudo que hoje pede atenção, risco ou dado faltante na operação.',
      summaryTitle: 'Radar de atenção',
      summaryDescription: 'Resumo de criticidade para investidores, liderança e operação.',
      summaryColumns: 4,
      summaryMetrics: summaryMetrics.alerts,
      tables: [
        {
          editable: true,
          columns: [
            selectColumn('prioridade', 'Prioridade', severityOptions, 14),
            textColumn('titulo', 'Título', 28),
            textColumn('descricao', 'Descrição', 64)
          ],
          rows: farm.attentionPoints.map((item) => ({
            prioridade: severityLabel[item.severity] || item.severity,
            titulo: item.title,
            descricao: item.description
          }))
        }
      ]
    },
    {
      name: '99_Base_Tecnica',
      title: 'Base técnica',
      description: 'Tabela normalizada para auditoria e fórmulas do resumo. Pode ficar oculta.',
      hidden: true,
      tables: [
        {
          title: 'Métricas base',
          description: 'As fórmulas do resumo leem esta tabela.',
          columns: [
            textColumn('metricKey', 'Chave', 24),
            textColumn('label', 'Indicador', 28),
            textColumn('value', 'Valor', 18),
            textColumn('unit', 'Unidade', 14),
            textColumn('origem', 'Origem', 18)
          ],
          rows: baseMetricRows
        },
        {
          title: 'Margens por canal',
          columns: [
            textColumn('canal', 'Canal', 22),
            currencyColumn('receita', 'Receita'),
            currencyColumn('custo', 'Custo'),
            currencyColumn('margem', 'Margem'),
            percentColumn('margem_pct', 'Margem %')
          ],
          rows: farm.realMarginByChannel.map((row) => ({
            canal: row.channelName,
            receita: toReais(row.revenueCents),
            custo: toReais(row.costCents),
            margem: toReais(row.marginCents),
            margem_pct: toPercent(row.marginPct)
          }))
        },
        {
          title: 'Ledger de alocação',
          columns: [
            textColumn('origem', 'Origem', 18),
            textColumn('origem_id', 'Origem ID', 22),
            textColumn('alvo', 'Alvo', 18),
            textColumn('alvo_id', 'Alvo ID', 22),
            textColumn('cultura', 'Cultura', 22),
            textColumn('plano', 'Plano', 22),
            textColumn('lote', 'Lote', 22),
            textColumn('driver', 'Driver', 18),
            currencyColumn('valor', 'Valor'),
            dateColumn('data', 'Data'),
            textColumn('notas', 'Notas', 42)
          ],
          rows: farm.allocationLedger.map((entry: CostAllocationLedgerEntry) => ({
            origem: entry.originType,
            origem_id: entry.originId,
            alvo: entry.targetType,
            alvo_id: entry.targetId,
            cultura: entry.cropId ? lookups.cropById.get(entry.cropId)?.name || entry.cropId : '',
            plano: entry.cropPlanId ? lookups.planById.get(entry.cropPlanId)?.seasonLabel || lookups.planById.get(entry.cropPlanId)?.id || '' : '',
            lote: entry.productionLotId ? lookups.lotById.get(entry.productionLotId)?.code || entry.productionLotId : '',
            driver: entry.driver,
            valor: toReais(entry.amountCents),
            data: entry.occurredAt,
            notas: entry.notes
          }))
        }
      ]
    }
  ];

  const technicalSheet = baseSheets[baseSheets.length - 1];
  const visibleSheets = baseSheets.slice(0, -1);
  return [...visibleSheets, buildDictionarySheet([...visibleSheets, technicalSheet]), technicalSheet];
};
