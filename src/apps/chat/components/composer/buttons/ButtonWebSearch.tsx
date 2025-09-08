import * as React from 'react';

import { Box, Button, ColorPaletteProp, IconButton, Tooltip, Menu, MenuButton, MenuItem, ListItemDecorator, Dropdown } from '@mui/joy';
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';

import { KeyStroke } from '~/common/components/KeyStroke';
import { buttonAttachSx } from '~/common/components/ButtonAttachFiles';
import LanguageRoundedIcon from "@mui/icons-material/LanguageRounded";


type WebSearchLevel = 'off' | 'low' | 'medium' | 'comprehensive';

const WEB_SEARCH_OPTIONS: Array<{ value: WebSearchLevel; label: string }> = [
  {value: 'off', label: 'Off'},
  {value: 'low', label: 'Low'},
  {value: 'medium', label: 'Medium'},
  {value: 'comprehensive', label: 'Comprehensive'}
];

export const ButtonWebSearchMemo = React.memo(ButtonWebSearch);

function ButtonWebSearch(props: {
  color?: ColorPaletteProp,
  isMobile?: boolean,
  disabled?: boolean,
  fullWidth?: boolean,
  noToolTip?: boolean,
  value?: WebSearchLevel,
  onValueChange?: (value: WebSearchLevel) => void,
  onAttachClipboard: () => void,
}) {
  const currentValue = props.value || 'off';
  const displayLabel = props.disabled ? 'N/A' : (WEB_SEARCH_OPTIONS.find(opt => opt.value === currentValue)?.label || 'Off');
  return props.isMobile ? (
    <Dropdown>
      <MenuButton
        slots={{ root: IconButton }}
        slotProps={{ root: { color: props.color, disabled: props.disabled } }}
      >
        <LanguageRoundedIcon />
      </MenuButton>
      {!props.disabled && (
        <Menu placement="bottom-start" size="sm">
          {WEB_SEARCH_OPTIONS.map((option) => (
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
      )}
    </Dropdown>
  ) : (
    <Tooltip arrow disableInteractive placement='top-start' title={props.noToolTip ? null : (
      <Box sx={buttonAttachSx.tooltip}>
        <b>Web Search</b><br />
        {props.disabled ? 'Web search is not available when reasoning is set to minimal' : 'Choose your web search level'}<br />
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
              startDecorator: <LanguageRoundedIcon />,
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
          Web Search: {displayLabel}
        </MenuButton>
        {!props.disabled && (
          <Menu placement="bottom-start" size="sm">
            {WEB_SEARCH_OPTIONS.map((option) => (
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
        )}
      </Dropdown>
    </Tooltip>
  );
}
