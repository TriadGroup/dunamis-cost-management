import { describe, expect, it, beforeEach } from 'vitest';
import { useFinanceStore } from '@/app/store/useFinanceStore';
import { useSetupStore } from '@/app/store/useSetupStore';
import {
  buildWorkspaceBackupSnapshot,
  persistWorkspaceBackup,
  readWorkspaceBackup,
  restoreWorkspaceBackup,
  WORKSPACE_BACKUP_KEY
} from '@/app/store/workspaceBackup';

describe('workspace backup persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    useSetupStore.setState({
      status: 'landing',
      currentStep: 0,
      identity: {
        operationName: '',
        operationNickname: '',
        location: '',
        locationAddress: '',
        locationPlaceId: '',
        latitude: null,
        longitude: null,
        areaUnit: 'hectare',
        totalArea: 0,
        productiveArea: 0,
        expansionArea: 0
      },
      productionProfiles: [],
      structures: [],
      channels: [],
      initialCrops: [],
      customCrops: [],
      financialStartingPoints: ['estrutura_minima'],
      hasChosenFinancialStartingPoint: false,
      isDemo: true
    });
    useFinanceStore.setState({ costItems: [] });
  });

  it('stores a sanitized backup snapshot for the workspace', () => {
    useSetupStore.setState((state) => ({
      ...state,
      status: 'completed',
      identity: { ...state.identity, operationName: 'Dunamis Farm' }
    }));
    useFinanceStore.getState().addCostItem({ name: 'Adubo', category: 'Operação' });

    const snapshot = buildWorkspaceBackupSnapshot();
    expect(snapshot.stores.setup.identity.operationName).toBe('Dunamis Farm');
    expect(Array.isArray(snapshot.stores.finance.costItems)).toBe(true);

    persistWorkspaceBackup();
    expect(readWorkspaceBackup()?.stores.finance.costItems).toHaveLength(1);
  });

  it('restores a richer backup when current local state is emptier', () => {
    useSetupStore.setState((state) => ({
      ...state,
      status: 'completed',
      identity: { ...state.identity, operationName: 'Dunamis Farm' }
    }));
    useFinanceStore.getState().addCostItem({ name: 'Composto', category: 'Operação' });
    persistWorkspaceBackup();

    useSetupStore.setState((state) => ({
      ...state,
      status: 'landing',
      identity: { ...state.identity, operationName: '' }
    }));
    useFinanceStore.setState({ costItems: [] });

    expect(restoreWorkspaceBackup()).toBe(true);
    expect(useSetupStore.getState().identity.operationName).toBe('Dunamis Farm');
    expect(useFinanceStore.getState().costItems).toHaveLength(1);
  });

  it('keeps the current richer state when the backup is not newer', () => {
    useSetupStore.setState((state) => ({
      ...state,
      status: 'completed',
      identity: { ...state.identity, operationName: 'Dunamis Farm' }
    }));
    persistWorkspaceBackup();

    useFinanceStore.getState().addCostItem({ name: 'Novo custo', category: 'Operação' });

    expect(restoreWorkspaceBackup()).toBe(false);
    expect(useFinanceStore.getState().costItems).toHaveLength(1);
    expect(localStorage.getItem(WORKSPACE_BACKUP_KEY)).toBeTruthy();
  });
});
