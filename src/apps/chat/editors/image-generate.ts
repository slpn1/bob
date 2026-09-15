import { getActiveTextToImageProviderOrThrow, t2iGenerateImageContentFragments } from '~/modules/t2i/t2i.client';
import { directImageRequest, type ImageDirectorCandidate } from '~/modules/t2i/imageDirector';
import { isGptImageModel, resolveDalleModelId, useDalleStore } from '~/modules/t2i/dalle/store-module-dalle';

import type { AixParts_InlineImagePart } from '~/modules/aix/server/api/aix.wiretypes';
import { aixConvertImageRefToInlineImageOrThrow, aixConvertZyncImageAssetRefToInlineImageOrThrow } from '~/modules/aix/client/aix.client.chatGenerateRequest';

import type { ConversationHandler } from '~/common/chat-overlay/ConversationHandler';
import type { Immutable } from '~/common/types/immutable.types';
import type { TextToImageProvider } from '~/common/components/useCapabilities';
import { DMessageFragment, createErrorContentFragment, createPlaceholderVoidFragment, isContentOrAttachmentFragment, isImageRefPart, isZyncAssetImageReferencePartWithLegacyDBlob } from '~/common/stores/chat/chat.fragments';

import type { ImageConversationContext } from './image-history-context';


// NOTE: also see src/common/stores/chat/chat.gc.ts, which has cleanup code for images create here


/** Dereference image fragments into inline base64 images, ready for the edits endpoint */
async function _fragmentsToInlineImages(fragments: Immutable<DMessageFragment[]>): Promise<AixParts_InlineImagePart[]> {
  const inlineImageParts: AixParts_InlineImagePart[] = [];

  for (const fragment of fragments) {
    if (!isContentOrAttachmentFragment(fragment)) continue;

    const part = fragment.part;
    const isZyncImageReference = isZyncAssetImageReferencePartWithLegacyDBlob(part);
    const isLegacyImageRef = isImageRefPart(part);

    if (!isZyncImageReference && !isLegacyImageRef) {
      console.log('[DEV] Invalid image fragment', { fragment });
      continue;
    }

    // dereference and ready for transmission - do not resize any input
    try {
      let aixImageInlinePart: AixParts_InlineImagePart | undefined;
      if (isZyncImageReference)
        aixImageInlinePart = await aixConvertZyncImageAssetRefToInlineImageOrThrow(part, false);
      else if (isLegacyImageRef)
        aixImageInlinePart = await aixConvertImageRefToInlineImageOrThrow(part, false);

      if (!aixImageInlinePart) {
        console.log('[DEV] Invalid image fragment', { fragment });
        continue;
      }
      inlineImageParts.push(aixImageInlinePart);
    } catch (error: any) {
      console.log('[DEV] Error converting image fragment', { fragment, error });
    }
  }

  return inlineImageParts;
}


/** One short line naming the references we're about to use, so the pick isn't invisible */
function _referencesNote(labels: string[]): string {
  if (!labels.length) return '';
  const shortened = labels.map(l => l.length > 60 ? l.slice(0, 60) + '…' : l);
  return `\n\nUsing ${labels.length === 1 ? 'this image' : `these ${labels.length} images`} from our conversation: ${shortened.map(l => `"${l}"`).join(', ')}.`;
}


/**
 * Text to image, appended as an 'assistant' message
 *
 * @param imageFragments images attached to the request itself - always used
 * @param conversationContext prior images and turns, from which references may be chosen automatically
 * @param contextRef an id to group the director's sub-call under, for telemetry
 */
