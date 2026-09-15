import type { AixParts_InlineImagePart } from '~/modules/aix/server/api/aix.wiretypes';

import { apiStream } from '~/common/util/trpc.client';

import type { OpenAIAccessSchema } from '../../llms/server/openai/openai.router';

import type { DModelsServiceId } from '~/common/stores/llms/llms.service.types';
import { findServiceAccessOrThrow } from '~/modules/llms/vendors/vendor.helpers';

import type { T2iCreateImageOutput } from '../t2i.server';
import {
  DalleBackgroundGI,
  DalleImageQuality,
  DalleImageQualityGI,
  DalleModelId,
  DalleOutputFormatGI,
  DalleSize,
  DalleSizeGI,
  isGptImage25Model,
  isGptImageModel,
  resolveDalleModelId,
  useDalleStore,
} from './store-module-dalle';


/**
 * Per-request parameter overrides, as chosen by the auto-settings director for this
 * particular prompt. Anything left undefined falls back to the user's stored settings.
 */
export interface T2IImageParamsOverride {
  size?: DalleSizeGI;
  quality?: DalleImageQualityGI;
  background?: DalleBackgroundGI;
  outputFormat?: DalleOutputFormatGI;
}


/**
 * Client function to call the OpenAI image generation API.
 */
export async function openAIGenerateImagesOrThrow(
  modelServiceId: DModelsServiceId,
  prompt: string,
  aixInlineImageParts: AixParts_InlineImagePart[],
  count: number,
  paramsOverride?: T2IImageParamsOverride,
): Promise<T2iCreateImageOutput[]> {

  // Use the current settings
  const {
    dalleModelId: dalleModelSelection,
    dalleNoRewrite,
    // -- GI
    dalleSizeGI,
    dalleQualityGI,
    dalleBackgroundGI,
    dalleOutputFormatGI,
    dalleOutputCompressionGI,
    dalleModerationGI,
    dalleInputFidelityGI,
    // -- D3
    dalleSizeD3,
    dalleQualityD3,
    dalleStyleD3,
    // -- D2
    dalleSizeD2,
  } = useDalleStore.getState();

  // editing = we were given input images to work from
  const isEdit = !!aixInlineImageParts?.length;

  // Resolve the actual model to use (null = latest; picks the editing-tuned model when editing)
  const dalleModelId = resolveDalleModelId(dalleModelSelection, isEdit);

  // This trick is explained on: https://platform.openai.com/docs/guides/images/usage?context=node
  if (dalleNoRewrite && !isGptImageModel(dalleModelId))
    prompt = 'I NEED to test how the tool works with extremely simple prompts. DO NOT add any detail, just use it AS-IS: ' + prompt;

  // Warn about a misconfiguration
  if (isEdit && !isGptImageModel(dalleModelId))
    throw new Error('Image transformation is not available with this model. Please use a GPT Image model instead.');

  // Resolve the GPT Image parameters: per-request overrides first, then the stored settings
  const isGI25 = isGptImage25Model(dalleModelId);
  const giSize = paramsOverride?.size ?? dalleSizeGI;
  const giBackground = paramsOverride?.background ?? dalleBackgroundGI;
  const giOutputFormat = paramsOverride?.outputFormat ?? dalleOutputFormatGI;
  // 'xhigh' and 'max' only exist on gpt-image-2.5 - clamp them for gpt-image-1
  const _giQuality = paramsOverride?.quality ?? dalleQualityGI;
  const giQuality: DalleImageQualityGI = (!isGI25 && (_giQuality === 'xhigh' || _giQuality === 'max')) ? 'high' : _giQuality;

  // The shared GPT Image request body (identical across the family)
  const giConfig = {
    prompt: prompt.slice(0, 32000 - 1), // GPT Image accepts much longer prompts
    size: giSize,
    quality: giQuality,
    background: giBackground,
    output_format: giOutputFormat,
    output_compression: dalleOutputCompressionGI,
    moderation: dalleModerationGI,
    // response_format: 'b64_json', unsupported, as it's the default
    // 'input_fidelity' is a gpt-image-1 edits parameter only - the 2.5 models reject it
    // outright ("does not support the 'input_fidelity' parameter") and manage input
    // fidelity themselves as part of their multi-turn consistency
    ...((isEdit && dalleModelId === 'gpt-image-1') ? { input_fidelity: dalleInputFidelityGI } : {}),
  };

  // Function to generate images in batches
  async function generateImagesBatch(imageCount: number): Promise<T2iCreateImageOutput[]> {

    // we use an async generator to stream heartbeat events while waiting for the images
    const operations = await apiStream.llmOpenAI.createImages.mutate({
      access: findServiceAccessOrThrow<{}, OpenAIAccessSchema>(modelServiceId).transportAccess,
      generationConfig: dalleModelId === 'gpt-image-2.5-flare' ? {
        model: 'gpt-image-2.5-flare',
        count: imageCount,
        ...giConfig,
      } : dalleModelId === 'gpt-image-2.5-sunburst' ? {
        model: 'gpt-image-2.5-sunburst',
        count: imageCount,
        ...giConfig,
      } : dalleModelId === 'gpt-image-1.5' ? {
        model: 'gpt-image-1.5',
        count: imageCount,
        ...giConfig,
        quality: giQuality as Exclude<DalleImageQualityGI, 'xhigh' | 'max'>,
      } : dalleModelId === 'gpt-image-1' ? {
        model: 'gpt-image-1',
        count: imageCount,
        ...giConfig,
        quality: giQuality as Exclude<DalleImageQualityGI, 'xhigh' | 'max'>,
      } : dalleModelId === 'dall-e-3' ? {
        model: 'dall-e-3',
        prompt: prompt.slice(0, 4000 - 1), // DALL-E 3 has a 4000 char limit
        count: imageCount,
        size: dalleSizeD3,
        quality: dalleQualityD3,
        style: dalleStyleD3,
        response_format: 'b64_json',
      } : {
        model: 'dall-e-2',
        prompt: prompt.slice(0, 1000 - 1), // DALL-E 2 has a 1000 char limit
        count: imageCount,
        quality: 'standard',
        size: dalleSizeD2,
        response_format: 'b64_json',
      },
      ...(aixInlineImageParts?.length && {
        editConfig: {
          inputImages: aixInlineImageParts,
          // maskImage: ...
        },
      }),
    });

    const createdImages: T2iCreateImageOutput[] = [];
    for await (const op of operations)
      if (op.p === 'createImage')
        createdImages.push(op.image);

    return createdImages;
  }


  // Calculate the number of batches required
  const isD3 = dalleModelId === 'dall-e-3';
  const maxBatchSize = isD3 ? 1 : 10; // DALL-E 3 only supports n=1, so we parallelize the requests instead

  // Operate in batches of maxBatchSize
  const batchPromises: Promise<T2iCreateImageOutput[]>[] = [];
  for (let i = 0; i < count; i += maxBatchSize) {
    const batchSize = Math.min(maxBatchSize, count - i);
    batchPromises.push(generateImagesBatch(batchSize));
  }

  // Run all image generation requests in parallel and handle all results
  const imageRefsBatchesResults = await Promise.allSettled(batchPromises);


  // Throw if ALL promises were rejected
  const allRejected = imageRefsBatchesResults.every(result => result.status === 'rejected');
  if (allRejected) {
    const errorMessages = imageRefsBatchesResults
      .map(result => {
        const reason = (result as PromiseRejectedResult).reason as any;
        return reason?.shape?.message || reason?.message || '';
      })
      .filter(message => !!message)
      .join(', ');

    throw new Error(`OpenAI image generation: ${errorMessages}`);
  }

  // Take successful results and return as a flat array
  return imageRefsBatchesResults
    .filter(result => result.status === 'fulfilled')
    .map(result => (result as PromiseFulfilledResult<T2iCreateImageOutput[]>).value) // Get the value
    .flat();
}


