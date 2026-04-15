import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';

import { sanitizePdfFilename } from './exportMessageToPdf';


/**
 * Render a markdown-ish message to a .docx file with headings, lists,
 * code blocks, and inline bold/italic/code formatting preserved.
 */
export async function exportMessageToDocx(markdown: string, filename: string): Promise<void> {
  const children: Paragraph[] = [];

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  let inCode = false;
  let codeBuffer: string[] = [];

  const flushCode = () => {
    if (codeBuffer.length === 0) return;
    for (const line of codeBuffer) {
      children.push(new Paragraph({
        children: [new TextRun({ text: line || ' ', font: 'Courier New', size: 20 })],
      }));
    }
    codeBuffer = [];
  };

  while (i < lines.length) {
    const raw = lines[i];

    if (/^\s*```/.test(raw)) {
      if (inCode) { flushCode(); inCode = false; }
      else inCode = true;
      i++;
      continue;
    }
    if (inCode) { codeBuffer.push(raw); i++; continue; }

    if (raw.trim() === '') {
      children.push(new Paragraph({ children: [new TextRun('')] }));
      i++; continue;
    }

    const h = raw.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const headingLevel = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6,
      ][level - 1];
      children.push(new Paragraph({ heading: headingLevel, children: renderInline(h[2]) }));
      i++; continue;
    }

    const ul = raw.match(/^\s*[-*]\s+(.*)$/);
    if (ul) {
      children.push(new Paragraph({ bullet: { level: 0 }, children: renderInline(ul[1]) }));
      i++; continue;
    }
    const ol = raw.match(/^\s*(\d+)\.\s+(.*)$/);
    if (ol) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `${ol[1]}. ` }), ...renderInline(ol[2])],
      }));
      i++; continue;
    }

    const bq = raw.match(/^\s*>\s?(.*)$/);
    if (bq) {
      children.push(new Paragraph({
        alignment: AlignmentType.LEFT,
        indent: { left: 360 },
        children: renderInline(bq[1]),
      }));
      i++; continue;
    }

    children.push(new Paragraph({ children: renderInline(raw) }));
    i++;
  }
  if (inCode) flushCode();

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`);
}


// Tokenize inline markdown into styled TextRuns (bold, italic, inline code, links).
function renderInline(text: string): TextRun[] {
  const tokens: TextRun[] = [];
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) tokens.push(new TextRun(text.slice(lastIndex, match.index)));
    const t = match[0];
    if (t.startsWith('**') || t.startsWith('__')) tokens.push(new TextRun({ text: t.slice(2, -2), bold: true }));
    else if (t.startsWith('*') || t.startsWith('_')) tokens.push(new TextRun({ text: t.slice(1, -1), italics: true }));
    else if (t.startsWith('`')) tokens.push(new TextRun({ text: t.slice(1, -1), font: 'Courier New' }));
    else {
      const link = t.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (link) tokens.push(new TextRun({ text: link[1], style: 'Hyperlink' }));
    }
    lastIndex = match.index + t.length;
  }
  if (lastIndex < text.length) tokens.push(new TextRun(text.slice(lastIndex)));
  return tokens.length ? tokens : [new TextRun(text)];
}


function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}


export { sanitizePdfFilename as sanitizeDocxFilename };
