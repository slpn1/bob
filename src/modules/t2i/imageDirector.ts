import { aixChatGenerateText_Simple } from '~/modules/aix/client/aix.client';

import { getDomainModelIdOrThrow } from '~/common/stores/llms/store-llms';

import type { T2IImageParamsOverride } from './dalle/openaiGenerateImages';
import type { DalleBackgroundGI, DalleImageQualityGI, DalleOutputFormatGI, DalleSizeGI } from './dalle/store-module-dalle';


// configuration
const MAX_REFERENCE_IMAGES = 4;   // cap - each input image costs tokens and dilutes the model's attention
const MAX_CONTEXT_TURNS = 8;      // how far back to summarise the conversation for the director
const MAX_TURN_CHARS = 400;       // per-turn text budget


/** One image already present in the conversation, offered to the director as a possible reference */
export interface ImageDirectorCandidate {
  /** short opaque handle the director refers to, e.g. 'img1' */
  handle: string;
  /** whether we made it, or the user brought it */
  origin: 'generated' | 'uploaded';
  /** the prompt that made it, or the attachment's filename/caption */
  label: string;
  /** 0 = the message being answered, 1 = the turn before it, ... */
  turnsAgo: number;
}

/** A single conversation turn, flattened to text for the director's benefit */
export interface ImageDirectorTurn {
  role: 'user' | 'assistant';
  text: string;
}

export interface ImageDirectorResult {
  /** a self-contained prompt, with conversational references resolved */
  prompt: string;
  /** handles of the candidate images to send as edit references, in the order given */
  referenceHandles: string[];
  /** per-request parameter overrides, or {} to keep the user's settings */
  params: T2IImageParamsOverride;
  /** whether the director thought this was a refinement of an existing image */
  isEdit: boolean;
}


const directorSystemPrompt = `You are the image-generation director for a chat assistant. Given a user's image request and the conversation it sits in, you decide exactly how to call an image generation API.

You must reply with a single JSON object and nothing else - no prose, no markdown fences.

{
  "action": "generate" | "edit",
  "prompt": "a self-contained image prompt",
  "referenceImages": ["handle", ...],
  "size": "auto" | "1024x1024" | "1536x1024" | "1024x1536",
  "quality": "auto" | "low" | "medium" | "high" | "xhigh" | "max",
  "background": "auto" | "transparent" | "opaque",
  "outputFormat": "png" | "jpeg" | "webp"
}

ACTION and REFERENCE IMAGES
- Use "edit" when the request modifies, refines, combines or restyles an image that already exists in the conversation ("make the back panel black", "same but wider", "make this look more like that one", "remove the logo"). Otherwise use "generate".
- For "edit", list the handles of the images the request actually depends on, most important first. Include the image being changed. Include earlier uploads only when they are still needed, for example as a style or likeness reference.
- List at most ${MAX_REFERENCE_IMAGES} handles. For "generate", use an empty list.
- Never invent a handle. Only use handles from the AVAILABLE IMAGES list.

PROMPT
- Rewrite the request so it stands alone, resolving pronouns and references from the conversation. "Make the back panel black" becomes "Change the back panel of the server rack from blue to matte black, keeping everything else identical."
- The API cannot see your handles and cannot be told "the first image" or "image A". When several references are sent, distinguish them by what they depict: "match the colour grade of the sunset landscape photo", not "match image 2".
- For edits, state explicitly what must stay unchanged. Preserving the rest of the image is the usual intent.
- Do not pad a simple request with invented detail. Keep the user's own specifics exactly.

SIZE - infer the aspect ratio from what is being asked for
- 1536x1024 (landscape): banners, headers, slide backgrounds, hero images, wide scenes, screenshots, landscape photography.
- 1024x1536 (portrait): posters, flyers, book and magazine covers, phone wallpapers, full-body figures, portrait photography.
- 1024x1024 (square): icons, logos, avatars, product shots, social posts, diagrams.
- auto: when the request gives you no signal at all.
- For an edit, keep the source image's aspect ratio unless the user asks to change it.

QUALITY
- "high" is the sensible default.
- "max" or "xhigh" only when the user asks for print, large format, or exceptional detail.
- "low" for explicit drafts, thumbnails, or quick tests.
- "auto" when you genuinely cannot tell.

BACKGROUND and FORMAT
- "transparent" with outputFormat "png" for logos, icons, stickers, cutouts, or anything described as having no background.
- Otherwise "auto", and outputFormat "webp" unless the user asks for a specific file type.`;


function _buildDirectorUserMessage(request: string, turns: ImageDirectorTurn[], candidates: ImageDirectorCandidate[]): string {
  const parts: string[] = [];

  if (turns.length) {
    parts.push('CONVERSATION (oldest first):');
    for (const turn of turns)
      parts.push(`${turn.role === 'user' ? 'User' : 'Assistant'}: ${turn.text}`);
    parts.push('');
  }

  if (candidates.length) {
    parts.push('AVAILABLE IMAGES (newest first):');
    for (const c of candidates)
      parts.push(`- ${c.handle}: ${c.origin === 'generated' ? 'generated earlier' : 'uploaded by the user'}, ${c.turnsAgo === 0 ? 'in the current message' : `${c.turnsAgo} turn(s) ago`} - ${c.label}`);
    parts.push('');
  } else {
    parts.push('AVAILABLE IMAGES: none');
    parts.push('');
  }

  parts.push('IMAGE REQUEST:');
  parts.push(request);

  return parts.join('\n');
}


