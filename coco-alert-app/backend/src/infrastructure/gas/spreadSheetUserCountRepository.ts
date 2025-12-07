import { UserCountRepository } from '../../domain/repository/userCountRepository';

const SHEET_USER_COUNT = 'user_count';

function getSpreadSheetId(): string {
  const scriptProperties = PropertiesService.getScriptProperties();
  const value = scriptProperties.getProperty('SPREADSHEET_ID');
  if (!value) {
    throw new Error('スプレッドシートIDが設定されていません。');
  }
  return value;
}

export class SpreadSheetUserCountRepository implements UserCountRepository {
  private sheet: GoogleAppsScript.Spreadsheet.Sheet;

  constructor() {
    this.sheet =
      SpreadsheetApp.openById(getSpreadSheetId()).getSheetByName(
        SHEET_USER_COUNT
      )!;
  }

  increment(userName: string): number {
    const data: (string | number | boolean | Date)[][] = this.sheet
      .getDataRange()
      .getValues(); // 全データ取得

    for (let i = 1; i < data.length; i++) {
      // 1行目はヘッダ
      if (data[i][0] === userName) {
        // 見つかったらカウント +1
        const incrementCount: number = (data[i][1] as number) + 1;
        this.sheet.getRange(i + 1, 2).setValue(incrementCount);
        return incrementCount;
      }
    }

    // 見つからなければ最後に追記
    this.sheet.appendRow([userName, 1]);
    return 1;
  }
}
