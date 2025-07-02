import { llmsStoreState, llmsStoreActions } from './store-llms';
import { ModelVendorOpenAI } from '~/modules/llms/vendors/openai/openai.vendor';
import { llmsUpdateModelsForServiceOrThrow } from '~/modules/llms/llm.client';
import { getBackendCapabilities } from '~/modules/backend/store-backend-capabilities';

/**
 * Ensures OpenAI models are always updated on app startup
 * This runs after the Azure cleanup and backend configuration
 */
export async function ensureOpenAIModelsUpdated() {
  console.log('[OpenAI Startup Update] Starting OpenAI model update...');
  
  try {
    // Check if OpenAI is configured via backend
    const backendCaps = getBackendCapabilities();
    console.log('[OpenAI Startup Update] Backend capabilities check:', { hasLlmOpenAI: backendCaps.hasLlmOpenAI });
    
    if (!backendCaps.hasLlmOpenAI) {
      console.log('[OpenAI Startup Update] OpenAI not configured in backend, skipping');
      return;
    }

    const { sources } = llmsStoreState();
    const { createModelsService, assignDomainModelId } = llmsStoreActions();
    
    // Find or create OpenAI service
    let openaiService = sources.find(service => service.vId === 'openai');
    
    if (!openaiService) {
      console.log('[OpenAI Startup Update] No OpenAI service found, creating one...');
      openaiService = createModelsService(ModelVendorOpenAI);
      console.log('[OpenAI Startup Update] Created OpenAI service:', openaiService.id);
    } else {
      console.log('[OpenAI Startup Update] Found existing OpenAI service:', openaiService.id);
    }

    // Always update models on startup
    console.log('[OpenAI Startup Update] Updating models for service:', openaiService.id);
    
    // Check if the service has the necessary configuration
    const serviceAccess = ModelVendorOpenAI.getTransportAccess(openaiService.setup);
    console.log('[OpenAI Startup Update] Service access check:', { hasKey: !!serviceAccess.oaiKey, dialect: serviceAccess.dialect });
    
    await llmsUpdateModelsForServiceOrThrow(openaiService.id, true);
    console.log('[OpenAI Startup Update] Successfully updated OpenAI models');

    // Auto-assign chatgpt-4o-latest as the default primary chat model if available
    const { llms } = llmsStoreState();
    const chatgpt4oLatest = llms.find(llm => llm.id === 'chatgpt-4o-latest' && !llm.hidden);
    
    if (chatgpt4oLatest) {
      console.log('[OpenAI Startup Update] Auto-assigning chatgpt-4o-latest as primary chat model');
      assignDomainModelId('primaryChat', 'chatgpt-4o-latest');
    } else {
      console.log('[OpenAI Startup Update] chatgpt-4o-latest not found or hidden, skipping auto-assignment');
    }

  } catch (error) {
    console.error('[OpenAI Startup Update] Error updating OpenAI models:', error);
    // Don't throw - we don't want to break app startup if model fetching fails
  }
} 