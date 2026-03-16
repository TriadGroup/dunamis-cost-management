import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TourStatus = 'never_started' | 'in_progress' | 'completed' | 'skipped';

interface OnboardingState {
  tours: Record<string, TourStatus>;
  currentTourId: string | null;
  currentStepIndex: number;
  
  // Actions
  startTour: (tourId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  resetTour: (tourId: string) => void;
  setStep: (index: number) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      tours: {},
      currentTourId: null,
      currentStepIndex: 0,

      startTour: (tourId) => {
        const { tours } = get();
        set({
          currentTourId: tourId,
          currentStepIndex: 0,
          tours: {
            ...tours,
            [tourId]: 'in_progress'
          }
        });
      },

      nextStep: () => set((state) => ({ currentStepIndex: state.currentStepIndex + 1 })),
      
      prevStep: () => set((state) => ({ currentStepIndex: Math.max(0, state.currentStepIndex - 1) })),

      skipTour: () => {
        const { currentTourId, tours } = get();
        if (!currentTourId) return;
        set({
          currentTourId: null,
          currentStepIndex: 0,
          tours: {
            ...tours,
            [currentTourId]: 'skipped'
          }
        });
      },

      completeTour: () => {
        const { currentTourId, tours } = get();
        if (!currentTourId) return;
        set({
          currentTourId: null,
          currentStepIndex: 0,
          tours: {
            ...tours,
            [currentTourId]: 'completed'
          }
        });
      },

      resetTour: (tourId) => {
        const { tours } = get();
        set({
          tours: {
            ...tours,
            [tourId]: 'never_started'
          }
        });
      },

      setStep: (index) => set({ currentStepIndex: index })
    }),
    {
      name: 'dunamis-farm-onboarding-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ tours: state.tours })
    }
  )
);
