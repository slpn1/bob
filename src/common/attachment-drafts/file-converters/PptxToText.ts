import JSZip from 'jszip';

// Skip images smaller than 10KB — these are typically spacers, icons, or decorative elements
const MIN_IMAGE_SIZE_BYTES = 10 * 1024;


interface PptxSlide {
  slideNumber: number;
  textContent: string;
  notes?: string;
}

interface PptxImage {
  mimeType: string;
  data: Blob;
  name: string;
  slideNumber?: number;
}


/**
 * Extracts text content from all slides in a PPTX file.
 * Each slide is formatted with a heading and its text content.
 */
export async function convertPptxToText(input: ArrayBuffer): Promise<{ text: string }> {
  const slides = await extractSlides(input);
  if (!slides.length)
    return { text: '[No text content found in presentation]' };

  let result = '';
  for (const slide of slides) {
    result += `## Slide ${slide.slideNumber}\n\n`;
    result += slide.textContent || '[No text content]';
    result += '\n';
    if (slide.notes) {
      result += `\n> Speaker Notes: ${slide.notes}\n`;
    }
    result += '\n';
  }

  return { text: result.trim() };
}


/**
 * Extracts text content from all slides in a PPTX file, formatted as HTML.
 */
export async function convertPptxToHTML(input: ArrayBuffer): Promise<{ html: string }> {
  const slides = await extractSlides(input);
  if (!slides.length)
    return { html: '<p><em>No text content found in presentation</em></p>' };

  let result = '';
  for (const slide of slides) {
    result += `<h2>Slide ${slide.slideNumber}</h2>`;
    if (slide.textContent) {
      const paragraphs = slide.textContent.split('\n').filter(line => line.trim());
      for (const para of paragraphs)
        result += `<p>${escapeHtml(para)}</p>`;
    } else {
      result += '<p><em>No text content</em></p>';
    }
    if (slide.notes) {
      result += `<blockquote><strong>Speaker Notes:</strong> ${escapeHtml(slide.notes)}</blockquote>`;
    }
  }

  return { html: result };
}


/**
 * Extracts images embedded in a PPTX file from ppt/media/.
 * Returns Blob objects for each image found.
 */
export async function extractPptxImages(input: ArrayBuffer): Promise<PptxImage[]> {
  const zip = await JSZip.loadAsync(input);
  const images: PptxImage[] = [];

  // Build a mapping from slide relationships to media files
  const slideMediaMap = await buildSlideMediaMap(zip);

  // Extract all images from ppt/media/
  const allMediaFiles = Object.keys(zip.files).filter(name =>
    name.startsWith('ppt/media/') && !zip.files[name].dir,
  );
  console.log('[PPTX] All media files in archive:', allMediaFiles);

  for (const mediaPath of allMediaFiles) {
    const mimeType = guessMimeFromExtension(mediaPath);
    if (!mimeType) {
      console.log(`[PPTX] SKIP (unsupported format): ${mediaPath}`);
      continue;
    }

    // JSZip returns Blobs with empty MIME type by default, so we extract
    // as ArrayBuffer and create a properly typed Blob
    const arrayBuffer = await zip.files[mediaPath].async('arraybuffer');
    console.log(`[PPTX] ${mediaPath}: mime=${mimeType}, size=${arrayBuffer.byteLength} bytes`);

    // Skip tiny images — likely spacers, decorative elements, or blank placeholders
    if (arrayBuffer.byteLength < MIN_IMAGE_SIZE_BYTES) {
      console.log(`[PPTX] SKIP (too small, < ${MIN_IMAGE_SIZE_BYTES}): ${mediaPath}`);
      continue;
    }

    const data = new Blob([arrayBuffer], { type: mimeType });
    console.log(`[PPTX] Created Blob: type="${data.type}", size=${data.size}`);

    // Validate the image can actually be loaded by the browser
    const validation = await validateImageBlob(data);
    if (!validation.valid) {
      console.log(`[PPTX] SKIP (validation failed: ${validation.reason}): ${mediaPath}`);
      continue;
    }
    console.log(`[PPTX] PASS: ${mediaPath} — ${validation.width}x${validation.height}`);

    const fileName = mediaPath.split('/').pop() || mediaPath;

    // Find which slide this image belongs to
    const slideNumber = slideMediaMap.get(mediaPath);

    images.push({
      mimeType,
      data,
      name: fileName,
      slideNumber,
    });
  }

  console.log(`[PPTX] Extracted ${images.length} images from ${allMediaFiles.length} media files`);

  // Sort by slide number (images without a slide go last)
  images.sort((a, b) => (a.slideNumber ?? 999) - (b.slideNumber ?? 999));

  return images;
}


