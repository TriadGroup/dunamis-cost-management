import ExcelJS from 'exceljs';
import { buildExportSheets } from '@/features/export/mappers/ExportMappers';
import type {
  ExportCellValue,
  ExportColumn,
  ExportFormulaValue,
  ExportMetric,
  ExportMetricTone,
  ExportSheet,
  ExportTable,
  FarmExportSnapshot
} from '@/features/export/types';

// ─── Palette ─────────────────────────────────────────────────────────────────
const WHITE = 'FFFFFF';
const MUTED = '6F8579';
const BORDER = 'D5E0D8';
const BORDER_STRONG = 'B0C4BA';
const BODY_STRIPE = 'F7FAF8';
const SHEET_BG = 'FBFDFC';
const TOTALS_BG = 'EEF5F0';
const TOTALS_FONT = '163B27';

// ─── Formats ─────────────────────────────────────────────────────────────────
const CURRENCY_FMT = '"R$" #,##0.00';
const PERCENT_FMT = '0.0%';
const DATE_FMT = 'dd/mm/yyyy';
const NUMBER_FMT = '#,##0.00';
const INTEGER_FMT = '#,##0';

// ─── Theme types ─────────────────────────────────────────────────────────────
type SheetTheme = {
  accent: string;       // dark: header fill, section headings
  accentSoft: string;   // border tint + section-heading bg
  accentSurface: string;// faint bg for title area, empty cells
  accentMuted: string;  // eyebrow / muted text
  accentAlt: string;    // alternate header or divider stripe
};

const DEFAULT_THEME: SheetTheme = {
  accent: '1B4332',
  accentSoft: 'EEF5F0',
  accentSurface: 'F6FAF7',
  accentMuted: '6E8679',
  accentAlt: '2D5B44'
};

const THEME_MAP: Array<{ prefix: string; theme: SheetTheme }> = [
  { prefix: '00_', theme: { accent: '1F5B43', accentSoft: 'E7F4EC', accentSurface: 'F2FAF6', accentMuted: '63806F', accentAlt: '286347' } },
  { prefix: '01_', theme: { accent: '365C4A', accentSoft: 'EAF3EE', accentSurface: 'F5FAF7', accentMuted: '6B8377', accentAlt: '3D6B55' } },
  { prefix: '02_', theme: { accent: '8C5A16', accentSoft: 'FBF1DF', accentSurface: 'FFFAF1', accentMuted: '9B7A46', accentAlt: 'A06920' } },
  { prefix: '03_', theme: { accent: '8A4F35', accentSoft: 'F8ECE6', accentSurface: 'FDF8F6', accentMuted: '9A705E', accentAlt: '9E5D41' } },
  { prefix: '04_', theme: { accent: '6B5C1E', accentSoft: 'F7F3E5', accentSurface: 'FCFBF5', accentMuted: '8A7B48', accentAlt: '786828' } },
  { prefix: '05_', theme: { accent: '365F59', accentSoft: 'EAF4F2', accentSurface: 'F5FBFA', accentMuted: '66807B', accentAlt: '3E6E67' } },
  { prefix: '06_', theme: { accent: '356C74', accentSoft: 'E9F5F7', accentSurface: 'F5FBFC', accentMuted: '64888F', accentAlt: '407B85' } },
  { prefix: '07_', theme: { accent: '91574A', accentSoft: 'F8ECE8', accentSurface: 'FDF8F7', accentMuted: 'A17870', accentAlt: 'A16357' } },
  { prefix: '08_', theme: { accent: '2F6450', accentSoft: 'E8F3EE', accentSurface: 'F4FBF7', accentMuted: '627D71', accentAlt: '38735C' } },
  { prefix: '09_', theme: { accent: '6D611E', accentSoft: 'F7F4E5', accentSurface: 'FCFBF6', accentMuted: '8F814C', accentAlt: '7A6E28' } },
  { prefix: '10_', theme: { accent: '2E5B3B', accentSoft: 'E9F4EC', accentSurface: 'F6FBF7', accentMuted: '688070', accentAlt: '366848' } },
  { prefix: '11_', theme: { accent: '35506E', accentSoft: 'EBF1F8', accentSurface: 'F6F9FD', accentMuted: '6B8199', accentAlt: '3E5E7F' } },
  { prefix: '12_', theme: { accent: '214D3D', accentSoft: 'E7F2EC', accentSurface: 'F5FAF7', accentMuted: '627B70', accentAlt: '2A5B49' } },
  { prefix: '13_', theme: { accent: '63563D', accentSoft: 'F3EEE6', accentSurface: 'FBF9F6', accentMuted: '857865', accentAlt: '73674B' } },
  { prefix: '14_', theme: { accent: '4E6271', accentSoft: 'EDF3F7', accentSurface: 'F7FAFC', accentMuted: '738795', accentAlt: '5A7082' } },
  { prefix: '15_', theme: { accent: '8B4A41', accentSoft: 'F8ECEA', accentSurface: 'FDF8F7', accentMuted: 'A06D67', accentAlt: '9C574D' } },
  { prefix: '16_', theme: { accent: '7B5A1F', accentSoft: 'F8F0DF', accentSurface: 'FCFAF3', accentMuted: '93764C', accentAlt: '8C692A' } },
  { prefix: '17_', theme: { accent: '40624D', accentSoft: 'EDF4F0', accentSurface: 'F7FBF8', accentMuted: '6E8577', accentAlt: '4B7059' } },
  { prefix: '18_', theme: { accent: '35666C', accentSoft: 'EBF5F6', accentSurface: 'F7FBFB', accentMuted: '6B878C', accentAlt: '3E757C' } },
  { prefix: '19_', theme: { accent: '5A5575', accentSoft: 'F0EEF8', accentSurface: 'F8F7FC', accentMuted: '7D7696', accentAlt: '686387' } },
  { prefix: '20_', theme: { accent: '8B443B', accentSoft: 'F8ECE9', accentSurface: 'FDF8F7', accentMuted: 'A36D64', accentAlt: '9C5048' } },
  { prefix: '98_', theme: { accent: '496659', accentSoft: 'EDF3F0', accentSurface: 'F8FBF9', accentMuted: '6F857A', accentAlt: '527566' } },
  { prefix: '99_', theme: { accent: '41525E', accentSoft: 'EEF2F5', accentSurface: 'F7F9FB', accentMuted: '6D7A84', accentAlt: '4C606D' } }
];