export function openAIImageModelsCurrentGeneratorName(forEditing: boolean = false) {
  const dalleModelSelection = useDalleStore.getState().dalleModelId;
  return openAIImageModelName(resolveDalleModelId(dalleModelSelection, forEditing));
}

export function openAIImageModelName(dalleModelId: DalleModelId) {
  switch (dalleModelId) {
    case 'gpt-image-2.5-flare':
      return 'GPT Image 2.5';
    case 'gpt-image-2.5-sunburst':
      return 'GPT Image 2.5';
    case 'gpt-image-1.5':
      return 'GPT Image 1.5';
    case 'gpt-image-1':
      return 'GPT Image';
    case 'dall-e-3':
      return 'DALL·E 3';
    case 'dall-e-2':
      return 'DALL·E 2';
    default:
      return 'OpenAI Image generator';
  }
}

function openAIImageModelsPrice(modelId: DalleModelId): undefined | { inputText: number, inputImage: number, outputImage: number } {
  if (isGptImage25Model(modelId))
    return { inputText: 5.00, inputImage: 8.0, outputImage: 30.0 };
  if (modelId === 'gpt-image-1.5' || modelId === 'gpt-image-1')
    return { inputText: 5.00, inputImage: 10.0, outputImage: 40.0 };
  return undefined;
}

