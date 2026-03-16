import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSetupStore } from '@/app/store/useSetupStore';
import { loadExampleWorkspace, resetWorkspaceToEmpty } from '@/app/store/setupWorkspace';
import { buildFarmWorkbook } from '@/features/export/builders/WorkbookBuilders';
import {
  buildFarmExportFileName,
  buildFarmExportSnapshot
} from '@/features/export/services/ExportService';
import { ExportWorkbookButton } from '@/features/export/ui/ExportWorkbookButton';

vi.mock('@/features/export/services/ExportService', async () => {
  const actual = await vi.importActual<typeof import('@/features/export/services/ExportService')>(
    '@/features/export/services/ExportService'
  );
  return {
    ...actual,
    exportFarmWorkbook: vi.fn(async () => undefined)
  };
});

const EXPECTED_SHEETS = [
  '🏠 Início',
  '00_Resumo_Executivo',
  '01_Operacao',
  '02_Implantacao',
  '03_Custos',
  '04_Compras',
  '05_Estoque',
  '06_Campo_Aplicacoes',
  '07_Campo_Perdas',
  '08_Colheitas',
  '09_Canais',
  '10_Culturas',
  '11_Planos',
  '12_Unit_Economics',
  '13_Mao_de_Obra',
  '14_Equipamentos',
  '15_Manutencao',
  '16_Investimentos',
  '17_Lotes',
  '18_Calendario',
  '19_Cenarios',
  '20_Alertas',
  '98_Dicionario',
  '99_Base_Tecnica'
];

const findRowByFirstCell = (worksheet: import('exceljs').Worksheet, label: string) => {
  for (let rowIndex = 1; rowIndex <= worksheet.rowCount; rowIndex += 1) {
    const value = worksheet.getRow(rowIndex).getCell(1).value;
    if (value === label) {
      return worksheet.getRow(rowIndex);
    }
  }
  return null;
};

const findFormulaRowByFirstCell = (worksheet: import('exceljs').Worksheet, label: string) => {
  for (let rowIndex = 1; rowIndex <= worksheet.rowCount; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    const labelValue = row.getCell(1).value;
    const formulaCandidate = row.getCell(2).value;
    if (
      labelValue === label &&
      typeof formulaCandidate === 'object' &&
      formulaCandidate !== null &&
      'formula' in formulaCandidate
    ) {
      return row;
    }
  }
  return null;
};

const findHeaderRow = (worksheet: import('exceljs').Worksheet, label: string) => {
  for (let rowIndex = 1; rowIndex <= worksheet.rowCount; rowIndex += 1) {
    const row = worksheet.getRow(rowIndex);
    const rowValues = Array.isArray(row.values) ? row.values.slice(1) : [];
    const values = rowValues.map((value: unknown) => (value == null ? '' : String(value)));
    if (values.includes(label)) {
      return row;
    }
  }
  return null;
};

describe('farm workbook export', () => {
  beforeEach(() => {
    localStorage.clear();
    act(() => {
      useSetupStore.getState().resetSetup();
      resetWorkspaceToEmpty();
    });
  });

  it('builds a valid workbook even with an empty workspace', async () => {
    const snapshot = buildFarmExportSnapshot();
    const workbook = await buildFarmWorkbook(snapshot);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual(EXPECTED_SHEETS);
    expect(workbook.getWorksheet('99_Base_Tecnica')?.state).toBe('hidden');
    expect(workbook.getWorksheet('03_Custos')).toBeTruthy();
    expect(workbook.getWorksheet('13_Mao_de_Obra')).toBeTruthy();
    expect(workbook.getWorksheet('14_Equipamentos')).toBeTruthy();
  });

  it('populates workbook with demo data and keeps formulas on executive summary', async () => {
    act(() => {
      loadExampleWorkspace();
    });

    const snapshot = buildFarmExportSnapshot();
    const workbook = await buildFarmWorkbook(snapshot);

    const summarySheet = workbook.getWorksheet('00_Resumo_Executivo');
    const unitSheet = workbook.getWorksheet('12_Unit_Economics');
    const alertsSheet = workbook.getWorksheet('20_Alertas');
    const costsSheet = workbook.getWorksheet('03_Custos');

    expect(summarySheet).toBeTruthy();
    expect(unitSheet).toBeTruthy();
    expect(alertsSheet).toBeTruthy();
    expect(costsSheet).toBeTruthy();

    const entryRow = findFormulaRowByFirstCell(summarySheet!, 'Entrada do mês');
    expect(entryRow).not.toBeNull();
    expect(entryRow!.getCell(2).value).toMatchObject({
      formula: expect.stringContaining("MATCH(\"monthly_inflow\"")
    });

    const costsHeaderRow = findHeaderRow(costsSheet!, 'Categoria');
    expect(costsHeaderRow).not.toBeNull();
    expect(costsHeaderRow!.getCell(1).value).toBe('Categoria');
    expect(costsHeaderRow!.getCell(5).value).toBe('Valor evento');

    expect(unitSheet!.rowCount).toBeGreaterThan(7);
    expect(alertsSheet!.rowCount).toBeGreaterThan(6);
    expect(snapshot.snapshot.attentionPoints.length).toBeGreaterThan(0);
  });

  it('adds dropdown validation to categorical export columns', async () => {
    act(() => {
      loadExampleWorkspace();
    });

    const snapshot = buildFarmExportSnapshot();
    const workbook = await buildFarmWorkbook(snapshot);
    const costsSheet = workbook.getWorksheet('03_Custos');
    const categoryHeaderRow = findHeaderRow(costsSheet!, 'Categoria');

    expect(categoryHeaderRow).not.toBeNull();

    const firstDataRow = (categoryHeaderRow?.number || 0) + 1;
    const categoryCell = costsSheet!.getRow(firstDataRow).getCell(1);

    expect(categoryCell.dataValidation).toMatchObject({
      type: 'list'
    });
  });

  it('uses the expected file naming convention', () => {
    const fileName = buildFarmExportFileName(new Date('2026-03-13T10:00:00.000Z'));
    expect(fileName).toBe('dunamis-farm-os-export-2026-03-13.xlsx');
  });
});

describe('ExportWorkbookButton', () => {
  it('shows loading and success feedback while exporting', async () => {
    const service = await import('@/features/export/services/ExportService');
    const exportFarmWorkbookMock = vi.mocked(service.exportFarmWorkbook);
    let resolveExport: (() => void) | null = null;
    exportFarmWorkbookMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveExport = resolve;
        })
    );

    render(<ExportWorkbookButton />);

    const button = screen.getByRole('button', { name: /exportar xlsx/i });
    fireEvent.click(button);

    expect(exportFarmWorkbookMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button').getAttribute('aria-busy')).toBe('true');

    await act(async () => {
      resolveExport?.();
    });

    await waitFor(() => {
      expect(screen.getByRole('button').textContent).toContain('Baixado!');
    });
  });
});
