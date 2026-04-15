import jsPDF from 'jspdf';


/**
 * Render a markdown-ish message to an A4 PDF with selectable text and
 * basic formatting (headings, lists, code blocks, bold/italic inline).
 * This keeps output small and searchable, at the cost of full markdown fidelity.
 */
export async function exportMessageToPdf(markdown: string, filename: string): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;

  const baseSize = 11;
  const lineGap = 4;

  let y = margin;

  const ensureSpace = (lineHeight: number) => {
    if (y + lineHeight > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  const writeWrapped = (text: string, opts: { size?: number; font?: 'helvetica' | 'courier'; style?: 'normal' | 'bold' | 'italic' | 'bolditalic'; indent?: number } = {}) => {
    const size = opts.size ?? baseSize;
    const font = opts.font ?? 'helvetica';
    const style = opts.style ?? 'normal';
    const indent = opts.indent ?? 0;
    pdf.setFont(font, style);
    pdf.setFontSize(size);
    const lineHeight = size + lineGap;
    const lines = pdf.splitTextToSize(text, contentWidth - indent);
    for (const line of lines) {
      ensureSpace(lineHeight);
      pdf.text(line, margin + indent, y);
      y += lineHeight;
    }
  };

  // Very small markdown handler: line-by-line, with fenced code blocks.
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  let inCode = false;
  let codeBuffer: string[] = [];

  const flushCode = () => {
    if (codeBuffer.length === 0) return;
    const block = codeBuffer.join('\n');
    writeWrapped(block, { font: 'courier', size: 9, indent: 8 });
    y += lineGap;
    codeBuffer = [];
  };

  while (i < lines.length) {
    const raw = lines[i];

    // Fenced code
    if (/^\s*```/.test(raw)) {
      if (inCode) { flushCode(); inCode = false; }
      else inCode = true;
      i++;
      continue;
    }
    if (inCode) { codeBuffer.push(raw); i++; continue; }

    // Blank line
    if (raw.trim() === '') { y += baseSize; i++; continue; }

    // Headings
    const h = raw.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const size = Math.max(baseSize + 2, 20 - level * 2);
      y += 4;
      writeWrapped(h[2], { size, style: 'bold' });
      y += 2;
      i++; continue;
    }

    // Lists (unordered / ordered)
    const ul = raw.match(/^\s*[-*]\s+(.*)$/);
    const ol = raw.match(/^\s*(\d+)\.\s+(.*)$/);
    if (ul) {
      writeWrapped('• ' + stripInline(ul[1]), { indent: 12 });
      i++; continue;
    }
    if (ol) {
      writeWrapped(`${ol[1]}. ` + stripInline(ol[2]), { indent: 12 });
      i++; continue;
    }

    // Paragraph with inline bold/italic stripped (rendered as plain for now)
    writeWrapped(stripInline(raw));
    i++;
  }
  if (inCode) flushCode();

  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}


// Remove inline markdown markers so text reads cleanly. Keeps content, drops syntax.
function stripInline(s: string): string {
  return s
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}


export function sanitizePdfFilename(input: string, fallback = 'message'): string {
  const cleaned = (input || '').trim().replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').slice(0, 80);
  return cleaned || fallback;
}
