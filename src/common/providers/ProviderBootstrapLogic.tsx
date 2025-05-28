import * as React from 'react';
import { useRouter } from 'next/router';

import { markNewsAsSeen, shallRedirectToNews, sherpaReconfigureBackendModels, sherpaStorageMaintenanceNoChats_delayed } from '~/common/logic/store-logic-sherpa';
import { navigateToNews, ROUTE_APP_CHAT } from '~/common/app.routes';
import { preloadTiktokenLibrary } from '~/common/tokens/tokens.text';
import { useClientLoggerInterception } from '~/common/logger/hooks/useClientLoggerInterception';
import { useNextLoadProgress } from '~/common/components/useNextLoadProgress';
import { checkAndUpdateAzureEndpoint } from '~/common/stores/llms/azure-endpoint-check';

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
  const launchPreload = isOnChat && !isRedirectingToNews;
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
    void sherpaReconfigureBackendModels(); // fire/forget (background server-driven model reconfiguration)
  }, [launchAutoConf]);

  // storage maintenance and garbage collection
  React.useEffect(() => {
    if (!launchStorageGC) return;
    console.log('[ProviderBootstrapLogic] Launching storage maintenance');
    void sherpaStorageMaintenanceNoChats_delayed(); // fire/forget (background storage maintenance)
  }, [launchStorageGC]);

  // [azure] check and update Azure endpoint if needed
  React.useEffect(() => {
    console.log('[ProviderBootstrapLogic] Launching Azure endpoint check');
    checkAndUpdateAzureEndpoint();
  }, []);

  //
  // Render Gates
  //

  if (isRedirectingToNews)
    return null;

  return props.children;
}
