import type { AixParts_InlineImagePart } from '~/modules/aix/server/api/aix.wiretypes';
import { ItemAsyncWorker, ProcessingQueue } from '~/common/logic/ProcessingQueue';

import type { DesignerPrompt } from './create/PromptComposer';
import { t2iGenerateImageContentFragments } from '~/modules/t2i/t2i.client';


/**
 * Convert a File (image) to an AixParts_InlineImagePart (base64 inline image).
 */
async function fileToInlineImagePart(file: File): Promise<AixParts_InlineImagePart> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // dataUrl format: "data:<mimeType>;base64,<base64data>"
      const base64 = dataUrl.split(',')[1];
      if (!base64) return reject(new Error('Failed to read image file'));

      // Map to supported mime types (image/jpeg, image/png, image/webp)
      let mimeType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/png';
      if (file.type === 'image/jpeg' || file.type === 'image/jpg')
        mimeType = 'image/jpeg';
      else if (file.type === 'image/webp')
        mimeType = 'image/webp';
      else if (file.type === 'image/png')
        mimeType = 'image/png';
      // For other formats (gif, bmp, etc.) we default to png — the API will handle conversion if needed

      resolve({ pt: 'inline_image', mimeType, base64 });
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}


/**
 * This function needs to create a new image (saved as an DBlob asset) based on the inputs.
 */
const drawCreateWorker: ItemAsyncWorker<DesignerPrompt> = async (item, _update, signal) => {
  // Convert reference images to inline image parts
  const aixInlineImageParts: AixParts_InlineImagePart[] = [];
  if (item.referenceImages?.length) {
    for (const file of item.referenceImages) {
      try {
        aixInlineImageParts.push(await fileToInlineImagePart(file));
      } catch (error) {
        console.warn('[Draw] Failed to convert reference image:', error);
      }
    }
  }

  await t2iGenerateImageContentFragments(null, item.prompt, aixInlineImageParts, item._repeatCount, 'app-draw').catch(console.error);
  return item;
};

export class DrawCreateQueue extends ProcessingQueue<DesignerPrompt> {
  constructor() {
    super(4, 10, drawCreateWorker);
  }
}

/**
 * The single drawing queue for the draw app: keeps running background jobs until done or canceled
 */
export const drawCreateQueue = new DrawCreateQueue();
