import { saveAs } from 'file-saver';
import {
  useAgronomicCalendarStore,
  useCostAllocationStore,
  useDemandChannelsStore,
  useEquipmentUsageStore,
  useFieldOperationsStore,
  useFinanceStore,
  useImplantationStore,
  useInventoryStore,
  useInvestmentsStore,
  useLaborStore,
  useMaintenanceStore,
  useProductionPlanningStore,
  usePurchasesStore,
  useScenariosStore,
  useSetupStore,
  useTraceabilityStore
} from '@/app/store';
import { buildFarmSnapshotFromState } from '@/features/dashboard/model/buildFarmSnapshot';
import { buildFarmWorkbook } from '@/features/export/builders/WorkbookBuilders';
import type { FarmExportSnapshot } from '@/features/export/types';

const pad = (value: number) => value.toString().padStart(2, '0');

export const buildFarmExportFileName = (date = new Date()) =>
  `dunamis-farm-os-export-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.xlsx`;

export const buildFarmExportSnapshot = (): FarmExportSnapshot => {
  const setupState = useSetupStore.getState();
  const implantationState = useImplantationStore.getState();
  const financeState = useFinanceStore.getState();
  const purchasesState = usePurchasesStore.getState();
  const inventoryState = useInventoryStore.getState();
  const fieldOperationsState = useFieldOperationsStore.getState();
  const laborState = useLaborStore.getState();
  const equipmentState = useEquipmentUsageStore.getState();
  const demandState = useDemandChannelsStore.getState();
  const productionState = useProductionPlanningStore.getState();
  const maintenanceState = useMaintenanceStore.getState();
  const investmentsState = useInvestmentsStore.getState();
  const traceabilityState = useTraceabilityStore.getState();
  const scenariosState = useScenariosStore.getState();
  const calendarState = useAgronomicCalendarStore.getState();
  const allocationState = useCostAllocationStore.getState();

  const snapshot = buildFarmSnapshotFromState({
    costs: financeState.costItems,
    purchases: purchasesState.purchases,
    maintenance: maintenanceState.events,
    investments: investmentsState.contracts,
    implantationProjects: implantationState.projects,
    implantationItems: implantationState.items,
    channels: demandState.channels,
    crops: productionState.crops,
    beds: productionState.beds,
    plans: productionState.plans,
    lots: traceabilityState.lots,
    inventoryProducts: inventoryState.products,
    inventoryLots: inventoryState.lots,
    stockMovements: inventoryState.movements,
    applications: fieldOperationsState.applications,
    losses: fieldOperationsState.losses,
    labor: laborState.records,
    equipmentUsage: equipmentState.records,
    persistedLedger: allocationState.ledger
  });

  return {
    generatedAt: new Date().toISOString(),
    setup: {
      status: setupState.status,
      currentStep: setupState.currentStep,
      identity: setupState.identity,
      productionProfiles: setupState.productionProfiles,
      structures: setupState.structures,
      channels: setupState.channels,
      initialCrops: setupState.initialCrops,
      customCrops: setupState.customCrops,
      financialStartingPoints: setupState.financialStartingPoints,
      hasChosenFinancialStartingPoint: setupState.hasChosenFinancialStartingPoint,
      areaUnit: setupState.identity.areaUnit
    },
    scenarios: {
      demandScenarios: demandState.scenarios,
      activeDemandScenarioId: demandState.activeScenarioId,
      cashScenarios: scenariosState.scenarios,
      baselineScenarioId: scenariosState.baselineScenarioId,
      compareScenarioId: scenariosState.compareScenarioId
    },
    calendar: {
      guidelines: calendarState.guidelines,
      photoperiod: calendarState.photoperiod
    },
    snapshot
  };
};

export const exportFarmWorkbook = async (): Promise<void> => {
  const exportSnapshot = buildFarmExportSnapshot();
  const workbook = await buildFarmWorkbook(exportSnapshot);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  saveAs(blob, buildFarmExportFileName(new Date(exportSnapshot.generatedAt)));
};
