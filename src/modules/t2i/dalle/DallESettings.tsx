import * as React from 'react';

import { FormControl, Option, Select, Slider, Switch, Typography } from '@mui/joy';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';

import { FormLabelStart } from '~/common/components/forms/FormLabelStart';
import { FormRadioControl } from '~/common/components/forms/FormRadioControl';
import { Link } from '~/common/components/Link';
import { useToggleableBoolean } from '~/common/util/hooks/useToggleableBoolean';
import { clientEnv } from '~/modules/env/env.client';

import { DALLE_DEFAULT_IMAGE_SIZE, DalleImageSize, DalleModelSelection, isGptImage25Model, isGptImageModel, resolveDalleModelId, useDalleStore } from './store-module-dalle';
import { openAIImageModelsPricing } from './openaiGenerateImages';
import { FormChipControl } from '~/common/components/forms/FormChipControl';


const CONF = {

  MODEL_OPTS: [
    { value: 'dall-e-2', label: 'DALL·E 2' },
    { value: 'dall-e-3', label: 'DALL·E 3' },
    { value: 'gpt-image-1', label: 'GPT Image' },
    { value: 'gpt-image-1.5', label: 'GPT Image 1.5' },
    { value: 'gpt-image-2.5-flare', label: '2.5 Fast' },
    { value: 'gpt-image-2.5-sunburst', label: '2.5 Precise' },
    { value: null, label: 'Auto' },
  ] as { value: DalleModelSelection; label: string }[],

  RES_D2: ['256x256', '512x512', '1024x1024'] as DalleImageSize[],
  RES_D3: ['1024x1024', '1792x1024', '1024x1792'] as DalleImageSize[],
  RES_GI: ['auto', '1024x1024', '1536x1024', '1024x1536'] as DalleImageSize[],

  QUALITY_GI: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'auto', label: 'Auto' },
  ],
  QUALITY_GI25: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'xhigh', label: 'X-High' },
    { value: 'max', label: 'Max' },
    { value: 'auto', label: 'Auto' },
  ],
  FIDELITY_GI: [
    { value: 'high', label: 'High' },
    { value: 'low', label: 'Low' },
  ],
  BACKGROUND_GI: [
    // { value: 'opaque', label: 'Opaque' },
    { value: 'transparent', label: 'Transparent' },
    { value: 'auto', label: 'Auto' },
  ],
  OUT_FORMAT_GI: [
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' },
  ],
  MODERATION_GI: [
    { value: 'auto', label: 'Standard' },
    { value: 'low', label: 'Less Strict' },
  ],

  STYLE_D3: [
    { value: 'natural', label: 'Natural' },
    { value: 'vivid', label: 'Vivid' },
  ],

} as const;


