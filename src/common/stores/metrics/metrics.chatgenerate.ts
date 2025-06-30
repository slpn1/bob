import { DPricingChatGenerate, getLlmCostForTokens, isModelPricingFree } from '~/common/stores/llms/llms.pricing';


// configuration
const METRICS_APPROXIMATE_DT_INNER_THRESHOLD = 200; // ms
const METRICS_APPROXIMATE_VT_TOKENS_THRESHOLD = 40; // tokens


/**
 * This is a stored type - IMPORTANT: do not break.
 * - stored by DMessage > DMessageGenerator
 */
export type DMetricsChatGenerate_Md =
  Omit<MetricsChatGenerateTokens, 'T'> &
  MetricsChatGenerateCost_Md &
  Pick<MetricsChatGenerateTime, 'dtAll' | 'dtStart' | 'vTOutInner'>; // 2025-02-27: added the inner velocity, which wasn't stored before

/**
 * In particular this is used 'as' AixWire_Particles.CGSelectMetrics
 */
export type DMetricsChatGenerate_Lg =
  MetricsChatGenerateTokens &
  MetricsChatGenerateTime &
  MetricsChatGenerateCost_Md;


type MetricsChatGenerateTokens = {
  // T = Tokens
  T?: number,
  TIn?: number,         // Portion of Input tokens which is new (not cached)
  TCacheRead?: number,
  TCacheWrite?: number,
  TOut?: number,
  TOutR?: number,       // Portion of TOut that was used for reasoning (e.g. not for output)
  // TOutA?: number,    // Portion of TOut that was used for Audio

  // If set, indicates unreliability or Stop Reason (sR)
  TsR?:
    | 'pending'         // still being generated (could be stuck in this state if data got corrupted)
    | 'aborted'         // aborted or failed (interrupted generation, out of tokens, connection error, etc)
}


type MetricsChatGenerateTime = {
  // dt = milliseconds
  dtStart?: number,
  dtInner?: number,
  dtAll?: number,

  // v = Tokens/s
  vTOutInner?: number,  // TOut / dtInner
  vTOutAll?: number,    // TOut / dtAll
}


export type MetricsChatGenerateCost_Md = {
  // $c = Cents of USD - NOTE: we chose to use cents to reduce floating point errors
  $c?: number,
  $cdCache?: number,
  $code?:
    | 'free'            // generated for free
    | 'partial-msg'     // partial message generated
    | 'partial-price'   // partial pricing available
    | 'no-pricing'      // model pricing not available
    | 'no-tokens'       // tokens are missing from the metrics
}


// ChatGenerate token metrics

export function metricsPendChatGenerateLg(metrics: DMetricsChatGenerate_Lg | undefined): void {
  if (metrics)
    metrics.TsR = 'pending';
}

export function metricsFinishChatGenerateLg(metrics: DMetricsChatGenerate_Lg | undefined, isAborted: boolean): void {
  if (!metrics) return;

  // remove the previous TsR if it was 'pending'
  delete metrics.TsR;
  if (isAborted)
    metrics.TsR = 'aborted';

  // sum up the Tokens
  if (!metrics.T)
    metrics.T = (metrics.TIn || 0) + (metrics.TOut || 0) + (metrics.TCacheRead || 0) + (metrics.TCacheWrite || 0);

  // calculate the Token velocities
  if (metrics.TOut !== undefined && metrics.dtAll !== undefined && metrics.dtAll > 0) {

    // inner time approximation (dtStart -> dtAll)
    if (!metrics.dtInner && metrics.dtStart !== undefined && metrics.dtStart > 0) {
      /**
       * Only use the approximate inner duration if it's greater than a threshold. this is to prevent
       * This is to prevent first -> last event timing (a poor substitute for the actual inner duration)
       * to be too short to be meaningful.
       */
      const dtInnerApprox = metrics.dtAll - metrics.dtStart;
      if (dtInnerApprox >= METRICS_APPROXIMATE_DT_INNER_THRESHOLD)
        metrics.dtInner = dtInnerApprox;
    }

    // inner velocity approximation (if not reported by the API, approximate to first -> last event)
    if (!metrics.vTOutInner && metrics.dtInner !== undefined && metrics.dtInner > 0) {

      // for OpenAI reasoning models, we needto remove the reasoning tokens from the total, as they were not counted
      const TOutReceived = metrics.TOut - (metrics.TOutR || 0);

      if (TOutReceived >= METRICS_APPROXIMATE_VT_TOKENS_THRESHOLD)
        metrics.vTOutInner = Math.round(100 * TOutReceived / (metrics.dtInner / 1000)) / 100;
    }

    // outer velocity (end-to-end)
    metrics.vTOutAll = Math.round(100 * metrics.TOut / (metrics.dtAll / 1000)) / 100;

  }
}


