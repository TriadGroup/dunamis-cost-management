import { lazy } from 'react';

export const LazyDashboardModule = lazy(() => import('@/features/dashboard/DashboardModule').then((module) => ({ default: module.DashboardModule })));
export const LazyImplantationModule = lazy(() => import('@/features/implantation/ImplantationModule').then((module) => ({ default: module.ImplantationModule })));
export const LazyCostsModule = lazy(() => import('@/features/costs/CostsModule').then((module) => ({ default: module.CostsModule })));
export const LazyPurchasesModule = lazy(() => import('@/features/purchases/PurchasesModule').then((module) => ({ default: module.PurchasesModule })));
export const LazyInventoryModule = lazy(() => import('@/features/inventory/InventoryModule').then((module) => ({ default: module.InventoryModule })));
export const LazyFieldOperationsModule = lazy(() => import('@/features/field-operations/FieldOperationsModule').then((module) => ({ default: module.FieldOperationsModule })));
export const LazyHarvestModule = lazy(() => import('@/features/harvest/HarvestModule').then((module) => ({ default: module.HarvestModule })));
export const LazyRealCostsModule = lazy(() => import('@/features/real-costs/RealCostsModule').then((module) => ({ default: module.RealCostsModule })));
export const LazyProductionPlanningModule = lazy(() => import('@/features/production-planning/ProductionPlanningModule').then((module) => ({ default: module.ProductionPlanningModule })));
export const LazyDemandChannelsModule = lazy(() => import('@/features/demand-channels/DemandChannelsModule').then((module) => ({ default: module.DemandChannelsModule })));
export const LazyUnitEconomicsModule = lazy(() => import('@/features/unit-economics/UnitEconomicsModule').then((module) => ({ default: module.UnitEconomicsModule })));
export const LazyMaintenanceModule = lazy(() => import('@/features/maintenance/MaintenanceModule').then((module) => ({ default: module.MaintenanceModule })));
export const LazyInvestmentsModule = lazy(() => import('@/features/investments/InvestmentsModule').then((module) => ({ default: module.InvestmentsModule })));
export const LazyTraceabilityModule = lazy(() => import('@/features/traceability/TraceabilityModule').then((module) => ({ default: module.TraceabilityModule })));
export const LazyAgronomicCalendarModule = lazy(() => import('@/features/agronomic-calendar/AgronomicCalendarModule').then((module) => ({ default: module.AgronomicCalendarModule })));
export const LazyScenariosModule = lazy(() => import('@/features/scenarios/ScenariosModule').then((module) => ({ default: module.ScenariosModule })));
export const LazySettingsModule = lazy(() => import('@/features/settings/SettingsModule').then((module) => ({ default: module.SettingsModule })));
