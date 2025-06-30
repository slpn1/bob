import * as React from 'react';
import Router from 'next/router';

import type { SxProps } from '@mui/joy/styles/types';
import { Divider, Dropdown, ListDivider, ListItem, ListItemButton, ListItemDecorator, Menu, MenuButton, MenuItem, Tooltip, Typography } from '@mui/joy';
import CodeIcon from '@mui/icons-material/Code';
import HistoryIcon from '@mui/icons-material/History';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';

import { blocksRenderHTMLIFrameCss } from '~/modules/blocks/code/code-renderers/RenderCodeHtmlIFrame';

import { BuildInfoCard } from '../../../../apps/news/AppNews';

import { BaseProduct } from '~/common/app.release';
import { BigAgiSquircleIcon } from '~/common/components/icons/big-agi/BigAgiSquircleIcon';
import { FeatureBadge } from '~/common/components/FeatureBadge';
import { GoodModal } from '~/common/components/modals/GoodModal';
import { PhSquaresFour } from '~/common/components/icons/phosphor/PhSquaresFour';
import { checkDivider, checkVisibileIcon, NavItemApp, navItems } from '~/common/app.nav';
import { themeZIndexDesktopNav } from '~/common/app.theme';
import { useHasLLMs } from '~/common/stores/llms/llms.hooks';
import { useOverlayComponents } from '~/common/layout/overlays/useOverlayComponents';

import { BringTheLove } from './BringTheLove';
import { DesktopNavGroupBox, DesktopNavIcon, navItemClasses } from './DesktopNavIcon';
import { InvertedBar, InvertedBarCornerItem } from '../InvertedBar';
import { optimaActions, optimaOpenModels, optimaOpenPreferences, optimaToggleDrawer, useOptimaDrawerOpen, useOptimaDrawerPeeking, useOptimaModals } from '../useOptima';
import { scratchClipSupported, useScratchClipVisibility } from '../scratchclip/store-scratchclip';


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