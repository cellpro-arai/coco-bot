import {
  EXPENSE_MANAGEMENT_SHEET_NAME,
  EXPENSE_SHEET_HEADERS,
} from './expenseManagementTypes';

export function getHeaderColumnPositions(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): Map<string, number> {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) {
    return new Map();
  }

  const headerRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const positions = new Map<string, number>();

  EXPENSE_SHEET_HEADERS.forEach(header => {
    const index = headerRow.indexOf(header);
    if (index !== -1) {
      positions.set(header, index + 1);
    }
  });

  return positions;
}

export function addMissingHeaders(
  sheet: GoogleAppsScript.Spreadsheet.Sheet,
  positions: Map<string, number>
): Map<string, number> {
  let nextColumn = sheet.getLastColumn() + 1;

  EXPENSE_SHEET_HEADERS.forEach(header => {
    if (!positions.has(header)) {
      sheet.getRange(1, nextColumn).setValue(header);
      positions.set(header, nextColumn);
      nextColumn++;
    }
  });

  return positions;
}

export function ensureExpenseSheetHeader(
  sheet: GoogleAppsScript.Spreadsheet.Sheet
): void {
  const headers = EXPENSE_SHEET_HEADERS;

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const positions = getHeaderColumnPositions(sheet);

  if (positions.size < headers.length) {
    addMissingHeaders(sheet, positions);
  }
}

export function getOrCreateExpenseManagementSheet(
  ss: GoogleAppsScript.Spreadsheet.Spreadsheet
): GoogleAppsScript.Spreadsheet.Sheet {
  let sheet = ss.getSheetByName(EXPENSE_MANAGEMENT_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(EXPENSE_MANAGEMENT_SHEET_NAME);
  }

  ensureExpenseSheetHeader(sheet);
  return sheet;
}
