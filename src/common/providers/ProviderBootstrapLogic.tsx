import * as React from 'react';
import { useRouter } from 'next/router';

import { getChatTokenCountingMethod } from '../../apps/chat/store-app-chat';

import { markNewsAsSeen, shallRedirectToNews, sherpaReconfigureBackendModels, sherpaStorageMaintenanceNoChats_delayed } from '~/common/logic/store-logic-sherpa';
import { navigateToNews, ROUTE_APP_CHAT } from '~/common/app.routes';
import { preloadTiktokenLibrary } from '~/common/tokens/tokens.text';
import { useClientLoggerInterception } from '~/common/logger/hooks/useClientLoggerInterception';
import { useNextLoadProgress } from '~/common/components/useNextLoadProgress';
import { cleanupAzureServices } from '~/common/stores/llms/azure-cleanup';
import { ensureOpenAIModelsUpdated } from '~/common/stores/llms/openai-startup-update';

export function ProviderBootstrapLogic(props: { children: React.ReactNode }) {
  console.log('[ProviderBootstrapLogic] Component mounted');

  // external state
  const { route, events } = useRouter();

  // AUTO-LOG events from this scope on; note that we are past the Sherpas
  useClientLoggerInterception(true, false);

  // wire-up the NextJS router to a loading bar to be displayed while routes change
  useNextLoadProgress(route, events);

  // [boot-up] logic
  const isOnChat = route === ROUTE_APP_CHAT;
  const doRedirectToNews = isOnChat && shallRedirectToNews();

  // redirect Chat -> News if fresh news
  const isRedirectingToNews = React.useMemo(() => {
    if (doRedirectToNews) {
      navigateToNews().then(() => markNewsAsSeen()).catch(console.error);
      return true;
    }
    return false;
  }, [doRedirectToNews]);

  // decide what to launch
  const launchPreload = isOnChat && !isRedirectingToNews && getChatTokenCountingMethod() === 'accurate'; // only preload if using TikToken by default
  const launchAutoConf = isOnChat && !isRedirectingToNews;
  const launchStorageGC = true;

  // [preload] kick-off a preload of the Tiktoken library right when proceeding to the UI
  React.useEffect(() => {
    if (!launchPreload) return;
    console.log('[ProviderBootstrapLogic] Launching preload');
    void preloadTiktokenLibrary(); // fire/forget (large WASM payload)
  }, [launchPreload]);

  // [autoconf] initiate the llm auto-configuration process if on the chat
  React.useEffect(() => {
    if (!launchAutoConf) return;
    console.log('[ProviderBootstrapLogic] Launching auto configuration');
    
    // Force model refresh to ensure latest models (including GPT-5) are available
    // This bypasses the caching mechanisms that might prevent model updates
    void sherpaReconfigureBackendModels(true); // fire/forget (background server-driven model reconfiguration)
  }, [launchAutoConf]);

  // storage maintenance and garbage collection
  React.useEffect(() => {
    if (!launchStorageGC) return;
    console.log('[ProviderBootstrapLogic] Launching storage maintenance');
    void sherpaStorageMaintenanceNoChats_delayed(); // fire/forget (background storage maintenance)
  }, [launchStorageGC]);

  // [azure] cleanup existing Azure OpenAI services (migration to direct OpenAI API)
  React.useEffect(() => {
    console.log('[ProviderBootstrapLogic] Cleaning up Azure OpenAI services');
    cleanupAzureServices();
  }, []);

  // [openai] ensure models are always updated on startup
  React.useEffect(() => {
    console.log('[ProviderBootstrapLogic] Ensuring OpenAI models are updated');
    // Run after a short delay to let other initialization complete
    setTimeout(async () => {
      await ensureOpenAIModelsUpdated();
    }, 1000);
  }, []);

  //
  // Render Gates
  //

  if (isRedirectingToNews)
    return null;

  return props.children;
}
