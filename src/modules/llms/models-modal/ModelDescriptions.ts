/**
 * Model Descriptions Mapping
 * 
 * This file allows you to add custom descriptions for models that will be shown
 * in the model information popup. The keys should match the model IDs and values
 * should be descriptive text about the model's capabilities and use cases.
 */

export const MODEL_DESCRIPTIONS: Record<string, string> = {
  // OpenAI Models
  'gpt-4o': 'High-intelligence flagship model for complex, multi-step tasks. Excellent for coding, analysis, and creative writing.',
  'gpt-4o-mini': 'Fast and efficient model that balances capability with cost. Good for most everyday tasks.',
  'gpt-4-turbo': 'Advanced model with strong reasoning capabilities. Great for complex analysis and detailed responses.',
  'gpt-3.5-turbo': 'Fast and cost-effective model suitable for simpler tasks and quick responses.',
  'o1-preview': 'Advanced reasoning model that takes time to think through complex problems step-by-step.',
  'o1-mini': 'Faster reasoning model optimized for coding, math, and science tasks.',
  'openai-gpt-4.1-2025-04-14': 'The latest OpenAI model with improved reasoning capabilities and better handling of complex tasks.',
  
  // Claude Models  
  'claude-3-5-sonnet-20241022': 'Most intelligent Claude model with excellent coding abilities and nuanced understanding.',
  'claude-3-5-haiku-20241022': 'Fast and efficient Claude model for quick tasks and real-time applications.',
  'claude-3-opus-20240229': 'Most capable Claude model for complex reasoning and creative tasks.',
  
  // Anthropic Models
  'claude-3-sonnet-20240229': 'Balanced model offering good performance for a wide range of tasks.',
  'claude-3-haiku-20240307': 'Fastest Claude model, optimized for simple tasks and quick responses.',
  
  // Gemini Models
  'gemini-pro': 'Google\'s multimodal model capable of understanding text, images, and code.',
  'gemini-pro-vision': 'Gemini model with enhanced vision capabilities for image analysis.',
  
  // Llama Models
  'llama-3.1-70b-versatile': 'Large open-source model with strong performance across diverse tasks.',
  'llama-3.1-8b-instant': 'Smaller, faster Llama model good for quick responses and simple tasks.',
  'llama-2-70b-chat': 'Previous generation Llama model with good conversational abilities.',
  
  // Mistral Models
  'mistral-large': 'Mistral\'s flagship model with strong reasoning and multilingual capabilities.',
  'mistral-medium': 'Balanced Mistral model offering good performance for most tasks.',
  'mistral-small': 'Efficient Mistral model optimized for speed and cost.',
  
  // DeepSeek Models
  'deepseek-chat': 'DeepSeek\'s chat model with strong coding and reasoning capabilities.',
  'deepseek-coder': 'Specialized model optimized for programming and code generation tasks.',
  
  // Add more model descriptions here...
  // Format: 'model-id': 'Description of the model and its best use cases',
};

/**
 * Get a description for a model ID
 * @param modelId The model ID to get description for
 * @returns The description if found, or a default message
 */
export function getModelDescription(modelId: string): string {
  // Try exact match first
  if (MODEL_DESCRIPTIONS[modelId]) {
    return MODEL_DESCRIPTIONS[modelId];
  }
  
  // Try partial match for versioned models (e.g., gpt-4o-2024-08-06 -> gpt-4o)
  const baseModelId = Object.keys(MODEL_DESCRIPTIONS).find(key => 
    modelId.startsWith(key) || key.startsWith(modelId.split('-')[0] + '-' + modelId.split('-')[1])
  );
  
  if (baseModelId) {
    return MODEL_DESCRIPTIONS[baseModelId];
  }
  
  return 'No description available for this model. You can add one in src/modules/llms/models-modal/ModelDescriptions.ts';
} 