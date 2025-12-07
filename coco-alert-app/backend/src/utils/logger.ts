import { getSpreadSheetId } from '../properties';

const LOG_SHEET_NAME = 'DebugLog';

/**
 * スプレッドシートにログを出力する
 */
export function logToSheet(message: string, data?: any): void {
  const spreadsheetId = getSpreadSheetId();
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);

  let sheet = spreadsheet.getSheetByName(LOG_SHEET_NAME);

  // ログシートが存在しない場合は作成
  if (!sheet) {
    sheet = spreadsheet.insertSheet(LOG_SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Message', 'Data']);
  }

  const timestamp = new Date().toISOString();
  const dataStr = data ? JSON.stringify(data) : '';

  sheet.appendRow([timestamp, message, dataStr]);

  // 古いログを削除（50行以上の場合）
  const lastRow = sheet.getLastRow();
  if (lastRow > 50) {
    sheet.deleteRows(2, lastRow - 50);
  }
}
