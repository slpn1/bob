// Only OpenAI vendor is supported - other vendors removed
import { openAIAccess } from '~/modules/llms/server/openai/openai.router';

import type { AixAPI_Access, AixAPI_Model, AixAPIChatGenerate_Request } from '../../api/aix.wiretypes';
import type { AixDemuxers } from '../stream.demuxers';

import { aixToOpenAIChatCompletions } from './adapters/openai.chatCompletions';
import { aixToOpenAIResponses } from './adapters/openai.responsesCreate';

import type { IParticleTransmitter } from './IParticleTransmitter';
import { createOpenAIChatCompletionsChunkParser, createOpenAIChatCompletionsParserNS } from './parsers/openai.parser';
import { createOpenAIResponsesEventParser, createOpenAIResponseParserNS, } from './parsers/openai.responses.parser';


/**
 * Interface for the vendor parsers to implement
 */
export type ChatGenerateParseFunction = (partTransmitter: IParticleTransmitter, eventData: string, eventName?: string) => void;

export interface UserContext {
  email?: string | null;
  name?: string | null;
}

/**
 * Specializes to the correct vendor a request for chat generation
 */
export function createChatGenerateDispatch(
  access: AixAPI_Access, 
  model: AixAPI_Model, 
  chatGenerate: AixAPIChatGenerate_Request, 
  streaming: boolean, 
  user = "",
  userContext?: UserContext | null
): {
  request: { url: string, headers: HeadersInit, body: object },
  demuxerFormat: AixDemuxers.StreamDemuxerFormat;
  chatGenerateParse: ChatGenerateParseFunction;
} {

  // Only OpenAI dialect is supported
  // switch to the Responses API if the model supports it
  const isResponsesAPI = !!model.vndOaiResponsesAPI;
  console.log("Dispatching to OpenAI " + (isResponsesAPI ? "Responses" : "ChatCompletions") + " API for model " + model.id);
  if (isResponsesAPI) {
    return {
      request: {
        ...openAIAccess(access, model.id, '/v1/responses'),
        body: aixToOpenAIResponses(model, chatGenerate, false, streaming),
      },
      demuxerFormat: streaming ? 'fast-sse' : null,
      chatGenerateParse: streaming ? createOpenAIResponsesEventParser(userContext) : createOpenAIResponseParserNS(userContext),
    };
  }

  return {
    request: {
      ...openAIAccess(access, model.id, '/v1/chat/completions'),
      body: aixToOpenAIChatCompletions(access.dialect, model, chatGenerate, false, streaming, user),
    },
    demuxerFormat: streaming ? 'fast-sse' : null,
    chatGenerateParse: streaming ? createOpenAIChatCompletionsChunkParser(userContext) : createOpenAIChatCompletionsParserNS(userContext),
  };
}
