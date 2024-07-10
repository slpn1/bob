import type { DLLMId } from '~/modules/llms/store-llms';

import { AixChatContentGenerateRequest, AixChatMessage, AixChatMessageModel, AixChatMessageUser } from '~/modules/aix/client/aix.client.api';
import type { IntakeContextChatStream } from '~/modules/aix/server/intake/schemas.intake.api';
import { aixStreamingChatGenerate, StreamingClientUpdate } from '~/modules/aix/client/aix.client';
import { autoConversationTitle } from '~/modules/aifn/autotitle/autoTitle';
import { autoSuggestions } from '~/modules/aifn/autosuggestions/autoSuggestions';

import type { DConversationId } from '~/common/stores/chat/chat.conversation';
import { ConversationsManager } from '~/common/chats/ConversationsManager';
import { DMessage, messageFragmentsReplaceLastContentText } from '~/common/stores/chat/chat.message';
import { getUXLabsHighPerformance } from '~/common/state/store-ux-labs';
import { isContentFragment, isContentOrAttachmentFragment, isTextPart } from '~/common/stores/chat/chat.fragments';

import { PersonaChatMessageSpeak } from './persona/PersonaChatMessageSpeak';
import { getChatAutoAI } from '../store-app-chat';
import { getInstantAppChatPanesCount } from '../components/panes/usePanesManager';
import { getImageAsset } from '~/modules/dblobs/dblobs.images';


// FIXME: complete and optimize. This translates our 'message at rest' data structure into the Aix Request structure
// for chat generate
async function historyToChatGenerateRequest(history: Readonly<DMessage[]>): Promise<AixChatContentGenerateRequest> {
  // reduce history
  return await history.reduce(async (accPromise, m, index) => {
    const acc = await accPromise;

    // extract system
    if (index === 0 && m.role === 'system') {
      // create parts if not exist
      if (!acc.systemMessage) {
        acc.systemMessage = {
          parts: [],
        };
      }
      for (const systemFragment of m.fragments) {
        if (isContentFragment(systemFragment) && isTextPart(systemFragment.part)) {
          acc.systemMessage.parts.push(systemFragment.part);
        } else {
          console.warn('historyToChatGenerateRequest: unexpected system fragment', systemFragment);
        }
      }
      return acc;
    }

    // map the other parts
    let aixChatMessage: AixChatMessage | undefined = undefined;
    if (m.role === 'assistant') {
      aixChatMessage = m.fragments.reduce((mMsg, srcFragment) => {
        if (!isContentOrAttachmentFragment(srcFragment))
          return mMsg;
        switch (srcFragment.part.pt) {
          case 'text':
          case 'tool_call':
            mMsg.parts.push(srcFragment.part);
            break;
          default:
            console.warn('historyToChatGenerateRequest: unexpected model fragment part type', srcFragment.part);
            break;
        }
        return mMsg;
      }, { role: 'model', parts: [] } as AixChatMessageModel);
    } else if (m.role === 'user') {
      aixChatMessage = await m.fragments.reduce(async (mMsgPromise, srcFragment) => {
        const mMsg = await mMsgPromise;
        if (!isContentOrAttachmentFragment(srcFragment))
          return mMsg;
        switch (srcFragment.part.pt) {
          case 'text':
            mMsg.parts.push(srcFragment.part);
            break;
          case 'image_ref':
            console.log('DEV: historyToChatGenerateRequest: image_ref', srcFragment.part);
            const imageDataRef = srcFragment.part.dataRef;
            if (imageDataRef.reftype === 'dblob' && imageDataRef.dblobAssetId) {
              const imageAsset = await getImageAsset(imageDataRef.dblobAssetId);
              if (imageAsset) {
                mMsg.parts.push({
                  pt: 'inline_image',
                  mimeType: imageDataRef.mimeType || imageAsset.data.mimeType || 'image/png' as any,
                  base64: imageAsset.data.base64,
                });
              } else {
                console.warn('historyToChatGenerateRequest: image_ref: missing image asset', imageDataRef);
                throw new Error('Missing image asset');
              }
            } else {
              console.warn('historyToChatGenerateRequest: image_ref: unexpected data ref', imageDataRef);
              throw new Error('Unexpected data ref');
            }
            break;
          case 'doc':
            mMsg.parts.push(srcFragment.part);
            break;
          default:
            console.warn('historyToChatGenerateRequest: unexpected user fragment part type', srcFragment.part);
        }
        return mMsg;
      }, Promise.resolve({ role: 'user', parts: [] } as AixChatMessageUser));
    } else {
      console.warn('historyToChatGenerateRequest: unexpected message role', m.role);
    }
    if (aixChatMessage)
      acc.chat.push(aixChatMessage);
    return acc;
  }, Promise.resolve({ chat: [] } as AixChatContentGenerateRequest));
}


/**
 * The main "chat" function.
 */
