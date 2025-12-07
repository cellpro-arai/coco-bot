import { StrictMessageRepository } from '../../domain/repository/strictMessageRepository';
import { getSpreadSheetId } from '../../properties';

const SHEET_STRICT_MESSAGES = 'strict_messages';

export class SpreadSheetStrictMessageRepository implements StrictMessageRepository {
  private sheet: GoogleAppsScript.Spreadsheet.Sheet;

  constructor() {
    this.sheet = SpreadsheetApp.openById(getSpreadSheetId()).getSheetByName(
      SHEET_STRICT_MESSAGES
    )!;
  }

  get(count: number): string {
    const lastRow: number = this.sheet.getLastRow();
    // count % lastRow が 0 になった場合は最後の行を使う
    const row: number = count % lastRow || lastRow;
    const result: string = this.sheet.getRange(row, 1).getValue() as string;
    return result;
  }
}