const METRIC_TONES: Record<ExportMetricTone, { fill: string; fillAlt: string; border: string; label: string; value: string }> = {
  forest:     { fill: 'E3F2E8', fillAlt: 'CCE9D5', border: '8EC4A0', label: '4E6B5A', value: '1A4F35' },
  sage:       { fill: 'EAF2ED', fillAlt: 'D4E8DA', border: 'A8C9B5', label: '577166', value: '1F4235' },
  mist:       { fill: 'E5EFF7', fillAlt: 'CEDDEE', border: '99BBCE', label: '4E6D81', value: '223F59' },
  amber:      { fill: 'FBF0E0', fillAlt: 'F5E0C0', border: 'D9BE8A', label: '7A6A3A', value: '6B4E12' },
  terracotta: { fill: 'F7E8E4', fillAlt: 'EED0C8', border: 'CFA098', label: '7A574E', value: '6B3828' },
  slate:      { fill: 'EAEEf3', fillAlt: 'D6DCE5', border: 'B0BEC9', label: '566470', value: '384653' }
};

// ─── Utility ─────────────────────────────────────────────────────────────────
const resolveTheme = (sheetName: string): SheetTheme =>
  THEME_MAP.find((entry) => sheetName.startsWith(entry.prefix))?.theme || DEFAULT_THEME;

const formatCellValue = (value: ExportCellValue): ExcelJS.CellValue => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'formula' in value) {
    const formulaValue = value as ExportFormulaValue;
    return { formula: formulaValue.formula, result: formulaValue.result ?? undefined };
  }
  return value;
};

const setNumFmt = (target: ExcelJS.Cell | ExcelJS.Column, format?: ExportColumn['format']) => {
  switch (format) {
    case 'currency': target.numFmt = CURRENCY_FMT; break;
    case 'percent':  target.numFmt = PERCENT_FMT;  break;
    case 'date':     target.numFmt = DATE_FMT;     break;
    case 'number':   target.numFmt = NUMBER_FMT;   break;
    case 'integer':  target.numFmt = INTEGER_FMT;  break;
    default: break;
  }
};

