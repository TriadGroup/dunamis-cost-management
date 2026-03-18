import { useAgronomicCalendarStore } from '@/app/store/useAgronomicCalendarStore';
import { useCostAllocationStore } from '@/app/store/useCostAllocationStore';
import { useDemandChannelsStore } from '@/app/store/useDemandChannelsStore';
import { useEquipmentUsageStore } from '@/app/store/useEquipmentUsageStore';
import { useFieldOperationsStore } from '@/app/store/useFieldOperationsStore';
import { useFinanceStore } from '@/app/store/useFinanceStore';
import { useImplantationStore } from '@/app/store/useImplantationStore';
import { useInventoryStore } from '@/app/store/useInventoryStore';
import { useInvestmentsStore } from '@/app/store/useInvestmentsStore';
import { useLaborStore } from '@/app/store/useLaborStore';
import { useMaintenanceStore } from '@/app/store/useMaintenanceStore';
import { useOptionCatalogStore } from '@/app/store/useOptionCatalogStore';
import { useProductionPlanningStore } from '@/app/store/useProductionPlanningStore';
import { usePurchasesStore } from '@/app/store/usePurchasesStore';
import { useScenariosStore } from '@/app/store/useScenariosStore';
import { useSetupStore } from '@/app/store/useSetupStore';
import { useTraceabilityStore } from '@/app/store/useTraceabilityStore';

export const WORKSPACE_BACKUP_KEY = 'dunamis-farm-os-workspace-backup-v1';
const WORKSPACE_BACKUP_VERSION = 1;
let hasEnsuredWorkspaceBackupRestore = false;

type GenericStore = {
  getState: () => any;
  setState: (partial: any) => void;
  subscribe: (listener: () => void) => () => void;
};

type WorkspaceStoreName =
  | 'setup'
  | 'productionPlanning'
  | 'finance'
  | 'purchases'
  | 'inventory'
  | 'fieldOperations'
  | 'labor'
  | 'equipmentUsage'
  | 'costAllocation'
  | 'demandChannels'
  | 'scenarios'
  | 'maintenance'
  | 'investments'
  | 'implantation'
  | 'traceability'
  | 'agronomicCalendar'
  | 'optionCatalog';

export interface WorkspaceBackupSnapshot {
  version: number;
  savedAt: string;
  stores: Record<WorkspaceStoreName, any>;
}

const workspaceStores: Record<WorkspaceStoreName, GenericStore> = {
  setup: useSetupStore,
  productionPlanning: useProductionPlanningStore,
  finance: useFinanceStore,
  purchases: usePurchasesStore,
  inventory: useInventoryStore,
  fieldOperations: useFieldOperationsStore,
  labor: useLaborStore,
  equipmentUsage: useEquipmentUsageStore,
  costAllocation: useCostAllocationStore,
  demandChannels: useDemandChannelsStore,
  scenarios: useScenariosStore,
  maintenance: useMaintenanceStore,
  investments: useInvestmentsStore,
  implantation: useImplantationStore,
  traceability: useTraceabilityStore,
  agronomicCalendar: useAgronomicCalendarStore,
  optionCatalog: useOptionCatalogStore
};

const sanitizeState = <T>(value: T): T =>
  JSON.parse(
    JSON.stringify(value, (_key, innerValue) => (typeof innerValue === 'function' ? undefined : innerValue))
  ) as T;

const buildSerializableStores = (): WorkspaceBackupSnapshot['stores'] =>
  Object.fromEntries(
    Object.entries(workspaceStores).map(([name, store]) => [name, sanitizeState(store.getState())])
  ) as WorkspaceBackupSnapshot['stores'];

const measureStoreState = (storeState: unknown): number => JSON.stringify(storeState).length;

const isValidBackupSnapshot = (value: unknown): value is WorkspaceBackupSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<WorkspaceBackupSnapshot>;
  return (
    snapshot.version === WORKSPACE_BACKUP_VERSION &&
    typeof snapshot.savedAt === 'string' &&
    snapshot.stores !== undefined &&
    typeof snapshot.stores === 'object'
  );
};

export const buildWorkspaceBackupSnapshot = (): WorkspaceBackupSnapshot => ({
  version: WORKSPACE_BACKUP_VERSION,
  savedAt: new Date().toISOString(),
  stores: buildSerializableStores()
});

export const persistWorkspaceBackup = (): WorkspaceBackupSnapshot | null => {
  if (typeof window === 'undefined') return null;

  const snapshot = buildWorkspaceBackupSnapshot();
  window.localStorage.setItem(WORKSPACE_BACKUP_KEY, JSON.stringify(snapshot));
  return snapshot;
};

export const readWorkspaceBackup = (): WorkspaceBackupSnapshot | null => {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(WORKSPACE_BACKUP_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isValidBackupSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const restoreWorkspaceBackup = (): boolean => {
  const backup = readWorkspaceBackup();
  if (!backup) return false;

  const currentStores = buildSerializableStores();
  let restoredAnyStore = false;
  (Object.entries(workspaceStores) as Array<[WorkspaceStoreName, GenericStore]>).forEach(([name, store]) => {
    const nextState = backup.stores[name];
    if (!nextState) {
      return;
    }

    const backupWeight = measureStoreState(nextState);
    const currentWeight = measureStoreState(currentStores[name]);
    if (backupWeight > currentWeight) {
      store.setState(nextState);
      restoredAnyStore = true;
    }
  });

  if (restoredAnyStore) {
    persistWorkspaceBackup();
  }

  return restoredAnyStore;
};

export const ensureWorkspaceBackupRestored = (): boolean => {
  if (hasEnsuredWorkspaceBackupRestore) {
    return false;
  }

  hasEnsuredWorkspaceBackupRestore = true;
  return restoreWorkspaceBackup();
};

export const subscribeWorkspaceBackup = (): (() => void) => {
  if (typeof window === 'undefined') return () => undefined;

  let timeoutId: number | null = null;

  const schedulePersist = () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      persistWorkspaceBackup();
      timeoutId = null;
    }, 180);
  };

  const unsubscribers = Object.values(workspaceStores).map((store) => store.subscribe(schedulePersist));
  schedulePersist();

  return () => {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};
