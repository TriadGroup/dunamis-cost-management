import { describe, expect, it } from 'vitest';
import { DEFAULT_APP_STATE } from '@/entities/finance/defaultData';
import { loadAppState, migrateState, resetAppState, saveAppState } from '@/shared/lib/storage';

describe('storage repository', () => {
  it('migrates partial states safely', () => {
    const migrated = migrateState({ schemaVersion: 0, categories: [], items: [] });
    expect(migrated.schemaVersion).toBe(3);
    expect(Array.isArray(migrated.investments)).toBe(true);
    expect(Array.isArray(migrated.purchases)).toBe(true);
    expect(Array.isArray(migrated.maintenance)).toBe(true);
    expect(Array.isArray(migrated.cultivationProjects)).toBe(true);
    expect(Array.isArray(migrated.cultivationCostSheets)).toBe(true);
  });

  it('maps legacy expected revenue to production sales', () => {
    const migrated = migrateState({ schemaVersion: 1, expectedRevenueCents: 123000 });
    expect(migrated.productionSalesCents).toBe(123000);
    expect(migrated.farmBuildersCents).toBe(0);
    expect(migrated.expectedRevenueCents).toBe(123000);
  });

  it('migrates legacy investment shape to current fields', () => {
    const migrated = migrateState({
      schemaVersion: 1,
      investments: [
        {
          id: 'inv-legacy',
          name: 'Legado',
          amountCents: 2500000,
          expectedMonthlyReturnCents: 200000,
          horizonMonths: 20,
          riskLevel: 'high'
        }
      ]
    });

    expect(migrated.investments[0].assetValueCents).toBe(2500000);
    expect(migrated.investments[0].termMonths).toBe(20);
    expect(migrated.investments[0].kind).toBe('financiamento');
  });

  it('saves and loads state', () => {
    resetAppState();
    saveAppState(DEFAULT_APP_STATE);
    const loaded = loadAppState();
    expect(loaded.categories.length).toBe(DEFAULT_APP_STATE.categories.length);
    expect(loaded.cultivationProjects.length).toBe(DEFAULT_APP_STATE.cultivationProjects.length);
  });
});