const fillRect = (
  ws: ExcelJS.Worksheet,
  r1: number, c1: number,
  r2: number, c2: number,
  argb: string
) => {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      ws.getCell(r, c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
    }
  }
};

const borderCell = (cell: ExcelJS.Cell, top = BORDER, bottom = BORDER, left = BORDER, right = BORDER) => {
  cell.border = {
    top:    { style: 'thin', color: { argb: top } },
    bottom: { style: 'thin', color: { argb: bottom } },
    left:   { style: 'thin', color: { argb: left } },
    right:  { style: 'thin', color: { argb: right } }
  };
};

const escapeDropdownValue = (value: string) => value.replace(/"/g, '""');

const applyDropdownValidation = (
  ws: ExcelJS.Worksheet,
  columnIndex: number,
  startRow: number,
  endRow: number,
  dropdown: string[]
) => {
  const formula = `"${dropdown.map(escapeDropdownValue).join(',')}"`;
  for (let row = startRow; row <= endRow; row += 1) {
    ws.getCell(row, columnIndex).dataValidation = {
      type: 'list',
      allowBlank: true,
      showInputMessage: true,
      promptTitle: 'Escolha na lista',
      prompt: 'Use a seta para escolher um valor desta coluna.',
      showErrorMessage: true,
      errorTitle: 'Valor inválido',
      error: 'Escolha um valor da lista desta coluna.',
      formulae: [formula]
    };
  }
};

// ─── Row style helpers ────────────────────────────────────────────────────────
const applyHeaderStyle = (row: ExcelJS.Row, theme: SheetTheme) => {
  row.height = 26;
  row.font = { bold: true, color: { argb: WHITE }, size: 11, name: 'Calibri' };
  row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.accent } };
    cell.border = {
      top:    { style: 'medium', color: { argb: theme.accentAlt } },
      bottom: { style: 'medium', color: { argb: theme.accentAlt } },
      left:   { style: 'thin',   color: { argb: theme.accentAlt } },
      right:  { style: 'thin',   color: { argb: theme.accentAlt } }
    };
  });
};

const applyBodyStyle = (row: ExcelJS.Row, columns: ExportColumn[], striped: boolean) => {
  row.height = 21;
  row.font = { size: 10, name: 'Calibri' };
  row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  row.eachCell((cell, colNumber) => {
    const col = columns[colNumber - 1];
    if (!col) return;
    cell.border = { bottom: { style: 'hair', color: { argb: BORDER } }, right: { style: 'hair', color: { argb: BORDER } } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: striped ? BODY_STRIPE : WHITE } };
    if (col.format === 'currency' || col.format === 'number' || col.format === 'integer' || col.format === 'percent') {
      cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: false };
    }
  });
};

const applyTotalsStyle = (row: ExcelJS.Row, theme: SheetTheme, count: number) => {
  row.height = 24;
  row.font = { bold: true, size: 11, name: 'Calibri', color: { argb: TOTALS_FONT } };
  for (let c = 1; c <= count; c++) {
    const cell = row.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTALS_BG } };
    cell.border = {
      top:    { style: 'medium', color: { argb: BORDER_STRONG } },
      bottom: { style: 'thin',   color: { argb: BORDER } },
      left:   { style: 'hair',   color: { argb: BORDER } },
      right:  { style: 'hair',   color: { argb: BORDER } }
    };
  }
  row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
};

// ─── Sheet Header ─────────────────────────────────────────────────────────────
const writeSheetTitle = (
  ws: ExcelJS.Worksheet,
  title: string,
  description: string,
  width: number,
  theme: SheetTheme,
  generatedAt?: string
) => {
  // Row 1: accent band (eyebrow)
  fillRect(ws, 1, 1, 1, width, theme.accent);
  ws.mergeCells(1, 1, 1, width - 1);
  const eyebrow = ws.getCell(1, 1);
  eyebrow.value = 'DUNAMIS FARM OS  ·  Exportação completa de dados';
  eyebrow.font = { size: 9, bold: true, color: { argb: 'AADDCC' }, name: 'Calibri' };
  eyebrow.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 20;

  if (generatedAt) {
    const dateCell = ws.getCell(1, width);
    dateCell.value = `Gerado em ${new Date(generatedAt).toLocaleDateString('pt-BR')}`;
    dateCell.font = { size: 9, color: { argb: '88BBAA' }, name: 'Calibri' };
    dateCell.alignment = { vertical: 'middle', horizontal: 'right' };
    dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.accent } };
  }

  // Row 2: large title
  fillRect(ws, 2, 1, 2, width, theme.accentSurface);
  ws.mergeCells(2, 1, 2, width);
  const titleCell = ws.getCell(2, 1);
  titleCell.value = title;
  titleCell.font = { size: 22, bold: true, color: { argb: theme.accent }, name: 'Calibri' };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(2).height = 38;

  // Row 3: description
  fillRect(ws, 3, 1, 3, width, theme.accentSurface);
  ws.mergeCells(3, 1, 3, width);
  const descCell = ws.getCell(3, 1);
  descCell.value = description;
  descCell.font = { size: 11, color: { argb: MUTED }, name: 'Calibri' };
  descCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  ws.getRow(3).height = 26;

  // Row 4: thin accent divider
  fillRect(ws, 4, 1, 4, width, theme.accentSoft);
  ws.getRow(4).height = 6;
};

