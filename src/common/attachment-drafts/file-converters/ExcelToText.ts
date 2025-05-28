import * as XLSX from 'xlsx';

/**
 * Converts an Excel file to plain text.
 * Each sheet is processed separately and formatted with the sheet name followed by its content.
 */
export async function convertExcelToText(input: ArrayBuffer): Promise<{ text: string }> {
  try {
    const workbook = XLSX.read(new Uint8Array(input), { type: 'array' });
    let result = '';
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      result += `Sheet: ${sheetName}\n`;
      result += XLSX.utils.sheet_to_csv(worksheet, { blankrows: false });
      result += '\n\n';
    }
    
    return { text: result };
  } catch (error) {
    console.error('Error converting Excel to text:', error);
    throw error;
  }
}

/**
 * Converts an Excel file to HTML tables.
 * Each sheet is processed separately and formatted with an h3 header followed by its content as an HTML table.
 */
export async function convertExcelToHTML(input: ArrayBuffer): Promise<{ html: string }> {
  try {
    const workbook = XLSX.read(new Uint8Array(input), { type: 'array' });
    let result = '';
    
    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      result += `<h3>Sheet: ${sheetName}</h3>`;
      result += XLSX.utils.sheet_to_html(worksheet, { 
        header: '<table class="excel-table" border="1" cellspacing="0" cellpadding="3">',
        footer: '</table>'
      });
      result += '<br/>';
    }
    
    return { html: result };
  } catch (error) {
    console.error('Error converting Excel to HTML:', error);
    throw error;
  }
} 