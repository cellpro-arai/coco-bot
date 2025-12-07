import { FileData, FolderPropertyKey } from './types/type';
import { getFolderDescription, getScriptProperty } from './utils';

/**
 * 親フォルダ配下に指定名のサブフォルダを取得または新規作成する。
 * @param parent - サブフォルダをぶら下げる親フォルダ。
 * @param name - 作成・取得したいサブフォルダ名。
 * @returns 取得または作成したサブフォルダインスタンス。
 */
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

/**
 * メールアドレスのローカル部をフォルダ名に利用できる文字列へサニタイズする。
 * @param userEmail - 対象ユーザーのメールアドレス。
 * @returns フォルダ名として安全なローカル部文字列。
 */
export function getEmailLocalPart(userEmail: string): string {
  if (!userEmail) {
    return 'unknown-user';
  }

  const [localPart] = userEmail.split('@');
  return (localPart || 'unknown-user').replace(/[\\/:*?"<>|]/g, '_');
}

/**
 * root/{yyyy}/{mm}/{email} 階層のユーザーフォルダを取得または作成する。
 * @param folderPropertyKey - ルートフォルダIDを示すスクリプトプロパティキー。
 * @param userEmail - ユーザーのメールアドレス。
 * @param date - 年月の判定に使う日付。
 * @returns 対象ユーザーの月別フォルダ。
 */
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

/**
 * 勤務表ファイル群をユーザーの勤務表フォルダにアップロードする。
 * @param files - アップロード対象のファイル一覧。
 * @param userEmail - ユーザーのメールアドレス。
 * @param date - フォルダ階層を決定する提出月。
 * @returns 各ファイルのアップロード結果URL（空配列可）。
 */
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

/**
 * 指定フォルダ（プロパティキー指定）に単一ファイルをアップロードする。
 * @param fileData - アップロードするファイルデータ。
 * @param folderPropertyKey - ルートフォルダを示すスクリプトプロパティキー。
 * @returns 作成されたファイルのURL。
 */
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

/**
 * フォルダID指定でファイルをアップロードする。
 * @param fileData - アップロードファイル。
 * @param folderId - 保存先Google DriveフォルダID。
 * @returns 作成されたファイルのURL。
 */
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

/**
 * 生成したスプレッドシートを指定フォルダへ移動する。
 * @param spreadsheet - 対象スプレッドシート。
 * @param folderPropertyKey - 既定フォルダのプロパティキー。
 * @param targetFolderId - 任意で直接渡す移動先フォルダID。
 */
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

const BACKUP_FOLDER_PREFIX = 'backup_';

/**
 * ユーザーフォルダ内の既存ファイルをバックアップする
 *
 * 対象ユーザーの勤務表/経費精算フォルダから、現在の提出より前に更新された
 * ファイル・フォルダを backup_yyyyMMdd_HHmmss フォルダへ退避します。
 * エラー発生時は例外を投げ、submit 全体を失敗させます。
 *
 * @param {string} userEmail - 対象ユーザーのメールアドレス
 * @param {Date} submissionMonth - 提出月（ユーザーフォルダを決定するため）
 * @param {Date} [submissionStartedAt] - 今回の提出処理開始日時（この時刻以降に更新されたものは新規提出分として残す）
 */
export function backupUserDriveData(
  userEmail: string,
  submissionMonth: Date,
  submissionStartedAt?: Date
): void {
  // バックアップフォルダを一意にするため JST 秒精度でフォルダ名を生成
  const timestamp = Utilities.formatDate(
    new Date(),
    'Asia/Tokyo',
    'yyyyMMdd_HHmmss'
  );
  // 今回の submit 開始以降に触ったファイル（新規提出分）は対象外にする
  const cutoff = submissionStartedAt ?? new Date();

  try {
    backupWorkScheduleFolder(userEmail, submissionMonth, timestamp, cutoff);
    backupExpenseReportFolder(userEmail, submissionMonth, timestamp, cutoff);
  } catch (error) {
    const message = `ファイルバックアップ中にエラーが発生しました: ${(error as Error).message}`;
    Logger.log(message);
    throw new Error(message);
  }
}

/**
 * 勤務表フォルダ直下の既存ファイル/フォルダをバックアップフォルダへ移動する
 */
function backupWorkScheduleFolder(
  userEmail: string,
  submissionMonth: Date,
  timestamp: string,
  cutoff: Date
): void {
  const userFolder = getTargetFolder(
    'WORK_SCHEDULE_FOLDER_ID',
    userEmail,
    submissionMonth
  );

  const filesToMove = collectFilesBefore(userFolder, cutoff);
  const foldersToMove = collectFoldersBefore(userFolder, cutoff);

  if (filesToMove.length === 0 && foldersToMove.length === 0) {
    return;
  }

  const backupFolder = createBackupFolder(userFolder, timestamp);
  moveFiles(filesToMove, userFolder, backupFolder);
  moveFolders(foldersToMove, userFolder, backupFolder);
}

/**
 * 経費精算書フォルダ配下のファイル/フォルダをバックアップフォルダへ移す
 */
function backupExpenseReportFolder(
  userEmail: string,
  submissionMonth: Date,
  timestamp: string,
  cutoff: Date
): void {
  const userFolder = getTargetFolder(
    'EXPENSE_REPORT_FOLDER_ID',
    userEmail,
    submissionMonth
  );

  const filesToMove = collectFilesBefore(userFolder, cutoff);
  const foldersToMove = collectFoldersBefore(userFolder, cutoff);

  if (filesToMove.length === 0 && foldersToMove.length === 0) {
    return;
  }

  const backupFolder = createBackupFolder(userFolder, timestamp);
  moveFiles(filesToMove, userFolder, backupFolder);
  moveFolders(foldersToMove, userFolder, backupFolder);
}

/**
 * 指定フォルダ内で cutoff より前に更新されたファイルを列挙する
 */
function collectFilesBefore(
  folder: GoogleAppsScript.Drive.Folder,
  cutoff: Date
): GoogleAppsScript.Drive.File[] {
  const iterator = folder.getFiles();
  const results: GoogleAppsScript.Drive.File[] = [];
  while (iterator.hasNext()) {
    const file = iterator.next();
    const lastUpdated = file.getLastUpdated();
    if (lastUpdated && lastUpdated.getTime() >= cutoff.getTime()) {
      continue;
    }
    results.push(file);
  }
  return results;
}

/**
 * 指定フォルダ内で cutoff より前に作成されたサブフォルダを列挙する
 */
function collectFoldersBefore(
  folder: GoogleAppsScript.Drive.Folder,
  cutoff: Date
): GoogleAppsScript.Drive.Folder[] {
  const iterator = folder.getFolders();
  const results: GoogleAppsScript.Drive.Folder[] = [];

  while (iterator.hasNext()) {
    const child = iterator.next();
    if (isBackupFolder(child)) {
      continue;
    }
    const createdAt = child.getDateCreated();
    if (createdAt && createdAt.getTime() >= cutoff.getTime()) {
      continue;
    }
    results.push(child);
  }

  return results;
}

/**
 * ファイルを移動先へ add/remove で移し替える
 */
function moveFiles(
  files: GoogleAppsScript.Drive.File[],
  source: GoogleAppsScript.Drive.Folder,
  destination: GoogleAppsScript.Drive.Folder
): void {
  files.forEach(file => {
    destination.addFile(file);
    source.removeFile(file);
  });
}

/**
 * サブフォルダを移動先へ add/remove で移し替える
 */
function moveFolders(
  folders: GoogleAppsScript.Drive.Folder[],
  source: GoogleAppsScript.Drive.Folder,
  destination: GoogleAppsScript.Drive.Folder
): void {
  folders.forEach(folder => {
    destination.addFolder(folder);
    source.removeFolder(folder);
  });
}

/**
 * backup_ 接頭辞付きフォルダを作成する
 */
function createBackupFolder(
  parent: GoogleAppsScript.Drive.Folder,
  timestamp: string
): GoogleAppsScript.Drive.Folder {
  return parent.createFolder(`${BACKUP_FOLDER_PREFIX}${timestamp}`);
}

/**
 * バックアップフォルダかどうかをフォルダ名で判定する
 */
function isBackupFolder(folder: GoogleAppsScript.Drive.Folder): boolean {
  return folder.getName().startsWith(BACKUP_FOLDER_PREFIX);
}