// ─── Metric cards ─────────────────────────────────────────────────────────────
const renderMetricCard = (
  ws: ExcelJS.Worksheet,
  metric: ExportMetric,
  rowStart: number,
  colStart: number,
  colSpan: number
) => {
  const tone = METRIC_TONES[metric.tone || 'forest'];
  const colEnd = colStart + colSpan - 1;

  // Fill entire card area
  fillRect(ws, rowStart, colStart, rowStart + 4, colEnd, tone.fill);

  // Top accent stripe for the card
  fillRect(ws, rowStart, colStart, rowStart, colEnd, tone.fillAlt);

  // Label row (top)
  ws.mergeCells(rowStart, colStart, rowStart, colEnd);
  const labelCell = ws.getCell(rowStart, colStart);
  labelCell.value = metric.label.toUpperCase();
  labelCell.font = { size: 9, bold: true, color: { argb: tone.label }, name: 'Calibri' };
  labelCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(rowStart).height = 16;

  // VALUE row (spans 2 rows for breathing room)
  ws.mergeCells(rowStart + 1, colStart, rowStart + 2, colEnd);
  const valueCell = ws.getCell(rowStart + 1, colStart);
  valueCell.value = formatCellValue(metric.value);
  valueCell.font = { size: 20, bold: true, color: { argb: tone.value }, name: 'Calibri' };
  valueCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
  setNumFmt(valueCell, metric.format);
  ws.getRow(rowStart + 1).height = 26;
  ws.getRow(rowStart + 2).height = 12;

  // Hint row
  ws.mergeCells(rowStart + 3, colStart, rowStart + 3, colEnd);
  const hintCell = ws.getCell(rowStart + 3, colStart);
  hintCell.value = metric.hint || '';
  hintCell.font = { size: 9, color: { argb: tone.label }, name: 'Calibri', italic: true };
  hintCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  ws.getRow(rowStart + 3).height = 16;

  // Divider row below card
  fillRect(ws, rowStart + 4, colStart, rowStart + 4, colEnd, WHITE);
  ws.getRow(rowStart + 4).height = 4;

  // Border the entire card
  for (let r = rowStart; r <= rowStart + 3; r++) {
    for (let c = colStart; c <= colEnd; c++) {
      const cell = ws.getCell(r, c);
      const isTop    = r === rowStart;
      const isBottom = r === rowStart + 3;
      const isLeft   = c === colStart;
      const isRight  = c === colEnd;
      cell.border = {
        top:    isTop    ? { style: 'medium', color: { argb: tone.border } } : undefined,
        bottom: isBottom ? { style: 'medium', color: { argb: tone.border } } : undefined,
        left:   isLeft   ? { style: 'medium', color: { argb: tone.border } } : undefined,
        right:  isRight  ? { style: 'medium', color: { argb: tone.border } } : undefined
      };
    }
  }
};

