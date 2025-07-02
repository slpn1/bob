import * as React from 'react';

import { Box, Divider, Modal, ModalClose, ModalDialog, Typography } from '@mui/joy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TokenIcon from '@mui/icons-material/Token';

import type { DLLM } from '~/common/stores/llms/llms.types';
import { getModelDescription, getModelInfo } from './ModelDescriptions';

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
      <ModalDialog sx={{ 
        minWidth: 400, 
        maxWidth: 600, 
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <ModalClose />
        
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexShrink: 0 }}>
          <InfoOutlinedIcon color="primary" />
          <Typography level="h4" component="h2">
            Model Information
          </Typography>
        </Box>

        {/* Scrollable Content */}
        <Box sx={{ 
          overflowY: 'auto', 
          overflowX: 'hidden',
          flex: 1,
          pr: 1,
          mr: -1,
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'var(--joy-palette-neutral-100)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'var(--joy-palette-neutral-300)',
            borderRadius: 4,
            '&:hover': {
              backgroundColor: 'var(--joy-palette-neutral-400)',
            },
          },
        }}>
          {/* Model Name */}
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1 }}>
              <Typography level="title-lg" sx={{ fontWeight: 600 }}>
                {model.userLabel || model.label}
              </Typography>
              <Typography level="body-sm" sx={{ color: 'text.tertiary', mt: 0.5 }}>
                Model ID: {model.id}
              </Typography>
            </Box>
            {(() => {
              const modelInfo = getModelInfo(model.id);
              return modelInfo.icon ? (
                <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                  <img 
                    src={modelInfo.icon} 
                    alt="Model type icon"
                    style={{ 
                      width: '128px', 
                      objectFit: 'contain',
                      opacity: 1
                    }} 
                  />
                </Box>
              ) : null;
            })()}
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
            <Box 
              dangerouslySetInnerHTML={{ __html: description }}
              sx={{ 
                lineHeight: 1.6,
                fontSize: 'var(--joy-fontSize-md)',
                color: 'var(--joy-palette-text-primary)',
                '& p': {
                  margin: '0.5em 0',
                  '&:first-of-type': { marginTop: 0 },
                  '&:last-of-type': { marginBottom: 0 },
                },
                '& strong, & b': {
                  fontWeight: 600,
                },
                '& em, & i': {
                  fontStyle: 'italic',
                },
                '& code': {
                  backgroundColor: 'var(--joy-palette-neutral-100)',
                  padding: '0.125rem 0.25rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.875em',
                  fontFamily: 'monospace',
                },
                '& a': {
                  color: 'var(--joy-palette-primary-500)',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                },
                '& ul, & ol': {
                  paddingLeft: '1.5rem',
                  margin: '0.5em 0',
                },
                '& li': {
                  margin: '0.25em 0',
                },
              }}
            />
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
        </Box>
      </ModalDialog>
    </Modal>
  );
} 