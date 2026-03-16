import { useEffect } from 'react';
import { PinGate } from '@/features/auth/PinGate';
import { AppShell } from '@/app/layouts/AppShell';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { StoreProvider } from '@/app/providers/StoreProvider';
import { SyncStatusProvider } from '@/app/providers/SyncStatusProvider';
import { OnboardingProvider } from '@/app/providers/OnboardingProvider';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useSetupStore } from '@/app/store/useSetupStore';
import { SetupExperience } from '@/features/setup/SetupExperience';

export const App = () => {
  const { session, initialize, isLoading } = useAuthStore();
  const setupStatus = useSetupStore((state) => state.status);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white/50">
        <div className="text-sm font-medium animate-pulse">Iniciando sistema seguro...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <StoreProvider>
        <SyncStatusProvider>
          {session ? (
            <OnboardingProvider>
              {setupStatus === 'completed' ? <AppShell /> : <SetupExperience />}
            </OnboardingProvider>
          ) : (
            <PinGate />
          )}
        </SyncStatusProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
};
