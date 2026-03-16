import { describe, expect, it } from 'vitest';
import type { CultivationCostSheet, CultivationProject } from '@/entities/finance/types';
import { calculateCultivationPortfolio, calculateCultivationSummary } from '@/entities/finance/cultivation';

const makeProject = (overrides: Partial<CultivationProject> = {}): CultivationProject => ({
  id: '1',
  name: 'Cafe',
  cropType: 'Cafe',
  variety: 'Catuai',
  areaValue: 10,
  areaUnit: 'hectare',
  productivityValue: 10,
  productivityUnit: 'sacas_por_hectare',
  salesUnit: 'saca_60kg',
  pricePerSalesUnitCents: 10000,
  postHarvestLossPct: 0,
  qualityAdjustmentPct: 0,
  cycleMonths: 5,
  season: 'safra_principal',
  notes: '',
  projectionConfidence: 'medium',
  dataCompletenessStatus: 'parcial',
  pendingCostStatus: 'custo_definido',
  ...overrides
});

const makeSheet = (cropId: string, lines: CultivationCostSheet['lines']): CultivationCostSheet => ({
  id: `sheet-${cropId}`,
  cropId,
  pendingCostStatus: 'custo_definido',
  dataCompletenessStatus: 'parcial',
  lines,
  updatedAt: new Date().toISOString()
});

describe('cultivation calculations', () => {
  it('calculates project margin and monthly margin', () => {
    const project = makeProject();
    const sheet = makeSheet(project.id, [
      {
        id: 'a',
        name: 'Semente',
        itemType: 'custo_por_safra',
        eventValueCents: 200000,
        monthlyEquivalentCents: 40000,
        recurrenceType: 'por_safra',
        intervalUnit: 'safras',
        intervalValue: 1,
        nextOccurrenceDate: '',
        lastOccurrenceDate: '',
        paymentMethod: '',
        status: 'ativo',
        notes: ''
      },
      {
        id: 'b',
        name: 'Plantio',
        itemType: 'custo_por_safra',
        eventValueCents: 100000,
        monthlyEquivalentCents: 20000,
        recurrenceType: 'por_safra',
        intervalUnit: 'safras',
        intervalValue: 1,
        nextOccurrenceDate: '',
        lastOccurrenceDate: '',
        paymentMethod: '',
        status: 'ativo',
        notes: ''
      }
    ]);

    const summary = calculateCultivationSummary(project, sheet);

    expect(summary.totalCostCents).toBe(300000);
    expect(summary.marginCents).toBe(700000);
    expect(summary.monthlyMarginCents).toBe(140000);
  });

  it('aggregates multiple projects', () => {
    const project1 = makeProject({ id: '1', name: 'Cafe' });
    const project2 = makeProject({
      id: '2',
      name: 'Milho',
      cropType: 'Milho',
      variety: 'AG 1051',
      areaValue: 8,
      cycleMonths: 4
    });

    const portfolio = calculateCultivationPortfolio(
      [project1, project2],
      [
        makeSheet(project1.id, [
          {
            id: 'a',
            name: 'Semente',
            itemType: 'custo_por_safra',
            eventValueCents: 300000,
            monthlyEquivalentCents: 60000,
            recurrenceType: 'por_safra',
            intervalUnit: 'safras',
            intervalValue: 1,
            nextOccurrenceDate: '',
            lastOccurrenceDate: '',
            paymentMethod: '',
            status: 'ativo',
            notes: ''
          }
        ]),
        makeSheet(project2.id, [
          {
            id: 'b',
            name: 'Plantio',
            itemType: 'custo_por_safra',
            eventValueCents: 200000,
            monthlyEquivalentCents: 50000,
            recurrenceType: 'por_safra',
            intervalUnit: 'safras',
            intervalValue: 1,
            nextOccurrenceDate: '',
            lastOccurrenceDate: '',
            paymentMethod: '',
            status: 'ativo',
            notes: ''
          }
        ])
      ]
    );

    expect(portfolio.totalCostCents).toBe(500000);
    expect(portfolio.marginCents).toBe(1300000);
  });
});