// Internals

async function extractSlides(input: ArrayBuffer): Promise<PptxSlide[]> {
  const zip = await JSZip.loadAsync(input);

  // Find all slide files and sort numerically
  const slideFiles = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide(\d+)\.xml$/.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
      const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
      return numA - numB;
    });

  const slides: PptxSlide[] = [];

  for (const slidePath of slideFiles) {
    const slideNumber = parseInt(slidePath.match(/slide(\d+)/)?.[1] || '0');
    const xmlString = await zip.files[slidePath].async('text');
    const textContent = extractTextFromSlideXml(xmlString);

    // Try to find corresponding notes
    const notesPath = `ppt/notesSlides/notesSlide${slideNumber}.xml`;
    let notes: string | undefined;
    if (zip.files[notesPath]) {
      const notesXml = await zip.files[notesPath].async('text');
      notes = extractTextFromSlideXml(notesXml) || undefined;
    }

    slides.push({ slideNumber, textContent, notes });
  }

  return slides;
}


/**
 * Parse slide XML and extract all text from <a:t> elements,
 * grouped by <a:p> paragraph elements.
 */
function extractTextFromSlideXml(xmlString: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  // Find all shape text bodies - works across namespaces
  const paragraphs: string[] = [];

  // Get all elements and find those with local name 'p' in the drawingml namespace
  const allElements = doc.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    const el = allElements[i];
    if (el.localName === 'p' && el.namespaceURI === 'http://schemas.openxmlformats.org/drawingml/2006/main') {
      const texts: string[] = [];
      // Get all <a:t> text elements within this paragraph
      const textElements = el.getElementsByTagName('*');
      for (let j = 0; j < textElements.length; j++) {
        if (textElements[j].localName === 't' && textElements[j].namespaceURI === 'http://schemas.openxmlformats.org/drawingml/2006/main') {
          const text = textElements[j].textContent;
          if (text)
            texts.push(text);
        }
      }
      if (texts.length > 0)
        paragraphs.push(texts.join(''));
    }
  }

  return paragraphs.join('\n');
}


/**
 * Build a map from media file paths to the slide number that references them.
 */
async function buildSlideMediaMap(zip: JSZip): Promise<Map<string, number>> {
  const mediaMap = new Map<string, number>();

  const relFiles = Object.keys(zip.files).filter(name =>
    /^ppt\/slides\/_rels\/slide(\d+)\.xml\.rels$/.test(name),
  );

  for (const relPath of relFiles) {
    const slideNumber = parseInt(relPath.match(/slide(\d+)/)?.[1] || '0');
    const relXml = await zip.files[relPath].async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(relXml, 'application/xml');
    const relationships = doc.getElementsByTagName('Relationship');

    for (let i = 0; i < relationships.length; i++) {
      const target = relationships[i].getAttribute('Target');
      if (target) {
        // Targets are relative like ../media/image1.png
        const normalizedPath = 'ppt/' + target.replace(/^\.\.\//, '').replace(/^\//, '');
        if (normalizedPath.startsWith('ppt/media/'))
          mediaMap.set(normalizedPath, slideNumber);
      }
    }
  }

  return mediaMap;
}


function guessMimeFromExtension(path: string): string | null {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    // Skip formats that are not reliably renderable in browsers
    case 'bmp': case 'tiff': case 'tif': case 'svg':
    case 'emf': case 'wmf':
    default: return null;
  }
}


/**
 * Validate that a Blob is a loadable image and has meaningful dimensions.
 * Filters out corrupt files, misnamed non-images, and tiny decorative graphics.
 */
function validateImageBlob(blob: Blob): Promise<{ valid: boolean; reason?: string; width?: number; height?: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < 50 || img.height < 50)
        resolve({ valid: false, reason: `too small: ${img.width}x${img.height}`, width: img.width, height: img.height });
      else
        resolve({ valid: true, width: img.width, height: img.height });
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      resolve({ valid: false, reason: `browser failed to load image: ${err}` });
    };
    img.src = url;
  });
}


function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