/**
 * Output image tokens for the GPT Image quality/size grid.
 * https://platform.openai.com/docs/guides/image-generation?image-generation-model=gpt-image-1
 * NOTE: OpenAI has not published a token table for gpt-image-2.5 - we reuse the gpt-image-1
 *       grid as the closest proxy for the three shared tiers, hence the '~' on 2.5 estimates.
 */
function openAIImageOutputTokens(quality: DalleImageQuality, size: DalleSize): number {
  if (quality === 'high') {
    if (size === '1024x1024') return 4160;
    if (size === '1024x1536') return 6240;
    if (size === '1536x1024') return 6208;
  } else if (quality === 'medium') {
    if (size === '1024x1024') return 1056;
    if (size === '1024x1536') return 1584;
    if (size === '1536x1024') return 1568;
  } else if (quality === 'low') {
    if (size === '1024x1024') return 272;
    if (size === '1024x1536') return 408;
    if (size === '1536x1024') return 400;
  }
  return 0;
}

/**
 * Return the pricing for the OpenAI image generation API.
 * TODO: update this when the OpenAI pricing changes.
 */
export function openAIImageModelsPricing(modelId: DalleModelId, quality: DalleImageQuality, size: DalleSize): string {
  if (isGptImageModel(modelId)) {

    const price = openAIImageModelsPrice(modelId);
    if (!price?.outputImage) {
      console.warn('[DEV] No pricing found for', modelId, quality, size);
      return 'varies by tokens';
    }

    // 'auto' defers the decision to OpenAI, so we can't know the cost up front
    if (quality === 'auto' || size === 'auto')
      return 'varies';

    // 'xhigh' and 'max' spend more output tokens than 'high', but OpenAI hasn't published the counts
    if (quality === 'xhigh' || quality === 'max')
      return 'varies';

    const outTokens = openAIImageOutputTokens(quality, size);
    if (!outTokens) {
      console.log('[DEV] No token mapping for', modelId, quality, size);
      return 'varies by size';
    }

    const outputImageCost = price.outputImage * outTokens / 1_000_000;
    // gpt-image-2.5 reuses the gpt-image-1 token grid as a proxy, so flag it as approximate
    return (isGptImage25Model(modelId) ? '~' : '') + outputImageCost.toFixed(2) + ' +'; // e.g. 0.17 for high/square

  } else if (modelId === 'dall-e-3') {
    if (quality === 'hd') {
      if (size === '1024x1024') return '0.08';
      if (size === '1792x1024' || size === '1024x1792') return '0.12';
    } else if (quality === 'standard') {
      if (size === '1024x1024') return '0.04';
      if (size === '1792x1024' || size === '1024x1792') return '0.08';
    }
  } else if (modelId === 'dall-e-2') {
    if (size === '256x256') return '0.016';
    if (size === '512x512') return '0.018';
    if (size === '1024x1024') return '0.02';
  }
  return '?';
}
