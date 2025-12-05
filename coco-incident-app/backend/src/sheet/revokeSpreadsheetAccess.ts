import { getSpreadSheetId } from '../properties';

/**
 * スプレッドシートのアクセス権限を剥奪
 */
export function revokeSpreadsheetAccess(email: string): void {
  try {
    const spreadsheetId = getSpreadSheetId();

    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    spreadsheet.removeEditor(email);

    console.log(`${email} のスプレッドシート編集権限を剥奪しました。`);
  } catch (error) {
    console.error('revokeSpreadsheetAccess error:', error);
    throw new Error(
      `スプレッドシート権限剥奪に失敗しました: ${(error as Error).message}`
    );
  }
}
