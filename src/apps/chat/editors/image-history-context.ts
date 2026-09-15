import type { DMessage } from '~/common/stores/chat/chat.message';
import type { ImageDirectorCandidate, ImageDirectorTurn } from '~/modules/t2i/imageDirector';
import { DMessageFragment, isContentOrAttachmentFragment, isImageRefPart, isTextContentFragment, isZyncAssetImageReferencePart } from '~/common/stores/chat/chat.fragments';
import { truncateDirectorTurns } from '~/modules/t2i/imageDirector';


// configuration
const MAX_CANDIDATE_IMAGES = 8;   // how many images of the conversation to offer the director to choose from
const MAX_SCAN_MESSAGES = 24;     // how far back to walk - conversations can be long


export interface ImageConversationContext {
  turns: ImageDirectorTurn[];
  candidates: ImageDirectorCandidate[];
  fragmentByHandle: Map<string, DMessageFragment>;
}


function _isImageFragment(fragment: DMessageFragment): boolean {
  return isContentOrAttachmentFragment(fragment)
    && (isZyncAssetImageReferencePart(fragment.part) || isImageRefPart(fragment.part));
}

/** Best available human-readable description of an image fragment */
function _imageLabel(fragment: DMessageFragment): string {
  // attachments carry the filename/caption the user saw
  if (fragment.ft === 'attachment' && fragment.title)
    return fragment.title;

  const part = (fragment as any).part;
  const label: string | undefined =
    part?.zRefSummary?.text            // zync asset reference summary
    || part?._legacyImageRefPart?.altText
    || part?.altText;                  // legacy image_ref part

  if (!label) return 'image';
  return label.length > 160 ? label.slice(0, 160) + '…' : label;
}

/** Flatten a message's text fragments into a single line */
function _messageText(message: DMessage): string {
  return message.fragments
    .filter(isTextContentFragment)
    .map(f => f.part.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}


/**
 * Walk back through the conversation to collect what a follow-up image request may need:
 * the recent text turns, and every image already in the conversation - both the ones we
 * generated and the ones the user uploaded - as candidates the director can choose from.
 *
 * The last message is assumed to be the request being answered (turnsAgo 0).
 */
export function collectImageConversationContext(history: Readonly<DMessage[]>): ImageConversationContext {

  const turns: ImageDirectorTurn[] = [];
  const candidates: ImageDirectorCandidate[] = [];
  const fragmentByHandle = new Map<string, DMessageFragment>();

  const scanned = history.slice(-MAX_SCAN_MESSAGES);
  const lastIndex = scanned.length - 1;

  // newest first, so that the cap keeps the most recent images
  for (let i = lastIndex; i >= 0; i--) {
    const message = scanned[i];
    if (message.role === 'system') continue;

    const turnsAgo = lastIndex - i;

    for (const fragment of message.fragments) {
      if (!_isImageFragment(fragment)) continue;
      if (candidates.length >= MAX_CANDIDATE_IMAGES) break;

      const handle = `img${candidates.length + 1}`;
      candidates.push({
        handle,
        // anything on an assistant message we produced; anything on a user message they brought
        origin: message.role === 'assistant' ? 'generated' : 'uploaded',
        label: _imageLabel(fragment),
        turnsAgo,
      });
      fragmentByHandle.set(handle, fragment);
    }
  }

  // oldest first, for readability in the director prompt
  for (const message of scanned) {
    if (message.role === 'system') continue;
    const text = _messageText(message);
    if (text)
      turns.push({ role: message.role === 'assistant' ? 'assistant' : 'user', text });
  }

  return { turns: truncateDirectorTurns(turns), candidates, fragmentByHandle };
}
