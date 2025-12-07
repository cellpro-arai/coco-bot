import { getSpreadSheetId } from '../../properties';

const SHEET_STRICT_MESSAGES = 'strict_messages';
const SHEET_USER_COUNT = 'user_count';

export interface SpreadSheetRepository {
  getStrictMessage(count: number): string;
  incrementUserCount(userName: string): number;
}

export class SpreadSheetRepositoryImpl implements SpreadSheetRepository {
  private strictMessagesSheet: GoogleAppsScript.Spreadsheet.Sheet;
  private userCountSheet: GoogleAppsScript.Spreadsheet.Sheet;

  constructor() {
    const spreadsheet = SpreadsheetApp.openById(getSpreadSheetId());
    this.strictMessagesSheet = spreadsheet.getSheetByName(
      SHEET_STRICT_MESSAGES
    )!;
    this.userCountSheet = spreadsheet.getSheetByName(SHEET_USER_COUNT)!;
  }

  getStrictMessage(count: number): string {
    const lastRow: number = this.strictMessagesSheet.getLastRow();
    // count % lastRow が 0 になった場合は最後の行を使う
    const row: number = count % lastRow || lastRow;
    const result: string = this.strictMessagesSheet
      .getRange(row, 1)
      .getValue() as string;
    return result;
  }

  incrementUserCount(userName: string): number {
    const data: (string | number | boolean | Date)[][] = this.userCountSheet
      .getDataRange()
      .getValues(); // 全データ取得

    for (let i = 1; i < data.length; i++) {
      // 1行目はヘッダ
      if (data[i][0] === userName) {
        // 見つかったらカウント +1
        const incrementCount: number = (data[i][1] as number) + 1;
        this.userCountSheet.getRange(i + 1, 2).setValue(incrementCount);
        return incrementCount;
      }
    }

    // 見つからなければ最後に追記
    this.userCountSheet.appendRow([userName, 1]);
    return 1;
  }
}
