import type { DLLMId } from './llms.types';

/**
 * List of model IDs that should be hidden from dropdowns and other UI elements.
 * These models will still be available in the system but won't be shown in the UI.
 * Note: Models starting with '?' are automatically filtered out.
 */
export const HIDDEN_MODELS: DLLMId[] = [
  // Add model IDs here that you want to hide
  // Example: 'gpt-3.5-turbo-16k',
];

/**
 * List of model names that should be hidden from dropdowns and other UI elements.
 * These models will still be available in the system but won't be shown in the UI.
 * The names should match exactly with the model's label property.
 * Note: Models starting with '?' are automatically filtered out.
 */
export const HIDDEN_MODEL_NAMES: string[] = [
  // Add model names here that you want to hide
  // Example: 'GPT-3.5 Turbo 16k',
]; 