import { llmsStoreState, llmsStoreActions } from './store-llms';

/**
 * Removes all Azure OpenAI services and models from user configuration
 * This is part of the migration to direct OpenAI API usage
 */
export function cleanupAzureServices() {
  console.log('[Azure Cleanup] Starting Azure OpenAI cleanup...');
  
  try {
    const { sources, llms, modelAssignments } = llmsStoreState();
    const { removeService, assignDomainModelId } = llmsStoreActions();
    
    // Find all Azure services
    const azureServices = sources.filter(service => service.vId === 'azure');
    
    if (azureServices.length === 0) {
      console.log('[Azure Cleanup] No Azure services found, cleanup complete');
      return;
    }
    
    console.log(`[Azure Cleanup] Found ${azureServices.length} Azure services to remove:`, azureServices.map(s => s.id));
    
    // Find Azure model IDs that need to be cleaned up from domain assignments
    const azureServiceIds = azureServices.map(s => s.id);
    const azureModelIds = llms
      .filter(llm => azureServiceIds.includes(llm.sId))
      .map(llm => llm.id);
    
    console.log(`[Azure Cleanup] Found ${azureModelIds.length} Azure models to clean from assignments`);
    
    // Check if any domain assignments are using Azure models and reset them
    Object.entries(modelAssignments).forEach(([domainId, assignment]) => {
      if (assignment?.modelId && azureModelIds.includes(assignment.modelId)) {
        console.log(`[Azure Cleanup] Resetting domain assignment for ${domainId} (was using Azure model ${assignment.modelId})`);
        assignDomainModelId(domainId as any, null); // This will trigger auto-assignment to a non-Azure model
      }
    });
    
    // Remove each Azure service (this will also remove associated models)
    for (const service of azureServices) {
      console.log(`[Azure Cleanup] Removing Azure service: ${service.id}`);
      removeService(service.id);
    }
    
    console.log('[Azure Cleanup] Azure OpenAI cleanup complete');
    
  } catch (error) {
    console.error('[Azure Cleanup] Error during Azure cleanup:', error);
  }
} 