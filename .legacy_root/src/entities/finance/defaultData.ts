import type { AppState, Category, FinancialItem, Investment } from './types';

const categories: Category[] = [
  { id: 'implementos', name: 'Implementos', categorySliderPct: 0, colorToken: 'fern' },
  { id: 'quimicos', name: 'Quimicos', categorySliderPct: 0, colorToken: 'dunamis' },
  { id: 'manutencao', name: 'Manutencao', categorySliderPct: 0, colorToken: 'fern' },
  { id: 'combustivel', name: 'Combustivel', categorySliderPct: 0, colorToken: 'dunamis' },
  { id: 'mao_obra', name: 'Mao de Obra', categorySliderPct: 0, colorToken: 'fern' },
  { id: 'logistica', name: 'Logistica', categorySliderPct: 0, colorToken: 'dunamis' },
  { id: 'outros', name: 'Outros', categorySliderPct: 0, colorToken: 'fern' }
];

const items: FinancialItem[] = [
  {
    id: 'item-trator',
    categoryId: 'implementos',
    name: 'Trator aluguel',
    type: 'cost',
    baseValueCents: 450000,
    recurrence: 'monthly',
    itemSliderPct: 0,
    notes: 'Uso principal de safra'
  },
  {
    id: 'item-pulverizador',
    categoryId: 'implementos',
    name: 'Pulverizador',
    type: 'cost',
    baseValueCents: 220000,
    recurrence: 'monthly',
    itemSliderPct: 0,
    notes: ''
  },
  {
    id: 'item-grao',
    categoryId: 'quimicos',
    name: 'Quimicos defensivos',
    type: 'cost',
    baseValueCents: 360000,
    recurrence: 'monthly',
    itemSliderPct: 0,
    notes: ''
  },
  {
    id: 'item-subs',
    categoryId: 'manutencao',
    name: 'Subsolador manutencao',
    type: 'cost',
    baseValueCents: 140000,
    recurrence: 'monthly',
    itemSliderPct: 0,
    notes: ''
  },
  {
    id: 'item-receita',
    categoryId: 'outros',
    name: 'Venda prevista local',
    type: 'revenue',
    baseValueCents: 1000000,
    recurrence: 'monthly',
    itemSliderPct: 0,
    notes: 'Entrada base'
  }
];

const investments: Investment[] = [
  {
    id: 'inv-irrigacao',
    name: 'Irrigacao inteligente',
    amountCents: 2500000,
    expectedMonthlyReturnCents: 350000,
    horizonMonths: 18,
    riskLevel: 'medium'
  }
];

export const DEFAULT_APP_STATE: AppState = {
  schemaVersion: 1,
  pinHash: null,
  categories,
  items,
  investments,
  scenarios: [
    {
      id: 'base',
      name: 'Cenario Base',
      monthRef: new Date().toISOString().slice(0, 7),
      overrides: {},
      createdAt: new Date().toISOString()
    }
  ],
  expectedRevenueCents: 0,
  cashReserveCents: 530000
};