// ─── Summary metric region ───────────────────────────────────────────────────
const writeSummaryMetrics = (
  ws: ExcelJS.Worksheet,
  sheet: ExportSheet,
  width: number,
  startRow: number,
  theme: SheetTheme
): number => {
  if (!sheet.summaryMetrics?.length) return startRow;

  const colCount = Math.max(1, Math.min(sheet.summaryColumns || Math.min(sheet.summaryMetrics.length, 4), 4));
  const gap = 1;
  const cardSpan = Math.max(3, Math.floor((width - gap * (colCount - 1)) / colCount));

  // Section heading
  if (sheet.summaryTitle) {
    fillRect(ws, startRow, 1, startRow, width, theme.accentSoft);
    ws.mergeCells(startRow, 1, startRow, width);
    const cell = ws.getCell(startRow, 1);
    cell.value = `▸  ${sheet.summaryTitle}`;
    cell.font = { size: 11, bold: true, color: { argb: theme.accent }, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(startRow).height = 22;
    startRow += 1;
  }

  if (sheet.summaryDescription) {
    ws.mergeCells(startRow, 1, startRow, width);
    const cell = ws.getCell(startRow, 1);
    cell.value = sheet.summaryDescription;
    cell.font = { size: 9, color: { argb: MUTED }, name: 'Calibri', italic: true };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    ws.getRow(startRow).height = 18;
    startRow += 1;
  }

  // Gap before cards
  ws.getRow(startRow).height = 4;
  startRow += 1;

  const rowsOfCards = Math.ceil(sheet.summaryMetrics.length / colCount);

  sheet.summaryMetrics.forEach((metric, idx) => {
    const rowOffset = Math.floor(idx / colCount) * 5;
    const colOffset = idx % colCount;
    const colStart = 1 + colOffset * (cardSpan + gap);
    renderMetricCard(ws, metric, startRow + rowOffset, colStart, cardSpan);
  });

  // Gap after cards
  const cardEnd = startRow + rowsOfCards * 5;
  ws.getRow(cardEnd).height = 8;
  return cardEnd + 1;
};

// ─── Section heading ──────────────────────────────────────────────────────────
const writeSectionHeading = (
  ws: ExcelJS.Worksheet,
  row: number,
  width: number,
  theme: SheetTheme,
  title?: string,
  description?: string
): number => {
  let cursor = row;

  if (title) {
    fillRect(ws, cursor, 1, cursor, width, theme.accentSoft);
    ws.mergeCells(cursor, 1, cursor, width);
    const cell = ws.getCell(cursor, 1);
    cell.value = `▸  ${title}`;
    cell.font = { size: 11, bold: true, color: { argb: theme.accent }, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    ws.getRow(cursor).height = 22;
    // Left accent bar via left-border
    cell.border = { left: { style: 'thick', color: { argb: theme.accent } }, bottom: { style: 'thin', color: { argb: theme.accentSoft } } };
    cursor += 1;
  }

  if (description) {
    ws.mergeCells(cursor, 1, cursor, width);
    const cell = ws.getCell(cursor, 1);
    cell.value = description;
    cell.font = { size: 9, color: { argb: MUTED }, name: 'Calibri', italic: true };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    ws.getRow(cursor).height = 18;
    cursor += 1;
  }

  return cursor;
};

const writeInstructionRow = (
  ws: ExcelJS.Worksheet,
  row: number,
  width: number,
  theme: SheetTheme,
  lines: string[]
) => {
  fillRect(ws, row, 1, row, width, theme.accentSurface);
  ws.mergeCells(row, 1, row, width);
  const cell = ws.getCell(row, 1);
  cell.value = `ℹ️ ${lines.join('  •  ')}`;
  cell.font = { size: 9, color: { argb: theme.accentMuted }, italic: true, name: 'Calibri' };
  cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  cell.border = { left: { style: 'thick', color: { argb: theme.accentSoft } } };
  ws.getRow(row).height = 24;
  return row + 1;
};

// ─── Totals row ───────────────────────────────────────────────────────────────
/**
 * Adds a SUM totals row at the end of a table for numeric columns.
 * Uses Excel SUM formula referencing the data rows just written.
 */
const addTotalsRow = (
  ws: ExcelJS.Worksheet,
  columns: ExportColumn[],
  dataStartRow: number,
  dataEndRow: number,
  theme: SheetTheme
) => {
  if (dataEndRow < dataStartRow) return dataEndRow;

  const totalsRow = ws.getRow(dataEndRow + 1);
  columns.forEach((col, idx) => {
    const cell = totalsRow.getCell(idx + 1);
    const colLetter = ws.getColumn(idx + 1).letter;
    if (idx === 0) {
      cell.value = 'TOTAIS';
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    } else if (col.format === 'currency' || col.format === 'number' || col.format === 'integer') {
      cell.value = {
        formula: `SUM(${colLetter}${dataStartRow}:${colLetter}${dataEndRow})`,
        result: 0
      };
      setNumFmt(cell, col.format);
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    } else if (col.format === 'percent') {
      cell.value = {
        formula: `IFERROR(AVERAGE(${colLetter}${dataStartRow}:${colLetter}${dataEndRow}),0)`,
        result: 0
      };
      setNumFmt(cell, col.format);
      cell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
  });
  applyTotalsStyle(totalsRow, theme, columns.length);
  return dataEndRow + 1;
};

// ─── Table renderer ───────────────────────────────────────────────────────────
const addTable = (
  ws: ExcelJS.Worksheet,
  table: ExportTable,
  startRow: number,
  theme: SheetTheme,
  firstHeaderRowRef: { value: number | null },
  showTotals = true
): { nextRow: number; headerRow: number } => {
  const colCount = table.columns.length || 1;
  let cursor = writeSectionHeading(ws, startRow, colCount, theme, table.title, table.description);
  const hasDropdowns = table.columns.some((column) => (column.dropdown?.length || 0) > 0);
  if (table.editable || hasDropdowns || (table.instructions?.length || 0) > 0) {
    const instructionLines = table.instructions?.length
      ? table.instructions
      : [
          hasDropdowns
            ? 'Use os dropdowns quando houver seta. Ajustes feitos aqui recalculam esta workbook, mas não voltam para o dashboard.'
            : 'Edite esta seção com cuidado para explorar cenários sem mexer no dado original do app.'
        ];
    cursor = writeInstructionRow(ws, cursor, colCount, theme, instructionLines);
  }

  // Header
  const headerRowNumber = cursor;
  const headerRow = ws.getRow(headerRowNumber);
  table.columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    ws.getColumn(idx + 1).width = Math.max(col.width ?? 18, 10);
    setNumFmt(ws.getColumn(idx + 1), col.format);
  });
  applyHeaderStyle(headerRow, theme);

  if (firstHeaderRowRef.value === null) {
    firstHeaderRowRef.value = headerRowNumber;
  }

  cursor += 1;

  // Empty state
  if (table.rows.length === 0) {
    ws.mergeCells(cursor, 1, cursor + 1, colCount);
    const emptyCell = ws.getCell(cursor, 1);
    emptyCell.value = '✦  Nenhum dado registrado ainda nesta seção. Os valores aparecerão aqui conforme o dashboard for alimentado.';
    emptyCell.font = { color: { argb: MUTED }, italic: true, size: 10, name: 'Calibri' };
    emptyCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true, indent: 1 };
    fillRect(ws, cursor, 1, cursor + 1, colCount, theme.accentSurface);
    ws.getRow(cursor).height = 28;
    ws.getRow(cursor + 1).height = 4;
    return { nextRow: cursor + 3, headerRow: headerRowNumber };
  }

  // Data rows
  const dataStartRow = cursor;
  table.rows.forEach((row, rowIdx) => {
    const excelRow = ws.getRow(cursor + rowIdx);
    table.columns.forEach((col, colIdx) => {
      const cell = excelRow.getCell(colIdx + 1);
      cell.value = formatCellValue(row[col.key]);
      setNumFmt(cell, col.format);
    });
    applyBodyStyle(excelRow, table.columns, rowIdx % 2 === 1);
  });
  const dataEndRow = cursor + table.rows.length - 1;
  table.columns.forEach((column, index) => {
    if (!column.dropdown?.length) return;
    applyDropdownValidation(ws, index + 1, dataStartRow, dataEndRow + 24, column.dropdown);
  });
  cursor = dataEndRow + 1;

  // Totals row (only if has numeric columns and rows exist)
  const hasNumericCols = table.columns.some(
    (c) => c.format === 'currency' || c.format === 'number' || c.format === 'integer' || c.format === 'percent'
  );
  if (showTotals && hasNumericCols && table.rows.length > 1) {
    cursor = addTotalsRow(ws, table.columns, dataStartRow, dataEndRow, theme) + 1;
  }

  return { nextRow: cursor + 1, headerRow: headerRowNumber };
};

