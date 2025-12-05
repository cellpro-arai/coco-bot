/**
 * GoogleスプレッドシートのURLからIDを抽出
 */
export function extractSheetIdFromUrl(url: string): string {
  const match = url.match(/\/d\/(.+?)\//);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error('URLからスプレッドシートIDを抽出できませんでした。');
}

/**
 * Google DriveのフォルダURLからIDを抽出
 */
export function extractFolderIdFromUrl(url: string): string {
  const match = url.match(/folders\/(.+)/);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error('URLからフォルダIDを抽出できませんでした。');
}
