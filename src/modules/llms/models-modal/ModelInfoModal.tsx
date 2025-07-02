import * as React from 'react';

import { Box, Divider, Modal, ModalClose, ModalDialog, Typography } from '@mui/joy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TokenIcon from '@mui/icons-material/Token';

import type { DLLM } from '~/common/stores/llms/llms.types';
import { getModelDescription } from './ModelDescriptions';

interface ModelInfoModalProps {
  open: boolean;
  onClose: () => void;
  model: DLLM | null;
}

export function ModelInfoModal({ open, onClose, model }: ModelInfoModalProps) {
  if (!model) return null;

  const contextTokens = model.contextTokens;
  const maxOutputTokens = model.maxOutputTokens;
  const description = getModelDescription(model.id);
  const hasContextInfo = contextTokens !== null && contextTokens !== undefined;
  const hasOutputInfo = maxOutputTokens !== null && maxOutputTokens !== undefined;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ minWidth: 400, maxWidth: 600 }}>
        <ModalClose />
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <InfoOutlinedIcon color="primary" />
          <Typography level="h4" component="h2">
            Model Information
          </Typography>
        </Box>

        {/* Model Name */}
        <Box sx={{ mb: 2 }}>
          <Typography level="title-lg" sx={{ fontWeight: 600 }}>
            {model.userLabel || model.label}
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.tertiary', mt: 0.5 }}>
            Model ID: {model.id}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Context Window Information */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <TokenIcon color="primary" sx={{ fontSize: 'lg' }} />
            <Typography level="title-md">Context Window</Typography>
          </Box>
          
          {hasContextInfo ? (
            <Box sx={{ pl: 3 }}>
              <Typography level="body-lg" sx={{ fontWeight: 600, color: 'primary.500' }}>
                {contextTokens.toLocaleString()} tokens
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Maximum number of tokens this model can process in a single request
              </Typography>
              
              {hasOutputInfo && (
                <Typography level="body-sm" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Max output: {maxOutputTokens.toLocaleString()} tokens
                </Typography>
              )}
            </Box>
          ) : (
            <Typography level="body-md" sx={{ pl: 3, color: 'text.tertiary' }}>
              Context window information not available
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Model Description */}
        <Box>
          <Typography level="title-md" sx={{ mb: 1 }}>
            Description
          </Typography>
          <Typography level="body-md" sx={{ lineHeight: 1.6 }}>
            {description}
          </Typography>
        </Box>

        {/* Additional Model Information */}
        {(model.trainingDataCutoff || model.pricing) && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box>
              <Typography level="title-md" sx={{ mb: 1 }}>
                Additional Information
              </Typography>
              
              {model.trainingDataCutoff && (
                <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 0.5 }}>
                  Training data cutoff: {model.trainingDataCutoff}
                </Typography>
              )}
              
              {/* {model.pricing && (
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                  Pricing available
                </Typography>
              )} */}
            </Box>
          </>
        )}
      </ModalDialog>
    </Modal>
  );
} 