// ─── Sheet builder ────────────────────────────────────────────────────────────
const addSheet = (workbook: ExcelJS.Workbook, definition: ExportSheet, generatedAt?: string) => {
  const theme = resolveTheme(definition.name);

  const colCount = Math.max(1, Math.min(definition.summaryColumns || Math.min(definition.summaryMetrics?.length || 0, 4), 4));
  const summaryWidth = colCount > 0 ? colCount * 4 + Math.max(0, colCount - 1) : 0;
  const maxTableColumns = Math.max(1, ...definition.tables.map((t) => t.columns.length));
  const maxColumns = Math.max(maxTableColumns, summaryWidth, 8);

  const ws = workbook.addWorksheet(definition.name);
  ws.properties.defaultRowHeight = 21;
  ws.pageSetup = { fitToPage: true, fitToWidth: 1, fitToHeight: 0, orientation: 'landscape' };

  // Background fill
  fillRect(ws, 1, 1, 400, maxColumns, SHEET_BG);

  // Header
  writeSheetTitle(ws, definition.title, definition.description, maxColumns, theme, generatedAt);

  let currentRow = 5;
  currentRow = writeSummaryMetrics(ws, definition, maxColumns, currentRow, theme);

  // Gap between summary and tables
  if (definition.summaryMetrics?.length) {
    // thin accent divider before tables section
    fillRect(ws, currentRow, 1, currentRow, maxColumns, theme.accentSoft);
    ws.getRow(currentRow).height = 4;
    currentRow += 1;
  }

  const firstHeaderRowRef: { value: number | null } = { value: null };

  definition.tables.forEach((table, idx) => {
    const { nextRow } = addTable(ws, table, currentRow, theme, firstHeaderRowRef);
    currentRow = nextRow + (idx < definition.tables.length - 1 ? 1 : 0);
  });

  // Auto-filter on first table header (no row freeze — avoids the gray bar in Google Sheets)
  ws.views = [{ showGridLines: false }];
  if (firstHeaderRowRef.value !== null) {
    const firstTable = definition.tables[0];
    if (firstTable.rows.length > 0) {
      ws.autoFilter = {
        from: { row: firstHeaderRowRef.value, column: 1 },
        to:   { row: firstHeaderRowRef.value, column: firstTable.columns.length }
      };
    }
  }

  if (definition.hidden) {
    ws.state = 'hidden';
  }

  return ws;
};

