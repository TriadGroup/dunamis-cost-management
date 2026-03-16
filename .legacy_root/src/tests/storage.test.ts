import { describe, expect, it } from 'vitest';
import { DEFAULT_APP_STATE } from '@/entities/finance/defaultData';
import { loadAppState, migrateState, resetAppState, saveAppState } from '@/shared/lib/storage';

describe('storage repository', () => {
  it('migrates partial states safely', () => {
    const migrated = migrateState({ schemaVersion: 0, categories: [], items: [] });
    expect(migrated.schemaVersion).toBe(1);
    expect(Array.isArray(migrated.investments)).toBe(true);
  });

  it('saves and loads state', () => {
    resetAppState();
    saveAppState(DEFAULT_APP_STATE);
    const loaded = loadAppState();
    expect(loaded.categories.length).toBe(DEFAULT_APP_STATE.categories.length);
  });
});
