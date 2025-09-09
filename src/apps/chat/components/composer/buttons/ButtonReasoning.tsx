import * as React from 'react';

import { Box, Button, ColorPaletteProp, IconButton, Tooltip, Menu, MenuButton, MenuItem, ListItemDecorator, Dropdown } from '@mui/joy';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

import { KeyStroke } from '~/common/components/KeyStroke';
import { buttonAttachSx } from '~/common/components/ButtonAttachFiles';
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";


type ReasoningLevel = 'minimal' | 'low' | 'medium' | 'high';

const REASONING_OPTIONS: Array<{ value: ReasoningLevel; label: string }> = [
  {value: 'minimal', label: 'Minimal'},
  {value: 'low', label: 'Low'},
  {value: 'medium', label: 'Medium'},
  {value: 'high', label: 'High'}
];

export const ButtonReasoningMemo = React.memo(ButtonReasoning);

function ButtonReasoning(props: {
  color?: ColorPaletteProp,
  isMobile?: boolean,
  disabled?: boolean,
  fullWidth?: boolean,
  noToolTip?: boolean,
  value?: ReasoningLevel,
  onValueChange?: (value: ReasoningLevel) => void,
  onAttachClipboard: () => void,
}) {
  const currentValue = props.value || 'medium';
  const displayLabel = REASONING_OPTIONS.find(opt => opt.value === currentValue)?.label || 'Medium';
  return props.isMobile ? (
    <Dropdown>
      <MenuButton
        slots={{ root: IconButton }}
        slotProps={{ root: { color: props.color, disabled: props.disabled } }}
      >
        <SchoolRoundedIcon />
      </MenuButton>
      <Menu placement="bottom-start" size="sm">
        {REASONING_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={currentValue === option.value}
            onClick={() => props.onValueChange?.(option.value)}
          >
            <ListItemDecorator>
              {currentValue === option.value && <CheckRoundedIcon />}
            </ListItemDecorator>
            {option.label}
          </MenuItem>
        ))}
      </Menu>
    </Dropdown>
  ) : (
    <Tooltip arrow disableInteractive placement='top-start' title={props.noToolTip ? null : (
      <Box sx={buttonAttachSx.tooltip}>
        <b>Reasoning</b><br />
        Choose your reasoning level<br />
        <KeyStroke combo='Ctrl + Shift + V' sx={{ mt: 1, mb: 0.5 }} />
      </Box>
    )}>
      <Dropdown>
        <MenuButton
          slots={{ root: Button }}
          slotProps={{
            root: {
              variant: props.color ? 'soft' : 'plain',
              color: props.color || 'neutral',
              disabled: props.disabled,
              fullWidth: props.fullWidth,
              startDecorator: <SchoolRoundedIcon />,
                sx: {
                    ...buttonAttachSx.desktop,
                    '&:active:hover': {
                        'color': '#fff',
                    },
                    'text-align': 'left',
                },
            }
          }}
        >
          Reasoning: {displayLabel}
        </MenuButton>
        <Menu placement="bottom-start" size="sm">
          {REASONING_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              selected={currentValue === option.value}
              onClick={() => props.onValueChange?.(option.value)}
              sx={{
                  "&.Mui-selected": { color: 'white' },
                  "&:active:hover": { color: 'white' }
              }}

            >
              <ListItemDecorator>
                {currentValue === option.value && <CheckRoundedIcon />}
              </ListItemDecorator>
              {option.label}
            </MenuItem>
          ))}
        </Menu>
      </Dropdown>
    </Tooltip>
  );
}
