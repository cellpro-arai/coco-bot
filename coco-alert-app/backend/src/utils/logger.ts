import { getSpreadSheetId } from '../properties';

const LOG_SHEET_NAME = 'DebugLog';

/**
 * スプレッドシートにログを出力する
 */
export function logToSheet(message: string, data?: any): void {
  try {
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

    // 古いログを削除（1000行以上の場合）
    const lastRow = sheet.getLastRow();
    if (lastRow > 1000) {
      sheet.deleteRows(2, lastRow - 1000);
    }
  } catch (error) {
    console.error('logToSheet error:', error);
  }
}
