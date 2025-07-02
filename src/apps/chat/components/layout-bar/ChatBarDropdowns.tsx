import * as React from 'react';

import { Box, IconButton } from '@mui/joy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import type { DConversationId } from '~/common/stores/chat/chat.conversation';
import type { OptimaBarControlMethods } from '~/common/layout/optima/bar/OptimaBarDropdown';
import { GoodTooltip } from '~/common/components/GoodTooltip';
import { useLLM } from '~/common/stores/llms/llms.hooks';
import { useModelDomain } from '~/common/stores/llms/hooks/useModelDomain';
import { ModelInfoModal } from '~/modules/llms/models-modal/ModelInfoModal';

import { useChatLLMDropdown } from './useLLMDropdown';
import { usePersonaIdDropdown } from './usePersonaDropdown';
import { useFolderDropdown } from './useFolderDropdown';


export function ChatBarDropdowns(props: {
  conversationId: DConversationId | null;
  llmDropdownRef: React.Ref<OptimaBarControlMethods>;
  personaDropdownRef: React.Ref<OptimaBarControlMethods>;
}) {

  // state
  const [showModelInfo, setShowModelInfo] = React.useState(false);

  // external state
  const { chatLLMDropdown } = useChatLLMDropdown(props.llmDropdownRef);
  const { personaDropdown } = usePersonaIdDropdown(props.conversationId, props.personaDropdownRef);
  const { folderDropdown } = useFolderDropdown(props.conversationId);
  
  // Get current model for info display
  const { domainModelId: chatLLMId } = useModelDomain('primaryChat');
  const chatLLM = useLLM(chatLLMId) ?? null;

  // handlers
  const handleShowModelInfo = React.useCallback(() => {
    setShowModelInfo(true);
  }, []);

  const handleHideModelInfo = React.useCallback(() => {
    setShowModelInfo(false);
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
