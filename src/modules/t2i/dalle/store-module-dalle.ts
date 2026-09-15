import { create } from 'zustand';
import { persist } from 'zustand/middleware';


// NOTE: keep all the following type definitions in sync with the server-side
//       router types, in `openai.router.ts`, which in turn is a
//       strict subset of OpenAIWire_API_Images_Generations.Request


export const DALLE_DEFAULT_IMAGE_SIZE: DalleImageSize = '1024x1024'; // this works in all
export type DalleImageSize = DalleSizeGI | DalleSizeD3 | DalleSizeD2;

export type DalleModelId =
  | 'gpt-image-2.5-flare'     // fast, high-quality everyday generation
  | 'gpt-image-2.5-sunburst'  // best editing precision, inpainting
  | 'gpt-image-1.5'
  | 'gpt-image-1'
  | 'dall-e-3'
  | 'dall-e-2';
export type DalleModelSelection = DalleModelId | null; // null = auto-select latest

/** Models of the GPT Image family - these support image inputs (editing) and the modern parameter set */
export function isGptImageModel(modelId: DalleModelId): boolean {
  return modelId.startsWith('gpt-image-');
}

/** Models of the GPT Image 2.5 family - these add the 'xhigh'/'max' qualities and custom sizes */
export function isGptImage25Model(modelId: DalleModelId): boolean {
  return modelId.startsWith('gpt-image-2.5');
}

/**
 * Resolve the actual model to use
 * @param selection - User's selection (null = auto-select latest)
 * @param forEditing - when auto-selecting, prefer the model tuned for editing precision
 * @returns The concrete model ID to use
 */
export function resolveDalleModelId(selection: DalleModelSelection, forEditing: boolean = false): DalleModelId {
  // Auto-select latest model when null: Sunburst holds detail across repeated edits, Flare is faster for fresh images
  if (selection === null)
    return forEditing ? 'gpt-image-2.5-sunburst' : 'gpt-image-2.5-flare';
  return selection;
}

export type DalleImageQuality = DalleImageQualityGI | DalleImageQualityD3;
// 'xhigh' and 'max' are gpt-image-2.5 only - clamped down for gpt-image-1 at request time
export type DalleImageQualityGI = 'auto' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';
type DalleImageQualityD3 = 'hd' | 'standard'; // DALL-E 3

type DalleImageStyleD3 = 'vivid' | 'natural';

export type DalleBackgroundGI = 'auto' | 'transparent' | 'opaque';
export type DalleOutputFormatGI = 'png' | 'jpeg' | 'webp';
type DalleModerationGI = 'auto' | 'low';
type DalleInputFidelityGI = 'high' | 'low';

export type DalleSize = DalleSizeGI | DalleSizeD3 | DalleSizeD2;
// 'auto' lets OpenAI infer the best aspect ratio from the prompt
export type DalleSizeGI = 'auto' | '1024x1024' | '1536x1024' | '1024x1536';
export type DalleSizeD3 = '1024x1024' | '1792x1024' | '1024x1792';
export type DalleSizeD2 = '256x256' | '512x512' | '1024x1024';


interface ModuleDalleStore {

  dalleModelId: DalleModelSelection, // null = auto-select latest
  setDalleModelId: (modelId: DalleModelSelection) => void;

  dalleNoRewrite: boolean;
  setDalleNoRewrite: (noRewrite: boolean) => void;

  // -- added for gpt-image-2.5 [2026-09-15] --

  /** Let a fast model pick size/quality/background/format from the prompt, instead of using the fixed settings below */
  dalleAutoSettings: boolean;
  setDalleAutoSettings: (autoSettings: boolean) => void;

  /** Carry previously generated/uploaded images of the conversation forward as edit references */
  dalleUseConversationContext: boolean;
  setDalleUseConversationContext: (useContext: boolean) => void;

  dalleInputFidelityGI: DalleInputFidelityGI;
  setDalleInputFidelityGI: (fidelity: DalleInputFidelityGI) => void;

  // -- added for gpt-image-1 [2025-04-24] --

  dalleSizeGI: DalleSizeGI;
  setDalleSizeGI: (size: DalleSizeGI) => void;

  dalleQualityGI: DalleImageQualityGI;
  setDalleQualityGI: (quality: DalleImageQualityGI) => void;

  dalleBackgroundGI: DalleBackgroundGI;
  setDalleBackgroundGI: (background: DalleBackgroundGI) => void;

  dalleOutputFormatGI: DalleOutputFormatGI;
  setDalleOutputFormatGI: (format: DalleOutputFormatGI) => void;

