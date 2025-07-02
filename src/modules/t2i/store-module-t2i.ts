import { create } from 'zustand';
import { persist } from 'zustand/middleware';


interface TextToImageStore {

  activeProviderId: string | null;
  setActiveProviderId: (providerId: string | null) => void;

}

export const useTextToImageStore = create<TextToImageStore>()(
  persist(
    (_set) => ({

      activeProviderId: null, // null: will auto-select the first availabe provider
      setActiveProviderId: (activeProviderId: string | null) => _set({ activeProviderId }),

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