import * as XLSX from 'xlsx';

/**
 * Utility to export JSON data to a real Excel (.xlsx) spreadsheet and trigger download.
 */
export function exportToExcel(data: Record<string, any>[], filename: string, sheetName = 'Sheet1'): void {
  if (!data || data.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, safeFilename);
}
