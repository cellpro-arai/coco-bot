import { getUploadFolderId } from '../properties';

/**
 * ドライブフォルダへのアクセス権限を付与
 */
export function grantFolderAccess(email: string): void {
  try {
    const uploadFolderId = getUploadFolderId();

    const folder = DriveApp.getFolderById(uploadFolderId);
    folder.addEditor(email);

    console.log(`${email} にドライブフォルダ編集権限を付与しました。`);
  } catch (error) {
    console.error('grantFolderAccess error:', error);
    throw new Error(
      `ドライブ権限付与に失敗しました: ${(error as Error).message}`
    );
  }
}
