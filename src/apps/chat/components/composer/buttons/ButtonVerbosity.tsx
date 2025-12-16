import * as React from 'react';

import { Box, Button, ColorPaletteProp, IconButton, Tooltip, Menu, MenuButton, MenuItem, ListItemDecorator, Dropdown } from '@mui/joy';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ShortTextRoundedIcon from '@mui/icons-material/ShortTextRounded';

import { buttonAttachSx } from '~/common/components/ButtonAttachFiles';


type VerbosityLevel = 'low' | 'medium' | 'high';

const VERBOSITY_OPTIONS: Array<{ value: VerbosityLevel; label: string }> = [
  {value: 'low', label: 'Concise'},
  {value: 'medium', label: 'Balanced'},
  {value: 'high', label: 'Detailed'}
];

export const ButtonVerbosityMemo = React.memo(ButtonVerbosity);

function ButtonVerbosity(props: {
  color?: ColorPaletteProp,
  isMobile?: boolean,
  disabled?: boolean,
  fullWidth?: boolean,
  noToolTip?: boolean,
  value?: VerbosityLevel,
  onValueChange?: (value: VerbosityLevel) => void,
}) {
  const currentValue = props.value || 'medium';
  const displayLabel = VERBOSITY_OPTIONS.find(opt => opt.value === currentValue)?.label || 'Balanced';
  return props.isMobile ? (
    <Dropdown>
      <MenuButton
        slots={{ root: IconButton }}
        slotProps={{ root: { color: props.color, disabled: props.disabled } }}
      >
        <ShortTextRoundedIcon />
      </MenuButton>
      <Menu placement="bottom-start" size="sm">
        {VERBOSITY_OPTIONS.map((option) => (
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
        <b>Response Length</b><br />
        Control how detailed responses should be. Concise for quick answers, Detailed for comprehensive explanations.<br />
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
              startDecorator: <ShortTextRoundedIcon />,
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
          Length: {displayLabel}
        </MenuButton>
        <Menu placement="bottom-start" size="sm">
          {VERBOSITY_OPTIONS.map((option) => (
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
