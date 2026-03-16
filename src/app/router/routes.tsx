import type { LazyExoticComponent, ComponentType } from 'react';
import type { FinancialStartingPoint, ProductionProfileOption } from '@/app/store/useSetupStore';
import type { IconName } from '@/shared/ui/Icons';
import {
  LazyAgronomicCalendarModule,
  LazyCostsModule,
  LazyDashboardModule,
  LazyDemandChannelsModule,
  LazyFieldOperationsModule,
  LazyHarvestModule,
  LazyImplantationModule,
  LazyInventoryModule,
  LazyInvestmentsModule,
  LazyMaintenanceModule,
  LazyProductionPlanningModule,
  LazyPurchasesModule,
  LazyRealCostsModule,
  LazyScenariosModule,
  LazySettingsModule,
  LazyTraceabilityModule,
  LazyUnitEconomicsModule
} from '@/app/router/lazyModules';

export type NavGroupId = 'home' | 'setup' | 'operate' | 'track' | 'advanced';

export interface AppRoute {
  id: string;
  label: string;
  subtitle: string;
  section: 'core' | 'operations' | 'intelligence';
  group: NavGroupId;
  icon: IconName;
  accent: 'home' | 'setup' | 'ops' | 'track' | 'advanced';
  component: LazyExoticComponent<ComponentType>;
}

export interface NavGroup {
  id: NavGroupId;
  label: string;
  icon: IconName;
}

export const navGroups: NavGroup[] = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'setup', label: 'Base', icon: 'magic' },
  { id: 'operate', label: 'Operar', icon: 'seed' },
  { id: 'track', label: 'Acompanhar', icon: 'trace' },
  { id: 'advanced', label: 'Resultados', icon: 'target' }
];

export const appRoutes: AppRoute[] = [
  {
    id: 'dashboard',
    label: 'Inicio',
    subtitle: 'Agora',
    section: 'core',
    group: 'home',
    icon: 'home',
    accent: 'home',
    component: LazyDashboardModule
  },
  {
    id: 'implantation',
    label: 'Implantacao',
    subtitle: 'Comecar',
    section: 'core',
    group: 'setup',
    icon: 'magic',
    accent: 'setup',
    component: LazyImplantationModule
  },
  {
    id: 'costs',
    label: 'Custos',
    subtitle: 'Rotina',
    section: 'operations',
    group: 'operate',
    icon: 'cost',
    accent: 'ops',
    component: LazyCostsModule
  },
  {
    id: 'purchases',
    label: 'Compras',
    subtitle: 'Insumos',
    section: 'operations',
    group: 'operate',
    icon: 'wallet',
    accent: 'ops',
    component: LazyPurchasesModule
  },
  {
    id: 'inventory',
    label: 'Insumos',
    subtitle: 'O que entrou',
    section: 'operations',
    group: 'operate',
    icon: 'panel',
    accent: 'ops',
    component: LazyInventoryModule
  },
  {
    id: 'field-operations',
    label: 'Aplicacoes',
    subtitle: 'No campo',
    section: 'operations',
    group: 'operate',
    icon: 'flow',
    accent: 'ops',
    component: LazyFieldOperationsModule
  },
  {
    id: 'harvest',
    label: 'Colheitas',
    subtitle: 'O que saiu',
    section: 'operations',
    group: 'operate',
    icon: 'list',
    accent: 'ops',
    component: LazyHarvestModule
  },
  {
    id: 'production-planning',
    label: 'Plantio',
    subtitle: 'O que plantar',
    section: 'operations',
    group: 'operate',
    icon: 'seed',
    accent: 'ops',
    component: LazyProductionPlanningModule
  },
  {
    id: 'demand-channels',
    label: 'Vendas',
    subtitle: 'Para onde vai',
    section: 'operations',
    group: 'operate',
    icon: 'flow',
    accent: 'ops',
    component: LazyDemandChannelsModule
  },
  {
    id: 'real-costs',
    label: 'Conta real',
    subtitle: 'Quanto rendeu',
    section: 'operations',
    group: 'track',
    icon: 'revenue',
    accent: 'track',
    component: LazyRealCostsModule
  },
  {
    id: 'maintenance',
    label: 'Maquinas',
    subtitle: 'Uso e parada',
    section: 'operations',
    group: 'track',
    icon: 'tractor',
    accent: 'track',
    component: LazyMaintenanceModule
  },
  {
    id: 'investments',
    label: 'Maquinário',
    subtitle: 'Parcelas',
    section: 'operations',
    group: 'track',
    icon: 'investment',
    accent: 'track',
    component: LazyInvestmentsModule
  },
  {
    id: 'traceability',
    label: 'Lotes',
    subtitle: 'Por onde passou',
    section: 'operations',
    group: 'track',
    icon: 'trace',
    accent: 'track',
    component: LazyTraceabilityModule
  },
  {
    id: 'agronomic-calendar',
    label: 'Calendario',
    subtitle: 'Janelas',
    section: 'intelligence',
    group: 'track',
    icon: 'calendar',
    accent: 'track',
    component: LazyAgronomicCalendarModule
  },
  {
    id: 'scenarios',
    label: 'Simular',
    subtitle: 'Se mudar',
    section: 'intelligence',
    group: 'advanced',
    icon: 'target',
    accent: 'advanced',
    component: LazyScenariosModule
  },
  {
    id: 'unit-economics',
    label: 'Tabela de preços',
    subtitle: 'Quanto cobrar',
    section: 'intelligence',
    group: 'advanced',
    icon: 'revenue',
    accent: 'advanced',
    component: LazyUnitEconomicsModule
  },
  {
    id: 'settings',
    label: 'Ajustes',
    subtitle: 'Sistema',
    section: 'intelligence',
    group: 'setup',
    icon: 'gear',
    accent: 'setup',
    component: LazySettingsModule
  }
];

