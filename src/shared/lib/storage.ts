import { DEFAULT_APP_STATE } from '@/entities/finance/defaultData';
import type { AppState } from '@/entities/finance/types';

const STORAGE_KEY = 'dunamis-cost-management-v1';
const SCHEMA_VERSION = 1;

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const migrateState = (raw: unknown): AppState => {
  if (!isObject(raw)) return DEFAULT_APP_STATE;

  const version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;
  if (version > SCHEMA_VERSION) return DEFAULT_APP_STATE;

  return {
    ...DEFAULT_APP_STATE,
    ...raw,
    schemaVersion: SCHEMA_VERSION,
    categories: Array.isArray(raw.categories) ? (raw.categories as AppState['categories']) : DEFAULT_APP_STATE.categories,
    items: Array.isArray(raw.items) ? (raw.items as AppState['items']) : DEFAULT_APP_STATE.items,
    investments: Array.isArray(raw.investments)
      ? (raw.investments as AppState['investments'])
      : DEFAULT_APP_STATE.investments,
    scenarios: Array.isArray(raw.scenarios) ? (raw.scenarios as AppState['scenarios']) : DEFAULT_APP_STATE.scenarios
  };
};

export const loadAppState = (): AppState => {
  if (typeof window === 'undefined') return DEFAULT_APP_STATE;

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_APP_STATE;

  try {
    return migrateState(JSON.parse(raw));
  } catch {
    return DEFAULT_APP_STATE;
  }
};

export const saveAppState = (state: AppState): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const resetAppState = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const simpleHash = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
};