// ChatGenerate extraction for DMessage's smaller metrics

export function metricsChatGenerateLgToMd(metrics: DMetricsChatGenerate_Lg): DMetricsChatGenerate_Md {
  const allOptionalKeys: (keyof DMetricsChatGenerate_Md)[] = [
    '$c', '$cdCache', '$code', // select costs
    'TIn', 'TCacheRead', 'TCacheWrite', 'TOut', 'TOutR', // select token counts
    'dtAll', 'dtStart', 'vTOutInner', // select token timings/velocities
    'TsR', // stop reason
  ] as const;
  const extracted: DMetricsChatGenerate_Md = {};

  for (const key of allOptionalKeys) {

    // [OpenAI] we also ignore a TOutR of 0, as networks without reasoning return it. keeping it would be misleading as 'didn't reason but I could have', while it's 'can't reason'
    if (key === 'TOutR' && metrics.TOutR === 0)
      continue;

    // [OpenAI] we also ignore a TOutA of 0 (no audio in this output)
    // if (key === 'TOutA' && metrics.TOutA === 0)
    //   continue;

    if (metrics[key] !== undefined) {
      extracted[key] = metrics[key] as any;
    }
  }

  return extracted;
}


// ChatGenerate cost metrics

const USD_TO_CENTS = 100;

