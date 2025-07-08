import { defaultSystemPurposeId, SystemPurposeId } from '../../../data';

import { agiUuid } from '~/common/util/idUtils';

import { DMessage, DMessageId, duplicateDMessage, createDMessageTextContent } from './chat.message';
import { DLLM, LLM_IF_Tools_WebSearch } from '../llms/llms.types';
import { createTextContentFragment } from './chat.fragments';


/// Conversation

export interface DConversation {
  id: DConversationId;                // unique identifier for this conversation

  messages: DMessage[];               // linear list of messages in this conversation

  // editable
  userTitle?: string;
  autoTitle?: string;

  isArchived?: boolean;               // TODO: this is too simple - convert to improved meta information - for now this will do

  // temp flags
  _isIncognito?: boolean;             // simple implementation: won't store this conversation (note: side effects should be evaluated, images seem to be gc'd correctly, but not sure if this is really incognito)
  userSymbol?: string;                // TODO: let the user customize this - there may be a mapping elsewhere, but this is small enough and will do for now

  // TODO: [x Head] - this should be the system purpose of current head of the conversation
  // there should be the concept of the audience of the current head
  systemPurposeId: SystemPurposeId;   // system purpose of this conversation

  // when updated is null, we don't have messages yet (timestamps as Date.now())
  created: number;                    // creation timestamp
  updated: number | null;             // last update timestamp

  // TODO: @deprecated - should be a view-related cache
  tokenCount: number;                 // f(messages, llmId)

  // Not persisted, used while in-memory, or temporarily by the UI
  // TODO: @deprecated - shouls not be in here - it's actually a per-message/operation thing
  _abortController: AbortController | null;

  // future additions:
  // draftUserMessage?: { text: string; attachments: any[] };
  // isMuted: boolean; isStarred: boolean;
  // participants: personaIds...[];
}

export type DConversationId = string;


// helpers - welcome message

export function createWelcomeMessage(model: DLLM): DMessage {
  // Enhanced web search detection: check both interface and model name
  const hasWebSearchInterface = model.interfaces?.includes(LLM_IF_Tools_WebSearch) ?? false;
  const hasSearchInName = model.label?.toLowerCase().includes('search') ?? false;
  const hasWebSearchCapability = hasWebSearchInterface || hasSearchInName;
  
  // Clean model name (remove emojis and extra symbols)
  const cleanModelName = model.label?.replace(/[🌐🎁💎💰⏱️🔓🧩]/g, '').trim() || model.id;
  
  // Format cutoff date
  const cutoffDate = model.trainingDataCutoff || 'unknown';
  
  let messageText: string;
  
  if (hasWebSearchCapability) {
    messageText = `Hello, I am **${cleanModelName}** with web search capabilities. I can access current information from the web, so I'm not limited by a training cutoff date. If you would like to know more about this model please [click here](#model-info).`;
  } else {
    messageText = `Hello, I am **${cleanModelName}** and my cutoff date is **${cutoffDate}**. If you ask me for information past that date I may hallucinate. If you are looking for current news, pick a model with a world symbol next to it. If you would like to know more about this model please [click here](#model-info).`;
  }
  
  // Create the message with a clickable "here" link
  // Use 'assistant' role so the message is visible (system messages are filtered out by default)
  const welcomeMessage = createDMessageTextContent('assistant', messageText);
  
  // Add generator metadata to make it look like a proper assistant message
  welcomeMessage.generator = {
    mgt: 'aix',
    name: cleanModelName,
    aix: {
      vId: model.vId,
      mId: model.id,
    },
  };
  
  // Set updated timestamp to make it look complete
  welcomeMessage.updated = Date.now();
  
  return welcomeMessage;
}

// helpers - creation

export function createDConversation(systemPurposeId?: SystemPurposeId): DConversation {
  return {
    id: agiUuid('chat-dconversation'),

    messages: [],

    // absent
    // userTitle: undefined,
    // autoTitle: undefined,
    // userSymbol: undefined,
    // isArchived: undefined,

    // @deprecated
    systemPurposeId: systemPurposeId || defaultSystemPurposeId,
    // @deprecated
    tokenCount: 0,

    created: Date.now(),
    updated: Date.now(),

    _abortController: null,
  };
}

export function duplicateDConversation(conversation: DConversation, lastMessageId: undefined | DMessageId, skipVoid: boolean): DConversation {

  // cut short messages, if requested
  let messagesToKeep = conversation.messages.length; // By default, include all messages if messageId is null
  if (lastMessageId) {
    const messageIndex = conversation.messages.findIndex(_m => _m.id === lastMessageId);
    if (messageIndex >= 0)
      messagesToKeep = messageIndex + 1;
  }

  // auto-increment title (1)
  const newTitle = getNextBranchTitle(conversationTitle(conversation));

  return {
    id: agiUuid('chat-dconversation'),

    messages: conversation.messages
      .slice(0, messagesToKeep)
      .map(message => duplicateDMessage(message, skipVoid)), // [*] duplicate conversation - see downstream

    // userTitle: conversation.userTitle, // undefined
    autoTitle: newTitle,
    userSymbol: conversation.userSymbol,
    ...(conversation.isArchived !== undefined ? { isArchived: conversation.isArchived } : {}), // copy archival state if set

    systemPurposeId: conversation.systemPurposeId,
    tokenCount: conversation.tokenCount,

    created: conversation.created,
    updated: Date.now(),

    _abortController: null,
  };
}


// helpers - title

export const conversationTitle = (conversation: DConversation, fallback?: string): string =>
  conversation.userTitle || conversation.autoTitle || fallback || ''; // 👋💬🗨️

function getNextBranchTitle(currentTitle: string): string {
  const numberPrefixRegex = /^\((\d+)\)\s+/; // Regex to find "(number) " at the beginning of the title
  const match = currentTitle.match(numberPrefixRegex);

  if (match) {
    const number = parseInt(match[1], 10) + 1;
    return currentTitle.replace(numberPrefixRegex, `(${number}) `);
  } else
    return `(1) ${currentTitle}`;
}


// helpers - System Instruction

export function hasSystemMessageInHistory(chatHistory: Readonly<DMessage[]>): boolean {
  return !!chatHistory?.length && chatHistory[0].role === 'system';
}

export function isSystemMessageUserEdited(message: DMessage): boolean {
  // make it explicit that '.updated' is the key to check for
  return message.role === 'system' && !!message.updated;
}

export function splitSystemMessageFromHistory(chatHistory: Readonly<DMessage[]>): {
  chatSystemInstruction: DMessage | null,
  chatHistory: Readonly<DMessage[]>,
} {
  const chatSystemInstruction = hasSystemMessageInHistory(chatHistory) ? chatHistory[0] : null;
  return {
    chatSystemInstruction,
    chatHistory: chatSystemInstruction ? chatHistory.slice(1) : chatHistory,
  };
}

export function excludeSystemMessages(messages: Readonly<DMessage[]>, showAll?: boolean): Readonly<DMessage[]> {
  if (showAll) return messages;
  return messages.filter(_m => _m.role !== 'system');
}

export function remapMessagesSysToUsr(messages: Readonly<DMessage[]> | null): DMessage[] {
  return (messages || []).map(_m => _m.role === 'system' ? { ..._m, role: 'user' as const } : _m); // (MUST: [0] is the system message of the original chat) cast system chat messages to the user role
}
