import { createTRPCRouter, publicProcedure } from './trpc.server';

import { backendRouter } from '~/modules/backend/backend.router';
import { llmOpenAIRouter } from '~/modules/llms/server/openai/openai.router';

/**
 * Primary rooter, and will be sitting on an Edge Runtime.
 */
export const appRouterEdge = createTRPCRouter({
  backend: backendRouter,
  llmOpenAI: llmOpenAIRouter,
});

// export type definition of API
export type AppRouterEdge = typeof appRouterEdge;
