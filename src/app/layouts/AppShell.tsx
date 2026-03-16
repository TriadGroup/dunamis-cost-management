import { Suspense, useMemo } from 'react';
import clsx from 'clsx';
import { buildVisibleRoutes, findGroupByRoute, findRouteById, navGroups, type NavGroupId } from '@/app/router/routes';
import { useDemandChannelsStore } from '@/app/store/useDemandChannelsStore';
import { useFinanceStore } from '@/app/store/useFinanceStore';
import { useInvestmentsStore } from '@/app/store/useInvestmentsStore';
import { useMaintenanceStore } from '@/app/store/useMaintenanceStore';
import { useProductionPlanningStore } from '@/app/store/useProductionPlanningStore';
import { useTraceabilityStore } from '@/app/store/useTraceabilityStore';
import { useSyncQueueStore } from '@/app/store/useSyncQueueStore';
import { useUiPreferencesStore } from '@/app/store/useUiPreferencesStore';
import { useOnboardingStore } from '@/app/store/useOnboardingStore';
import { useSetupStore } from '@/app/store/useSetupStore';
import { WeatherPanel } from '@/features/dashboard/components/WeatherPanel';
import { ExportWorkbookButton } from '@/features/export';
import { BrandLogo, UiIcon } from '@/shared/ui';

const setupSignals = (values: boolean[]) => values.filter(Boolean).length;

