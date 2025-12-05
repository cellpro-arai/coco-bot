import { FileData } from './types';

/**
 * ファイルをGoogle Driveにアップロード
 */
export function uploadFile(fileData: FileData, folderId: string): string {
  const folder = DriveApp.getFolderById(folderId);
  const decodedData = Utilities.base64Decode(fileData.data);
  const blob = Utilities.newBlob(decodedData, fileData.mimeType, fileData.name);
  const file = folder.createFile(blob);

  return file.getUrl();
}
