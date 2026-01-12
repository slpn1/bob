//
// Application Routes
//
// We will centralize them here, for UI and routing purposes.
//
// noinspection Annotator

import Router, { useRouter } from 'next/router';

import type { AppChatIntent } from '../apps/chat/AppChat';

import type { DConversationId } from '~/common/stores/chat/chat.conversation';

import { isBrowser } from './util/pwaUtils';


export const ROUTE_INDEX = '/';
export const ROUTE_APP_CHAT = '/';


// Get Paths

export function useRouterQuery<TQuery>(): TQuery {
  const { query } = useRouter();
  return (query || {}) as TQuery;
}

export function useRouterRoute(): string {
  const { route } = useRouter();
  return route;
}


/// Simple Navigation

export const navigateToIndex = navigateFn(ROUTE_INDEX);

export const navigateBack = Router.back;

export const reloadPage = () => isBrowser && window.location.reload();

function navigateFn(path: string) {
  return (replace?: boolean): Promise<boolean> => Router[replace ? 'replace' : 'push'](path);
}


/// Launch Apps

export async function launchAppChat(conversationId?: DConversationId) {
  return Router.push(
    {
      pathname: ROUTE_APP_CHAT,
      query: !conversationId ? undefined : {
        initialConversationId: conversationId,
      } satisfies AppChatIntent,
    },
    ROUTE_APP_CHAT,
  );
}


/// Query Params utilities

export function removeQueryParam(key: string): Promise<boolean> {
  const newQuery = { ...Router.query };
  delete newQuery[key];
  return Router.replace({ pathname: Router.pathname, query: newQuery }, undefined, { shallow: true });
}