// allowlists - anything the model invents outside these is dropped rather than trusted
const _SIZES: DalleSizeGI[] = ['auto', '1024x1024', '1536x1024', '1024x1536'];
const _QUALITIES: DalleImageQualityGI[] = ['auto', 'low', 'medium', 'high', 'xhigh', 'max'];
const _BACKGROUNDS: DalleBackgroundGI[] = ['auto', 'transparent', 'opaque'];
const _FORMATS: DalleOutputFormatGI[] = ['png', 'jpeg', 'webp'];

function _pick<T extends string>(value: unknown, allowed: T[]): T | undefined {
  return (typeof value === 'string' && allowed.includes(value as T)) ? value as T : undefined;
}

/** Tolerant JSON extraction - models still wrap JSON in fences now and then */
function _parseJsonObject(text: string): Record<string, unknown> | null {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    const parsed = JSON.parse(t.slice(start, end + 1));
    return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}


/**
 * Heuristic used when the director is unavailable or fails: if there is a recent image in the
 * conversation and the request reads like a modification, treat it as an edit of that image.
 */
function _fallbackResult(request: string, candidates: ImageDirectorCandidate[]): ImageDirectorResult {
  // images attached to the current message are an explicit, unambiguous signal
  const attachedNow = candidates.filter(c => c.turnsAgo === 0);
  if (attachedNow.length)
    return { prompt: request, referenceHandles: attachedNow.slice(0, MAX_REFERENCE_IMAGES).map(c => c.handle), params: {}, isEdit: true };

  // otherwise look for language that only makes sense as a refinement
  const looksLikeEdit = /\b(that|this|it|the) (image|picture|photo|one|design|version)\b|\b(instead|rather than|change|adjust|tweak|edit|make the|same but|but with|remove the|replace the|swap|recolou?r|crop|zoom)\b/i.test(request);
  const mostRecentGenerated = candidates.find(c => c.origin === 'generated');
  if (looksLikeEdit && mostRecentGenerated)
    return { prompt: request, referenceHandles: [mostRecentGenerated.handle], params: {}, isEdit: true };

  return { prompt: request, referenceHandles: [], params: {}, isEdit: false };
}


/**
 * Ask a fast model to turn a conversational image request into a concrete API call:
 * which reference images to send, and which generation parameters suit this prompt.
 *
 * Never throws - falls back to a keyword heuristic so a director failure can't block drawing.
 */
export async function directImageRequest(
  request: string,
  turns: ImageDirectorTurn[],
  candidates: ImageDirectorCandidate[],
  options: { autoSettings: boolean, contextRef: string },
): Promise<ImageDirectorResult> {

  const fallback = _fallbackResult(request, candidates);

  // nothing to decide: no references available and no parameters to choose
  if (!options.autoSettings && !candidates.length)
    return fallback;

  try {
    const llmId = getDomainModelIdOrThrow(['fastUtil'], false, false, 'image-director');

    const responseText = await aixChatGenerateText_Simple(
      llmId,
      directorSystemPrompt,
      _buildDirectorUserMessage(request, turns, candidates),
      'draw-expand-prompt', options.contextRef,
    );

    const json = _parseJsonObject(responseText);
    if (!json) {
      console.log('[DEV] imageDirector: unparseable response', { responseText });
      return fallback;
    }

    // prompt: only accept a non-trivial rewrite, else keep the user's words
    const prompt = (typeof json.prompt === 'string' && json.prompt.trim().length > 2) ? json.prompt.trim() : request;

    // references: keep only known handles, deduped, capped
    const knownHandles = new Set(candidates.map(c => c.handle));
    const referenceHandles = Array.isArray(json.referenceImages)
      ? Array.from(new Set(json.referenceImages.filter((h): h is string => typeof h === 'string' && knownHandles.has(h)))).slice(0, MAX_REFERENCE_IMAGES)
      : [];

    // an 'edit' with no usable reference is just a generation
    const isEdit = json.action === 'edit' && referenceHandles.length > 0;

    // parameters: only applied when auto-settings is on, otherwise the user's settings win
    const params: T2IImageParamsOverride = !options.autoSettings ? {} : {
      ...(_pick(json.size, _SIZES) ? { size: _pick(json.size, _SIZES) } : {}),
      ...(_pick(json.quality, _QUALITIES) ? { quality: _pick(json.quality, _QUALITIES) } : {}),
      ...(_pick(json.background, _BACKGROUNDS) ? { background: _pick(json.background, _BACKGROUNDS) } : {}),
      ...(_pick(json.outputFormat, _FORMATS) ? { outputFormat: _pick(json.outputFormat, _FORMATS) } : {}),
    };

    // transparency only survives in png/webp - honour the intent over the format
    if (params.background === 'transparent' && params.outputFormat === 'jpeg')
      params.outputFormat = 'png';

    return { prompt, referenceHandles, params, isEdit };

  } catch (error: any) {
    console.log('[DEV] imageDirector: failed, using heuristic', { error });
    return fallback;
  }
}


/** Flatten recent history into short turns for the director's context window */
export function truncateDirectorTurns(turns: ImageDirectorTurn[]): ImageDirectorTurn[] {
  return turns
    .slice(-MAX_CONTEXT_TURNS)
    .map(({ role, text }) => ({
      role,
      text: text.length > MAX_TURN_CHARS ? text.slice(0, MAX_TURN_CHARS) + '…' : text,
    }))
    .filter(t => !!t.text.trim());
}

export { MAX_REFERENCE_IMAGES };
