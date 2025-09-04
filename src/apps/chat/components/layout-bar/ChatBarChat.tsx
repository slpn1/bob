import * as React from 'react';

import { Box, IconButton } from '@mui/joy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import type { DConversationId } from '~/common/stores/chat/chat.conversation';
import type { OptimaBarControlMethods } from '~/common/layout/optima/bar/OptimaBarDropdown';
import { GoodTooltip } from '~/common/components/GoodTooltip';
import { useLLM } from '~/common/stores/llms/llms.hooks';
import { useModelDomain } from '~/common/stores/llms/hooks/useModelDomain';
import { ModelInfoModal } from '~/modules/llms/models-modal/ModelInfoModal';
import { createWelcomeMessage } from '~/common/stores/chat/chat.conversation';
import { useChatStore } from '~/common/stores/chat/store-chats';
import { useOptimaModals, optimaActions } from '~/common/layout/optima/useOptima';

import { useChatLLMDropdown } from './useLLMDropdown';
import { usePersonaIdDropdown } from './usePersonaDropdown';
import { useFolderDropdown } from './useFolderDropdown';


export function ChatBarChat(props: {
  conversationId: DConversationId | null;
  llmDropdownRef: React.Ref<OptimaBarControlMethods>;
  personaDropdownRef: React.Ref<OptimaBarControlMethods>;
}) {

  // external state
  const { showModelInfo } = useOptimaModals();
  const { chatLLMDropdown } = useChatLLMDropdown(props.llmDropdownRef);
  const { personaDropdown } = usePersonaIdDropdown(props.conversationId, props.personaDropdownRef);
  const { folderDropdown } = useFolderDropdown(props.conversationId);
  
  // Get current model for info display
  const { domainModelId: chatLLMId } = useModelDomain('primaryChat');
  const chatLLM = useLLM(chatLLMId) ?? null;

  // Track model changes and add welcome messages to active conversations
  const prevChatLLMId = React.useRef<string | null>(null);
  React.useEffect(() => {
    // Only add welcome message if:
    // 1. Model actually changed (not initial load)
    // 2. There's an active conversation
    // 3. The conversation has existing messages (not a new chat)
    if (prevChatLLMId.current && 
        prevChatLLMId.current !== chatLLMId && 
        props.conversationId && 
        chatLLM) {
      
      const conversation = useChatStore.getState().conversations.find(c => c.id === props.conversationId);
      if (conversation && conversation.messages.length > 0) {
        try {
          const welcomeMessage = createWelcomeMessage(chatLLM);
          useChatStore.getState().appendMessage(props.conversationId, welcomeMessage);
        } catch (error) {
          console.warn('Could not add model change welcome message:', error);
        }
      }
    }
    
    // Update the previous model ID
    prevChatLLMId.current = chatLLMId;
  }, [chatLLMId, props.conversationId, chatLLM]);

  // handlers
  const handleShowModelInfo = React.useCallback(() => {
    optimaActions().openModelInfo();
  }, []);

  const handleHideModelInfo = React.useCallback(() => {
    optimaActions().closeModelInfo();
  }, []);

  return <>

    {/* Persona selector */}
    {/* {personaDropdown} */}

    {/* Model selector with info button */}
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {chatLLMDropdown}
      
      {chatLLM && (
        <GoodTooltip title="Model Information">
          <IconButton
            size="sm"
            variant="plain"
            color="neutral"
            onClick={handleShowModelInfo}
            sx={{
              color: 'rgba(255 255 255 / 0.7)',
              '&:hover': {
                color: 'rgba(255 255 255 / 1)',
                backgroundColor: 'rgba(255 255 255 / 0.1)',
              },
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 'lg' }} />
          </IconButton>
        </GoodTooltip>
      )}
    </Box>

    {/* Folder selector */}
    {folderDropdown}

    {/* Model Info Modal */}
    <ModelInfoModal
      open={showModelInfo}
      onClose={handleHideModelInfo}
      model={chatLLM}
    />

  </>;
}
