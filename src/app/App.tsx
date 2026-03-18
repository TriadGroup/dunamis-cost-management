import { useEffect } from 'react';
import { PinGate } from '@/features/auth/PinGate';
import { AppShell } from '@/app/layouts/AppShell';
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary';
import { StoreProvider } from '@/app/providers/StoreProvider';
import { SyncStatusProvider } from '@/app/providers/SyncStatusProvider';
import { OnboardingProvider } from '@/app/providers/OnboardingProvider';
import { WorkspacePersistenceProvider } from '@/app/providers/WorkspacePersistenceProvider';
import { useSetupStore } from '@/app/store/useSetupStore';
import { useUiPreferencesStore } from '@/app/store/useUiPreferencesStore';
import { SetupExperience } from '@/features/setup/SetupExperience';

export const App = () => {
  const setupStatus = useSetupStore((state) => state.status);
  const unlocked = useUiPreferencesStore((state) => state.unlocked);

  return (
    <ErrorBoundary>
      <StoreProvider>
        <SyncStatusProvider>
          <WorkspacePersistenceProvider>
            {unlocked ? (
              <OnboardingProvider>
                {setupStatus === 'completed' ? <AppShell /> : <SetupExperience />}
              </OnboardingProvider>
            ) : (
              <PinGate />
            )}
          </WorkspacePersistenceProvider>
        </SyncStatusProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
};
