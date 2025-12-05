import { getPermissionsCsvFileId } from '../properties';

/**
 * CSVファイルのアクセス権限を剥奪
 */
export function revokeCSVAccess(email: string): void {
  try {
    const csvFileId = getPermissionsCsvFileId();

    const file = DriveApp.getFileById(csvFileId);
    file.removeEditor(email);
    file.removeViewer(email);

    console.log(`${email} のCSVファイルアクセス権限を剥奪しました。`);
  } catch (error) {
    console.error('revokeCSVAccess error:', error);
    throw new Error(`CSV権限剥奪に失敗しました: ${(error as Error).message}`);
  }
}
