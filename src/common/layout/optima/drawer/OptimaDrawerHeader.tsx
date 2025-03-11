import * as React from 'react';

import type { SxProps } from '@mui/joy/styles/types';
import { Box, IconButton, Typography } from '@mui/joy';

import { Link } from '~/common/components/Link';
import { OPTIMA_DRAWER_BACKGROUND } from '../optima.config';

import Image from 'next/image';


export const OptimaDrawerHeader = (props: {
  title: string,
  onClose: () => void,
  onTitleClick?: () => void,
  sx?: SxProps,
  children?: React.ReactNode,
}) =>
  <Box
    // variant='soft'
    // invertedColors
    sx={{
      minHeight: 'var(--AGI-Nav-width)',
      px: 1,

      // style
      backgroundColor: OPTIMA_DRAWER_BACKGROUND,
      // borderLeft: 'none',
      // borderRight: 'none',
      // borderTop: 'none',
      // borderTopRightRadius: OPTIMA_DRAWER_MOBILE_RADIUS,

      // layout
      display: 'flex',
      alignItems: 'start',
      justifyContent: 'start',
    }}
  >

    {props.children || <IconButton disabled />}

    <Box sx={{ marginTop: '2em' }}>
      <Image src='/images/sg-logo.png' alt='logo' width={33} height={50} />
    </Box>

    <IconButton disabled sx={{ visibility: 'hidden' }} />

  </Box>;