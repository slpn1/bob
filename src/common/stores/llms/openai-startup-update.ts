import { llmsStoreState, llmsStoreActions } from './store-llms';
import { getDomainModelConfiguration } from './hooks/useModelDomain';
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

    // Auto-assign gpt-4.1-2025-04-14 as the default primary chat model if available
    const { llms } = llmsStoreState();
    const gpt41 = llms.find(llm => llm.id === 'gpt-4.1-2025-04-14' && !llm.hidden);
    
    if (gpt41) {
      console.log('[OpenAI Startup Update] Auto-assigning gpt-4.1-2025-04-14 as primary chat model');
      assignDomainModelId('primaryChat', 'gpt-4.1-2025-04-14');
    } else {
      console.log('[OpenAI Startup Update] gpt-4.1-2025-04-14 not found or hidden, skipping auto-assignment');
    }

    // Migration: Check if current model is the removed chatgpt-4o-latest and migrate to GPT-4.1
    const currentChatModel = getDomainModelConfiguration('primaryChat', true, true)?.modelId;
    if (currentChatModel === 'chatgpt-4o-latest') {
      console.log('[OpenAI Startup Update] Migrating from removed chatgpt-4o-latest to gpt-4.1-2025-04-14');
      if (gpt41) {
        assignDomainModelId('primaryChat', 'gpt-4.1-2025-04-14');
        console.log('[OpenAI Startup Update] Successfully migrated to gpt-4.1-2025-04-14');
      } else {
        console.warn('[OpenAI Startup Update] Could not migrate - gpt-4.1-2025-04-14 not available');
      }
    }

  } catch (error) {
    console.error('[OpenAI Startup Update] Error updating OpenAI models:', error);
    // Don't throw - we don't want to break app startup if model fetching fails
  }
} 