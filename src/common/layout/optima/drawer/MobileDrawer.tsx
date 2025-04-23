import * as React from 'react';

import { Box, Drawer, IconButton } from '@mui/joy';
import MenuIcon from '@mui/icons-material/Menu';

import type { NavItemApp } from '~/common/app.nav';

import { OPTIMA_DRAWER_BACKGROUND, OPTIMA_DRAWER_MOBILE_RADIUS } from '../optima.config';
import { optimaCloseDrawer, optimaOpenDrawer, useOptimaDrawerOpen } from '../useOptima';
import { useOptimaPortalOutRef } from '../portals/useOptimaPortalOutRef';


function DrawerContentPortal() {
  const drawerPortalRef = useOptimaPortalOutRef('optima-portal-drawer', 'MobileDrawer');
  return (
    <Box
      ref={drawerPortalRef}
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}
    />
  );
}

export function MobileDrawer(props: { component: React.ElementType, currentApp?: NavItemApp }) {
  // external state
  const isDrawerOpen = useOptimaDrawerOpen();

  /* NOTE on `disableEnforceFocus`:
   * This is a workaround for mobile drawer focus issues, when pressing the 3-dot menu button
   * on the `Search...` input field will flash-and-hide the menu.
   *
   * This prop disables the default focus trap behavior of the Drawer.
   * It allows focus to move freely outside the Drawer, which is useful
   * when the Drawer contains components (like Menus) that need to manage
   * their own focus.
   *
   * This prevents unexpected focus resets to the Drawer content when interacting with
   * nested interactive elements.
   *
   * See also `windowUtils.useDocumentFocusDebugger` for debugging focus issues.
   */
  return (
    <>
      {/* Toggle button - only visible when drawer is closed */}
      {!isDrawerOpen && (
        <IconButton
          onClick={optimaOpenDrawer}
          size="md"
          variant="solid"
          color="primary"
          sx={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1100,
            borderRadius: '50%',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          }}
        >
          <MenuIcon />
        </IconButton>
      )}
      
      <Drawer
        id='mobile-drawer'
        component={props.component}
        disableEnforceFocus
        open={isDrawerOpen}
        onClose={optimaCloseDrawer}
        sx={{
          '--Drawer-horizontalSize': 'min(300px, 80%)',
          '--Drawer-transitionDuration': '0.3s',
          zIndex: 1200,
        }}
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
            }
          },
          content: {
            sx: {
              // style: round the right drawer corners
              backgroundColor: OPTIMA_DRAWER_BACKGROUND,
              borderTopRightRadius: OPTIMA_DRAWER_MOBILE_RADIUS,
              borderBottomRightRadius: OPTIMA_DRAWER_MOBILE_RADIUS,
              boxShadow: '0 0 20px rgba(0,0,0,0.3)',
            },
          },
        }}
      >
        <DrawerContentPortal />
      </Drawer>
    </>
  );
}
