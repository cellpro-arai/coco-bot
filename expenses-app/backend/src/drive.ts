import { FileData, FolderPropertyKey } from './types/type';
import { getFolderDescription, getScriptProperty } from './utils';

// 指定フォルダ直下にサブフォルダを作成または取得
export function getOrCreateChildFolder(
  parent: GoogleAppsScript.Drive.Folder,
  name: string
): GoogleAppsScript.Drive.Folder {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(name);
}

// メールのローカル部をフォルダ名に使える形式にサニタイズ
export function getEmailLocalPart(userEmail: string): string {
  if (!userEmail) {
    return 'unknown-user';
  }

  const [localPart] = userEmail.split('@');
  return (localPart || 'unknown-user').replace(/[\\/:*?"<>|]/g, '_');
}

// ユーザ毎のファイル格納フォルダを取得（rootFolder > yyyy > mm > emailの階層）
export function getTargetFolder(
  folderPropertyKey: FolderPropertyKey,
  userEmail: string,
  date: Date
): GoogleAppsScript.Drive.Folder {
  const folderDescription = getFolderDescription(folderPropertyKey);
  const rootFolderId = getScriptProperty(
    folderPropertyKey,
    `${folderDescription}のIDが設定されていません。`
  );
  const rootFolder = DriveApp.getFolderById(rootFolderId);
  const yearFolder = getOrCreateChildFolder(
    rootFolder,
    String(date.getFullYear())
  );
  const monthFolder = getOrCreateChildFolder(
    yearFolder,
    String(date.getMonth() + 1).padStart(2, '0')
  );
  return getOrCreateChildFolder(monthFolder, getEmailLocalPart(userEmail));
}

/**
 * ユーザフォルダのURLを取得する
 *
 * 指定されたルートフォルダ配下のyyyy/mm/emailフォルダのURLを返します。
 * フォルダが存在しない場合は作成されます。
 *
 * @param {FolderPropertyKey} folderPropertyKey - ルートフォルダのプロパティキー
 * @param {string} userEmail - ユーザーのメールアドレス
 * @param {Date} date - 対象の年月を含む日付
 * @returns {string} ユーザフォルダのURL
 */
export function getUserFolderUrl(
  folderPropertyKey: FolderPropertyKey,
  userEmail: string,
  date: Date
): string {
  const targetFolder = getTargetFolder(folderPropertyKey, userEmail, date);
  return targetFolder.getUrl();
}

// 作業表ファイルを階層フォルダにアップロード
export function uploadWorkScheduleFiles(
  files: FileData[],
  userEmail: string,
  date: Date
): string[] {
  if (!files || files.length === 0) {
    return [];
  }

  const targetFolder = getTargetFolder(
    'WORK_SCHEDULE_FOLDER_ID',
    userEmail,
    date
  );
  const targetFolderId = targetFolder.getId();

  return files.map(file => uploadFileToFolderById(file, targetFolderId));
}

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