export const AppShell = () => {
  const activeRouteId = useUiPreferencesStore((state) => state.activeRouteId);
  const setActiveRoute = useUiPreferencesStore((state) => state.setActiveRoute);
  const executiveMode = useUiPreferencesStore((state) => state.executiveMode);
  const setExecutiveMode = useUiPreferencesStore((state) => state.setExecutiveMode);
  const navCollapsed = useUiPreferencesStore((state) => state.navCollapsed);
  const toggleNavCollapsed = useUiPreferencesStore((state) => state.toggleNavCollapsed);
  const lock = useUiPreferencesStore((state) => state.lock);
  const status = useSyncQueueStore((state) => state.status);
  const setupIdentity = useSetupStore((state) => state.identity);
  const productionProfiles = useSetupStore((state) => state.productionProfiles);
  const selectedChannels = useSetupStore((state) => state.channels);
  const financialStartingPoints = useSetupStore((state) => state.financialStartingPoints);
  const initialCrops = useSetupStore((state) => state.initialCrops);
  const structures = useSetupStore((state) => state.structures);
  const costItems = useFinanceStore((state) => state.costItems);
  const maintenance = useMaintenanceStore((state) => state.events);
  const investments = useInvestmentsStore((state) => state.contracts);
  const cropPlans = useProductionPlanningStore((state) => state.plans);
  const lots = useTraceabilityStore((state) => state.lots);
  const demandChannels = useDemandChannelsStore((state) => state.channels);
  const setIsDemo = useSetupStore((state) => state.setIsDemo);
  const isDemo = useSetupStore((state) => state.isDemo);

  const visibleRoutes = buildVisibleRoutes({
    productionProfiles,
    selectedChannels,
    financialStartingPoints,
    hasMaintenanceData: maintenance.length > 0,
    hasInvestmentData: investments.length > 0,
    hasUnitEconomicsData: cropPlans.length > 0 && demandChannels.length > 0 && costItems.length > 0,
    hasTraceabilityData: lots.length > 0
  });

  const handleToggleDemo = () => {
    if (isDemo) {
      const confirmMsg = "Deseja sair do MODO TESTE e começar a SALVAR no Supabase? (Os dados atuais de demonstração continuarão visíveis até que você resete o workspace)";
      if (window.confirm(confirmMsg)) {
        setIsDemo(false);
      }
    } else {
      const confirmMsg = "Ativar MODO TESTE? Suas alterações NÃO serão salvas no banco de dados enquanto este modo estiver ativo.";
      if (window.confirm(confirmMsg)) {
        setIsDemo(true);
      }
    }
  };

  const route = useMemo(() => {
    return visibleRoutes.find((entry) => entry.id === activeRouteId) ?? 
           findRouteById(activeRouteId) ?? 
           visibleRoutes[0] ?? 
           findRouteById('dashboard');
  }, [visibleRoutes, activeRouteId]);

  const activeGroupId = findGroupByRoute(route.id);
  const activeGroup = navGroups.find((group) => group.id === activeGroupId) ?? navGroups[0];
  const groupRoutes = visibleRoutes.filter((entry) => entry.group === activeGroupId);
  const ActiveComponent = route.component || (() => <div className="detail-card">Modulo nao carregado</div>);

  const setupPct = useMemo(() => {
    const count = setupSignals([
      setupIdentity.operationName.trim().length > 0,
      productionProfiles.length > 0,
      structures.length > 0,
      selectedChannels.length > 0,
      initialCrops.length > 0,
      financialStartingPoints.length > 0
    ]);
    return Math.round((count / 6) * 100);
  }, [financialStartingPoints.length, initialCrops.length, productionProfiles.length, selectedChannels.length, setupIdentity.operationName, structures.length]);

  const handleGroupChange = (groupId: NavGroupId) => {
    const nextRoute = visibleRoutes.find((entry) => entry.group === groupId);
    if (nextRoute) setActiveRoute(nextRoute.id);
  };

  return (
    <main className={clsx('app-shell-v2', navCollapsed && 'is-nav-collapsed', executiveMode ? 'is-executive-mode' : 'is-operational-mode')}>
      <aside className="app-rail" data-tour="app-rail">
        <button type="button" className="brand-mark" onClick={() => setActiveRoute('dashboard')} aria-label="Voltar para inicio" title="Dunamis Farm Agro">
          <BrandLogo variant="mini" />
        </button>

        <nav className="rail-nav" aria-label="Grupos principais">
          {navGroups.map((group) => {
            const active = group.id === activeGroupId;
            const hasRoutes = visibleRoutes.some((entry) => entry.group === group.id);
            return (
              <button
                key={group.id}
                type="button"
                className={clsx('rail-link', active && 'is-active', !hasRoutes && 'is-disabled')}
                onClick={() => handleGroupChange(group.id)}
                title={group.label}
                aria-label={group.label}
                disabled={!hasRoutes}
              >
                <UiIcon name={group.icon} className="rail-link-icon" />
                <span>{group.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="rail-footer">
          <button type="button" className="rail-link" onClick={toggleNavCollapsed} title={navCollapsed ? 'Expandir navegacao' : 'Recolher navegacao'}>
            <UiIcon name="panel" className="rail-link-icon" />
            <span>{navCollapsed ? 'Abrir' : 'Fechar'}</span>
          </button>
          <button type="button" className="rail-link" onClick={lock} title="Bloquear painel">
            <UiIcon name="gear" className="rail-link-icon" />
            <span>Bloquear</span>
          </button>
        </div>
      </aside>

      <aside className="app-sidebar-panel">
        <div className="sidebar-panel-head">
          <BrandLogo variant="inline" />
          <h1>{setupIdentity.operationNickname || setupIdentity.operationName || 'Sua operacao'}</h1>
          <p>{setupIdentity.location || 'Painel simples, visual e direto.'}</p>
        </div>

        <div className="sidebar-panel-group" data-tour="sidebar-panel-group">
          <div className="sidebar-panel-group-head">
            <span className="sidebar-panel-label">{activeGroup.label}</span>
            <span className="sidebar-panel-count">{groupRoutes.length}</span>
          </div>
          <nav className="sidebar-route-list" aria-label={`Rotas de ${activeGroup.label}`}>
            {groupRoutes.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={entry.id === route.id ? 'sidebar-route-link is-active' : 'sidebar-route-link'}
                onClick={() => setActiveRoute(entry.id)}
              >
                <span className={clsx('sidebar-route-icon', `accent-${entry.accent}`)}>
                  <UiIcon name={entry.icon} className="sidebar-route-icon-svg" />
                </span>
                <span className="sidebar-route-copy">
                  <strong>{entry.label}</strong>
                  <small>{entry.subtitle}</small>
                </span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidebar-panel-summary" data-tour="sidebar-summary">
          <div className="sidebar-summary-card">
            <span className="sidebar-panel-label">Base</span>
            <strong>{setupPct}%</strong>
            <p>{setupPct >= 80 ? 'Pronta para operar' : 'Ainda montando a estrutura'}</p>
          </div>
          <div className="sidebar-summary-card">
            <span className="sidebar-panel-label">Sync</span>
            <strong>{status === 'saved' ? 'OK' : status === 'pending' ? 'Pendente' : status === 'error' ? 'Erro' : 'Offline'}</strong>
            <p>
              {status === 'saved' ? 'Dados em nuvem' : 
               status === 'pending' ? 'Sincronizando...' : 
               status === 'error' ? 'Falha no envio' : 'Modo offline'}
            </p>
          </div>
        </div>
      </aside>

      <section className="app-main-v2">
        {isDemo && (
          <div className="demo-mode-banner">
            <UiIcon name="warning" width={16} height={16} />
            <span><strong>Modo Teste Ativo</strong> - Suas alterações NÃO estão sendo salvas no Supabase.</span>
            <button type="button" onClick={handleToggleDemo}>Ativar Produção</button>
          </div>
        )}
        <header className="page-topbar">
          <div className="page-topbar-main">
            <span className={clsx('page-badge', `accent-${route.accent}`)}>{activeGroup.label}</span>
            <div>
              <h2>{route.label}</h2>
              <p>{route.subtitle}</p>
            </div>
          </div>

          <div className="page-topbar-actions" data-tour="topbar-actions">
            <ExportWorkbookButton />

            <button
              type="button"
              className="ghost-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px' }}
              onClick={() => {
                const tourId = activeRouteId === 'dashboard' ? 'global' : activeRouteId;
                useOnboardingStore.getState().startTour(tourId);
              }}
            >
              <UiIcon name="magic" width={16} height={16} />
              <span>Como usar</span>
            </button>

            <div className="mode-switch" role="group" aria-label="Modo de leitura" data-tour="mode-switch">
              <button
                type="button"
                className={executiveMode ? 'mode-pill is-active' : 'mode-pill'}
                onClick={() => setExecutiveMode(true)}
              >
                Executivo
              </button>
              <button
                type="button"
                className={!executiveMode ? 'mode-pill is-active' : 'mode-pill'}
                onClick={() => setExecutiveMode(false)}
              >
                Operacional
              </button>
            </div>

            <WeatherPanel variant="topbar" />

            <span className={clsx('sync-pill', status)}>
              <span className={`sync-dot ${status}`} />
              {status === 'saved' ? 'Salvo' : 
               status === 'pending' ? 'Salvando...' : 
               status === 'error' ? 'Erro ao salvar' : 'Offline'}
            </span>
          </div>
        </header>

        <div className="mobile-shell-context">
          <div className="mobile-shell-head">
            <BrandLogo variant="inline" />
            <div className="mobile-shell-copy">
              <strong>{setupIdentity.operationNickname || setupIdentity.operationName || 'Sua operacao'}</strong>
              <small>{setupIdentity.location || 'Painel simples, visual e direto.'}</small>
            </div>
          </div>

          <nav className="mobile-route-strip" aria-label={`Rotas de ${activeGroup.label}`}>
            {groupRoutes.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={entry.id === route.id ? 'mobile-route-tab is-active' : 'mobile-route-tab'}
                onClick={() => setActiveRoute(entry.id)}
              >
                <span className={clsx('mobile-route-icon', `accent-${entry.accent}`)}>
                  <UiIcon name={entry.icon} className="mobile-route-icon-svg" />
                </span>
                <span className="mobile-route-copy">
                  <strong>{entry.label}</strong>
                  <small>{entry.subtitle}</small>
                </span>
              </button>
            ))}
          </nav>
        </div>

        <section className={clsx(route.id === 'dashboard' ? 'app-content dashboard-mode' : 'app-content', executiveMode ? 'view-executive' : 'view-operational')}>
          <Suspense fallback={<div className="detail-card">Carregando...</div>}>
            <ActiveComponent />
          </Suspense>
        </section>
      </section>
    </main>
  );
};
