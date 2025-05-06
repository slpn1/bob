import * as React from 'react';
import { Menu, MenuProps, MenuItem, MenuItemProps, ListItemDecorator, styled, IconButton } from '@mui/joy';
import CloseIcon from '@mui/icons-material/Close';

/**
 * A styled Menu component that matches the dark theme design shown in the mockup.
 * This can be reused throughout the app for consistent styling.
 */
export const StyledMenu = React.forwardRef<HTMLDivElement, MenuProps>((props, ref) => {
  const { children, ...other } = props;
  
  const handleClose = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (props.onClose) {
      // @ts-ignore - The type definition doesn't match the actual implementation
      props.onClose(event, 'closeButtonClick');
    }
  };
  
  // Determine if we need a top or bottom pointer
  const isTopPlacement = props.placement?.startsWith('top') || false;
  
  return (
    <Menu
      ref={ref}
      {...other}
      sx={{
        bgcolor: 'rgba(50, 50, 50, 0.95)',
        color: 'white',
        p: 0,
        borderRadius: '16px',
        boxShadow: 'lg',
        minWidth: '220px',
        '--ListDivider-color': 'rgba(255, 255, 255, 0.2)',
        '--ListItemDecorator-color': 'rgba(255, 255, 255, 0.8)',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: isTopPlacement ? '-8px' : 'auto',
          top: isTopPlacement ? 'auto' : '-8px',
          left: '20px',
          width: '16px',
          height: '16px',
          bgcolor: 'rgba(50, 50, 50, 0.95)',
          transform: 'rotate(45deg)',
          zIndex: -1,
        },
        ...props.sx
      }}
    >
      <IconButton 
        size="sm" 
        variant="plain" 
        color="neutral" 
        onClick={handleClose}
        sx={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px',
          color: 'white',
          '--IconButton-size': '18px',
          opacity: 0.7,
          padding: 0,
          '&:hover': {
            opacity: 1,
            bgcolor: 'transparent',
          }
        }}
      >
        <CloseIcon sx={{ fontSize: '18px', color: 'white' }} />
      </IconButton>
      {children}
    </Menu>
  );
});

StyledMenu.displayName = 'StyledMenu';

/**
 * A styled MenuItem component that matches the dark theme design shown in the mockup.
 */
export const StyledMenuItem = React.forwardRef<HTMLDivElement, MenuItemProps>((props, ref) => {
  const { children, ...other } = props;
  
  return (
    <MenuItem
      ref={ref}
      {...other}
      sx={{ 
        py: 1.5, 
        px: 2,
        color: 'white',
        fontSize: '0.875rem',
        fontWeight: 'normal',
        '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
        ...props.sx
      }}
    >
      {children}
    </MenuItem>
  );
});

StyledMenuItem.displayName = 'StyledMenuItem';

/**
 * A styled header for the menu that displays user email or other information
 */
export const StyledMenuHeader = ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    {...props}
    style={{
      padding: '12px 16px',
      paddingRight: '36px', // Make room for the close button
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      color: 'white',
      fontSize: '0.875rem',
      fontWeight: 'bold',
      ...props.style
    }}
  >
    {children}
  </div>
); 