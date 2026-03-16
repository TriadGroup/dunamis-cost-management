import { type ReactNode, useEffect } from 'react';
import { useOnboardingStore, useUiPreferencesStore, useSetupStore } from '@/app/store';
import { ProductTour } from '@/shared/ui';
import { tourDefinitions } from '@/features/onboarding/tourDefinitions';

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const { tours, currentTourId, startTour } = useOnboardingStore();
  const activeRouteId = useUiPreferencesStore((state) => state.activeRouteId);
  const setupStatus = useSetupStore((state) => state.status);

  // Global Tour - Auto Start
  useEffect(() => {
    // Only start global tour if setup is completed and user is on dashboard
    if (setupStatus !== 'completed' || activeRouteId !== 'dashboard') return;

    const globalStatus = tours['global'];
    if (!globalStatus || globalStatus === 'never_started') {
      // Delay slightly to allow the app to be fully rendered
      const timer = setTimeout(() => {
        startTour('global');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [tours, startTour, setupStatus, activeRouteId]);

  // Contextual Tours
  useEffect(() => {
    if (currentTourId) return; // Don't interrupt an active tour

    const tourForRoute = tourDefinitions[activeRouteId];
    if (tourForRoute && (!tours[activeRouteId] || tours[activeRouteId] === 'never_started')) {
      // Only start if it's not the global tour (already handled)
      // or if global tour is already completed
      if (activeRouteId !== 'dashboard' || tours['global'] === 'completed') {
         // Optionally auto-start contextual tours here
      }
    }
  }, [activeRouteId, tours, currentTourId, startTour]);

  // Deep Tours for Wizards
  useEffect(() => {
    if (currentTourId) return;

    const checkWizards = () => {
      const planWizard = document.querySelector('[data-tour="plan-area-input"]');
      if (planWizard && (!tours['plan-wizard'] || tours['plan-wizard'] === 'never_started')) {
        startTour('plan-wizard');
      }
    };

    const interval = setInterval(checkWizards, 1000);
    return () => clearInterval(interval);
  }, [tours, currentTourId, startTour]);

  return (
    <>
      {children}
      <ProductTour />
    </>
  );
};
