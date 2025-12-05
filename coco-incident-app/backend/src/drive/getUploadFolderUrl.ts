import { getUploadFolderId } from '../properties';

/**
 * アップロード先フォルダのURLを取得
 */
export function getUploadFolderUrl(): string {
  try {
    const folderId = getUploadFolderId();
    const folder = DriveApp.getFolderById(folderId);
    return folder.getUrl();
  } catch (error) {
    throw new Error(
      `アップロード先フォルダのURLを取得できませんでした: ${(error as Error).message}`
    );
  }
}
