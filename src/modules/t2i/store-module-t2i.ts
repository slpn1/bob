import { create } from 'zustand';
import { persist } from 'zustand/middleware';


interface TextToImageStore {

  selectedT2IProviderId: string | null; // null = auto-select, specific ID = user choice
  setSelectedT2IProviderId: (providerId: string | null) => void;

}

export const useTextToImageStore = create<TextToImageStore>()(
  persist(
    (_set) => ({

      selectedT2IProviderId: null, // null: auto-select highest priority configured provider
      setSelectedT2IProviderId: (selectedT2IProviderId: string | null) => _set({ selectedT2IProviderId }),

    }),
    {
      name: 'app-module-t2i',
      version: 2, // Increment version to force reset
      migrate: (persistedState: any, fromVersion: number) => {
        // Reset to null on any version upgrade to force re-selection
        if (fromVersion < 2) {
          return { activeProviderId: null };
        }
        return persistedState;
      },
    }),
);