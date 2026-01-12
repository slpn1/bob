import type { FunctionComponent } from 'react';

// Modal icons
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import SettingsIcon from '@mui/icons-material/Settings';

import { PhChats } from '~/common/components/icons/phosphor/PhChats';
import { PhChatsDuotone } from '~/common/components/icons/phosphor/PhChatsDuotone';


// enable to show all items, for layout development
const SHOW_ALL_APPS = false;

const SPECIAL_DIVIDER = '__DIVIDER__';


// Nav items

interface ItemBase {
  name: string,
  icon: FunctionComponent,
  iconActive?: FunctionComponent,
  tooltip?: string,
}

export interface NavItemApp extends ItemBase {
  type: 'app',
  mobileName?: string,
  route: string,
  landingRoute?: string,  // specify a different route than the nextjs page router route, to land to
  barTitle?: string,      // set to override the name as the bar title (unless custom bar content is used)
  hideOnMobile?: boolean, // set to true to hide the icon on mobile, unless this is the active app
  hideIcon?: boolean
    | (() => boolean),    // set to true to hide the icon, unless this is the active app
  hideBar?: boolean,      // set to true to hide the page bar
  hideDrawer?: boolean,   // set to true to hide the drawer
  panelAsMenu?: boolean,  // set to true to use the popup menu as the panel
  hideNav?: boolean
    | (() => boolean),    // set to hide the Nav bar (note: must have a way to navigate back)
  fullWidth?: boolean,    // set to true to override the user preference
  pageBrighter?: boolean, // set to true to make the page brighter (.surface instead of .level1)
  isDev?: boolean,        // show a 'dev mode' badge
  _delete?: boolean,      // delete from the UI
}

export interface NavItemModal extends ItemBase {
  type: 'modal',
  overlayId: 'settings' | 'models',
}

export interface NavItemExtLink extends ItemBase {
  type: 'extLink',
  href: string,
}


export const navItems: {
  apps: NavItemApp[],
  modals: NavItemModal[],
  links: NavItemExtLink[],
} = {

  // User-chosen apps
  apps: [
    {
      name: 'Chat',
      icon: PhChats,
      iconActive: PhChatsDuotone,
      type: 'app',
      route: '/',
      hideIcon: true,
    },
  ],

  // Modals
  modals: [
    {
      name: 'Configure AI Models',
      icon: BuildCircleIcon,
      type: 'modal',
      overlayId: 'models',
    },
    {
      name: 'App Preferences',
      icon: SettingsIcon,
      type: 'modal',
      overlayId: 'settings',
    },
  ],

  // External links
  links: [],

};

// apply UI filtering right away - do it here, once, and for all
navItems.apps = navItems.apps.filter(app => !app._delete || SHOW_ALL_APPS);

export function checkDivider(app?: NavItemApp) {
  return app?.name === SPECIAL_DIVIDER;
}

export function checkVisibileIcon(app: NavItemApp, isMobile: boolean, currentApp?: NavItemApp) {
  if(typeof app.hideIcon !== 'function' && app.hideIcon) {
    return false;
  }
  return app.hideOnMobile && isMobile ? false : app === currentApp ? true : typeof app.hideIcon === 'function' ? !app.hideIcon() : !app.hideIcon;
}

export function checkVisibleNav(app?: NavItemApp) {
  return !app ? false : typeof app.hideNav === 'function' ? !app.hideNav() : !app.hideNav;
}
