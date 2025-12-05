/**
 * ファイルをコピーして新しいファイルを作成
 */
export function copyFile(
  fileId: string,
  fileName: string,
  folder: GoogleAppsScript.Drive.Folder
): string {
  const templateFile = DriveApp.getFileById(fileId);

  const newFile = templateFile.makeCopy(fileName, folder);

  return newFile.getUrl();
}
