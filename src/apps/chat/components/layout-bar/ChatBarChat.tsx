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
import { ModelOptionsControls } from './ModelOptionsControls';
import { useModelsStore } from '~/common/stores/llms/store-llms';
import { getAllModelParameterValues } from '~/common/stores/llms/llms.parameters';


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
  const { domainModelId: chatLLMId, assignDomainModelId: setChatLLMId } = useModelDomain('primaryChat');
  const chatLLM = useLLM(chatLLMId) ?? null;
  
  // Model Options State
  const [originalModelId, setOriginalModelId] = React.useState<string | null>(null);
  const updateLLMUserParameters = useModelsStore(state => state.updateLLMUserParameters);
  
  // Get current model parameters
  const modelParameters = React.useMemo(() => {
    if (!chatLLM) return null;
    return getAllModelParameterValues(chatLLM.initialParameters, chatLLM.userParameters);
  }, [chatLLM]);
  
  // Current option values from model parameters
  const webSearchValue = React.useMemo(() => {
    const value = modelParameters?.llmVndOaiWebSearchContext;
    if (value === 'low') return 'low';
    if (value === 'medium') return 'medium'; 
    if (value === 'high') return 'comprehensive';
    return 'off';
  }, [modelParameters]);
  
  const reasoningValue = React.useMemo(() => {
    const value = modelParameters?.llmVndOaiReasoningEffort4 || modelParameters?.llmVndOaiReasoningEffort;
    return (value as 'minimal' | 'low' | 'medium' | 'high') || 'medium';
  }, [modelParameters]);
  
  const deepResearchValue = React.useMemo(() => {
    return chatLLMId?.includes('deep-research') || false;
  }, [chatLLMId]);

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
    prevChatLLMId.current = chatLLMId || null;
  }, [chatLLMId, props.conversationId, chatLLM]);

  // handlers
  const handleShowModelInfo = React.useCallback(() => {
    optimaActions().openModelInfo();
  }, []);

  const handleHideModelInfo = React.useCallback(() => {
    optimaActions().closeModelInfo();
  }, []);

  // Model Options Handlers
  const handleWebSearchChange = React.useCallback((value: 'off' | 'low' | 'medium' | 'comprehensive') => {
    if (!chatLLMId) return;
    
    const paramValue = value === 'off' ? undefined : 
      value === 'comprehensive' ? 'high' : value;
    
    updateLLMUserParameters(chatLLMId, {
      llmVndOaiWebSearchContext: paramValue
    });
  }, [chatLLMId, updateLLMUserParameters]);

  const handleReasoningChange = React.useCallback((value: 'minimal' | 'low' | 'medium' | 'high') => {
    if (!chatLLMId) return;
    
    // Use the newer parameter format if model supports it, otherwise fallback
    const paramKey = modelParameters?.llmVndOaiReasoningEffort4 !== undefined 
      ? 'llmVndOaiReasoningEffort4' 
      : 'llmVndOaiReasoningEffort';
      
    updateLLMUserParameters(chatLLMId, {
      [paramKey]: value
    });
  }, [chatLLMId, modelParameters, updateLLMUserParameters]);

  const handleDeepResearchChange = React.useCallback((enabled: boolean) => {
    if (!chatLLMId) return;
    
    if (enabled) {
      // Store original model if switching to deep research
      if (!chatLLMId.includes('deep-research')) {
        setOriginalModelId(chatLLMId);
        // Switch to the deep research variant
        const deepResearchModelId = 'gpt-5-deep-reasoning';
        setChatLLMId(deepResearchModelId);
      }
    } else {
      // Switch back to original model
      if (originalModelId && chatLLMId.includes('deep-research')) {
        setChatLLMId(originalModelId);
        setOriginalModelId(null);
      }
    }
  }, [chatLLMId, originalModelId, setChatLLMId]);
  
  // Determine if options should be disabled (Knowledge Central)
  const optionsDisabled = chatLLMId === 'knowledge-central-chat';

  return <>

    {/* Persona selector */}
    {/* {personaDropdown} */}

    {/* New Layout: Model selector on left, options in middle */}
    {/*<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>*/}
      
      {/* Left Side: Model Dropdown */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5}}>
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

      {/* Center: Model Options */}
      {/*<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>*/}
      {/*  <ModelOptionsControls*/}
      {/*    webSearch={webSearchValue}*/}
      {/*    reasoning={reasoningValue}*/}
      {/*    deepResearch={deepResearchValue}*/}
      {/*    disabled={optionsDisabled}*/}
      {/*    onWebSearchChange={handleWebSearchChange}*/}
      {/*    onReasoningChange={handleReasoningChange}*/}
      {/*    onDeepResearchChange={handleDeepResearchChange}*/}
      {/*  />*/}
      {/*</Box>*/}

      {/*/!* Right Side: Empty space for balance *!/*/}
      {/*<Box sx={{ flex: '1 1 0' }} />*/}
      
    {/*</Box>*/}

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
