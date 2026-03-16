import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { seedGuidelines, seedPhotoperiod } from '@/app/store/seedData';
import type { AgronomicGuideline, PhotoperiodEntry } from '@/entities';

interface AgronomicCalendarState {
  guidelines: AgronomicGuideline[];
  photoperiod: PhotoperiodEntry[];
}

export const useAgronomicCalendarStore = create<AgronomicCalendarState>()(
  persist(
    () => ({
      guidelines: seedGuidelines,
      photoperiod: seedPhotoperiod
    }),
    {
      name: 'dunamis-farm-os-agronomic-calendar-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
