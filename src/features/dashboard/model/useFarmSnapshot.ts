import { useMemo } from 'react';
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
import { useProductionPlanningStore } from '@/app/store/useProductionPlanningStore';
import { usePurchasesStore } from '@/app/store/usePurchasesStore';
import { useTraceabilityStore } from '@/app/store/useTraceabilityStore';
import {
  buildFarmSnapshotFromState,
  type FarmSnapshot,
  type FarmSnapshotInput,
  type OperationChecklistItem,
  type OperationStage
} from '@/features/dashboard/model/buildFarmSnapshot';

export const useFarmSnapshot = () => {
  const costs = useFinanceStore((state) => state.costItems);
  const purchases = usePurchasesStore((state) => state.purchases);
  const maintenance = useMaintenanceStore((state) => state.events);
  const investments = useInvestmentsStore((state) => state.contracts);
  const implantationProjects = useImplantationStore((state) => state.projects);
  const implantationItems = useImplantationStore((state) => state.items);
  const channels = useDemandChannelsStore((state) => state.channels);
  const crops = useProductionPlanningStore((state) => state.crops);
  const beds = useProductionPlanningStore((state) => state.beds);
  const plans = useProductionPlanningStore((state) => state.plans);
  const lots = useTraceabilityStore((state) => state.lots);
  const inventoryProducts = useInventoryStore((state) => state.products);
  const inventoryLots = useInventoryStore((state) => state.lots);
  const stockMovements = useInventoryStore((state) => state.movements);
  const applications = useFieldOperationsStore((state) => state.applications);
  const losses = useFieldOperationsStore((state) => state.losses);
  const labor = useLaborStore((state) => state.records);
  const equipmentUsage = useEquipmentUsageStore((state) => state.records);
  const persistedLedger = useCostAllocationStore((state) => state.ledger);

  const snapshotInput: FarmSnapshotInput = {
    costs,
    purchases,
    maintenance,
    investments,
    implantationProjects,
    implantationItems,
    channels,
    crops,
    beds,
    plans,
    lots,
    inventoryProducts,
    inventoryLots,
    stockMovements,
    applications,
    losses,
    labor,
    equipmentUsage,
    persistedLedger
  };

  return useMemo<FarmSnapshot>(() => buildFarmSnapshotFromState(snapshotInput), [
    applications,
    beds,
    channels,
    costs,
    crops,
    equipmentUsage,
    implantationItems,
    implantationProjects,
    inventoryLots,
    inventoryProducts,
    investments,
    labor,
    losses,
    lots,
    maintenance,
    persistedLedger,
    plans,
    purchases,
    stockMovements
  ]);
};

export type { FarmSnapshot, OperationChecklistItem, OperationStage };
