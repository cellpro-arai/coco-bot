import { LogRepository } from '../../domain/repository/logRepository';
import { getSpreadSheetId } from '../../properties';

const SHEET_LOG_NAME = 'log';

export class SpreadSheetLogRepository implements LogRepository {
  private sheet: GoogleAppsScript.Spreadsheet.Sheet;

  constructor() {
    this.sheet = SpreadsheetApp.openById(getSpreadSheetId()).getSheetByName(
      SHEET_LOG_NAME
    )!;
  }

  isDuplicate(clientMsgId: string): boolean {
    const data: (string | number | boolean | Date)[][] = this.sheet
      .getDataRange()
      .getValues();

    // client_msg_id が同じものがあればスキップ
    for (let i = 0; i < data.length; i++) {
      if (data[i][4] === clientMsgId) {
        // 5列目(client_msg_id)
        return true;
      }
    }
    return false;
  }

  save(values: (string | number | Date)[]): void {
    this.sheet.appendRow(values);
  }
}