export function DallESettings() {

  // state
  const advanced = useToggleableBoolean(false, 'DallESettings');

  // external state
  const {
    dalleModelId, setDalleModelId,
    dalleQualityD3, setDalleQualityD3,
    dalleQualityGI, setDalleQualityGI,
    dalleSizeD3, setDalleSizeD3,
    dalleSizeD2, setDalleSizeD2,
    dalleSizeGI, setDalleSizeGI,
    dalleStyleD3, setDalleStyleD3,
    dalleNoRewrite, setDalleNoRewrite,
    dalleBackgroundGI, setDalleBackgroundGI,
    dalleOutputFormatGI, setDalleOutputFormatGI,
    dalleOutputCompressionGI, setDalleOutputCompressionGI,
    dalleModerationGI, setDalleModerationGI,
    dalleAutoSettings, setDalleAutoSettings,
    dalleUseConversationContext, setDalleUseConversationContext,
    dalleInputFidelityGI, setDalleInputFidelityGI,
  } = useDalleStore();


  const handleDalleQualityD3Change = (event: React.ChangeEvent<HTMLInputElement>) =>
    setDalleQualityD3(event.target.checked ? 'hd' : 'standard');

  const handleDalleNoRewriteChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setDalleNoRewrite(!event.target.checked);

  const handleResolutionD3Change = (_event: any, value: DalleImageSize | null) =>
    value && setDalleSizeD3(value as any);

  const handleResolutionD2Change = (_event: any, value: DalleImageSize | null) =>
    value && setDalleSizeD2(value as any);

  const handleResolutionGIChange = (_event: any, value: DalleImageSize | null) =>
    value && setDalleSizeGI(value as any);

  const handleCompressionChange = (_event: Event, newValue: number | number[]) =>
    setDalleOutputCompressionGI(newValue as number);

  const handleModerationGIChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setDalleModerationGI(!event.target.checked ? 'low' : 'auto');

  const handleAutoSettingsChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setDalleAutoSettings(event.target.checked);

  const handleConversationContextChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setDalleUseConversationContext(event.target.checked);


  // derived state - resolve the actual model
  const resolvedDalleModelId = resolveDalleModelId(dalleModelId);
  const isGI = isGptImageModel(resolvedDalleModelId);
  const isGI25 = isGptImage25Model(resolvedDalleModelId);
  const isD3 = resolvedDalleModelId === 'dall-e-3';
  const isD2 = resolvedDalleModelId === 'dall-e-2';

  // when the director picks the parameters per prompt, the manual controls below are only a fallback
  const autoPicksParams = isGI && dalleAutoSettings;

  const isD3HD = isD3 && dalleQualityD3 === 'hd';


  // Select resolution options based on model

  const resolutions = isD2 ? CONF.RES_D2 : isD3 ? CONF.RES_D3 : CONF.RES_GI;
  const currentResolution = isD2 ? dalleSizeD2 : isD3 ? dalleSizeD3 : dalleSizeGI;
  const hasResolution = resolutions.includes(currentResolution);

  const isGICompressible = dalleOutputFormatGI === 'webp' || dalleOutputFormatGI === 'jpeg';

  const showTransparencyWarning = isGI
    && dalleBackgroundGI === 'transparent'
    && dalleOutputFormatGI !== 'png'
    && dalleOutputFormatGI !== 'webp';

  const costPerImage = openAIImageModelsPricing(resolvedDalleModelId,
    isD3 ? dalleQualityD3 : isGI ? dalleQualityGI : 'standard',
    currentResolution);


  return <>

    <FormChipControl
      title='Model'
      description={dalleModelId === null ? 'Latest, per request' : isGI25 ? 'Latest' : isGI ? 'Previous' : isD3 ? 'Good' : 'Older'}
      tooltip={dalleModelId !== null ? undefined : 'Auto uses GPT Image 2.5 Fast for new images, and GPT Image 2.5 Precise when editing an existing one.'}
      options={CONF.MODEL_OPTS.map(opt => ({ ...opt, value: opt.value || 'auto' }))}
      value={dalleModelId || 'auto'} 
      onChange={(value) => setDalleModelId(value === 'auto' ? null : value as DalleModelSelection)}
    />

    {isGI && <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
      <FormLabelStart title='Auto Settings'
                      description={dalleAutoSettings ? 'Chosen per prompt' : 'Use the settings below'}
                      tooltip='Picks the aspect ratio, quality, background and file format from what you asked for - a poster comes out portrait, a logo comes out square on a transparent background.'
      />
      <Switch checked={dalleAutoSettings} onChange={handleAutoSettingsChange}
              startDecorator={dalleAutoSettings ? 'Auto' : 'Manual'} />
    </FormControl>}

    {isGI && <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
      <FormLabelStart title='Use Chat Images'
                      description={dalleUseConversationContext ? 'Refine across turns' : 'Each image is new'}
                      tooltip='Lets a follow-up such as "make the back panel black" reuse the image it refers to, along with any images you uploaded earlier in the conversation.'
      />
      <Switch checked={dalleUseConversationContext} onChange={handleConversationContextChange}
              startDecorator={dalleUseConversationContext ? 'On' : 'Off'} />
    </FormControl>}

    <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
      <FormLabelStart title='Resolution'
                      description={autoPicksParams
                        ? 'Chosen per prompt'
                        : !hasResolution
                          ? 'Unsupported'
                          : currentResolution === 'auto' ? 'Automatic'
                            : currentResolution === DALLE_DEFAULT_IMAGE_SIZE ? 'Default' : 'Custom'
                      } />
      <Select
        variant='outlined'
        disabled={autoPicksParams}
        // color='primary'
        value={currentResolution}
        onChange={isD2 ? handleResolutionD2Change : isD3 ? handleResolutionD3Change : handleResolutionGIChange}
        startDecorator={hasResolution ? undefined : <WarningRoundedIcon color='warning' />}
        slotProps={{
          root: { sx: { minWidth: '120px' } },
          indicator: { sx: { opacity: 0.5 } },
          button: { sx: { whiteSpace: 'inherit' } },
        }}
      >
        {resolutions.map((resolution) =>
          <Option key={'res-' + resolution} value={resolution}>
            {resolution === 'auto' ? 'Automatic' : resolution.replace('x', ' x ')}
          </Option>,
        )}
      </Select>
    </FormControl>

    {/* GPT-Image specific settings */}
    {isGI && <>
      <FormChipControl
        title='Quality'
        // color='primary'
        description={autoPicksParams ? 'Chosen per prompt' : 'Higher quality takes longer'}
        disabled={autoPicksParams}
        options={isGI25 ? CONF.QUALITY_GI25 : CONF.QUALITY_GI}
        value={dalleQualityGI} onChange={setDalleQualityGI}
      />

      <FormChipControl
        title='Background'
        // color='primary'
        description={
          autoPicksParams
            ? 'Chosen per prompt'
            : !showTransparencyWarning
              ? 'Transparency'
              : <Typography level='body-xs' color='warning'>
                Transparent background requires PNG or WebP format
              </Typography>
        }
        disabled={autoPicksParams}
        options={CONF.BACKGROUND_GI}
        value={dalleBackgroundGI} onChange={setDalleBackgroundGI}
      />

      {advanced.on && <FormChipControl
        title='File Format'
        // color='primary'
        description={autoPicksParams ? 'Chosen per prompt' : 'File format for the generated image'}
        disabled={autoPicksParams}
        options={CONF.OUT_FORMAT_GI}
        value={dalleOutputFormatGI} onChange={setDalleOutputFormatGI}
      />}

      {advanced.on && /*(dalleOutputFormatGI === 'webp' || dalleOutputFormatGI === 'jpeg') &&*/ (
        <FormControl disabled={!isGICompressible} orientation='horizontal' sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <FormLabelStart title='File Quality'
                          description={(isGICompressible && dalleOutputCompressionGI !== 100) ? `${100 - dalleOutputCompressionGI}% compression` : 'Uncompressed'} />
          <Slider
            aria-label='File Quality'
            color='neutral'
            disabled={dalleOutputFormatGI !== 'webp' && dalleOutputFormatGI !== 'jpeg'}
            value={!isGICompressible ? 0 : dalleOutputCompressionGI}
            onChange={handleCompressionChange}
            min={5}
            max={100}
            step={5}
            // valueLabelDisplay='auto'
            sx={{ width: '180px', mr: 1 }}
          />
        </FormControl>
      )}

      {advanced.on && !isGI25 && <FormChipControl
        title='Edit Fidelity'
        description='Detail kept when editing'
        tooltip='GPT Image 1 only. High keeps faces, products and fine detail stable across repeated edits. GPT Image 2.5 manages this itself, so the control is hidden there.'
        options={CONF.FIDELITY_GI}
        value={dalleInputFidelityGI} onChange={setDalleInputFidelityGI}
      />}

      {advanced.on && <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
        <FormLabelStart title='Moderation'
                        description='Content filter strictness'
          // description={dalleModerationGI === 'low' ? 'Less Restrictive' : 'Standard (default)'}
        />
        <Switch checked={dalleModerationGI === 'auto'} onChange={handleModerationGIChange}
                startDecorator={dalleModerationGI === 'low' ? 'Less Strict' : 'Standard'} />
      </FormControl>}

    </>}


    {isD3 && <>
      <FormRadioControl
        title='Style'
        description={(isD3 && dalleStyleD3 === 'vivid') ? 'Hyper-Real' : 'Realistic'}
        disabled={!isD3}
        options={CONF.STYLE_D3}
        value={isD3 ? dalleStyleD3 : 'natural'} onChange={setDalleStyleD3}
      />

      <FormControl orientation='horizontal' disabled={!isD3} sx={{ justifyContent: 'space-between' }}>
        <FormLabelStart title='Quality'
                        description={isD3HD ? 'Detailed' : 'Default'} />
        <Switch checked={isD3HD} onChange={handleDalleQualityD3Change}
                startDecorator={isD3HD ? 'HD' : 'Standard'} />
      </FormControl>
    </>}


    {advanced.on && (isD3 || isD2) && <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
      <FormLabelStart title='Better Prompt'
                      description={dalleNoRewrite ? 'No Rewrite' : 'Rewrite (default)'}
                      tooltip={<>
                        OpenAI improves the prompt by rewriting it by default.
                        This can be disabled to get more control over the prompt.
                        See <Link href='https://platform.openai.com/docs/guides/images-vision' target='_blank'>
                        This OpenAI document </Link>
                      </>}
      />
      <Switch checked={!dalleNoRewrite} onChange={handleDalleNoRewriteChange}
              startDecorator={dalleNoRewrite ? 'No' : 'Improve'} />
    </FormControl>}

    {advanced.on && <FormControl orientation='horizontal' sx={{ justifyContent: 'space-between' }}>
      <FormLabelStart title='Cost per Image'
                      tooltip={!isGI ? undefined : isGI25
                        ? 'Estimate only: OpenAI has not published the token counts for GPT Image 2.5. Input text and any reference images are charged on top.'
                        : 'OpenAI gpt-image-1 and similar models will also be charged for the input text tokens'}
        // description={<Link href='https://platform.openai.com/docs/pricing' target='_blank' noLinkStyle sx={{ textDecoration: 'none' }}>OpenAI Pricing </Link>}
      />
      <Typography>$ {costPerImage}</Typography>
    </FormControl>}


    <FormLabelStart title={advanced.on ? 'Hide Advanced' : 'Advanced'} onClick={advanced.toggle} />

  </>;
}
