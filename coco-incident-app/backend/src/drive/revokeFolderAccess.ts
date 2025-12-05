import { getUploadFolderId } from '../properties';

/**
 * ドライブフォルダのアクセス権限を剥奪
 */
export function revokeFolderAccess(email: string): void {
  try {
    const uploadFolderId = getUploadFolderId();

    const folder = DriveApp.getFolderById(uploadFolderId);
    folder.removeEditor(email);

    console.log(`${email} のドライブフォルダ編集権限を剥奪しました。`);
  } catch (error) {
    console.error('revokeFolderAccess error:', error);
    throw new Error(
      `ドライブ権限剥奪に失敗しました: ${(error as Error).message}`
    );
  }
}
