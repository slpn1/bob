import * as React from 'react';
import { useSession, signOut } from 'next-auth/react';

import { Box, Dropdown, MenuButton, ListItemDecorator, Typography, Avatar, IconButton } from '@mui/joy';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';

import { optimaOpenPreferences } from '~/common/layout/optima/useOptima';
import { StyledMenu, StyledMenuItem, StyledMenuHeader } from './StyledMenu';

// Custom MenuButtonRoot component that filters out ownerState
const MenuButtonRoot = React.forwardRef<HTMLDivElement, any>(({ ownerState, ...props }, ref) => (
  <Box
    ref={ref}
    {...props}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
      cursor: 'pointer',
      width: '100%',
      ...props.sx
    }}
  />
));
MenuButtonRoot.displayName = 'MenuButtonRoot';

/**
 * A reusable user profile menu component that displays user info and provides
 * a dropdown menu with Settings and Log Out options.
 */
export function UserProfileMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);
  
  // Safely access user data with fallbacks
  const userName = session?.user?.name || 'User';
  const userEmail = session?.user?.email || '';
  const userInitial = userName && userName.length > 0 ? userName[0].toUpperCase() : '';
  
  // If not authenticated, show login button
  if (status === 'unauthenticated') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography 
          component="a"
          href="/api/auth/signin"
          level="body-sm" 
          sx={{ 
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline'
            }
          }}
        >
          Sign in
        </Typography>
      </Box>
    );
  }
  
  // If loading, show loading state
  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography level="body-sm" sx={{ color: 'neutral.500' }}>
          Loading...
        </Typography>
      </Box>
    );
  }
  
  // If authenticated, show user info with dropdown menu
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden', position: 'relative' }}>
      <Dropdown open={open} onOpenChange={(_, isOpen) => setOpen(isOpen)}>
        <MenuButton slots={{ root: MenuButtonRoot }}>
          <Avatar
            size="sm"
            variant="soft"
            color="primary"
            sx={{ 
              '--Avatar-size': '28px',
              bgcolor: '#3a2a4d', // Dark purple background to match the image
            }}
          >
            {userInitial || <PersonIcon />}
          </Avatar>
          <Typography 
            level="body-md" 
            sx={{ 
              fontWeight: 'md',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {userName}
          </Typography>
        </MenuButton>
        <StyledMenu 
          placement="top-start"
          sx={{
            mb: 1.5, // Add margin to position the menu correctly
            ml: 0, // Adjust horizontal position
          }}
        >
          <StyledMenuHeader>
            {userEmail}
          </StyledMenuHeader>
          
          <IconButton 
            size="sm" 
            variant="plain" 
            color="neutral" 
            onClick={() => setOpen(false)}
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
          
          <StyledMenuItem onClick={() => optimaOpenPreferences()}>
            <ListItemDecorator sx={{ color: 'white', opacity: 0.7 }}>
              <SettingsIcon fontSize="small" />
            </ListItemDecorator>
            Settings
          </StyledMenuItem>
          
          <StyledMenuItem onClick={() => signOut({ callbackUrl: '/api/auth/signin' })}>
            <ListItemDecorator sx={{ color: 'white', opacity: 0.7 }}>
              <LogoutIcon fontSize="small" />
            </ListItemDecorator>
            Log Out
          </StyledMenuItem>
        </StyledMenu>
      </Dropdown>
    </Box>
  );
} 