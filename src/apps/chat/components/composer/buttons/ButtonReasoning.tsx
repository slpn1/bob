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
  const currentValue = props.value || 'minimal';
  const displayLabel = REASONING_OPTIONS.find(opt => opt.value === currentValue)?.label || 'Minimal';
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
        Choose how much you would like Lumina to think about an answer<br />
      </Box>
    )}>
      <Box sx={{ display: 'inline-block', cursor: props.disabled ? 'not-allowed' : 'default' }}>
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
      </Box>
    </Tooltip>
  );
}