  dalleOutputCompressionGI: number;
  setDalleOutputCompressionGI: (compression: number) => void;

  dalleModerationGI: DalleModerationGI;
  setDalleModerationGI: (moderation: DalleModerationGI) => void;

  // -- Dall-E 3 settings --

  dalleSizeD3: DalleSizeD3,
  setDalleSizeD3: (size: DalleSizeD3) => void;

  dalleQualityD3: DalleImageQualityD3,
  setDalleQualityD3: (quality: DalleImageQualityD3) => void;

  dalleStyleD3: DalleImageStyleD3;
  setDalleStyleD3: (style: DalleImageStyleD3) => void;

  // -- Dall-E 2 settings --

  dalleSizeD2: DalleSizeD2,
  setDalleSizeD2: (size: DalleSizeD2) => void;

}

export const useDalleStore = create<ModuleDalleStore>()(
  persist(
    (set) => ({

      dalleModelId: null, // auto-select latest
      setDalleModelId: (dalleModelId) => set({ dalleModelId }),

      dalleNoRewrite: false,
      setDalleNoRewrite: (dalleNoRewrite) => set({ dalleNoRewrite }),

      // -- added for gpt-image-2.5 [2026-09-15] --

      dalleAutoSettings: true,
      setDalleAutoSettings: (dalleAutoSettings) => set({ dalleAutoSettings }),

      dalleUseConversationContext: true,
      setDalleUseConversationContext: (dalleUseConversationContext) => set({ dalleUseConversationContext }),

      dalleInputFidelityGI: 'high',
      setDalleInputFidelityGI: (dalleInputFidelityGI) => set({ dalleInputFidelityGI }),

      // -- added for gpt-image-1 [2025-04-24] --

      dalleSizeGI: 'auto',
      setDalleSizeGI: (dalleSizeGI) => set({ dalleSizeGI }),

      dalleQualityGI: 'auto',
      setDalleQualityGI: (dalleQualityGI) => set({ dalleQualityGI }),

      dalleBackgroundGI: 'auto',
      setDalleBackgroundGI: (dalleBackgroundGI) => set({ dalleBackgroundGI }),

      dalleOutputFormatGI: 'webp',
      setDalleOutputFormatGI: (dalleOutputFormatGI) => set({ dalleOutputFormatGI }),

      dalleOutputCompressionGI: 100,
      setDalleOutputCompressionGI: (dalleOutputCompressionGI) => set({ dalleOutputCompressionGI }),

      dalleModerationGI: 'low',
      setDalleModerationGI: (dalleModerationGI) => set({ dalleModerationGI }),

      // -- Dall-E 3 settings --

      dalleSizeD3: '1024x1024',
      setDalleSizeD3: (dalleSizeD3) => set({ dalleSizeD3 }),

      dalleQualityD3: 'hd', // was: dalleQuality: 'standard',
      setDalleQualityD3: (dalleQualityD3) => set({ dalleQualityD3 }),

      dalleStyleD3: 'vivid', // was: dalleStyle: 'vivid'
      setDalleStyleD3: (dalleStyleD3) => set({ dalleStyleD3 }),

      // -- Dall-E 2 settings --

      dalleSizeD2: '1024x1024', // was: dalleSize: DALLE_DEFAULT_IMAGE_SIZE
      setDalleSizeD2: (dalleSizeD2) => set({ dalleSizeD2 }),

    }),
    {
      name: 'app-module-dalle',
      version: 4,

      migrate: (state: unknown, fromVersion) => {

        // 2: upgrade model to gpt-image-1
        if (state && fromVersion < 2)
          state = {
            ...(state as ModuleDalleStore),
            dalleModelId: 'gpt-image-1',
          } satisfies ModuleDalleStore;

        // 3: change to auto-select latest (null)
        if (state && fromVersion < 3)
          state = {
            ...(state as ModuleDalleStore),
            dalleModelId: null, // auto-select latest
          } satisfies ModuleDalleStore;

        // 4: gpt-image-2.5 - move everyone onto the latest model and onto automatic parameters,
        //    since size/quality are now inferred per-prompt rather than set once in Settings
        if (state && fromVersion < 4) {
          const prev = state as ModuleDalleStore;
          state = {
            ...prev,
            dalleModelId: null, // auto-select latest
            dalleAutoSettings: true,
            dalleUseConversationContext: true,
            dalleInputFidelityGI: 'high',
            dalleSizeGI: 'auto',
            dalleQualityGI: 'auto',
          } satisfies ModuleDalleStore;
        }

        return state;
      },

    },
  ),
);
