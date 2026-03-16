import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { AppState } from '@/entities/finance/types';
import { formatCurrency } from '@/shared/lib/format';

export const exportCsv = (state: AppState): Blob => {
  const headers = ['tipo', 'categoria', 'nome', 'valor_base', 'recorrencia', 'slider_item_pct', 'observacoes'];
  const rows = state.items.map((item) => {
    const category = state.categories.find((entry) => entry.id === item.categoryId);
    return [
      item.type,
      category?.name ?? 'Sem categoria',
      item.name,
      (item.baseValueCents / 100).toFixed(2),
      item.recurrence,
      String(item.itemSliderPct),
      item.notes.replaceAll(';', ',')
    ].join(';');
  });

  const investmentHeader = ['tipo', 'nome', 'investimento', 'retorno_mensal', 'horizonte_meses', 'risco'];
  const investmentRows = state.investments.map((item) =>
    ['investimento', item.name, item.amountCents / 100, item.expectedMonthlyReturnCents / 100, item.horizonMonths, item.riskLevel].join(';')
  );

  const summary = [
    'resumo;reserva_caixa;' + formatCurrency(state.cashReserveCents),
    'resumo;receita_prevista_manual;' + formatCurrency(state.expectedRevenueCents)
  ];

  const content = [headers.join(';'), ...rows, '', investmentHeader.join(';'), ...investmentRows, '', ...summary].join('\n');

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
