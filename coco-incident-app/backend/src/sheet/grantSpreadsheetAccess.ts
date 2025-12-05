import { getSpreadSheetId } from '../properties';

/**
 * スプレッドシートへのアクセス権限を付与
 */
export function grantSpreadsheetAccess(email: string): void {
  try {
    const spreadsheetId = getSpreadSheetId();

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    spreadsheet.addEditor(email);

    console.log(`${email} にスプレッドシート編集権限を付与しました。`);
  } catch (error) {
    console.error('grantSpreadsheetAccess error:', error);
    throw new Error(
      `スプレッドシート権限付与に失敗しました: ${(error as Error).message}`
    );
  }
}
