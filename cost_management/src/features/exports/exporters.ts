import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AppState } from '@/entities/finance/types';
import { calculateCultivationRevenueTotal, calculateCultivationSaleValue } from '@/entities/finance/cultivation';
import { deriveInvestment } from '@/entities/finance/investments';
import { describeCadence } from '@/entities/finance/recurrence';
import { formatCurrency } from '@/shared/lib/format';

const safeTextForCsv = (value: string): string => value.replace(/;/g, ',');

export const exportCsv = (state: AppState): Blob => {
  const headers = [
    'tipo',
    'categoria',
    'nome',
    'item_type',
    'valor_evento',
    'equivalente_mensal',
    'recurrence_type',
    'interval_unit',
    'interval_value',
    'cadencia_humana',
    'proxima_ocorrencia',
    'status',
    'observacoes'
  ];

  const rows = state.items.map((item) => {
    const category = state.categories.find((entry) => entry.id === item.categoryId);
    return [
      item.type,
      category?.name ?? 'Sem categoria',
      item.name,
      item.itemType,
      (item.eventValueCents / 100).toFixed(2),
      (item.monthlyEquivalentCents / 100).toFixed(2),
      item.recurrenceType,
      item.intervalUnit,
      item.intervalValue,
      describeCadence(item),
      item.nextOccurrenceDate,
      item.status,
      safeTextForCsv(item.notes)
    ].join(';');
  });

  const investmentHeader = [
    'tipo',
    'nome',
    'modalidade',
    'tipo_ativo',
    'valor_ativo',
    'entrada',
    'juros_mensal_pct',
    'taxa_consorcio_pct',
    'prazo_meses',
    'parcela_mensal',
    'total_pago',
    'retorno_mensal_esperado',
    'payback_meses',
    'risco',
    'observacoes'
  ];

  const investmentRows = state.investments.map((item) => {
    const derived = deriveInvestment(item);
    return [
      'investimento',
      item.name,
      item.kind,
      item.assetType,
      (item.assetValueCents / 100).toFixed(2),
      (item.upfrontCents / 100).toFixed(2),
      item.monthlyInterestPct.toFixed(2),
      item.consortiumFeePct.toFixed(2),
      String(item.termMonths),
      (derived.monthlyPaymentCents / 100).toFixed(2),
      (derived.totalPaidCents / 100).toFixed(2),
      (item.expectedMonthlyReturnCents / 100).toFixed(2),
      derived.paybackMonths === null ? '' : derived.paybackMonths.toFixed(1),
      item.riskLevel,
      safeTextForCsv(item.notes)
    ].join(';');
  });

  const purchaseHeader = [
    'tipo',
    'nome',
    'categoria',
    'fornecedor',
    'quantidade',
    'preco_unitario',
    'valor_evento',
    'equivalente_mensal',
    'cadencia_humana',
    'status',
    'observacoes'
  ];

  const purchaseRows = state.purchases.map((item) =>
    [
      'compra',
      item.name,
      item.category,
      item.supplier,
      item.quantity.toFixed(2),
      (item.unitPriceCents / 100).toFixed(2),
      (item.eventValueCents / 100).toFixed(2),
      (item.monthlyEquivalentCents / 100).toFixed(2),
      describeCadence(item),
      item.status,
      safeTextForCsv(item.notes)
    ].join(';')
  );

  const maintenanceHeader = [
    'tipo',
    'equipamento',
    'modalidade',
    'criticidade',
    'custo_evento',
    'equivalente_mensal',
    'cadencia_humana',
    'proxima_manutencao',
    'parada_dias',
    'status',
    'observacoes'
  ];

  const maintenanceRows = state.maintenance.map((item) =>
    [
      'manutencao',
      item.equipment,
      item.maintenanceType,
      item.criticality,
      (item.eventValueCents / 100).toFixed(2),
      (item.monthlyEquivalentCents / 100).toFixed(2),
      describeCadence(item),
      item.nextOccurrenceDate,
      item.downtimeDays.toFixed(1),
      item.status,
      safeTextForCsv(item.notes)
    ].join(';')
  );

  const costSheetByCrop = new Map(state.cultivationCostSheets.map((sheet) => [sheet.cropId, sheet]));

  const cultivationHeader = [
    'tipo',
    'cultivo',
    'tipo_planta',
    'variedade',
    'area',
    'unidade_area',
    'produtividade',
    'unidade_produtividade',
    'unidade_venda',
    'preco_unidade_venda',
    'perda_pct',
    'ajuste_qualidade_pct',
    'ciclo_meses',
    'status_custo',
    'item_custo',
    'valor_custo_evento',
    'cadencia_custo',
    'valor_venda_calculado'
  ];

  const cultivationRows = state.cultivationProjects.flatMap((project) => {
    const sheet = costSheetByCrop.get(project.id);
    const baseRow = [
      'cultivo',
      project.name,
      project.cropType,
      project.variety,
      String(project.areaValue),
      project.areaUnit,
      String(project.productivityValue),
      project.productivityUnit,
      project.salesUnit,
      (project.pricePerSalesUnitCents / 100).toFixed(2),
      String(project.postHarvestLossPct),
      String(project.qualityAdjustmentPct),
      String(project.cycleMonths),
      project.pendingCostStatus
    ];

    if (!sheet || sheet.lines.length === 0) {
      return [[...baseRow, '', '', '', (calculateCultivationSaleValue(project) / 100).toFixed(2)].join(';')];
    }

    return sheet.lines.map((line) =>
      [
        ...baseRow,
        line.name,
        (line.eventValueCents / 100).toFixed(2),
        describeCadence(line),
        (calculateCultivationSaleValue(project) / 100).toFixed(2)
      ].join(';')
    );
  });

  const productionSalesCents = calculateCultivationRevenueTotal(state.cultivationProjects);
  const expectedRevenueCents = productionSalesCents + state.farmBuildersCents;

  const summary = [
    'resumo;reserva_caixa;' + formatCurrency(state.cashReserveCents),
    'resumo;venda_producao;' + formatCurrency(productionSalesCents),
    'resumo;farm_builders;' + formatCurrency(state.farmBuildersCents),
    'resumo;entrada_total_mes;' + formatCurrency(expectedRevenueCents)
  ];

  const content = [
    headers.join(';'),
    ...rows,
    '',
    investmentHeader.join(';'),
    ...investmentRows,
    '',
    purchaseHeader.join(';'),
    ...purchaseRows,
    '',
    maintenanceHeader.join(';'),
    ...maintenanceRows,
    '',
    cultivationHeader.join(';'),
    ...cultivationRows,
    '',
    ...summary
  ].join('\n');

  return new Blob([content], { type: 'text/csv;charset=utf-8;' });
};

export const exportPdf = async (dashboardNode: HTMLElement): Promise<Blob> => {
  const canvas = await html2canvas(dashboardNode, {
    scale: 2,
    backgroundColor: '#f3f1e7'
  });

  const imageData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' });

  const width = pdf.internal.pageSize.getWidth();
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(imageData, 'PNG', 0, 0, width, height);
  return pdf.output('blob');
};
