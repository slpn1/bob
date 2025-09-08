import * as z from 'zod/v4';

import { Release } from '~/common/app.release';

import { createTRPCRouter, publicProcedure } from '~/server/trpc/trpc.server';
import { env } from '~/server/env';
import { fetchJsonOrTRPCThrow } from '~/server/trpc/trpc.router.fetchers';

// critical to make sure we `import type` here
import type { BackendCapabilities } from './store-backend-capabilities';


function sdbmHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = char + (hash << 6) + (hash << 16) - hash;
  }
  // Convert to unsigned 32-bit integer and then to hex string
  return (hash >>> 0).toString(16);
}

function generateLlmEnvConfigHash(env: Record<string, unknown>): string {
  const envAPIKeys = Object.keys(env)     // get all env keys
    .filter(key => !!env[key])            // minus the empty
    .filter(key => key.includes('_API_')) // minus the non-API keys
    .map(key => `${key}=${env[key]}`)     // create key-value pairs
    .sort();                              // ignore order
  const hashInputs = [
    Release.Monotonics.Aix.toString(),  // triggers at every change (large downstream effect, know what you are doing)
    Release.TenantSlug.toString(),          // triggers when branch changes
    ...envAPIKeys,                      // triggers when env keys change
  ];
  const hashString = hashInputs.join(';');
  const finalHash = sdbmHash(hashString);
  
  console.log('[Backend Hash Generation]', {
    aixVersion: Release.Monotonics.Aix,
    tenantSlug: Release.TenantSlug,
    envKeysCount: envAPIKeys.length,
    hashInputs: hashString.substring(0, 200) + (hashString.length > 200 ? '...' : ''),
    finalHash: finalHash
  });
  
  return finalHash;
}


/**
 * This is the primary router for the backend. Mainly, this deals with letting
 * the frontend know what capabilities are available, by virtue of being
 * pre-configured in the servr. In the future this will evolve to a better
 * server-side configuration system.
 */
export const backendRouter = createTRPCRouter({

  /* List server-side capabilities (pre-configured by the deployer) */
  listCapabilities: publicProcedure
    .query(async ({ ctx: _unused }): Promise<BackendCapabilities> => {
      
      console.log('[Backend Capabilities] Environment check:', {
        OPENAI_API_KEY: !!env.OPENAI_API_KEY,
        OPENAI_ALLOWED_MODELS: env.OPENAI_ALLOWED_MODELS,
        hasLlmOpenAI: !!env.OPENAI_API_KEY,
      });
      
      return {
        // llms
        hasLlmAlibaba: !!env.ALIBABA_API_KEY || !!env.ALIBABA_API_HOST,
        hasLlmAnthropic: !!env.ANTHROPIC_API_KEY,
        hasLlmAzureOpenAI: false, // Disabled: migrated to direct OpenAI API
        hasLlmDeepseek: !!env.DEEPSEEK_API_KEY,
        hasLlmGemini: !!env.GEMINI_API_KEY,
        hasLlmGroq: !!env.GROQ_API_KEY,
        hasLlmLocalAIHost: !!env.LOCALAI_API_HOST,
        hasLlmLocalAIKey: !!env.LOCALAI_API_KEY,
        hasLlmMistral: !!env.MISTRAL_API_KEY,
        hasLlmOllama: !!env.OLLAMA_API_HOST,
        hasLlmOpenAI: !!env.OPENAI_API_KEY,
        hasLlmOpenPipe: !!env.OPENPIPE_API_KEY,
        hasLlmOpenRouter: !!env.OPENROUTER_API_KEY,
        hasLlmPerplexity: !!env.PERPLEXITY_API_KEY,
        hasLlmTogetherAI: !!env.TOGETHERAI_API_KEY,
        hasLlmXAI: !!env.XAI_API_KEY,
        // others
        hasDB: (!!env.MDB_URI) || (!!env.POSTGRES_PRISMA_URL && !!env.POSTGRES_URL_NON_POOLING),
        hasBrowsing: !!env.PUPPETEER_WSS_ENDPOINT,
        hasGoogleCustomSearch: !!env.GOOGLE_CSE_ID && !!env.GOOGLE_CLOUD_API_KEY,
        hasVoiceElevenLabs: !!env.ELEVENLABS_API_KEY,
        // hashes
        hashLlmReconfig: generateLlmEnvConfigHash(env),
        // build data
        build: Release.buildInfo('backend'),
      };
    }),


  // The following are used for various OAuth integrations

  /**
   * Exchange the OpenrRouter 'code' (from PKCS) for an OpenRouter API Key
   */
  exchangeOpenRouterKey: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      // Documented here: https://openrouter.ai/docs#oauth
      return await fetchJsonOrTRPCThrow<{ key: string }, { code: string }>({
        url: 'https://openrouter.ai/api/v1/auth/keys',
        method: 'POST',
        body: { code: input.code },
        name: 'Backend.exchangeOpenRouterKey',
      });
    }),

});
