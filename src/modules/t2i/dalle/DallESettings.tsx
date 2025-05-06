import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';

import { FormControl, Option, Select, Switch, Typography } from '@mui/joy';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';

import { FormLabelStart } from '~/common/components/forms/FormLabelStart';
import { FormRadioControl } from '~/common/components/forms/FormRadioControl';
import { Link } from '~/common/components/Link';
import { useToggleableBoolean } from '~/common/util/hooks/useToggleableBoolean';
import { clientEnv } from '~/modules/env/env.client';

import { DALLE_DEFAULT_IMAGE_SIZE, DalleImageSize, useDalleStore } from './store-module-dalle';
import { openAIImageModelsPricing } from './openaiGenerateImages';


export function DallESettings() {

  // state
  const advanced = useToggleableBoolean(false, 'DallESettings');

  // external state
  const { dalleModelId, setDalleModelId, dalleQuality, setDalleQuality, dalleSize, setDalleSize, dalleStyle, setDalleStyle, dalleNoRewrite, setDalleNoRewrite } = useDalleStore(useShallow(state => ({
    dalleModelId: state.dalleModelId, setDalleModelId: state.setDalleModelId,
    dalleQuality: state.dalleQuality, setDalleQuality: state.setDalleQuality,
    dalleSize: state.dalleSize, setDalleSize: state.setDalleSize,
    dalleStyle: state.dalleStyle, setDalleStyle: state.setDalleStyle,
    dalleNoRewrite: state.dalleNoRewrite, setDalleNoRewrite: state.setDalleNoRewrite,
  })));

  const handleDalleQualityChange = (event: React.ChangeEvent<HTMLInputElement>) => setDalleQuality(event.target.checked ? 'hd' : 'standard');

  const handleDalleNoRewriteChange = (event: React.ChangeEvent<HTMLInputElement>) => setDalleNoRewrite(!event.target.checked);

  const handleResolutionChange = (_event: any, value: DalleImageSize | null) => value && setDalleSize(value);

  const isDallE3 = dalleModelId === 'dall-e-3';
  const isHD = dalleQuality === 'hd' && isDallE3;

  const resolutions: DalleImageSize[] = dalleModelId === 'dall-e-2'
    ? ['256x256', '512x512', '1024x1024']
    : ['1024x1024', '1792x1024', '1024x1792'];
  const hasResolution = resolutions.includes(dalleSize);

  const costPerImage = openAIImageModelsPricing(dalleModelId, dalleQuality, dalleSize);

  // Check if DALL-E 3 is configured
  const isDallE3Configured = !!clientEnv.DALL_E_3_ENDPOINT && !!clientEnv.DALL_E_3_API_KEY;

  // Force DALL-E 3 if configured
  React.useEffect(() => {
    if (isDallE3Configured && dalleModelId !== 'dall-e-3') {
      setDalleModelId('dall-e-3');
    }
  }, [isDallE3Configured, dalleModelId, setDalleModelId]);

  return <>
    <FormRadioControl
      title='Model'
      description={dalleModelId === 'dall-e-2' ? 'Older' : 'Newer'}
      options={[
        { value: 'dall-e-2', label: 'DALL·E 2', disabled: isDallE3Configured },
        { value: 'dall-e-3', label: 'DALL·E 3' },
      ]}
      value={isDallE3Configured ? 'dall-e-3' : dalleModelId}
      onChange={setDalleModelId}
    />

    {isDallE3 && <FormRadioControl
      title='Style'
      description={(isDallE3 && dalleStyle === 'vivid') ? 'Hyper-Real' : 'Realistic'}
      disabled={!isDallE3}
      options={[
        { value: 'natural', label: 'Natural' },
        { value: 'vivid', label: 'Vivid' },
      ]}
      value={isDallE3 ? dalleStyle : 'natural'}
      onChange={setDalleStyle}
    />}

    <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <FormLabelStart
        title='Resolution'
        description={!hasResolution
          ? 'Unsupported'
          : dalleSize === DALLE_DEFAULT_IMAGE_SIZE ? 'Default' : 'Custom'
        }
      />
      <Select
        variant='outlined'
        value={dalleSize}
        onChange={handleResolutionChange}
        startDecorator={hasResolution ? undefined : <WarningRoundedIcon color='warning' />}
        slotProps={{
          root: { sx: { minWidth: '140px' } },
          indicator: { sx: { opacity: 0.5 } },
          button: { sx: { whiteSpace: 'inherit' } },
        }}
      >
        {resolutions.map((resolution) =>
          <Option key={'dalle-res-' + resolution} value={resolution}>
            {resolution.replace('x', ' x ')}
          </Option>,
        )}
      </Select>
    </FormControl>

    {isDallE3 && (
      <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <FormLabelStart
          title='Quality'
          description={isHD ? 'High Definition' : 'Standard'}
        />
        <Switch
          checked={isHD}
          onChange={handleDalleQualityChange}
          endDecorator={isHD ? 'HD' : 'Standard'}
          slotProps={{
            endDecorator: {
              sx: { minWidth: 40 },
            },
          }}
        />
      </FormControl>
    )}

    {advanced && (
      <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <FormLabelStart
          title='Prompt Rewrite'
          description={dalleNoRewrite ? 'Disabled' : 'Enabled'}
        />
        <Switch
          checked={!dalleNoRewrite}
          onChange={handleDalleNoRewriteChange}
          endDecorator={dalleNoRewrite ? 'Off' : 'On'}
          slotProps={{
            endDecorator: {
              sx: { minWidth: 24 },
            },
          }}
        />
      </FormControl>
    )}

    <Typography level='body-sm'>
      Cost per image: ${costPerImage}
    </Typography>
  </>;
}