// ─── Cover sheet ──────────────────────────────────────────────────────────────
const buildCoverSheet = (workbook: ExcelJS.Workbook, snapshot: FarmExportSnapshot) => {
  const theme = DEFAULT_THEME;
  const ws = workbook.addWorksheet('🏠 Início');
  ws.views = [{ showGridLines: false }];
  fillRect(ws, 1, 1, 60, 12, SHEET_BG);

  // Accent band
  fillRect(ws, 1, 1, 6, 12, theme.accent);
  ws.getRow(1).height = 12;
  ws.getRow(2).height = 12;

  ws.mergeCells(3, 1, 5, 12);
  const brandCell = ws.getCell(3, 1);
  brandCell.value = 'DUNAMIS FARM OS';
  brandCell.font = { size: 28, bold: true, color: { argb: WHITE }, name: 'Calibri' };
  brandCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(3).height = 16;
  ws.getRow(4).height = 28;
  ws.getRow(5).height = 16;

  ws.mergeCells(6, 1, 6, 12);
  const subtitleCell = ws.getCell(6, 1);
  subtitleCell.value = 'Exportação Completa de Dados da Operação';
  subtitleCell.font = { size: 14, color: { argb: 'AADDCC' }, name: 'Calibri', bold: true };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(6).height = 28;

  fillRect(ws, 7, 1, 7, 12, SHEET_BG);
  ws.getRow(7).height = 12;

  // Operation info block
  const info = [
    ['Operação', snapshot.setup.identity.operationName || '—'],
    ['Apelido', snapshot.setup.identity.operationNickname || '—'],
    ['Localização', snapshot.setup.identity.location || '—'],
    ['Gerado em', new Date(snapshot.generatedAt).toLocaleString('pt-BR')],
  ];

  info.forEach(([label, value], idx) => {
    const r = 8 + idx * 2;
    fillRect(ws, r, 2, r, 5, theme.accentSoft);
    fillRect(ws, r, 6, r, 11, WHITE);
    ws.mergeCells(r, 2, r, 5);
    ws.mergeCells(r, 6, r, 11);

    const labelCell = ws.getCell(r, 2);
    labelCell.value = label;
    labelCell.font = { size: 11, bold: true, color: { argb: theme.accent }, name: 'Calibri' };
    labelCell.alignment = { vertical: 'middle', horizontal: 'right' };

    const valCell = ws.getCell(r, 6);
    valCell.value = value;
    valCell.font = { size: 11, color: { argb: '222222' }, name: 'Calibri' };
    valCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    borderCell(valCell, theme.accentSoft, theme.accentSoft, BORDER, BORDER);
    ws.getRow(r).height = 26;
    ws.getRow(r + 1).height = 4;
  });

  // Index
  const indexStart = 8 + info.length * 2 + 2;
  fillRect(ws, indexStart, 2, indexStart, 11, theme.accent);
  ws.mergeCells(indexStart, 2, indexStart, 11);
  const indexHeaderCell = ws.getCell(indexStart, 2);
  indexHeaderCell.value = 'ÍNDICE DE ABAS';
  indexHeaderCell.font = { size: 11, bold: true, color: { argb: WHITE }, name: 'Calibri' };
  indexHeaderCell.alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(indexStart).height = 24;

  const sheetIndex = [
    '00_Resumo_Executivo · Leitura executiva macro',
    '01_Operacao · Identidade, áreas, perfis e estruturas',
    '02_Implantacao · Projetos, itens e cotações',
    '03_Custos · Custos recorrentes e sazonais',
    '04_Compras · Pedidos e recebimentos',
    '05_Estoque · Produtos, lotes e movimentos',
    '06_Campo_Aplicacoes · Aplicações de campo',
    '07_Campo_Perdas · Perdas registradas',
    '08_Colheitas · Volume e destinos da colheita',
    '09_Canais · Demanda e preços por destino',
    '10_Culturas · Base de configuração das culturas',
    '11_Planos · Planos de produção e área',
    '12_Unit_Economics · Custo e preço por unidade',
    '13_Mao_de_Obra · Horas e custo da equipe',
    '14_Equipamentos · Uso e custo de equipamentos',
    '15_Manutencao · Manutenção e reserva mensal',
    '16_Investimentos · Contratos e payback',
    '17_Lotes · Rastreabilidade de lotes',
    '18_Calendario · Guidelines agronômicos',
    '19_Cenarios · Simulações e comparativos',
    '20_Alertas · Pontos de atenção',
    '98_Dicionario · Guia de colunas e campos',
    '99_Base_Tecnica (oculta) · Métricas e ledger'
  ];

  sheetIndex.forEach((label, idx) => {
    const r = indexStart + 1 + idx;
    fillRect(ws, r, 2, r, 11, idx % 2 === 0 ? WHITE : BODY_STRIPE);
    ws.mergeCells(r, 2, r, 11);
    const cell = ws.getCell(r, 2);
    cell.value = `  ${idx + 1}.  ${label}`;
    cell.font = { size: 10, color: { argb: '444444' }, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = { bottom: { style: 'hair', color: { argb: BORDER } } };
    ws.getRow(r).height = 20;
  });

  // Set column widths
  for (let c = 1; c <= 12; c++) {
    ws.getColumn(c).width = c === 1 || c === 12 ? 4 : 12;
  }
};

// ─── Main workbook builder ───────────────────────────────────────────────────
const fileDateStamp = (generatedAt: string) => {
  const date = new Date(generatedAt);
  if (Number.isNaN(date.getTime())) return generatedAt.slice(0, 10);
  return date.toISOString().slice(0, 10);
};

export const buildFarmWorkbook = async (snapshot: FarmExportSnapshot): Promise<ExcelJS.Workbook> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Dunamis Farm OS';
  workbook.lastModifiedBy = 'Dunamis Farm OS';
  workbook.created = new Date(snapshot.generatedAt);
  workbook.modified = new Date(snapshot.generatedAt);
  workbook.subject = 'Exportação completa da operação Dunamis Farm';
  workbook.title = `Dunamis Farm OS · ${fileDateStamp(snapshot.generatedAt)}`;

  // Cover page
  buildCoverSheet(workbook, snapshot);

  // All data sheets
  buildExportSheets(snapshot).forEach((sheet) => {
    addSheet(workbook, sheet, snapshot.generatedAt);
  });

  return workbook;
};
