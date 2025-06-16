import { llmsStoreState, llmsStoreActions } from './store-llms';
import { ModelVendorAzure } from '~/modules/llms/vendors/azure/azure.vendor';
import { llmsUpdateModelsForServiceOrThrow } from '~/modules/llms/llm.client';
import { DModelDomainId } from './model.domains.types';
import { createDModelConfiguration } from './modelconfiguration.types';

/**
 * Checks if the environment variables for Azure OpenAI are different from the stored values
 * and updates the stored values if needed
 */
export async function checkAndUpdateAzureEndpoint() {
  console.log('[Azure Endpoint Check] Starting check...');
  
  // Debug all environment variables
  console.log('[Azure Endpoint Check] All environment variables:', {
    NEXT_PUBLIC_AZURE_OPENAI_API_ENDPOINT: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_ENDPOINT,
    NEXT_PUBLIC_AZURE_OPENAI_API_KEY: process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY,
    NODE_ENV: process.env.NODE_ENV,
  });
  
  // Get the environment variables
  const envEndpoint = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_ENDPOINT;
  const envApiKey = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY;
  
  console.log('[Azure Endpoint Check] Environment values:', {
    endpoint: envEndpoint,
    apiKey: envApiKey ? '***' : undefined // Mask the API key in logs
  });
  
  if (!envEndpoint && !envApiKey) {
    console.log('[Azure Endpoint Check] No environment values found, exiting');
    return;
  }

  // Get the current store state and actions
  const store = llmsStoreState();
  const actions = llmsStoreActions();
  console.log('[Azure Endpoint Check] Current store state:', store);
  
  // Find Azure services
  let azureServices = store.sources.filter(service => service.vId === 'azure');
  console.log('[Azure Endpoint Check] Found Azure services:', azureServices);

  // If no Azure service exists and we have environment variables, create one
  if (azureServices.length === 0 && (envEndpoint || envApiKey)) {
    console.log('[Azure Endpoint Check] No Azure service found, creating one...');
    const newService = actions.createModelsService(ModelVendorAzure);
    azureServices = [newService];
    console.log('[Azure Endpoint Check] Created new Azure service:', newService);
  }
  
  // For each Azure service, check if the values need updating
  for (const service of azureServices) {
    const currentEndpoint = service.setup.azureEndpoint || '';
    const currentApiKey = service.setup.azureKey || '';
    
    console.log('[Azure Endpoint Check] Checking service:', service.id);
    console.log('[Azure Endpoint Check] Current values:', {
      endpoint: currentEndpoint,
      apiKey: currentApiKey ? '***' : undefined // Mask the API key in logs
    });
    
    let needsUpdate = false;
    const updatedSetup = { ...service.setup };
    
    // Check endpoint - explicitly compare strings
    if (envEndpoint && envEndpoint !== currentEndpoint) {
      console.log('[Azure Endpoint Check] Updating endpoint for service:', service.id);
      updatedSetup.azureEndpoint = envEndpoint;
      needsUpdate = true;
    }
    
    // Check API key - explicitly compare strings
    if (envApiKey && envApiKey !== currentApiKey) {
      console.log('[Azure Endpoint Check] Updating API key for service:', service.id);
      updatedSetup.azureKey = envApiKey;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      console.log('[Azure Endpoint Check] Updating service configuration:', service.id);
      actions.updateServiceSettings(service.id, updatedSetup);
    } else {
      console.log('[Azure Endpoint Check] No updates needed for service:', service.id);
    }

    // Always update models for the service
    try {
      console.log('[Azure Endpoint Check] Updating models for service:', service.id);
      await llmsUpdateModelsForServiceOrThrow(service.id, true);
      console.log('[Azure Endpoint Check] Successfully updated models for service:', service.id);

      // After models are updated, set a default model
      const { llms } = llmsStoreState();
      const serviceModels = llms.filter(llm => llm.sId === service.id);
      
      // Try to find GPT-4.1 first, then any GPT-4 model, then fall back to first available model
      const defaultModel = serviceModels.find(m => m.label.toLowerCase().includes('gpt-4.1')) || 
                         serviceModels.find(m => m.label.toLowerCase().includes('gpt-4')) ||
                         serviceModels[0];

      if (defaultModel) {
        console.log('[Azure Endpoint Check] Setting default model:', defaultModel.id);
        // Create a proper model configuration for the primary chat domain
        const modelConfig = createDModelConfiguration('primaryChat' as DModelDomainId, defaultModel.id);
        actions.assignDomainModelConfiguration(modelConfig);
      }

    } catch (error) {
      console.error('[Azure Endpoint Check] Failed to update models for service:', service.id, error);
    }
  }
  
  console.log('[Azure Endpoint Check] Check complete');
} 