export const findRouteById = (id: string): AppRoute => {
  return appRoutes.find((route) => route.id === id) ?? appRoutes[0];
};

export const findGroupByRoute = (routeId: string): NavGroupId => {
  return findRouteById(routeId).group;
};

interface RouteContext {
  productionProfiles: ProductionProfileOption[];
  selectedChannels: string[];
  financialStartingPoints: FinancialStartingPoint[];
  hasMaintenanceData: boolean;
  hasInvestmentData: boolean;
  hasUnitEconomicsData: boolean;
  hasTraceabilityData: boolean;
}

export const buildVisibleRoutes = (context: RouteContext): AppRoute[] => {
  const isHortaFocus =
    context.productionProfiles.includes('horta') ||
    context.productionProfiles.includes('cultivo_protegido') ||
    context.productionProfiles.includes('viveiro');

  const routeMap = new Map(appRoutes.map((route) => [route.id, route]));
  const order = [
    'dashboard',
    ...(context.financialStartingPoints.includes('implantacao') ? ['implantation'] : []),
    'production-planning',
    ...(context.selectedChannels.length > 0 ? ['demand-channels'] : []),
    ...(context.financialStartingPoints.includes('custos_recorrentes')
      ? ['costs', 'purchases', 'inventory', 'field-operations', 'harvest']
      : ['purchases', 'inventory', 'field-operations', 'harvest']),
    'real-costs',
    ...(context.hasTraceabilityData || isHortaFocus ? ['traceability'] : []),
    ...(context.financialStartingPoints.includes('ativos_equipamentos') || context.hasMaintenanceData ? ['maintenance'] : []),
    ...(context.financialStartingPoints.includes('investimentos_financiamentos') || context.hasInvestmentData ? ['investments'] : []),
    ...(context.productionProfiles.length > 0 ? ['agronomic-calendar'] : []),
    ...(context.selectedChannels.length > 1 ? ['scenarios'] : []),
    'unit-economics',
    'settings'
  ];

  const uniqueIds = [...new Set(order)];
  const routes = uniqueIds
    .map((id) => routeMap.get(id))
    .filter((route): route is AppRoute => Boolean(route))
    .map((route) => {
      if (route.id !== 'production-planning') return route;
      return {
        ...route,
        label: isHortaFocus ? 'Canteiros' : 'Producao',
        subtitle: isHortaFocus ? 'Escala' : 'Safra'
      };
    });

  return routes;
};
