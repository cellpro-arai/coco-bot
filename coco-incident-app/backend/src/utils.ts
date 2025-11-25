/**
 * スクリプトプロパティを取得する共通関数
 */
function getScriptProperty(propertyName: string, errorMessage: string): string {
  const scriptProperties = PropertiesService.getScriptProperties();
  const value = scriptProperties.getProperty(propertyName);

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}

/**
 * GoogleスプレッドシートのURLからIDを抽出
 */
function extractSheetIdFromUrl(url: string): string {
  const match = url.match(/\/d\/(.+?)\//);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error("URLからスプレッドシートIDを抽出できませんでした。");
}

/**
 * Google DriveのフォルダURLからIDを抽出
 */
function extractFolderIdFromUrl(url: string): string {
  const match = url.match(/folders\/(.+)/);
  if (match && match[1]) {
    return match[1];
  }
  throw new Error("URLからフォルダIDを抽出できませんでした。");
}
