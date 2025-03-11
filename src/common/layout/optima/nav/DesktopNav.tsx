import * as React from 'react';
import Router from 'next/router';

import type { SxProps } from '@mui/joy/styles/types';
import { Divider, Dropdown, ListItemDecorator, Menu, MenuButton, MenuItem, Tooltip } from '@mui/joy';
import MenuIcon from '@mui/icons-material/Menu';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

import { BigAgiSquircleIcon } from '~/common/components/icons/big-agi/BigAgiSquircleIcon';
import { checkDivider, checkVisibileIcon, NavItemApp, navItems } from '~/common/app.nav';
import { themeZIndexDesktopNav } from '~/common/app.theme';
import { useHasLLMs } from '~/common/stores/llms/llms.hooks';

import { BringTheLove } from './BringTheLove';
import { DesktopNavGroupBox, DesktopNavIcon, navItemClasses } from './DesktopNavIcon';
import { InvertedBar, InvertedBarCornerItem } from '../InvertedBar';
import { optimaOpenModels, optimaOpenPreferences, optimaToggleDrawer, useOptimaDrawerOpen, useOptimaModals } from '../useOptima';


const desktopNavBarSx: SxProps = {
  zIndex: themeZIndexDesktopNav,
};

const bottomGroupSx: SxProps = {
  mb: 'calc(2 * var(--GroupMarginY))',
};

const navItemsDividerSx: SxProps = {
  my: 1,
  width: '50%',
  mx: 'auto',
};


export function DesktopNav(props: { component: React.ElementType, currentApp?: NavItemApp }) {
  // Return null to completely hide the vertical purple bar
  return null;
}