export async function runImageGenerationUpdatingState(
  cHandler: ConversationHandler,
  imageText: string,
  imageFragments?: Immutable<DMessageFragment[]>,
  conversationContext?: ImageConversationContext,
  contextRef: string = 'chat-draw',
) {
  if (!imageText) {
    cHandler.messageAppendAssistantText('Issue: no image description provided.', 'issue');
    return false;
  }

  // Acquire the active TextToImageProvider
  let t2iProvider: TextToImageProvider | undefined = undefined;
  try {
    t2iProvider = getActiveTextToImageProviderOrThrow();
  } catch (error: any) {
    cHandler.messageAppendAssistantText(`[Issue] Sorry, I can't generate images right now. ${error?.message || error?.toString() || 'Unknown error'}.`, 'issue');
    return 'err-t2i-unconfigured';
  }

  // if the imageText ends with " xN" or " [N]" (where N is a number), then we'll generate N images
  const match = imageText.match(/\sx(\d+)$|\s\[(\d+)]$/);
  const repeat = match ? parseInt(match[1] || match[2], 10) : 1;
  if (repeat > 1)
    imageText = imageText.replace(/x(\d+)$|\[(\d+)]$/, '').trim(); // Remove the "xN" or "[N]" part from the imageText

  const { dalleAutoSettings, dalleUseConversationContext, dalleModelId } = useDalleStore.getState();

  // only GPT Image models can take image inputs - don't pull in references we can't send,
  // or an explicit DALL-E selection would turn every follow-up into an error
  const mayUseReferences = t2iProvider.vendor === 'openai'
    && isGptImageModel(resolveDalleModelId(dalleModelId, true));

  // images explicitly attached to this request are always used, regardless of what the director decides
  const attachedFragments = (imageFragments || []).filter(f =>
    isContentOrAttachmentFragment(f) && (isZyncAssetImageReferencePartWithLegacyDBlob(f.part) || isImageRefPart(f.part)),
  );

  // candidates the director may additionally pull in from earlier in the conversation
  const historyCandidates: ImageDirectorCandidate[] = (mayUseReferences && dalleUseConversationContext && conversationContext)
    ? conversationContext.candidates.filter(c => c.turnsAgo > 0)
    : [];

  // show the placeholder before directing, so the wait isn't silent
  const patience = t2iProvider.vendor === 'openai' ? 'a minute' : 'a few seconds';
  const _placeholderText = (editing: boolean) => editing
    ? `Give me ${patience} while I work on that image with ${t2iProvider!.painter}...`
    : `Give me ${patience} while I draw ${imageText?.length > 20 ? 'that' : '"' + imageText + '"'} with ${t2iProvider!.painter}...`;

  const { assistantMessageId, placeholderFragmentId } = cHandler.messageAppendAssistantPlaceholder(
    _placeholderText(attachedFragments.length > 0),
    { generator: { mgt: 'named', name: t2iProvider.painter } },
  );
  let currentPlaceholderId = placeholderFragmentId;

  // Direct the request: resolve conversational references, pick reference images and parameters
  const direction = await directImageRequest(
    imageText,
    conversationContext?.turns || [],
    historyCandidates,
    { autoSettings: dalleAutoSettings, contextRef },
  );

  // resolve the director's chosen handles back to fragments
  const chosenHistoryFragments: DMessageFragment[] = [];
  const chosenLabels: string[] = [];
  if (conversationContext) {
    for (const handle of direction.referenceHandles) {
      const fragment = conversationContext.fragmentByHandle.get(handle);
      if (!fragment) continue;
      chosenHistoryFragments.push(fragment);
      chosenLabels.push(historyCandidates.find(c => c.handle === handle)?.label || 'image');
    }
  }

  // attached images first - they're the most explicit statement of intent
  const referenceFragments = [...attachedFragments, ...chosenHistoryFragments];
  const isEditing = referenceFragments.length > 0;

  // say which earlier images we pulled in, so the automatic pick isn't invisible
  if (chosenLabels.length || isEditing !== (attachedFragments.length > 0)) {
    const updated = createPlaceholderVoidFragment(_placeholderText(isEditing) + _referencesNote(chosenLabels));
    cHandler.messageFragmentReplace(assistantMessageId, currentPlaceholderId, updated, false);
    currentPlaceholderId = updated.fId;
  }

  try {
    // edit-generation: ready the images payload
    const aixInlineImageParts = await _fragmentsToInlineImages(referenceFragments);

    const imageContentFragments = await t2iGenerateImageContentFragments(
      t2iProvider,
      direction.prompt,
      aixInlineImageParts,
      repeat,
      'app-chat',
      direction.params,
    );

    // add the image content fragments to the message
    for (const imageContentFragment of imageContentFragments)
      cHandler.messageFragmentAppend(assistantMessageId, imageContentFragment, false, false);

    cHandler.messageFragmentDelete(assistantMessageId, currentPlaceholderId, true, true);

    return true;
  } catch (error: any) {

    const drawError = `Issue encountered while creating your image.\n${error?.message || error?.toString() || 'Unknown error'}.`;
    cHandler.messageFragmentReplace(assistantMessageId, currentPlaceholderId, createErrorContentFragment(drawError), true);

    return false;
  }
}
