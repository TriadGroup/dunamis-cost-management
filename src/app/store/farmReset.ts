import { resetWorkspaceToEmpty } from '@/app/store/setupWorkspace';
import { useSetupStore } from '@/app/store/useSetupStore';
import { useUiPreferencesStore } from '@/app/store/useUiPreferencesStore';
import { WORKSPACE_BACKUP_KEY } from '@/app/store/workspaceBackup';

const RESET_KEYS = [
  'dunamis-farm-os-setup-v1',
  'dunamis-farm-os-production-planning-v3',
  'dunamis-farm-agro-finance-v3',
  'dunamis-farm-agro-purchases-v3',
  'dunamis-farm-agro-inventory-v1',
  'dunamis-farm-agro-field-operations-v1',
  'dunamis-farm-agro-labor-v1',
  'dunamis-farm-agro-equipment-usage-v1',
  'dunamis-farm-agro-cost-allocation-v1',
  'dunamis-farm-os-demand-channels-v2',
  'dunamis-farm-os-scenarios-v2',
  'dunamis-farm-os-maintenance-v2',
  'dunamis-farm-os-investments-v2',
  'dunamis-farm-os-implantation-v2',
  'dunamis-farm-agro-traceability-v3',
  'dunamis-farm-os-agronomic-calendar-v2',
  WORKSPACE_BACKUP_KEY
] as const;

export const restartIntroTutorial = () => {
  useSetupStore.setState((state) => ({
    ...state,
    status: 'in_progress',
    currentStep: 0
  }));
  useUiPreferencesStore.getState().setActiveRoute('dashboard');
};

export const resetFarmDataAndRestart = () => {
  resetWorkspaceToEmpty();
  useSetupStore.getState().resetSetup();
  useUiPreferencesStore.getState().setActiveRoute('dashboard');

  if (typeof window !== 'undefined') {
    RESET_KEYS.forEach((key) => window.localStorage.removeItem(key));
    window.location.reload();
  }
};