export function metricsComputeChatGenerateCostsMd(metrics?: Readonly<DMetricsChatGenerate_Md>, pricing?: DPricingChatGenerate | undefined, logLlmRefId?: string): MetricsChatGenerateCost_Md | undefined {
  console.log(`[Metrics Costs] Starting cost calculation for model ${logLlmRefId || 'unknown'}`);
  
  if (!metrics) {
    console.log('[Metrics Costs] No metrics provided, returning undefined');
    return undefined;
  }
  
  console.log('[Metrics Costs] Input metrics:', JSON.stringify(metrics));

  // metrics: token presence
  const inNewTokens = metrics.TIn || 0;
  const inCacheReadTokens = metrics.TCacheRead || 0;
  const inCacheWriteTokens = metrics.TCacheWrite || 0;
  const sumInputTokens = inNewTokens + inCacheReadTokens + inCacheWriteTokens;
  const outTokens = metrics.TOut || 0;
  
  console.log(`[Metrics Costs] Token counts: inNew=${inNewTokens}, inCacheRead=${inCacheReadTokens}, inCacheWrite=${inCacheWriteTokens}, sumInput=${sumInputTokens}, out=${outTokens}`);

  // usage: presence
  if (!sumInputTokens && !outTokens) {
    console.log('[Metrics Costs] No tokens found in metrics, returning "no-tokens" code');
    return { $code: 'no-tokens' };
  }

  // pricing: presence
  if (!pricing) {
    console.log('[Metrics Costs] No pricing data available, returning "no-pricing" code');
    return { $code: 'no-pricing' };
  }
  
  console.log('[Metrics Costs] Pricing data available:', pricing ? 'yes' : 'no');

  // pricing: bail if free
  if (isModelPricingFree(pricing)) {
    console.log('[Metrics Costs] Model has free pricing, returning "free" code');
    return { $code: 'free' };
  }

  // partial pricing
  const isPartialMessage = metrics.TsR === 'pending' || metrics.TsR === 'aborted';
  console.log(`[Metrics Costs] Is partial message: ${isPartialMessage}, TsR: ${metrics.TsR || 'undefined'}`);

  // Calculate costs
  const tierTokens = sumInputTokens;
  const $inNew = getLlmCostForTokens(tierTokens, inNewTokens, pricing.input);
  const $out = getLlmCostForTokens(tierTokens, outTokens, pricing.output);
  console.log(`[Metrics Costs] Calculated costs: inNew=$${$inNew}, out=$${$out}`);
  
  if ($inNew === undefined || $out === undefined) {
    console.log('[Metrics Costs] Missing price information, returning "partial-price" code');
    // many llms don't have pricing information, so the cost computation ends here
    return { $code: 'partial-price' };
  }

  // Standard price
  const $noCacheRounded = Math.round(($inNew + $out) * USD_TO_CENTS * 10000) / 10000;
  console.log(`[Metrics Costs] Standard price (no cache): $${$noCacheRounded}`);
  
  if (!inCacheReadTokens && !inCacheWriteTokens) {
    const result = { $c: $noCacheRounded, ...(isPartialMessage && { $code: 'partial-msg' }) };
    console.log(`[Metrics Costs] No cache used, returning result:`, JSON.stringify(result));
    return result;
  }

  // Price with Caching
  const cachePricing = pricing.cache;
  if (!cachePricing) {
    console.log(`[Metrics Costs] No cache pricing for ${logLlmRefId}, using standard price`);
    return { $c: $noCacheRounded, $code: 'partial-price' };
  }

  // 2025-01-10: Now supporting tiered cache pricing
  // Note: We use the total input tokens (new + cache) as the tier discriminator for ALL pricing tiers.
  // This matches how providers like Google structure their pricing - the tier is based on the request size
  // (input context), and that tier's rates apply to all token types in that request.

  // compute the input cache read costs
  const $cacheRead = getLlmCostForTokens(tierTokens, inCacheReadTokens, cachePricing.read);
  console.log(`[Metrics Costs] Cache read cost: $${$cacheRead}`);
  
  if ($cacheRead === undefined) {
    console.log(`[Metrics Costs] Missing cache read pricing for ${logLlmRefId}, using standard price`);
    return { $c: $noCacheRounded, $code: 'partial-price' };
  }

  // compute the input cache write costs
  let $cacheWrite;
  switch (cachePricing.cType) {
    case 'ant-bp':
      $cacheWrite = getLlmCostForTokens(tierTokens, inCacheWriteTokens, cachePricing.write);
      break;
    case 'oai-ac':
      $cacheWrite = 0;
      break;
    default:
      console.error(`[Metrics Costs] Unknown cache type: ${(cachePricing as any).cType}`);
      throw new Error('computeChatGenerationCosts: Unknown cache type');
  }
  console.log(`[Metrics Costs] Cache write cost: $${$cacheWrite}, cache type: ${cachePricing.cType}`);
  
  if ($cacheWrite === undefined) {
    console.log(`[Metrics Costs] Missing cache write pricing for ${logLlmRefId}, using standard price`);
    return { $c: $noCacheRounded, $code: 'partial-price' };
  }

  // compute the cost for this call
  const $c = Math.round(($inNew + $cacheRead + $cacheWrite + $out) * USD_TO_CENTS * 10000) / 10000;
  console.log(`[Metrics Costs] Total cost with cache: $${$c} (inNew=$${$inNew}, cacheRead=$${$cacheRead}, cacheWrite=$${$cacheWrite}, out=$${$out})`);

  // compute the advantage from caching
  const $inAsIfNoCache = getLlmCostForTokens(tierTokens, sumInputTokens, pricing.input)!;
  const $cdCache = Math.round(($inAsIfNoCache - $inNew - $cacheRead - $cacheWrite) * USD_TO_CENTS * 10000) / 10000;
  console.log(`[Metrics Costs] Cache savings: $${$cdCache} (would cost $${$inAsIfNoCache} without cache)`);

  // mark the costs as partial if the message was not completely received - i.e. the server did not tell us the final tokens count
  const result = {
    $c,
    $cdCache,
    ...(isPartialMessage && { $code: 'partial-msg' }),
  };
  console.log(`[Metrics Costs] Final result:`, JSON.stringify(result));
  return result;
}
