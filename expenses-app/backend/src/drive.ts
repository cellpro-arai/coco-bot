import { FileData, FolderPropertyKey } from './types/type';
import { getFolderDescription, getScriptProperty } from './utils';

// ファイルをGoogle Driveの指定フォルダにアップロード
export function uploadFileToDrive(
  fileData: FileData,
  folderPropertyKey: FolderPropertyKey
): string {
  const folderDescription = getFolderDescription(folderPropertyKey);
  const folderId = getScriptProperty(
    folderPropertyKey,
    `${folderDescription}のIDが設定されていません。`
  );

  try {
    const folder = DriveApp.getFolderById(folderId);
    const decodedData = Utilities.base64Decode(fileData.data);
    const blob = Utilities.newBlob(
      decodedData,
      fileData.mimeType,
      fileData.name
    );
    const file = folder.createFile(blob);
    return file.getUrl();
  } catch (error) {
    throw new Error(`${folderDescription}へのアップロードに失敗しました。`);
  }
}

// フォルダIDを直接指定してファイルをアップロード
export function uploadFileToFolderById(
  fileData: FileData,
  folderId: string
): string {
  try {
    const folder = DriveApp.getFolderById(folderId);
    const decodedData = Utilities.base64Decode(fileData.data);
    const blob = Utilities.newBlob(
      decodedData,
      fileData.mimeType,
      fileData.name
    );
    const file = folder.createFile(blob);
    return file.getUrl();
  } catch (error) {
    throw new Error(
      `フォルダへのアップロードに失敗しました: ${(error as Error).message}`
    );
  }
}

// スプレッドシートを指定のフォルダへ移動する
export function addSpreadsheetToFolder(
  spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet,
  folderPropertyKey: FolderPropertyKey,
  targetFolderId?: string
): void {
  const folderDescription = getFolderDescription(folderPropertyKey);
  const folderId =
    targetFolderId ??
    getScriptProperty(
      folderPropertyKey,
      `${folderDescription}のフォルダIDが設定されていません。`
    );

  try {
    const fileId = spreadsheet.getId();

    Logger.log(`対象ファイル: ${spreadsheet.getName()}`);
    Logger.log(`移動先フォルダID: ${folderId}`);

    // ファイルを取得、移動先フォルダを取得
    const file = DriveApp.getFileById(fileId);
    const targetFolder = DriveApp.getFolderById(folderId);

    // ルートフォルダからファイルを削除
    const parents = file.getParents();
    while (parents.hasNext()) {
      const parent = parents.next();
      Logger.log(`旧フォルダから削除: ${parent.getName()}`);
      parent.removeFile(file);
    }

    // 新しいフォルダに追加
    targetFolder.addFile(file);

    Logger.log(
      `✔ ${folderDescription}への移動に成功: ${spreadsheet.getName()}`
    );
  } catch (error) {
    const message = `${folderDescription}への移動に失敗しました: ${(error as Error).message}`;
    Logger.log(message);
    throw new Error(message);
  }
}