export async function runPersonaOnConversationHead(
  assistantLlmId: DLLMId,
  conversationId: DConversationId,
): Promise<boolean> {

  const cHandler = ConversationsManager.getHandler(conversationId);

  const history = cHandler.historyViewHead('runPersonaOnConversationHead') as Readonly<DMessage[]>;

  const parallelViewCount = getUXLabsHighPerformance() ? 0 : getInstantAppChatPanesCount();

  // ai follow-up operations (fire/forget)
  const { autoSpeak, autoSuggestDiagrams, autoSuggestHTMLUI, autoSuggestQuestions, autoTitleChat } = getChatAutoAI();

  // assistant placeholder
  const { assistantMessageId } = cHandler.messageAppendAssistantPlaceholder(
    '...',
    { originLLM: assistantLlmId, purposeId: history[0].purposeId },
  );

  // AutoSpeak
  const autoSpeaker = autoSpeak !== 'off' ? new PersonaChatMessageSpeak(autoSpeak) : null;

  // when an abort controller is set, the UI switches to the "stop" mode
  const abortController = new AbortController();
  cHandler.setAbortController(abortController);


  // stream the assistant's messages directly to the state store
  const aixChatContentGenerateRequest = await historyToChatGenerateRequest(history);
  const messageStatus = await llmGenerateContentStream(
    assistantLlmId,
    aixChatContentGenerateRequest,
    'conversation',
    conversationId,
    parallelViewCount,
    abortController.signal,
    (accumulatedMessage: Partial<StreamMessageUpdate>, messageComplete: boolean) => {
      if (abortController.signal.aborted) return;

      // typing sound
      // if (messageComplete)
      //   AudioGenerator.basicAstralChimes({ volume: 0.4 }, 0, 2, 250);

      cHandler.messageEdit(assistantMessageId, accumulatedMessage, messageComplete, false);

      if (autoSpeaker && accumulatedMessage.fragments?.length && isContentFragment(accumulatedMessage.fragments[0]) && isTextPart(accumulatedMessage.fragments[0].part)) {
        if (messageComplete)
          autoSpeaker.finalizeText(accumulatedMessage.fragments[0].part.text);
        else
          autoSpeaker.handleTextSoFar(accumulatedMessage.fragments[0].part.text);
      }
    },
  );

  // check if aborted
  const hasBeenAborted = abortController.signal.aborted;

  // clear to send, again
  // FIXME: race condition? (for sure!)
  cHandler.setAbortController(null);

  if (autoTitleChat) {
    // fire/forget, this will only set the title if it's not already set
    void autoConversationTitle(conversationId, false);
  }

  if (!hasBeenAborted && (autoSuggestDiagrams || autoSuggestHTMLUI || autoSuggestQuestions))
    autoSuggestions(null, conversationId, assistantMessageId, autoSuggestDiagrams, autoSuggestHTMLUI, autoSuggestQuestions);

  return messageStatus.outcome === 'success';
}


type StreamMessageOutcome = 'success' | 'aborted' | 'errored';
type StreamMessageStatus = { outcome: StreamMessageOutcome, errorMessage?: string };
type StreamMessageUpdate = Pick<DMessage, 'fragments' | 'originLLM' | 'pendingIncomplete'>;

export async function llmGenerateContentStream(
  llmId: DLLMId,
  chatGenerate: AixChatContentGenerateRequest,
  intakeContextName: IntakeContextChatStream['name'],
  intakeContextRef: string,
  parallelViewCount: number, // 0: disable, 1: default throttle (12Hz), 2+ reduce frequency with the square root
  abortSignal: AbortSignal,
  onMessageUpdated: (incrementalMessage: Partial<StreamMessageUpdate>, messageComplete: boolean) => void,
): Promise<StreamMessageStatus> {

  const returnStatus: StreamMessageStatus = { outcome: 'success', errorMessage: undefined };

  const throttler = new ThrottleFunctionCall(parallelViewCount);

  // TODO: should clean this up once we have multi-fragment streaming/recombination
  const incrementalAnswer: StreamMessageUpdate = {
    fragments: [],
  };

  try {

    await aixStreamingChatGenerate(llmId, chatGenerate, intakeContextName, intakeContextRef, abortSignal,
      (update: StreamingClientUpdate, done: boolean) => {

        // grow the incremental message
        if (update.textSoFar) incrementalAnswer.fragments = messageFragmentsReplaceLastContentText(incrementalAnswer.fragments, update.textSoFar);
        if (update.originLLM) incrementalAnswer.originLLM = update.originLLM;
        if (update.typing !== undefined)
          incrementalAnswer.pendingIncomplete = update.typing ? true : undefined;

        // throttle the update
        throttler.handleUpdate(() => {
          onMessageUpdated(incrementalAnswer, false);
        });
      },
    );

  } catch (error: any) {
    if (error?.name !== 'AbortError') {
      console.error('Fetch request error:', error);
      const errorText = ` [Issue: ${error.message || (typeof error === 'string' ? error : 'Chat stopped.')}]`;
      incrementalAnswer.fragments = messageFragmentsReplaceLastContentText(incrementalAnswer.fragments, errorText, true);
      returnStatus.outcome = 'errored';
      returnStatus.errorMessage = error.message;
    } else
      returnStatus.outcome = 'aborted';
  }

  // Ensure the last content is flushed out, and mark as complete
  throttler.finalize(() => {
    onMessageUpdated({ ...incrementalAnswer, pendingIncomplete: undefined }, true);
  });

  return returnStatus;
}


export class ThrottleFunctionCall {
  private readonly throttleDelay: number;
  private lastCallTime: number = 0;

  constructor(throttleUnits: number) {
    // 12 messages per second works well for 60Hz displays (single chat, and 24 in 4 chats, see the square root below)
    const baseDelayMs = 1000 / 12;
    this.throttleDelay = throttleUnits === 0 ? 0
      : throttleUnits > 1 ? Math.round(baseDelayMs * Math.sqrt(throttleUnits))
        : baseDelayMs;
  }

  handleUpdate(fn: () => void): void {
    const now = Date.now();
    if (this.throttleDelay === 0 || this.lastCallTime === 0 || now - this.lastCallTime >= this.throttleDelay) {
      fn();
      this.lastCallTime = now;
    }
  }

  finalize(fn: () => void): void {
    fn(); // Always execute the final update
  }
}