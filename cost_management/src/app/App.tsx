import { PinGate } from '@/features/auth/PinGate';
import { AppShell } from '@/app/layouts/AppShell';
import { StoreProvider } from '@/app/providers/StoreProvider';
import { SyncStatusProvider } from '@/app/providers/SyncStatusProvider';
import { OnboardingProvider } from '@/app/providers/OnboardingProvider';
import { useUiPreferencesStore } from '@/app/store';
import { useSetupStore } from '@/app/store/useSetupStore';
import { SetupExperience } from '@/features/setup/SetupExperience';

export const App = () => {
  const unlocked = useUiPreferencesStore((state) => state.unlocked);
  const setupStatus = useSetupStore((state) => state.status);

  return (
    <StoreProvider>
      <SyncStatusProvider>
        {unlocked ? (
          <OnboardingProvider>
            {setupStatus === 'completed' ? <AppShell /> : <SetupExperience />}
          </OnboardingProvider>
        ) : (
          <PinGate />
        )}
      </SyncStatusProvider>
    </StoreProvider>
  );
};
